import {
    Effect,
    CompositePrincipal,
    FederatedPrincipal,
    ManagedPolicy,
    PolicyStatement,
    Role,
    ServicePrincipal,
} from 'aws-cdk-lib/aws-iam';
import { Aws, CfnOutput, Fn, Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';

export class SagemakerRoleStack extends Stack {
    constructor(scope: Construct, id: string, props: StackProps) {
        super(scope, id, props);

        const sshServerPolicyArn = Fn.importValue('sshServerPolicyArn');

        const defaultSagemakerRole = new Role(this, 'defaultSagemakerRole', {
            roleName: 'defaultSagemakerRole',
            assumedBy: new CompositePrincipal(
                new ServicePrincipal('sagemaker.amazonaws.com'),
                new ServicePrincipal('ssm.amazonaws.com'),
                new FederatedPrincipal(
                    `arn:aws:iam::${Aws.ACCOUNT_ID}}:saml-provider/GoogleWorkspace`,
                    {
                        StringEquals: {
                            'SAML:aud': 'https://signin.aws.amazon.com/saml',
                        },
                    },
                    'sts:AssumeRoleWithSAML',
                ),
            ),
        });

        defaultSagemakerRole.assumeRolePolicy?.addStatements(
            new PolicyStatement({
                effect: Effect.ALLOW,
                actions: ['sts:SetSourceIdentity'],
                principals: [new ServicePrincipal('sagemaker.amazonaws.com')],
            }),
        );

        defaultSagemakerRole.addManagedPolicy(ManagedPolicy.fromAwsManagedPolicyName('AmazonSagemakerFullAccess'));
        defaultSagemakerRole.addManagedPolicy(
            ManagedPolicy.fromManagedPolicyArn(this, 'sshServerPolicyArn', sshServerPolicyArn),
        );

        defaultSagemakerRole.addToPolicy(
            new PolicyStatement({
                effect: Effect.ALLOW,
                actions: ['s3:*', 'codecommit:*'],
                resources: ['*'],
            }),
        );

        defaultSagemakerRole.addToPolicy(
            new PolicyStatement({
                effect: Effect.ALLOW,
                actions: ['iam:PassRole'],
                resources: ['*'],
                conditions: {
                    StringEquals: {
                        'iam:PassedToService': ['sagemaker.amazonaws.com'],
                    },
                },
            }),
        );

        new CfnOutput(this, 'sagemakerRoleArn', {
            value: defaultSagemakerRole.roleArn,
            exportName: 'sagemakerRoleArn',
        });
    }
}
