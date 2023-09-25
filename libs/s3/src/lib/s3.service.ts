import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { S3 } from 'aws-sdk';
import { v4 as uuid } from 'uuid';
 
@Injectable()
export class S3Service {
  constructor(
    private readonly configService: ConfigService
  ) {}
 
  async uploadPublicFile(dataBuffer: Buffer, filename: string) {
    if (!this.configService.get<boolean>('s3.enabled')) {
      return
    }
    const s3 = new S3({
      // TODO
      endpoint: {
        host:  this.configService.get('s3.host'),
        href: this.configService.get('s3.href'),
        port: this.configService.get('s3.port'),
        hostname: this.configService.get('s3.hostname'),
        protocol: this.configService.get('s3.protocol'),
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