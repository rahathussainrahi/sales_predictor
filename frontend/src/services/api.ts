import { dashboardData } from '../mock/data'
import { simulatePrediction, simulateScenario } from '../mock/engine'
import type { DashboardData, EvaluationData, PredictionInput, PredictionResult, ScenarioInput, ScenarioResult } from '../types'

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, '')

async function read<T>(path: string, demoValue: T): Promise<T> {
  if (!apiBaseUrl) return demoValue
  const response = await fetch(`${apiBaseUrl}${path}`)
  if (!response.ok) throw new Error(`Request failed: ${response.status} ${response.statusText}`)
  return response.json() as Promise<T>
}

async function write<TInput, TOutput>(path: string, input: TInput, demoValue: () => TOutput): Promise<TOutput> {
  if (!apiBaseUrl) return demoValue()
  const response = await fetch(`${apiBaseUrl}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  })
  if (!response.ok) throw new Error(`Request failed: ${response.status} ${response.statusText}`)
  return response.json() as Promise<TOutput>
}

export const api = {
  overview: () => read('/api/overview', dashboardData.overview),
  dataset: () => read('/api/dataset', dashboardData.dataset),
  quality: () => read('/api/data-quality', dashboardData.quality),
  eda: () => read('/api/eda', dashboardData.eda),
  features: () => read('/api/features', dashboardData.features),
  model: () => read('/api/model', dashboardData.model),
  evaluation: async (): Promise<EvaluationData> => {
    if (apiBaseUrl) return read('/api/model/evaluation', dashboardData.evaluation)
    const response = await fetch('/data/model-evaluation.json')
    if (!response.ok) throw new Error(`Evaluation data request failed: ${response.status} ${response.statusText}`)
    return response.json() as Promise<EvaluationData>
  },
  dashboard: async (): Promise<DashboardData> => {
    const [overview, dataset, quality, eda, features, model, evaluation] = await Promise.all([
      api.overview(), api.dataset(), api.quality(), api.eda(), api.features(), api.model(), api.evaluation(),
    ])
    return { overview, dataset, quality, eda, features, model, evaluation }
  },
  predict: (input: PredictionInput) => write<PredictionInput, PredictionResult>('/api/predict', input, () => simulatePrediction(input)),
  whatIf: (input: ScenarioInput) => write<ScenarioInput, ScenarioResult>('/api/what-if', input, () => simulateScenario(input)),
}