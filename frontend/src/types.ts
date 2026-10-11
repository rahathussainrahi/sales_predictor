export type PageKey =
    | 'Overview'
    | 'Dataset'
    | 'Data Quality'
    | 'EDA'
    | 'Feature Engineering'
    | 'Model'
    | 'Evaluation'
    | 'Prediction'
    | 'What-If Analysis'

export type DateRange = '7D' | '30D' | '3M' | '6M' | '1Y' | 'All'

export interface TrendPoint {
    date: string
    sales: number
    customers: number
    promo: boolean
}

export interface StoreSummary {
    store: number
    averageSales: number
    totalSales: number
    averageCustomers: number
    promoFrequency: number
}

export interface OverviewData {
    source: 'training-csv' | 'demo'
    datasetRows: number
    dateStart: string
    dateEnd: string
    totalSales: number
    averageDailySales: number
    totalStores: number
    averageCustomers: number
    salesTrend: TrendPoint[]
    storePerformance: StoreSummary[]
    monthlySales: { month: string; sales: number }[]
    daySales: { day: string; sales: number }[]
    insights: { title: string; detail: string; tone: 'green' | 'blue' | 'orange' }[]
}

export interface DatasetRow {
    Store: number
    DayOfWeek: number
    Date: string
    Sales: number
    Customers: number
    Open: number
    Promo: number
    StateHoliday: string
    SchoolHoliday: number
}

export interface DatasetData {
    source: 'training-csv' | 'demo'
    name: string
    rows: number
    columns: number
    dateStart: string
    dateEnd: string
    memoryUsage: string
    preview: DatasetRow[]
    dictionary: { column: string; type: string; description: string; role: string }[]
    statistics: { column: string; mean: number; median: number; min: number; max: number; std: number; missingPercent: number }[]
}

export interface QualityData {
    source: 'training-csv' | 'demo'
    score: number
    totalRows: number
    missing: { column: string; count: number; percent: number; status: 'Healthy' | 'Warning' | 'Critical' }[]
    duplicates: number
    duplicateBusinessKeys: number
    invalidChecks: { label: string; count: number; status: 'Healthy' | 'Warning' | 'Critical' }[]
    typeChecks: { column: string; current: string; expected: string; status: 'Healthy' | 'Warning' | 'Critical' }[]
}

export interface EdaData {
    source: 'training-csv' | 'demo'
    salesStatistics: { mean: number; median: number; std: number; min: number; max: number; skew: number; q1: number; q3: number }
    customerSalesCorrelation: number
    customerSalesR2: number
    promotionSalesDeltaPercent: number
    salesHistogram: { bin: string; count: number }[]
    customerHistogram: { bin: string; count: number }[]
    scatter: { customers: number; sales: number }[]
    correlations: { variable: string; values: Record<string, number> }[]
    correlationLabels: string[]
    promoSales: { label: string; sales: number; customers: number }[]
    customerBuckets: { label: string; sales: number; customers: number }[]
    weekdaySales: { label: string; sales: number }[]
    monthlySales: { label: string; sales: number }[]
    yearlySales: { label: string; sales: number }[]
}

export interface FeatureRow {
    feature: string
    source: string
    type: string
    transformation: string
    modelUse: string
}

export interface ModelData {
    status: 'Not trained' | 'Trained'
    algorithm: string
    trainingSplit?: number
    testingSplit?: number
    randomState?: number
    featureCount: number
    target: string
    coefficients: { feature: string; value: number; direction: 'Positive' | 'Negative' }[]
    limitations: string[]
    runSnapshot?: {
        openRows: number
        trainingRows: number
        testingRows: number
        intercept: number
        artifactPath: string
        metrics: { r2: number; mae: number; rmse: number }
    }
}

export interface EvaluationData {
    status: 'Not evaluated' | 'Evaluated'
    source?: 'phase4-notebook' | 'phase5-notebook' | 'phase6-notebook' | 'api' | 'api-full-data'
    metrics: {
        r2: number | null
        mae: number | null
        rmse: number | null
        mse?: number | null
        mape?: number | null
        zeroActualExcluded?: number
    }
    trainingMetrics?: { r2: number; mae: number; rmse: number; mse?: number }
    trainingRows?: number
    testingRows?: number
    meanResidual?: number
    actualPredicted: { actual: number; predicted: number }[]
    residuals: { predicted: number; residual: number }[]
    residualHistogram: { bin: string; count: number }[]
}

export interface DashboardData {
    overview: OverviewData
    dataset: DatasetData
    quality: QualityData
    eda: EdaData
    features: FeatureRow[]
    model: ModelData
    evaluation: EvaluationData
}

export interface PredictionInput {
    store: number
    dayOfWeek: number
    date: string
    customers: number
    promo: boolean
    stateHoliday: string
    schoolHoliday: boolean
}

export interface PredictionResult {
    predictedSales: number
    lowerBound: number
    upperBound: number
    modelStatus: 'simulated' | 'trained'
    input: PredictionInput
}

export interface ScenarioInput {
    store: number
    customers: number
    promo: boolean
    dayOfWeek: number
    schoolHoliday: boolean
}

export interface ScenarioResult {
    predictedSales: number
    modelStatus: 'simulated' | 'trained'
}