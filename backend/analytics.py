from functools import lru_cache
from pathlib import Path

import pandas as pd

PROJECT_ROOT = Path(__file__).resolve().parents[1]
DATA_PATH = PROJECT_ROOT / "data" / "train.csv"
REQUIRED_COLUMNS = [
    "Store",
    "DayOfWeek",
    "Date",
    "Sales",
    "Customers",
    "Open",
    "Promo",
    "StateHoliday",
    "SchoolHoliday",
]
NUMERIC_SUMMARY_COLUMNS = ["Sales", "Customers", "Store"]
CORRELATION_COLUMNS = [
    "Sales",
    "Customers",
    "Promo",
    "Store",
    "DayOfWeek",
    "SchoolHoliday",
]


@lru_cache(maxsize=1)
def load_training_data() -> pd.DataFrame:
    if not DATA_PATH.is_file():
        raise FileNotFoundError(f"Training dataset not found at {DATA_PATH}")

    data = pd.read_csv(DATA_PATH, parse_dates=["Date"])
    missing_columns = set(REQUIRED_COLUMNS).difference(data.columns)
    if missing_columns:
        raise ValueError(
            f"Training dataset is missing required columns: {sorted(missing_columns)}"
        )
    return data


def _status(count: int, total: int) -> str:
    if count == 0:
        return "Healthy"
    return "Warning" if total and count / total < 0.01 else "Critical"


def dataset_summary(data: pd.DataFrame) -> dict:
    stats = data[NUMERIC_SUMMARY_COLUMNS].describe().T
    statistics = [
        {
            "column": column,
            "mean": float(stats.loc[column, "mean"]),
            "median": float(data[column].median()),
            "min": float(stats.loc[column, "min"]),
            "max": float(stats.loc[column, "max"]),
            "std": float(stats.loc[column, "std"]),
            "missingPercent": float(data[column].isna().mean() * 100),
        }
        for column in NUMERIC_SUMMARY_COLUMNS
    ]
    descriptions = {
        "Store": ("Unique store identifier", "Feature"),
        "DayOfWeek": ("Day of the week, 1–7", "Feature"),
        "Date": ("Date of the observation", "Time"),
        "Sales": ("Daily store sales", "Target"),
        "Customers": ("Number of customers", "Feature"),
        "Open": ("Whether the store was open", "Context"),
        "Promo": ("Whether a promotion was active", "Feature"),
        "StateHoliday": ("State holiday type or none", "Feature"),
        "SchoolHoliday": ("Whether schools were closed", "Feature"),
    }
    dictionary = [
        {
            "column": column,
            "type": "datetime64[ns]" if column == "Date" else str(data[column].dtype),
            "description": descriptions[column][0],
            "role": descriptions[column][1],
        }
        for column in REQUIRED_COLUMNS
    ]
    preview = data.head(12)[REQUIRED_COLUMNS].copy()
    preview["Date"] = preview["Date"].dt.strftime("%Y-%m-%d")
    preview["StateHoliday"] = preview["StateHoliday"].fillna("").astype(str)

    return {
        "source": "training-csv",
        "name": "Rossmann Store Sales",
        "rows": int(len(data)),
        "columns": int(len(REQUIRED_COLUMNS)),
        "dateStart": data["Date"].min().date().isoformat(),
        "dateEnd": data["Date"].max().date().isoformat(),
        "memoryUsage": f"{data.memory_usage(index=True, deep=True).sum() / (1024 ** 2):.1f} MiB",
        "preview": preview.to_dict(orient="records"),
        "dictionary": dictionary,
        "statistics": statistics,
    }


def quality_summary(data: pd.DataFrame) -> dict:
    rows = len(data)
    missing = [
        {
            "column": column,
            "count": int(data[column].isna().sum()),
            "percent": float(data[column].isna().mean() * 100),
            "status": _status(int(data[column].isna().sum()), rows),
        }
        for column in REQUIRED_COLUMNS
    ]
    invalid_counts = [
        ("Negative sales", int((data["Sales"] < 0).sum())),
        ("Negative customers", int((data["Customers"] < 0).sum())),
        (
            "Store ID outside expected range",
            int((~data["Store"].between(1, 1115)).sum()),
        ),
        ("Invalid promotion values", int((~data["Promo"].isin([0, 1])).sum())),
        (
            "Unrecognized holiday values",
            int((~data["StateHoliday"].astype(str).isin(["0", "a", "b", "c"])).sum()),
        ),
    ]
    invalid_checks = [
        {"label": label, "count": count, "status": _status(count, rows)}
        for label, count in invalid_counts
    ]
    type_expectations = {
        "Date": ("datetime64[ns]", str(data["Date"].dtype) == "datetime64[ns]"),
        "Sales": ("numeric", pd.api.types.is_numeric_dtype(data["Sales"])),
        "Customers": ("numeric", pd.api.types.is_numeric_dtype(data["Customers"])),
        "StateHoliday": (
            "string/category",
            pd.api.types.is_object_dtype(data["StateHoliday"])
            or pd.api.types.is_string_dtype(data["StateHoliday"])
            or isinstance(data["StateHoliday"].dtype, pd.CategoricalDtype),
        ),
        "Promo": (
            "binary",
            pd.api.types.is_numeric_dtype(data["Promo"])
            and data["Promo"].dropna().isin([0, 1]).all(),
        ),
    }
    type_checks = [
        {
            "column": column,
            "current": str(data[column].dtype),
            "expected": expected,
            "status": "Healthy" if matches else "Warning",
        }
        for column, (expected, matches) in type_expectations.items()
    ]
    completeness = 1 - sum(item["count"] for item in missing) / max(
        rows * len(REQUIRED_COLUMNS), 1
    )
    validity = 1 - sum(count for _, count in invalid_counts) / max(
        rows * len(invalid_counts), 1
    )
    schema = sum(item["status"] == "Healthy" for item in type_checks) / max(
        len(type_checks), 1
    )
    score = round((completeness * 40 + validity * 35 + schema * 25))

    return {
        "source": "training-csv",
        "score": score,
        "totalRows": int(rows),
        "missing": missing,
        "duplicates": int(data.duplicated().sum()),
        "duplicateBusinessKeys": int(data.duplicated(["Store", "Date"]).sum()),
        "invalidChecks": invalid_checks,
        "typeChecks": type_checks,
    }


