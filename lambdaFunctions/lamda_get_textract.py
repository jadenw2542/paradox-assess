import boto3

def lambda_handler(event, context):
    textract = boto3.client('textract')
    
    job_id = event['jobId']
    
    # Get all pages of results
    text_blocks = []
    next_token = None
    
    while True:
        if next_token:
            response = textract.get_document_text_detection(
                JobId=job_id,
                NextToken=next_token
            )
        else:
            response = textract.get_document_text_detection(JobId=job_id)
        
        # Extract text from LINE blocks
        for block in response.get('Blocks', []):
            if block['BlockType'] == 'LINE':
                text_blocks.append(block['Text'])
        
        next_token = response.get('NextToken')
        if not next_token:
            break
    
    return {
        'text': '\n'.join(text_blocks)
    }