import { useEffect, useMemo, useState } from 'react'
import { ArrowRightLeft, CircleHelp, LoaderCircle, SlidersHorizontal } from 'lucide-react'
import type { ScenarioInput, ScenarioResult } from '../types'
import { EdaBarChart } from '../components/Charts'
import { DemoNotice, formatPkr, Panel, PanelHeading, StatusBadge } from '../components/Primitives'

export function WhatIfPage({ onWhatIf, apiConfigured }: {
  onWhatIf: (input: ScenarioInput) => Promise<ScenarioResult>
  apiConfigured: boolean
}) {
  const [scenario, setScenario] = useState<ScenarioInput>({ store: 12, customers: 650, promo: false, dayOfWeek: 5, schoolHoliday: false })
  const [results, setResults] = useState<{ label: string; sales: number }[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [modelStatus, setModelStatus] = useState<ScenarioResult['modelStatus'] | null>(null)

  const variants = useMemo(() => [
    { label: 'Current', ...scenario },
    { label: 'Promotion', ...scenario, promo: true },
    { label: 'High customers', ...scenario, customers: Math.min(2000, scenario.customers + 500) },
    { label: 'Low customers', ...scenario, customers: Math.max(100, scenario.customers - 300) },
  ], [scenario])

  useEffect(() => {
    let cancelled = false
    const timer = window.setTimeout(() => {
      setLoading(true)
      setError('')
      Promise.all(variants.map(async ({ label, ...input }) => ({ label, ...(await onWhatIf(input)) })))
        .then((values) => {
          if (!cancelled) {
            setResults(values.map((item) => ({ label: item.label, sales: item.predictedSales })))
            setModelStatus(values[0].modelStatus)
          }
        })
        .catch((caught: unknown) => { if (!cancelled) setError(caught instanceof Error ? caught.message : 'Scenario request failed.') })
        .finally(() => { if (!cancelled) setLoading(false) })
    }, 180)
    return () => { cancelled = true; window.clearTimeout(timer) }
  }, [onWhatIf, variants])

  const current = results.find((item) => item.label === 'Current')?.sales ?? 0
  const promoScenario = results.find((item) => item.label === 'Promotion')?.sales ?? 0
  const delta = promoScenario - current

  function setValue<K extends keyof ScenarioInput>(key: K, value: ScenarioInput[K]) {
    setScenario((currentScenario) => ({ ...currentScenario, [key]: value }))
  }

  return (
    <div className="page-stack">
      {!apiConfigured && <DemoNotice>Model simulation, not a guarantee of future sales. Every scenario is calculated by the isolated mock engine.</DemoNotice>}
      <div className="whatif-layout">
        <Panel className="whatif-controls"><PanelHeading title="Scenario inputs" detail="Changes update all scenario estimates" /><div className="slider-control"><div><label htmlFor="customers-slider">Customers</label><strong>{scenario.customers.toLocaleString()}</strong></div><input id="customers-slider" max="2000" min="100" onChange={(event) => setValue('customers', Number(event.target.value))} step="25" type="range" value={scenario.customers} /><div className="slider-bounds"><span>100</span><span>2,000</span></div></div><div className="slider-control"><div><label htmlFor="store-slider">Store</label><strong>{scenario.store}</strong></div><input id="store-slider" max="1115" min="1" onChange={(event) => setValue('store', Number(event.target.value))} step="1" type="range" value={scenario.store} /><div className="slider-bounds"><span>1</span><span>1,115</span></div></div><label className="select-row">Day of week<select onChange={(event) => setValue('dayOfWeek', Number(event.target.value))} value={scenario.dayOfWeek}>{['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map((day, index) => <option key={day} value={index + 1}>{day}</option>)}</select></label><div className="toggle-row"><span>Promotion active</span><button aria-checked={scenario.promo} className={`toggle ${scenario.promo ? 'toggle-on' : ''}`} onClick={() => setValue('promo', !scenario.promo)} role="switch" type="button"><i /></button></div><div className="toggle-row"><span>School holiday</span><button aria-checked={scenario.schoolHoliday} className={`toggle ${scenario.schoolHoliday ? 'toggle-on' : ''}`} onClick={() => setValue('schoolHoliday', !scenario.schoolHoliday)} role="switch" type="button"><i /></button></div><div className="whatif-note"><SlidersHorizontal size={14} /> Scenarios are compared with the same selected store and weekday.</div></Panel>
        <div className="whatif-results">
          <Panel className="scenario-summary"><div className="scenario-value"><span>CURRENT SCENARIO</span><strong>{loading ? '…' : formatPkr(current)}</strong><StatusBadge tone={modelStatus === 'trained' ? 'healthy' : modelStatus === 'simulated' ? 'warning' : 'neutral'}>{modelStatus === 'trained' ? 'Trained model' : modelStatus === 'simulated' ? 'Simulated' : 'Pending'}</StatusBadge></div><ArrowRightLeft className="scenario-switch" size={18} /><div className="scenario-value"><span>PROMOTION ON</span><strong>{loading ? '…' : formatPkr(promoScenario)}</strong><StatusBadge tone="neutral">Compared</StatusBadge></div><div className={`scenario-difference ${delta >= 0 ? 'positive-value' : 'negative-value'}`}><span>Difference</span><strong>{loading ? '…' : `${delta >= 0 ? '+' : '−'}${formatPkr(Math.abs(delta))}`}</strong></div></Panel>
          <Panel><PanelHeading title="Scenario comparison" detail="Current settings compared with alternative inputs" action={loading ? <LoaderCircle className="spin" size={14} /> : null} />{error ? <div className="inline-error" role="alert">{error}</div> : <div className="chart-area chart-large"><EdaBarChart data={results} /></div>}<div className="scenario-legend"><span><i />Estimated sales · {modelStatus === 'trained' ? 'saved model' : modelStatus === 'simulated' ? 'simulated' : 'pending'}</span></div></Panel>
        </div>
      </div>
      <Panel className="scenario-disclaimer"><CircleHelp size={15} /><div><strong>{modelStatus === 'trained' ? 'Model scenario, not a promise.' : modelStatus === 'simulated' ? 'Model simulation, not a promise.' : 'Scenario estimates are not guarantees.'}</strong><p>{modelStatus === 'trained' ? 'Scenarios are predicted by the saved pipeline using a representative date aligned to the selected weekday. Customer counts are assumed inputs; results are not calibrated uncertainty.' : modelStatus === 'simulated' ? 'Changing inputs illustrates the mock response surface only. Configure the API to run scenarios through the trained model.' : 'Scenario results are pending the configured prediction service.'}</p></div></Panel>
    </div>
  )
}