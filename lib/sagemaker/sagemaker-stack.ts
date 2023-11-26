import { CfnDomain } from 'aws-cdk-lib/aws-sagemaker';
import { CfnOutput, Fn, Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { Connections, Peer, Port, SecurityGroup, Vpc } from 'aws-cdk-lib/aws-ec2';
import { Code, Repository } from 'aws-cdk-lib/aws-codecommit';
import { Role } from 'aws-cdk-lib/aws-iam';
import * as path from 'path';

export interface SagemakerStackProps extends StackProps {
    vpc: Vpc;
}

export class SagemakerStack extends Stack {
    constructor(scope: Construct, id: string, props: SagemakerStackProps) {
        super(scope, id, props);

        const sagemakerRoleArn = Role.fromRoleName(this, 'sagemakerRole', 'defaultSagemakerRole').roleArn;
        const noIgVpc = props.vpc;
        const privateSubnetIds = noIgVpc.isolatedSubnets.map((subnet) => subnet.subnetId);
        const interfaceSgId = Fn.importValue('interfaceSecurityGroupId');

        const defaultSG = new SecurityGroup(this, 'defaultSagemakerSG', {
            securityGroupName: 'defaultSagemakerSG',
            vpc: noIgVpc,
            allowAllOutbound: false,
            description: 'basic sagemaker studio security group',
        });

        defaultSG.addIngressRule(Peer.ipv4(noIgVpc.vpcCidrBlock), Port.tcp(2049), 'Allow EFS Traffic');
        defaultSG.addEgressRule(Peer.securityGroupId(interfaceSgId), Port.allTraffic());
        defaultSG.addEgressRule(Peer.prefixList('pl-63a5400a'), Port.allTraffic());
        defaultSG.addEgressRule(
            Peer.ipv4(noIgVpc.vpcCidrBlock),
            Port.allTcp(),
            'Allow tcp traffic from sagemaker to anywhere in vpc',
        );
        defaultSG.connections.allowFrom(
            new Connections({
                securityGroups: [defaultSG],
            }),
            Port.allTcp(),
            'allow all tcp traffic from self',
        );

        // run this command via cli for each domain
        // aws sagemaker update-domain --domain-id [DOMAIN_ID] --domain-settings-for-update "ExecutionRoleIdentityConfig=USER_PROFILE_NAME" --profile [PROFILE_NAME] --region [REGION]
        const sagemakerDomain = new CfnDomain(this, 'sagemakerDomain', {
            domainName: 'baseSagemakerDomain',
            authMode: 'IAM',
            appNetworkAccessType: 'VpcOnly',
            vpcId: noIgVpc.vpcId,
            subnetIds: privateSubnetIds,
            defaultUserSettings: {
                executionRole: sagemakerRoleArn,
                securityGroups: [defaultSG.securityGroupId],
            },
        });

        // Code commit repo
        const testRepo = new Repository(this, 'testRepo', {
            repositoryName: 'test-repository',
            code: Code.fromDirectory(path.join(__dirname, 'repo-init-directory'), 'main'),
            description: 'Repo to test code commit connectivity while using ssm with Sagemaker',
        });

        new CfnOutput(this, 'sagemakerDefaultSg', {
            value: defaultSG.securityGroupId,
            exportName: 'sagemakerDefaultSg',
        });
    }
}
