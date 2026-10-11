# Retail Sales Predictor

## Project structure

```text
data/       Raw Rossmann CSVs, engineered data, and saved train/test splits
notebooks/  Data exploration, feature engineering, modeling, and evaluation
models/     Trained model artifacts and prediction outputs
backend/    FastAPI application, prediction logic, and request/response schemas
frontend/   React dashboard
plots/      Notebook-generated visualizations
docs/       Documentation
```

## Run the API

From the project root:

```powershell
pip install -r requirements.txt
uvicorn backend.main:app --reload
```

The API health check is available at `http://127.0.0.1:8000/health`.

## Run the frontend

In a separate terminal:

```powershell
Set-Location frontend
npm install
npm run dev
```

## Run the notebooks

Open notebooks from `notebooks/`. They resolve project files from the project root and use `data/` and `models/` for their inputs and outputs. Run them in numerical order to reproduce the analysis.
