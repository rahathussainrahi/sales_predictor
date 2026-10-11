import { ArrowRight, Braces, CalendarDays, CircleHelp, Database, ExternalLink, FlaskConical, Gauge, Layers3, UsersRound } from 'lucide-react'
import phaseSixLabUrl from '../../../notebooks/06_model_improvement.ipynb?url'
import type { ModelData, PageKey } from '../types'
import { DemoNotice, formatNumber, formatPkr, Panel, PanelHeading, StatusBadge, TableFrame } from '../components/Primitives'

const featureDefinitions = [
  { name: 'Store', type: 'Categorical ID', source: 'Store', caution: 'One-hot encoded rather than treated as a numeric order' },
  { name: 'DayOfWeek', type: 'Categorical', source: 'DayOfWeek', caution: 'Handled as a category for better representation' },
  { name: 'Promo', type: 'Binary', source: 'Promo', caution: 'Categorical-on/off feature' },
  { name: 'Open', type: 'Binary', source: 'Open', caution: 'Indicates whether the store is open' },
  { name: 'SchoolHoliday', type: 'Binary', source: 'SchoolHoliday', caution: '' },
  { name: 'StateHoliday', type: 'Categorical', source: 'StateHoliday', caution: 'Encoded as separate indicator columns' },
  { name: 'Customers', type: 'Numeric', source: 'Customers', caution: 'Strong sales driver, but only known at prediction time' },
  { name: 'Year', type: 'Calendar', source: 'Date', caution: '' },
  { name: 'Month', type: 'Calendar', source: 'Date', caution: 'Cyclical month effects can be modeled with sine/cosine' },
  { name: 'Day', type: 'Calendar', source: 'Date', caution: '' },
  { name: 'WeekOfYear', type: 'Calendar', source: 'Date', caution: '' },
  { name: 'IsWeekend', type: 'Binary', source: 'DayOfWeek', caution: '' },
]

