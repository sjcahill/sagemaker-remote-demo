import { Aws, Duration, Stack, StackProps } from 'aws-cdk-lib';
import { Effect, ManagedPolicy, PolicyStatement, Role, SamlPrincipal, SamlProvider } from 'aws-cdk-lib/aws-iam';
import { StringParameter } from 'aws-cdk-lib/aws-ssm';
import { Construct } from 'constructs';
import { SshPolicyStack } from './policies';

export class DeveloperRoleStack extends Stack {
    constructor(scope: Construct, id: string, props: StackProps) {
        super(scope, id, props);

        const samlProviderArn = `arn:aws:iam::${Aws.ACCOUNT_ID}:saml-provider/Google-Workspace`;
        const samlProvider = SamlProvider.fromSamlProviderArn(this, 'googleWorkspaceSamlProvider', samlProviderArn);
        const samlEntityId = StringParameter.fromStringParameterName(this, 'samlEntityId', 'saml-issuer');

        const developerRole = new Role(this, 'developerRole', {
            assumedBy: new SamlPrincipal(samlProvider, {
                StringEquals: {
                    'SAML:iss': samlEntityId.stringValue,
                },
            }),
            maxSessionDuration: Duration.hours(8),
            roleName: 'developerRole',
        });

        developerRole.addManagedPolicy(ManagedPolicy.fromAwsManagedPolicyName('AmazonSagemakerFullAccess'));
        developerRole.addToPolicy(
            new PolicyStatement({
                effect: Effect.ALLOW,
                actions: ['s3:*', 'code-commit:*', 'logs:*'],
                resources: ['*'],
            }),
        );

        SshPolicyStack.sshSagemakerClientPolicy().forEach((policy_statement) => {
            developerRole.addToPolicy(policy_statement);
        });
    }
}
