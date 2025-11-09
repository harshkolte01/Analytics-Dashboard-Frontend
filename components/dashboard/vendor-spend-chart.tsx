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

interface VendorData {
  id: string
  vendorName: string
  vendorPartyNumber: string
  vendorAddress: string
  totalSpend: number
  invoiceCount: number
  firstSeen: string
  lastSeen: string
  latestInvoiceDate: string
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value)
}

function truncateVendorName(name: string, maxLength: number = 20): string {
  return name.length > maxLength ? name.substring(0, maxLength) + '...' : name
}

export function VendorSpendChart() {
  const [data, setData] = useState<VendorData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchVendorData() {
      try {
        const response = await fetch('/api/vendors/top10')
        if (!response.ok) {
          throw new Error('Failed to fetch vendor data')
        }
        const vendorData = await response.json()
        setData(vendorData)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred')
      } finally {
        setLoading(false)
      }
    }

    fetchVendorData()
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
        <p className="text-gray-500">No vendor data available</p>
      </div>
    )
  }

  // Prepare chart data with truncated vendor names
  const chartData = data.map(vendor => ({
    ...vendor,
    vendorNameShort: truncateVendorName(vendor.vendorName, 15)
  })).reverse() // Reverse to show highest at top in horizontal bar chart

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      return (
        <div className="bg-white p-4 border border-gray-200 rounded-xl shadow-lg max-w-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="font-semibold text-gray-900">{data.vendorName}</span>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Vendor Spend:</span>
              <span className="font-semibold text-blue-600">{formatCurrency(data.totalSpend)}</span>
            </div>
            <div className="text-xs text-gray-500">
              {data.invoiceCount} invoices
            </div>
          </div>
        </div>
      )
    }
    return null
  }

  // Calculate max value for percentage calculation
  const maxSpend = Math.max(...chartData.map(item => item.totalSpend))

  return (
    <div className="h-64 relative">
      <div className="text-sm text-gray-600 mb-4">
        Vendor spend with cumulative percentage distribution.
      </div>
      <div className="space-y-2">
        {chartData.map((vendor, index) => {
          const percentage = (vendor.totalSpend / maxSpend) * 100
          const colors = [
            'bg-blue-600', 'bg-blue-500', 'bg-blue-400', 'bg-blue-300', 'bg-blue-200',
            'bg-gray-400', 'bg-gray-300', 'bg-gray-200', 'bg-gray-100', 'bg-gray-50'
          ]
          
          return (
            <div key={vendor.id} className="flex items-center space-x-3 group relative">
              <div className="w-20 text-xs text-gray-700 text-right flex-shrink-0">
                <span className="block truncate" title={vendor.vendorName}>
                  {vendor.vendorName.length > 12 ? vendor.vendorName.substring(0, 12) + '...' : vendor.vendorName}
                </span>
              </div>
              <div className="flex-1 relative">
                {/* Background bar */}
                <div className="h-5 bg-gray-200 rounded-full relative">
                  {/* Colored bar */}
                  <div
                    className={`h-full ${colors[index]} rounded-full transition-all duration-500 ease-out`}
                    style={{ width: `${percentage}%` }}
                  />
                </div>
                {/* Hover tooltip */}
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center pointer-events-none">
                  <div className="bg-white border border-gray-200 shadow-lg text-xs px-2 py-1.5 rounded-md whitespace-nowrap">
                    <div className="font-semibold text-gray-900">{vendor.vendorName}</div>
                    <div className="text-blue-600 font-medium">Vendor Spend: {formatCurrency(vendor.totalSpend)}</div>
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}