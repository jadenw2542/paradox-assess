import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, from } from 'rxjs';
import { S3Client, PutObjectCommand, DeleteObjectCommand, ListObjectsV2Command } from '@aws-sdk/client-s3';
import {DynamoDBClient, DeleteItemCommand, GetItemCommand} from "@aws-sdk/client-dynamodb";
import { environment } from '../../environments/environment';


@Injectable({
  providedIn: 'root'
})
export class S3Service {
  private s3Client: S3Client;
  private dynamoDBClient : DynamoDBClient;
  
  constructor(private http: HttpClient) {
    this.s3Client = new S3Client({
      region: environment.awsRegion,
      credentials: {
        accessKeyId: environment.awsAccessKeyId,
        secretAccessKey: environment.awsSecretAccessKey
      }
    });
    this.dynamoDBClient = new DynamoDBClient({
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

  async deleteDynamoDBItem(fileName: string): Promise<void> {
    try {
      const command = new DeleteItemCommand({
        TableName: environment.dynamoDBTable, 
        Key: {
          FileKey: { S: fileName }
        }
      });

      await this.dynamoDBClient.send(command);
      console.log(`Item ${fileName} deleted from DynamoDB`);
    } catch (error) {
      console.error('Error deleting item from DynamoDB:', error);
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
      await this.deleteDynamoDBItem(fileName);
      return `${fileName} deleted`;  
      
    } catch (error) {
      console.error('Error deleting file:', error);
      throw error;
    }
  }

  async checkFileInDynamoDB(fileName: string): Promise<boolean> {
    try {
      const command = new GetItemCommand({
        TableName: environment.dynamoDBTable, 
        Key: {
          FileKey: { S: fileName }
        }
      });

      const response = await this.dynamoDBClient.send(command);
      return !!response.Item; // Returns true if the item exists, false otherwise
    } catch (error) {
      console.error('Error checking file in DynamoDB:', error);
      throw error;
    }
  }

  async listFiles(): Promise<{ fileName: string, isInDynamoDB: boolean }[]> {
    try {
      const command = new ListObjectsV2Command({
        Bucket: environment.s3BucketName,
        Prefix: ''
      });
  
      const response = await this.s3Client.send(command);
      const files = (response.Contents || [])
        .map(item => item.Key || '')
        .filter(key => key !== '');
  
      // Check each file's status in DynamoDB
      const filesWithStatus = await Promise.all(
        files.map(async (fileName) => {
          const isInDynamoDB = await this.checkFileInDynamoDB(fileName);
          return { fileName, isInDynamoDB };
        })
      );
  
      return filesWithStatus;
    } catch (error) {
      console.error('Error listing files:', error);
      throw error;
    }
  }
}