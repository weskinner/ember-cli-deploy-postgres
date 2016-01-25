# ember-cli-deploy-postgres

> Deploy your Ember.js index to Postgres

A thin wrapper around [ember-cli-deploy-mysql](https://github.com/mwpastore/ember-cli-deploy-mysql)

## Quick Start

To get up and running quickly, do the following:

- Ensure [ember-cli-deploy-build][4] is installed and configured.

- Install this plugin:

```sh
$ ember install ember-cli-deploy-postgres
```

- Place the following configuration into `config/deploy.js`:

```javascript
ENV.postgres = {
  user: '<your-postgres-user>',
  password: '<your-postgres-password>',
  database: '<your-postgres-database>'
}
```

- Run the pipeline:

```sh
$ ember deploy <environment>
```

## Installation

Run the following command in your terminal:

```sh
ember install ember-cli-deploy-postgres
```

## Documentation

see [ember-cli-deploy-mysql](https://github.com/mwpastore/ember-cli-deploy-mysql) substituting "mysql" for "postgres"

[1]: https://github.com/lukemelia/ember-cli-deploy-lightning-pack "ember-cli-deploy-lightning-pack"
[2]: http://ember-cli.github.io/ember-cli-deploy/plugins "Plugin Documentation"
[3]: https://github.com/felixge/node-mysql "MySQL client"
[4]: https://github.com/ember-cli-deploy/ember-cli-deploy-build "ember-cli-deploy-build"
[5]: https://github.com/ember-cli/ember-cli-deploy "ember-cli-deploy"
[6]: https://github.com/ember-cli-deploy/ember-cli-deploy-revision-data "ember-cli-deploy-revision-data"
[7]: https://github.com/ember-cli-deploy/ember-cli-deploy-ssh-tunnel "ember-cli-deploy-ssh-tunnel"
[8]: https://github.com/ember-cli-deploy/ember-cli-deploy-redis "ember-cli-deploy-redis"
