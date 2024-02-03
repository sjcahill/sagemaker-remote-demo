import { Stack, StackProps } from 'aws-cdk-lib';
import { Effect, ManagedPolicy, PolicyStatement } from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';

// TODO: Currently the way this is set up will allow for escalation of privileges by individuals authorized to
// modify this policy. Perhaps a more secure approach is warranted
export class CfnExecutionPolicyStack extends Stack {
    constructor(scope: Construct, id: string, props: StackProps) {
        super(scope, id, props);

        const policyName = 'cdk-cfn-exec-policy';

        const servicesStatement = new PolicyStatement({
            effect: Effect.ALLOW,
            actions: ['*'],
            resources: ['cloudwatch', 'dynamo', 'lambda', 'logs', 's3', 'sagemaker', 'ssm'],
            conditions: {
                StringEquals: { 'aws:RequestedRegion': 'us-east-1' },
            },
        });

        const networkStatement = new PolicyStatement({
            effect: Effect.ALLOW,
            actions: ['ec2:*Vpc*', 'ec2:*Subnet*', 'ec2:*RouteTable*', 'ec2:*SecurityGroup*', 'ec2:*VpcEndpoint*'],
            resources: ['*'],
            conditions: {
                StringEquals: { 'aws:RequestedRegion': 'us-east-1' },
            },
        });

        const networkTagsStatement = new PolicyStatement({
            effect: Effect.ALLOW,
            actions: ['ec2:CreateTags', 'ec2:DeleteTags'],
            resources: [
                'arn:aws:ec2:*:*:vpc/*',
                'arn:aws:ec2:*:*:subnet/*',
                'arn:aws:ec2:*:*:route-table/*',
                'arn:aws:ec2:*:*:security-group/*',
                'arn:aws:ec2:*:*:vpc-endpoint/*',
            ],
            conditions: {
                StringEquals: { 'aws:RequestedRegion': 'us-east-1' },
            },
        });

        const cfnExecPolicy = new ManagedPolicy(this, policyName, {
            description: 'A custom policy for the cdk CloudFormation Execution Role',
            statements: [servicesStatement, networkStatement, networkTagsStatement],
        });
    }
}
