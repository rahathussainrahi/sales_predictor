import notebookText from '../../../notebooks/03_feature_engineering.ipynb?raw'
import type { FeatureRow } from '../types'

interface NotebookCell {
    cell_type: string
    source: string[] | string
}

interface NotebookDocument {
    cells: NotebookCell[]
}

export interface FeatureLabSnapshot {
    features: FeatureRow[]
    steps: { title: string; detail: string; complete: boolean }[]
    hasFeatureMatrix: boolean
    hasTarget: boolean
}

const notebook = JSON.parse(notebookText) as NotebookDocument
const code = notebook.cells
    .filter((cell) => cell.cell_type === 'code')
    .map((cell) => Array.isArray(cell.source) ? cell.source.join('') : cell.source)
    .join('\n')

const sourceColumns = [
    'Store',
    'DayOfWeek',
    'Date',
    'Sales',
    'Customers',
    'Open',
    'Promo',
    'StateHoliday',
    'SchoolHoliday',
]

const derivedFeatures = new Map<string, string>()
const assignments = /df_ml\[\s*["']([^"']+)["']\s*\]\s*(?<!=)=(?!=)\s*([^\n]+)/g
for (const match of code.matchAll(assignments)) {
    derivedFeatures.set(match[1], match[2].trim())
}

const oneHotColumnsMatch = code.match(/pd\.get_dummies\s*\([\s\S]*?columns\s*=\s*\[([^\]]*)\]/)
const oneHotColumns = new Set(
    [...(oneHotColumnsMatch?.[1] ?? '').matchAll(/["']([^"']+)["']/g)].map((match) => match[1]),
)

const openStoreFilter = /df_model\s*=\s*df_ml\s*\[\s*df_ml\[\s*["']Open["']\s*\]\s*==\s*1\s*\]/.test(code)
const matrixMatch = code.match(/\bX\s*=\s*df_model\.drop\s*\(\s*columns\s*=\s*\[([^\]]*)\]/)
const droppedFromMatrix = new Set(
    [...(matrixMatch?.[1] ?? '').matchAll(/["']([^"']+)["']/g)].map((match) => match[1]),
)
const hasFeatureMatrix = /\bX\s*=/.test(code)
const hasTarget = /\by\s*=\s*df_model\s*\[/.test(code)

function featureUsage(feature: string): string {
    if (feature === 'Sales') return 'Target (y)'
    if (feature === 'Date' && droppedFromMatrix.has('Date')) return 'Excluded from X'
    if (droppedFromMatrix.has(feature)) return 'Excluded from X'
    if (feature === 'Open' && openStoreFilter) return 'Filtered to open stores'
    if (oneHotColumns.has(feature)) return 'One-hot encoded'
    if (feature === 'Customers') return 'Included · check forecast leakage'
    if (hasFeatureMatrix) return 'Included in X'
    return 'Not yet selected'
}

function featureTransformation(feature: string): string {
    const assignment = derivedFeatures.get(feature)
    if (assignment) return assignment
    if (oneHotColumns.has(feature)) return 'Included in pd.get_dummies(..., drop_first=True)'
    if (feature === 'Open' && openStoreFilter) return 'Filter: Open == 1'
    if (feature === 'Date' && droppedFromMatrix.has('Date')) return 'Used to derive calendar features; excluded from X'
    if (feature === 'Sales') return 'Prediction target'
    return 'Retained from source data'
}

const features: FeatureRow[] = sourceColumns.map((feature) => ({
    feature,
    source: feature === 'Date' ? 'Source date' : 'Source column',
    type: feature === 'StateHoliday' ? 'Categorical' : ['Promo', 'Open', 'SchoolHoliday'].includes(feature) ? 'Binary' : 'Numeric / categorical',
    transformation: featureTransformation(feature),
    modelUse: featureUsage(feature),
}))

for (const feature of derivedFeatures.keys()) {
    features.push({
        feature,
        source: feature === 'IsWeekend' ? 'DayOfWeek' : 'Date',
        type: 'Engineered',
        transformation: featureTransformation(feature),
        modelUse: featureUsage(feature),
    })
}

export const featureLab: FeatureLabSnapshot = {
    features,
    steps: [
        { title: 'Date features', detail: [...derivedFeatures.keys()].filter((feature) => feature !== 'IsWeekend').join(' · ') || 'No date-derived features detected', complete: [...derivedFeatures.keys()].some((feature) => feature !== 'IsWeekend') },
        { title: 'Weekend indicator', detail: derivedFeatures.has('IsWeekend') ? 'IsWeekend derived from DayOfWeek' : 'Not found in notebook code', complete: derivedFeatures.has('IsWeekend') },
        { title: 'Open-store filter', detail: openStoreFilter ? 'df_model contains rows where Open == 1' : 'Not found in notebook code', complete: openStoreFilter },
        { title: 'Categorical encoding', detail: oneHotColumns.size ? `One-hot encoding: ${[...oneHotColumns].join(', ')}` : 'No one-hot encoding detected', complete: oneHotColumns.size > 0 },
        { title: 'X feature matrix', detail: hasFeatureMatrix ? 'X is created from df_model' : 'Not found in notebook code', complete: hasFeatureMatrix },
        { title: 'y target', detail: hasTarget ? 'y is assigned from Sales' : 'Not found in notebook code', complete: hasTarget },
    ],
    hasFeatureMatrix,
    hasTarget,
}
