import {
    Area,
    AreaChart,
    Bar,
    BarChart,
    CartesianGrid,
    ReferenceLine,
    ResponsiveContainer,
    Scatter,
    ScatterChart,
    Tooltip,
    XAxis,
    YAxis,
} from 'recharts'
import type { ReactNode } from 'react'
import type { EdaData, OverviewData, TrendPoint } from '../types'
import { formatSalesUnits, formatNumber } from './Primitives'

const axisProps = { tickLine: false, axisLine: false, tick: { fill: '#82908a', fontSize: 10 } }
const gridProps = { stroke: '#edf1ee', strokeDasharray: '3 5', vertical: false }

function SalesTooltip({ active, payload, label }: { active?: boolean; payload?: { payload: TrendPoint }[]; label?: string }) {
    if (!active || !payload?.[0]) return null
    const point = payload[0].payload
    return <div className="chart-tooltip"><strong>{label}</strong><span>Sales <b>{formatSalesUnits(point.sales)} dataset units</b></span><span>Customers <b>{formatNumber(point.customers)}</b></span><span>Promotion <b>{point.promo ? 'Active' : 'None'}</b></span></div>
}

export function SalesTrendChart({ data, compact = false }: { data: TrendPoint[]; compact?: boolean }) {
    return (
        <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 12, right: 8, left: -12, bottom: 0 }}>
                <defs><linearGradient id="salesFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#188568" stopOpacity={0.2} /><stop offset="95%" stopColor="#188568" stopOpacity={0.015} /></linearGradient></defs>
                <CartesianGrid {...gridProps} />
                <XAxis dataKey="date" {...axisProps} minTickGap={40} tickFormatter={(value: string) => value.slice(5)} />
                <YAxis {...axisProps} tickFormatter={(value: number) => compact ? `${Math.round(value / 1000)}k` : formatSalesUnits(value, true)} />
                <Tooltip content={<SalesTooltip />} />
                <Area type="monotone" dataKey="sales" name="Actual sales" stroke="#147d64" strokeWidth={2} fill="url(#salesFill)" activeDot={{ r: 4, strokeWidth: 0 }} />
            </AreaChart>
        </ResponsiveContainer>
    )
}

export function SalesByStoreChart({ data }: { data: OverviewData['storePerformance'] }) {
    const ranked = [...data].sort((left, right) => right.averageSales - left.averageSales).slice(0, 8)
    return (
        <ResponsiveContainer width="100%" height="100%">
            <BarChart data={ranked} layout="vertical" margin={{ top: 2, right: 12, left: 4, bottom: 0 }}>
                <CartesianGrid {...gridProps} />
                <XAxis type="number" {...axisProps} tickFormatter={(value: number) => `${Math.round(value / 1000)}k`} />
                <YAxis type="category" dataKey="store" {...axisProps} width={42} tickFormatter={(value: number) => `Store ${value}`} />
                <Tooltip formatter={(value) => `${formatSalesUnits(Number(value))} dataset units`} contentStyle={{ border: '1px solid #e2e9e5', borderRadius: 6, fontSize: 11 }} />
                <Bar dataKey="averageSales" name="Average sales" fill="#147d64" radius={[0, 3, 3, 0]} barSize={12} />
            </BarChart>
        </ResponsiveContainer>
    )
}

export function MonthlySalesChart({ data }: { data: OverviewData['monthlySales'] }) {
    return (
        <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 8, right: 8, left: -14, bottom: 0 }}>
                <CartesianGrid {...gridProps} />
                <XAxis dataKey="month" {...axisProps} />
                <YAxis {...axisProps} tickFormatter={(value: number) => `${Math.round(value / 1000)}k`} />
                <Tooltip formatter={(value) => `${formatSalesUnits(Number(value))} dataset units`} contentStyle={{ border: '1px solid #e2e9e5', borderRadius: 6, fontSize: 11 }} />
                <Bar dataKey="sales" name="Average sales (thousands)" fill="#7c9e89" radius={[3, 3, 0, 0]} barSize={20} />
            </BarChart>
        </ResponsiveContainer>
    )
}

