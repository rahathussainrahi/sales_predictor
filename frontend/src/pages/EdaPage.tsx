import { useMemo, useState } from 'react'
import { CalendarDays, ChartColumnIncreasing, CircleDot, Grid2X2, MousePointer2, Store, UsersRound } from 'lucide-react'
import type { EdaData, OverviewData } from '../types'
import { CorrelationLegend, EdaBarChart, HistogramChart, ScatterSalesChart } from '../components/Charts'
import { DemoNotice, formatNumber, formatPkr, Panel, PanelHeading, StatusBadge, TableFrame } from '../components/Primitives'

type EdaTab = 'Overview' | 'Sales' | 'Customers' | 'Promotions' | 'Stores' | 'Time' | 'Correlation'
const tabs: { label: EdaTab; icon: typeof ChartColumnIncreasing }[] = [
    { label: 'Overview', icon: Grid2X2 }, { label: 'Sales', icon: ChartColumnIncreasing }, { label: 'Customers', icon: UsersRound },
    { label: 'Promotions', icon: CircleDot }, { label: 'Stores', icon: Store }, { label: 'Time', icon: CalendarDays }, { label: 'Correlation', icon: MousePointer2 },
]

function MatrixCell({ value, onClick, selected }: { value: number; onClick: () => void; selected: boolean }) {
    const intensity = Math.min(Math.abs(value), 1)
    const background = value >= 0 ? `rgba(20, 125, 100, ${0.08 + intensity * 0.6})` : `rgba(189, 81, 78, ${0.08 + intensity * 0.55})`
    return <button aria-label={`Correlation ${value.toFixed(3)}`} className={`matrix-cell ${selected ? 'matrix-selected' : ''}`} onClick={onClick} style={{ backgroundColor: background }} type="button">{value.toFixed(2)}</button>
}

function SalesBoxPlot({ data }: { data: EdaData['salesStatistics'] }) {
    const scale = (value: number) => `${(value / data.max) * 100}%`
    return <div className="boxplot-panel"><div className="boxplot-labels"><span>Min<br /><strong>{formatPkr(data.min)}</strong></span><span>Q1<br /><strong>{formatPkr(data.q1)}</strong></span><span>Median<br /><strong>{formatPkr(data.median)}</strong></span><span>Q3<br /><strong>{formatPkr(data.q3)}</strong></span><span>Max<br /><strong>{formatPkr(data.max)}</strong></span></div><div className="boxplot-track"><i className="boxplot-whisker" style={{ left: scale(data.min), width: `calc(${scale(data.max)} - ${scale(data.min)})` }} /><i className="boxplot-box" style={{ left: scale(data.q1), width: `calc(${scale(data.q3)} - ${scale(data.q1)})` }} /><i className="boxplot-median" style={{ left: scale(data.median) }} /></div><p>Interquartile range shows the middle 50% of sales observations. The summary is drawn from the EDA response.</p></div>
}

