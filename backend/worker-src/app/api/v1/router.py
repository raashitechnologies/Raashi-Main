from fastapi import APIRouter
from app.api.v1.endpoints import domains, contact, internships, careers, auth, admin, coordinator, public_content, policies, password_reset

api_router = APIRouter()

# Public endpoints (no auth)
api_router.include_router(domains.router)
api_router.include_router(contact.router)
api_router.include_router(internships.router)
api_router.include_router(careers.router)
api_router.include_router(public_content.router)
api_router.include_router(policies.router)

# Auth endpoints
api_router.include_router(auth.router)
api_router.include_router(password_reset.router)

# Protected endpoints
api_router.include_router(admin.router)
api_router.include_router(coordinator.router)
