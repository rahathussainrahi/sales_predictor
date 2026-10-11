import type { DashboardData, DatasetRow, TrendPoint } from '../types'

const salesTrend: TrendPoint[] = Array.from({ length: 365 }, (_, index) => {
    const date = new Date(Date.UTC(2014, 7, 1 + index))
    const weekday = date.getUTCDay() || 7
    const season = 1 + Math.sin((index / 365) * Math.PI * 2) * 0.13
    const weekdayFactor = weekday === 7 ? 0.04 : weekday === 1 ? 1.24 : weekday === 6 ? 1.05 : 0.94
    const customers = Math.round((530 + Math.sin(index * 0.17) * 90 + Math.cos(index * 0.06) * 50) * weekdayFactor)
    const promo = index % 8 < 3
    return { date: date.toISOString().slice(0, 10), sales: Math.round((customers * 8.4 + (promo ? 1350 : 0)) * season), customers, promo }
})

const preview: DatasetRow[] = [
    [1, 5, '2015-07-31', 5263, 555], [2, 5, '2015-07-31', 6064, 625], [3, 5, '2015-07-31', 8314, 821],
    [4, 5, '2015-07-31', 13995, 1498], [5, 5, '2015-07-31', 4822, 559], [6, 5, '2015-07-31', 5651, 589],
    [7, 5, '2015-07-31', 15344, 1414], [8, 5, '2015-07-31', 8492, 833], [9, 5, '2015-07-31', 8565, 687],
    [10, 5, '2015-07-31', 7185, 681], [11, 5, '2015-07-31', 10457, 1236], [12, 5, '2015-07-31', 8959, 962],
].map(([Store, DayOfWeek, Date, Sales, Customers]) => ({
    Store: Number(Store), DayOfWeek: Number(DayOfWeek), Date: String(Date), Sales: Number(Sales), Customers: Number(Customers),
    Open: 1, Promo: 1, StateHoliday: '0', SchoolHoliday: 1,
}))

const storePerformance = Array.from({ length: 18 }, (_, index) => {
    const store = index + 1
    const averageSales = Math.round(3600 + ((store * 947) % 9200) + Math.sin(store) * 900)
    return { store, averageSales, totalSales: averageSales * (680 + (store * 37) % 300), averageCustomers: Math.round(averageSales / 8.8), promoFrequency: 38 + ((store * 13) % 37) }
})

const weekdays = [7809, 7000, 6900, 6800, 7400, 5800, 204]
const months = [5465, 5640, 5790, 5705, 5710, 5705, 5890, 5900, 5700, 5840, 6060, 6827]

