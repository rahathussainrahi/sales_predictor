import os
from datetime import timedelta
from functools import lru_cache
from pathlib import Path

import numpy as np
import pandas as pd
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from backend.analytics import (
    dataset_summary,
    eda_summary,
    load_training_data,
    quality_summary,
)
from backend.predictor import MODEL, MODEL_FEATURES, MODEL_PATH, predict_sales
from backend.schemas import PredictionRequest, PredictionResponse, ScenarioRequest

PROJECT_ROOT = Path(__file__).resolve().parents[1]
app = FastAPI(
    title="Retail Sales Prediction API",
    description="Machine learning API for retail sales prediction",
    version="1.0.0",
)

allowed_origins_env = os.getenv("ALLOWED_ORIGINS", "")
allowed_origins = [
    origin.strip() for origin in allowed_origins_env.split(",") if origin.strip()
]
if not allowed_origins:
    allowed_origins = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_origin_regex=r"^https?://(localhost|127\.0\.0\.1)(:\d+)?$",
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
)


@app.get("/")
async def root() -> dict[str, str]:
    return {
        "message": "Retail Sales Prediction API is running",
        "status": "online",
        "model": MODEL_PATH.name,
    }


@app.get("/health")
async def health() -> dict[str, str | bool]:
    model_ready = hasattr(MODEL, "predict") and MODEL_PATH.is_file()
    return {
        "status": "ok" if model_ready else "error",
        "model_loaded": model_ready,
        "model_path": str(MODEL_PATH),
        "pipeline_type": type(MODEL).__name__,
    }



@lru_cache(maxsize=1)
def _load_overview() -> dict:
    data = load_training_data()

    daily = (
        data.groupby("Date", sort=True)
        .agg(sales=("Sales", "sum"), customers=("Customers", "sum"), promo=("Promo", "max"))
        .reset_index()
    )
    by_store = data.groupby("Store", sort=False).agg(
        averageSales=("Sales", "mean"),
        totalSales=("Sales", "sum"),
        averageCustomers=("Customers", "mean"),
        promoFrequency=("Promo", "mean"),
    )
    by_store = by_store.sort_values("averageSales", ascending=False).head(18)

    open_rows = data.loc[data["Open"] == 1]
    promo_sales = open_rows.groupby("Promo")["Sales"].mean()
    non_promo_sales = float(promo_sales.get(0, 0.0))
    promo_average = float(promo_sales.get(1, 0.0))
    promo_delta = (
        (promo_average / non_promo_sales - 1) * 100 if non_promo_sales else 0.0
    )
    customer_correlation = float(open_rows["Customers"].corr(open_rows["Sales"]))

    monthly = data.assign(Month=data["Date"].dt.month).groupby("Month")["Sales"].mean()
    weekday = data.groupby("DayOfWeek")["Sales"].mean()
    average_sales = float(data["Sales"].mean())

    return {
        "source": "training-csv",
        "datasetRows": int(len(data)),
        "dateStart": data["Date"].min().date().isoformat(),
        "dateEnd": data["Date"].max().date().isoformat(),
        "totalSales": float(data["Sales"].sum()),
        "averageDailySales": average_sales,
        "totalStores": int(data["Store"].nunique()),
        "averageCustomers": float(open_rows["Customers"].mean()),
        "salesTrend": [
            {
                "date": row.Date.date().isoformat(),
                "sales": float(row.sales),
                "customers": int(row.customers),
                "promo": bool(row.promo),
            }
            for row in daily.itertuples(index=False)
        ],
        "storePerformance": [
            {
                "store": int(store),
                "averageSales": float(row.averageSales),
                "totalSales": float(row.totalSales),
                "averageCustomers": float(row.averageCustomers),
                "promoFrequency": float(row.promoFrequency * 100),
            }
            for store, row in by_store.iterrows()
        ],
        "monthlySales": [
            {
                "month": pd.Timestamp(year=2000, month=int(month), day=1).strftime("%b"),
                "sales": float(sales),
            }
            for month, sales in monthly.items()
        ],
        "daySales": [
            {
                "day": ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"][int(day) - 1],
                "sales": float(sales),
            }
            for day, sales in weekday.items()
        ],
        "insights": [
            {
                "title": "Customer volume tracks sales",
                "detail": (
                    f"Customer count and sales have a {customer_correlation:.2f} "
                    "correlation across open store-days; this association is not causal."
                ),
                "tone": "green",
            },
            {
                "title": "Promotion groups differ",
                "detail": (
                    f"Mean sales on promotion days are {promo_delta:+.1f}% versus "
                    "non-promotion open store-days; this is a descriptive comparison."
                ),
                "tone": "blue",
            },
            {
                "title": "Store averages vary",
                "detail": (
                    f"Mean store-day sales range from "
                    f"{float(data.groupby('Store')['Sales'].mean().min()):,.0f} to "
                    f"{float(data.groupby('Store')['Sales'].mean().max()):,.0f} "
                    "dataset units across stores."
                ),
                "tone": "orange",
            },
        ],
    }


