import { useState } from 'react'
import { AlertTriangle, Check, CircleAlert, FileSearch, Gauge, RefreshCw, Rows3, ShieldCheck } from 'lucide-react'
import type { QualityData } from '../types'
import { DemoNotice, formatNumber, MetricCard, Panel, PanelHeading, StatusBadge, TableFrame } from '../components/Primitives'

export function DataQualityPage({ data }: { data: QualityData }) {
    const [showMethod, setShowMethod] = useState(false)
    const totalMissing = data.missing.reduce((sum, item) => sum + item.count, 0)
    const criticalChecks = data.invalidChecks.filter((item) => item.status === 'Critical').length
    const qualityTone = data.score >= 90 ? 'healthy' : data.score >= 75 ? 'warning' : 'critical'

    return (
        <div className="page-stack">
            {data.source === 'demo' && <DemoNotice>Quality checks shown here are a configurable mock profile. Connect the API to calculate them from the current CSV.</DemoNotice>}
            <div className="metrics-grid quality-metrics">
                <MetricCard icon={FileSearch} label="Missing values" value={formatNumber(totalMissing)} note="Across tracked columns" />
                <MetricCard icon={Rows3} label="Duplicate rows" value={formatNumber(data.duplicates)} note="Exact row duplicates" />
                <MetricCard icon={CircleAlert} label="Invalid values" value={formatNumber(data.invalidChecks.reduce((sum, check) => sum + check.count, 0))} note={`${criticalChecks} critical checks`} />
                <MetricCard icon={RefreshCw} label="Columns checked" value={String(data.missing.length)} note="Expected schema: 9 columns" />
            </div>

            <div className="quality-feature-grid">
                <Panel className="quality-score-panel">
                    <PanelHeading title="Data quality score" detail="Weighted completeness, validity, and schema checks" />
                    <div className="quality-score-content"><div className="score-dial" style={{ '--score': `${data.score}%` } as React.CSSProperties}><div><strong>{data.score}%</strong><span>{data.source === 'demo' ? 'DEMO SCORE' : 'CSV PROFILE'}</span></div></div><div className="score-copy"><StatusBadge tone={qualityTone}>{data.score >= 90 ? 'Healthy profile' : 'Review recommended'}</StatusBadge><p>{data.source === 'demo' ? 'This value is illustrative and not a permanent project result.' : 'Calculated from the current training CSV; it summarizes the checks below and is not a general data-quality certification.'}</p><button className="text-button" onClick={() => setShowMethod((shown) => !shown)} type="button">{showMethod ? 'Hide scoring method' : 'How the score is calculated'}</button>{showMethod && <div className="method-note">Completeness 40% · value validity 35% · schema conformance 25%.</div>}</div></div>
                </Panel>
                <Panel>
                    <PanelHeading title="Duplicate analysis" detail="Exact rows are different from duplicate business keys" />
                    <div className="duplicate-stat-grid"><div><span>Exact duplicate rows</span><strong>{formatNumber(data.duplicates)}</strong><small>{((data.duplicates / data.totalRows) * 100).toFixed(2)}% of rows</small></div><div><span>Store + Date duplicates</span><strong>{formatNumber(data.duplicateBusinessKeys)}</strong><small>Business key: Store × Date</small></div></div>
                    <p className="quality-explanation">A row can differ in one field and still share the same store-date key. Evaluate both checks before removing records.</p>
                </Panel>
            </div>

            <Panel>
                <PanelHeading title="Missing values" detail="Completeness checks by source column" action={<StatusBadge tone="healthy">{data.missing.filter((item) => item.count === 0).length} healthy</StatusBadge>} />
                <TableFrame><thead><tr><th>Column</th><th>Missing count</th><th>Missing %</th><th>Status</th></tr></thead><tbody>{data.missing.map((item) => <tr key={item.column}><td><strong>{item.column}</strong></td><td>{formatNumber(item.count)}</td><td>{item.percent.toFixed(2)}%</td><td><StatusBadge tone={item.status === 'Healthy' ? 'healthy' : item.status === 'Warning' ? 'warning' : 'critical'}>{item.status}</StatusBadge></td></tr>)}</tbody></TableFrame>
            </Panel>

            <div className="two-column-layout">
                <Panel>
                    <PanelHeading title="Data validity" detail="Domain and range checks" />
                    <div className="check-list">{data.invalidChecks.map((item) => <div className="check-row" key={item.label}><span className={`check-icon ${item.status.toLowerCase()}`}>{item.status === 'Healthy' ? <Check size={14} /> : <AlertTriangle size={14} />}</span><span>{item.label}</span><strong>{formatNumber(item.count)}</strong><StatusBadge tone={item.status === 'Healthy' ? 'healthy' : item.status === 'Warning' ? 'warning' : 'critical'}>{item.status}</StatusBadge></div>)}</div>
                </Panel>
                <Panel>
                    <PanelHeading title="Data type validation" detail="Current type compared with expected analytical type" />
                    <TableFrame><thead><tr><th>Column</th><th>Current</th><th>Expected</th><th>Status</th></tr></thead><tbody>{data.typeChecks.map((item) => <tr key={item.column}><td><strong>{item.column}</strong></td><td><code>{item.current}</code></td><td><code>{item.expected}</code></td><td><StatusBadge tone={item.status === 'Healthy' ? 'healthy' : 'warning'}>{item.status}</StatusBadge></td></tr>)}</tbody></TableFrame>
                </Panel>
            </div>
            <div className="quality-footnote"><ShieldCheck size={14} /><span>{data.source === 'demo' ? 'Connect the API before treating this mock profile as a quality sign-off.' : 'Counts are computed from the complete training CSV at API load time; investigate any warnings before modeling.'}</span><Gauge size={14} /></div>
        </div>
    )
}