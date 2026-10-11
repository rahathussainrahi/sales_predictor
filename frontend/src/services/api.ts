import { dashboardData } from '../mock/data'
import { simulatePrediction, simulateScenario } from '../mock/engine'
import type { DashboardData, EvaluationData, PredictionInput, PredictionResult, ScenarioInput, ScenarioResult } from '../types'

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, '')

export interface ApiStatus {
  isConfigured: boolean
  baseUrl?: string
  isReachable: boolean
  message: string
  modelLoaded?: boolean
}

async function read<T>(path: string, demoValue: T): Promise<T> {
  if (!apiBaseUrl) return demoValue
  try {
    const response = await fetch(`${apiBaseUrl}${path}`)
    if (!response.ok) {
      const err = await response.json().catch(() => null)
      throw new Error(err?.detail || `HTTP ${response.status} ${response.statusText}`)
    }
    return response.json() as Promise<T>
  } catch (caught) {
    const message = caught instanceof Error ? caught.message : 'Network request failed'
    throw new Error(`Failed to load ${path} from ${apiBaseUrl}: ${message}`)
  }
}

async function write<TInput, TOutput>(path: string, input: TInput, demoValue: () => TOutput): Promise<TOutput> {
  if (!apiBaseUrl) return demoValue()
  try {
    const response = await fetch(`${apiBaseUrl}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    })
    if (!response.ok) {
      const err = await response.json().catch(() => null)
      throw new Error(err?.detail || `HTTP ${response.status} ${response.statusText}`)
    }
    return response.json() as Promise<TOutput>
  } catch (caught) {
    // Never fall back silently to simulated predictions in real API mode
    const message = caught instanceof Error ? caught.message : 'Inference request failed'
    throw new Error(`Prediction failed on ${apiBaseUrl}${path}: ${message}`)
  }
}

export const api = {
  baseUrl: apiBaseUrl,
  isLiveMode: Boolean(apiBaseUrl),

  checkHealth: async (): Promise<ApiStatus> => {
    if (!apiBaseUrl) {
      return {
        isConfigured: false,
        isReachable: false,
        message: 'Standalone Demo Mode (VITE_API_BASE_URL not configured)',
      }
    }
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 4000)
      const response = await fetch(`${apiBaseUrl}/health`, { signal: controller.signal })
      clearTimeout(timeoutId)
      if (!response.ok) {
        return {
          isConfigured: true,
          baseUrl: apiBaseUrl,
          isReachable: false,
          message: `Backend returned HTTP ${response.status} ${response.statusText}`,
        }
      }
      const data = await response.json()
      return {
        isConfigured: true,
        baseUrl: apiBaseUrl,
        isReachable: true,
        message: 'Live FastAPI backend connected',
        modelLoaded: Boolean(data.model_loaded),
      }
    } catch {
      return {
        isConfigured: true,
        baseUrl: apiBaseUrl,
        isReachable: false,
        message: `Backend offline or unreachable at ${apiBaseUrl}`,
      }
    }
  },

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