from app.core.store import InMemoryStore, store
from app.services.ai_orchestrator import AIOrchestrator
from app.services.conversation_service import ConversationService
from app.services.product_service import ProductService
from app.services.session_service import SessionService

# Singleton service instances
product_service = ProductService(store=store)
session_service = SessionService(store=store)
ai_orchestrator = AIOrchestrator(product_service=product_service)
conversation_service = ConversationService(
    session_service=session_service,
    ai_orchestrator=ai_orchestrator,
)


def get_store() -> InMemoryStore:
    return store


def get_product_service() -> ProductService:
    return product_service


def get_session_service() -> SessionService:
    return session_service


def get_ai_orchestrator() -> AIOrchestrator:
    return ai_orchestrator


def get_conversation_service() -> ConversationService:
    return conversation_service
