from typing import Optional
from pydantic import BaseModel


class RiskInformation(BaseModel):
    # Motor
    vehicle_make: Optional[str] = None
    vehicle_model: Optional[str] = None
    vehicle_year: Optional[str] = None
    vehicle_value: Optional[str] = None

    # Fire
    property_type: Optional[str] = None
    property_location: Optional[str] = None
    property_value: Optional[str] = None

    # Travel
    destination: Optional[str] = None
    travel_dates: Optional[str] = None
    num_travelers: Optional[str] = None

    # Personal Accident
    occupation: Optional[str] = None
    age: Optional[str] = None
    coverage_amount: Optional[str] = None
