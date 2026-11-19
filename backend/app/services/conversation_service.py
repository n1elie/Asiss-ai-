import uuid
from datetime import datetime
from typing import Tuple
from app.models.insured_party import InsuredParty
from app.models.message import ChatMessage, MessageRole, MessageType
from app.models.risk import RiskInformation
from app.models.session import QuotationSession
from app.services.ai_orchestrator import AIOrchestrator
from app.services.session_service import SessionService


class ConversationService:
    def __init__(self, session_service: SessionService, ai_orchestrator: AIOrchestrator) -> None:
        self._session_service = session_service
        self._ai_orchestrator = ai_orchestrator

    def process_message(self, session_id: str, user_message: str) -> Tuple[QuotationSession, ChatMessage]:
        session = self._session_service.get_session(session_id)
        if not session:
            raise KeyError(f"Session with ID '{session_id}' not found.")

        # 1. Add user message
        user_message_obj = ChatMessage(
            id=str(uuid.uuid4()),
            role=MessageRole.USER,
            content=user_message,
            type=MessageType.TEXT,
            timestamp=datetime.now(),
        )
        session.messages.append(user_message_obj)

        # 2. Process with AI orchestrator
        assistant_content, updates = self._ai_orchestrator.process_user_message(session, user_message)

        # 3. Apply updates
        for key, value in updates.items():
            if key == "insured_party" and isinstance(value, dict):
                session.insured_party = InsuredParty.model_validate(value)
            elif key == "risk_information" and isinstance(value, dict):
                session.risk_information = RiskInformation.model_validate(value)
            else:
                setattr(session, key, value)

        # 4. Add assistant message
        assistant_message_obj = ChatMessage(
            id=str(uuid.uuid4()),
            role=MessageRole.ASSISTANT,
            content=assistant_content,
            type=MessageType.TEXT,
            timestamp=datetime.now(),
        )
        session.messages.append(assistant_message_obj)

        # 5. Persist and return updated session
        updated_session = self._session_service.update_session(session)
        return updated_session, assistant_message_obj