export function HistogramChart({ data, color = '#4f8e78' }: { data: { bin: string; count: number }[]; color?: string }) {
    return (
        <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 8, right: 8, left: -14, bottom: 0 }}>
                <CartesianGrid {...gridProps} /><XAxis dataKey="bin" {...axisProps} /><YAxis {...axisProps} />
                <Tooltip contentStyle={{ border: '1px solid #e2e9e5', borderRadius: 6, fontSize: 11 }} />
                <Bar dataKey="count" name="Frequency" fill={color} radius={[3, 3, 0, 0]} barSize={29} />
            </BarChart>
        </ResponsiveContainer>
    )
}

export function ScatterSalesChart({ data }: { data: EdaData['scatter'] }) {
    return (
        <ResponsiveContainer width="100%" height="100%">
            <ScatterChart margin={{ top: 10, right: 14, left: -4, bottom: 0 }}>
                <CartesianGrid {...gridProps} /><XAxis type="number" dataKey="customers" name="Customers" {...axisProps} /><YAxis type="number" dataKey="sales" name="Sales" {...axisProps} />
                <Tooltip cursor={{ strokeDasharray: '3 3' }} contentStyle={{ border: '1px solid #e2e9e5', borderRadius: 6, fontSize: 11 }} />
                <Scatter name="Store-day observations" data={data} fill="#3568d4" fillOpacity={0.46} />
            </ScatterChart>
        </ResponsiveContainer>
    )
}

export function EdaBarChart({ data, dataKey = 'sales', color = '#147d64' }: { data: { label: string; sales: number; customers?: number }[]; dataKey?: 'sales' | 'customers'; color?: string }) {
    return (
        <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                <CartesianGrid {...gridProps} /><XAxis dataKey="label" {...axisProps} /><YAxis {...axisProps} tickFormatter={(value: number) => `${Math.round(value / 1000)}k`} />
                <Tooltip formatter={(value) => formatNumber(Number(value))} contentStyle={{ border: '1px solid #e2e9e5', borderRadius: 6, fontSize: 11 }} />
                <Bar dataKey={dataKey} name={dataKey === 'sales' ? 'Average sales' : 'Average customers'} fill={color} radius={[3, 3, 0, 0]} barSize={30} />
            </BarChart>
        </ResponsiveContainer>
    )
}

export function EvaluationScatter({ data }: { data: { actual: number; predicted: number }[] }) {
    if (!data.length) return <div className="chart-empty">Evaluation chart appears after a model is trained and scored.</div>
    const maximum = Math.max(...data.map((point) => Math.max(point.actual, point.predicted)))
    return (
        <ResponsiveContainer width="100%" height="100%">
            <ScatterChart margin={{ top: 12, right: 20, left: 0, bottom: 0 }}>
                <CartesianGrid {...gridProps} /><XAxis type="number" dataKey="actual" name="Actual" {...axisProps} /><YAxis type="number" dataKey="predicted" name="Predicted" {...axisProps} />
                <ReferenceLine segment={[{ x: 0, y: 0 }, { x: maximum, y: maximum }]} stroke="#c76a32" strokeDasharray="5 4" />
                <Tooltip /><Scatter data={data} fill="#3568d4" fillOpacity={0.45} />
            </ScatterChart>
        </ResponsiveContainer>
    )
}

export function ResidualChart({ data }: { data: { predicted: number; residual: number }[] }) {
    if (!data.length) return <div className="chart-empty">Residuals are unavailable until a real evaluation run is connected.</div>
    return (
        <ResponsiveContainer width="100%" height="100%">
            <ScatterChart margin={{ top: 12, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid {...gridProps} />
                <XAxis type="number" dataKey="predicted" name="Predicted sales" {...axisProps} />
                <YAxis type="number" dataKey="residual" name="Residual" {...axisProps} />
                <ReferenceLine y={0} stroke="#c76a32" strokeDasharray="4 4" />
                <Tooltip />
                <Scatter name="Test residuals" data={data} fill="#3568d4" fillOpacity={0.4} />
            </ScatterChart>
        </ResponsiveContainer>
    )
}

export function CorrelationLegend({ children }: { children: ReactNode }) {
    return <div className="correlation-legend">{children}<span>Negative</span><i className="legend-gradient" /><span>Positive</span></div>
}