'use client'

import { useEffect, useState } from 'react'
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer
} from 'recharts'

interface DailyOutflow {
  date: string
  totalAmount: number
  paymentCount: number
  payments: Array<{
    id: string
    invoiceId: string
    invoiceNumber: string
    vendorName: string
    amount: number
    dueDate: string
    paymentTerms: string
  }>
}

interface WeeklyOutflow {
  weekStart: string
  totalAmount: number
  paymentCount: number
}

interface CashOutflowResponse {
  dateRange: {
    startDate: string
    endDate: string
  }
  summary: {
    totalOutflow: number
    totalPayments: number
  }
  dailyOutflow: DailyOutflow[]
  weeklyOutflow: WeeklyOutflow[]
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value)
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr)
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export function CashOutflowChart() {
  const [data, setData] = useState<CashOutflowResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<'daily' | 'weekly'>('weekly')

  useEffect(() => {
    async function fetchCashOutflowData() {
      try {
        console.log('Fetching cash outflow data...')
        const response = await fetch('/api/cash-outflow')
        if (!response.ok) {
          throw new Error('Failed to fetch cash outflow data')
        }
        const outflowData = await response.json()
        console.log('Cash outflow data:', outflowData)
        setData(outflowData)
      } catch (err) {
        console.error('Cash outflow error:', err)
        setError(err instanceof Error ? err.message : 'An error occurred')
      } finally {
        setLoading(false)
      }
    }

    fetchCashOutflowData()
  }, [])

  if (loading) {
    return (
      <div className="h-64 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="h-64 flex items-center justify-center">
        <p className="text-red-600">Error loading chart: {error}</p>
      </div>
    )
  }

  if (!data || !data.dailyOutflow || !Array.isArray(data.dailyOutflow) ||
      !data.weeklyOutflow || !Array.isArray(data.weeklyOutflow) ||
      (data.dailyOutflow.length === 0 && data.weeklyOutflow.length === 0)) {
    return (
      <div className="h-64 flex items-center justify-center">
        <p className="text-gray-500">No cash outflow data available</p>
      </div>
    )
  }

  const chartData = viewMode === 'daily'
    ? data.dailyOutflow.map(item => ({
        ...item,
        dateFormatted: formatDate(item.date)
      })).slice(0, 30) // Show only next 30 days for daily view
    : data.weeklyOutflow.map(item => ({
        ...item,
        dateFormatted: `Week of ${formatDate(item.weekStart)}`
      })).slice(0, 12) // Show only next 12 weeks

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-medium text-gray-900 mb-2">{label}</p>
          <p className="text-sm text-gray-600 mb-1">
            Total Amount: <span className="font-medium text-red-600">{formatCurrency(data.totalAmount)}</span>
          </p>
          <p className="text-sm text-gray-600">
            Payments: <span className="font-medium">{data.paymentCount}</span>
          </p>
          {viewMode === 'daily' && data.payments && data.payments.length > 0 && (
            <div className="mt-2 pt-2 border-t border-gray-100">
              <p className="text-xs text-gray-500 mb-1">Top payments:</p>
              {data.payments.slice(0, 3).map((payment: any, index: number) => (
                <p key={index} className="text-xs text-gray-600">
                  {payment.vendorName}: {formatCurrency(payment.amount)}
                </p>
              ))}
              {data.payments.length > 3 && (
                <p className="text-xs text-gray-500">
                  +{data.payments.length - 3} more
                </p>
              )}
            </div>
          )}
        </div>
      )
    }
    return null
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-600">
          Expected payment obligations grouped by due date ranges.
        </div>
        <div className="flex bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => setViewMode('weekly')}
            className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
              viewMode === 'weekly'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Weekly
          </button>
          <button
            onClick={() => setViewMode('daily')}
            className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
              viewMode === 'daily'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Daily
          </button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="flex items-center space-x-6 text-sm">
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-red-500 rounded"></div>
          <span className="text-gray-600">Total Outflow:</span>
          <span className="font-semibold">{formatCurrency(data.summary.totalOutflow)}</span>
        </div>
        <div className="text-gray-500">
          {data.summary.totalPayments} payments
        </div>
      </div>

      {/* Chart */}
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
            <defs>
              <linearGradient id="cashOutflowGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#ef4444" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#ef4444" stopOpacity={0.3}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
            <XAxis
              dataKey="dateFormatted"
              stroke="#64748b"
              fontSize={10}
              tickLine={false}
              axisLine={false}
              angle={-45}
              textAnchor="end"
              height={60}
              interval={0}
            />
            <YAxis
              stroke="#64748b"
              fontSize={11}
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => `€${(value / 1000).toFixed(0)}k`}
              width={50}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar
              dataKey="totalAmount"
              fill="url(#cashOutflowGradient)"
              radius={[4, 4, 0, 0]}
              className="hover:opacity-80 transition-opacity"
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Footer Info */}
      <div className="text-xs text-gray-500 text-center">
        {viewMode === 'weekly' ? '12 weeks forecast' : '30 days forecast'}
      </div>
    </div>
  )
}