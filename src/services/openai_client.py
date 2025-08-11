import os
from dotenv import load_dotenv
load_dotenv()
import logging
from openai import OpenAI

openai_api_key = os.getenv("OPENAI_API_KEY")
client = OpenAI(api_key=openai_api_key)

def text_to_llm(message: str, model: str = "gpt-5"):

    response = client.responses.create(
        model=model,
        input=message
    )

    return response.output_text