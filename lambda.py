import json
import boto3

def extract_text(bucket, key):
    textract = boto3.client('textract')
    response = textract.detect_document_text(
        Document={
            'S3Object': {
                'Bucket': bucket,
                'Name': key
            }
        }
    )
    text = ''
    for block in response['Blocks']:
        if block['BlockType'] == 'LINE':
            text += block['Text'] + '\n'
    return text

def generate_quiz(text, quiz_type, question_type, num_questions):
    
    bedrock = boto3.client('bedrock-runtime')
    model_id = "AWS BEDROCK MODEL ID"

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
    bucket = event['bucket']
    key = event['key']
    quiz_type = event['quiz_type']  # 'multiple choice' or 'open ended'
    question_type = event['question_type']  # 'recall', 'analysis', or 'scenario'
    num_questions = event['num_questions']

    extracted_text = extract_text(bucket, key)
    response_body = generate_quiz(extracted_text, quiz_type, question_type, num_questions)  

    if response_body["stop_reason"] != "end_turn":
        return {
            'statusCode': 500,
            'body': json.dumps("Ran out of tokens")
        }

    return {
        'statusCode': 200,
        'body': json.dumps(response_body["content"][0]["text"])
    }
