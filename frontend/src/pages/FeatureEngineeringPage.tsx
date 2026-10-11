import { ArrowDown, ArrowRight, Braces, CalendarDays, CircleHelp, Code2, Database, Hash, Tag } from 'lucide-react'
import type { ModelData } from '../types'
import { DemoNotice, Panel, PanelHeading, StatusBadge, TableFrame } from '../components/Primitives'
import { featureLab } from '../services/featureLab'

export function FeatureEngineeringPage({ model }: { model: ModelData }) {
  return (
    <div className="page-stack">
      <DemoNotice>This page reads the Phase 3 notebook directly. Save notebook changes and refresh the dashboard to see the current feature engineering work.</DemoNotice>
      <Panel>
        <PanelHeading title="From source columns to model inputs" detail="Current implementation detected in notebooks/03_feature_engineering.ipynb." action={<span className="subtle-tag">LIVE FROM LAB</span>} />
        <div className="feature-flow">
          <div className="feature-flow-input"><span className="flow-icon"><Database size={18} /></span><strong>Raw Rossmann fields</strong><small>Date · Store · Promo · Holiday · Customers</small></div>
          <ArrowRight className="flow-arrow" size={18} />
          <div className="feature-flow-group"><div><CalendarDays size={16} /><span><strong>Date features</strong><small>{featureLab.steps[0].detail}</small></span></div><div><Tag size={16} /><span><strong>Categories</strong><small>{featureLab.steps[3].detail}</small></span></div><div><Hash size={16} /><span><strong>Open-store data</strong><small>{featureLab.steps[2].detail}</small></span></div></div>
          <ArrowRight className="flow-arrow" size={18} />
          <div className="feature-flow-output"><span className="flow-icon"><Braces size={18} /></span><strong>Model inputs</strong><small>{featureLab.hasFeatureMatrix ? 'X defined in notebook' : 'X not yet defined'}</small></div>
        </div>
        <div className="feature-direction"><ArrowDown size={14} /> {featureLab.hasTarget ? 'Sales is assigned as the target y in the notebook.' : 'Target y is not yet defined in the notebook.'}</div>
      </Panel>
      <Panel>
        <PanelHeading title="Work completed in the lab" detail="Each item is detected from the current notebook code." />
        <div className="feature-lab-grid">
          {featureLab.steps.map((step) => (
            <div className="feature-lab-card" key={step.title}>
              <StatusBadge tone={step.complete ? 'healthy' : 'neutral'}>{step.complete ? 'Detected' : 'Not detected'}</StatusBadge>
              <strong>{step.title}</strong>
              <span>{step.detail}</span>
            </div>
          ))}
        </div>
      </Panel>
      <Panel>
        <PanelHeading title="Notebook feature inventory" detail="Transformations and X/y status are derived from the feature engineering lab." />
        <TableFrame><thead><tr><th>Feature</th><th>Source</th><th>Type</th><th>Notebook transformation</th><th>Model usage</th></tr></thead><tbody>{featureLab.features.map((feature) => <tr key={feature.feature}><td><strong>{feature.feature}</strong></td><td>{feature.source}</td><td>{feature.type}</td><td>{feature.transformation}</td><td><span className="role-tag role-feature">{feature.modelUse}</span></td></tr>)}</tbody></TableFrame>
      </Panel>
      <Panel>
        <PanelHeading title="Model readiness and leakage check" detail={`Phase 3 prepares features; the separate Phase 4 model status is ${model.status.toLowerCase()}.`} action={<span className="subtle-tag">PHASE 4 · {model.status.toUpperCase()}</span>} />
        <div className="caution-note"><CircleHelp size={15} /><span>Customers is included in X when it remains in df_model. It is useful for historical sales estimation, but may be unavailable when forecasting future sales. Coefficients and evaluation metrics are intentionally not shown as lab outputs.</span><Code2 size={14} /></div>
      </Panel>
    </div>
  )
}