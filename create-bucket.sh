#!/bin/sh

# TODO
localstack start
awslocal iam create-user --user-name test
awslocal iam create-access-key --user-name test

