# elastic

This library was generated with [Nx](https://nx.dev).

## Running unit tests

Run `nx test elastic` to execute the unit tests via [Jest](https://jestjs.io).

## FAQ

### How can I list the index?
`curl -X GET http://localhost:9200/users/_search\?q\=$SEARCHTERM | jq .`

### How can I delete users from the index?

`curl -X DELETE http://localhost:9200/users/_doc/$USER_ID`
