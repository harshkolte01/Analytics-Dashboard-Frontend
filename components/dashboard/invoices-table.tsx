'use client'

import { useEffect, useState, useCallback } from 'react'
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { 
  Search, 
  ChevronLeft, 
  ChevronRight, 
  ArrowUpDown,
  ArrowUp,
  ArrowDown
} from 'lucide-react'

interface Invoice {
  id: string
  invoiceNumber: string
  invoiceDate: string
  deliveryDate: string
  documentType: string
  currencySymbol: string
  subTotal: number
  totalTax: number
  invoiceTotal: number
  vendor: {
    id: string
    vendorName: string
    vendorPartyNumber: string
  }
  customer: {
    id: string
    customerName: string
  }
  paymentStatus: 'paid' | 'pending' | 'overdue'
  lineItemsCount: number
  paymentsCount: number
  nextDueDate: string | null
  createdAt: string
  updatedAt: string
}

interface InvoicesResponse {
  invoices: Invoice[]
  pagination: {
    page: number
    limit: number
    totalCount: number
    totalPages: number
  }
  filters: {
    search: string
    vendorId: string | null
    startDate: string | null
    endDate: string | null
    minAmount: number | null
    maxAmount: number | null
    status: string | null
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

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  })
}

function getStatusColor(status: string): string {
  switch (status) {
    case 'paid':
      return 'bg-green-100 text-green-800'
    case 'overdue':
      return 'bg-red-100 text-red-800'
    case 'pending':
      return 'bg-yellow-100 text-yellow-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}

export function InvoicesTable() {
  const [data, setData] = useState<InvoicesResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Filter states
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [status, setStatus] = useState<string>('all')
  const [page, setPage] = useState(1)
  const [sortField, setSortField] = useState<string>('')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc')

  const limit = 10

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search)
      setPage(1) // Reset to first page when search changes
    }, 500) // 500ms delay

    return () => clearTimeout(timer)
  }, [search])

  // Fetch invoices when debounced search, status, or page changes
  useEffect(() => {
    async function fetchInvoices() {
      setLoading(true)
      try {
        const params = new URLSearchParams({
          page: page.toString(),
          limit: limit.toString(),
        })

        if (debouncedSearch) params.append('search', debouncedSearch)
        if (status && status !== 'all') params.append('status', status)

        const response = await fetch(`/api/invoices?${params}`)
        if (!response.ok) {
          throw new Error('Failed to fetch invoices')
        }
        const invoicesData = await response.json()
        setData(invoicesData)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred')
      } finally {
        setLoading(false)
      }
    }

    fetchInvoices()
  }, [debouncedSearch, status, page])

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
  }

  const getSortIcon = (field: string) => {
    if (sortField !== field) return <ArrowUpDown className="h-4 w-4" />
    return sortDirection === 'asc' ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center space-x-4">
          <div className="h-10 bg-gray-200 rounded animate-pulse flex-1" />
          <div className="h-10 w-32 bg-gray-200 rounded animate-pulse" />
        </div>
        <div className="border rounded-lg">
          <div className="h-12 bg-gray-100 border-b" />
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-16 border-b last:border-b-0 bg-gray-50 animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600">Error loading invoices: {error}</p>
      </div>
    )
  }

  if (!data || !data.invoices || !Array.isArray(data.invoices) || data.invoices.length === 0) {
    return (
      <div className="space-y-4">
        <div className="flex items-center space-x-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search invoices..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="paid">Paid</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="overdue">Overdue</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="text-center py-8">
          <p className="text-gray-500">No invoices found</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex items-center space-x-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search invoices..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-32">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="paid">Paid</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="overdue">Overdue</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50">
              <TableHead className="font-medium">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleSort('vendorName')}
                  className="h-auto p-0 font-medium"
                >
                  Vendor {getSortIcon('vendorName')}
                </Button>
              </TableHead>
              <TableHead className="font-medium">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleSort('invoiceDate')}
                  className="h-auto p-0 font-medium"
                >
                  Date {getSortIcon('invoiceDate')}
                </Button>
              </TableHead>
              <TableHead className="font-medium">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleSort('invoiceNumber')}
                  className="h-auto p-0 font-medium"
                >
                  Invoice # {getSortIcon('invoiceNumber')}
                </Button>
              </TableHead>
              <TableHead className="font-medium text-right">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleSort('invoiceTotal')}
                  className="h-auto p-0 font-medium"
                >
                  Amount {getSortIcon('invoiceTotal')}
                </Button>
              </TableHead>
              <TableHead className="font-medium">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.invoices.map((invoice) => (
              <TableRow key={invoice.id} className="hover:bg-gray-50">
                <TableCell>
                  <div>
                    <div className="font-medium text-gray-900">
                      {invoice.vendor.vendorName}
                    </div>
                    {invoice.vendor.vendorPartyNumber && (
                      <div className="text-sm text-gray-500">
                        #{invoice.vendor.vendorPartyNumber}
                      </div>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="text-sm">
                    {formatDate(invoice.invoiceDate)}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="font-mono text-sm">
                    {invoice.invoiceNumber}
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <div className="font-medium">
                    {formatCurrency(invoice.invoiceTotal)}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge className={getStatusColor(invoice.paymentStatus)}>
                    {invoice.paymentStatus}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-500">
          Showing {((data.pagination.page - 1) * data.pagination.limit) + 1} to{' '}
          {Math.min(data.pagination.page * data.pagination.limit, data.pagination.totalCount)} of{' '}
          {data.pagination.totalCount} invoices
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(page - 1)}
            disabled={page <= 1}
          >
            <ChevronLeft className="h-4 w-4" />
            Previous
          </Button>
          <div className="text-sm text-gray-500">
            Page {data.pagination.page} of {data.pagination.totalPages}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(page + 1)}
            disabled={page >= data.pagination.totalPages}
          >
            Next
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}