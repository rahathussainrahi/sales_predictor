import type { ReactNode } from 'react'
import { ArrowDownRight, ArrowUpRight, Info } from 'lucide-react'

export function formatSalesUnits(value: number, compact = false): string {
  return new Intl.NumberFormat('en-US', {
    maximumFractionDigits: compact ? 1 : 0,
    notation: compact ? 'compact' : 'standard',
  }).format(value)
}

export function formatPkr(value: number, compact = false): string {
  // Alias for backward compatibility; formats as dataset units
  return formatSalesUnits(value, compact)
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(value)
}


export function Panel({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <section className={`panel ${className}`}>{children}</section>
}

export function PanelHeading({ title, detail, action }: { title: string; detail?: string; action?: ReactNode }) {
  return (
    <div className="panel-heading">
      <div><h2>{title}</h2>{detail && <p>{detail}</p>}</div>
      {action}
    </div>
  )
}

export function MetricCard({ label, value, note, trend, icon: Icon }: {
  label: string; value: string; note: string; trend?: 'up' | 'down'; icon: React.ElementType
}) {
  return (
    <article className="metric-card">
      <div className="metric-top"><span>{label}</span><span className="metric-icon"><Icon size={16} /></span></div>
      <strong className="metric-value">{value}</strong>
      <div className="metric-note">{trend === 'up' ? <ArrowUpRight size={13} /> : trend === 'down' ? <ArrowDownRight size={13} /> : <Info size={12} />}<span>{note}</span></div>
    </article>
  )
}

export function StatusBadge({ children, tone = 'healthy' }: { children: ReactNode; tone?: 'healthy' | 'warning' | 'critical' | 'neutral' }) {
  return <span className={`status-badge status-${tone}`}><i />{children}</span>
}

export function DemoNotice({ children = 'Illustrative mock data · not a trained model result' }: { children?: ReactNode }) {
  return <div className="demo-notice"><Info size={13} /><span>{children}</span></div>
}

export function EmptyState({ title, detail }: { title: string; detail: string }) {
  return <div className="empty-state"><div className="empty-mark"><Info size={17} /></div><strong>{title}</strong><p>{detail}</p></div>
}

export function TableFrame({ children }: { children: ReactNode }) {
  return <div className="table-scroll"><table>{children}</table></div>
}