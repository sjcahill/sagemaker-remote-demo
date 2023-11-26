# Sagemaker Remote Demo

This repository is meant to assist those interested in using VSCode Remote developement to ssh into Sagemaker Studio
Notebook instances.

It contains the [AWS CDK](https://aws.amazon.com/cdk/) code for building out the necessary infrastructure in order to
use the demo.

There are modules in this repo that are not necessary for the base demonstration and are here to showcase some other
aspects in which CDK can make implementing a datascience platform for users easier.

I will try to be as clear as possible which stacks will need to be deployed for the specific demo. I will also include
steps on how to properly tear down any setup infrastructure - since deleting VPCs with many endpoints and security
groups is not always as straightforward as you would like.

Each subsection is going to include the stacks needed to be deployed in order to complete the demo.

## Sagemaker Remote Developement using SSH/SSM

Things you will need for this demo to work

-   AWS CLI v2 installed: Install or update latest version of
    [aws cli](https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html)
-   AWS CLI session manager plugin: Install
    [session manager plugin](https://docs.aws.amazon.com/systems-manager/latest/userguide/session-manager-working-with-install-plugin.html)
-   AWS account with Sagemaker Studio properly setup (domain, roles, permissions, endpoints)
-   AWS Systems Manager:
    [Advanced-instances tier turned on](https://docs.aws.amazon.com/systems-manager/latest/userguide/systems-manager-managedinstances-advanced.html)
-   VS Code with
    [Remote-SSH extension installed](https://marketplace.visualstudio.com/items?itemName=ms-vscode-remote.remote-ssh)
-   Remote.SSH: Local Server Download setting in VS Code set to auto or always

### Deploying the Cloudformation Stacks

Total cost of infra per day ($6 per day in us-east-1 as of 25/11/2023)

Stacks defined as part of the cdk app here: `bin/sagemaker-remote-demo.ts`

Any stacks prefixed by a `*` are able to be optional depending on your setup. Explanations for under what conditions and
why this is the case will be below the stack order. Stacks needed to be deployed (in order)

-   `NetworkStack` (look in the README at `lib/network` to see what will be created)
-   `SagemakerRoleStack` (defines the sagemaker execution role and client ssh inline IAM policy)
-   `SagemakerStack` (defines the sagemaker studio domain settings)
-   `*` `EcrStack` (enables the creation of a custom image)

**Note**: The `EcrStack` is only needed if you want to create and use a custom image to run a Sagemaker Studio Notebook.

The reason we have to do this is we have no external internet access enabled in the VPC and for Studio. Since we have no
proxy for `PyPI` setup we will need to `pip install` a necessary package locally and then push the image to our ECR repo
so we can use it as a custom image in Sagemaker Studio

### Some Follow-up Actions once stacks are deployed

1. Enabling setSourceIdentity for the Sagemaker Studio Domain

A good setting to enable for the Sagemaker Studio Domain is
[setSourceIdentity](https://docs.aws.amazon.com/sagemaker/latest/dg/monitor-user-access.html). This will enable you to
log actions taken in Sagemaker at the user level **provided that the user-profile tag is unique for each user**

By default the actions get logged at the execution role level and since it is common to have multiple users per
execution role this might not be granular enough for your purposes.

Unfortunately this setting is not available in the `cdk` Domain construct for Sagemaker and so must be set manually via
cli (you could also make a lamdba or some more automated process as well)

`aws sagemaker update-domain --domain-id [DOMAIN_ID] --domain-settings-for-update "ExecutionRoleIdentityConfig=USER_PROFILE_NAME" --profile [PROFILE_NAME] --region [REGION]`

2. Building and Creating a Sagemaker Custom Image with `sagemaker-ssh-helper` package installed.

There are two ways you can do this:

-   Via the shell script `custom_images/python-base/build_tag_push_image.sh`
-   via the console.

Either way, you will need to have the `EcrRepo` stack deployed to create a private ECR repo (or create one via console)

#### Via the shell script

`custom_images/python-base` contains a Dockerfile that builds a relatively slim container based on `python:3.11.1`. We
can create a custom image that can be selected inside Sagemaker Studio using this.

If you elect to use `build_tag_push_image.sh` then it should be as simple as ensuring it has execution privs and running
`./build_tag_push_image.sh --profile <profile_name>`. This will deploy the image to ECR and create and attach the custom
image to your Studio Domain.

#### Via the console

**NOTE** In order for the custom image to show up in the list of images in Studio we must add it to the environment
settings for the domain prior to starting Studio or while it is shut down

Once we have our image in the ECR repo for the account we can create a Sagemaker Custom Image

Navigate to the `Images` tab in the left ribbon of Sagemaker Console UI

![Custom Image UI](assets/custom-image-console-ui.png 'Custom Image UI')

Click on create Image and then paste in the ECR image URI for the image we pushed previously.

There are a couple settings on this page that are important.

Ensure that the IAM role is `defaulSagemakerRole` (this is the role we create in the `SagemakerRoleStack`)

Since we set `USER root` at the end of the `Dockerfile` we need to ensure that root user has access to the home EFS
directory that will get mounted to the notebook container. So we need to set UID: 0 and GUID: 0 - since 0 indicates root
user.

We also need to specify the kernel for the image. Here we can just do KernelName: python3 KernelDisplayName: python3

![Custom Image Config](assets/custom-image-config.png 'Custom Image Config')

After this we can hit submit and it should create a custom image that shows in the UI.

Next we need to attach it to the domain using the Environment settings:

![Domain Settings](assets/domain-settings.png 'Domain Settings')

Click on `Attach Image` and select `Existing Image`. You should see your image here with the available image version 1.

Hitting next will bring up the familiar `Image Properties` config options and use the same as we did above for UID/GUID
etc

4. Adding a Sagemaker User

Now that we have attached our custom image to the domain we can create a user.

This is relatively straightforward, you should see an `AddUser` button when you click on the domain and you can name the
user what you would like (take note of this it will be needed later) and just ensure you have the right Execution Role
selected.

We don't need to use any of the optional settings (such as enabling canvas) for the user.

5. Starting Studio and Creating a Notebook with our custom Image

Once you have successfully launch Sagemaker Studio you will be brought to the home screen.

Here we will launch a notebook (which will spin up an entirely new instance for us) and during this process we can
select our custom image as the one to use.

There are a couple of ways to launch a notebook, but once you have done it, a dialogue box with some options should
open.

![Creating Notebook](assets/creating-notebook.png 'Creating Notebook')

You should see an option under custom images. Select that and also the instance size you would like. `ml.t3.medium` is
more than adequate for demo purposes

While what is spinning up we can upload the shell script we need to execute on the notebook in order to start ssm agent,
register the notebook with Systems Manager and ensure it is configured for us to remote into.

`kernel_lc_config.sh` contains the code we need to upload and this can be done simply by clicking on the upload icon in
Sagemaker Studio and selecting this file (assuming you have downloaded it or cloned the repo locally)

![Upload File](assets/upload-file.png 'Upload File')

Once uploaded you can create a notebook terminal, ensure that you have execution permissions on the file
`chmod u+x kernel_lc_config.sh` and then run it with `./kernel_lc_config.sh`.

Assuming this executes successfully you should see a new registered instance in Systems Manager.

Reminder: you must have Advanced Instance Tier settings enabled for this to work. You can see I have one registered
instance in the instance below

![Advanced Tier Settings](assets/advanced-tier-settings.png 'Advanced Tier Settings')

6. Using local VS Code Client to connect to Sagemaker Studio

Everything is ready for us to remote into our Sagemaker Studio instance at this point and we just need to do some final
configuration locally

-   Ensure you have `pip install sagemaker-ssh-helper` into you local python environment
-   Run `sm-local-configure` which will prompt you for a password
-   Run `sm-local-ssh-ide set-domain-id [domain_id]` - set with the id for your studio domain
-   Run `sm-local-ssh-ide set-user-profile-name [user_profile_name]` - set with user profile name of sagemaker user
-   Run `sm-local-ssh-ide connect [kernel_gateway_app_name]` - kgw app name can be found in your user details tab

![Kernel Gateway App Name](assets/kgw-app.png 'Kernel Gateway App Name')

If that is all successful you should get access to a remote terminal

![Remote Terminal](assets/remote-terminal.png 'Remote Terminal')

**Note**: you will need to leave this connection open in order for you to use the VS Code Remote extension

Finally, we are ready to remote into our instance and get ta hackin.

![VsCode Remote](assets/myvideo.gif 'VsCode Remote')
