import { aws_ec2 as ec2, Stack, StackProps, CfnOutput } from 'aws-cdk-lib';
import { IIpAddresses, SecurityGroup, Peer, Port } from 'aws-cdk-lib/aws-ec2';
import { Construct } from 'constructs';

export interface NetworkStackProps extends StackProps {
    env: {
        account: string;
        region: string;
    };
    cidr: IIpAddresses;
    maxAzs: number;
}

export class NetworkStack extends Stack {
    public readonly vpc: ec2.Vpc;

    constructor(scope: Construct, id: string, props: NetworkStackProps) {
        super(scope, id, props);

        this.vpc = new ec2.Vpc(this, 'noIgVpc', {
            ipAddresses: props.cidr,
            createInternetGateway: false,
            maxAzs: props.maxAzs,
            subnetConfiguration: [
                {
                    name: 'private-app',
                    cidrMask: 20,
                    subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
                },
            ],
            vpcName: 'noIgVpc',
        });

        const interfaceSecurityGroup = new SecurityGroup(this, 'interfaceEndpointSG', {
            securityGroupName: 'interfaceEndpointSG',
            vpc: this.vpc,
            allowAllOutbound: false,
            description: 'security group for interface endpoints',
        });

        // Add ingress and egress throuhgout entire vpc for this SG
        interfaceSecurityGroup.addIngressRule(
            Peer.ipv4(this.vpc.vpcCidrBlock),
            Port.allTcp(),
            'Allow all incoming traffic from the VPC',
        );

        interfaceSecurityGroup.addEgressRule(
            Peer.ipv4(this.vpc.vpcCidrBlock),
            Port.allTcp(),
            'Allow all outbound traffic',
        );

        const s3InterfaceGateway = new ec2.GatewayVpcEndpoint(this, 's3 interface gateway', {
            service: ec2.GatewayVpcEndpointAwsService.S3,
            vpc: this.vpc,
            subnets: [{ subnets: this.vpc.isolatedSubnets }],
        });

        const ssmInterfaceGateway = new ec2.InterfaceVpcEndpoint(this, 'ssm interface gateway', {
            service: ec2.InterfaceVpcEndpointAwsService.SSM,
            vpc: this.vpc,
            privateDnsEnabled: true,
            open: true,
            securityGroups: [interfaceSecurityGroup],
        });

        const sagemakerStudioInterfaceGateway = new ec2.InterfaceVpcEndpoint(
            this,
            'sagemaker studio interface gateway',
            {
                service: ec2.InterfaceVpcEndpointAwsService.SAGEMAKER_STUDIO,
                vpc: this.vpc,
                privateDnsEnabled: true,
                open: true,
                securityGroups: [interfaceSecurityGroup],
            },
        );
        const sagemakerApiInterfaceGateway = new ec2.InterfaceVpcEndpoint(this, 'sagemaker api interface gateway', {
            service: ec2.InterfaceVpcEndpointAwsService.SAGEMAKER_API,
            vpc: this.vpc,
            privateDnsEnabled: true,
            open: true,
            securityGroups: [interfaceSecurityGroup],
        });

        const sagemakerRuntimeApiInterfaceGateway = new ec2.InterfaceVpcEndpoint(
            this,
            'sagemaker runtime interface gateway',
            {
                service: ec2.InterfaceVpcEndpointAwsService.SAGEMAKER_RUNTIME,
                vpc: this.vpc,
                privateDnsEnabled: true,
                open: true,
                securityGroups: [interfaceSecurityGroup],
            },
        );

        const stsInterfaceGateway = new ec2.InterfaceVpcEndpoint(this, 'sts interface gateway', {
            service: ec2.InterfaceVpcEndpointAwsService.STS,
            vpc: this.vpc,
            privateDnsEnabled: true,
            open: true,
            securityGroups: [interfaceSecurityGroup],
        });

        const cloudwatchLogsInterfaceGateway = new ec2.InterfaceVpcEndpoint(this, 'cloudwatch logs interface gateway', {
            service: ec2.InterfaceVpcEndpointAwsService.CLOUDWATCH_LOGS,
            vpc: this.vpc,
            privateDnsEnabled: true,
            open: true,
            securityGroups: [interfaceSecurityGroup],
        });

        const ssmMessagesInterfaceGateway = new ec2.InterfaceVpcEndpoint(this, 'ssm messages interface gateway', {
            service: ec2.InterfaceVpcEndpointAwsService.SSM_MESSAGES,
            vpc: this.vpc,
            privateDnsEnabled: true,
            open: true,
            securityGroups: [interfaceSecurityGroup],
        });

        const ec2MessagesInterfaceGateway = new ec2.InterfaceVpcEndpoint(this, 'ec2 messages interface gateway', {
            service: ec2.InterfaceVpcEndpointAwsService.EC2_MESSAGES,
            vpc: this.vpc,
            privateDnsEnabled: true,
            open: true,
            securityGroups: [interfaceSecurityGroup],
        });

        new CfnOutput(this, 'networkStackVpcId', {
            value: this.vpc.vpcId,
            exportName: 'noIgVpcId',
        });

        new CfnOutput(this, 'interfaceSecurityGroupId', {
            value: interfaceSecurityGroup.securityGroupId,
            exportName: 'interfaceSecurityGroupId',
        });
    }
}