def eda_summary(data: pd.DataFrame) -> dict:
    sales = data["Sales"].dropna()
    customers = data["Customers"].dropna()
    sales_edges = [0, 2000, 4000, 6000, 8000, 10000, float("inf")]
    sales_labels = ["0–2k", "2–4k", "4–6k", "6–8k", "8–10k", "10k+"]
    customer_edges = [0, 200, 400, 600, 800, 1000, float("inf")]
    customer_labels = ["0–200", "200–400", "400–600", "600–800", "800–1k", "1k+"]
    sales_histogram = pd.cut(
        sales, bins=sales_edges, labels=sales_labels, right=False
    ).value_counts(sort=False)
    customer_histogram = pd.cut(
        customers, bins=customer_edges, labels=customer_labels, right=False
    ).value_counts(sort=False)

    correlations = data[CORRELATION_COLUMNS].corr()
    open_rows = data.loc[data["Open"] == 1]
    customer_sales_correlation = open_rows["Customers"].corr(open_rows["Sales"])
    promo_means = open_rows.groupby("Promo")[["Sales", "Customers"]].mean()
    non_promo_sales = float(promo_means["Sales"].get(0, 0.0))
    promo_sales = float(promo_means["Sales"].get(1, 0.0))
    promotion_delta = (
        (promo_sales / non_promo_sales - 1) * 100 if non_promo_sales else 0.0
    )
    ranked_customers = data["Customers"].rank(method="first", pct=True)
    customer_bucket = pd.cut(
        ranked_customers,
        bins=[0, 1 / 3, 2 / 3, 1],
        labels=["Low", "Medium", "High"],
        include_lowest=True,
    )
    bucket_means = data.groupby(customer_bucket, observed=False).agg(
        sales=("Sales", "mean"), customers=("Customers", "mean")
    )
    scatter = data[["Customers", "Sales"]].dropna()
    scatter = scatter.sample(n=min(len(scatter), 500), random_state=42)

    monthly = data.assign(Month=data["Date"].dt.month).groupby("Month")["Sales"].mean()
    yearly = data.assign(Year=data["Date"].dt.year).groupby("Year")["Sales"].mean()
    weekdays = data.groupby("DayOfWeek")["Sales"].mean()
    correlation_value = (
        float(customer_sales_correlation)
        if pd.notna(customer_sales_correlation)
        else 0.0
    )

    return {
        "source": "training-csv",
        "salesStatistics": {
            "mean": float(sales.mean()),
            "median": float(sales.median()),
            "std": float(sales.std()),
            "min": float(sales.min()),
            "max": float(sales.max()),
            "skew": float(sales.skew()) if pd.notna(sales.skew()) else 0.0,
            "q1": float(sales.quantile(0.25)),
            "q3": float(sales.quantile(0.75)),
        },
        "customerSalesCorrelation": correlation_value,
        "customerSalesR2": correlation_value**2,
        "promotionSalesDeltaPercent": promotion_delta,
        "salesHistogram": [
            {"bin": label, "count": int(sales_histogram[label])}
            for label in sales_labels
        ],
        "customerHistogram": [
            {"bin": label, "count": int(customer_histogram[label])}
            for label in customer_labels
        ],
        "scatter": [
            {"customers": int(row.Customers), "sales": float(row.Sales)}
            for row in scatter.itertuples(index=False)
        ],
        "correlations": [
            {
                "variable": variable,
                "values": {
                    name: (
                        float(correlations.loc[variable, name])
                        if pd.notna(correlations.loc[variable, name])
                        else 0.0
                    )
                    for name in CORRELATION_COLUMNS
                },
            }
            for variable in CORRELATION_COLUMNS
        ],
        "correlationLabels": CORRELATION_COLUMNS,
        "promoSales": [
            {
                "label": "Promotion" if int(promo) else "No promotion",
                "sales": float(row["Sales"]),
                "customers": float(row["Customers"]),
            }
            for promo, row in promo_means.iterrows()
        ],
        "customerBuckets": [
            {
                "label": str(label),
                "sales": float(row["sales"]),
                "customers": float(row["customers"]),
            }
            for label, row in bucket_means.iterrows()
        ],
        "weekdaySales": [
            {
                "label": ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"][
                    int(day) - 1
                ],
                "sales": float(value),
            }
            for day, value in weekdays.items()
        ],
        "monthlySales": [
            {
                "label": pd.Timestamp(year=2000, month=int(month), day=1).strftime(
                    "%b"
                ),
                "sales": float(value),
            }
            for month, value in monthly.items()
        ],
        "yearlySales": [
            {"label": str(year), "sales": float(value)}
            for year, value in yearly.items()
        ],
    }
