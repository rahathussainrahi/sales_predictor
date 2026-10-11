from typing import Any

from pydantic import BaseModel, Field


class PredictionRequest(BaseModel):
    store: int = Field(..., ge=1, le=1115, description="Unique Rossmann store ID (1-1115)")
    dayOfWeek: int = Field(..., ge=1, le=7, description="Day of week (1=Monday, 7=Sunday)")
    date: str = Field(..., description="Prediction date in ISO format (YYYY-MM-DD)")
    customers: int = Field(..., ge=0, description="Expected or observed customer count (conditional input)")
    promo: bool = Field(default=False, description="Whether promotion is active")
    stateHoliday: str = Field("0", description="State holiday code: '0' (none), 'a', 'b', or 'c'")
    schoolHoliday: bool = Field(default=False, description="Whether school holiday is active")
    open: int = Field(default=1, ge=0, le=1, description="Store opening status (1=open, 0=closed)")


class PredictionResponse(BaseModel):
    predictedSales: float = Field(..., description="Estimated sales in dataset units")
    lowerBound: float = Field(..., description="Heuristic scenario lower estimate (not calibrated confidence interval)")
    upperBound: float = Field(..., description="Heuristic scenario upper estimate (not calibrated confidence interval)")
    modelStatus: str = Field(..., description="Model execution status (e.g. 'trained')")
    input: dict[str, Any] = Field(..., description="Echoed input payload")
    intervalType: str = Field(default="heuristic-envelope", description="Type of bounds returned")


class ScenarioRequest(BaseModel):
    store: int = Field(..., ge=1, le=1115, description="Unique Rossmann store ID (1-1115)")
    customers: int = Field(..., ge=0, description="Projected customer count")
    promo: bool = Field(default=False, description="Promotion status")
    dayOfWeek: int = Field(..., ge=1, le=7, description="Day of week (1=Monday, 7=Sunday)")
    schoolHoliday: bool = Field(default=False, description="School holiday status")

