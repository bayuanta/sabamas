'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { paymentsApi } from '@/lib/api'
import MobileHeader from '@/components/mobile/MobileHeader'
import { formatCurrency, formatMonth } from '@/lib/utils'
import { CheckCircle, Printer, Download, Home, Loader2, FileDown } from 'lucide-react'
import { generatePDF } from '@/lib/pdf'
import { toast } from 'react-hot-toast'
import PaymentReceipt from '@/components/PaymentReceipt'

interface ReceiptPageProps {
    params: {
        id: string
    }
}

export default function ReceiptPage({ params }: ReceiptPageProps) {
    const router = useRouter()
    const { id } = params
    const [payment, setPayment] = useState<any>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [actionMode, setActionMode] = useState<'thermal' | 'download-a4' | null>(null)

    useEffect(() => {
        const fetchPayment = async () => {
            try {
                const { data } = await paymentsApi.getOne(id)
                setPayment(data)
            } catch (error) {
                console.error(error)
                toast.error('Gagal memuat data pembayaran')
                router.push('/m')
            } finally {
                setIsLoading(false)
            }
        }
        if (id) fetchPayment()
    }, [id, router])

    // Handle Print/Download Actions
    useEffect(() => {
        if (!actionMode || !payment) return

        const performAction = async () => {
            // Wait for render and styles
            await new Promise(resolve => setTimeout(resolve, 1000))

            try {
                if (actionMode === 'thermal') {
                    window.print()
                    // Allow time for print dialog
                    setTimeout(() => setActionMode(null), 1000)
                } else if (actionMode === 'download-a4') {
                    const filename = `Nota-A4-${payment.id.substring(0, 8)}`
                    await generatePDF('print-a4-target', filename)
                    toast.success('Nota A4 berhasil didownload')
                    setActionMode(null)
                }
            } catch (error) {
                console.error('Action failed:', error)
                toast.error('Gagal memproses permintaan')
                setActionMode(null)
            }
        }

        performAction()
    }, [actionMode, payment])

    const handleScreenshotMobile = async () => {
        if (!payment) return
        try {
            const filename = `Nota-Mobile-${payment.id.substring(0, 8)}`
            await generatePDF('receipt-mobile-view', filename)
            toast.success('Screenshot berhasil didownload')
        } catch (error) {
            console.error(error)
            toast.error('Gagal download screenshot')
        }
    }

    const getMonthsList = () => {
        if (!payment?.bulan_dibayar) return []
        if (Array.isArray(payment.bulan_dibayar)) return payment.bulan_dibayar
        try {
            return JSON.parse(payment.bulan_dibayar)
        } catch {
            return []
        }
    }

    const months = getMonthsList()

    if (isLoading) {
        return (
            <div className="flex h-screen items-center justify-center bg-gray-50">
                <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
            </div>
        )
    }

    if (!payment) return null

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            <MobileHeader title="Bukti Pembayaran" />

            {/* Hidden/Overlay Components for Printing/Downloading */}
            {actionMode === 'thermal' && (
                <div className="fixed inset-0 z-[60] bg-white flex flex-col items-center justify-center">
                    {/* Override Display None from Component */}
                    <style>{`#print-thermal { display: block !important; margin: 0 auto; }`}</style>
                    <div className="scale-75 origin-top">
                        <PaymentReceipt
                            payment={payment}
                            customer={payment.customer}
                            isThermal={true}
                            customId="print-thermal"
                        />
                    </div>
                    <div className="mt-10 flex flex-col items-center animate-pulse">
                        <Printer className="w-8 h-8 text-orange-500 mb-2" />
                        <p className="text-gray-500 font-bold">Membuka Printer...</p>
                    </div>
                </div>
            )}

            {actionMode === 'download-a4' && (
                <div className="fixed top-0 left-0 bg-white z-[-1] opacity-0 pointer-events-none w-[210mm] overflow-hidden">
                    {/* Override Display None & Force A4 Dimensions for Capture */}
                    <style>{`#print-a4-target { display: block !important; width: 210mm; }`}</style>
                    <PaymentReceipt
                        payment={payment}
                        customer={payment.customer}
                        isThermal={false}
                        customId="print-a4-target"
                    />
                </div>
            )}

            <div className="flex-1 p-4 overflow-y-auto pb-48">
                {/* On-Screen Mobile Receipt Card */}
                <div id="receipt-mobile-view" className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 relative overflow-hidden max-w-sm mx-auto">
                    {/* Decorative Top */}
                    <div className="absolute top-0 left-0 right-0 h-2 bg-indigo-500"></div>

                    <div className="text-center mb-6 pt-4">
                        <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-2" />
                        <h2 className="text-xl font-bold text-gray-900">Pembayaran Berhasil</h2>
                        <p className="text-gray-500 text-xs">Terima kasih telah melakukan pembayaran</p>
                    </div>

                    <div className="border-t border-b border-dashed border-gray-200 py-6 mb-6 space-y-3">
                        <div className="flex justify-between items-center">
                            <span className="text-gray-500 text-xs">No. Referensi</span>
                            <span className="font-mono font-bold text-gray-900 text-xs">{payment.id.substring(0, 12).toUpperCase()}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-gray-500 text-xs">Tanggal</span>
                            <span className="font-bold text-gray-900 text-xs text-right">
                                {new Date(payment.tanggal_bayar).toLocaleDateString('id-ID', {
                                    day: 'numeric', month: 'long', year: 'numeric',
                                    hour: '2-digit', minute: '2-digit'
                                })}
                            </span>
                        </div>
                        <div className="flex justify-between items-start">
                            <span className="text-gray-500 text-xs whitespace-nowrap mr-4">Pelanggan</span>
                            <span className="font-bold text-gray-900 text-xs text-right break-words">{payment.customer?.nama}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-gray-500 text-xs">Metode</span>
                            <span className="font-bold text-gray-900 text-xs uppercase bg-gray-100 px-2 py-0.5 rounded">{payment.metode_bayar}</span>
                        </div>
                    </div>

                    <div className="mb-6">
                        <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Rincian Tagihan</h3>
                        <div className="space-y-1 bg-gray-50 p-3 rounded-xl">
                            {months.length > 0 ? months.map((m: string, idx: number) => (
                                <div key={idx} className="flex justify-between text-xs border-b last:border-0 border-gray-200 py-1 last:pb-0">
                                    <span className="text-gray-600 italic">{formatMonth(m)}</span>
                                </div>
                            )) : (
                                <p className="text-xs text-center text-gray-400">Tidak ada rincian bulan</p>
                            )}
                        </div>
                    </div>

                    <div className="bg-indigo-600 p-4 rounded-xl flex justify-between items-center text-white shadow-lg shadow-indigo-200">
                        <span className="font-medium text-sm text-indigo-100">Total Bayar</span>
                        <span className="font-bold text-xl">{formatCurrency(payment.jumlah_bayar)}</span>
                    </div>
                </div>
            </div>

            {/* Action Buttons */}
            <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-100 shadow-[0_-5px_20px_rgba(0,0,0,0.05)] z-30">
                <div className="grid grid-cols-3 gap-3 mb-3">
                    <button
                        onClick={() => setActionMode('download-a4')}
                        disabled={!!actionMode}
                        className="flex flex-col items-center justify-center p-3 rounded-2xl bg-gray-50 text-gray-700 active:scale-95 transition-all disabled:opacity-50"
                    >
                        <FileDown className="w-6 h-6 mb-1 text-gray-900" />
                        <span className="text-[10px] font-bold text-center">Download A4</span>
                    </button>
                    <button
                        onClick={() => setActionMode('thermal')}
                        disabled={!!actionMode}
                        className="flex flex-col items-center justify-center p-3 rounded-2xl bg-orange-50 text-orange-700 active:scale-95 transition-all border border-orange-100 disabled:opacity-50"
                    >
                        <Printer className="w-6 h-6 mb-1 text-orange-600" />
                        <span className="text-[10px] font-bold">Cetak Thermal</span>
                    </button>
                    <button
                        onClick={handleScreenshotMobile}
                        disabled={!!actionMode}
                        className="flex flex-col items-center justify-center p-3 rounded-2xl bg-gray-50 text-indigo-600 active:scale-95 transition-all disabled:opacity-50"
                    >
                        <Download className="w-6 h-6 mb-1" />
                        <span className="text-[10px] font-bold">Screenshot</span>
                    </button>
                </div>
                <button
                    onClick={() => router.push('/m')}
                    className="w-full bg-gray-900 text-white font-bold py-4 rounded-2xl shadow-xl flex items-center justify-center gap-2 active:scale-95 transition-all"
                >
                    <Home className="w-5 h-5" />
                    Selesai & Kembali
                </button>
            </div>

            {!actionMode && (
                <style jsx global>{`
                    @media print {
                        @page { margin: 0; }
                        body { background: white; }
                        body * { visibility: hidden; }
                        #receipt-mobile-view, #receipt-mobile-view * { visibility: visible; }
                        #receipt-mobile-view { 
                            position: absolute; 
                            left: 50%; 
                            top: 20px; 
                            transform: translateX(-50%);
                            width: 100%; 
                            max-width: 80mm;
                            margin: 0; 
                            padding: 10px; 
                            box-shadow: none; 
                            border: none; 
                        }
                    }
                `}</style>
            )}
        </div>
    )
}
