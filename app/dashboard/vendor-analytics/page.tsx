'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  ScatterChart,
  Scatter,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar
} from 'recharts'
import {
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  Clock,
  DollarSign,
  Users,
  FileText,
  Shield,
  Target,
  Activity,
  Calendar
} from 'lucide-react'

// Types
interface VendorPerformance {
  vendorName: string
  vendorTaxId: string
  totalSpend: number
  invoiceCount: number
  avgInvoiceValue: number
  firstInvoice: string
  lastInvoice: string
  activeMonths: number
  avgPaymentTerms: number
  performanceScore: {
    overall: number
    consistency: number
    volume: number
    reliability: number
  }
}

interface PaymentReliability {
  vendorName: string
  paymentRecords: number
  avgPaymentTerms: number
  avgDiscountRate: number
  overdueCount: number
  overdueRate: number
  discountEligible: number
  discountUtilization: number
  potentialSavings: number
  reliabilityScore: number
}

interface SpendingTrend {
  vendorName: string
  trends: Array<{
    month: string
    invoiceCount: number
    monthlySpend: number
    avgInvoiceValue: number
  }>
  summary: {
    totalSpend: number
    avgMonthlySpend: number
    growthRate: number
    activeMonths: number
    totalInvoices: number
  }
}

interface RiskAssessment {
  vendorName: string
  vendorTaxId: string
  totalInvoices: number
  totalExposure: number
  avgInvoiceValue: number
  invoiceVariability: number
  lateInvoices: number
  lateInvoiceRate: number
  overduePayments: number
  overdueRate: number
  avgPaymentWindow: number
  riskScores: {
    overall: number
    exposure: number
    variability: number
    timeliness: number
    payment: number
  }
  riskCategory: 'Low' | 'Medium' | 'High'
}

// Color schemes
const RISK_COLORS = {
  Low: '#10B981',
  Medium: '#F59E0B',
  High: '#EF4444'
}

const CHART_COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4', '#84CC16', '#F97316']

// Utility functions
const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

const formatDate = (dateStr: string): string => {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  })
}

const getScoreColor = (score: number): string => {
  if (score >= 80) return 'text-green-600'
  if (score >= 60) return 'text-yellow-600'
  return 'text-red-600'
}

const getRiskBadgeVariant = (category: string) => {
  switch (category) {
    case 'Low': return 'default'
    case 'Medium': return 'secondary'
    case 'High': return 'destructive'
    default: return 'outline'
  }
}

