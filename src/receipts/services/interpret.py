import json
import datetime


from src.services.rag import receipts_by_user
from src.services.openai import OpenAIService

def interpret_query(query, user_identity):
    #get the correct open ai client
    client = OpenAIService.get_value()

    messages = [{"role": "user", "content": query}]
    tools = [
        {
            "type": "function",
            "function": {
                "name": "receipts_by_user",
                "description": f"""When a user wants to know something about their own (personal) shopping purchase history.
                The current date is {datetime.datetime.now()}""",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "query": {
                            "type": "string",
                            "description": "Any question the user is asking",
                        }
                    },
                    "required": ["query"],
                },
            },
        },
    ]
    response = client.chat.completions.create(
        model="gpt-4o",
        messages=messages,
        tools=tools,
        tool_choice="auto",
    )
    response_message = response.choices[0].message
    tool_calls = response_message.tool_calls
    # Step 2: check if the model wanted to call a function
    if tool_calls:
        # Step 3: call the function
        available_functions = {
            "receipts_by_user": receipts_by_user,
        }
        messages.append(response_message)  # extend conversation with assistant's reply
        # Step 4: send the info for each function call and function response to the model                 

        for tool_call in tool_calls:
            function_name = tool_call.function.name
            function_to_call = available_functions[function_name]
            function_args = json.loads(tool_call.function.arguments)

            query_arg = None
            destination_arg = None
            if "query" in function_args:
                query_arg = function_args["query"]

            function_response = function_to_call(
                message=query_arg,
                user_identity=user_identity,
            )
            return function_response