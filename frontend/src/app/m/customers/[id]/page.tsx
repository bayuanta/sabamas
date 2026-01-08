'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { customersApi, paymentsApi } from '@/lib/api'
import { formatCurrency } from '@/lib/utils'
import MobileHeader from '@/components/mobile/MobileHeader'
import {
    User, Phone, MapPin, Calendar, Clock, Receipt,
    AlertCircle, CheckCircle, Edit, ArrowRight, MessageCircle
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { format } from 'date-fns'
import { id as idLocale } from 'date-fns/locale'

export default function MobileCustomerDetailPage() {
    const params = useParams()
    const router = useRouter()
    const customerId = params.id as string
    const [activeTab, setActiveTab] = useState('profil')

    // Fetch Customer Detail
    const { data: customer, isLoading } = useQuery({
        queryKey: ['customer', customerId],
        queryFn: async () => {
            const { data } = await customersApi.getOne(customerId)
            return data
        }
    })

    // Helper: WhatsApp Link
    const getWALink = (phone: string) => {
        if (!phone) return '#'
        let number = phone.replace(/\D/g, '')
        if (number.startsWith('0')) number = '62' + number.slice(1)
        return `https://wa.me/${number}`
    }

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            </div>
        )
    }

    if (!customer) return null

    // Data aliases for UI consistency with Web
    const totalArrears = customer.arrears?.totalArrears || 0
    const arrearMonths = customer.arrears?.arrearMonths || []
    const totalMonths = customer.arrears?.totalMonths || arrearMonths.length
    const historyPayments = customer.payments || []

    return (
        <div className="min-h-screen bg-gray-50 pb-20">
            <MobileHeader
                title="Detail Pelanggan"
                backUrl="/m/customers"
                actions={
                    <button
                        onClick={() => router.push(`/m/customers/${customerId}/edit`)}
                        className="p-2 -mr-2 text-indigo-600"
                    >
                        <Edit className="w-5 h-5" />
                    </button>
                }
            />

            {/* Top Info Card */}
            <div className="bg-white p-6 shadow-sm mb-2">
                <div className="flex items-start justify-between mb-4">
                    <div>
                        <h1 className="text-xl font-bold text-gray-900">{customer.nama}</h1>
                        <p className="text-gray-500 text-sm mt-1 flex items-center gap-1">
                            <User className="w-3.5 h-3.5" />
                            {customer.nomor_pelanggan}
                        </p>
                    </div>
                    <span className={`px-2.5 py-1 rounded-lg text-xs font-bold uppercase tracking-wide
                        ${customer.status === 'aktif' ? 'bg-green-100 text-green-700' :
                            customer.status === 'cuti' ? 'bg-orange-100 text-orange-700' : 'bg-red-100 text-red-700'}
                    `}>
                        {customer.status}
                    </span>
                </div>

                {/* Arrears & Actions */}
                <div className="grid grid-cols-2 gap-3 mt-4">
                    <div className={`rounded-xl p-3 border ${totalArrears > 0 ? 'bg-red-50 border-red-100' : 'bg-green-50 border-green-100'}`}>
                        <p className={`text-xs font-medium mb-1 ${totalArrears > 0 ? 'text-red-600' : 'text-green-600'}`}>
                            Total Tunggakan ({totalMonths} Bln)
                        </p>
                        <p className={`text-lg font-bold ${totalArrears > 0 ? 'text-red-900' : 'text-green-900'}`}>
                            {formatCurrency(totalArrears)}
                        </p>
                    </div>
                    <button
                        onClick={() => router.push(`/m/billing?customerId=${customerId}`)}
                        className="bg-indigo-600 text-white rounded-xl p-3 flex flex-col justify-center items-center shadow-lg shadow-indigo-200 active:scale-95 transition-transform"
                    >
                        <Receipt className="w-5 h-5 mb-1" />
                        <span className="text-xs font-bold">Bayar Tagihan</span>
                    </button>
                </div>
            </div>

            {/* Tabs */}
            <div className="sticky top-[57px] bg-white z-20 shadow-sm border-b border-gray-100 flex">
                {[
                    { id: 'profil', label: 'Profil' },
                    { id: 'riwayat', label: 'Riwayat' },
                    { id: 'tunggakan', label: 'Tagihan' }
                ].map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex-1 py-3 text-sm font-medium relative transition-colors ${activeTab === tab.id ? 'text-indigo-600' : 'text-gray-500'
                            }`}
                    >
                        {tab.label}
                        {activeTab === tab.id && (
                            <motion.div
                                layoutId="activeTabIndicator"
                                className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600"
                            />
                        )}
                    </button>
                ))}
            </div>

            {/* Tab Content */}
            <div className="p-4">
                <AnimatePresence mode='wait'>
                    {activeTab === 'profil' && (
                        <motion.div
                            key="profil"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="space-y-4"
                        >
                            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 space-y-4">
                                <div className="flex items-start gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
                                        <MapPin className="w-4 h-4 text-blue-600" />
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-xs text-gray-500 mb-1">Alamat / Wilayah</p>
                                        <p className="font-medium text-gray-900">{customer.alamat}</p>
                                        <p className="text-xs text-gray-500 mt-1 bg-gray-100 inline-block px-2 py-0.5 rounded">
                                            Wilayah: {customer.wilayah}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-start gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-green-50 flex items-center justify-center flex-shrink-0">
                                        <Phone className="w-4 h-4 text-green-600" />
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-xs text-gray-500 mb-1">Nomor Telepon</p>
                                        <p className="font-medium text-gray-900">{customer.nomor_telepon || '-'}</p>
                                        {customer.nomor_telepon && (
                                            <a
                                                href={getWALink(customer.nomor_telepon)}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="inline-flex items-center gap-1 mt-2 text-xs font-bold text-green-600 bg-green-50 px-3 py-1.5 rounded-lg active:bg-green-100"
                                            >
                                                <MessageCircle className="w-3.5 h-3.5" />
                                                Chat WhatsApp
                                            </a>
                                        )}
                                    </div>
                                </div>

                                <div className="flex items-start gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center flex-shrink-0">
                                        <Receipt className="w-4 h-4 text-purple-600" />
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-xs text-gray-500 mb-1">Tarif Layanan</p>
                                        <p className="font-medium text-gray-900">
                                            {customer.tarif ? customer.tarif.nama_kategori : 'Default'}
                                        </p>
                                        <p className="text-sm font-bold text-purple-600 mt-0.5">
                                            {customer.tarif ? formatCurrency(customer.tarif.harga_per_bulan) : '-'} <span className="text-xs font-normal text-gray-400">/bulan</span>
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                                <h3 className="font-bold text-gray-900 mb-3">Info Tambahan</h3>
                                <div className="grid grid-cols-1 gap-3">
                                    <div className="p-3 bg-gray-50 rounded-lg flex justify-between items-center">
                                        <div>
                                            <p className="text-xs text-gray-500 mb-1">Bergabung Sejak</p>
                                            <p className="font-semibold text-gray-900">
                                                {customer.tanggal_bergabung ? format(new Date(customer.tanggal_bergabung), 'dd MMM yyyy', { locale: idLocale }) : '-'}
                                            </p>
                                        </div>
                                        <Calendar className="w-5 h-5 text-gray-400" />
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {activeTab === 'riwayat' && (
                        <motion.div
                            key="riwayat"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="space-y-3"
                        >
                            {(!historyPayments || historyPayments.length === 0) ? (
                                <div className="text-center py-10 text-gray-400">
                                    <Clock className="w-8 h-8 mx-auto mb-2 opacity-50" />
                                    <p className="text-sm">Belum ada riwayat transaksi</p>
                                </div>
                            ) : (
                                historyPayments.map((payment: any) => {
                                    let paidMonths: string[] = []
                                    try {
                                        paidMonths = typeof payment.bulan_dibayar === 'string'
                                            ? JSON.parse(payment.bulan_dibayar)
                                            : payment.bulan_dibayar || []
                                    } catch (e) {
                                        paidMonths = []
                                    }

                                    return (
                                        <div key={payment.id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex justify-between items-center">
                                            <div className="flex items-start gap-3">
                                                <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center text-green-600 font-bold text-xs">
                                                    IN
                                                </div>
                                                <div>
                                                    <p className="font-bold text-gray-900 text-sm">Pembayaran Iuran</p>
                                                    <div className="text-xs text-gray-500">
                                                        <p>{format(new Date(payment.tanggal_bayar), 'dd MMM yyyy, HH:mm', { locale: idLocale })}</p>
                                                        <p className="text-indigo-600 font-medium mt-0.5">
                                                            {paidMonths.length > 0
                                                                ? `Untuk: ${paidMonths.map((m: string) => format(new Date(m + '-01'), 'MMMM yyyy', { locale: idLocale })).join(', ')}`
                                                                : 'Pembayaran'}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="font-bold text-green-600">
                                                    +{formatCurrency(payment.jumlah_bayar)}
                                                </p>
                                                <p className="text-[10px] uppercase text-gray-400 font-bold bg-gray-100 px-1.5 py-0.5 rounded inline-block mt-1">
                                                    {payment.metode_bayar}
                                                </p>
                                            </div>
                                        </div>
                                    )
                                })
                            )}
                        </motion.div>
                    )}

                    {activeTab === 'tunggakan' && (
                        <motion.div
                            key="tunggakan"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="space-y-3"
                        >
                            {/* Summary again in tab content? Optional. Top card is enough. Just list here */}
                            {arrearMonths.length === 0 ? (
                                <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 text-center">
                                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <CheckCircle className="w-8 h-8 text-green-600" />
                                    </div>
                                    <h3 className="font-bold text-gray-900 text-lg">Lunas!</h3>
                                    <p className="text-gray-500 text-sm mt-2">Tidak ada tunggakan saat ini.</p>
                                </div>
                            ) : (
                                arrearMonths.map((item: any, idx: number) => (
                                    <div key={idx} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex justify-between items-center">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-red-50 rounded-lg flex items-center justify-center text-red-600">
                                                <Calendar className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <p className="font-bold text-gray-900 text-sm">
                                                    {format(new Date(item.month + '-01'), 'MMMM yyyy', { locale: idLocale })}
                                                </p>
                                                <p className="text-xs text-red-500">
                                                    {item.details || 'Belum Dibayar'}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-bold text-gray-900">{formatCurrency(item.amount)}</p>
                                        </div>
                                    </div>
                                ))
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    )
}
