
# simplefeed-backend

Backend for a naive social network including notifications and chat.
This project does not claim to be finished, complete or thoroughly tested.

Also see https://github.com/edgarmueller/simplefeed-frontend.

## Getting started

0. Run `npm i`
1. Start required infra: `npm infra:up`
2. Create schema `npm run schema:create`
3. Start app in dev mode via `npm run dev`. The server will run on port 5000.

## Layout

This project utilizes a nx mono repo layout.
As such, reusable libraries have been placed under `libs`

## Deploy

### via fly.io 
Once authenticated with fly.io, run `fly deploy`.

### Secrets
Run `fly secrets set KEY=$VALUE`

# Local infra 

 ### s3

 To provide a s3 instance locally one can make use of [localstack](https://localstack.cloud/).

 A short breakdown to get it working:

- After installing and starting `localstack` create a new IAM user
   `awslocal iam create-user --user-name test`
- Create an access key: `awslocal iam create-access-key --user-name test`
- Set env vars to update current user:
  `setx AWS_ACCESS_KEY_ID <ACCESS_KEY>` or `export AWS_ACCESS_KEY_ID=<ACCESS_KEY>`
  `setx AWS_SECRET_ACCESS_KEY=<SECRET_KEY>` or `export AWS_SECRET_ACCESS_KEY=<SECRET_KEY>`
- You can verify the current user via `awslocal sts get-caller-identity`
- Create a s3 bucket:
  `awslocal s3api create-bucket --bucket simplefeed-avatar`

### elastic

Listing by username:

`curl -X GET http://localhost:9200/users/_search\?q\=$USERNAME | jq .`

Delete by id:

`curl -X DELETE http://localhost:9200/users/_doc/$ID`