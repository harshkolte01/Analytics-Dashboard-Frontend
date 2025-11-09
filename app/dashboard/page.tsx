import { Suspense } from 'react'
import { OverviewCards } from '@/components/dashboard/overview-cards'
import { InvoiceTrendChart } from '@/components/dashboard/invoice-trend-chart'
import { VendorSpendChart } from '@/components/dashboard/vendor-spend-chart'
import { CategorySpendChart } from '@/components/dashboard/category-spend-chart'
import { CashOutflowChart } from '@/components/dashboard/cash-outflow-chart'
import { InvoicesTable } from '@/components/dashboard/invoices-table'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="pb-2">
              <Skeleton className="h-4 w-24" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-16 mb-2" />
              <Skeleton className="h-3 w-20" />
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-64 w-full" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-64 w-full" />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default function DashboardPage() {
  return (
    <div className="p-8 space-y-8 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-1">Analytics overview and insights</p>
        </div>
      </div>

      <Suspense fallback={<DashboardSkeleton />}>
        {/* Overview Cards */}
        <OverviewCards />

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Invoice Volume + Value Trend */}
          <Card className="shadow-sm border-0 bg-white">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg font-semibold text-gray-900">
                Invoice Volume + Value Trend
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <InvoiceTrendChart />
            </CardContent>
          </Card>

          {/* Spend by Vendor */}
          <Card className="shadow-sm border-0 bg-white">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg font-semibold text-gray-900">
                Spend by Vendor (Top 10)
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <VendorSpendChart />
            </CardContent>
          </Card>

          {/* Spend by Category */}
          <Card className="shadow-sm border-0 bg-white">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg font-semibold text-gray-900">
                Spend by Category
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <CategorySpendChart />
            </CardContent>
          </Card>

          {/* Cash Outflow Forecast */}
          <Card className="shadow-sm border-0 bg-white">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg font-semibold text-gray-900">
                Cash Outflow Forecast
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <CashOutflowChart />
            </CardContent>
          </Card>
        </div>

        {/* Invoices Table */}
        <Card className="shadow-sm border-0 bg-white">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg font-semibold text-gray-900">
              Invoices by Vendor
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <InvoicesTable />
          </CardContent>
        </Card>
      </Suspense>
    </div>
  )
}