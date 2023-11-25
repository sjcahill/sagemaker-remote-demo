#!/usr/bin/env node
import { App } from 'aws-cdk-lib';
import { DeveloperRoleStack } from '../lib/iam/developer-role-stack';
import { IpAddresses } from 'aws-cdk-lib/aws-ec2';
import { NetworkStack } from '../lib/network/network-stack';
import { SagemakerStack } from '../lib/sagemaker/sagemaker-stack';
import { SagemakerRoleStack } from '../lib/iam/sagemaker-role-stack';
import { EcrStack } from '../lib/ecr/ecr-stack';

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

const developerRoleStack = new DeveloperRoleStack(app, 'DeveloperRoleStack', stackProps);
const ecrStack = new EcrStack(app, 'EcrStack', stackProps);
const sagemakerRoleStack = new SagemakerRoleStack(app, 'SagemakerRoleStack', stackProps);
const sagemakerStack = new SagemakerStack(app, 'SagemakerStack', { ...stackProps, vpc });
