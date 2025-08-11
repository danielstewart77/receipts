import datetime

from services.rag import receipts_by_user
from services.openai_client import text_to_llm

def chat_with_receipts(message: str, user_identity: str):
    current_date = f"current date: {datetime.datetime.now()} "
    message = current_date + message

    # give the RAG pipeline the message and the datetime
    receipts = receipts_by_user(message=message, user_identity=user_identity)
    receipts_str = receipts if receipts is not None else ""

    return text_to_llm(message=(current_date + message + receipts_str), model="gpt-4.1")