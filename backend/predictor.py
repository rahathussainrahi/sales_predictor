from datetime import datetime
from pathlib import Path

import joblib
import pandas as pd
from fastapi import HTTPException

from backend.schemas import PredictionRequest

PROJECT_ROOT = Path(__file__).resolve().parents[1]
MODEL_PATH = PROJECT_ROOT / "models" / "sales_prediction_model.joblib"

if not MODEL_PATH.is_file():
    raise FileNotFoundError(f"Model artifact not found at {MODEL_PATH}")

MODEL = joblib.load(MODEL_PATH)
MODEL_FEATURES = list(MODEL.feature_names_in_)


def prepare_feature_row(payload: PredictionRequest) -> pd.DataFrame:
    try:
        prediction_date = datetime.strptime(payload.date, "%Y-%m-%d").date()
    except ValueError as exc:
        raise HTTPException(
            status_code=400,
            detail="date must be a valid ISO date string (YYYY-MM-DD).",
        ) from exc

    row = {
        "Store": payload.store,
        "DayOfWeek": payload.dayOfWeek,
        "Customers": payload.customers,
        "Open": payload.open,
        "Promo": int(payload.promo),
        "StateHoliday": str(payload.stateHoliday).strip() or "0",
        "SchoolHoliday": int(payload.schoolHoliday),
        "Year": prediction_date.year,
        "Month": prediction_date.month,
        "Day": prediction_date.day,
        "WeekOfYear": prediction_date.isocalendar().week,
        "IsWeekend": int(payload.dayOfWeek in {6, 7}),
    }
    return pd.DataFrame([row], columns=MODEL_FEATURES)


def predict_sales(payload: PredictionRequest) -> float:
    feature_row = prepare_feature_row(payload)
    if payload.open == 0:
        return 0.0
    raw_prediction = float(MODEL.predict(feature_row)[0])
    return max(0.0, raw_prediction)

