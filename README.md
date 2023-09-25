

# kittgen nest mono template

## Run schematics

`npx nx build schematics && schematics .:ddd-model --input-file model.json --dry-run=false`
## Geting started

1. Start required infra: `npm infra:up`
2. Create schema `npm run schema:create`
3. Start app in dev mode via `npm run start`. The server will run on port 5000.

## Testing

For running tests use `nx test`, e.g. for article `npx nx test article --codeCoverage` 
## Generate a library

Run `nx g @nrwl/react:lib my-lib` to generate a library.

> You can also use any of the plugins above to generate libraries as well.

Libraries are shareable across libraries and applications. They can be imported from `@realworld-workspace/mylib`.

## Development server

Run `nx serve app` for a dev server. Navigate to http://localhost:5000/. The app will automatically reload if you change any of the source files.
component.

## Build

### App 
Run `nx build app` to build the project. The build artifacts will be stored in the `dist/` directory. Use the `--prod` flag for a production build.

### Libraries

## Deploy

### fly.io 
Once authenticated with fly.io, run `fly deploy`.

Run `nx build my-lib`. 
## Running unit tests

Run `nx test my-app` to execute the unit tests via [Jest](https://jestjs.io).

Run `nx affected:test` to execute the unit tests affected by a change.

## Running end-to-end tests

Run `nx e2e my-app` to execute the end-to-end tests via [Cypress](https://www.cypress.io).

Run `nx affected:e2e` to execute the end-to-end tests affected by a change.

## Understand your workspace

Run `nx graph` to see a diagram of the dependencies of your projects.

## Further help

Visit the [Nx Documentation](https://nx.dev) to learn more.



## ☁ Nx Cloud

### Distributed Computation Caching & Distributed Task Execution

<p style="text-align: center;"><img src="https://raw.githubusercontent.com/nrwl/nx/master/images/nx-cloud-card.png"></p>

Nx Cloud pairs with Nx in order to enable you to build and test code more rapidly, by up to 10 times. Even teams that are new to Nx can connect to Nx Cloud and start saving time instantly.

Teams using Nx gain the advantage of building full-stack applications with their preferred framework alongside Nx’s advanced code generation and project dependency graph, plus a unified experience for both frontend and backend developers.

Visit [Nx Cloud](https://nx.app/) to learn more.


## Notes

Some parts of realworld specs are slightly weird, but I've followed 
* Auth 
  - no separation of concerns, we're mixing responsibilities with CRUD functionality for user
  - no proper support of bearer token (there is an GH issue already), instead `Token` is being user
* User
  - `PUT` user has `PATCH` semantics actually
  - why is token part of the user entity?
 
 ## Local infra (WIP)

 To provide a s3 instance locally one can make use of [localstack](https://localstack.cloud/).

 A short breakdown to get it working:

- After installing and starting `localstack` create a new IAM user
   `awslocal iam create-user --user-name test`
- Create an access key: `awslocal iam create-access-key --user-name test`
- Set env vars to update current user:
  `setx AWS_ACCESS_KEY_ID <ACCESS_KEY>` or `export AWS_ACCESS_KEY_ID=<ACCESS_KEY>`
  `setx AWS_SECRET_ACCESS_KEY <SECRET_KEY>`
- You can verify the current user via `awslocal sts get-caller-identity`
- Create a s3 bucket:
  `awslocal s3api create-bucket --bucket simplefeed-avatar`

