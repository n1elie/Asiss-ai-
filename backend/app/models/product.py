from enum import Enum
from pydantic import BaseModel


class ProductType(str, Enum):
    MOTOR = "MOTOR"
    FIRE = "FIRE"
    TRAVEL = "TRAVEL"
    PERSONAL_ACCIDENT = "PERSONAL_ACCIDENT"


class InsuranceProduct(BaseModel):
    id: str
    name: str
    description: str
    type: ProductType
    icon: str  # emoji or icon name
