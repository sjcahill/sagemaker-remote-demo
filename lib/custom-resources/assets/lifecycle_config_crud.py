import boto3
import logging
import os
import time
import sys

from datetime import datetime

logging.basicConfig(stream=sys.stdout, format="%(asctime)s %(levelname)s: %(message)s", level=logging.INFO)
logger = logging.getLogger(__name__)

session = boto3.Session()
sm_client = session.client("sagemaker")
sts_client = session.client("sts")

account_id = sts_client.get_caller_identity()["Account"]


def get_domain_ids():
    domain_list = sm_client.list_domains()["Domains"]
    domain_ids = [domain["DomainId"] for domain in domain_list]
    return domain_ids


def update_sagemaker_domain(app_type, lifecycle_arn):
    domain_ids = get_domain_ids()
    app_settings_key = "JupyterServerAppSettings" if app_type == "JupyterServer" else "KernelGatewayAppSettings"
    default_resource_spec = {}

    lifecycle_config_arns = []
    if lifecycle_arn:
        default_resource_spec["LifecycleConfigArn"] = lifecycle_arn
        lifecycle_config_arns.append(lifecycle_arn)

    # Going to need to update each domain
    for domain_id in domain_ids:
        sm_client.update_domain(
            DomainId=domain_id,
            DefaultUserSettings={
                app_settings_key: {
                    "DefaultResourceSpec": default_resource_spec,
                    "LifecycleConfigArns": lifecycle_config_arns,
                }
            },
        )


# Triggers when custom resource created for the first time
def on_create(event) -> None:
    logger.info(f"ON CREATE event triggered with event: {event}")

    props = event["ResourceProperties"]
    app_type = props["appType"]
    config_name = props["configName"]
    b64_config_file = props["configFile"]
    config_name = config_name + "-" + datetime.utcnow().strftime("%Y-%m-%d-%H-%M-%S")

    response = sm_client.create_studio_lifecycle_config(
        StudioLifecycleConfigName=config_name,
        StudioLifecycleConfigContent=b64_config_file,
        StudioLifecycleConfigAppType=app_type,
    )

    lifecycle_arn = response["StudioLifecycleConfigArn"]
    update_sagemaker_domain(app_type, lifecycle_arn)


# Triggers when custom resource stack is updated
# We first need to detach any current lifecycle configs
# A lifecycle garbage collector lambda will eventually delete these old ones
# Trying to delete lifecycle configs if they are in use causes problems
def on_update(event) -> None:
    logger.info(f"ON UPDATE event triggered with event: {event}")

    physical_id = event["PhysicalResourceId"]
    props = event["ResourceProperties"]
    old_props = event["OldResourceProperties"]
    app_type = old_props["appType"]

    logger.info(f"Updating resource {physical_id} with {props=} from {old_props=}")

    # This will detach any currently attached lifecycle configs from the domain
    update_sagemaker_domain(app_type, None)

    # Need to give some time for detaching to occur
    # Unfortunately we cannot perform a wait here, need to use a time.sleep
    time.sleep(15)

    app_type = props["appType"]
    config_name = props["configName"]
    b64_config_file = props["configFile"]
    config_name = config_name + "-" + datetime.utcnow().strftime("%Y-%m-%d-%H-%M-%S")

    response = sm_client.create_studio_lifecycle_config(
        StudioLifecycleConfigName=config_name,
        StudioLifecycleConfigContent=b64_config_file,
        StudioLifecycleConfigAppType=app_type,
    )

    lifecycle_arn = response["StudioLifecycleConfigArn"]
    update_sagemaker_domain(app_type, lifecycle_arn)


# This will not delete any resource as trying to delete a lifecycle config in use causes issues
# Instead we will just detach and rely on a garbage collection lambda (or manual deletion)
def on_delete(event) -> None:
    logger.info(f"ON UPDATE event triggered with event: {event}")

    physical_id = event["PhysicalResourceId"]
    props = event["ResourceProperties"]
    app_type = props["appType"]

    # Detaches lifecycles from domains
    update_sagemaker_domain(app_type, None)
