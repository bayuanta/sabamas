'use client'

import AdminLayout from '@/components/AdminLayout'
import RosokSaleList from '@/components/rosok/RosokSaleList'

export default function RosokPage() {
    return (
        <AdminLayout>
            <div className="space-y-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Penjualan Rosok</h1>
                    <p className="text-gray-600">Kelola data penjualan rongsok dan barang bekas.</p>
                </div>

                <RosokSaleList />
            </div>
        </AdminLayout>
    )
}
