import { Effect, PolicyStatement } from 'aws-cdk-lib/aws-iam';

export abstract class AdminPolicyStatements {
    static fullAdmin = new PolicyStatement({
        effect: Effect.ALLOW,
        actions: ['*'],
        resources: ['*'],
    });
}
