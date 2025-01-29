import json
import base64
import logging
import boto3
import os

def generate_quiz(text, quiz_type, question_type, num_questions):
    
    bedrock = boto3.client('bedrock-runtime')
    model_id = "arn:aws:bedrock:us-east-1:767828734529:application-inference-profile/f7stwbhmo0sy"
    instance_profile = "us.anthropic.claude-3-5-sonnet-20241022-v2:0"

    prompt = ""
    base_prompt = f"""Generate a {quiz_type} quiz with {num_questions} {question_type}-based questions from the following content. 
    Content: {text}

    Instructions:
    - Each question should specifically focus on {question_type} aspects.
    - Make it relevant to the provided content
    - Respond **ONLY** with a valid JSON object that includes all questions in a list and nothing else.
    """

    if quiz_type == "multiple choice":
        prompt = base_prompt + """
        Format each question as a JSON object with this exact structure:
            {
                "question": "A clear, focused question",
                "correct_answer": "The correct option",
                "options": ["correct option", "incorrect option 1", "incorrect option 2", "incorrect option 3"],
                "explanations": {
                    "correct option": "Detailed explanation why this is correct",
                    "incorrect option 1": "Explanation why this is wrong",
                    "incorrect option 2": "Explanation why this is wrong",
                    "incorrect option 3": "Explanation why this is wrong"
                }
            }
        Here is an example: 
        {
            "question": "What is the powerhouse of the cell?",
            "correct_answer": "Mitochondria",
            "options": ["Mitochondria", "Nucleus", "Ribosome", "Golgi apparatus"],
            "explanations": {
                "Mitochondria": "The mitochondria generate energy in the form of ATP.",
                "Nucleus": "The nucleus stores genetic material but does not generate energy.",
                "Ribosome": "Ribosomes synthesize proteins, not energy.",
                "Golgi apparatus": "The Golgi apparatus processes and packages proteins but does not generate energy."
            }
        }
        """
    else:  # open_ended
        prompt = base_prompt + """
        Format each question as a JSON object with this exact structure:
            {
                "question": "A thought-provoking question",
                "sample_answer": "A detailed sample answer that demonstrates key points",
            }
        """
    

    body = json.dumps({
        "anthropic_version": "bedrock-2023-05-31",
        "max_tokens": 5000,
        "top_k": 250,
        "stop_sequences": [],
        "temperature": 1,
        "top_p": 0.999,
        "messages": [
        {
            "role": "user",
            "content": [
            {
                "type": "text",
                "text":  prompt
            }
            ]
        }
        ]

    })

    accept = "application/json"
    content_type = "application/json"

    response = bedrock.invoke_model(
        body=body, 
        modelId=model_id, 
        accept=accept, 
        contentType=content_type
    )

    response_body = json.loads(response.get("body").read())

    if 'error' in response_body:
        raise Exception(f"Text generation error: {response_body['error']}")
        
    return response_body
    

def lambda_handler(event, context):
    # Parse input
    #body = json.loads(event['body'])
    bucket = event['bucket']
    key = event['key']
    quiz_type = event['quiz_type']  # 'multiple choice' or 'open ended'
    question_type = event['question_type']  # 'recall', 'analysis', or 'scenario'
    num_questions = event['num_questions']
    print(key)

    if not all([bucket, key, quiz_type, question_type, num_questions]):
        return {
            'statusCode': 400, 
            'body': json.dumps("Missing required input parameters")
        }

    dynamoDB = boto3.client('dynamodb')

    # Retrieve the item from DynamoDB
    response = dynamoDB.get_item(
        TableName=os.environ['dynamoDBTable'],
        Key={
            'FileKey': {
                'S': key
            }
        }
    )

    # Check if the item exists
    if 'Item' not in response:
        return {
            'statusCode': 404,
            'body': json.dumps("File not found in DynamoDB")
        }
    
    # Extract the 'text' field from the DynamoDB response
    extracted_text = response['Item'].get('text', {}).get('S', '')
    if not extracted_text:
        return {
            'statusCode': 404,
            'body': json.dumps("Text field not found in DynamoDB item")
        }
    #print(extracted_text)

    response_body = generate_quiz(extracted_text, quiz_type, question_type, num_questions)

    #print(response_body)
    # print(f"Input token count: {response_body['inputTextTokenCount']}")

    # for result in response_body['results']:
    #     print(f"Token count: {result['tokenCount']}")
    #     print(f"Output text: {result['outputText']}")
    #     print(f"Completion reason: {result['completionReason']}")    

    if response_body["stop_reason"] != "end_turn":
        return {
            'statusCode': 500,
            'body': json.dumps("Ran out of tokens")
        }

    return {
        'statusCode': 200,
        'body': json.dumps(response_body["content"][0]["text"])
    }
