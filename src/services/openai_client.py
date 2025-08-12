import os
from dotenv import load_dotenv
load_dotenv()
import logging
from openai import OpenAI

openai_api_key = os.getenv("OPENAI_API_KEY")
client = OpenAI(api_key=openai_api_key)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def text_to_llm(message: str, model: str = "gpt-5"):

    response = client.responses.create(
        model=model,
        input=message
    )

    logger.info(f"OpenAI API response: {response.output_text}")

    return response.output_text