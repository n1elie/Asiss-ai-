from typing import Optional
from pydantic import BaseModel


class InsuredParty(BaseModel):
    full_name: Optional[str] = None
    id_registration: Optional[str] = None
    contact_number: Optional[str] = None
