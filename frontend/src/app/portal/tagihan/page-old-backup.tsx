'use client'

import PortalLayout from '@/components/PortalLayout'
import { useQuery } from '@tanstack/react-query'
import { customersApi } from '@/lib/api'
import { formatCurrency, formatMonth } from '@/lib/utils'
import Card from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import { Receipt, CheckCircle, AlertCircle } from 'lucide-react'
import { useEffect, useState } from 'react'

export default function PortalTagihanPage() {
  const [customerId, setCustomerId] = useState<string>('')

  useEffect(() => {
    const userData = localStorage.getItem('user')
    if (userData) {
      const user = JSON.parse(userData)
      setCustomerId(user.id)
    }
  }, [])

  const { data: customer, isLoading } = useQuery({
    queryKey: ['customer-tagihan', customerId],
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

  const hasArrears = customer.arrears && customer.arrears.totalArrears > 0

  return (
    <PortalLayout>
      <div className="space-y-6">
        {/* Summary */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-2">Total Tunggakan</p>
              <p className="text-4xl font-bold text-red-600">
                {formatCurrency(customer.arrears?.totalArrears || 0)}
              </p>
              <p className="text-sm text-gray-500 mt-2">
                {customer.arrears?.totalMonths || 0} bulan
              </p>
            </div>
          </Card>

          <Card>
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-2">Tarif Bulanan</p>
              <p className="text-4xl font-bold text-gray-900">
                {formatCurrency(customer.tarif?.harga_per_bulan || 0)}
              </p>
              <p className="text-sm text-gray-500 mt-2">{customer.tarif?.nama_kategori}</p>
            </div>
          </Card>
        </div>

        {/* Arrears Detail */}
        {hasArrears ? (
          <Card title="Detail Tunggakan" subtitle="Bulan yang belum dibayar">
            <div className="space-y-3">
              {customer.arrears.arrearMonths.map((arrear: any) => (
                <div
                  key={arrear.month}
                  className="flex items-center justify-between p-4 bg-red-50 border border-red-200 rounded-lg"
                >
                  <div className="flex items-center">
                    <AlertCircle className="w-5 h-5 text-red-600 mr-3" />
                    <div>
                      <p className="font-semibold text-gray-900">{formatMonth(arrear.month)}</p>
                      <p className="text-sm text-gray-600">{arrear.details}</p>
                      <Badge
                        variant={
                          arrear.source === 'override' ? 'warning' :
                          arrear.source === 'history' ? 'info' : 'default'
                        }
                        className="mt-1"
                      >
                        {arrear.source}
                      </Badge>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-bold text-red-600">
                      {formatCurrency(arrear.amount)}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Payment Info */}
            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h4 className="font-semibold text-blue-900 mb-2">Informasi Pembayaran</h4>
              <p className="text-sm text-blue-800">
                Untuk melakukan pembayaran, silakan hubungi petugas atau datang langsung ke kantor.
                Anda juga bisa melakukan transfer ke rekening yang tersedia.
              </p>
            </div>
          </Card>
        ) : (
          <Card>
            <div className="text-center py-12">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-12 h-12 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Tidak Ada Tunggakan
              </h3>
              <p className="text-gray-600">
                Pembayaran Anda sudah lunas. Terima kasih!
              </p>
            </div>
          </Card>
        )}

        {/* Current Month Info */}
        <Card title="Informasi Tarif Aktif">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm text-gray-600">Kategori Tarif</p>
              <p className="text-lg font-semibold text-gray-900">{customer.tarif?.nama_kategori}</p>
              {customer.tarif?.deskripsi && (
                <p className="text-sm text-gray-500 mt-1">{customer.tarif.deskripsi}</p>
              )}
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-600">Tarif per Bulan</p>
              <p className="text-2xl font-bold text-primary">
                {formatCurrency(customer.tarif?.harga_per_bulan || 0)}
              </p>
            </div>
          </div>
        </Card>
      </div>
    </PortalLayout>
  )
}
