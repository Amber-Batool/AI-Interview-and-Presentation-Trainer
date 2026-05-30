from fastapi import APIRouter
from pydantic import BaseModel
from datetime import datetime

router = APIRouter()

feedback_collection = None

def set_feedback_collection(collection):
    global feedback_collection
    feedback_collection = collection

class Feedback(BaseModel):
    name: str
    email: str
    message: str

@router.post("/feedback")
def save_feedback(data: Feedback):
    feedback = {
        "name": data.name,
        "email": data.email,
        "message": data.message,
        "created_at": datetime.utcnow()
    }
    result = feedback_collection.insert_one(feedback)
    return {
        "message": "Feedback saved",
        "id": str(result.inserted_id)
    }

@router.get("/feedback")
def get_feedback():
    feedbacks = list(
        feedback_collection.find({}, {"_id": 0, "name": 1, "email": 1, "message": 1})
        .sort("created_at", -1)
        .limit(10)
    )
    return {"feedbacks": feedbacks}