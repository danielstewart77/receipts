import os
from dotenv import load_dotenv
load_dotenv()
import logging
from openai import OpenAI

class OpenAIService:
    _instance = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(OpenAIService, cls).__new__(cls)
            cls._instance._initialize()
        return cls._instance

    def _initialize(self):
        self.client = None
        openai_api_key = os.getenv("OPENAI_API_KEY")
        try:
            self.client = OpenAI(api_key=openai_api_key, default_headers={"OpenAI-Beta": "assistants=v2"})
        except Exception as e:
            logging.exception(e)
            
        self.client.api_type = "open_ai"
        self.client.api_base = "https://api.openai.com/v2/"
        self.client.api_version = "v2"

    @staticmethod
    def get_value():
        instance = OpenAIService()
        return instance.client