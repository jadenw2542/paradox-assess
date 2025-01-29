#Input: s3 doc
#Output: textract job id, 
#generate new-quiz button , checks if s3 key is in dynamodb, and generates quiz 
# on delete, deletes textract in dynamodb and s3

#dynamo db
# key: s3 file name
# val : texttract textimport boto3
import json
import boto3

def lambda_handler(event, context):
    bucket = event['bucket']
    key = event['key']
    
    textract = boto3.client('textract')
    response = textract.start_document_text_detection(
        DocumentLocation={
            'S3Object': {
                'Bucket': bucket,
                'Name': key
            }
        }
    )
    return {'JobId': response['JobId']}
