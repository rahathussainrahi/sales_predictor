from typing import Any

from pydantic import BaseModel, Field


class PredictionRequest(BaseModel):
    store: int = Field(..., ge=1)
    dayOfWeek: int = Field(..., ge=1, le=7)
    date: str = Field(..., description="Prediction date in YYYY-MM-DD format")
    customers: int = Field(..., ge=0)
    promo: bool = False
    stateHoliday: str = Field("0", description="State holiday value like '0', 'a', 'b', or 'c'")
    schoolHoliday: bool = False
    open: int = Field(default=1, ge=0, le=1)


class PredictionResponse(BaseModel):
    predictedSales: float
    lowerBound: float
    upperBound: float
    modelStatus: str
    input: dict[str, Any]


class ScenarioRequest(BaseModel):
    store: int = Field(..., ge=1)
    customers: int = Field(..., ge=0)
    promo: bool = False
    dayOfWeek: int = Field(..., ge=1, le=7)
    schoolHoliday: bool = False
