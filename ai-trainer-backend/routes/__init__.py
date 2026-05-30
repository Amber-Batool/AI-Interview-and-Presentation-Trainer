# 1
from fastapi import APIRouter

from .message_routes import router as message_router, set_messages_collection
from .contact_routes import router as contact_router, set_contacts_collection
from .authroutes import router as auth_router, set_users_collection
# from .interview import router as interview_router
from .feedback_routes import router as feedback_router, set_feedback_collection
router = APIRouter()

router.include_router(message_router)
router.include_router(contact_router)
router.include_router(auth_router)
# router.include_router(interview_router)
router.include_router(feedback_router)

__all__ = [
    "router",
    "set_messages_collection",
    "set_contacts_collection",
    "set_users_collection",
    "set_feedback_collection"

]






