export function ModelPage({ model, onNavigate }: { model: ModelData; onNavigate: (page: PageKey) => void }) {
  const run = model.runSnapshot
  const trained = model.status === 'Trained' || Boolean(run)
  const equation = run
    ? `Sales = ${run.intercept.toLocaleString('en-US', { maximumFractionDigits: 2 })} ${model.coefficients.map(({ value, feature }) => `${value < 0 ? '−' : '+'} ${Math.abs(value).toLocaleString('en-US', { maximumFractionDigits: 3 })} × ${feature}`).join(' ')}`
    : 'Sales = fitted preprocessing pipeline → linear estimator'

  return (
    <div className="page-stack model-page">
      {run
        ? <DemoNotice>Phase 6 notebook snapshot · model improvement focuses on better categorical encoding and a more realistic time-based validation split.</DemoNotice>
        : model.status === 'Trained'
          ? <div className="evaluation-source-note"><StatusBadge tone="healthy">Live saved pipeline</StatusBadge><span>The artifact does not include its original train/test split or full training record.</span></div>
          : <DemoNotice>The dashboard has no fitted model run yet. Connect a training API or run the Phase 6 notebook to populate model results.</DemoNotice>}

      <Panel className="model-title-panel">
        <div className="model-emblem"><FlaskConical size={21} /></div>
        <div>
          <div className="model-overline">{run ? 'PHASE 06 · MODEL IMPROVEMENT' : 'SAVED INFERENCE PIPELINE'}</div>
          <h2>{model.algorithm}</h2>
          <p>Improve sales forecasting by encoding categories correctly and comparing random validation with a time-aware holdout.</p>
        </div>
        <StatusBadge tone={trained ? 'healthy' : 'warning'}>{run ? 'Notebook fitted' : model.status}</StatusBadge>
      </Panel>

      <div className="model-phase-track" aria-label="Model workflow">
        <span className="model-phase-complete"><i>✓</i> Features</span><span className="model-phase-line" />
        <span className="model-phase-complete"><i>04</i> Baseline</span><span className="model-phase-line" />
        <span className="model-phase-complete"><i>05</i> Evaluation</span><span className="model-phase-line" />
        <span className="model-phase-current"><i>06</i> Improvement</span>
      </div>

      <div className="metrics-grid model-summary-grid">
        <ModelStat icon={Database} label="Open store-days" value={run ? formatNumber(run.openRows) : '—'} detail={run ? 'Rows used for this improved baseline' : 'Training-row count not stored in artifact'} />
        <ModelStat icon={Layers3} label="Training rows" value={run ? formatNumber(run.trainingRows) : '—'} detail={model.trainingSplit === undefined ? 'Split metadata not recorded' : `${model.trainingSplit * 100}% training split`} />
        <ModelStat icon={Gauge} label="Test rows" value={run ? formatNumber(run.testingRows) : '—'} detail={model.testingSplit === undefined ? 'Split metadata not recorded' : `${model.testingSplit * 100}% test split`} />
        <ModelStat icon={Braces} label="Input features" value={formatNumber(model.featureCount)} detail={`Target · ${model.target}`} />
      </div>

      <div className="model-config-grid">
        <Panel>
          <PanelHeading title={run ? 'Improvement setup' : 'Inference pipeline'} detail={run ? 'Reproducible changes from the Phase 6 notebook' : 'Metadata from the saved model artifact'} />
          <div className="config-list">
            <div><span><FlaskConical size={14} /> Estimator</span><strong>{model.algorithm}</strong></div>
            <div><span><Database size={14} /> Train / test</span><strong>{model.trainingSplit === undefined || model.testingSplit === undefined ? 'Not recorded' : `${model.trainingSplit * 100}% / ${model.testingSplit * 100}%`}</strong></div>
            <div><span><Layers3 size={14} /> Validation strategy</span><strong>{run ? 'Random + time-aware comparison' : 'Not recorded in artifact'}</strong></div>
            <div><span><UsersRound size={14} /> Categorical handling</span><strong>{run ? 'One-hot encoding' : 'Fitted preprocessing pipeline'}</strong></div>
            <div><span><CalendarDays size={14} /> Time features</span><strong>Month, weekday, weekend, week-of-year</strong></div>
            <div><span><Braces size={14} /> Target</span><strong>{model.target}</strong></div>
          </div>
        </Panel>
        <Panel className="model-run-panel">
          <PanelHeading title="Training record" detail={run ? 'Notebook artifact and model-improvement score snapshot' : 'Training metadata recorded with the saved artifact'} />
          {run ? (
            <>
              <div className="model-run-status"><span className="model-run-icon"><FlaskConical size={18} /></span><div><strong>Improved model fit completed</strong><small>Phase 6 · categorical encoding + time-aware split</small></div><StatusBadge>Saved</StatusBadge></div>
              <div className="model-run-metrics">
                <div><span>R²</span><strong>{run.metrics.r2.toFixed(4)}</strong></div>
                <div><span>MAE</span><strong>{formatPkr(run.metrics.mae)}</strong></div>
                <div><span>RMSE</span><strong>{formatPkr(run.metrics.rmse)}</strong></div>
              </div>
              <p className="model-artifact-path"><code>{run.artifactPath}</code></p>
            </>
          ) : (
            <div className="training-state">
              <div className="training-ring"><FlaskConical size={23} /></div>
              <strong>{trained ? 'Fitted model reported' : 'Waiting for a training run'}</strong>
              <p>{trained ? 'Detailed training statistics and artifact metadata were not included in the model response.' : 'Training statistics and a fitted artifact will appear when a real model run is connected.'}</p>
            </div>
          )}
          <a className="outline-button model-notebook-link" href={phaseSixLabUrl} target="_blank" rel="noreferrer"><ExternalLink size={14} /> Open Phase 6 notebook</a>
        </Panel>
      </div>

      <Panel>
        <PanelHeading title="Feature set" detail="The prediction pipeline derives calendar inputs from the request date." action={<span className="subtle-tag">{model.featureCount} PIPELINE INPUTS</span>} />
        <div className="model-feature-grid">
          {featureDefinitions.map((feature) => (
            <div className="model-feature-card" key={feature.name}>
              <div><strong>{feature.name}</strong><span>{feature.type}</span></div>
              <small>From {feature.source}</small>
              {feature.caution && <em>{feature.caution}</em>}
            </div>
          ))}
        </div>
        <p className="small-explainer">The improvement workflow keeps only rows where <code>Open = 1</code>, encodes category-like columns with one-hot encoding, and compares a random split with a time-aware future holdout.</p>
      </Panel>

      <Panel>
        <PanelHeading title="Learned linear equation" detail={run ? 'Fitted intercept and coefficients from the improved notebook run' : 'The equation is populated when fitted coefficients are available.'} action={run ? <StatusBadge>Fitted values</StatusBadge> : <span className="subtle-tag">{trained ? 'MODEL API' : 'BEFORE TRAINING'}</span>} />
        <div className="model-equation">{equation}</div>
        <p className="small-explainer">When category indicators are encoded, the model contains many more coefficients than the original baseline. This makes the one-hot representation more faithful to the store and holiday signal without falsely treating IDs as ordered numbers.</p>
      </Panel>

      <Panel>
        <PanelHeading title="Coefficient table" detail={run ? 'Values below reflect the improved model experiment, not the original raw numeric-store baseline.' : 'Fitted coefficient values returned by the model configuration.'} />
        <TableFrame>
          <thead><tr><th>Feature</th><th>Coefficient</th><th>Direction</th></tr></thead>
          <tbody>{model.coefficients.map((item) => (
            <tr key={item.feature}>
              <td><strong>{item.feature}</strong></td>
              <td className="model-coefficient-value">{item.value.toLocaleString('en-US', { minimumFractionDigits: 3, maximumFractionDigits: 6 })}</td>
              <td><span className={`direction-tag ${item.direction.toLowerCase()}`}>{item.direction}</span></td>
            </tr>
          ))}</tbody>
        </TableFrame>
      </Panel>

      <Panel className="model-next-step">
        <div><span className="model-overline">NEXT IN THE WORKFLOW</span><h2>Review test-set performance</h2><p>Check error metrics and diagnostic plots before using predictions for decisions.</p></div>
        <button className="primary-button" type="button" onClick={() => onNavigate('Evaluation')}>Open evaluation <ArrowRight size={15} /></button>
      </Panel>

      <div className="caution-note"><CircleHelp size={15} /><span>This is the improved linear model workflow, not a production forecasting deployment. Store and holiday values are encoded intentionally, and the dashboard should compare random validation with a time-aware holdout before drawing final business conclusions.</span></div>
    </div>
  )
}

function ModelStat({ icon: Icon, label, value, detail }: { icon: React.ElementType; label: string; value: string; detail: string }) {
  return <article className="metric-card"><div className="metric-top"><span>{label}</span><span className="metric-icon"><Icon size={16} /></span></div><strong className="metric-value">{value}</strong><div className="metric-note">{detail}</div></article>
}
