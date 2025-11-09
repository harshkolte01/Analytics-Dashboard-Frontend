'use client'

import { useEffect, useState } from 'react'
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  Tooltip, 
  Legend
} from 'recharts'

interface CategoryData {
  category: string
  totalSpend: number
  itemCount: number
  percentage: string
}

interface CategoryResponse {
  categories: CategoryData[]
  totalSpend: number
  dateRange: {
    startDate: string | null
    endDate: string | null
  }
}

const COLORS = [
  '#3b82f6', // blue
  '#10b981', // green
  '#f59e0b', // amber
  '#ef4444', // red
  '#8b5cf6', // violet
  '#06b6d4', // cyan
  '#84cc16', // lime
  '#f97316', // orange
  '#ec4899', // pink
  '#6b7280', // gray
]

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value)
}

export function CategorySpendChart() {
  const [data, setData] = useState<CategoryResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchCategoryData() {
      try {
        const response = await fetch('/api/category-spend')
        if (!response.ok) {
          throw new Error('Failed to fetch category data')
        }
        const categoryData = await response.json()
        setData(categoryData)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred')
      } finally {
        setLoading(false)
      }
    }

    fetchCategoryData()
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

  if (!data || !data.categories || !Array.isArray(data.categories) || data.categories.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center">
        <p className="text-gray-500">No category data available</p>
      </div>
    )
  }

  // Take top 8 categories and group the rest as "Others"
  const topCategories = data.categories.slice(0, 8)
  const otherCategories = data.categories.slice(8)
  
  let chartData = [...topCategories]
  
  if (otherCategories.length > 0) {
    const othersTotal = otherCategories.reduce((sum, cat) => sum + cat.totalSpend, 0)
    const othersItemCount = otherCategories.reduce((sum, cat) => sum + cat.itemCount, 0)
    const othersPercentage = ((othersTotal / data.totalSpend) * 100).toFixed(2)
    
    chartData.push({
      category: 'Others',
      totalSpend: othersTotal,
      itemCount: othersItemCount,
      percentage: othersPercentage
    })
  }

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-medium text-gray-900 mb-2">{data.category}</p>
          <p className="text-sm text-gray-600 mb-1">
            Amount: <span className="font-medium text-green-600">{formatCurrency(data.totalSpend)}</span>
          </p>
          <p className="text-sm text-gray-600 mb-1">
            Items: <span className="font-medium">{data.itemCount}</span>
          </p>
          <p className="text-sm text-gray-600">
            Percentage: <span className="font-medium">{data.percentage}%</span>
          </p>
        </div>
      )
    }
    return null
  }

  const CustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
    if (percent < 0.05) return null // Don't show labels for slices less than 5%
    
    const RADIAN = Math.PI / 180
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5
    const x = cx + radius * Math.cos(-midAngle * RADIAN)
    const y = cy + radius * Math.sin(-midAngle * RADIAN)

    return (
      <text 
        x={x} 
        y={y} 
        fill="white" 
        textAnchor={x > cx ? 'start' : 'end'} 
        dominantBaseline="central"
        fontSize={12}
        fontWeight="medium"
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    )
  }

  return (
    <div className="h-80 relative">
      <div className="text-sm text-gray-600 mb-4">
        Distribution of spending across different categories.
      </div>
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                labelLine={false}
                outerRadius={90}
                innerRadius={40}
                fill="#8884d8"
                dataKey="totalSpend"
                stroke="none"
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        </div>
        
        {/* Custom Legend */}
        <div className="w-44 ml-2 space-y-1.5 flex-shrink-0">
          {chartData.map((entry, index) => (
            <div key={entry.category} className="flex items-center justify-between text-xs">
              <div className="flex items-center space-x-1.5 min-w-0 flex-1">
                <div
                  className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                  style={{ backgroundColor: COLORS[index % COLORS.length] }}
                />
                <span
                  className="text-gray-700 truncate overflow-hidden"
                  title={entry.category}
                  style={{ maxWidth: '60px' }}
                >
                  {entry.category.length > 8 ? entry.category.substring(0, 8) + '...' : entry.category}
                </span>
              </div>
              <div className="text-right flex-shrink-0 ml-1">
                <div className="font-semibold text-gray-900 text-xs">
                  {entry.percentage}%
                </div>
                <div className="text-xs text-gray-500">
                  €{(entry.totalSpend / 1000).toFixed(0)}k
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}