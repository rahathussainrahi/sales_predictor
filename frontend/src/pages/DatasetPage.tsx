import { useMemo, useState } from 'react'
import { ArrowDownToLine, ChevronDown, ChevronUp, Columns3, Search } from 'lucide-react'
import type { DatasetData, DatasetRow } from '../types'
import { DemoNotice, formatNumber, formatPkr, Panel, PanelHeading, TableFrame } from '../components/Primitives'

const columns: (keyof DatasetRow)[] = ['Store', 'DayOfWeek', 'Date', 'Sales', 'Customers', 'Open', 'Promo', 'StateHoliday', 'SchoolHoliday']
const columnLabels: Record<keyof DatasetRow, string> = {
  Store: 'Store', DayOfWeek: 'Day', Date: 'Date', Sales: 'Sales', Customers: 'Customers', Open: 'Open', Promo: 'Promo', StateHoliday: 'State holiday', SchoolHoliday: 'School holiday',
}

function exportPreview(rows: DatasetRow[], source: DatasetData['source']) {
  const csv = [columns.join(','), ...rows.map((row) => columns.map((column) => row[column]).join(','))].join('\n')
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }))
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = source === 'training-csv' ? 'rossmann-training-preview.csv' : 'rossmann-preview-demo.csv'
  anchor.click()
  URL.revokeObjectURL(url)
}

export function DatasetPage({ data }: { data: DatasetData }) {
  const [query, setQuery] = useState('')
  const [sortColumn, setSortColumn] = useState<keyof DatasetRow>('Store')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(8)
  const [visibleColumns, setVisibleColumns] = useState<(keyof DatasetRow)[]>(columns)
  const [showStats, setShowStats] = useState(false)

  const filteredRows = useMemo(() => {
    const normalized = query.trim().toLowerCase()
    return data.preview.filter((row) => !normalized || columns.some((column) => String(row[column]).toLowerCase().includes(normalized)))
      .sort((left, right) => {
        const first = left[sortColumn]
        const second = right[sortColumn]
        const result = typeof first === 'number' && typeof second === 'number' ? first - second : String(first).localeCompare(String(second))
        return sortDirection === 'asc' ? result : -result
      })
  }, [data.preview, query, sortColumn, sortDirection])
  const pageCount = Math.max(1, Math.ceil(filteredRows.length / pageSize))
  const pageRows = filteredRows.slice((page - 1) * pageSize, page * pageSize)

  function toggleSort(column: keyof DatasetRow) {
    if (column === sortColumn) setSortDirection((direction) => direction === 'asc' ? 'desc' : 'asc')
    else { setSortColumn(column); setSortDirection('asc') }
  }

  function toggleColumn(column: keyof DatasetRow) {
    setVisibleColumns((current) => current.includes(column) ? current.filter((item) => item !== column) : columns.filter((item) => item === column || current.includes(item)))
  }

  return (
    <div className="page-stack">
      {data.source === 'demo' && <DemoNotice>Dataset metadata reflects the Rossmann training file; preview rows and statistics are isolated demo values.</DemoNotice>}
      <div className="dataset-summary-grid">
        <div><span>DATASET</span><strong>{data.name}</strong></div>
        <div><span>ROWS</span><strong>{formatNumber(data.rows)}</strong></div>
        <div><span>COLUMNS</span><strong>{data.columns}</strong></div>
        <div><span>DATE RANGE</span><strong>{data.dateStart} — {data.dateEnd}</strong></div>
        <div><span>MEMORY</span><strong>{data.memoryUsage}</strong></div>
      </div>

      <Panel>
        <PanelHeading title="Dataset preview" detail={data.source === 'training-csv' ? 'First 12 rows loaded from data/train.csv' : 'A small representative demo preview'} action={<button className="icon-text-button" onClick={() => exportPreview(pageRows, data.source)} type="button"><ArrowDownToLine size={14} /> Export preview</button>} />
        <div className="table-toolbar">
          <label className="search-field"><Search size={15} /><input aria-label="Search rows" onChange={(event) => { setQuery(event.target.value); setPage(1) }} placeholder="Search preview rows" value={query} /></label>
          <details className="column-menu"><summary><Columns3 size={14} /> Columns <ChevronDown size={13} /></summary><div className="column-menu-popover">{columns.map((column) => <label key={column}><input checked={visibleColumns.includes(column)} onChange={() => toggleColumn(column)} type="checkbox" />{columnLabels[column]}</label>)}</div></details>
        </div>
        <TableFrame>
          <thead><tr>{columns.filter((column) => visibleColumns.includes(column)).map((column) => <th key={column}><button className="sort-button" onClick={() => toggleSort(column)} type="button">{columnLabels[column]}{sortColumn === column && (sortDirection === 'asc' ? <ChevronUp size={12} /> : <ChevronDown size={12} />)}</button></th>)}</tr></thead>
          <tbody>
            {pageRows.map((row, index) => <tr key={`${row.Store}-${row.Date}-${index}`}>{columns.filter((column) => visibleColumns.includes(column)).map((column) => <td key={column}>{column === 'Sales' ? formatPkr(row[column]) : column === 'Customers' ? formatNumber(row[column]) : row[column]}</td>)}</tr>)}
            {!pageRows.length && <tr><td className="table-empty" colSpan={visibleColumns.length}>No preview rows match “{query}”.</td></tr>}
          </tbody>
        </TableFrame>
        <div className="table-footer"><span>Showing {pageRows.length ? (page - 1) * pageSize + 1 : 0}–{Math.min(page * pageSize, filteredRows.length)} of {filteredRows.length} preview rows</span><div className="pager"><label>Rows <select value={pageSize} onChange={(event) => { setPageSize(Number(event.target.value)); setPage(1) }}><option>5</option><option>8</option><option>12</option></select></label><button disabled={page <= 1} onClick={() => setPage((value) => value - 1)} type="button">Previous</button><span>{page} / {pageCount}</span><button disabled={page >= pageCount} onClick={() => setPage((value) => value + 1)} type="button">Next</button></div></div>
      </Panel>

      <Panel>
        <PanelHeading title="Column dictionary" detail="Field definitions and their current role in the analysis" />
        <TableFrame><thead><tr><th>Column</th><th>Type</th><th>Description</th><th>Role</th></tr></thead><tbody>{data.dictionary.map((entry) => <tr key={entry.column}><td><strong>{entry.column}</strong></td><td><code>{entry.type}</code></td><td>{entry.description}</td><td><span className={`role-tag role-${entry.role.toLowerCase()}`}>{entry.role}</span></td></tr>)}</tbody></TableFrame>
      </Panel>

      <Panel>
        <button className="expand-heading" onClick={() => setShowStats((shown) => !shown)} type="button"><span><strong>Dataset statistics</strong><small>Numeric summary and missingness for key fields</small></span><span className="expand-action">{showStats ? 'Hide' : 'Expand'} <ChevronDown size={14} /></span></button>
        {showStats && <TableFrame><thead><tr><th>Column</th><th>Mean</th><th>Median</th><th>Min</th><th>Max</th><th>Std</th><th>Missing %</th></tr></thead><tbody>{data.statistics.map((stat) => <tr key={stat.column}><td><strong>{stat.column}</strong></td><td>{formatNumber(stat.mean)}</td><td>{formatNumber(stat.median)}</td><td>{formatNumber(stat.min)}</td><td>{formatNumber(stat.max)}</td><td>{formatNumber(stat.std)}</td><td>{stat.missingPercent}%</td></tr>)}</tbody></TableFrame>}
      </Panel>
    </div>
  )
}