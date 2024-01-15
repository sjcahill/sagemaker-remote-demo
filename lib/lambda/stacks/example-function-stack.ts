import { Duration, Stack, StackProps } from 'aws-cdk-lib';
import { Repository } from 'aws-cdk-lib/aws-ecr';
import { PolicyStatement } from 'aws-cdk-lib/aws-iam';
import { Code, Function, Handler, Runtime } from 'aws-cdk-lib/aws-lambda';
import { SnsDestination } from 'aws-cdk-lib/aws-lambda-destinations';
import { Topic } from 'aws-cdk-lib/aws-sns';
import { Construct } from 'constructs';

export class ExmapleFunctionStack extends Stack {
    constructor(scope: Construct, id: string, props: StackProps) {
        super(scope, id, props);

        const failureTopicArn = 'arn:aws:sns:<region>:<accountId>:<topicName>';
        const failureTopic = Topic.fromTopicArn(this, 'lamdbaFailureTopic', failureTopicArn);
        // the string value "tlambdaFailureTopic" is simply a logicalId for the CDK applications construct tree
        // This just helps CDK manage this construct, it is not related to a Cloudformation Logical Id

        const repo = Repository.fromRepositoryName(this, 'LambdaImageRepo', 'my-lambda-images');
        const functionName = 'example-function';
        const functionTag = functionName;
        // functionTag is equal to functionName because we have one ECR repo for multiple lambdas, so in the UI the tags will be
        // the same as function names allowing us to easily ID which function is which

        const ExampleFunctionLambda = new Function(this, 'ExampleFunctionLambda', {
            functionName: functionName,
            handler: Handler.FROM_IMAGE,
            runtime: Runtime.FROM_IMAGE,
            code: Code.fromEcrImage(repo, {
                tagOrDigest: functionTag,
            }),
            initialPolicy: this.lambdaInlinePolicy(),
            timeout: Duration.minutes(1),
            onFailure: new SnsDestination(failureTopic),
        });
    }

    private lambdaInlinePolicy() {
        return [new PolicyStatement({})];
    }
}
