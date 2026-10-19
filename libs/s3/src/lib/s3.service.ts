import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3'
import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { randomUUID } from 'crypto'

@Injectable()
export class S3Service {
  private client?: S3Client

  constructor(private readonly configService: ConfigService) {}

  get enabled(): boolean {
    return this.configService.get<boolean>('s3.enabled') === true
  }

  /**
   * Uploads a publicly readable file and returns its URL, or `undefined`
   * when uploads are disabled.
   */
  async uploadPublicFile(data: Buffer, filename?: string): Promise<string | undefined> {
    if (!this.enabled) {
      return undefined
    }
    const endpoint: string = this.configService.get('s3.endpoint')
    const bucket: string = this.configService.get('s3.bucketName')
    const key = `${randomUUID()}-${filename || 'avatar'}`
    await this.getClient(endpoint).send(
      new PutObjectCommand({ Bucket: bucket, Key: key, Body: data })
    )
    return `${endpoint.replace(/\/$/, '')}/${bucket}/${encodeURIComponent(key)}`
  }

  private getClient(endpoint: string): S3Client {
    if (!this.client) {
      this.client = new S3Client({
        endpoint,
        region: this.configService.get('s3.region'),
        forcePathStyle: true,
      })
    }
    return this.client
  }
}
