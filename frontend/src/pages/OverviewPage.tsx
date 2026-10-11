import { useMemo } from 'react'
import {
    Activity,
    ArrowDownToLine,
    ArrowRight,
    ArrowUpRight,
    CalendarDays,
    CircleHelp,
    Database,
    Eye,
    FileText,
    Gauge,
    ShieldCheck,
    Sparkles,
    Store,
    UsersRound,
} from 'lucide-react'
import phaseOneLabUrl from '../../../notebooks/01_data_understanding.ipynb?url'
import phaseTwoLabUrl from '../../../notebooks/02_exploratory_data_analysis.ipynb?url'
import type { DateRange, OverviewData, PageKey } from '../types'
import { DemoNotice, formatNumber, formatSalesUnits, MetricCard, Panel, PanelHeading, StatusBadge } from '../components/Primitives'
import { MonthlySalesChart, SalesByStoreChart, SalesTrendChart } from '../components/Charts'

const dateRanges: DateRange[] = ['7D', '30D', '3M', '6M', '1Y', 'All']
const rangeDays: Record<DateRange, number> = { '7D': 7, '30D': 30, '3M': 90, '6M': 180, '1Y': 365, All: 0 }

function exportTrend(data: OverviewData['salesTrend']) {
    const csv = ['Date,Sales,Customers,Promotion', ...data.map((row) => `${row.date},${row.sales},${row.customers},${row.promo ? 'Yes' : 'No'}`)].join('\n')
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }))
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = 'retail-sales-trend.csv'
    anchor.click()
    URL.revokeObjectURL(url)
}

