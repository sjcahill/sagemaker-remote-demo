#!/bin/bash

set -euo pipefail


# This assumes you have a private ECR repository called `sagemaker-custom-images`
repo_name="sagemaker-custom-images"
image_name="sagemaker-slim-image"
app_image_name="${image_name}-config"

if [[ $1 == "--profile" ]]; then
    profile=$2
fi

if [[ -z "${profile}" ]]; then
    echo "Must pass in a value for profile"
    exit 1
fi

account=$(aws sts get-caller-identity --profile "${profile}" | jq --raw-output ".Account")
domain_id=$(aws --profile dev-admin sagemaker list-domains --query 'Domains[0].DomainId' --output text)
exec_role_arn=$(aws --profile dev-admin iam list-roles --query "Roles[?RoleName=='defaultSagemakerRole'].Arn | [0]" --output text)


echo "Your account number is ${account}"
echo "Your domain id is ${domain_id}"

aws ecr get-login-password --region us-east-1 --profile "${profile}" | docker login --username AWS --password-stdin ${account}.dkr.ecr.us-east-1.amazonaws.com

docker buildx build --platform linux/amd64 -t ${image_name}:latest .

docker tag ${image_name}:latest ${account}.dkr.ecr.us-east-1.amazonaws.com/${repo_name}:${image_name}

docker push ${account}.dkr.ecr.us-east-1.amazonaws.com/${repo_name}:${image_name}

app_image_template='{
    "AppImageConfigName": "${app_image_name}",
    "KernelGatewayImageConfig": {
        "KernelSpecs": [
            {
                "Name": "python3",
                "DisplayName": "python3"
            }
        ],
        "FileSystemConfig": {
            "MountPath": "/root",
            "DefaultUid": 0,
            "DefaultGid": 0
        }
    }
}'

update_domain_template='{
    "DomainId": "${domain_id}",
    "DefaultUserSettings": {
        "KernelGatewayAppSettings": {
            "CustomImages": [
                {
                    "ImageName": "${image_name}",
                    "AppImageConfigName": "${app_image_name}"
                }
            ]
        }
    }
}'

export domain_id image_name app_image_name
app_image_json=$(echo "$app_image_template" | envsubst)
update_domain_json=$(echo "$update_domain_template" | envsubst)

echo $app_image_json > app.json
echo $update_domain_json > domain.json

echo "CREATING IMAGE"
aws --profile dev-admin --region us-east-1 sagemaker create-image --image-name ${image_name}  --role-arn ${exec_role_arn}
echo "CREATING IMAGE VERSION"
aws --profile dev-admin --region us-east-1 sagemaker create-image-version --image-name ${image_name} --base-image ${account}.dkr.ecr.us-east-1.amazonaws.com/${repo_name}:${image_name}
echo "CREATING APP IMAGE CONFIG"
aws --profile dev-admin --region us-east-1 sagemaker create-app-image-config --cli-input-json file://app.json
echo "UPDATING DOMAIN"
aws --profile dev-admin --region us-east-1 sagemaker update-domain --cli-input-json file://domain.json