// Performance Scorecard Component
function PerformanceScorecard({ data }: { data: VendorPerformance[] }) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {data.slice(0, 9).map((vendor, index) => (
          <Card key={vendor.vendorTaxId || index} className="relative">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium truncate">
                  {vendor.vendorName}
                </CardTitle>
                <div className={`text-2xl font-bold ${getScoreColor(vendor.performanceScore.overall)}`}>
                  {vendor.performanceScore.overall}
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <p className="text-gray-500">Total Spend</p>
                  <p className="font-semibold">{formatCurrency(vendor.totalSpend)}</p>
                </div>
                <div>
                  <p className="text-gray-500">Invoices</p>
                  <p className="font-semibold">{vendor.invoiceCount}</p>
                </div>
                <div>
                  <p className="text-gray-500">Avg Invoice</p>
                  <p className="font-semibold">{formatCurrency(vendor.avgInvoiceValue)}</p>
                </div>
                <div>
                  <p className="text-gray-500">Active Months</p>
                  <p className="font-semibold">{vendor.activeMonths}</p>
                </div>
              </div>
              
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span>Consistency</span>
                  <span className={getScoreColor(vendor.performanceScore.consistency)}>
                    {vendor.performanceScore.consistency}%
                  </span>
                </div>
                <div className="flex justify-between text-xs">
                  <span>Volume</span>
                  <span className={getScoreColor(vendor.performanceScore.volume)}>
                    {vendor.performanceScore.volume}%
                  </span>
                </div>
                <div className="flex justify-between text-xs">
                  <span>Reliability</span>
                  <span className={getScoreColor(vendor.performanceScore.reliability)}>
                    {vendor.performanceScore.reliability}%
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

// Payment Reliability Chart Component
function PaymentReliabilityChart({ data }: { data: PaymentReliability[] }) {
  const chartData = data.slice(0, 10).map(vendor => ({
    name: vendor.vendorName.length > 15 ? vendor.vendorName.substring(0, 15) + '...' : vendor.vendorName,
    fullName: vendor.vendorName,
    reliabilityScore: vendor.reliabilityScore,
    avgPaymentTerms: vendor.avgPaymentTerms,
    overdueRate: vendor.overdueRate,
    discountUtilization: vendor.discountUtilization,
    potentialSavings: vendor.potentialSavings
  }))

  return (
    <div className="space-y-6">
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="name" 
              angle={-45}
              textAnchor="end"
              height={80}
              fontSize={12}
            />
            <YAxis />
            <Tooltip 
              formatter={(value, name) => [
                name === 'reliabilityScore' ? `${value}%` : 
                name === 'avgPaymentTerms' ? `${value} days` :
                name === 'overdueRate' ? `${value}%` :
                name === 'discountUtilization' ? `${value}%` :
                formatCurrency(Number(value)),
                name === 'reliabilityScore' ? 'Reliability Score' :
                name === 'avgPaymentTerms' ? 'Avg Payment Terms' :
                name === 'overdueRate' ? 'Overdue Rate' :
                name === 'discountUtilization' ? 'Discount Utilization' :
                'Potential Savings'
              ]}
              labelFormatter={(label) => chartData.find(d => d.name === label)?.fullName || label}
            />
            <Legend />
            <Bar dataKey="reliabilityScore" fill="#10B981" name="Reliability Score" />
            <Bar dataKey="overdueRate" fill="#EF4444" name="Overdue Rate %" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {data.slice(0, 8).map((vendor, index) => (
          <Card key={index} className="p-4">
            <div className="space-y-2">
              <h4 className="font-medium text-sm truncate" title={vendor.vendorName}>
                {vendor.vendorName}
              </h4>
              <div className="space-y-1 text-xs">
                <div className="flex justify-between">
                  <span className="text-gray-500">Payment Terms:</span>
                  <span>{vendor.avgPaymentTerms} days</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Overdue Rate:</span>
                  <span className={vendor.overdueRate > 10 ? 'text-red-600' : 'text-green-600'}>
                    {vendor.overdueRate}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Discount Rate:</span>
                  <span>{vendor.avgDiscountRate}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Potential Savings:</span>
                  <span className="font-semibold">{formatCurrency(vendor.potentialSavings)}</span>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}


// Spending Trends Chart Component
function SpendingTrendsChart({ data }: { data: SpendingTrend[] }) {
  const [selectedVendors, setSelectedVendors] = useState<string[]>(
    data.slice(0, 5).map(v => v.vendorName)
  )

  // Prepare data for line chart
  const allMonths = Array.from(
    new Set(
      data.flatMap(vendor =>
        vendor.trends.map(trend => trend.month)
      )
    )
  ).sort()

  const chartData = allMonths.map(month => {
    const dataPoint: any = { month: new Date(month).toLocaleDateString('en-US', { month: 'short', year: '2-digit' }) }
    
    selectedVendors.forEach(vendorName => {
      const vendor = data.find(v => v.vendorName === vendorName)
      const trend = vendor?.trends.find(t => t.month === month)
      dataPoint[vendorName] = trend?.monthlySpend || 0
    })
    
    return dataPoint
  })

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2">
        {data.slice(0, 10).map(vendor => (
          <Button
            key={vendor.vendorName}
            variant={selectedVendors.includes(vendor.vendorName) ? "default" : "outline"}
            size="sm"
            onClick={() => {
              setSelectedVendors(prev =>
                prev.includes(vendor.vendorName)
                  ? prev.filter(v => v !== vendor.vendorName)
                  : [...prev, vendor.vendorName].slice(0, 5) // Limit to 5 vendors
              )
            }}
            className="text-xs"
          >
            {vendor.vendorName.length > 20 ? vendor.vendorName.substring(0, 20) + '...' : vendor.vendorName}
          </Button>
        ))}
      </div>

      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis tickFormatter={(value) => formatCurrency(value)} />
            <Tooltip
              formatter={(value) => [formatCurrency(Number(value)), 'Monthly Spend']}
              labelFormatter={(label) => `Month: ${label}`}
            />
            <Legend />
            {selectedVendors.map((vendorName, index) => (
              <Line
                key={vendorName}
                type="monotone"
                dataKey={vendorName}
                stroke={CHART_COLORS[index % CHART_COLORS.length]}
                strokeWidth={2}
                dot={{ r: 4 }}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {data.slice(0, 6).map((vendor, index) => (
          <Card key={index} className="p-4">
            <div className="space-y-2">
              <h4 className="font-medium text-sm truncate" title={vendor.vendorName}>
                {vendor.vendorName}
              </h4>
              <div className="space-y-1 text-xs">
                <div className="flex justify-between">
                  <span className="text-gray-500">Total Spend:</span>
                  <span className="font-semibold">{formatCurrency(vendor.summary.totalSpend)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Avg Monthly:</span>
                  <span>{formatCurrency(vendor.summary.avgMonthlySpend)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Growth Rate:</span>
                  <span className={`flex items-center ${vendor.summary.growthRate >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {vendor.summary.growthRate >= 0 ? <TrendingUp className="h-3 w-3 mr-1" /> : <TrendingDown className="h-3 w-3 mr-1" />}
                    {vendor.summary.growthRate}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Active Months:</span>
                  <span>{vendor.summary.activeMonths}</span>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}

// Risk Assessment Component
function RiskAssessmentChart({ data }: { data: RiskAssessment[] }) {
  // Prepare data for scatter plot (Risk vs Exposure)
  const scatterData = data.map(vendor => ({
    x: vendor.totalExposure,
    y: vendor.riskScores.overall,
    name: vendor.vendorName,
    category: vendor.riskCategory,
    totalInvoices: vendor.totalInvoices,
    overdueRate: vendor.overdueRate
  }))

  // Risk distribution for pie chart
  const riskDistribution = [
    { name: 'Low Risk', value: data.filter(v => v.riskCategory === 'Low').length, color: RISK_COLORS.Low },
    { name: 'Medium Risk', value: data.filter(v => v.riskCategory === 'Medium').length, color: RISK_COLORS.Medium },
    { name: 'High Risk', value: data.filter(v => v.riskCategory === 'High').length, color: RISK_COLORS.High }
  ].filter(item => item.value > 0)

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Risk vs Exposure Scatter Plot */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Risk vs Financial Exposure</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                  <CartesianGrid />
                  <XAxis 
                    type="number" 
                    dataKey="x" 
                    name="Exposure"
                    tickFormatter={(value) => formatCurrency(value)}
                  />
                  <YAxis 
                    type="number" 
                    dataKey="y" 
                    name="Risk Score"
                    domain={[0, 100]}
                  />
                  <Tooltip
                    formatter={(value, name) => [
                      name === 'x' ? formatCurrency(Number(value)) : `${value}%`,
                      name === 'x' ? 'Financial Exposure' : 'Risk Score'
                    ]}
                    labelFormatter={(label: any, payload: any) => {
                      if (payload && payload[0]) {
                        const data = payload[0].payload
                        return `${data.name} (${data.category} Risk)`
                      }
                      return label
                    }}
                  />
                  <Scatter 
                    data={scatterData} 
                    fill="#3B82F6"
                  />
                </ScatterChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Risk Distribution Pie Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Risk Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={riskDistribution}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value, percent }) => `${name}: ${value} (${(percent * 100).toFixed(0)}%)`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {riskDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Risk Details Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {data.slice(0, 9).map((vendor, index) => (
          <Card key={index} className="relative">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium truncate">
                  {vendor.vendorName}
                </CardTitle>
                <Badge variant={getRiskBadgeVariant(vendor.riskCategory)}>
                  {vendor.riskCategory}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <p className="text-gray-500">Exposure</p>
                  <p className="font-semibold">{formatCurrency(vendor.totalExposure)}</p>
                </div>
                <div>
                  <p className="text-gray-500">Risk Score</p>
                  <p className={`font-semibold ${getScoreColor(100 - vendor.riskScores.overall)}`}>
                    {vendor.riskScores.overall}%
                  </p>
                </div>
                <div>
                  <p className="text-gray-500">Invoices</p>
                  <p className="font-semibold">{vendor.totalInvoices}</p>
                </div>
                <div>
                  <p className="text-gray-500">Overdue Rate</p>
                  <p className={`font-semibold ${vendor.overdueRate > 10 ? 'text-red-600' : 'text-green-600'}`}>
                    {vendor.overdueRate}%
                  </p>
                </div>
              </div>
              
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span>Exposure Risk</span>
                  <span className={getScoreColor(100 - vendor.riskScores.exposure)}>
                    {vendor.riskScores.exposure}%
                  </span>
                </div>
                <div className="flex justify-between text-xs">
                  <span>Payment Risk</span>
                  <span className={getScoreColor(100 - vendor.riskScores.payment)}>
                    {vendor.riskScores.payment}%
                  </span>
                </div>
                <div className="flex justify-between text-xs">
                  <span>Timeliness Risk</span>
                  <span className={getScoreColor(100 - vendor.riskScores.timeliness)}>
                    {vendor.riskScores.timeliness}%
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

// Main Component
export default function VendorAnalyticsPage() {
  const [performanceData, setPerformanceData] = useState<VendorPerformance[]>([])
  const [reliabilityData, setReliabilityData] = useState<PaymentReliability[]>([])
  const [trendsData, setTrendsData] = useState<SpendingTrend[]>([])
  const [riskData, setRiskData] = useState<RiskAssessment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [timeframe, setTimeframe] = useState('12')

  const fetchData = async () => {
    setLoading(true)
    setError(null)
    
    try {
      const [performanceRes, reliabilityRes, trendsRes, riskRes] = await Promise.all([
        fetch(`/api/vendor-analytics/performance-scorecard?timeframe=${timeframe}&limit=20`),
        fetch(`/api/vendor-analytics/payment-reliability?limit=15`),
        fetch(`/api/vendor-analytics/spending-trends?months=${timeframe}&topVendors=10`),
        fetch(`/api/vendor-analytics/risk-assessment?limit=20`)
      ])

      const [performance, reliability, trends, risk] = await Promise.all([
        performanceRes.json(),
        reliabilityRes.json(),
        trendsRes.json(),
        riskRes.json()
      ])

      if (performance.success) setPerformanceData(performance.data)
      if (reliability.success) setReliabilityData(reliability.data)
      if (trends.success) setTrendsData(trends.data)
      if (risk.success) setRiskData(risk.data)

    } catch (err) {
      setError('Failed to load vendor analytics data')
      console.error('Error fetching vendor analytics:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [timeframe])

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading vendor analytics...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Data</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button onClick={fetchData}>Try Again</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Vendor Relationship Analytics</h1>
          <p className="text-gray-600">Comprehensive vendor performance, reliability, and risk analysis</p>
        </div>
        <div className="flex items-center space-x-4">
          <Select value={timeframe} onValueChange={setTimeframe}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="6">6 Months</SelectItem>
              <SelectItem value="12">12 Months</SelectItem>
              <SelectItem value="24">24 Months</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={fetchData} variant="outline">
            <Activity className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Users className="h-8 w-8 text-blue-600" />
              <div>
                <p className="text-sm text-gray-600">Active Vendors</p>
                <p className="text-2xl font-bold">{performanceData.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <DollarSign className="h-8 w-8 text-green-600" />
              <div>
                <p className="text-sm text-gray-600">Total Spend</p>
                <p className="text-2xl font-bold">
                  {formatCurrency(performanceData.reduce((sum, v) => sum + v.totalSpend, 0))}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <FileText className="h-8 w-8 text-purple-600" />
              <div>
                <p className="text-sm text-gray-600">Total Invoices</p>
                <p className="text-2xl font-bold">
                  {performanceData.reduce((sum, v) => sum + v.invoiceCount, 0)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Shield className="h-8 w-8 text-orange-600" />
              <div>
                <p className="text-sm text-gray-600">High Risk Vendors</p>
                <p className="text-2xl font-bold text-red-600">
                  {riskData.filter(v => v.riskCategory === 'High').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="performance" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="performance">Performance Scorecard</TabsTrigger>
          <TabsTrigger value="reliability">Payment Reliability</TabsTrigger>
          <TabsTrigger value="trends">Spending Trends</TabsTrigger>
          <TabsTrigger value="risk">Risk Assessment</TabsTrigger>
        </TabsList>

        <TabsContent value="performance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Target className="h-5 w-5 mr-2" />
                Vendor Performance Scorecards
              </CardTitle>
            </CardHeader>
            <CardContent>
              <PerformanceScorecard data={performanceData} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reliability" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Clock className="h-5 w-5 mr-2" />
                Payment Reliability Analysis
              </CardTitle>
            </CardHeader>
            <CardContent>
              <PaymentReliabilityChart data={reliabilityData} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="trends" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <TrendingUp className="h-5 w-5 mr-2" />
                Spending Trends Analysis
              </CardTitle>
            </CardHeader>
            <CardContent>
              <SpendingTrendsChart data={trendsData} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="risk" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <AlertTriangle className="h-5 w-5 mr-2" />
                Vendor Risk Assessment
              </CardTitle>
            </CardHeader>
            <CardContent>
              <RiskAssessmentChart data={riskData} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}