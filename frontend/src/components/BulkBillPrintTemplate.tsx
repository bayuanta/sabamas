'use client'

import { formatCurrency, formatMonth } from '@/lib/utils'

interface Customer {
    customer: {
        id: string
        nama: string
        wilayah: string
        alamat: string
    }
    arrears: {
        totalArrears: number
        totalMonths: number
        arrearMonths: Array<{
            month: string
            amount: number
        }>
    }
}

interface BulkBillPrintTemplateProps {
    customers: Customer[]
}

export function BulkBillPrintTemplate({ customers }: BulkBillPrintTemplateProps) {
    // Split customers into pages of 6
    const itemsPerPage = 6
    const pages: Customer[][] = []
    for (let i = 0; i < customers.length; i += itemsPerPage) {
        pages.push(customers.slice(i, i + itemsPerPage))
    }

    return (
        <div id="bulk-bill-template" className="print:block hidden">
            <style dangerouslySetInnerHTML={{
                __html: `
                @media print {
                    @page {
                        size: 215mm 330mm; /* Folio / F4 */
                        margin: 0;
                    }
                    body {
                        margin: 0;
                        -webkit-print-color-adjust: exact;
                    }
                }
            `}} />
            {pages.map((pageCustomers, pageIndex) => (
                <div
                    key={pageIndex}
                    className="page-container relative bg-white"
                    style={{
                        width: '215mm',
                        height: '329mm', // Slightly less than 330mm to prevent overflow
                        padding: '10mm 15mm', // Adjust padding for optimal fit
                        display: 'flex',
                        flexDirection: 'column',
                        pageBreakAfter: pageIndex < pages.length - 1 ? 'always' : 'auto'
                    }}
                >
                    {/* Items */}
                    <div className="flex-1 flex flex-col justify-between" style={{ gap: '2mm' }}>
                        {pageCustomers.map((item, index) => {
                            // Format arrear months
                            const arrearMonthsList = item.arrears.arrearMonths
                                .map((a) => formatMonth(a.month))
                                .join(', ')

                            return (
                                <div
                                    key={item.customer.id}
                                    style={{
                                        flex: 1,
                                        display: 'flex',
                                        flexDirection: 'column',
                                        position: 'relative',
                                        justifyContent: 'center',
                                        maxHeight: '52mm',
                                        boxSizing: 'border-box'
                                    }}
                                >
                                    {/* Bordered Card */}
                                    <div style={{
                                        border: '2px solid #000',
                                        borderRadius: '8px',
                                        padding: '5px 12px',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        height: '100%',
                                        justifyContent: 'space-between'
                                    }}>
                                        {/* Header Row */}
                                        <div className="flex items-center justify-between border-b border-black pb-1 mb-1">
                                            <div className="flex items-center gap-2">
                                                <div className="w-10 h-10 flex items-center justify-center">
                                                    <img
                                                        src={typeof window !== 'undefined' ? (window.localStorage.getItem('logo_url') || '/logo-placeholder.png') : '/logo-placeholder.png'}
                                                        onError={(e) => {
                                                            e.currentTarget.style.display = 'none';
                                                        }}
                                                        alt="Logo"
                                                        className="w-full h-full object-contain grayscale"
                                                    />
                                                </div>
                                                <div>
                                                    <h1 className="text-sm font-bold text-black leading-none">SABAMAS</h1>
                                                    <p className="text-[10px] text-black leading-none mt-0.5">Sahabat Bersih Masyarakat</p>
                                                </div>
                                            </div>
                                            <div className="bg-black text-white px-2 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider">
                                                SURAT TAGIHAN
                                            </div>
                                        </div>

                                        {/* Content Row */}
                                        <div className="flex items-start justify-between gap-2 flex-1 pt-1">
                                            <div className="flex-1 min-w-0">
                                                <div className="mb-0.5">
                                                    <p className="text-[10px] text-black uppercase font-bold">Pelanggan:</p>
                                                    <h2 className="text-base font-bold text-black leading-tight truncate">{item.customer.nama}</h2>
                                                    <p className="text-[11px] font-bold text-white bg-black px-1.5 py-0.5 rounded inline-block mt-0.5">{item.customer.wilayah}</p>
                                                </div>
                                            </div>

                                            <div className="text-right flex-shrink-0">
                                                <p className="text-[10px] text-black uppercase font-bold">Total Tagihan:</p>
                                                <p className="text-2xl font-extrabold text-black leading-none tracking-tight">
                                                    {formatCurrency(item.arrears.totalArrears).replace('Rp', '').trim()}
                                                </p>
                                                <p className="text-[10px] text-black font-bold uppercase">Rupiah</p>
                                            </div>
                                        </div>

                                        {/* Footer Row */}
                                        <div className="mt-1 pt-1 border-t border-gray-400 flex justify-between items-end">
                                            <div className="flex-1 pr-2">
                                                <p className="text-[10px] text-black leading-snug break-words">
                                                    <span className="font-bold text-black mr-1">Rincian:</span>
                                                    {arrearMonthsList || '-'}
                                                </p>
                                            </div>
                                            <div className="text-[10px] text-black font-bold">
                                                {item.arrears.totalMonths} Bulan
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )
                        })}

                        {/* Fill empty slots */}
                        {pageCustomers.length < itemsPerPage && Array.from({ length: itemsPerPage - pageCustomers.length }).map((_, i) => (
                            <div
                                key={`empty-${i}`}
                                style={{
                                    flex: 1,
                                    border: '1px dashed #e5e7eb',
                                    borderRadius: '8px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    minHeight: '40mm'
                                }}
                            >
                                <span className="text-gray-200 text-xs">Slot Kosong</span>
                            </div>
                        ))}
                    </div>

                    {/* Small footer */}
                    <div className="text-[8px] text-gray-300 text-center mt-2">
                        halaman {pageIndex + 1}
                    </div>
                </div>
            ))}
        </div>
    )
}
