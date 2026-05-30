from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from passlib.context import CryptContext
from utils.jwt_handler import create_access_token

router = APIRouter()

# MongoDB collection (set from main.py)
users_collection = None

def set_users_collection(collection):
    global users_collection
    users_collection = collection


# Password hashing setup
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


# Models
class SignupModel(BaseModel):
    name: str
    email: str
    password: str
    role: str


class LoginModel(BaseModel):
    email: str
    password: str


# Signup route
@router.post("/auth/register")
def register(user: SignupModel):

    if users_collection is None:
        raise HTTPException(status_code=500, detail="Users collection not initialized")

    # check if user already exists
    existing_user = users_collection.find_one({"email": user.email})

    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")

    # hash password
    hashed_password = pwd_context.hash(user.password)

    # create user document
    user_data = {
        "name": user.name,
        "email": user.email,
        "password": hashed_password,
        "role": user.role
    }

    users_collection.insert_one(user_data)

    return {
        "message": "User registered successfully"
    }


@router.post("/auth/login")
def login(user: LoginModel):

    try:
        if users_collection is None:
            raise HTTPException(status_code=500, detail="DB not initialized")

        db_user = users_collection.find_one({"email": user.email})

        if not db_user:
            raise HTTPException(status_code=400, detail="User not found")

        if not pwd_context.verify(user.password, db_user["password"]):
            raise HTTPException(status_code=400, detail="Invalid password")

        token = create_access_token({
            "email": db_user["email"],
            "name": db_user["name"],
            "role": db_user["role"]
        })

        return {
            "message": "Login successful",
            "access_token": token,
            "user": {
                "name": db_user["name"],
                "email": db_user["email"],
                "role": db_user["role"]
            }
        }

    except HTTPException as e:
        # ❗ IMPORTANT: pass real error to frontend
        print("LOGIN ERROR:", e.detail)
        raise e

    except Exception as e:
        print("UNEXPECTED ERROR:", str(e))
        raise HTTPException(status_code=500, detail=str(e))