#!/bin/sh
# Runs inside the LocalStack container once it is ready.
awslocal s3api create-bucket --bucket simplefeed-avatar
awslocal s3api put-bucket-policy --bucket simplefeed-avatar --policy '{
  "Version": "2012-10-17",
  "Statement": [{
    "Effect": "Allow",
    "Principal": "*",
    "Action": "s3:GetObject",
    "Resource": "arn:aws:s3:::simplefeed-avatar/*"
  }]
}'
