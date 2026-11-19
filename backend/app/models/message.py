from datetime import datetime
from enum import Enum
from typing import Optional
from pydantic import BaseModel, ConfigDict


class MessageRole(str, Enum):
    ASSISTANT = "assistant"
    USER = "user"


class MessageType(str, Enum):
    TEXT = "text"
    PRODUCT_SELECTION = "product_selection"  # special type showing product cards


class ChatMessage(BaseModel):
    id: str
    role: MessageRole
    content: str
    type: MessageType = MessageType.TEXT
    timestamp: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)
