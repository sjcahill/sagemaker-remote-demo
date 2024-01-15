### Policy Statements

This folder contains abstract classes that represent various IAM policy statements

They are partitioned into respective levels of access:

-   Read: Supports read only actions on various resources (Get, List, Describe, ...)
-   Execution: Supports actions that generally have some effect (Create, Run, Update, Execute)
-   Admin: Highest level and generally involves broad or sensitive permissions we don't want most users to have

The classes have static methods defined on them that return some policy statements. The classes allow us to namespace
policy statements by their general level of permissions and the static methods allow us to further organize policy
statements into human readable groupings (can be singular in their service or encompass multi-service functionality)

The static methods can then be used to construct policies that are deployed via CDK and avaiable to roles in our cloud
accounts.

### Considerations

While this approach offers some obvious organizational benefits, it also carries a risk of adjusting permissions on
roles inadvertently. For instance modifying a static method affects all policies with that method in it and therefore
any roles that have that policy attached.
