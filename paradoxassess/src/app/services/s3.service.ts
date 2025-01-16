import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, from } from 'rxjs';
import { S3Client, PutObjectCommand, DeleteObjectCommand, ListObjectsV2Command } from '@aws-sdk/client-s3';
import { environment } from '../../environments/environment';


@Injectable({
  providedIn: 'root'
})
export class S3Service {
  private s3Client: S3Client;
  
  constructor(private http: HttpClient) {
    this.s3Client = new S3Client({
      region: environment.awsRegion,
      credentials: {
        accessKeyId: environment.awsAccessKeyId,
        secretAccessKey: environment.awsSecretAccessKey
      }
    });
  }

  async uploadFile(file: File): Promise<string> {
    try {
      const command = new PutObjectCommand({
        Bucket: environment.s3BucketName,
        Key: `${Date.now()}-${file.name}`,
        Body: file,
        ContentType: file.type
      });

      const response = await this.s3Client.send(command);
      return response.ETag || 'Upload successful';
    } catch (error) {
      console.error('Error uploading file:', error);
      throw error;
    }
  }

  async deleteFile(fileName: string): Promise<string> {
    try {
      const command = new DeleteObjectCommand({
        Bucket: environment.s3BucketName,
        Key: fileName,
      });

      const response = await this.s3Client.send(command);
      return `${fileName} deleted`;
    } catch (error) {
      console.error('Error deleting file:', error);
      throw error;
    }
  }

  async listFiles(): Promise<string[]> {
    try {
      const command = new ListObjectsV2Command({
        Bucket: environment.s3BucketName,
        Prefix: ''
      });

      const response = await this.s3Client.send(command);
      console.log(response);
      return (response.Contents || [])
        .map(item => item.Key || '')
        .filter(key => key !== '');

    } catch (error) {
      console.error('Error listing files:', error);
      throw error;
    }
  }
}