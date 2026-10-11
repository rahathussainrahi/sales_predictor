import { useState } from 'react'
import { ArrowRight, CalendarDays, CircleHelp, LoaderCircle, Sparkles } from 'lucide-react'
import type { FormEvent } from 'react'
import type { PredictionInput, PredictionResult } from '../types'
import { DemoNotice, formatNumber, formatSalesUnits, Panel, PanelHeading, StatusBadge } from '../components/Primitives'

const weekdays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

export function PredictionPage({ onPredict, apiConfigured }: {
  onPredict: (input: PredictionInput) => Promise<PredictionResult>
  apiConfigured: boolean
}) {
  const [form, setForm] = useState<PredictionInput>({ store: 12, dayOfWeek: 5, date: '2015-07-31', customers: 650, promo: true, stateHoliday: '0', schoolHoliday: false })
  const [result, setResult] = useState<PredictionResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setLoading(true)
    setError('')
    try { setResult(await onPredict(form)) }
    catch (caught) { setError(caught instanceof Error ? caught.message : 'Prediction request failed.') }
    finally { setLoading(false) }
  }

  function update<K extends keyof PredictionInput>(key: K, value: PredictionInput[K]) {
    setForm((current) => ({ ...current, [key]: value }))
  }

  function updateDate(date: string) {
    const parsedDate = new Date(`${date}T00:00:00`)
    if (Number.isNaN(parsedDate.getTime())) {
      setForm((current) => ({ ...current, date }))
      return
    }
    const dayOfWeek = parsedDate.getDay() || 7
    setForm((current) => ({ ...current, date, dayOfWeek }))
  }

  return (
    <div className="page-stack">
      {!apiConfigured && <DemoNotice>Demo mode is active. Configure VITE_API_BASE_URL and start FastAPI to send requests to the trained pipeline.</DemoNotice>}
      <div className="prediction-layout">
        <Panel className="prediction-form-panel">
          <PanelHeading title="Store-day inputs" detail={apiConfigured ? 'Submit these retail inputs to the FastAPI model endpoint' : 'Enter a scenario for the isolated demo simulator'} />
          <form className="prediction-form" onSubmit={submit}>
            <div className="form-grid">
              <label>Store<input max="1115" min="1" onChange={(event) => update('store', Number(event.target.value))} type="number" value={form.store} /></label>
              <label>Day of week<input readOnly type="text" value={weekdays[form.dayOfWeek - 1]} /></label>
              <label>Prediction date<input onChange={(event) => updateDate(event.target.value)} required type="date" value={form.date} /></label>
              <label>Expected customers<input max="2000" min="0" onChange={(event) => update('customers', Number(event.target.value))} type="number" value={form.customers} /></label>
              <label>State holiday · extra context<select onChange={(event) => update('stateHoliday', event.target.value)} value={form.stateHoliday}><option value="0">None</option><option value="a">Public holiday (a)</option><option value="b">Easter holiday (b)</option><option value="c">Christmas (c)</option></select></label>
              <label>School holiday<select onChange={(event) => update('schoolHoliday', event.target.value === 'true')} value={String(form.schoolHoliday)}><option value="false">No</option><option value="true">Yes</option></select></label>
            </div>
            <div className="promo-control"><span><strong>Promotion active</strong><small>Apply a promotion in this scenario</small></span><button aria-checked={form.promo} className={`toggle ${form.promo ? 'toggle-on' : ''}`} onClick={() => update('promo', !form.promo)} role="switch" type="button"><i /></button></div>
            <button className="primary-button predict-button" disabled={loading} type="submit">{loading ? <LoaderCircle className="spin" size={16} /> : <Sparkles size={16} />}{loading ? 'Calculating estimate' : 'Predict sales'}<ArrowRight size={15} /></button>
            {error && <div className="inline-error" role="alert">{error}</div>}
          </form>
          <div className="prediction-feature-note"><strong>12 fitted pipeline inputs</strong><span>Store · DayOfWeek · Customers · Open · Promo · StateHoliday · SchoolHoliday · Year · Month · Day · WeekOfYear · IsWeekend</span><small>The API derives calendar fields from the date and preserves the trained feature names and order.</small></div>
        </Panel>
        <Panel className="prediction-result-panel">
          {!result ? <div className="prediction-empty"><span className="prediction-empty-icon"><CalendarDays size={21} /></span><strong>Your estimate will appear here</strong><p>Adjust the store-day inputs and run {apiConfigured ? 'the saved model prediction' : 'a simulated prediction'}.</p></div> : <>
            <div className="result-topline"><span className="result-kicker">{result.modelStatus === 'trained' ? 'MODEL SALES PREDICTION' : 'SIMULATED SALES ESTIMATE'}</span><StatusBadge tone={result.modelStatus === 'trained' ? 'healthy' : 'warning'}>{result.modelStatus === 'trained' ? 'Trained model' : 'Simulator only'}</StatusBadge></div>
            <strong className="prediction-value">{formatSalesUnits(result.predictedSales)}</strong>
            <span className="prediction-unit">{result.modelStatus === 'trained' ? 'Model output · dataset units · range is not a confidence interval' : 'Illustrative dataset units · not a confidence interval'}</span>
            <div className="range-estimate"><div><span>Low scenario estimate</span><strong>{formatSalesUnits(result.lowerBound)}</strong></div><i /><div><span>High scenario estimate</span><strong>{formatSalesUnits(result.upperBound)}</strong></div></div>
            <div className="feature-summary"><div className="feature-summary-title">Input summary <CircleHelp size={13} /></div><div><span>Store</span><strong>{result.input.store}</strong></div><div><span>Customers</span><strong>{formatNumber(result.input.customers)}</strong></div><div><span>Promotion</span><strong>{result.input.promo ? 'Yes' : 'No'}</strong></div><div><span>Date</span><strong>{result.input.date}</strong></div><div><span>Holiday</span><strong>{result.input.stateHoliday === '0' ? 'None' : result.input.stateHoliday}</strong></div></div>
          </>}
        </Panel>
      </div>
      <div className="caution-note"><CircleHelp size={15} /><span>Prediction range is a visual scenario envelope only. It is not calibrated uncertainty or a guarantee of future sales.</span></div>
    </div>
  )
}