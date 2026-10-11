# Retail Sales Intelligence

React dashboard for exploring the Rossmann sales data and calling the saved
FastAPI prediction pipeline.

## Run locally

From the project root, start the API in one terminal:

```powershell
.\.venv\Scripts\python.exe -m uvicorn backend.main:app --reload
```

Then start the frontend in another terminal:

```powershell
Set-Location frontend
npm install
Copy-Item .env.example .env.local
npm run dev
```

The frontend is available at `http://localhost:5173`; the API is available at
`http://localhost:8000`. Restart Vite after changing `.env.local`.

If `VITE_API_BASE_URL` is unset, the dashboard explicitly uses isolated demo
data and simulated predictions. With `VITE_API_BASE_URL=http://localhost:8000`,
dataset overview, preview, quality checks, EDA, model metadata, and predictions
come from the FastAPI service. API errors are shown rather than silently
replaced with demo values.

## API integration

| Method | Endpoint | Purpose |
| --- | --- | --- |
| GET | `/health` | API and saved pipeline health |
| GET | `/api/overview` | Dataset-wide KPIs, daily trend, store/month summaries, and insights |
| GET | `/api/dataset` | CSV metadata, first 12 real rows, schema dictionary, and numeric summary |
| GET | `/api/data-quality` | Completeness, duplicates, domain checks, and quality score from the CSV |
| GET | `/api/eda` | Full-data distributions, correlations, sampled scatter points, and grouped summaries |
| GET | `/api/features` | Feature order and transformations used by the saved inference pipeline |
| GET | `/api/model` | Saved estimator metadata and largest-magnitude fitted coefficients |
| GET | `/api/model/evaluation` | Full modeling-dataset diagnostics; not a held-out test evaluation |
| POST | `/api/predict` | Store-day prediction from the saved model pipeline |
| POST | `/api/what-if` | Scenario prediction from the saved model pipeline |

CSV analysis responses are cached in the backend process; the browser does not
download the full training CSV. The evaluation endpoint reports full-dataset
metrics because the saved inference artifact does not include holdout
membership. Use the Phase 6 notebook's recorded split for held-out evaluation.
The Feature Engineering page remains notebook-sourced, and some descriptive
workflow content is static project documentation.

Run checks before publishing:

```powershell
npm run typecheck
npm run lint
npm run build
```