@app.get("/api/overview")
async def overview() -> dict:
    try:
        return _load_overview()
    except FileNotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc


@lru_cache(maxsize=1)
def _load_dataset_summary() -> dict:
    return dataset_summary(load_training_data())


@app.get("/api/dataset")
async def dataset() -> dict:
    return _load_dataset_summary()


@lru_cache(maxsize=1)
def _load_quality_summary() -> dict:
    return quality_summary(load_training_data())


@app.get("/api/data-quality")
async def data_quality() -> dict:
    return _load_quality_summary()


@lru_cache(maxsize=1)
def _load_eda_summary() -> dict:
    return eda_summary(load_training_data())


@app.get("/api/eda")
async def eda() -> dict:
    return _load_eda_summary()


@app.get("/api/features")
async def features() -> list[dict[str, str]]:
    feature_details = {
        "Store": ("Rossmann Store", "Categorical ID", "One-hot encoded by the fitted pipeline"),
        "DayOfWeek": ("Training row", "Categorical", "Encoded as a category"),
        "Customers": ("Training row", "Numeric", "Used as observed customer count"),
        "Open": ("Training row", "Binary", "Indicates store opening status"),
        "Promo": ("Training row", "Binary", "Promotion indicator"),
        "StateHoliday": ("Training row", "Categorical", "One-hot encoded by the fitted pipeline"),
        "SchoolHoliday": ("Training row", "Binary", "School holiday indicator"),
        "Year": ("Date", "Calendar", "Extracted from the requested date"),
        "Month": ("Date", "Calendar", "Extracted from the requested date"),
        "Day": ("Date", "Calendar", "Extracted from the requested date"),
        "WeekOfYear": ("Date", "Calendar", "ISO week extracted from the requested date"),
        "IsWeekend": ("DayOfWeek", "Binary", "Set for Saturday and Sunday"),
    }
    return [
        {
            "feature": feature,
            "source": feature_details[feature][0],
            "type": feature_details[feature][1],
            "transformation": feature_details[feature][2],
            "modelUse": "Saved inference pipeline",
        }
        for feature in MODEL_FEATURES
    ]


@app.post("/predict", response_model=PredictionResponse)
@app.post("/api/predict", response_model=PredictionResponse)
async def predict(payload: PredictionRequest) -> PredictionResponse:
    prediction = predict_sales(payload)
    if payload.open == 0 or prediction <= 0.0:
        lower_bound = 0.0
        upper_bound = 0.0
        prediction = 0.0
    else:
        lower_bound = round(max(prediction * 0.82, 0.0), 2)
        upper_bound = round(prediction * 1.18, 2)

    return PredictionResponse(
        predictedSales=round(prediction, 2),
        lowerBound=lower_bound,
        upperBound=upper_bound,
        modelStatus="trained",
        input=payload.model_dump(exclude={"open"}),
        intervalType="heuristic-envelope",
    )


