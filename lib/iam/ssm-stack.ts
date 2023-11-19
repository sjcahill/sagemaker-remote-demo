import { Aws, Stack, StackProps, Fn, CfnOutput } from 'aws-cdk-lib';
import { PolicyDocument, PolicyStatement, Effect, ManagedPolicy } from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';

export class IamSsmStack extends Stack {
    constructor(scope: Construct, id: string, props: StackProps) {
        super(scope, id, props);

        const sagemakerExecRoleArn = Fn.importValue('sagemakerRoleArn');

        const sshSagemakerClientPolicy = new ManagedPolicy(this, 'sshSagemakerClientPolicy', {
            managedPolicyName: 'sshSagemakerClientPolicy',
            document: new PolicyDocument({
                statements: [
                    new PolicyStatement({
                        effect: Effect.ALLOW,
                        actions: [
                            'logs:GetQueryResults',
                            'ssm:DescribeInstanceInformation',
                            'ssm:ListTagsForResource',
                            'ssm:GetCommandInvocation',
                        ],
                        resources: ['*'],
                    }),
                    new PolicyStatement({
                        effect: Effect.ALLOW,
                        actions: ['ssm:StartSession', 'ssm:SendCommand'],
                        resources: [`arn:aws:ssm:*:${Aws.ACCOUNT_ID}:managed-instance/mi-*`],
                        conditions: {
                            StringEquals: {
                                'ssm:resourceTag/SSHOwner': '${aws:userid}',
                            },
                        },
                    }),
                    new PolicyStatement({
                        effect: Effect.ALLOW,
                        actions: ['ssm:TerminateSession'],
                        resources: [`arn:aws:ssm:*:${Aws.ACCOUNT_ID}:session/*`],
                        conditions: {
                            StringLike: {
                                'ssm:resourceTag/aws:ssmmessages:session-id': ['${aws:userid}'],
                            },
                        },
                    }),
                    new PolicyStatement({
                        effect: Effect.ALLOW,
                        actions: ['ssm:StartSession', 'ssm:SendCommand'],
                        resources: [
                            'arn:aws:ssm:*::document/AWS-StartSSHSession',
                            'arn:aws:ssm:*::document/AWS-RunShellScript',
                        ],
                    }),
                    new PolicyStatement({
                        effect: Effect.ALLOW,
                        actions: ['logs:StartQuery'],
                        resources: [`arn:aws:logs:*:${Aws.ACCOUNT_ID}:log-group:/aws/sagemaker/*`],
                    }),
                ],
            }),
        });

        const sshSagemakerServerPolicy = new ManagedPolicy(this, 'sshSagemakerServerPolicy', {
            managedPolicyName: 'sshSagemakerServerPolicy',
            document: new PolicyDocument({
                statements: [
                    new PolicyStatement({
                        effect: Effect.ALLOW,
                        actions: ['iam:PassRole'],
                        resources: [sagemakerExecRoleArn],
                    }),
                    new PolicyStatement({
                        effect: Effect.ALLOW,
                        actions: ['ssm:AddTagsToResource'],
                        resources: [sagemakerExecRoleArn],
                    }),
                    new PolicyStatement({
                        effect: Effect.ALLOW,
                        actions: [
                            'ec2messages:AcknowledgeMessage',
                            'ec2messages:DeleteMessage',
                            'ec2messages:GetMessages',
                            'ec2messages:SendReply',
                            'ssm:CreateActivation',
                            'ssm:ListAssociations',
                            'ssm:ListInstanceAssociations',
                            'ssmmessages:CreateControlChannel',
                            'ssmmessages:CreateDataChannel',
                            'ssmmessages:OpenControlChannel',
                            'ssmmessages:OpenDataChannel',
                        ],
                        resources: ['*'],
                    }),
                    new PolicyStatement({
                        effect: Effect.ALLOW,
                        actions: ['ssm:UpdateInstanceInformation'],
                        resources: [`arn:aws:ssm:*:${Aws.ACCOUNT_ID}:managed-instance/mi-*`],
                        conditions: {
                            StringLike: {
                                'ssm:resourceTag/SSHOwner': '*',
                            },
                        },
                    }),
                    new PolicyStatement({
                        effect: Effect.ALLOW,
                        actions: ['logs:*'],
                        resources: [`arn:aws:logs:*:${Aws.ACCOUNT_ID}:log-group:/aws/sagemaker/*`],
                    }),
                ],
            }),
        });

        new CfnOutput(this, 'sshClientPolicyArn', {
            value: sshSagemakerClientPolicy.managedPolicyArn,
            exportName: 'sshClientPolicyArn',
        });

        new CfnOutput(this, 'sshServerPolicyArn', {
            value: sshSagemakerServerPolicy.managedPolicyArn,
            exportName: 'sshServerPolicyArn',
        });
    }
}
