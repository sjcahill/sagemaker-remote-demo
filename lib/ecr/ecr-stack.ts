import { RemovalPolicy, Stack, StackProps } from 'aws-cdk-lib';
import { Repository } from 'aws-cdk-lib/aws-ecr';
import { Construct } from 'constructs';

export class EcrStack extends Stack {
    constructor(scope: Construct, id: string, props: StackProps) {
        super(scope, id, props);

        // repo name should match what is in the `build_tag_push_image.sh` scripts in custom_images folder
        const sagemakerImageRepo = new Repository(this, 'sagemaker-custom-images', {
            autoDeleteImages: true,
            removalPolicy: RemovalPolicy.DESTROY,
            repositoryName: 'sagemaker-custom-images',
        });
    }
}
