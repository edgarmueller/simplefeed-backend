import { ConsoleLogger, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { S3 } from 'aws-sdk';
import { v4 as uuid } from 'uuid';
 
@Injectable()
export class S3Service {
  constructor(
    private readonly configService: ConfigService
  ) {}
 
  async uploadPublicFile(dataBuffer: Buffer, filename: string) {
    const s3 = new S3({
      endpoint: {
        host: 'localhost:4566',
        href: 'http://localhost:4566',
        port: 4566,
        hostname: 'localhost',
        protocol: 'http:'
      },
      s3ForcePathStyle: true
    });
    const uploadResult = await s3.upload({
      Bucket: this.configService.get('AWS_PUBLIC_BUCKET_NAME'),
      Body: dataBuffer,
      Key: `${uuid()}-${filename}`
    })
      .promise();
 
    return uploadResult;
  }
}