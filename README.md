# Sagemaker Remote Demo

This repo contains the code needed to demo the remote development capability between VS Code and Sagemaker Studio using
AWS Systems Manager.

There are 4 cdk stacks that need to be deployed (each stack corresponds to a cloudformation stack)

The `lib/network/network-stack.ts` will create a vpc with 3 private isolated subnets and the interface enpoints you will
need for Sagemaker Studio to communicate with the required services while in VPCOnly mode

The `lib/iam/ssm-stack.ts` defines two managed IAM policies that are required to for using SSH/SSM.

-   One policy is for the client (local user with VS Code and an Iam role)
-   One policy is for the "server" (studio notebook with associated Sagemaker execution role running ssm-agent)

The `lib/iam/sagemaker-role-stack.ts` defines the execution role that your sagemaker studio will assume. Any notebooks
created in studio will inherit this role and all of its permissions - determines what actions you can do while
developing in sagemaker studio

The `lib/sagemaker/sagemaker-stack.ts` defines the studio environment and its configuration. It also creates a security
group for studio and associates that with the Sagemaker Studio domain.

The order in which to deploy stacks should generally be as follows:

1. Network Stack
2. Ssm stack
3. Sagemaker Role Stack
4. Sagemaker Studio Stack

Tearing down should be in reverse order and there are some considerations you must keep in mind to allow for a smooth
teardown process

1. Ensure all Sagemaker Studio apps (kgw and default) are deleted
2. Ensure your sagemaker user is deleted (active apps prevent deletion)
3. Delete the Studio Stack
4. Delete the Ssm stack
5. Delete the Sagemaker Role Stack

The network stack is the most difficult to teardown because of EFS and some security group rules

1. Ensure that all EFS directories are deleted (these get created automatically for Sagemaker Studio)
    - You will lose all data on these so in production environments this warrants more careful considerations
    - Find the security groups associated with the VPC created in the network stack and delete all the rules for them
2. You should now be able to delete the network stack
