import { PolicyStatement } from 'aws-cdk-lib/aws-iam';
import { Effect } from 'aws-cdk-lib/aws-iam';
import { Aws } from 'aws-cdk-lib';

export class SshPolicyStack {
    static sshSagemakerClientPolicy(): PolicyStatement[] {
        return [
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
        ];
    }

    static sshSagemakerServerPolicy(execRoleArn: string): PolicyStatement[] {
        return [
            new PolicyStatement({
                effect: Effect.ALLOW,
                actions: ['iam:PassRole'],
                resources: [execRoleArn],
            }),
            new PolicyStatement({
                effect: Effect.ALLOW,
                actions: ['ssm:AddTagsToResource'],
                resources: [execRoleArn],
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
        ];
    }
}
