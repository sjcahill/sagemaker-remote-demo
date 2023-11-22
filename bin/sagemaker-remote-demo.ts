#!/usr/bin/env node
import { App } from 'aws-cdk-lib';
import { IpAddresses } from 'aws-cdk-lib/aws-ec2';
import { Aws } from 'aws-cdk-lib';
import { NetworkStack } from '../lib/network/network-stack';
import { SagemakerStack } from '../lib/sagemaker/sagemaker-stack';
import { SagemakerRoleStack } from '../lib/iam/sagemaker-role-stack';
import { IamSsmStack } from '../lib/iam/ssm-stack';

// Comment for commit
const app = new App();

const cidr = IpAddresses.cidr('10.16.0.0/16');
const maxAzs = 3;

const deployAccount = process.env.CDK_DEFAULT_ACCOUNT as string;
console.log(`\x1b[33mThe deployAccount is: \x1b[31m${deployAccount}\x1b[0m\n`);

const stackProps = {
    env: {
        account: deployAccount,
        region: 'us-east-1',
    },
};
const networkProps = {
    env: {
        account: deployAccount,
        region: 'us-east-1',
    },
    region: 'us-east-1',
    cidr: cidr,
    maxAzs: maxAzs,
};

const networkStack = new NetworkStack(app, 'NetworkStack', networkProps);
const vpc = networkStack.vpc;

const iamSsmStack = new IamSsmStack(app, 'IamSsmStack', stackProps);
const sagemakerRoleStack = new SagemakerRoleStack(app, 'SagemakerRoleStack', stackProps);
const sagemakerStack = new SagemakerStack(app, 'SagemakerStack', { ...stackProps, vpc });
