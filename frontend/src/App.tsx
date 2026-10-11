import { lazy, Suspense, useEffect, useState } from 'react'
import {
    Activity,
    Boxes,
    Braces,
    ChartNoAxesCombined,
    ClipboardCheck,
    Database,
    Gauge,
    LayoutDashboard,
    Menu,
    PanelLeftClose,
    RefreshCw,
    ShieldCheck,
    SlidersHorizontal,
    Sparkles,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { LabDetailsModal } from './components/LabDetailsModal'
import { api } from './services/api'
import type { DashboardData, DateRange, PageKey } from './types'
import './App.css'
import './dashboard.css'

const DataQualityPage = lazy(() => import('./pages/DataQualityPage').then((module) => ({ default: module.DataQualityPage })))
const DatasetPage = lazy(() => import('./pages/DatasetPage').then((module) => ({ default: module.DatasetPage })))
const EdaPage = lazy(() => import('./pages/EdaPage').then((module) => ({ default: module.EdaPage })))
const EvaluationPage = lazy(() => import('./pages/EvaluationPage').then((module) => ({ default: module.EvaluationPage })))
const FeatureEngineeringPage = lazy(() => import('./pages/FeatureEngineeringPage').then((module) => ({ default: module.FeatureEngineeringPage })))
const ModelPage = lazy(() => import('./pages/ModelPage').then((module) => ({ default: module.ModelPage })))
const OverviewPage = lazy(() => import('./pages/OverviewPage').then((module) => ({ default: module.OverviewPage })))
const PredictionPage = lazy(() => import('./pages/PredictionPage').then((module) => ({ default: module.PredictionPage })))
const WhatIfPage = lazy(() => import('./pages/WhatIfPage').then((module) => ({ default: module.WhatIfPage })))

const navigation: { label: PageKey; icon: LucideIcon }[] = [
    { label: 'Overview', icon: LayoutDashboard },
    { label: 'Dataset', icon: Database },
    { label: 'Data Quality', icon: ShieldCheck },
    { label: 'EDA', icon: ChartNoAxesCombined },
    { label: 'Feature Engineering', icon: Boxes },
    { label: 'Model', icon: Braces },
    { label: 'Evaluation', icon: Gauge },
    { label: 'Prediction', icon: Sparkles },
    { label: 'What-If Analysis', icon: SlidersHorizontal },
]

const pageDescriptions: Record<PageKey, string> = {
    Overview: 'Understand historical sales patterns, explore the ML workflow, and trace each stage to its source lab.',
    Dataset: 'Inspect the Rossmann schema, a searchable data preview, and the field dictionary.',
    'Data Quality': 'Review completeness, validity, duplicates, and schema checks before analysis.',
    EDA: 'Discover patterns, relationships, trends, and anomalies in historical sales.',
    'Feature Engineering': 'Review the 12 inputs used by the saved preprocessing and prediction pipeline.',
    Model: 'Inspect the model workflow and current saved inference pipeline.',
    Evaluation: 'Review notebook holdout scores or full-dataset pipeline diagnostics, with each source and limitation identified.',
    Prediction: 'Send a store-day request to the saved model pipeline through FastAPI.',
    'What-If Analysis': 'Compare simulated sales scenarios by changing business conditions.',
}

const demoMode = !import.meta.env.VITE_API_BASE_URL

function App() {
    const [activePage, setActivePage] = useState<PageKey>('Overview')
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
    const [showLabDetails, setShowLabDetails] = useState(false)
    const [dateRange, setDateRange] = useState<DateRange>('30D')
    const [dashboard, setDashboard] = useState<DashboardData | null>(null)
    const [loading, setLoading] = useState(true)
    const [loadError, setLoadError] = useState('')

    useEffect(() => {
        let cancelled = false
        api.dashboard()
            .then((value) => { if (!cancelled) setDashboard(value) })
            .catch((error: unknown) => { if (!cancelled) setLoadError(error instanceof Error ? error.message : 'Dashboard data could not be loaded.') })
            .finally(() => { if (!cancelled) setLoading(false) })
        return () => { cancelled = true }
    }, [])

    function renderPage() {
        if (!dashboard) return null
        switch (activePage) {
            case 'Overview': return <OverviewPage data={dashboard.overview} range={dateRange} onRangeChange={setDateRange} onNavigate={setActivePage} onOpenLabs={() => setShowLabDetails(true)} />
            case 'Dataset': return <DatasetPage data={dashboard.dataset} />
            case 'Data Quality': return <DataQualityPage data={dashboard.quality} />
            case 'EDA': return <EdaPage data={dashboard.eda} overview={dashboard.overview} />
            case 'Feature Engineering': return <FeatureEngineeringPage model={dashboard.model} />
            case 'Model': return <ModelPage model={dashboard.model} onNavigate={setActivePage} />
            case 'Evaluation': return <EvaluationPage data={dashboard.evaluation} />
            case 'Prediction': return <PredictionPage apiConfigured={!demoMode} onPredict={api.predict} />
            case 'What-If Analysis': return <WhatIfPage apiConfigured={!demoMode} onWhatIf={api.whatIf} />
        }
    }

    return (
        <div className={`app-shell ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
            <aside className={`sidebar ${mobileMenuOpen ? 'sidebar-open' : ''}`}>
                <a className="brand" href="#overview" onClick={() => setActivePage('Overview')}>
                    <span className="brand-mark"><Activity size={20} strokeWidth={2.4} /></span>
                    <span className="brand-copy"><strong>Retail Sales</strong><span>Intelligence</span></span>
                </a>
                <div className="workspace-label">WORKSPACE</div>
                <nav className="main-nav" aria-label="Main navigation">
                    {navigation.map(({ label, icon: Icon }) => (
                        <button
                            aria-current={activePage === label ? 'page' : undefined}
                            className={`nav-item ${activePage === label ? 'active' : ''}`}
                            key={label}
                            onClick={() => { setActivePage(label); setMobileMenuOpen(false) }}
                            type="button"
                        >
                            <Icon size={17} strokeWidth={1.9} />
                            <span>{label}</span>
                            {activePage === label && <span className="nav-indicator" />}
                        </button>
                    ))}
                </nav>
                <div className="sidebar-spacer" />
                <div className="sidebar-status">
                    <div className="status-head"><span className="status-dot" /> {demoMode ? 'Demo environment' : 'API environment'} <span>{demoMode ? 'DEMO' : 'API'}</span></div>
                    <div className="status-row"><span>Model</span><strong>Linear Regression</strong></div>
                    <div className="status-row"><span>Dataset</span><strong>Rossmann Retail</strong></div>
                    <div className="status-note">{demoMode ? 'Demo data · simulated predictions' : 'Live dataset analysis · saved model predictions'}</div>
                </div>
                <button className="collapse-button" onClick={() => setSidebarCollapsed((collapsed) => !collapsed)} title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'} type="button"><PanelLeftClose size={17} /><span>{sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}</span></button>
                <div className="sidebar-foot"><span className="avatar">RS</span><span><strong>Retail workspace</strong><small>Local project</small></span><Menu size={16} /></div>
            </aside>

            <main className="main-area">
                <header className="topbar">
                    <button className="mobile-menu" type="button" aria-label="Open navigation" onClick={() => setMobileMenuOpen((open) => !open)}><Menu size={19} /></button>
                    <div className="breadcrumbs"><span>Retail Intelligence</span><span className="crumb-slash">/</span><strong>{activePage}</strong></div>
                    <div className="topbar-status"><span><i className="status-dot" /> {demoMode ? 'Overview demo' : 'Training CSV live'}</span><span><i className="status-dot status-demo" /> {demoMode ? 'Simulated prediction' : 'Prediction API ready'}</span><button aria-label="Open lab details" className="topbar-lab-button" onClick={() => setShowLabDetails(true)} title="Open lab details" type="button"><ClipboardCheck size={15} /></button></div>
                </header>
                <div className="page-content">
                    <div className="page-heading">
                        <div><div className="eyebrow">ROSSMANN RETAIL <span>•</span> ML WORKSPACE</div><h1>{activePage === 'Overview' ? 'Retail Sales Intelligence' : activePage}</h1><p>{pageDescriptions[activePage]}</p></div>
                        <div className="heading-actions"><button className="outline-button" onClick={() => setShowLabDetails(true)} type="button"><ClipboardCheck size={15} /> Lab details</button><button className="primary-button" onClick={() => setActivePage('Evaluation')} type="button"><Gauge size={15} /> Model evaluation</button></div>
                    </div>
                    {loading && <div className="loading-state"><RefreshCw className="spin" size={17} /> Loading dashboard data…</div>}
                    {loadError && <div className="load-error"><strong>Could not load dashboard data</strong><span>{loadError}</span><button className="outline-button" onClick={() => window.location.reload()} type="button"><RefreshCw size={14} /> Retry</button></div>}
                    {!loading && !loadError && dashboard && <Suspense fallback={<div className="loading-state"><RefreshCw className="spin" size={17} /> Loading {activePage.toLowerCase()}…</div>}>{renderPage()}</Suspense>}
                </div>
            </main>
            {mobileMenuOpen && <button className="mobile-scrim" aria-label="Close navigation" onClick={() => setMobileMenuOpen(false)} type="button" />}
            {showLabDetails && <LabDetailsModal onClose={() => setShowLabDetails(false)} />}
        </div>
    )
}

export default App