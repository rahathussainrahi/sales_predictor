import { useEffect } from 'react'
import { ArrowUpRight, Database, FileArchive, X } from 'lucide-react'
import phaseOneLabUrl from '../../../notebooks/01_data_understanding.zip?url'
import phaseTwoLabUrl from '../../../notebooks/02_exploratory_data_analysis.zip?url'
import phaseThreeLabUrl from '../../../notebooks/03_feature_engineering.zip?url'
import phaseFourLabUrl from '../../../notebooks/04-linear_regression.ipynb?url'
import phaseFiveLabUrl from '../../../notebooks/05_model_evaluation.ipynb?url'
import phaseSixLabUrl from '../../../notebooks/06_model_improvement.ipynb?url'

export function LabDetailsModal({ onClose }: { onClose: () => void }) {
    useEffect(() => {
        function handleEscape(event: KeyboardEvent) { if (event.key === 'Escape') onClose() }
        window.addEventListener('keydown', handleEscape)
        return () => window.removeEventListener('keydown', handleEscape)
    }, [onClose])

    return (
        <div className="modal-scrim" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose() }}>
            <section aria-labelledby="lab-modal-title" aria-modal="true" className="lab-modal" role="dialog">
                <div className="modal-heading"><div><span className="modal-eyebrow">PROJECT WORKSPACE</span><h2 id="lab-modal-title">Lab archives</h2></div><button aria-label="Close details" className="icon-button" onClick={onClose} type="button"><X size={17} /></button></div>
                <p className="modal-intro">Each lab is packaged as a downloadable zip folder so the dashboard reflects the latest notebook exports in the workspace.</p>
                <div className="modal-lab-list">
                    <a href={phaseOneLabUrl} rel="noreferrer" target="_blank" download><span className="lab-file-icon"><FileArchive size={17} /></span><span><strong>Phase 1 · Data Understanding</strong><small>notebooks/01_data_understanding.zip</small><em>Download the zipped lab folder for dataset inspection and cleaning</em></span><ArrowUpRight size={15} /></a>
                    <a href={phaseTwoLabUrl} rel="noreferrer" target="_blank" download><span className="lab-file-icon"><FileArchive size={17} /></span><span><strong>Phase 2 · Exploratory Data Analysis</strong><small>notebooks/02_exploratory_data_analysis.zip</small><em>Download the zipped lab folder for sales patterns and correlation analysis</em></span><ArrowUpRight size={15} /></a>
                    <a href={phaseThreeLabUrl} rel="noreferrer" target="_blank" download><span className="lab-file-icon"><FileArchive size={17} /></span><span><strong>Phase 3 · Feature Engineering</strong><small>notebooks/03_feature_engineering.zip</small><em>Download the zipped lab folder for date features and model preparation</em></span><ArrowUpRight size={15} /></a>
                    <a href={phaseFourLabUrl} rel="noreferrer" target="_blank" download><span className="lab-file-icon"><FileArchive size={17} /></span><span><strong>Phase 4 · Baseline Linear Regression</strong><small>notebooks/04-linear_regression.ipynb</small><em>Open the notebook that fits the first baseline sales model</em></span><ArrowUpRight size={15} /></a>
                    <a href={phaseFiveLabUrl} rel="noreferrer" target="_blank" download><span className="lab-file-icon"><FileArchive size={17} /></span><span><strong>Phase 5 · Model Evaluation</strong><small>notebooks/05_model_evaluation.ipynb</small><em>Review metrics, residuals, and the held-out test-set diagnostics</em></span><ArrowUpRight size={15} /></a>
                    <a href={phaseSixLabUrl} rel="noreferrer" target="_blank" download><span className="lab-file-icon"><FileArchive size={17} /></span><span><strong>Phase 6 · Model Improvement</strong><small>notebooks/06_model_improvement.ipynb</small><em>Explore categorical encoding, time-aware validation, and regularized linear models</em></span><ArrowUpRight size={15} /></a>
                    <div><span className="lab-file-icon"><Database size={17} /></span><span><strong>Rossmann source files</strong><small>data/train.csv · test.csv · store.csv</small><em>Dataset preview is a static mock until GET /api/dataset is connected</em></span></div>
                </div>
                <div className="modal-footnote">Dashboard metrics and charts are illustrative. The linked zipped lab folders reflect the notebooks stored in this project workspace.</div>
            </section>
        </div>
    )
}