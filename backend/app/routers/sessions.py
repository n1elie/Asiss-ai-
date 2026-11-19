import uuid
from datetime import datetime
from typing import Annotated
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from app.core.dependencies import get_ai_orchestrator, get_session_service
from app.models.message import ChatMessage, MessageRole, MessageType
from app.models.session import ConversationStep, QuotationSession
from app.services.ai_orchestrator import AIOrchestrator, PRODUCT_NAMES, normalize_language
from app.services.session_service import SessionService

router = APIRouter(prefix="/api", tags=["sessions"])


class LanguageUpdateRequest(BaseModel):
    language: str


@router.post("/sessions", response_model=QuotationSession, status_code=status.HTTP_201_CREATED)
def create_session(
    session_service: Annotated[SessionService, Depends(get_session_service)],
    ai_orchestrator: Annotated[AIOrchestrator, Depends(get_ai_orchestrator)],
) -> QuotationSession:
    # 1. Create a fresh session
    session = session_service.create_session()

    # 2. Add AI greeting message
    greeting_content, greeting_type = ai_orchestrator.get_greeting_message(session.language)
    msg_type = (
        MessageType.PRODUCT_SELECTION
        if greeting_type == "product_selection"
        else MessageType.TEXT
    )
    greeting_message = ChatMessage(
        id=str(uuid.uuid4()),
        role=MessageRole.ASSISTANT,
        content=greeting_content,
        type=msg_type,
        timestamp=datetime.now(),
    )
    session.messages.append(greeting_message)
    session.current_step = ConversationStep.PRODUCT_SELECTION
    session.step_number = 1

    # 3. Save and return session
    return session_service.update_session(session)


@router.get("/sessions/{session_id}", response_model=QuotationSession)
def get_session(
    session_id: str,
    session_service: Annotated[SessionService, Depends(get_session_service)],
) -> QuotationSession:
    session = session_service.get_session(session_id)
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Session '{session_id}' not found.",
        )
    return session


@router.post("/sessions/{session_id}/save", response_model=QuotationSession)
def save_session(
    session_id: str,
    session_service: Annotated[SessionService, Depends(get_session_service)],
) -> QuotationSession:
    try:
        return session_service.save_session(session_id)
    except KeyError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Session '{session_id}' not found.",
        )


@router.post("/sessions/{session_id}/language", response_model=QuotationSession)
def update_language(
    session_id: str,
    request: LanguageUpdateRequest,
    session_service: Annotated[SessionService, Depends(get_session_service)],
    ai_orchestrator: Annotated[AIOrchestrator, Depends(get_ai_orchestrator)],
) -> QuotationSession:
    session = session_service.get_session(session_id)
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Session '{session_id}' not found.",
        )
    session.language = normalize_language(request.language)

    if session.selected_product:
        session.selected_product_name = PRODUCT_NAMES[session.language].get(
            session.selected_product, session.selected_product_name
        )

    has_user_message = any(message.role == MessageRole.USER for message in session.messages)
    if session.messages:
        if has_user_message:
            # The assistant is waiting on a prompt: rebuild it in the new
            # language so switching mid-conversation feels immediate.
            for message in reversed(session.messages):
                if message.role == MessageRole.ASSISTANT:
                    message.content = ai_orchestrator.current_prompt(session)
                    break
        else:
            greeting_content, _ = ai_orchestrator.get_greeting_message(session.language)
            for message in session.messages:
                if message.role == MessageRole.ASSISTANT:
                    message.content = greeting_content
                    break

    return session_service.update_session(session)


@router.post("/sessions/{session_id}/reopen", response_model=QuotationSession)
def reopen_session(
    session_id: str,
    session_service: Annotated[SessionService, Depends(get_session_service)],
) -> QuotationSession:
    try:
        return session_service.reopen_session(session_id)
    except KeyError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Session '{session_id}' not found.",
        )
