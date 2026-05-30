
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routes import router as api_router
from routes.ai_routes import router as ai_router
from routes.presentation_routes import router as presentation_router
from routes.session_routes import router as session_router
from routes.notification_routes import router as notification_router   # ← NEW
from pymongo import MongoClient
from routes.authroutes import set_users_collection
from routes.feedback_routes import set_feedback_collection
from routes.contact_routes import set_contacts_collection
from database import db

users_collection    = db["users"]
feedback_collection = db["feedback"]
contact_collection  = db["contacts"]

set_contacts_collection(contact_collection)
set_users_collection(users_collection)
set_feedback_collection(feedback_collection)

app = FastAPI()

print("DB INITIALIZED SUCCESSFULLY")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Routes ───────
app.include_router(api_router,           prefix="/api")
app.include_router(ai_router,            prefix="/api")
app.include_router(presentation_router,  prefix="/api")
app.include_router(session_router,       prefix="/api")
app.include_router(notification_router,  prefix="/api")              


@app.get("/")
def home():
    return {"status": "Backend running"}