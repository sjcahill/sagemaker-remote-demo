## What gets created when deploying this stack?

-   3 private isolated subnets
-   3 route tables
-   3 subnet <-> route table associations
-   Security Group: interfaceEndpointSG
    -   In all tpc for VPC
    -   In 443 for VPC (redundant)
    -   Out All Traffic to VPC
-   7 endpoints
    -   6 interface endpoints
        -   ssm
        -   sagemaker studio
        -   sagemaker api
        -   sagemaker runtime
        -   sts
        -   cloudwatch logs
    -   1 gateway endpoint
        -   s3