export function EdaPage({ data, overview }: { data: EdaData; overview: OverviewData }) {
    const [activeTab, setActiveTab] = useState<EdaTab>('Overview')
    const [selectedPair, setSelectedPair] = useState({ row: 'Customers', column: 'Sales' })
    const [selectedStore, setSelectedStore] = useState(overview.storePerformance[0]?.store ?? 1)
    const sortedStores = useMemo(() => [...overview.storePerformance].sort((left, right) => right.averageSales - left.averageSales), [overview.storePerformance])
    const selectedStoreData = overview.storePerformance.find((item) => item.store === selectedStore)
    const selectedCorrelation = data.correlations.find((row) => row.variable === selectedPair.row)?.values[selectedPair.column] ?? 0

    const matrix = <Panel>
        <PanelHeading title="Correlation matrix" detail="Select any cell to inspect the pair. Association is not causation." />
        <div className="correlation-wrap"><table className="correlation-table"><thead><tr><th></th>{data.correlationLabels.map((label) => <th key={label}>{label}</th>)}</tr></thead><tbody>{data.correlations.map((row) => <tr key={row.variable}><th>{row.variable}</th>{data.correlationLabels.map((column) => <td key={column}><MatrixCell selected={selectedPair.row === row.variable && selectedPair.column === column} value={row.values[column] ?? 0} onClick={() => setSelectedPair({ row: row.variable, column })} /></td>)}</tr>)}</tbody></table></div>
        <CorrelationLegend>−1</CorrelationLegend>
        <div className="correlation-detail"><span className="detail-kicker">SELECTED RELATIONSHIP</span><strong>{selectedPair.row} <span>↔</span> {selectedPair.column}</strong><b className={selectedCorrelation >= 0 ? 'positive-value' : 'negative-value'}>{selectedCorrelation.toFixed(3)}</b><p>{Math.abs(selectedCorrelation) >= 0.7 ? 'Strong' : Math.abs(selectedCorrelation) >= 0.3 ? 'Moderate' : 'Weak'} {selectedCorrelation >= 0 ? 'positive' : 'negative'} linear association in the {data.source === 'demo' ? 'demo profile' : 'training data'}. This does not establish a causal effect.</p></div>
    </Panel>

    return (
        <div className="page-stack">
            {data.source === 'demo' && <DemoNotice>Charts use isolated mock summaries aligned to the Phase 2 lab findings. Connect the API to calculate them from the current training CSV.</DemoNotice>}
            <div className="eda-tabs" role="tablist" aria-label="EDA analyses">{tabs.map(({ label, icon: Icon }) => <button aria-selected={activeTab === label} className={activeTab === label ? 'eda-tab active' : 'eda-tab'} key={label} onClick={() => setActiveTab(label)} role="tab" type="button"><Icon size={15} />{label}</button>)}</div>

            {activeTab === 'Overview' && <>
                <div className="eda-overview-grid">
                    <Panel><PanelHeading title="Sales distribution" detail="Frequency by sales band" /><div className="chart-area chart-short"><HistogramChart data={data.salesHistogram} /></div></Panel>
                    <Panel><PanelHeading title="Customer distribution" detail="Frequency by customer band" /><div className="chart-area chart-short"><HistogramChart color="#668acb" data={data.customerHistogram} /></div></Panel>
                    <Panel className="eda-scatter-panel"><PanelHeading title="Customers vs sales" detail="Store-day observations" /><div className="chart-area chart-short"><ScatterSalesChart data={data.scatter} /></div><div className="inline-stat"><strong>{data.customerSalesCorrelation.toFixed(3)}</strong><span>Sales ↔ Customers Pearson correlation</span></div></Panel>
                    <Panel className="eda-matrix-panel"><PanelHeading title="Correlation" detail="Click a cell to inspect the relationship" /><div className="mini-matrix">{data.correlationLabels.slice(0, 4).map((rowLabel) => <div key={rowLabel}><strong>{rowLabel.slice(0, 3)}</strong>{data.correlationLabels.slice(0, 4).map((column) => <span className="mini-matrix-cell" key={column} style={{ opacity: 0.18 + Math.abs(data.correlations.find((row) => row.variable === rowLabel)?.values[column] ?? 0) * 0.75 }} />)}</div>)}</div><button className="link-button" onClick={() => setActiveTab('Correlation')} type="button">Open full matrix <MousePointer2 size={13} /></button></Panel>
                </div>
                <Panel><PanelHeading title="EDA signals" detail="Observed relationships to investigate, not causal conclusions" /><div className="eda-signal-row"><StatusBadge tone="healthy">Sales skew {data.salesStatistics.skew.toFixed(2)}</StatusBadge><StatusBadge tone="healthy">Customer correlation {data.customerSalesCorrelation.toFixed(3)}</StatusBadge><StatusBadge tone="warning">Store means vary widely</StatusBadge><StatusBadge tone="neutral">Promo difference {data.promotionSalesDeltaPercent >= 0 ? '+' : ''}{data.promotionSalesDeltaPercent.toFixed(1)}%</StatusBadge></div></Panel>
            </>}

            {activeTab === 'Sales' && <>
                <div className="two-column-layout"><Panel><PanelHeading title="Sales distribution" detail="Frequency by sales band" /><div className="chart-area chart-large"><HistogramChart data={data.salesHistogram} /></div></Panel><Panel><PanelHeading title="Sales box plot" detail="Five-number summary · PKR" /><SalesBoxPlot data={data.salesStatistics} /></Panel></div>
                <Panel><PanelHeading title="Sales summary" detail={`Skewness: ${data.salesStatistics.skew.toFixed(2)} · values shown from the Phase 2 analysis`} /><div className="stat-line-grid">{[{ name: 'Mean', value: formatPkr(data.salesStatistics.mean) }, { name: 'Median', value: formatPkr(data.salesStatistics.median) }, { name: 'Std. deviation', value: formatPkr(data.salesStatistics.std) }, { name: 'Minimum', value: formatPkr(data.salesStatistics.min) }, { name: 'Maximum', value: formatPkr(data.salesStatistics.max) }].map((stat) => <div key={stat.name}><span>{stat.name}</span><strong>{stat.value}</strong></div>)}</div></Panel>
            </>}

            {activeTab === 'Customers' && <div className="two-column-layout"><Panel><PanelHeading title="Customers vs sales" detail="Customer volume and sales move together in the observed sample." /><div className="chart-area chart-large"><ScatterSalesChart data={data.scatter} /></div><div className="inline-stat"><strong>{data.customerSalesCorrelation.toFixed(3)}</strong><span>Pearson correlation · R² {data.customerSalesR2.toFixed(3)} for a simple bivariate relationship</span></div></Panel><Panel><PanelHeading title="Average sales by customer volume" detail={data.source === 'demo' ? 'Illustrative volume buckets' : 'Observed volume terciles'} /><div className="chart-area chart-medium"><EdaBarChart data={data.customerBuckets} /></div><p className="small-explainer">{data.source === 'demo' ? 'Customer buckets are demo summaries.' : 'Customer-volume groups are formed from ranked thirds of the training rows.'} Sales averages describe these groups and do not establish causality.</p></Panel></div>}

            {activeTab === 'Promotions' && <><Panel><PanelHeading title="Promotion vs sales" detail="Mean sales differs between observed promotion groups" action={<StatusBadge tone="neutral">Association only</StatusBadge>} /><div className="chart-area chart-large"><EdaBarChart data={data.promoSales} /></div><p className="small-explainer">Promotional activity is associated with changes in sales volume. This comparison is descriptive and does not isolate promotion's causal impact.</p></Panel><Panel><PanelHeading title="Promotion vs customer volume" detail="Mean customers by promotion group" /><div className="chart-area chart-medium"><EdaBarChart color="#668acb" data={data.promoSales} dataKey="customers" /></div></Panel></>}

            {activeTab === 'Stores' && <>
                <Panel><PanelHeading title="Store performance ranking" detail="Average sales, total sales, customers, and promotion frequency" action={<label className="store-select-label">Store detail <select value={selectedStore} onChange={(event) => setSelectedStore(Number(event.target.value))}>{overview.storePerformance.map((item) => <option key={item.store} value={item.store}>Store {item.store}</option>)}</select></label>} />
                    {selectedStoreData && <div className="selected-store-summary"><div><span>Average sales</span><strong>{formatPkr(selectedStoreData.averageSales)}</strong></div><div><span>Total sales</span><strong>{formatPkr(selectedStoreData.totalSales, true)}</strong></div><div><span>Average customers</span><strong>{formatNumber(selectedStoreData.averageCustomers)}</strong></div><div><span>Promotion frequency</span><strong>{selectedStoreData.promoFrequency}%</strong></div></div>}
                    <TableFrame><thead><tr><th>Rank</th><th>Store</th><th>Average sales</th><th>Total sales</th><th>Average customers</th><th>Promo frequency</th></tr></thead><tbody>{sortedStores.map((store, index) => <tr key={store.store}><td>{index + 1}</td><td><strong>Store {store.store}</strong></td><td>{formatPkr(store.averageSales)}</td><td>{formatPkr(store.totalSales, true)}</td><td>{formatNumber(store.averageCustomers)}</td><td>{store.promoFrequency}%</td></tr>)}</tbody></TableFrame>
                </Panel>
                <div className="two-column-layout"><Panel><PanelHeading title="Top stores" detail="Highest demo mean sales" /><div className="chart-area chart-medium"><EdaBarChart data={sortedStores.slice(0, 8).map((store) => ({ label: String(store.store), sales: store.averageSales }))} /></div></Panel><Panel><PanelHeading title="Bottom stores" detail="Lowest demo mean sales" /><div className="chart-area chart-medium"><EdaBarChart color="#c18a65" data={sortedStores.slice(-8).reverse().map((store) => ({ label: String(store.store), sales: store.averageSales }))} /></div></Panel></div>
            </>}

            {activeTab === 'Time' && <><Panel><PanelHeading title="Monthly sales" detail="Mean sales by month · seasonality view" /><div className="chart-area chart-large"><EdaBarChart data={data.monthlySales} /></div></Panel><div className="two-column-layout"><Panel><PanelHeading title="Day-of-week sales" detail="Mean sales by weekday" /><div className="chart-area chart-medium"><EdaBarChart color="#668acb" data={data.weekdaySales} /></div></Panel><Panel><PanelHeading title="Yearly sales" detail="Mean sales by year" /><div className="chart-area chart-medium"><EdaBarChart color="#c18a65" data={data.yearlySales} /></div></Panel></div></>}

            {activeTab === 'Correlation' && matrix}
        </div>
    )
}