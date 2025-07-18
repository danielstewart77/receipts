from src.services.user import get_user
from src.services.openai import OpenAIService
from src.services.database import SparkDBConnection
import numpy as np
import markdown

def receipts_by_user(query, user_identity, *args, **kwargs):
    try:
        client = OpenAIService.get_value()
        query_vector = get_embedding(client=client, query=query)
        
        conn = SparkDBConnection().get_connection()
        cursor = conn.cursor()

        user = get_user(conn, user_identity)
        results = fetch_filtered_results(cursor, user['id'])
        similarities = calculate_similarities(results, query_vector)
        receipt_items = retrieve_receipt_items(cursor, similarities)
        
        cursor.close()
        conn.close()
        
        response = generate_response(client, receipt_items, query)
        return markdown_format(response=response)
    
    except Exception as e:
        print(f"An error occurred: {e}")
        return None

def receipts(query, *args, **kwargs):
    try:
        client = OpenAIService.get_value()
        query_vector = get_embedding(client=client, query=query)
        
        conn = SparkDBConnection().get_connection()
        cursor = conn.cursor()
        
        results = fetch_filtered_results(cursor, None)
        similarities = calculate_similarities(results, query_vector)
        receipt_items = retrieve_receipt_items(cursor, similarities)
        
        cursor.close()
        conn.close()
        
        response = generate_response(client, receipt_items, query)
        return markdown_format(response=response)
    
    except Exception as e:
        print(f"An error occurred: {e}")
        return None

def fetch_filtered_results(cursor, user_id):
    #Fetch results from the database based on the provided filters.

    sql_query = "SELECT id, embedding FROM public.vector_embeddings WHERE 1=1"
    params = []
    if user_id:
        sql_query += " AND user_id = %s"
        params.append(user_id)

    cursor.execute(sql_query, params)
    return cursor.fetchall()

def calculate_similarities(results, query_vector):
    #Calculate cosine similarity for each result.

    similarities = []
    for id, embedding in results:
        # embedding = json.loads(embedding)
        similarity = cosine_similarity(np.array(query_vector), np.array(embedding))
        similarities.append((id, similarity))
    similarities.sort(key=lambda x: x[1], reverse=True)
    return similarities

def retrieve_receipt_items(cursor, similarities):

    receipt_items = "Answer the question based only on these items on my receipt: "
    for id, similarity in similarities:
        if similarity > 0.01: # after converting document column to JSON we can select document->>'item', etc
            sql_query = """
                SELECT
                    document
                FROM public.vector_embeddings
                WHERE id = %s;
            """
            cursor.execute(sql_query, (id,))
            result = cursor.fetchone()
            if result: # after converting this column to JSON, we can do: item: {result['item']}, price: {result['price']}, store: {result['store']}\
                receipt_items += f"{result}\n"
    return receipt_items

def generate_response(client, receipt_items, query):
    """
    Generate response from OpenAI based on document details and query.
    """
    response = client.chat.completions.create(
        model="gpt-4o",
        messages=[
            {"role": "system", "content": receipt_items},
            {"role": "user", "content": query}
        ],
        temperature=0,
        #max_tokens=4096
    )
    return response.choices[0].message.content

def get_embedding(client, query):
    """
    Embed text using OpenAI's text-embedding model.
    """
    response = client.embeddings.create(
        model="text-embedding-3-small",
        input=query
    )
    return response.data[0].embedding

def cosine_similarity(v1, v2):
    """
    Calculate cosine similarity between two vectors.
    """
    return np.dot(v1, v2) / (np.linalg.norm(v1) * np.linalg.norm(v2))

def markdown_format(response):
    response = response.replace("\n", "<br>")
        
    after_markdown = markdown.markdown(response, extensions=[
        'markdown.extensions.fenced_code',
        'markdown.extensions.smarty',
        'markdown.extensions.nl2br',
        'markdown.extensions.sane_lists',
        'markdown.extensions.tables'
        ])
    return after_markdown