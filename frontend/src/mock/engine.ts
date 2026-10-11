import type { PredictionInput, PredictionResult, ScenarioInput, ScenarioResult } from '../types'

function demoSalesEstimate(input: ScenarioInput): number {
  const weeklyAdjustment = input.dayOfWeek === 7 ? -3600 : input.dayOfWeek === 1 ? 1100 : 0
  const holidayAdjustment = input.schoolHoliday ? 190 : 0
  return Math.max(0, Math.round(900 + input.customers * 8.4 + (input.promo ? 1350 : 0) + weeklyAdjustment + holidayAdjustment))
}

export function simulatePrediction(input: PredictionInput): PredictionResult {
  const predictedSales = demoSalesEstimate(input)
  return {
    predictedSales,
    lowerBound: Math.round(predictedSales * 0.82),
    upperBound: Math.round(predictedSales * 1.18),
    modelStatus: 'simulated',
    input,
  }
}

export function simulateScenario(input: ScenarioInput): ScenarioResult {
  return { predictedSales: demoSalesEstimate(input), modelStatus: 'simulated' }
}