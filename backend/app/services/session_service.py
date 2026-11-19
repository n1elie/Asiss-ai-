import uuid
from datetime import datetime
from typing import Optional
from app.core.store import InMemoryStore
from app.models.message import ChatMessage
from app.models.session import ConversationStep, QuotationSession, SessionStatus
from app.utils.ref_generator import RefGenerator


class SessionService:
    def __init__(self, store: InMemoryStore) -> None:
        self._store = store

    def create_session(self) -> QuotationSession:
        session_id = str(uuid.uuid4())
        ref = RefGenerator.generate_quotation_ref()
        now = datetime.now()

        session = QuotationSession(
            session_id=session_id,
            quotation_ref=ref,
            time_started=now,
            status=SessionStatus.IN_PROGRESS,
            current_step=ConversationStep.GREETING,
            step_number=1,
            language="English",
        )
        self._store.set_session(session_id, session.model_dump(mode="json"))
        return session

    def get_session(self, session_id: str) -> Optional[QuotationSession]:
        raw_session = self._store.get_session(session_id)
        if not raw_session:
            return None
        return QuotationSession.model_validate(raw_session)

    def update_session(self, session: QuotationSession) -> QuotationSession:
        self._store.set_session(session.session_id, session.model_dump(mode="json"))
        return session

    def save_session(self, session_id: str) -> QuotationSession:
        session = self.get_session(session_id)
        if not session:
            raise KeyError(f"Session with ID '{session_id}' not found.")
        session.status = SessionStatus.SAVED
        return self.update_session(session)

    def reopen_session(self, session_id: str) -> QuotationSession:
        session = self.get_session(session_id)
        if not session:
            raise KeyError(f"Session with ID '{session_id}' not found.")
        session.status = (
            SessionStatus.COMPLETE if session.quotation_amount else SessionStatus.IN_PROGRESS
        )
        return self.update_session(session)

    def add_message(self, session_id: str, message: ChatMessage) -> QuotationSession:
        session = self.get_session(session_id)
        if not session:
            raise KeyError(f"Session with ID '{session_id}' not found.")
        session.messages.append(message)
        return self.update_session(session)
