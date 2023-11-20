import { Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { LifecycleConfigCustomResource } from '../components/lifecycle-config-builder';
import path from 'path';

export class KernelGatewayLifecycleConfigStack extends Stack {
    constructor(scope: Construct, id: string, props: StackProps) {
        super(scope, id, props);

        new LifecycleConfigCustomResource(this, 'kernelGatewayLifecycleConfig', {
            configAppType: 'KernelGateway',
            configName: 'kernel-gateway-lifecycle-config',
            configFile: path.join(__dirname, 'lifecycle-configs', 'kernel-lifecycle-config.sh'),
        });
    }
}
