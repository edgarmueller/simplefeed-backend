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
      endpoint: this.configService.get('s3.endpoint'),
      s3ForcePathStyle: true
    });
    const uploadResult = await s3.upload({
      Bucket: this.configService.get('s3.bucketName'),
      Body: dataBuffer,
      Key: `${uuid()}-${filename}`
    })
      .promise();
 
    return uploadResult;
  }
}