from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

router = APIRouter()

messages_collection = None

def set_messages_collection(collection):
    global messages_collection
    messages_collection = collection


class ChatMessage(BaseModel):
    sender: str
    text: str


@router.post("/send-message")
def send_message(message: ChatMessage):
    if messages_collection is None:
        raise HTTPException(status_code=500, detail="Messages collection not initialized")
    
    result = messages_collection.insert_one(message.dict())

    return {
        "status": "success",
        "message_id": str(result.inserted_id),
        "data": message.dict()
    }


@router.get("/messages")
def get_messages():
    if messages_collection is None:
        raise HTTPException(status_code=500, detail="Messages collection not initialized")

    msgs = list(messages_collection.find({}, {"_id": 0}))

    return {"messages": msgs}