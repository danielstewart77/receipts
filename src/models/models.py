def oai_model():
    return {
        "openapi": "3.0.0",
        "info": {
            "title": "Google Calendar Event Creation API",
            "version": "1.0.1"
        },
        "servers": [{"url": "https://dtmgpt.azurewebsites.net"}],
        "paths": {
            "/calendarevents":{
                "get":{
                    "description": "Get the next 10 events on the user's calendar",
                    "operationId": "getEvents",
                    "deprecated": False,
                    "parameters": [
                        {
                            "description": "A 24-character, URL-safe token unique to the session",
                            "in": "query",
                            "name": "Gpt-Session-Token",
                            "required": True,
                            "schema": {
                                "type": "string",
                                "pattern": "^[A-Za-z0-9_-]{24}$"
                            }
                        }
                    ]
                }
            },
            "/calendarevent": {
                "post": {
                    "summary": "Create a new event",
                    "operationId": "createEvent",
                    "parameters": [
                        {
                            "name": "event",
                            "in": "query",
                            "description": "a description of the event and all details including any tasks to steps to be taken",
                            "required": True,
                                "schema": {
                                "type": "string"
                            },
                        },
                        {
                            "description": "A 24-character, URL-safe token unique to the session",
                            "in": "query",
                            "name": "Gpt-Session-Token",
                            "required": True,
                            "schema": {
                                "type": "string",
                                "pattern": "^[A-Za-z0-9_-]{24}$"
                            }
                        },
                    ],
                    "deprecated": False,
                    "requestBody": {
                        "required": True,
                        "content": {
                            "application/json": {
                                "schema": {
                                    "type": "object",
                                    "properties": {
                                        "summary": {
                                            "type": "string"
                                        },
                                        "location": {
                                            "type": "string"
                                        },
                                        "event_description": {
                                            "type": "string"
                                        },
                                        "start": {
                                            "type": "object",
                                            "properties": {
                                                "dateTime": {
                                                    "type": "string"
                                                },
                                                "timeZone": {
                                                    "type": "string"
                                                }
                                            }
                                        },
                                        "end": {
                                            "type": "object",
                                            "properties": {
                                                "dateTime": {
                                                    "type": "string"
                                                },
                                                "timeZone": {
                                                    "type": "string"
                                                }
                                            }
                                        },
                                        "attendees": {
                                            "type": "array",
                                            "items": {
                                                "type": "object",
                                                "properties": {
                                                    "email": {
                                                    "type": "string"
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    },
                    "responses": {
                        "200": {
                            "description": "Event created successfully",
                            "content": {
                                "application/json": {
                                    "schema": {
                                        "type": "object",
                                        "properties": {
                                            "id": {
                                            "type": "string"
                                            },
                                            "status": {
                                            "type": "string"
                                            }
                                        }
                                    }
                                }
                            }
                        },
                        "400": {
                            "description": "Bad request"
                        }
                    }
                }
            }
        },
        "security": [
                {
                "OAuth2": [
                    "https://www.googleapis.com/auth/calendar"
                ]
            }
        ]
    }