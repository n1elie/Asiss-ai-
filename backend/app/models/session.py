from datetime import datetime
from enum import Enum
from typing import List, Optional
from pydantic import BaseModel, Field

from app.models.insured_party import InsuredParty
from app.models.message import ChatMessage
from app.models.risk import RiskInformation


class SessionStatus(str, Enum):
    IN_PROGRESS = "IN_PROGRESS"
    COMPLETE = "COMPLETE"
    SAVED = "SAVED"


class ConversationStep(str, Enum):
    GREETING = "GREETING"
    PRODUCT_SELECTION = "PRODUCT_SELECTION"
    CAPTURE_DETAILS = "CAPTURE_DETAILS"
    REVIEW_RISKS = "REVIEW_RISKS"
    QUOTATION = "QUOTATION"


class QuotationSession(BaseModel):
    session_id: str
    agent_id: str = "agent_david"
    status: SessionStatus = SessionStatus.IN_PROGRESS
    quotation_ref: str
    time_started: datetime
    current_step: ConversationStep = ConversationStep.GREETING
    step_number: int = 1  # 1-4
    selected_product: Optional[str] = None  # product id
    selected_product_name: Optional[str] = None
    insured_party: InsuredParty = Field(default_factory=InsuredParty)
    risk_information: RiskInformation = Field(default_factory=RiskInformation)
    messages: List[ChatMessage] = Field(default_factory=list)
    quotation_amount: Optional[str] = None
    language: str = "English"
