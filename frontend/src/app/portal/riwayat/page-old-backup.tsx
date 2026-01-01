'use client'

import PortalLayout from '@/components/PortalLayout'
import { useQuery } from '@tanstack/react-query'
import { customersApi } from '@/lib/api'
import { formatCurrency, formatDateTime, formatMonth } from '@/lib/utils'
import Card from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import { History, Receipt } from 'lucide-react'
import { useEffect, useState } from 'react'

export default function PortalRiwayatPage() {
  const [customerId, setCustomerId] = useState<string>('')

  useEffect(() => {
    const userData = localStorage.getItem('user')
    if (userData) {
      const user = JSON.parse(userData)
      setCustomerId(user.id)
    }
  }, [])

  const { data: customer, isLoading } = useQuery({
    queryKey: ['customer-riwayat', customerId],
    queryFn: async () => {
      const { data } = await customersApi.getOne(customerId)
      return data
    },
    enabled: !!customerId,
  })

  if (isLoading || !customer) {
    return (
      <PortalLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
            <p className="mt-4 text-gray-600">Memuat data...</p>
          </div>
        </div>
      </PortalLayout>
    )
  }

  const payments = customer.payments || []
  const totalPaid = payments.reduce((sum: number, p: any) => sum + p.jumlah_bayar, 0)

  return (
    <PortalLayout>
      <div className="space-y-6">
        {/* Summary */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-2">Total Pembayaran</p>
              <p className="text-4xl font-bold text-gray-900">{payments.length}</p>
              <p className="text-sm text-gray-500 mt-2">transaksi</p>
            </div>
          </Card>

          <Card>
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-2">Total Dibayar</p>
              <p className="text-4xl font-bold text-green-600">{formatCurrency(totalPaid)}</p>
            </div>
          </Card>
        </div>

        {/* Payment History */}
        <Card title="Riwayat Pembayaran">
          {payments.length > 0 ? (
            <div className="space-y-4">
              {payments.map((payment: any) => {
                const bulanDibayar = JSON.parse(payment.bulan_dibayar)
                return (
                  <div
                    key={payment.id}
                    className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-start">
                        <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center mr-3">
                          <Receipt className="w-5 h-5 text-green-600" />
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">
                            {formatDateTime(payment.tanggal_bayar)}
                          </p>
                          <p className="text-sm text-gray-600 mt-1">
                            Bulan: {bulanDibayar.map((m: string) => formatMonth(m)).join(', ')}
                          </p>
                          <div className="flex items-center space-x-2 mt-2">
                            <Badge variant={payment.metode_bayar === 'tunai' ? 'success' : 'info'}>
                              {payment.metode_bayar}
                            </Badge>
                            <span className="text-xs text-gray-500">
                              {bulanDibayar.length} bulan
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-green-600">
                          {formatCurrency(payment.jumlah_bayar)}
                        </p>
                      </div>
                    </div>
                    {payment.catatan && (
                      <div className="mt-3 pt-3 border-t border-gray-200">
                        <p className="text-sm text-gray-600">
                          <span className="font-medium">Catatan:</span> {payment.catatan}
                        </p>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="text-center py-12">
              <History className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">Belum ada riwayat pembayaran</p>
            </div>
          )}
        </Card>
      </div>
    </PortalLayout>
  )
}
