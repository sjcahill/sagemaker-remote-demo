## Sagemaker Stack

### Setting Source Identity

[Monitor User Access in Sagemaker](https://docs.aws.amazon.com/sagemaker/latest/dg/monitor-user-access.html)

By default, the abillity to propagate the user profile name as the `sourceIdentity` in Studio is off.

To enable this feature you can use the aws cli to update the domain (there must be no active users in the domain).

With this setting turned on, you can then use Cloudtrail to monitor and record user activities and get activities
related to a specific user profile.

Otherwise, cloudtrail only lists the Studio Execution Role Arn as the identifier and this might not be specific enough
if multiple users are sharing the same exec role.
