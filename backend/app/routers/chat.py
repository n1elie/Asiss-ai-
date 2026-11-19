from typing import Annotated
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from app.core.dependencies import get_conversation_service
from app.models.message import ChatMessage
from app.models.session import QuotationSession
from app.services.conversation_service import ConversationService

router = APIRouter(prefix="/api", tags=["chat"])


class ChatRequest(BaseModel):
    message: str


class ChatResponse(BaseModel):
    session: QuotationSession
    assistant_message: ChatMessage


@router.post("/sessions/{session_id}/chat", response_model=ChatResponse)
def send_message(
    session_id: str,
    request: ChatRequest,
    conversation_service: Annotated[ConversationService, Depends(get_conversation_service)],
) -> ChatResponse:
    try:
        session, assistant_message = conversation_service.process_message(
            session_id=session_id,
            user_message=request.message,
        )
        return ChatResponse(session=session, assistant_message=assistant_message)
    except KeyError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Session '{session_id}' not found.",
        )
