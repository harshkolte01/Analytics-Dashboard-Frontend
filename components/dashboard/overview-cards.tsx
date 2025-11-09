'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  DollarSign, 
  FileText, 
  Upload, 
  TrendingUp,
  TrendingDown,
  Minus
} from 'lucide-react'

interface StatsData {
  totalInvoices: number
  totalSpend: number
  vendorCount: number
  pendingPayments: number
  currentMonth: {
    invoices: number
    spend: number
  }
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

function formatNumber(num: number): string {
  return new Intl.NumberFormat('en-US').format(num)
}

export function OverviewCards() {
  const [stats, setStats] = useState<StatsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchStats() {
      try {
        const response = await fetch('/api/stats')
        if (!response.ok) {
          throw new Error('Failed to fetch stats')
        }
        const data = await response.json()
        setStats(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred')
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [])

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="pb-2">
              <div className="h-4 bg-gray-200 rounded animate-pulse" />
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-gray-200 rounded animate-pulse mb-2" />
              <div className="h-3 bg-gray-200 rounded animate-pulse w-20" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (error || !stats) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="col-span-full">
          <CardContent className="pt-6">
            <p className="text-red-600">Error loading stats: {error}</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const averageInvoiceValue = stats.totalInvoices > 0 ? stats.totalSpend / stats.totalInvoices : 0

  const cards = [
    {
      title: 'Total Spend (YTD)',
      value: formatCurrency(stats.totalSpend),
      icon: DollarSign,
      trend: stats.currentMonth.spend > 0 ? 'up' : 'neutral',
      trendValue: `+8.2% from last month`,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      iconColor: 'text-green-600',
    },
    {
      title: 'Total Invoices Processed',
      value: formatNumber(stats.totalInvoices),
      icon: FileText,
      trend: stats.currentMonth.invoices > 0 ? 'up' : 'neutral',
      trendValue: `+8.2% from last month`,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      iconColor: 'text-blue-600',
    },
    {
      title: 'Documents Uploaded',
      value: formatNumber(stats.totalInvoices),
      icon: Upload,
      trend: 'down',
      trendValue: `-8 less from last month`,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      iconColor: 'text-purple-600',
    },
    {
      title: 'Average Invoice Value',
      value: formatCurrency(averageInvoiceValue),
      icon: TrendingUp,
      trend: 'up',
      trendValue: `+8.2% from last month`,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      iconColor: 'text-orange-600',
    },
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {cards.map((card, index) => {
        const Icon = card.icon
        const TrendIcon = card.trend === 'up' ? TrendingUp : card.trend === 'down' ? TrendingDown : Minus
        const trendColor = card.trend === 'up' ? 'text-green-600' : card.trend === 'down' ? 'text-red-600' : 'text-gray-500'
        
        return (
          <Card key={index} className="relative overflow-hidden shadow-sm border-0 bg-white">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">
                {card.title}
              </CardTitle>
              <div className={`p-2 rounded-lg ${card.bgColor}`}>
                <Icon className={`h-5 w-5 ${card.iconColor}`} />
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-2xl font-bold text-gray-900 mb-2">
                {card.value}
              </div>
              <div className={`flex items-center text-xs font-medium ${trendColor}`}>
                <TrendIcon className="h-3 w-3 mr-1" />
                {card.trendValue}
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}