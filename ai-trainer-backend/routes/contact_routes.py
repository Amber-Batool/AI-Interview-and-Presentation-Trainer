from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

router = APIRouter()

contacts_collection = None

def set_contacts_collection(collection):
    global contacts_collection
    contacts_collection = collection


class ContactForm(BaseModel):
    name: str
    email: str
    message: str


@router.post("/contact")
def submit_contact(form: ContactForm):
    if contacts_collection is None:
        raise HTTPException(status_code=500, detail="Contacts collection not initialized")

    result = contacts_collection.insert_one(form.dict())

    return {
        "status": "success",
        "id": str(result.inserted_id)
    }


@router.get("/contact")
def get_contacts():
    if contacts_collection is None:
        raise HTTPException(status_code=500, detail="Contacts collection not initialized")

    contacts = list(contacts_collection.find({}, {"_id": 0}))

    return {"contacts": contacts}