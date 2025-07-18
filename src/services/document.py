from services.openai import OpenAIService
from openai import NotFoundError
import time
import json
import markdown

def answer_propel_question(question):
    client = OpenAIService.get_value()
    assistant = client.beta.assistants.retrieve(assistant_id='asst_vkoHyq57K04NaCew7Zx3UlIO')

    thread = client.beta.threads.create(
        messages=[
            {
            "role": "user",
            "content": question,
            }
        ]
    )

    run = client.beta.threads.runs.create(
            thread_id=thread.id,
            assistant_id=assistant.id
        )

    while run.status != 'completed' and run.status != 'failed':
        time.sleep(1)
        run = client.beta.threads.runs.retrieve(
            thread_id=thread.id,
            run_id=run.id
        )
        print(f"run status: {run.status}")

    message = client.beta.threads.messages.list(
        thread_id=thread.id,
    )

    client.beta.threads.delete(thread_id=thread.id)

    content = message.data[0].content[0].text.value
    return markdown.markdown(content, extensions=['markdown.extensions.toc','markdown.extensions.smarty','markdown.extensions.nl2br'])

def process_document(file, purpose, *args, **kwargs):
    client = OpenAIService.get_value()
    file = client.files.create(
        file=file.read(),
        purpose='assistants'
    )

    assistant_toc = client.beta.assistants.create(
        model="gpt-4-1106-preview",
        instructions=get_agent_instructions_toc(),
            tools=[{"type": "retrieval"}],
            file_ids=[file.id]
    )

    assistant_sections = client.beta.assistants.create(
        model="gpt-3.5-turbo-1106",
        instructions=get_agent_instructions_section(),
            tools=[{"type": "retrieval"}],
            file_ids=[file.id]
    )

    toc = assistant_run(client=client, assistant=assistant_toc, file_id=file.id, content="")
    try:
        document_object = json.loads(toc)
    except Exception as e:
        return f"Error: {e}"

    sections = []

    for section in document_object:
        complete_section = assistant_run(client=client, assistant=assistant_sections, file_id=file.id, content=section["name"])
        try:
            section['content'] = complete_section
        except Exception as e:
            print(e)

    # delete document
    docs = client.files.list()
    for doc in docs:
        print(f"deleting: {doc.filename} id:{doc.id}")
        client.files.delete(file_id=doc.id)

    # delete assistant
    assistants = client.beta.assistants.list()
    number_of_assistanst = len(assistants.data)
    dumb_hack = number_of_assistanst - 1
    if number_of_assistanst > 1:
        for assistant in assistants:
            if dumb_hack > 0:
                print(f"Attempting to delete assistant: {assistant.id}")
                try:
                    client.beta.assistants.delete(assistant_id=assistant.id)
                except NotFoundError as e:
                    print(f"Assistant not found: {assistant.id}. Error: {e}")
                except Exception as e:
                    print(f"An error occurred: {e}")
                finally:
                    dumb_hack -= 1
                    continue

    return document_object


def get_metadata(file):
    
    return {""}

def assistant_run(client, assistant, file_id, content):
    thread = client.beta.threads.create(
        messages=[
            {
            "role": "user",
            "content": content,
            "file_ids": [file_id]
            }
        ]
    )

    run = client.beta.threads.runs.create(
        thread_id=thread.id,
        assistant_id=assistant.id
    )

    while run.status != 'completed' and run.status != 'failed':
        time.sleep(1)
        run = client.beta.threads.runs.retrieve(
            thread_id=thread.id,
            run_id=run.id
        )
        print(f"run status: {run.status}")

    message = client.beta.threads.messages.list(
        thread_id=thread.id,
    )

    # delete threads
    print(f"deleting thread: {thread.id}")
    client.beta.threads.delete(thread_id=thread.id)

    content = message.data[0].content[0].text.value
    return content

def get_agent_instructions_toc():
    return '''You are a turse, data extraction bot. 
        1) Extract the table of contents from the document provided by the user.
        2) Treat subsections as sections (eg: a section 1.2 should be it's own section, not part of section 1)
        2) Return the extracted data in the following json format:
        [{
        "name": "the title of the section identified in the table of contents"
        },]
        3) Make no comments
        4) Do not provide sources
        5) Only return raw json with no ```json ``` block quotes'''

def get_agent_instructions_section():
    return f'''
        You are a turse, data extraction bot. 
        1) Extract the contents of a document's section provided by the user''' + '''
        2) Treat subsections as sections (eg: a section 1.2 should be it's own section, not part of section 1)
        3) Extract the entire section, do not truncate
        4) Return only the raw text, in string format
        5) Do not make comments
        6) Do not provide sources'''