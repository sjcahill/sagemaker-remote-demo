import { CustomResource, Duration, RemovalPolicy } from 'aws-cdk-lib';
import { Effect, PolicyStatement, Role, ServicePrincipal } from 'aws-cdk-lib/aws-iam';
import { Code, Function, Runtime } from 'aws-cdk-lib/aws-lambda';
import { Provider } from 'aws-cdk-lib/custom-resources';
import { Construct } from 'constructs';
import { readFileSync } from 'fs';
import { fromByteArray } from 'base64-js';
import path from 'path';

export interface StudioLifecyleProps {
    configName: string;
    configFile: string;
    configAppType: 'JupyterServer' | 'KernelGateway';
}

export class LifecycleConfigCustomResource extends Construct {
    constructor(scope: Construct, id: string, props: StudioLifecyleProps) {
        super(scope, id);

        const configName = props.configName;
        const role = new Role(this, `customResourceLambdaRole-${configName}`, {
            assumedBy: new ServicePrincipal('com.amazonaws.lambda'),
        });

        const onEventLambda = new Function(this, `onEventLambdaFunction-${configName}`, {
            runtime: Runtime.PYTHON_3_10,
            handler: 'lifecycle_config_crud.on_event',
            code: Code.fromAsset(path.join(__dirname, '..', 'custom-resources', 'assets')),
            initialPolicy: this.customResourceLambdaInlinePolicy(),
            role: role,
            timeout: Duration.seconds(60),
        });

        const provider = new Provider(this, `lifecycleConfigProvider-${configName}`, {
            onEventHandler: onEventLambda,
        });

        const lifecycleCustomResource = new CustomResource(this, `lifecycleCustomResource-${configName}`, {
            serviceToken: provider.serviceToken,
            removalPolicy: RemovalPolicy.DESTROY,
            resourceType: 'Custom::StudioLifecycleConfig',
            properties: {
                configName: props.configName,
                configFile: this.encode_file(props.configFile),
                appType: props.configAppType,
            },
        });
    }

    // return our lifecycle config as a base64 encoded string
    private encode_file(filepath: string): string {
        const contents = readFileSync(filepath);
        const encoded = fromByteArray(contents);
        return encoded.toString();
    }

    private customResourceLambdaInlinePolicy() {
        return [
            new PolicyStatement({
                effect: Effect.ALLOW,
                actions: [
                    'sagemaker:*StudioLifecycleConfig',
                    'sagemaker:ListStudioLifecycleConfigs',
                    'sagemaker:ListDomains',
                    'sagemaker:UpdateDomain',
                ],
                resources: ['*'],
            }),
        ];
    }
}
