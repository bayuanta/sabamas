'use client'

import { useState, useRef, Suspense } from 'react'
import AdminLayout from '@/components/AdminLayout'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { customersApi, tariffsApi, paymentsApi } from '@/lib/api'
import { formatCurrency, formatDateTime, formatMonth } from '@/lib/utils'
import { useRouter, useSearchParams } from 'next/navigation'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import Modal from '@/components/ui/Modal'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import { ArrowLeft, Edit, Trash2, Receipt, DollarSign, Share2, Printer, Download, User, MapPin, Phone, Calendar, Clock, AlertCircle, CheckCircle } from 'lucide-react'
import Link from 'next/link'
import ShareButton from '@/components/ui/ShareButton'
import { generateArrearsWhatsAppMessage } from '@/lib/whatsapp'
import { BillTemplate } from '@/components/BillTemplate'
import { generatePDF, generateBillFilename } from '@/lib/pdf'

function CustomerDetailContent() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const id = searchParams.get('id')

    const queryClient = useQueryClient()
    const [deleteModalOpen, setDeleteModalOpen] = useState(false)
    const [editModalOpen, setEditModalOpen] = useState(false)
    const [editFormData, setEditFormData] = useState<any>(null)
    const [isRefreshing, setIsRefreshing] = useState(false)
    const [isDownloadingPDF, setIsDownloadingPDF] = useState(false)
    const [overrideModalOpen, setOverrideModalOpen] = useState(false)
    const [selectedMonth, setSelectedMonth] = useState<string>('')
    const [overrideAmount, setOverrideAmount] = useState<string>('')
    const [overrideCatatan, setOverrideCatatan] = useState<string>('')

    // Handle missing ID
    if (!id) {
        return (
            <AdminLayout>
                <div className="flex items-center justify-center min-h-[60vh]">
                    <div className="text-center">
                        <p className="text-gray-500 text-lg">ID Pelanggan tidak valid</p>
                        <Button className="mt-4" onClick={() => router.push('/customers')}>
                            Kembali
                        </Button>
                    </div>
                </div>
            </AdminLayout>
        )
    }

    const { data: customer, isLoading, error } = useQuery({
        queryKey: ['customer', id],
        queryFn: async () => {
            const { data } = await customersApi.getOne(id)
            return data
        },
        enabled: !!id
    })

    // Fetch tariff categories for edit form
    const { data: tariffsData } = useQuery({
        queryKey: ['tariff-categories'],
        queryFn: async () => {
            const { data } = await tariffsApi.getCategories()
            return data
        },
    })

    // Fetch partial payments
    const { data: partialPayments } = useQuery({
        queryKey: ['partial-payments', id],
        queryFn: async () => {
            const { data } = await paymentsApi.getPartialPayments(id)
            return data
        },
        enabled: !!id
    })

    const deleteMutation = useMutation({
        mutationFn: () => customersApi.delete(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['customers'] })
            router.push('/customers')
        },
    })

    const updateMutation = useMutation({
        mutationFn: (data: any) => customersApi.update(id, data),
        onSuccess: async () => {
            // Close modal and show refreshing state
            setEditModalOpen(false)
            setIsRefreshing(true)

            // Invalidate all related queries
            await queryClient.invalidateQueries({ queryKey: ['customer', id] })
            await queryClient.invalidateQueries({ queryKey: ['customers'] })
            await queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] })

            // Wait a bit for backend to recalculate arrears
            await new Promise(resolve => setTimeout(resolve, 500))

            // Force refetch to get fresh calculated data
            await queryClient.refetchQueries({
                queryKey: ['customer', id],
                type: 'active'
            })

            setIsRefreshing(false)
        },
    })

    const handleOpenEditModal = () => {
        if (customer) {
            setEditFormData({
                nama: customer.nama,
                alamat: customer.alamat,
                wilayah: customer.wilayah,
                nomor_telepon: customer.nomor_telepon || '',
                nomor_pelanggan: customer.nomor_pelanggan || '',
                tarif_id: customer.tarif_id,
                status: customer.status,
                tanggal_bergabung: new Date(customer.tanggal_bergabung).toISOString().split('T')[0],
            })
            setEditModalOpen(true)
        }
    }

    const handleUpdateSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        updateMutation.mutate(editFormData)
    }

    const handlePrint = () => {
        window.print()
    }

    const handleDownloadPDF = async () => {
        if (!customer) return

        setIsDownloadingPDF(true)
        try {
            const filename = generateBillFilename(customer.nama)
            await generatePDF('bill-template', filename)
        } catch (error) {
            console.error('Failed to generate PDF:', error)
            alert('Gagal mengunduh PDF. Silakan coba lagi.')
        } finally {
            setIsDownloadingPDF(false)
        }
    }

    // Tariff Override handlers
    const handleOpenOverrideModal = (month: string, currentAmount: number) => {
        setSelectedMonth(month)
        setOverrideAmount(currentAmount.toString())
        setOverrideCatatan('')
        setOverrideModalOpen(true)
    }

    const overrideMutation = useMutation({
        mutationFn: (data: any) => tariffsApi.createOverride(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['customer', id] })
            queryClient.invalidateQueries({ queryKey: ['arrears-report'] })
            queryClient.invalidateQueries({ queryKey: ['dashboard'] })
            setOverrideModalOpen(false)
            setSelectedMonth('')
            setOverrideAmount('')
            setOverrideCatatan('')
        },
    })

    const handleSaveOverride = () => {
        if (!selectedMonth || !overrideAmount) return

        // Get current user from localStorage
        const user = JSON.parse(localStorage.getItem('user') || '{}')

        overrideMutation.mutate({
            customer_id: id,
            bulan_berlaku: selectedMonth,
            tarif_amount: parseFloat(overrideAmount),
            catatan: overrideCatatan || undefined,
            created_by_user: user.id,
        })
    }

    // --- Status Toggle Logic ---
    const [statusModalOpen, setStatusModalOpen] = useState(false)
    const [statusReason, setStatusReason] = useState('')

    const statusMutation = useMutation({
        mutationFn: (data: { status: 'aktif' | 'nonaktif', keterangan: string }) =>
            customersApi.toggleStatus(id, data.status, data.keterangan),
        onSuccess: () => {
            setStatusModalOpen(false)
            setStatusReason('')
            // Invalidate queries to refresh data
            queryClient.invalidateQueries({ queryKey: ['customer', id] })
            queryClient.invalidateQueries({ queryKey: ['customers'] })
            queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] })
        },
    })

    const handleToggleStatus = (e: React.FormEvent) => {
        e.preventDefault()
        if (!customer) return

        // Toggle logic: if active -> deactivate, if inactive -> activate
        const newStatus = customer.status === 'aktif' ? 'nonaktif' : 'aktif'
        statusMutation.mutate({ status: newStatus, keterangan: statusReason })
    }

    // Fetch status history
    const { data: statusHistory } = useQuery({
        queryKey: ['customer-status-history', id],
        queryFn: async () => {
            const { data } = await customersApi.getStatusHistory(id)
            return data
        },
        enabled: !!customer
    })

    if (isLoading) {
        return (
            <AdminLayout>
                <div className="flex items-center justify-center min-h-[60vh]">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-100 border-t-blue-600 mx-auto"></div>
                        <p className="mt-6 text-gray-500 font-medium">Memuat data pelanggan...</p>
                    </div>
                </div>
            </AdminLayout>
        )
    }

    if (error) {
        return (
            <AdminLayout>
                <div className="flex items-center justify-center min-h-[60vh]">
                    <div className="text-center max-w-md mx-auto p-8 bg-white rounded-2xl shadow-xl border border-gray-100">
                        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <AlertCircle className="w-8 h-8 text-red-600" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 mb-2">Terjadi Kesalahan</h3>
                        <p className="text-gray-500 mb-6">
                            {(error as any)?.response?.data?.message || 'Gagal memuat data pelanggan'}
                        </p>
                        <Button onClick={() => router.push('/customers')} className="w-full justify-center">
                            Kembali ke Daftar Pelanggan
                        </Button>
                    </div>
                </div>
            </AdminLayout>
        )
    }

    if (!customer) {
        return (
            <AdminLayout>
                <div className="flex items-center justify-center min-h-[60vh]">
                    <div className="text-center">
                        <p className="text-gray-500 text-lg">Pelanggan tidak ditemukan</p>
                        <Button className="mt-4" onClick={() => router.push('/customers')}>
                            Kembali
                        </Button>
                    </div>
                </div>
            </AdminLayout>
        )
    }

    return (
        <AdminLayout>
            {/* Refreshing Overlay */}
            {isRefreshing && (
                <div className="fixed inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-50 transition-all duration-300">
                    <div className="bg-white rounded-2xl shadow-2xl p-8 flex flex-col items-center space-y-4 border border-gray-100">
                        <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-100 border-t-blue-600"></div>
                        <p className="text-gray-700 font-medium">Memperbarui data tunggakan...</p>
                    </div>
                </div>
            )}

            {/* Bill Template for Printing */}
            <BillTemplate customer={customer} />

            <div className="space-y-8 print:hidden max-w-7xl mx-auto">
                {/* Header */}
                <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
                    <div className="flex items-start space-x-4">
                        <Button
                            variant="ghost"
                            onClick={() => router.push('/customers')}
                            className="mt-1 hover:bg-gray-100 rounded-xl"
                        >
                            <ArrowLeft className="w-6 h-6 text-gray-500" />
                        </Button>
                        <div>
                            <div className="flex items-center gap-3">
                                <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">{customer.nama}</h1>
                                <span className={`px-3 py-1 rounded-full text-xs font-bold ${customer.status === 'aktif'
                                    ? 'bg-green-100 text-green-700 ring-1 ring-green-600/20'
                                    : 'bg-gray-100 text-gray-600 ring-1 ring-gray-500/20'
                                    }`}>
                                    {customer.status === 'aktif' ? 'Aktif' : 'Nonaktif'}
                                </span>
                            </div>
                            <div className="flex items-center gap-2 mt-2 text-gray-500">
                                <MapPin className="w-4 h-4" />
                                <span>{customer.alamat}</span>
                                <span className="text-gray-300">|</span>
                                <span className="font-mono bg-gray-100 px-2 py-0.5 rounded text-gray-600 text-sm">{customer.nomor_pelanggan}</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-wrap gap-3">
                        <Link href={`/billing?customer=${customer.id}`}>
                            <Button className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg shadow-blue-500/30 border-0">
                                <DollarSign className="w-5 h-5 mr-2" />
                                Bayar Tagihan
                            </Button>
                        </Link>

                        <div className="flex gap-2">
                            <Button variant="outline" onClick={handlePrint} className="bg-white hover:bg-gray-50">
                                <Printer className="w-5 h-5 mr-2" />
                                Cetak
                            </Button>

                            <Button variant="outline" onClick={handleDownloadPDF} isLoading={isDownloadingPDF} className="bg-white hover:bg-gray-50">
                                <Download className="w-5 h-5 mr-2" />
                                PDF
                            </Button>
                        </div>

                        {customer.arrears && customer.arrears.totalArrears > 0 && (
                            <ShareButton
                                message={generateArrearsWhatsAppMessage(customer)}
                                title="Share Tagihan"
                                defaultPhone={customer.nomor_telepon}
                            />
                        )}

                        <div className="w-px h-10 bg-gray-200 mx-1 hidden md:block"></div>

                        <Button variant="secondary" onClick={handleOpenEditModal} className="bg-white hover:bg-gray-50 border border-gray-200 shadow-sm">
                            <Edit className="w-5 h-5 mr-2 text-gray-600" />
                            Edit
                        </Button>

                        <Button
                            onClick={() => setStatusModalOpen(true)}
                            className={`border shadow-sm ${customer.status === 'aktif'
                                ? 'bg-amber-50 hover:bg-amber-100 text-amber-700 border-amber-200'
                                : 'bg-green-50 hover:bg-green-100 text-green-700 border-green-200'
                                }`}
                        >
                            {customer.status === 'aktif' ? (
                                <>
                                    <AlertCircle className="w-5 h-5 mr-2" />
                                    Nonaktifkan
                                </>
                            ) : (
                                <>
                                    <CheckCircle className="w-5 h-5 mr-2" />
                                    Aktifkan
                                </>
                            )}
                        </Button>

                        <Button variant="danger" onClick={() => setDeleteModalOpen(true)} className="shadow-sm">
                            <Trash2 className="w-5 h-5" />
                        </Button>
                    </div>
                </div>

                {/* Info Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-white rounded-2xl p-6 shadow-xl shadow-gray-200/50 border border-gray-100 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                            <AlertCircle className="w-24 h-24 text-red-600" />
                        </div>
                        <div className="relative z-10">
                            <p className="text-sm font-medium text-gray-500 mb-1">Total Tunggakan</p>
                            <p className="text-3xl font-extrabold text-red-600 tracking-tight">
                                {formatCurrency(customer.arrears?.totalArrears || 0)}
                            </p>
                            <div className="flex items-center gap-2 mt-3">
                                <span className="bg-red-50 text-red-600 px-2.5 py-1 rounded-lg text-xs font-bold">
                                    {customer.arrears?.totalMonths || 0} bulan
                                </span>
                                <span className="text-xs text-gray-400">belum dibayar</span>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl p-6 shadow-xl shadow-gray-200/50 border border-gray-100 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                            <Receipt className="w-24 h-24 text-blue-600" />
                        </div>
                        <div className="relative z-10">
                            <p className="text-sm font-medium text-gray-500 mb-1">Tarif Bulanan</p>
                            <p className="text-3xl font-extrabold text-gray-900 tracking-tight">
                                {formatCurrency(customer.tarif?.harga_per_bulan || 0)}
                            </p>
                            <div className="flex items-center gap-2 mt-3">
                                <span className="bg-blue-50 text-blue-600 px-2.5 py-1 rounded-lg text-xs font-bold">
                                    {customer.tarif?.nama_kategori}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl p-6 shadow-xl shadow-gray-200/50 border border-gray-100 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                            <Calendar className="w-24 h-24 text-green-600" />
                        </div>
                        <div className="relative z-10">
                            <p className="text-sm font-medium text-gray-500 mb-1">Bergabung Sejak</p>
                            <p className="text-2xl font-bold text-gray-900 tracking-tight mt-1">
                                {new Date(customer.tanggal_bergabung).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                            </p>
                            <div className="flex items-center gap-2 mt-3">
                                <Clock className="w-4 h-4 text-gray-400" />
                                <span className="text-xs text-gray-500">
                                    Terdaftar {Math.floor((new Date().getTime() - new Date(customer.tanggal_bergabung).getTime()) / (1000 * 60 * 60 * 24 * 365))} tahun yang lalu
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left Column - Details */}
                    <div className="lg:col-span-2 space-y-8">
                        {/* Arrears Detail */}
                        <div className="bg-white rounded-2xl shadow-xl shadow-gray-200/50 border border-gray-100 overflow-hidden">
                            <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                                <h3 className="font-bold text-gray-900 flex items-center gap-2">
                                    <AlertCircle className="w-5 h-5 text-red-500" />
                                    Detail Tunggakan
                                </h3>
                                <span className="text-sm font-bold text-red-600 bg-red-50 px-3 py-1 rounded-full">
                                    Total: {formatCurrency(customer.arrears?.totalArrears || 0)}
                                </span>
                            </div>

                            {customer.arrears && customer.arrears.arrearMonths && customer.arrears.arrearMonths.length > 0 ? (
                                <div className="divide-y divide-gray-100">
                                    {customer.arrears.arrearMonths.map((arrear: any) => {
                                        const isStandardTariff = arrear.details === customer.tarif?.nama_kategori;
                                        return (
                                            <div key={arrear.month} className="p-4 hover:bg-gray-50 transition-colors flex items-center justify-between group">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center text-red-600 font-bold text-xs shadow-sm">
                                                        {formatMonth(arrear.month).split(' ')[0].substring(0, 3)}
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-gray-900">{formatMonth(arrear.month)}</p>
                                                        {!isStandardTariff && arrear.details && (
                                                            <p className="text-xs text-gray-500 mt-0.5">{arrear.details}</p>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-4">
                                                    <div className="text-right">
                                                        <p className="font-bold text-gray-900">{formatCurrency(arrear.amount || 0)}</p>
                                                        {arrear.source !== 'default' && (
                                                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded uppercase ${arrear.source === 'override' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'
                                                                }`}>
                                                                {arrear.source}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => handleOpenOverrideModal(arrear.month, arrear.amount)}
                                                        className="opacity-0 group-hover:opacity-100 transition-opacity text-gray-400 hover:text-blue-600 hover:bg-blue-50"
                                                        title="Edit tarif"
                                                    >
                                                        <Edit className="w-4 h-4" />
                                                    </Button>
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            ) : (
                                <div className="p-8 text-center">
                                    <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-3">
                                        <CheckCircle className="w-8 h-8 text-green-500" />
                                    </div>
                                    <p className="text-gray-900 font-medium">Tidak ada tunggakan</p>
                                    <p className="text-sm text-gray-500 mt-1">Pelanggan ini rajin membayar tagihan!</p>
                                </div>
                            )}
                        </div>

                        {/* Partial Payments History */}
                        <div className="bg-white rounded-2xl shadow-xl shadow-gray-200/50 border border-gray-100 overflow-hidden">
                            <div className="px-6 py-5 border-b border-gray-100 bg-orange-50/50 flex items-center justify-between">
                                <h3 className="font-bold text-gray-900 flex items-center gap-2">
                                    <div className="w-5 h-5 rounded bg-orange-100 flex items-center justify-center">
                                        <span className="text-orange-600 font-bold text-xs">$</span>
                                    </div>
                                    Riwayat Cicilan
                                </h3>
                                {partialPayments && partialPayments.length > 0 && (
                                    <span className="text-sm font-bold text-orange-600 bg-orange-50 px-3 py-1 rounded-full">
                                        {partialPayments.length} Riwayat
                                    </span>
                                )}
                            </div>

                            {partialPayments && partialPayments.length > 0 ? (
                                <div className="divide-y divide-gray-100">
                                    {partialPayments.map((partial: any) => {
                                        const paymentIds = partial.payment_ids || []
                                        return (
                                            <div key={partial.id} className="p-4 hover:bg-gray-50 transition-colors">
                                                <div className="flex items-center justify-between mb-2">
                                                    <div className="flex items-center gap-3">
                                                        <span className="font-bold text-gray-900">{formatMonth(partial.bulan_tagihan)}</span>
                                                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${partial.status === 'lunas'
                                                            ? 'bg-green-100 text-green-700'
                                                            : 'bg-orange-100 text-orange-700'
                                                            }`}>
                                                            {partial.status}
                                                        </span>
                                                    </div>
                                                    <span className="text-xs text-gray-500 font-medium">
                                                        {paymentIds.length}x Pembayaran
                                                    </span>
                                                </div>

                                                <div className="grid grid-cols-3 gap-2 text-xs mb-2">
                                                    <div className="bg-gray-50 p-2 rounded border border-gray-100">
                                                        <p className="text-gray-500 mb-0.5">Total Tagihan</p>
                                                        <p className="font-bold text-gray-900">{formatCurrency(partial.jumlah_tagihan)}</p>
                                                    </div>
                                                    <div className="bg-green-50 p-2 rounded border border-green-100">
                                                        <p className="text-green-600 mb-0.5">Terbayar</p>
                                                        <p className="font-bold text-green-700">{formatCurrency(partial.jumlah_terbayar)}</p>
                                                    </div>
                                                    <div className={`p-2 rounded border ${partial.sisa_tagihan > 0
                                                        ? 'bg-red-50 border-red-100'
                                                        : 'bg-gray-50 border-gray-100'
                                                        }`}>
                                                        <p className={`${partial.sisa_tagihan > 0 ? 'text-red-600' : 'text-gray-500'} mb-0.5`}>Sisa</p>
                                                        <p className={`font-bold ${partial.sisa_tagihan > 0 ? 'text-red-700' : 'text-gray-900'}`}>
                                                            {formatCurrency(partial.sisa_tagihan)}
                                                        </p>
                                                    </div>
                                                </div>

                                                {/* Progress Bar */}
                                                <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                                                    <div
                                                        className={`h-full rounded-full ${partial.status === 'lunas' ? 'bg-green-500' : 'bg-orange-500'}`}
                                                        style={{ width: `${Math.min(100, (partial.jumlah_terbayar / partial.jumlah_tagihan) * 100)}%` }}
                                                    />
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            ) : (
                                <div className="p-8 text-center">
                                    <p className="text-gray-500 text-sm">Belum ada riwayat cicilan</p>
                                </div>
                            )}
                        </div>

                        {/* Payment History */}
                        <div className="bg-white rounded-2xl shadow-xl shadow-gray-200/50 border border-gray-100 overflow-hidden">
                            <div className="px-6 py-5 border-b border-gray-100 bg-gray-50/50">
                                <h3 className="font-bold text-gray-900 flex items-center gap-2">
                                    <Clock className="w-5 h-5 text-blue-500" />
                                    Riwayat Pembayaran Terakhir
                                </h3>
                            </div>

                            {customer.payments && customer.payments.length > 0 ? (
                                <div className="divide-y divide-gray-100">
                                    {customer.payments.slice(0, 5).map((payment: any) => {
                                        let paidMonths: string[] = [];
                                        try {
                                            paidMonths = JSON.parse(payment.bulan_dibayar);
                                        } catch (e) {
                                            paidMonths = [];
                                        }

                                        return (
                                            <div key={payment.id} className="p-4 hover:bg-gray-50 transition-colors flex items-center justify-between">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center text-green-600 shadow-sm">
                                                        <CheckCircle className="w-5 h-5" />
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-gray-900">{formatDateTime(payment.tanggal_bayar)}</p>
                                                        <p className="text-xs text-gray-500 mt-0.5 max-w-[200px] truncate">
                                                            {paidMonths.length > 0 ? paidMonths.map((m: string) => formatMonth(m)).join(', ') : '-'}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <p className="font-bold text-gray-900">{formatCurrency(payment.jumlah_bayar)}</p>
                                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${payment.metode_bayar === 'tunai' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
                                                        }`}>
                                                        {payment.metode_bayar}
                                                    </span>
                                                </div>
                                            </div>
                                        );
                                    })}
                                    {customer.payments.length > 5 && (
                                        <div className="p-3 text-center border-t border-gray-100">
                                            <Link href={`/transactions?customer=${customer.id}`} className="text-sm font-medium text-blue-600 hover:text-blue-700">
                                                Lihat Semua Riwayat
                                            </Link>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="p-8 text-center text-gray-500">
                                    Belum ada riwayat pembayaran
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right Column - Customer Info */}
                    <div className="space-y-6">
                        <div className="bg-white rounded-2xl shadow-xl shadow-gray-200/50 border border-gray-100 overflow-hidden">
                            <div className="px-6 py-5 border-b border-gray-100 bg-gray-50/50">
                                <h3 className="font-bold text-gray-900 flex items-center gap-2">
                                    <User className="w-5 h-5 text-indigo-500" />
                                    Informasi Pelanggan
                                </h3>
                            </div>
                            <div className="p-6 space-y-6">
                                <div>
                                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Nama Lengkap</p>
                                    <p className="font-semibold text-gray-900 text-lg">{customer.nama}</p>
                                </div>

                                <div>
                                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Nomor Telepon</p>
                                    <div className="flex items-center gap-2">
                                        <Phone className="w-4 h-4 text-gray-400" />
                                        <p className="font-semibold text-gray-900">{customer.nomor_telepon || '-'}</p>
                                    </div>
                                </div>

                                <div>
                                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Alamat</p>
                                    <div className="flex items-start gap-2">
                                        <MapPin className="w-4 h-4 text-gray-400 mt-1" />
                                        <p className="font-semibold text-gray-900">{customer.alamat}</p>
                                    </div>
                                </div>

                                <div>
                                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Wilayah</p>
                                    <span className="inline-block bg-gray-100 px-3 py-1 rounded-lg text-sm font-medium text-gray-700">
                                        {customer.wilayah}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Status History Timeline */}
                        <div className="bg-white rounded-2xl shadow-xl shadow-gray-200/50 border border-gray-100 overflow-hidden">
                            <div className="px-6 py-5 border-b border-gray-100 bg-gray-50/50">
                                <h3 className="font-bold text-gray-900 flex items-center gap-2">
                                    <Clock className="w-5 h-5 text-amber-500" />
                                    Riwayat Status
                                </h3>
                            </div>
                            <div className="p-6">
                                {statusHistory && statusHistory.length > 0 ? (
                                    <div className="space-y-6">
                                        {statusHistory.map((history: any, index: number) => (
                                            <div key={history.id} className="relative pl-6 border-l-2 border-gray-200 last:border-0 pb-6 last:pb-0">
                                                <div className={`absolute -left-[9px] top-0 w-4 h-4 rounded-full border-2 border-white ${history.status === 'aktif' ? 'bg-green-500' : 'bg-red-500'
                                                    }`} />
                                                <div>
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <span className={`text-xs font-bold px-2 py-0.5 rounded uppercase ${history.status === 'aktif' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                                                            }`}>
                                                            {history.status}
                                                        </span>
                                                        <span className="text-xs text-gray-500">
                                                            {formatDateTime(history.tanggal_mulai)}
                                                        </span>
                                                    </div>
                                                    {history.keterangan && (
                                                        <p className="text-sm text-gray-600 italic">"{history.keterangan}"</p>
                                                    )}
                                                    <p className="text-xs text-gray-400 mt-1">
                                                        {history.tanggal_selesai
                                                            ? `Sampai: ${formatDateTime(history.tanggal_selesai)}`
                                                            : 'Masih berlaku sekarang'
                                                        }
                                                    </p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center text-gray-500 py-4">
                                        <p className="text-sm">Belum ada riwayat perubahan status</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Delete Confirmation Modal */}
            <Modal
                isOpen={deleteModalOpen}
                onClose={() => setDeleteModalOpen(false)}
                title="Hapus Pelanggan"
            >
                <div className="text-center p-4">
                    <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Trash2 className="w-8 h-8 text-red-600" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 mb-2">Hapus Pelanggan?</h3>
                    <p className="text-gray-600 mb-6">
                        Apakah Anda yakin ingin menghapus pelanggan <strong>{customer.nama}</strong>?
                        Tindakan ini tidak dapat dibatalkan dan semua data terkait akan hilang.
                    </p>
                    <div className="flex justify-center space-x-3">
                        <Button variant="secondary" onClick={() => setDeleteModalOpen(false)}>
                            Batal
                        </Button>
                        <Button
                            variant="danger"
                            onClick={() => deleteMutation.mutate()}
                            isLoading={deleteMutation.isPending}
                        >
                            Ya, Hapus Permanen
                        </Button>
                    </div>
                </div>
            </Modal>

            {/* Edit Modal */}
            {editFormData && (
                <Modal
                    isOpen={editModalOpen}
                    onClose={() => setEditModalOpen(false)}
                    title="Edit Pelanggan"
                >
                    <form onSubmit={handleUpdateSubmit} className="space-y-5">
                        {/* Nomor Pelanggan */}
                        <div>
                            <label htmlFor="edit-nomor-pelanggan" className="block text-sm font-bold text-gray-700 mb-1.5">
                                Nomor Pelanggan
                            </label>
                            <input
                                id="edit-nomor-pelanggan"
                                type="text"
                                value={editFormData.nomor_pelanggan}
                                onChange={(e) => setEditFormData({ ...editFormData, nomor_pelanggan: e.target.value })}
                                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                            />
                        </div>

                        {/* Nama */}
                        <div>
                            <label htmlFor="edit-nama" className="block text-sm font-bold text-gray-700 mb-1.5">
                                Nama Lengkap <span className="text-red-500">*</span>
                            </label>
                            <input
                                id="edit-nama"
                                type="text"
                                value={editFormData.nama}
                                onChange={(e) => setEditFormData({ ...editFormData, nama: e.target.value })}
                                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                                required
                            />
                        </div>

                        {/* Alamat */}
                        <div>
                            <label htmlFor="edit-alamat" className="block text-sm font-bold text-gray-700 mb-1.5">
                                Alamat <span className="text-red-500">*</span>
                            </label>
                            <textarea
                                id="edit-alamat"
                                value={editFormData.alamat}
                                onChange={(e) => setEditFormData({ ...editFormData, alamat: e.target.value })}
                                rows={3}
                                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                                required
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            {/* Wilayah */}
                            <div>
                                <label htmlFor="edit-wilayah" className="block text-sm font-bold text-gray-700 mb-1.5">
                                    Wilayah <span className="text-red-500">*</span>
                                </label>
                                <input
                                    id="edit-wilayah"
                                    type="text"
                                    value={editFormData.wilayah}
                                    onChange={(e) => setEditFormData({ ...editFormData, wilayah: e.target.value })}
                                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                                    required
                                />
                            </div>

                            {/* Nomor Telepon */}
                            <div>
                                <label htmlFor="edit-nomor-telepon" className="block text-sm font-bold text-gray-700 mb-1.5">
                                    Nomor Telepon
                                </label>
                                <input
                                    id="edit-nomor-telepon"
                                    type="tel"
                                    value={editFormData.nomor_telepon}
                                    onChange={(e) => setEditFormData({ ...editFormData, nomor_telepon: e.target.value })}
                                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                                />
                            </div>
                        </div>

                        {/* Tarif & Status */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label htmlFor="edit-tarif" className="block text-sm font-bold text-gray-700 mb-1.5">
                                    Kategori Tarif <span className="text-red-500">*</span>
                                </label>
                                <select
                                    id="edit-tarif"
                                    value={editFormData.tarif_id}
                                    onChange={(e) => setEditFormData({ ...editFormData, tarif_id: parseInt(e.target.value) })}
                                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                                    required
                                >
                                    <option value="">Pilih Tarif</option>
                                    {tariffsData?.map((category: any) => (
                                        <option key={category.id} value={category.id}>
                                            {category.nama_kategori} - {formatCurrency(category.harga_per_bulan)}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label htmlFor="edit-status" className="block text-sm font-bold text-gray-700 mb-1.5">Starts Pelanggan</label>
                                <select
                                    id="edit-status"
                                    value={editFormData.status}
                                    onChange={(e) => setEditFormData({ ...editFormData, status: e.target.value })}
                                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                                    required
                                >
                                    <option value="aktif">Aktif</option>
                                    <option value="nonaktif">Nonaktif</option>
                                </select>
                            </div>
                        </div>

                        <div>
                            <label htmlFor="edit-tanggal-bergabung" className="block text-sm font-bold text-gray-700 mb-1.5">Tanggal Bergabung</label>
                            <input
                                id="edit-tanggal-bergabung"
                                type="date"
                                value={editFormData.tanggal_bergabung}
                                onChange={(e) => setEditFormData({ ...editFormData, tanggal_bergabung: e.target.value })}
                                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                                required
                            />
                        </div>

                        <div className="flex text-right justify-end pt-4 space-x-3">
                            <Button variant="secondary" onClick={() => setEditModalOpen(false)}>
                                Batal
                            </Button>
                            <Button type="submit" isLoading={updateMutation.isPending}>
                                Simpan Perubahan
                            </Button>
                        </div>
                    </form>
                </Modal>
            )}

            {/* Override Modal */}
            <Modal
                isOpen={overrideModalOpen}
                onClose={() => setOverrideModalOpen(false)}
                title={`Edit Tarif - ${selectedMonth ? formatMonth(selectedMonth) : ''}`}
            >
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Nominal Tarif Baru
                        </label>
                        <div className="relative">
                            <span className="absolute left-3 top-2 text-gray-500">Rp</span>
                            <Input
                                type="number"
                                value={overrideAmount}
                                onChange={(e) => setOverrideAmount(e.target.value)}
                                className="pl-8"
                                placeholder="0"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Catatan Perubahan
                        </label>
                        <Input
                            value={overrideCatatan}
                            onChange={(e) => setOverrideCatatan(e.target.value)}
                            placeholder="Contoh: Diskon khusus, Kesepakatan baru"
                        />
                    </div>
                    <div className="flex justify-end gap-2 mt-4">
                        <Button variant="secondary" onClick={() => setOverrideModalOpen(false)}>
                            Batal
                        </Button>
                        <Button onClick={handleSaveOverride} isLoading={overrideMutation.isPending}>
                            Simpan
                        </Button>
                    </div>
                </div>
            </Modal>

            {/* Status Confirmation Modal */}
            <Modal
                isOpen={statusModalOpen}
                onClose={() => setStatusModalOpen(false)}
                title={customer.status === 'aktif' ? 'Nonaktifkan Pelanggan' : 'Aktifkan Pelanggan'}
            >
                <form onSubmit={handleToggleStatus} className="space-y-4">
                    <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200 text-sm text-yellow-800 flex items-start gap-3">
                        <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                        <div>
                            <p className="font-bold mb-1">Perhatian</p>
                            {customer.status === 'aktif' ? (
                                <p>Pelanggan yang dinonaktifkan tidak akan menerima tagihan bulanan baru mulai bulan depan. Tagihan yang sudah ada tetap harus dibayar.</p>
                            ) : (
                                <p>Pelanggan akan kembali aktif dan mulai menerima tagihan bulanan secara otomatis.</p>
                            )}
                        </div>
                    </div>

                    <div>
                        <label htmlFor="status-reason" className="block text-sm font-bold text-gray-700 mb-1.5">
                            Alasan Perubahan <span className="text-red-500">*</span>
                        </label>
                        <textarea
                            id="status-reason"
                            rows={3}
                            value={statusReason}
                            onChange={(e) => setStatusReason(e.target.value)}
                            className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                            placeholder={customer.status === 'aktif' ? "Contoh: Pindah rumah, Berhenti berlangganan" : "Contoh: Kembali berlangganan"}
                            required
                        />
                    </div>

                    <div className="flex justify-end space-x-3 pt-2">
                        <Button variant="secondary" onClick={() => setStatusModalOpen(false)}>
                            Batal
                        </Button>
                        <Button
                            type="submit"
                            isLoading={statusMutation.isPending}
                            className={customer.status === 'aktif' ? "bg-amber-600 hover:bg-amber-700 text-white" : "bg-green-600 hover:bg-green-700 text-white"}
                        >
                            {customer.status === 'aktif' ? 'Nonaktifkan' : 'Aktifkan'}
                        </Button>
                    </div>
                </form>
            </Modal>
        </AdminLayout>
    )
}

export default function CustomerDetailPage() {
    return (
        <Suspense fallback={<AdminLayout><div>Loading...</div></AdminLayout>}>
            <CustomerDetailContent />
        </Suspense>
    )
}
