'use client'

import { Phone, MapPin, MoreVertical, Trash2, Edit, CreditCard, User } from 'lucide-react'
import { motion, PanInfo, useAnimation } from 'framer-motion'
import { formatCurrency } from '@/lib/utils'

interface Customer {
    id: string
    nama: string
    wilayah: string
    nomor_telepon?: string
    status: string
    tarif: {
        harga_per_bulan: number
    }
}

interface CustomerCardProps {
    customer: Customer
    onPay: () => void
    onEdit: () => void
    onDetail: () => void
}

export default function CustomerCard({ customer, onPay, onEdit, onDetail }: CustomerCardProps) {
    const controls = useAnimation()

    const handleDragEnd = async (event: any, info: PanInfo) => {
        // Threshold for swipe action
        if (info.offset.x < -100) {
            // Swipe left -> Pay
            onPay()
            controls.start({ x: 0 })
        } else if (info.offset.x > 100) {
            // Swipe right -> Detail
            onDetail()
            controls.start({ x: 0 })
        } else {
            // Snap back
            controls.start({ x: 0 })
        }
    }

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'aktif': return 'bg-green-100 text-green-700'
            case 'nonaktif': return 'bg-red-100 text-red-700'
            case 'cuti': return 'bg-yellow-100 text-yellow-700'
            default: return 'bg-gray-100 text-gray-700'
        }
    }

    return (
        <div className="relative mb-3 group">
            {/* Background Actions Layer (Visible on Swipe) */}
            <div className="absolute inset-0 flex rounded-2xl overflow-hidden">
                {/* Left Action (Detail) */}
                <div className="w-1/2 bg-blue-500 flex items-center justify-start pl-6">
                    <User className="text-white w-6 h-6" />
                </div>
                {/* Right Action (Pay) */}
                <div className="w-1/2 bg-green-500 flex items-center justify-end pr-6">
                    <CreditCard className="text-white w-6 h-6" />
                </div>
            </div>

            {/* Card Frontend */}
            <motion.div
                drag="x"
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={0.2}
                onDragEnd={handleDragEnd}
                animate={controls}
                className="relative bg-white p-4 rounded-2xl shadow-sm border border-gray-100 z-10 active:cursor-grabbing"
            >
                <div className="flex items-start justify-between">
                    <div className="flex-1" onClick={onDetail}>
                        <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-bold text-gray-900">{customer.nama}</h3>
                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold capitalize ${getStatusColor(customer.status)}`}>
                                {customer.status}
                            </span>
                        </div>

                        <div className="flex items-center text-gray-500 text-xs mb-1">
                            <MapPin className="w-3 h-3 mr-1" />
                            {customer.wilayah}
                        </div>

                        {customer.nomor_telepon && (
                            <div className="flex items-center text-gray-500 text-xs">
                                <Phone className="w-3 h-3 mr-1" />
                                {customer.nomor_telepon}
                            </div>
                        )}
                    </div>

                    <div className="flex flex-col items-end gap-2">
                        <div className="text-right">
                            <p className="text-[10px] text-gray-400">Tarif</p>
                            <p className="font-bold text-indigo-600 text-sm">
                                {formatCurrency(customer.tarif?.harga_per_bulan || 0)}
                            </p>
                        </div>

                        <div className="flex gap-1" onPointerDownCapture={e => e.stopPropagation()}>
                            <button
                                onClick={onEdit}
                                className="p-2 bg-gray-50 rounded-lg text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                            >
                                <Edit className="w-4 h-4" />
                            </button>
                            <button
                                onClick={onPay}
                                className="p-2 bg-indigo-50 rounded-lg text-indigo-600 hover:bg-indigo-100 transition-colors"
                            >
                                <CreditCard className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                </div>
            </motion.div>
        </div>
    )
}
