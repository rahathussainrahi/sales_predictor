import { CircleHelp, Gauge, Target, TrendingDown } from 'lucide-react'
import type { EvaluationData } from '../types'
import { EvaluationScatter, HistogramChart, ResidualChart } from '../components/Charts'
import { EmptyState, Panel, PanelHeading, StatusBadge } from '../components/Primitives'

export function EvaluationPage({ data }: { data: EvaluationData }) {
    const evaluated = data.status === 'Evaluated'
    const metrics = data.metrics
    const trainingMetrics = data.trainingMetrics
    const fullDataset = data.source === 'api-full-data'
    const metricPrefix = fullDataset ? 'Dataset' : 'Test'
    return (
        <div className="page-stack">
            <div className="evaluation-source-note">
                <span>{fullDataset ? 'Live full-dataset diagnostic' : data.source === 'api' ? 'Live evaluation API' : data.source === 'phase6-notebook' ? 'Phase 6 notebook improvement evaluation' : 'Phase 5 notebook evaluation'}</span>
                <StatusBadge tone={evaluated ? 'healthy' : 'warning'}>{data.status}</StatusBadge>
                {evaluated && fullDataset && data.trainingRows !== undefined && <span>{data.trainingRows.toLocaleString()} modeling rows · no held-out split recorded</span>}
                {evaluated && !fullDataset && data.testingRows !== undefined && <span>{data.testingRows.toLocaleString()} held-out test rows</span>}
            </div>
            <div className="metrics-grid evaluation-metrics">
                <Metric icon={Gauge} label={`${metricPrefix} R²`} value={metrics.r2 === null ? '—' : metrics.r2.toFixed(4)} detail={fullDataset ? 'Not a holdout score' : 'Variance explained on holdout'} />
                <Metric icon={Target} label={`${metricPrefix} MAE`} value={metrics.mae === null ? '—' : `PKR ${metrics.mae.toLocaleString(undefined, { maximumFractionDigits: 2 })}`} detail="Mean absolute error" />
                <Metric icon={TrendingDown} label={`${metricPrefix} RMSE`} value={metrics.rmse === null ? '—' : `PKR ${metrics.rmse.toLocaleString(undefined, { maximumFractionDigits: 2 })}`} detail="Penalizes larger errors" />
                {metrics.mape !== undefined && metrics.mape !== null && <Metric icon={Target} label="MAPE" value={`${(metrics.mape * 100).toFixed(2)}%`} detail={`${(metrics.zeroActualExcluded ?? 0).toLocaleString()} zero-sales rows excluded`} />}
            </div>
            <Panel>
                <PanelHeading title={fullDataset ? 'Evaluation coverage' : 'Training vs. test performance'} detail={fullDataset ? 'The saved inference artifact has no split metadata.' : 'Compare fit to training rows with generalization to held-out rows'} />
                {trainingMetrics ? (
                    <div className="table-scroll">
                        <table>
                            <thead><tr><th>Split</th><th>Rows</th><th>MAE</th><th>RMSE</th><th>R²</th></tr></thead>
                            <tbody>
                                <tr><td>Training</td><td>{data.trainingRows?.toLocaleString() ?? '—'}</td><td>PKR {trainingMetrics.mae.toLocaleString(undefined, { maximumFractionDigits: 2 })}</td><td>PKR {trainingMetrics.rmse.toLocaleString(undefined, { maximumFractionDigits: 2 })}</td><td>{trainingMetrics.r2.toFixed(4)}</td></tr>
                                <tr><td>Test</td><td>{data.testingRows?.toLocaleString() ?? '—'}</td><td>{metrics.mae === null ? '—' : `PKR ${metrics.mae.toLocaleString(undefined, { maximumFractionDigits: 2 })}`}</td><td>{metrics.rmse === null ? '—' : `PKR ${metrics.rmse.toLocaleString(undefined, { maximumFractionDigits: 2 })}`}</td><td>{metrics.r2 === null ? '—' : metrics.r2.toFixed(4)}</td></tr>
                            </tbody>
                        </table>
                    </div>
                ) : fullDataset ? (
                    <p className="small-explainer">Full-dataset residual metrics are available below. A separate held-out score cannot be reported because the saved pipeline does not include its split membership.</p>
                ) : <EmptyState title="Training comparison unavailable" detail="The evaluation response does not include training-set metrics." />}
                {data.meanResidual !== undefined && <p className="small-explainer">Mean {fullDataset ? 'dataset' : 'held-out'} residual: PKR {data.meanResidual.toLocaleString(undefined, { maximumFractionDigits: 2 })}. Positive values indicate average underprediction; negative values indicate average overprediction.</p>}
            </Panel>
            <div className="two-column-layout">
                <Panel><PanelHeading title="Actual vs predicted" detail={`${fullDataset ? 'Full dataset' : 'Held-out rows'} · ${data.actualPredicted.length.toLocaleString()} sampled points`} />{data.actualPredicted.length ? <div className="chart-area chart-large"><EvaluationScatter data={data.actualPredicted} /></div> : <EmptyState title={evaluated ? 'Prediction rows not attached' : 'No evaluation run yet'} detail="Prediction rows are required to render this chart." />}</Panel>
                <Panel><PanelHeading title="Residual distribution" detail={`Frequency across ${fullDataset ? 'dataset' : 'held-out'} prediction errors`} />{data.residualHistogram.length ? <div className="chart-area chart-large"><HistogramChart color="#668acb" data={data.residualHistogram} /></div> : <EmptyState title="Residuals unavailable" detail="The distribution appears after the evaluation provides residual bins." />}</Panel>
            </div>
            <Panel><PanelHeading title="Residuals vs predicted" detail={`Check for changing error spread · ${data.residuals.length.toLocaleString()} sampled points`} />{data.residuals.length ? <div className="chart-area chart-large"><ResidualChart data={data.residuals} /></div> : <EmptyState title="Residual plot unavailable" detail="Residual-versus-predicted analysis requires row-level predictions." />}</Panel>
            <Panel><PanelHeading title="How to read the metrics" detail={fullDataset ? 'Dataset metrics are not evidence of out-of-sample performance' : 'Interpret all scores on data not used to fit the model'} /><div className="metric-explanation-grid"><div><strong>R²</strong><p>Measures the proportion of target variance explained by the model. A higher value is not proof of reliable out-of-sample predictions.</p></div><div><strong>MAE</strong><p>Average absolute difference between observed and predicted sales, in the target's units.</p></div><div><strong>RMSE</strong><p>Penalizes large prediction errors more strongly than MAE because errors are squared before averaging.</p></div></div><div className="caution-note"><CircleHelp size={15} /><span>Compare against a simple baseline and inspect errors by store and date before deciding whether the model is useful.</span></div></Panel>
            <Panel><PanelHeading title="Evaluation scope and caveats" detail="Context for interpreting this model diagnostic" /><p className="small-explainer">{fullDataset ? 'These API metrics compare the saved pipeline with all available rows in df_model.csv. The artifact does not record holdout membership, so these are not held-out test scores and may overstate generalization. The notebook evaluation remains the appropriate source for split-based metrics.' : 'The notebook uses a shuffled random train/test split. Similar training and test scores describe this holdout only; they do not demonstrate future-date forecasting performance. MAPE excludes zero-sales rows and can still be sensitive to small actual values.'}</p></Panel>
        </div>
    )
}

function Metric({ icon: Icon, label, value, detail }: { icon: React.ElementType; label: string; value: string; detail: string }) {
    return <article className={`metric-card ${value === '—' ? 'metric-unavailable' : ''}`}><div className="metric-top"><span>{label}</span><span className="metric-icon"><Icon size={16} /></span></div><strong className="metric-value">{value}</strong><div className="metric-note">{detail}</div></article>
}