export const dashboardData: DashboardData = {
    overview: {
        source: 'demo',
        datasetRows: 1_017_209,
        dateStart: '2013-01-01',
        dateEnd: '2015-07-31',
        totalSales: 5_877_000_000, averageDailySales: 5774, totalStores: 1115, averageCustomers: 633, salesTrend,
        storePerformance,
        monthlySales: months.map((sales, index) => ({ month: new Date(2000, index).toLocaleString('en', { month: 'short' }), sales })),
        daySales: weekdays.map((sales, index) => ({ day: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][index], sales })),
        insights: [
            { title: 'Customer volume leads', detail: 'Customer count has the strongest observed linear relationship with sales in the Phase 2 lab.', tone: 'green' },
            { title: 'Promotion split is visible', detail: 'Mean sales differ between promotion groups; this is an association, not a causal estimate.', tone: 'blue' },
            { title: 'Store behavior varies', detail: 'Average sales differ substantially by store, pointing to meaningful location-level variation.', tone: 'orange' },
        ],
    },
    dataset: {
        source: 'demo',
        name: 'Rossmann Store Sales', rows: 1_017_209, columns: 9, dateStart: '2013-01-01', dateEnd: '2015-07-31', memoryUsage: 'Measured by backend on load', preview,
        dictionary: [
            { column: 'Store', type: 'int64', description: 'Unique store identifier', role: 'Feature' },
            { column: 'DayOfWeek', type: 'int64', description: 'Day of the week, 1–7', role: 'Feature' },
            { column: 'Date', type: 'datetime', description: 'Date of the observation', role: 'Time' },
            { column: 'Sales', type: 'int64', description: 'Daily store sales', role: 'Target' },
            { column: 'Customers', type: 'int64', description: 'Number of customers', role: 'Feature' },
            { column: 'Open', type: 'int64', description: 'Whether the store was open', role: 'Context' },
            { column: 'Promo', type: 'int64', description: 'Whether a promotion was active', role: 'Feature' },
            { column: 'StateHoliday', type: 'category', description: 'State holiday type or none', role: 'Feature' },
            { column: 'SchoolHoliday', type: 'int64', description: 'Whether schools were closed', role: 'Feature' },
        ],
        statistics: [
            { column: 'Sales', mean: 5773.82, median: 5744, min: 0, max: 41551, std: 3849.93, missingPercent: 0 },
            { column: 'Customers', mean: 633, median: 609, min: 0, max: 7388, std: 464, missingPercent: 0 },
            { column: 'Store', mean: 558, median: 558, min: 1, max: 1115, std: 322, missingPercent: 0 },
        ],
    },
    quality: {
        source: 'demo',
        score: 96,
        totalRows: 1_017_209,
        missing: ['Store', 'DayOfWeek', 'Date', 'Sales', 'Customers', 'Open', 'Promo', 'StateHoliday', 'SchoolHoliday'].map((column) => ({ column, count: 0, percent: 0, status: 'Healthy' })),
        duplicates: 0, duplicateBusinessKeys: 0,
        invalidChecks: [
            { label: 'Negative sales', count: 0, status: 'Healthy' }, { label: 'Negative customers', count: 0, status: 'Healthy' },
            { label: 'Store ID outside expected range', count: 0, status: 'Healthy' }, { label: 'Invalid promotion values', count: 0, status: 'Healthy' },
            { label: 'Unrecognized holiday values', count: 0, status: 'Healthy' },
        ],
        typeChecks: [
            { column: 'Date', current: 'datetime64', expected: 'datetime64', status: 'Healthy' },
            { column: 'Sales', current: 'int64', expected: 'numeric', status: 'Healthy' },
            { column: 'Customers', current: 'int64', expected: 'numeric', status: 'Healthy' },
            { column: 'StateHoliday', current: 'object', expected: 'category', status: 'Warning' },
            { column: 'Promo', current: 'int64', expected: 'binary', status: 'Healthy' },
        ],
    },
    eda: {
        source: 'demo',
        salesStatistics: { mean: 5773.82, median: 5744, std: 3849.93, min: 0, max: 41551, skew: 0.64, q1: 3727, q3: 7856 },
        customerSalesCorrelation: 0.895,
        customerSalesR2: 0.801,
        promotionSalesDeltaPercent: 81.4,
        salesHistogram: [
            { bin: '0–2k', count: 18 }, { bin: '2–4k', count: 22 }, { bin: '4–6k', count: 26 }, { bin: '6–8k', count: 20 }, { bin: '8–10k', count: 9 }, { bin: '10k+', count: 5 },
        ],
        customerHistogram: [
            { bin: '0–200', count: 8 }, { bin: '200–400', count: 19 }, { bin: '400–600', count: 31 }, { bin: '600–800', count: 22 }, { bin: '800–1k', count: 13 }, { bin: '1k+', count: 7 },
        ],
        scatter: Array.from({ length: 96 }, (_, index) => {
            const customers = 60 + ((index * 79) % 1350)
            return { customers, sales: Math.max(0, Math.round(customers * 8.8 + Math.sin(index * 2.7) * 2600 + (index % 7 === 0 ? 1800 : 0))) }
        }),
        correlations: [
            { variable: 'Sales', values: { Sales: 1, Customers: 0.895, Promo: 0.37, Store: 0.005, DayOfWeek: -0.18, SchoolHoliday: 0.14 } },
            { variable: 'Customers', values: { Sales: 0.895, Customers: 1, Promo: 0.32, Store: 0.024, DayOfWeek: -0.22, SchoolHoliday: 0.13 } },
            { variable: 'Promo', values: { Sales: 0.37, Customers: 0.32, Promo: 1, Store: 0.001, DayOfWeek: -0.39, SchoolHoliday: 0.07 } },
            { variable: 'Store', values: { Sales: 0.005, Customers: 0.024, Promo: 0.001, Store: 1, DayOfWeek: 0, SchoolHoliday: 0 } },
            { variable: 'DayOfWeek', values: { Sales: -0.18, Customers: -0.22, Promo: -0.39, Store: 0, DayOfWeek: 1, SchoolHoliday: 0.04 } },
            { variable: 'SchoolHoliday', values: { Sales: 0.14, Customers: 0.13, Promo: 0.07, Store: 0, DayOfWeek: 0.04, SchoolHoliday: 1 } },
        ],
        correlationLabels: ['Sales', 'Customers', 'Promo', 'Store', 'DayOfWeek', 'SchoolHoliday'],
        promoSales: [{ label: 'No promotion', sales: 4406, customers: 521 }, { label: 'Promotion', sales: 7991, customers: 773 }],
        customerBuckets: [{ label: 'Low', sales: 2010, customers: 205 }, { label: 'Medium', sales: 5540, customers: 631 }, { label: 'High', sales: 10380, customers: 1180 }],
        weekdaySales: weekdays.map((sales, index) => ({ label: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][index], sales })),
        monthlySales: months.map((sales, index) => ({ label: new Date(2000, index).toLocaleString('en', { month: 'short' }), sales })),
        yearlySales: [{ label: '2013', sales: 5659 }, { label: '2014', sales: 5833 }, { label: '2015', sales: 5878 }],
    },
    features: [
        { feature: 'Store', source: 'Raw column', type: 'Numeric ID', transformation: 'Used as a numeric baseline feature', modelUse: 'Baseline' },
        { feature: 'Customers', source: 'Raw column', type: 'Numeric', transformation: 'No transformation', modelUse: 'Baseline' },
        { feature: 'Promo', source: 'Raw column', type: 'Binary', transformation: 'Use 0/1 flag', modelUse: 'Baseline' },
        { feature: 'SchoolHoliday', source: 'Raw column', type: 'Binary', transformation: 'Use 0/1 flag', modelUse: 'Baseline' },
        { feature: 'Year', source: 'Date', type: 'Calendar', transformation: 'Extract calendar year', modelUse: 'Baseline' },
        { feature: 'Month', source: 'Date', type: 'Calendar', transformation: 'Extract calendar month', modelUse: 'Baseline' },
        { feature: 'Day', source: 'Date', type: 'Calendar', transformation: 'Extract day of month', modelUse: 'Baseline' },
        { feature: 'WeekOfYear', source: 'Date', type: 'Calendar', transformation: 'Extract ISO week number', modelUse: 'Baseline' },
        { feature: 'IsWeekend', source: 'DayOfWeek', type: 'Binary', transformation: 'Set when DayOfWeek >= 6', modelUse: 'Baseline' },
    ],
    model: {
        status: 'Trained', algorithm: 'Linear Regression + One-Hot Encoding', trainingSplit: 0.8, testingSplit: 0.2, randomState: 42, featureCount: 9, target: 'Sales',
        coefficients: [
            { feature: 'Customers', value: 6.873116, direction: 'Positive' },
            { feature: 'Promo', value: 1127.353791, direction: 'Positive' },
            { feature: 'SchoolHoliday', value: 200.403247, direction: 'Positive' },
            { feature: 'Year', value: 149.506487, direction: 'Positive' },
            { feature: 'Month', value: 73.725181, direction: 'Positive' },
            { feature: 'Day', value: 11.260371, direction: 'Positive' },
            { feature: 'WeekOfYear', value: -4.284021, direction: 'Negative' },
            { feature: 'IsWeekend', value: 224.173396, direction: 'Positive' },
            { feature: 'Store_1', value: 315.967335, direction: 'Positive' },
        ],
        limitations: [
            'One-hot encoding treats store and holiday categories as separate signal columns instead of numeric order.',
            'The model should still be checked against a time-aware split to simulate future sales forecasting.',
            'Customer count remains a strong driver but is only known when it is already observed.',
            'This is still a linear model, so nonlinear promotions or event effects may be underfit.'
        ],
        runSnapshot: {
            openRows: 844_392, trainingRows: 675_513, testingRows: 168_879,
            intercept: -381_884.147824, artifactPath: 'notebooks/06_model_improvement.ipynb',
            metrics: { r2: 0.9515, mae: 464.40, rmse: 682.41 },
        },
    },
    evaluation: { status: 'Evaluated', source: 'phase6-notebook', metrics: { r2: 0.9515, mae: 464.40, rmse: 682.41 }, actualPredicted: [], residuals: [], residualHistogram: [] },
}