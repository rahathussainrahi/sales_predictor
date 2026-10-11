import pytest
from fastapi.testclient import TestClient
from backend.main import app

client = TestClient(app)


def test_root_endpoint():
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "online"
    assert "sales_prediction_model.joblib" in data["model"]


def test_health_endpoint():
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert data["model_loaded"] is True
    assert data["pipeline_type"] == "Pipeline"


def test_valid_prediction():
    payload = {
        "store": 1,
        "dayOfWeek": 5,
        "date": "2015-07-31",
        "customers": 555,
        "promo": True,
        "stateHoliday": "0",
        "schoolHoliday": True,
    }
    response = client.post("/api/predict", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["modelStatus"] == "trained"
    assert isinstance(data["predictedSales"], float)
    assert data["predictedSales"] > 0
    assert data["lowerBound"] <= data["predictedSales"]
    assert data["upperBound"] >= data["predictedSales"]
    assert data["intervalType"] == "heuristic-envelope"
    assert data["input"]["store"] == 1


def test_predict_alias_endpoint():
    payload = {
        "store": 1,
        "dayOfWeek": 5,
        "date": "2015-07-31",
        "customers": 555,
        "promo": True,
        "stateHoliday": "0",
        "schoolHoliday": True,
    }
    response = client.post("/predict", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["modelStatus"] == "trained"


def test_closed_store_prediction_zero():
    payload = {
        "store": 1,
        "dayOfWeek": 7,
        "date": "2015-08-02",
        "customers": 0,
        "promo": False,
        "stateHoliday": "0",
        "schoolHoliday": False,
        "open": 0,
    }
    response = client.post("/api/predict", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["predictedSales"] == 0.0
    assert data["lowerBound"] == 0.0
    assert data["upperBound"] == 0.0


def test_invalid_date_rejected():
    payload = {
        "store": 1,
        "dayOfWeek": 5,
        "date": "invalid-date",
        "customers": 500,
    }
    response = client.post("/api/predict", json=payload)
    assert response.status_code == 400
    assert "date must be a valid ISO date string" in response.json()["detail"]


def test_invalid_store_bounds_rejected():
    # Store ID 0 is invalid (1-1115)
    response = client.post("/api/predict", json={"store": 0, "dayOfWeek": 1, "date": "2015-07-31", "customers": 100})
    assert response.status_code == 422


def test_invalid_weekday_bounds_rejected():
    # Weekday 8 is invalid (1-7)
    response = client.post("/api/predict", json={"store": 1, "dayOfWeek": 8, "date": "2015-07-31", "customers": 100})
    assert response.status_code == 422


def test_negative_customers_rejected():
    response = client.post("/api/predict", json={"store": 1, "dayOfWeek": 1, "date": "2015-07-31", "customers": -5})
    assert response.status_code == 422


def test_what_if_scenario():
    payload = {
        "store": 12,
        "customers": 650,
        "promo": False,
        "dayOfWeek": 5,
        "schoolHoliday": False,
    }
    response = client.post("/api/what-if", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["modelStatus"] == "trained"
    assert isinstance(data["predictedSales"], float)
    assert data["predictedSales"] > 0


def test_model_info():
    response = client.get("/api/model")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "Trained"
    assert data["target"] == "Sales"
    assert len(data["coefficients"]) > 0


def test_evaluation_diagnostics_labeled():
    response = client.get("/api/model/evaluation")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "Evaluated"
    assert data["source"] == "api-full-data"
    assert data["isHeldOutTest"] is False
    assert "in-sample" in data["evaluationScope"].lower()
    assert "r2" in data["metrics"]
    assert "mae" in data["metrics"]


def test_features_list():
    response = client.get("/api/features")
    assert response.status_code == 200
    features = response.json()
    assert len(features) == 12
    feature_names = [f["feature"] for f in features]
    assert "Store" in feature_names
    assert "Customers" in feature_names