export function OverviewPage({ data, range, onRangeChange, onNavigate, onOpenLabs }: {
    data: OverviewData
    range: DateRange
    onRangeChange: (range: DateRange) => void
    onNavigate: (page: PageKey) => void
    onOpenLabs: () => void
}) {
    const trendData = useMemo(() => {
        const count = rangeDays[range]
        return count ? data.salesTrend.slice(-count) : data.salesTrend
    }, [data.salesTrend, range])
    const totalTrend = trendData.reduce((sum, item) => sum + item.sales, 0)
    const previousTrend = data.salesTrend.slice(-trendData.length * 2, -trendData.length)
    const trendDelta = previousTrend.length ? ((totalTrend / previousTrend.reduce((sum, item) => sum + item.sales, 0) - 1) * 100) : 0

    return (
        <div className="page-stack">
            {data.source === 'training-csv'
                ? <div className="evaluation-source-note"><StatusBadge tone="healthy">Live training data</StatusBadge><span>{formatNumber(data.datasetRows)} rows · {data.dateStart} to {data.dateEnd}</span></div>
                : <DemoNotice>Static demonstration snapshot · not a live connection to the training CSV</DemoNotice>}
            <div className="metrics-grid">
                <MetricCard icon={Activity} label="Total sales" value={formatSalesUnits(data.totalSales, true)} note={`${data.source === 'demo' ? 'Demo snapshot' : 'Training data'} · dataset units`} />
                <MetricCard icon={CalendarDays} label="Average sales per store-day" value={formatSalesUnits(data.averageDailySales)} note="Mean across recorded store-days · dataset units" />
                <MetricCard icon={Store} label="Stores" value={formatNumber(data.totalStores)} note="Rossmann store identifiers" />
                <MetricCard icon={UsersRound} label="Average customers" value={formatNumber(data.averageCustomers)} note="Per open store-day" />
            </div>

            <Panel className="trend-panel">
                <PanelHeading
                    title="Sales trend"
                    detail={`${trendData[0]?.date ?? ''} to ${trendData.at(-1)?.date ?? ''} · daily total sales · dataset units`}
                    action={<button className="icon-text-button" type="button" onClick={() => exportTrend(trendData)} title="Export chart data as CSV"><ArrowDownToLine size={14} /> Export</button>}
                />
                <div className="trend-summary"><strong>{formatSalesUnits(totalTrend, true)}</strong><span className={trendDelta >= 0 ? 'delta-positive' : 'delta-negative'}>{trendDelta >= 0 ? <ArrowUpRight size={13} /> : <ArrowUpRight className="delta-down" size={13} />}{Math.abs(trendDelta).toFixed(1)}% vs previous period</span><span className="trend-legend"><i />Actual sales · dataset units</span></div>
                <div className="range-control" role="group" aria-label="Sales chart date range">
                    {dateRanges.map((dateRange) => <button aria-pressed={range === dateRange} className={range === dateRange ? 'selected' : ''} key={dateRange} onClick={() => onRangeChange(dateRange)} type="button">{dateRange}</button>)}
                </div>
                <div className="chart-area chart-tall"><SalesTrendChart data={trendData} /></div>
            </Panel>

            <div className="two-column-layout">
                <Panel>
                    <PanelHeading title="Sales by store" detail="Highest mean sales · selected stores" action={<button className="link-button" onClick={() => onNavigate('EDA')} type="button">Explore <ArrowRight size={13} /></button>} />
                    <div className="chart-area chart-medium"><SalesByStoreChart data={data.storePerformance} /></div>
                </Panel>
                <Panel>
                    <PanelHeading title="Sales by month" detail="Mean sales per store-day by calendar month · dataset units" action={<span className="subtle-tag">SEASONALITY</span>} />
                    <div className="chart-area chart-medium"><MonthlySalesChart data={data.monthlySales} /></div>
                </Panel>
            </div>

            <Panel>
                <PanelHeading title="Signals from the lab" detail="Observations carried forward from Phase 2 EDA" action={<button className="link-button" onClick={() => onNavigate('EDA')} type="button">Open EDA <ArrowRight size={13} /></button>} />
                <div className="insight-grid">
                    {data.insights.map((insight, index) => (
                        <article className={`insight-card insight-${insight.tone}`} key={insight.title}>
                            <span className="insight-index">0{index + 1}</span><div><strong>{insight.title}</strong><p>{insight.detail}</p></div>
                        </article>
                    ))}
                </div>
            </Panel>

            <Panel>
                <PanelHeading title="ML pipeline" detail="Follow the project from observed data to a future prediction" />
                <div className="pipeline-track">
                    {[
                        { name: 'Dataset', icon: Database, state: 'Available', page: 'Dataset' as PageKey },
                        { name: 'Cleaning', icon: ShieldCheck, state: 'Reviewed', page: 'Data Quality' as PageKey },
                        { name: 'EDA', icon: Eye, state: 'Complete', page: 'EDA' as PageKey },
                        { name: 'Features', icon: Sparkles, state: '12 pipeline inputs', page: 'Feature Engineering' as PageKey },
                        { name: 'Regression', icon: Activity, state: 'Fitted pipeline', page: 'Model' as PageKey },
                        { name: 'Evaluation', icon: Gauge, state: 'See evaluation page', page: 'Evaluation' as PageKey },
                        { name: 'Prediction', icon: ArrowUpRight, state: 'FastAPI endpoint', page: 'Prediction' as PageKey },
                    ].map(({ name, icon: Icon, state, page }, index) => (
                        <button className={`pipeline-step ${index < 6 ? 'pipeline-done' : ''} ${index === 4 ? 'pipeline-current' : ''}`} key={name} onClick={() => onNavigate(page)} type="button">
                            <span className="pipeline-icon"><Icon size={16} /></span><strong>{name}</strong><small>{state}</small>
                            {index < 6 && <span className="pipeline-connector" />}
                        </button>
                    ))}
                </div>
            </Panel>

            <Panel className="lab-panel">
                <PanelHeading title="Workspace lab details" detail="These dashboard references point to the project files in this workspace." action={<button className="link-button" onClick={onOpenLabs} type="button">View lab details <ArrowRight size={13} /></button>} />
                <div className="lab-resource-grid">
                    <a className="lab-resource" href={phaseOneLabUrl} target="_blank" rel="noreferrer"><span className="lab-file-icon"><FileText size={17} /></span><span><strong>Phase 1 · Data understanding</strong><small>notebooks/01_data_understanding.ipynb</small></span><ArrowUpRight size={15} /></a>
                    <a className="lab-resource" href={phaseTwoLabUrl} target="_blank" rel="noreferrer"><span className="lab-file-icon"><FileText size={17} /></span><span><strong>Phase 2 · Exploratory analysis</strong><small>notebooks/02_exploratory_data_analysis.ipynb</small></span><ArrowUpRight size={15} /></a>
                    <button className="lab-resource lab-resource-action" onClick={() => onNavigate('Dataset')} type="button"><span className="lab-file-icon"><Database size={17} /></span><span><strong>Source dataset</strong><small>data/train.csv · 1,017,209 rows</small></span><ArrowUpRight size={15} /></button>
                </div>
                <p className="lab-footnote"><CircleHelp size={12} /> {data.source === 'training-csv' ? 'Overview charts use the training CSV. Other analysis panels remain separately labeled demo or notebook snapshots.' : 'Open notebook links use the real workspace files. Dashboard visualizations use isolated demo data until the backend is connected.'}</p>
            </Panel>
        </div>
    )
}