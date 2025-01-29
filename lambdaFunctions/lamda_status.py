import boto3

def lambda_handler(event, context):
    textract = boto3.client('textract')
    
    job_id = event['jobId']
    
    response = textract.get_document_text_detection(JobId=job_id)
    
    return {
        'jobStatus': response['JobStatus']
    }