@app.post("/api/what-if")
async def what_if(payload: ScenarioRequest) -> dict[str, float | str]:
    # Fixed reference date represents the final observation day in the Rossmann dataset (2015-07-31).
    # DayOfWeek arithmetic aligns cyclical/calendar features with the requested weekday scenario.
    reference_date = pd.Timestamp("2015-07-31").date()
    reference_weekday = reference_date.isoweekday()
    scenario_date = reference_date + timedelta(
        days=payload.dayOfWeek - reference_weekday
    )
    request = PredictionRequest(
        store=payload.store,
        dayOfWeek=payload.dayOfWeek,
        date=scenario_date.isoformat(),
        customers=payload.customers,
        promo=payload.promo,
        stateHoliday="0",
        schoolHoliday=payload.schoolHoliday,
    )
    sales = predict_sales(request)
    return {
        "predictedSales": round(sales, 2),
        "modelStatus": "trained",
    }


@app.get("/api/model")
async def model_info() -> dict:
    preprocessor = MODEL.named_steps["preprocessor"]
    estimator = MODEL.named_steps["model"]
    feature_names = preprocessor.get_feature_names_out()
    coefficients = estimator.coef_
    top_coefficients = sorted(
        zip(feature_names, coefficients, strict=True),
        key=lambda item: abs(float(item[1])),
        reverse=True,
    )[:20]
    return {
        "status": "Trained",
        "algorithm": f"{type(estimator).__name__} with fitted preprocessing",
        "artifactPath": str(MODEL_PATH),
        "featureCount": len(MODEL_FEATURES),
        "target": "Sales",
        "coefficients": [
            {
                "feature": str(name).replace("num__", "").replace("cat__", ""),
                "value": float(value),
                "direction": "Positive" if value >= 0 else "Negative",
            }
            for name, value in top_coefficients
        ],
        "limitations": [
            "The artifact exposes no saved train/test split metadata.",
            "Customer count must be supplied at prediction time.",
            "Sales outputs are estimates and are not calibrated uncertainty intervals.",
        ],
    }


@lru_cache(maxsize=1)
def _load_full_data_evaluation() -> dict:
    data_path = PROJECT_ROOT / "data" / "df_model.csv"
    if not data_path.is_file():
        raise FileNotFoundError("Evaluation dataset df_model.csv not found.")

    data = pd.read_csv(data_path)
    data["Date"] = pd.to_datetime(data["Date"])
    data["Month"] = data["Date"].dt.month
    data["Day"] = data["Date"].dt.day
    data["Year"] = data["Date"].dt.year
    data["WeekOfYear"] = data["Date"].dt.isocalendar().week.astype(int)
    data["IsWeekend"] = data["DayOfWeek"].isin([6, 7]).astype(int)

    features = data[MODEL_FEATURES]
    actual = data["Sales"]
    predictions = MODEL.predict(features)
    residuals = actual.to_numpy() - predictions
    total_sum_of_squares = float(((actual - actual.mean()) ** 2).sum())
    residual_sum_of_squares = float((residuals**2).sum())
    residual_bins = pd.Series(pd.cut(residuals, bins=20)).value_counts(sort=False)
    sample_indexes = np.linspace(0, len(actual) - 1, min(25, len(actual)), dtype=int)
    residual_sample_indexes = np.linspace(
        0, len(actual) - 1, min(500, len(actual)), dtype=int
    )

    return {
        "status": "Evaluated",
        "source": "api-full-data",
        "evaluationScope": "Full-dataset in-sample diagnostic (df_model.csv)",
        "isHeldOutTest": False,
        "metrics": {
            "r2": round(1 - residual_sum_of_squares / total_sum_of_squares, 6)
            if total_sum_of_squares
            else None,
            "mae": round(float(np.abs(residuals).mean()), 4),
            "rmse": round(float(np.mean(residuals**2) ** 0.5), 4),
        },
        "trainingRows": int(len(data)),
        "testingRows": 0,
        "meanResidual": float(residuals.mean()),
        "actualPredicted": [
            {
                "actual": float(actual.iloc[index]),
                "predicted": float(predictions[index]),
            }
            for index in sample_indexes
        ],
        "residuals": [
            {
                "predicted": float(predictions[index]),
                "residual": float(residuals[index]),
            }
            for index in residual_sample_indexes
        ],
        "residualHistogram": [
            {"bin": str(interval), "count": int(count)}
            for interval, count in residual_bins.items()
        ],
    }


@app.get("/api/model/evaluation")
async def evaluation() -> dict:
    try:
        return _load_full_data_evaluation()
    except FileNotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc

