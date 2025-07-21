from datetime import datetime
import json
from psycopg2 import sql
import logging

from src.receipts.services.images import process_in_store, process_receipt
from src.services.user import get_user
from src.services.openai import OpenAIService
from src.services.database import SparkDBConnection

def upcert_in_store(user_identity, item):
    try:
        client = OpenAIService.get_value()
        model = "text-embedding-3-small"

        text = json.dumps(item)
        metadata = json.dumps({
            "embeddingModel": model,
            "item": item
        })
        
        embedding = get_embedding(client=client, text=text, model=model)

        conn = SparkDBConnection().get_connection()
        user = get_user(conn=conn, user_identity=user_identity)
        user_id = user['id']

        with conn.cursor() as cursor:
            upsert_in_store_embeddings(cursor=cursor, user_id=user_id, embedding=embedding, text=text, metadata=metadata)
        conn.commit()
        cursor.close()
        conn.close()

        return True
    except Exception as e:
         logging.log(e)
         return False
    

async def upcert_receipt(user_identity, file):
    items = await process_receipt(file)
    client = OpenAIService.get_value()
    model = "text-embedding-3-small"
    
    processed_content = [
        {
            "page_content": {
                **item
            },
            "metadata": {
                "embeddingModel": model,
                **item
            }
        }
        for item in items
    ]

    texts = [json.dumps(content["page_content"]) for content in processed_content]
    metadata = [content["metadata"] for content in processed_content]
    
    embeddings = get_embeddings(client=client, texts=texts, model=model)

    conn = SparkDBConnection().get_connection()
    user = get_user(conn=conn, user_identity=user_identity)
    user_id = user['id']

    with conn.cursor() as cursor:
        upsert_embeddings(cursor=cursor, user_id=user_id, embeddings=embeddings, texts=texts, metadata=metadata)
    conn.commit()
    cursor.close()
    conn.close()

    response = {
        "message": "Cool, it worked!",
    }
    return response

def get_embedding(client, text, model="text-embedding-3-small"):
    response = client.embeddings.create(input=text, model=model)
    return response.data[0].embedding

def get_embeddings(client, texts, model="text-embedding-3-small"):
    embeddings = []
    for text in texts:
        response = client.embeddings.create(input=text, model=model)
        embeddings.append(response.data[0].embedding)
    return embeddings

def upsert_embeddings(cursor, user_id, embeddings, texts, metadata):
    
        for embedding, text, meta in zip(embeddings, texts, metadata):

            meta_json = json.dumps(meta)
            query = sql.SQL("""
                INSERT INTO public.vector_embeddings (user_id, embedding, document, metadata, created_at)
                VALUES (%s, %s, %s, %s, %s)
            """)
            created_at = datetime.now()
            cursor.execute(query, (user_id, embedding, text, meta_json, created_at))

def upsert_in_store_embeddings(cursor, user_id, embedding, text, metadata):

        meta_json = json.dumps(metadata)
        query = sql.SQL("""
            INSERT INTO public.vector_embeddings (user_id, embedding, document, metadata, created_at)
            VALUES (%s, %s, %s, %s, %s)
        """)
        created_at = datetime.now()
        cursor.execute(query, (user_id, embedding, text, meta_json, created_at))
    