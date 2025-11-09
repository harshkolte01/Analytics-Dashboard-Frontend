'use client'

import { useEffect, useState } from 'react'
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Legend
} from 'recharts'

interface TrendData {
  month: string
  invoiceCount: number
  totalSpend: number
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value)
}

function formatMonth(monthStr: string): string {
  const date = new Date(monthStr + '-01')
  return date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' })
}

export function InvoiceTrendChart() {
  const [data, setData] = useState<TrendData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchTrendData() {
      try {
        const response = await fetch('/api/invoice-trends')
        if (!response.ok) {
          throw new Error('Failed to fetch trend data')
        }
        const trendData = await response.json()
        console.log('Invoice trends data:', trendData)
        setData(trendData)
      } catch (err) {
        console.error('Invoice trends error:', err)
        setError(err instanceof Error ? err.message : 'An error occurred')
      } finally {
        setLoading(false)
      }
    }

    fetchTrendData()
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

  if (!data || !Array.isArray(data) || data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center">
        <p className="text-gray-500">No data available</p>
      </div>
    )
  }

  const chartData = data.map((item: TrendData) => ({
    ...item,
    monthFormatted: formatMonth(item.month)
  }))

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-4 border border-gray-200 rounded-xl shadow-lg">
          <p className="font-semibold text-gray-900 mb-3">{label}</p>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Invoice count:</span>
              <span className="font-semibold text-blue-600">{payload[0]?.value || 0}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Total Spend:</span>
              <span className="font-semibold text-green-600">{formatCurrency(payload[1]?.value || 0)}</span>
            </div>
          </div>
        </div>
      )
    }
    return null
  }

  return (
    <div className="h-80 relative">
      <div className="text-sm text-gray-600 mb-4">
        Invoice count and total spend over 12 months.
      </div>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
          <defs>
            <linearGradient id="invoiceCountGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1}/>
              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
            </linearGradient>
            <linearGradient id="totalSpendGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#10b981" stopOpacity={0.1}/>
              <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
          <XAxis
            dataKey="monthFormatted"
            stroke="#64748b"
            fontSize={11}
            tickLine={false}
            axisLine={false}
            dy={10}
          />
          <YAxis
            yAxisId="count"
            orientation="left"
            stroke="#64748b"
            fontSize={11}
            tickLine={false}
            axisLine={false}
            width={40}
          />
          <YAxis
            yAxisId="spend"
            orientation="right"
            stroke="#64748b"
            fontSize={11}
            tickLine={false}
            axisLine={false}
            width={60}
            tickFormatter={(value) => `€${(value / 1000).toFixed(0)}k`}
          />
          <Tooltip content={<CustomTooltip />} />
          <Line
            yAxisId="count"
            type="monotone"
            dataKey="invoiceCount"
            stroke="#3b82f6"
            strokeWidth={3}
            dot={{ fill: '#3b82f6', strokeWidth: 0, r: 5 }}
            activeDot={{ r: 7, stroke: '#3b82f6', strokeWidth: 2, fill: '#ffffff' }}
            fill="url(#invoiceCountGradient)"
          />
          <Line
            yAxisId="spend"
            type="monotone"
            dataKey="totalSpend"
            stroke="#10b981"
            strokeWidth={3}
            dot={{ fill: '#10b981', strokeWidth: 0, r: 5 }}
            activeDot={{ r: 7, stroke: '#10b981', strokeWidth: 2, fill: '#ffffff' }}
            fill="url(#totalSpendGradient)"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}