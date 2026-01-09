'use client'

import { formatCurrency, formatMonth } from '@/lib/utils'
import { useQuery } from '@tanstack/react-query'
import { settingsApi } from '@/lib/api'

interface PaymentReceiptProps {
    payment: {
        id?: string
        customer_nama: string
        bulan_dibayar: string[] | string
        jumlah_bayar: number
        diskon_nominal?: number
        subtotal?: number
        metode_bayar: string
        catatan?: string
        tanggal_bayar?: string
        month_breakdown?: Record<string, { amount: number; source: string; details?: string }> | string
        is_partial?: boolean  // Flag pembayaran cicilan
    }
    customer?: {
        nama?: string
        alamat?: string
        wilayah?: string
        nomor_telepon?: string
    }
    partialPaymentInfo?: {  // Info cicilan untuk bulan yang dibayar
        bulan_tagihan: string
        jumlah_tagihan: number
        jumlah_terbayar: number
        sisa_tagihan: number
        status: string
        payment_ids: string[]
        cicilan_ke?: number  // Cicilan ke berapa
    }[]
    isThermal?: boolean
    isCompact?: boolean  // New: 1/3 F4 format for paper saving
    customId?: string  // Custom ID for PDF generation
}

export default function PaymentReceipt({ payment, customer, partialPaymentInfo, isThermal = false, isCompact = false, customId }: PaymentReceiptProps) {
    // Get settings for logo
    const { data: settings } = useQuery({
        queryKey: ['settings'],
        queryFn: async () => {
            const { data } = await settingsApi.get()
            return data
        },
    })

    // Parse bulan_dibayar if it's a string
    const paidMonths = Array.isArray(payment.bulan_dibayar)
        ? payment.bulan_dibayar
        : typeof payment.bulan_dibayar === 'string'
            ? JSON.parse(payment.bulan_dibayar)
            : []

    // Parse month_breakdown if it's a string
    const monthBreakdown = payment.month_breakdown
        ? (typeof payment.month_breakdown === 'string'
            ? JSON.parse(payment.month_breakdown)
            : payment.month_breakdown)
        : null

    // Helper function to get amount for a specific month
    const getMonthAmount = (month: string): number => {
        if (monthBreakdown && monthBreakdown[month]) {
            return monthBreakdown[month].amount
        }
        // Fallback to equal distribution if no breakdown available
        return payment.jumlah_bayar / paidMonths.length
    }

    // Helper to get partial payment info for a month
    const getPartialInfo = (month: string) => {
        return partialPaymentInfo?.find(p => p.bulan_tagihan === month)
    }

    // Check if this is a partial payment
    const isPartialPayment = payment.is_partial || (partialPaymentInfo && partialPaymentInfo.length > 0)

    // Get total tagihan for partial payment
    const getTotalTagihan = () => {
        if (!partialPaymentInfo || partialPaymentInfo.length === 0) return 0
        return partialPaymentInfo.reduce((sum, p) => sum + p.jumlah_tagihan, 0)
    }

    // Get total terbayar for partial payment
    const getTotalTerbayar = () => {
        if (!partialPaymentInfo || partialPaymentInfo.length === 0) return 0
        return partialPaymentInfo.reduce((sum, p) => sum + p.jumlah_terbayar, 0)
    }

    // Get total sisa for partial payment
    const getTotalSisa = () => {
        if (!partialPaymentInfo || partialPaymentInfo.length === 0) return 0
        return partialPaymentInfo.reduce((sum, p) => sum + p.sisa_tagihan, 0)
    }

    const currentDate = new Date()
    const paymentDate = payment.tanggal_bayar ? new Date(payment.tanggal_bayar) : currentDate

    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

    // Use custom ID or default IDs
    const receiptId = customId || (isThermal ? 'payment-receipt-thermal' : isCompact ? 'payment-receipt-compact' : 'payment-receipt')

    if (isThermal) {
        // Thermal Receipt (58mm width) - Redesigned
        return (
            <div id={receiptId}>
                <style dangerouslySetInnerHTML={{
                    __html: `
                    #${receiptId} {
                        display: none;
                    }
                    @media print {
                        html, body {
                            width: 100%;
                            height: 100vh !important; /* Force single page height */
                            margin: 0 !important;
                            padding: 0 !important;
                            overflow: hidden !important; /* Crop ghost content */
                        }
                        @page {
                            margin: 0;
                            size: auto;
                        }
                        #${receiptId} {
                            display: block !important;
                            position: absolute;
                            left: 0;
                            top: 0;
                            width: 100%;
                            max-width: 58mm;
                            padding: 3mm 2mm !important; /* Jarak aman atas/kiri */
                            margin: 0 !important;
                            background: white;
                            font-family: 'Courier New', 'Consolas', monospace;
                            font-size: 8px;
                            line-height: 1.3;
                            color: #000;
                            box-sizing: border-box;
                        }
                    }
                `}} />

                {/* Header with double line */}
                <div style={{ textAlign: 'center', paddingBottom: '1.5mm' }}>
                    <div style={{ fontSize: '11px', fontWeight: 'bold', letterSpacing: '1px' }}>SABAMAS</div>
                    <div style={{ fontSize: '7px', marginTop: '0.5mm' }}>Sistem Billing Sampah</div>
                </div>
                <div style={{ borderTop: '2px double #000', marginBottom: '1.5mm' }}></div>
                <div style={{ textAlign: 'center', fontSize: '9px', fontWeight: 'bold', marginBottom: '1.5mm' }}>NOTA PEMBAYARAN</div>
                <div style={{ borderTop: '1px dashed #000', marginBottom: '1.5mm' }}></div>

                {/* Transaction Info - Compact table */}
                <table style={{ width: '100%', fontSize: '8px', borderCollapse: 'collapse', marginBottom: '1mm' }}>
                    <tbody>
                        <tr>
                            <td style={{ padding: '0.3mm 0', width: '25%' }}>No</td>
                            <td style={{ padding: '0.3mm 0', width: '3%' }}>:</td>
                            <td style={{ padding: '0.3mm 0', fontWeight: 'bold' }}>{payment.id?.substring(0, 8).toUpperCase() || '-'}</td>
                        </tr>
                        <tr>
                            <td style={{ padding: '0.3mm 0' }}>Tanggal</td>
                            <td style={{ padding: '0.3mm 0' }}>:</td>
                            <td style={{ padding: '0.3mm 0' }}>{paymentDate.toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: '2-digit' })} {paymentDate.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</td>
                        </tr>
                    </tbody>
                </table>

                <div style={{ borderTop: '1px dashed #000', margin: '1mm 0' }}></div>

                {/* Customer Info */}
                <div style={{ marginBottom: '1.5mm' }}>
                    <div style={{ fontSize: '7px', fontWeight: 'bold', marginBottom: '0.5mm', textTransform: 'uppercase' }}>Pelanggan:</div>
                    <div style={{ fontSize: '9px', fontWeight: 'bold' }}>{customer?.nama || payment.customer_nama}</div>
                    {customer?.wilayah && <div style={{ fontSize: '7px', marginTop: '0.3mm' }}>{customer.wilayah}</div>}
                </div>

                <div style={{ borderTop: '1px dashed #000', margin: '1mm 0' }}></div>

                {/* Items Header */}
                <div style={{ fontSize: '7px', fontWeight: 'bold', marginBottom: '1mm', textTransform: 'uppercase' }}>Rincian Pembayaran:</div>

                {/* Items List */}
                <table style={{ width: '100%', fontSize: '8px', borderCollapse: 'collapse' }}>
                    <tbody>
                        {paidMonths.map((month: string, index: number) => (
                            <tr key={month}>
                                <td style={{ padding: '0.5mm 0', width: '15px' }}>{index + 1}.</td>
                                <td style={{ padding: '0.5mm 0' }}>{formatMonth(month)}</td>
                                <td style={{ padding: '0.5mm 0', textAlign: 'right', fontWeight: 'bold', whiteSpace: 'nowrap' }}>{formatCurrency(getMonthAmount(month))}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                <div style={{ borderTop: '1px solid #000', margin: '1.5mm 0' }}></div>

                {/* Total Section */}
                <table style={{ width: '100%', fontSize: '8px', borderCollapse: 'collapse' }}>
                    <tbody>
                        {payment.subtotal && payment.diskon_nominal && payment.diskon_nominal > 0 ? (
                            <>
                                <tr>
                                    <td style={{ padding: '0.3mm 0' }}>Subtotal</td>
                                    <td style={{ padding: '0.3mm 0', textAlign: 'right' }}>{formatCurrency(payment.subtotal)}</td>
                                </tr>
                                <tr>
                                    <td style={{ padding: '0.3mm 0' }}>Diskon</td>
                                    <td style={{ padding: '0.3mm 0', textAlign: 'right' }}>-{formatCurrency(payment.diskon_nominal)}</td>
                                </tr>
                                <tr style={{ borderTop: '1px solid #000' }}>
                                    <td style={{ padding: '0.5mm 0', fontWeight: 'bold', fontSize: '9px' }}>TOTAL</td>
                                    <td style={{ padding: '0.5mm 0', textAlign: 'right', fontWeight: 'bold', fontSize: '10px' }}>{formatCurrency(payment.jumlah_bayar)}</td>
                                </tr>
                            </>
                        ) : (
                            <tr>
                                <td style={{ padding: '0.5mm 0', fontWeight: 'bold', fontSize: '9px' }}>TOTAL</td>
                                <td style={{ padding: '0.5mm 0', textAlign: 'right', fontWeight: 'bold', fontSize: '10px' }}>{formatCurrency(payment.jumlah_bayar)}</td>
                            </tr>
                        )}
                        <tr>
                            <td style={{ padding: '0.3mm 0', fontSize: '7px' }}>Metode</td>
                            <td style={{ padding: '0.3mm 0', textAlign: 'right', fontWeight: 'bold', fontSize: '8px' }}>{payment.metode_bayar.toUpperCase()}</td>
                        </tr>
                    </tbody>
                </table>

                {/* Partial Payment Info */}
                {isPartialPayment && partialPaymentInfo && partialPaymentInfo.length > 0 && (() => {
                    const cicilanMonths = partialPaymentInfo.filter(p => p.sisa_tagihan > 0)
                    if (cicilanMonths.length === 0) return null

                    return (
                        <>
                            <div style={{ borderTop: '1px dashed #000', margin: '1.5mm 0' }}></div>
                            <div style={{ fontSize: '7px', fontWeight: 'bold', marginBottom: '0.5mm' }}>SISA TAGIHAN:</div>
                            {cicilanMonths.map((info, idx) => (
                                <div key={idx} style={{ fontSize: '7px', marginBottom: '0.5mm' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <span>{formatMonth(info.bulan_tagihan)}</span>
                                        <span style={{ fontWeight: 'bold' }}>{formatCurrency(info.sisa_tagihan)}</span>
                                    </div>
                                </div>
                            ))}
                        </>
                    )
                })()}

                {/* Notes */}
                {payment.catatan && (
                    <>
                        <div style={{ borderTop: '1px dashed #000', margin: '1mm 0' }}></div>
                        <div style={{ fontSize: '6px', fontStyle: 'italic' }}>
                            <strong>Note:</strong> {payment.catatan}
                        </div>
                    </>
                )}

                {/* Footer with double line */}
                <div style={{ borderTop: '2px double #000', margin: '2mm 0 1mm' }}></div>
                <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '8px', fontWeight: 'bold' }}>Terima Kasih</div>
                    <div style={{ fontSize: '6px', marginTop: '0.5mm' }}>Simpan struk ini sebagai bukti</div>
                    <div style={{ fontSize: '5px', marginTop: '1mm', color: '#666' }}>
                        {currentDate.toLocaleDateString('id-ID', {
                            day: '2-digit',
                            month: 'short',
                            year: '2-digit'
                        })} {currentDate.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                    </div>
                </div>
            </div>
        )
    }

    if (isCompact) {
        // Compact 1/3 F4 Receipt (110mm height) - Paper Saving
        return (
            <div id={receiptId}>
                <style dangerouslySetInnerHTML={{
                    __html: `
                    #${receiptId} {
                        display: none;
                    }
                    @media print {
                        html, body {
                            width: 100%;
                            height: 100vh !important;
                            margin: 0 !important;
                            padding: 0 !important;
                            overflow: hidden !important;
                        }
                        #${receiptId} {
                            display: block !important;
                            position: absolute;
                            left: 0;
                            top: 0;
                            width: 100%;
                            max-width: 215.9mm;
                            height: auto; /* Let content dictate height */
                            margin: 0 !important;
                            padding: 10mm !important; /* Reduced padding (safe) */
                            font-family: 'Times New Roman', serif;
                            font-size: 10pt;
                            line-height: 1.3;
                            color: #000;
                            background: white;
                            box-sizing: border-box;
                            overflow: hidden;
                        }
                    }
                `}} />

                {/* Compact Header */}
                <div style={{
                    borderBottom: '2px solid #000',
                    paddingBottom: '5px',
                    marginBottom: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        {settings?.logo || (typeof window !== 'undefined' && window.localStorage.getItem('logo_url')) ? (
                            <img
                                src={typeof window !== 'undefined' ? (window.localStorage.getItem('logo_url') || `${API_URL}${settings?.logo}`) : `${API_URL}${settings?.logo}`}
                                alt="Logo"
                                onError={(e) => {
                                    e.currentTarget.style.display = 'none';
                                    const parent = e.currentTarget.parentElement;
                                    if (parent) {
                                        parent.innerHTML = `
                                            <div style="width: 40px; height: 40px; border: 2px solid #000; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 18px;">S</div>
                                        `;
                                    }
                                }}
                                style={{
                                    width: '40px',
                                    height: '40px',
                                    objectFit: 'contain'
                                }}
                            />
                        ) : (
                            <div style={{
                                width: '40px',
                                height: '40px',
                                border: '2px solid #000',
                                borderRadius: '50%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontWeight: 'bold',
                                fontSize: '18px'
                            }}>
                                S
                            </div>
                        )}
                        <div>
                            <div style={{ fontSize: '14pt', fontWeight: 'bold', lineHeight: '1.1' }}>
                                SABAMAS
                            </div>
                            <div style={{ fontSize: '8pt' }}>
                                Sistem Billing Sampah
                            </div>
                        </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '11pt', fontWeight: 'bold' }}>
                            BUKTI PEMBAYARAN
                        </div>
                        <div style={{ fontSize: '8pt' }}>
                            No: {payment.id?.substring(0, 8) || '-'}
                        </div>
                    </div>
                </div>

                {/* Info Grid - 2 Columns */}
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '10px',
                    marginBottom: '8px'
                }}>
                    {/* Left Column */}
                    <div>
                        <table style={{ width: '100%', fontSize: '9pt', borderCollapse: 'collapse' }}>
                            <tbody>
                                <tr>
                                    <td style={{ padding: '2px 0', width: '70px' }}>Tanggal</td>
                                    <td style={{ padding: '2px 0', width: '5px' }}>:</td>
                                    <td style={{ padding: '2px 0', fontWeight: 'bold' }}>
                                        {paymentDate.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                                    </td>
                                </tr>
                                <tr>
                                    <td style={{ padding: '2px 0' }}>Pelanggan</td>
                                    <td style={{ padding: '2px 0' }}>:</td>
                                    <td style={{ padding: '2px 0', fontWeight: 'bold' }}>
                                        {customer?.nama || payment.customer_nama}
                                    </td>
                                </tr>
                                {customer?.wilayah && (
                                    <tr>
                                        <td style={{ padding: '2px 0' }}>Wilayah</td>
                                        <td style={{ padding: '2px 0' }}>:</td>
                                        <td style={{ padding: '2px 0' }}>
                                            {customer.wilayah}
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Right Column */}
                    <div>
                        <table style={{ width: '100%', fontSize: '9pt', borderCollapse: 'collapse' }}>
                            <tbody>
                                <tr>
                                    <td style={{ padding: '2px 0', width: '70px' }}>Metode</td>
                                    <td style={{ padding: '2px 0', width: '5px' }}>:</td>
                                    <td style={{ padding: '2px 0', fontWeight: 'bold' }}>
                                        {payment.metode_bayar.toUpperCase()}
                                    </td>
                                </tr>
                                <tr>
                                    <td style={{ padding: '2px 0' }}>Total</td>
                                    <td style={{ padding: '2px 0' }}>:</td>
                                    <td style={{ padding: '2px 0', fontWeight: 'bold', fontSize: '11pt' }}>
                                        {formatCurrency(payment.jumlah_bayar)}
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Payment Details - Compact Table */}
                <div style={{ marginBottom: '8px' }}>
                    <div style={{
                        fontSize: '9pt',
                        fontWeight: 'bold',
                        marginBottom: '3px',
                        borderBottom: '1px solid #000',
                        paddingBottom: '2px'
                    }}>
                        RINCIAN PEMBAYARAN
                    </div>
                    <table style={{
                        width: '100%',
                        borderCollapse: 'collapse',
                        fontSize: '9pt'
                    }}>
                        <thead>
                            <tr style={{ borderBottom: '1px solid #000' }}>
                                <th style={{ textAlign: 'left', padding: '2px', width: '30px' }}>No</th>
                                <th style={{ textAlign: 'left', padding: '2px' }}>Periode</th>
                                <th style={{ textAlign: 'right', padding: '2px', width: '90px' }}>Jumlah</th>
                            </tr>
                        </thead>
                        <tbody>
                            {paidMonths.map((month: string, index: number) => (
                                <tr key={month} style={{ borderBottom: '1px dotted #ccc' }}>
                                    <td style={{ padding: '2px' }}>{index + 1}</td>
                                    <td style={{ padding: '2px' }}>{formatMonth(month)}</td>
                                    <td style={{ textAlign: 'right', padding: '2px' }}>
                                        {formatCurrency(getMonthAmount(month))}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Summary Box */}
                {payment.subtotal && payment.diskon_nominal && payment.diskon_nominal > 0 ? (
                    <div style={{ marginTop: '8px' }}>
                        <table style={{ width: '100%', fontSize: '9pt', borderCollapse: 'collapse' }}>
                            <tbody>
                                <tr>
                                    <td style={{ padding: '2px 0' }}>Subtotal</td>
                                    <td style={{ textAlign: 'right', padding: '2px 0' }}>{formatCurrency(payment.subtotal)}</td>
                                </tr>
                                <tr>
                                    <td style={{ padding: '2px 0' }}>Diskon</td>
                                    <td style={{ textAlign: 'right', padding: '2px 0', color: '#d00' }}>-{formatCurrency(payment.diskon_nominal)}</td>
                                </tr>
                            </tbody>
                        </table>
                        <div style={{
                            marginTop: '5px',
                            padding: '5px 8px',
                            backgroundColor: '#f0f0f0',
                            border: '1px solid #000',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center'
                        }}>
                            <span style={{ fontWeight: 'bold', fontSize: '10pt' }}>TOTAL PEMBAYARAN</span>
                            <span style={{ fontWeight: 'bold', fontSize: '12pt' }}>
                                {formatCurrency(payment.jumlah_bayar)}
                            </span>
                        </div>
                    </div>
                ) : (
                    <div style={{
                        marginTop: '8px',
                        padding: '5px 8px',
                        backgroundColor: '#f0f0f0',
                        border: '1px solid #000',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                    }}>
                        <span style={{ fontWeight: 'bold', fontSize: '10pt' }}>TOTAL PEMBAYARAN</span>
                        <span style={{ fontWeight: 'bold', fontSize: '12pt' }}>
                            {formatCurrency(payment.jumlah_bayar)}
                        </span>
                    </div>
                )}

                {/* Partial Payment Info - Minimalist */}
                {isPartialPayment && partialPaymentInfo && partialPaymentInfo.length > 0 && (() => {
                    const cicilanMonths = partialPaymentInfo.filter(p => p.sisa_tagihan > 0)
                    if (cicilanMonths.length === 0) return null

                    return (
                        <div style={{ marginTop: '8px', padding: '6px 8px', backgroundColor: '#fffbeb', border: '1px solid #f97316', borderRadius: '3px' }}>
                            <div style={{ fontSize: '8pt', fontWeight: 'bold', color: '#c2410c', marginBottom: '4px' }}>⚠️ Sisa Tagihan</div>
                            {cicilanMonths.map((info, idx) => (
                                <div key={idx} style={{ fontSize: '8pt', display: 'flex', justifyContent: 'space-between', marginBottom: idx < cicilanMonths.length - 1 ? '3px' : '0' }}>
                                    <span>{formatMonth(info.bulan_tagihan)} (Cicilan {info.payment_ids.length}x)</span>
                                    <span style={{ fontWeight: 'bold', color: '#dc2626' }}>{formatCurrency(info.sisa_tagihan)}</span>
                                </div>
                            ))}
                        </div>
                    )
                })()}

                {/* Compact Footer without Signature to save space */}
                <div style={{
                    marginTop: '2mm',
                    textAlign: 'center',
                    fontSize: '7pt',
                    fontStyle: 'italic',
                    borderTop: '1px solid #ccc',
                    paddingTop: '2px'
                }}>
                    <div>Dokumen sah • Dicetak: {currentDate.toLocaleString('id-ID')}</div>
                </div>
            </div>
        )
    }

    // Standard A4 Receipt - Government Style
    return (
        <div id={receiptId}>
            <style dangerouslySetInnerHTML={{
                __html: `
                    #${receiptId} {
                        display: none;
                    }
                    @media print {
                        html, body {
                            width: 100%;
                            height: 100vh !important;
                            margin: 0 !important;
                            padding: 0 !important;
                            overflow: hidden !important;
                        }
                        #${receiptId} {
                            display: block !important;
                            position: absolute;
                            left: 0;
                            top: 0;
                            width: 100%;
                            height: auto;
                            padding: 10mm !important; /* Reduced padding to prevent ghost page */
                            margin: 0 !important;
                            background: white;
                            font-family: 'Times New Roman', serif;
                            color: #000;
                            box-sizing: border-box;
                            overflow: hidden;
                        }
                    }
                `}} />

            {/* Header */}
            <div style={{ borderBottom: '3px double #000', paddingBottom: '10px', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '20px' }}>
                {settings?.logo || (typeof window !== 'undefined' && window.localStorage.getItem('logo_url')) ? (
                    <img
                        src={typeof window !== 'undefined' ? (window.localStorage.getItem('logo_url') || `${API_URL}${settings?.logo}`) : `${API_URL}${settings?.logo}`}
                        alt="Logo"
                        onError={(e) => {
                            e.currentTarget.style.display = 'none';
                            const parent = e.currentTarget.parentElement;
                            if (parent) {
                                parent.innerHTML = `
                                    <div style="width: 80px; height: 80px; border: 2px solid #000; display: flex; align-items: center; justify-content: center; font-size: 32px; font-weight: bold;">S</div>
                                `;
                            }
                        }}
                        style={{ width: '80px', height: '80px', objectFit: 'contain' }}
                    />
                ) : (
                    <img
                        src="/logo-sabamas.png"
                        alt="Logo"
                        style={{ width: '80px', height: '80px', objectFit: 'contain' }}
                    />
                )}
                <div style={{ flex: 1, textAlign: 'center' }}>
                    <h1 style={{ margin: 0, fontSize: '20px', fontWeight: 'bold', textTransform: 'uppercase' }}>
                        {settings?.app_name || 'SABAMAS'}
                    </h1>
                    <p style={{ margin: '4px 0 0', fontSize: '12px' }}>
                        {settings?.app_description || 'Sistem Billing Sampah Masyarakat'}
                    </p>
                    <p style={{ margin: '2px 0', fontSize: '10px' }}>Dukuh Ngumbul RT 02/RW 02 Desa Kemasan Kec. Sawit Kab. Boyolali 57374</p>
                    <p style={{ margin: '2px 0', fontSize: '10px' }}>Telp: +62 858 6771 4590</p>
                </div>
                <div style={{ width: '80px' }}></div>
            </div>

            {/* Title */}
            <div style={{ textAlign: 'center', marginBottom: '30px' }}>
                <h2 style={{ margin: 0, fontSize: '18px', textDecoration: 'underline', fontWeight: 'bold' }}>BUKTI PEMBAYARAN</h2>
                <p style={{ margin: '5px 0 0', fontSize: '14px' }}>Nomor: {payment.id || '-'}</p>
            </div>

            {/* Info */}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '30px' }}>
                <div style={{ width: '55%' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <tbody>
                            <tr>
                                <td style={{ width: '100px', padding: '5px 0' }}>Telah terima dari</td>
                                <td style={{ width: '10px', padding: '5px 0' }}>:</td>
                                <td style={{ fontWeight: 'bold', padding: '5px 0' }}>{customer?.nama || payment.customer_nama}</td>
                            </tr>
                            <tr>
                                <td style={{ padding: '5px 0' }}>Alamat</td>
                                <td style={{ padding: '5px 0' }}>:</td>
                                <td style={{ padding: '5px 0' }}>{customer?.alamat || '-'}</td>
                            </tr>
                            <tr>
                                <td style={{ padding: '5px 0' }}>Wilayah</td>
                                <td style={{ padding: '5px 0' }}>:</td>
                                <td style={{ padding: '5px 0' }}>{customer?.wilayah || '-'}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
                <div style={{ width: '40%' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <tbody>
                            <tr>
                                <td style={{ width: '100px', padding: '5px 0' }}>Tanggal</td>
                                <td style={{ width: '10px', padding: '5px 0' }}>:</td>
                                <td style={{ padding: '5px 0' }}>{paymentDate.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</td>
                            </tr>
                            <tr>
                                <td style={{ padding: '5px 0' }}>Metode Bayar</td>
                                <td style={{ padding: '5px 0' }}>:</td>
                                <td style={{ padding: '5px 0', textTransform: 'capitalize' }}>{payment.metode_bayar}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Payment Details */}
            <div style={{ marginBottom: '30px' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #000' }}>
                    <thead>
                        <tr style={{ backgroundColor: '#f0f0f0' }}>
                            <th style={{ border: '1px solid #000', padding: '10px', textAlign: 'center', width: '50px' }}>No</th>
                            <th style={{ border: '1px solid #000', padding: '10px', textAlign: 'left' }}>Keterangan Pembayaran</th>
                            <th style={{ border: '1px solid #000', padding: '10px', textAlign: 'right', width: '150px' }}>Jumlah (Rp)</th>
                        </tr>
                    </thead>
                    <tbody>
                        {paidMonths.map((month: string, index: number) => (
                            <tr key={month}>
                                <td style={{ border: '1px solid #000', padding: '8px', textAlign: 'center' }}>{index + 1}</td>
                                <td style={{ border: '1px solid #000', padding: '8px' }}>
                                    Iuran Sampah Bulan {formatMonth(month)}
                                </td>
                                <td style={{ border: '1px solid #000', padding: '8px', textAlign: 'right' }}>
                                    {formatCurrency(getMonthAmount(month)).replace('Rp', '').trim()}
                                </td>
                            </tr>
                        ))}
                        {/* Empty rows to fill space if needed */}
                        {paidMonths.length < 3 && Array.from({ length: 3 - paidMonths.length }).map((_, i) => (
                            <tr key={`empty-${i}`}>
                                <td style={{ border: '1px solid #000', padding: '8px', color: 'transparent' }}>.</td>
                                <td style={{ border: '1px solid #000', padding: '8px' }}></td>
                                <td style={{ border: '1px solid #000', padding: '8px' }}></td>
                            </tr>
                        ))}
                    </tbody>
                    <tfoot>
                        {payment.subtotal && payment.diskon_nominal && payment.diskon_nominal > 0 ? (
                            <>
                                <tr>
                                    <td colSpan={2} style={{ border: '1px solid #000', padding: '8px', textAlign: 'right' }}>Subtotal</td>
                                    <td style={{ border: '1px solid #000', padding: '8px', textAlign: 'right' }}>
                                        {formatCurrency(payment.subtotal)}
                                    </td>
                                </tr>
                                <tr>
                                    <td colSpan={2} style={{ border: '1px solid #000', padding: '8px', textAlign: 'right', color: '#d00' }}>Diskon</td>
                                    <td style={{ border: '1px solid #000', padding: '8px', textAlign: 'right', color: '#d00' }}>
                                        -{formatCurrency(payment.diskon_nominal)}
                                    </td>
                                </tr>
                                <tr style={{ fontWeight: 'bold', backgroundColor: '#f0f0f0' }}>
                                    <td colSpan={2} style={{ border: '1px solid #000', padding: '10px', textAlign: 'right' }}>TOTAL PEMBAYARAN</td>
                                    <td style={{ border: '1px solid #000', padding: '10px', textAlign: 'right' }}>
                                        {formatCurrency(payment.jumlah_bayar)}
                                    </td>
                                </tr>
                            </>
                        ) : (
                            <tr style={{ fontWeight: 'bold', backgroundColor: '#f0f0f0' }}>
                                <td colSpan={2} style={{ border: '1px solid #000', padding: '10px', textAlign: 'right' }}>TOTAL PEMBAYARAN</td>
                                <td style={{ border: '1px solid #000', padding: '10px', textAlign: 'right' }}>
                                    {formatCurrency(payment.jumlah_bayar)}
                                </td>
                            </tr>
                        )}
                    </tfoot>
                </table>
                <div style={{ marginTop: '5px', fontStyle: 'italic', fontSize: '12px' }}>
                    Terbilang: # {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(payment.jumlah_bayar).replace('Rp', '').trim()} #
                </div>
            </div>

            {/* Partial Payment Info Box - Simplified */}
            {
                isPartialPayment && partialPaymentInfo && partialPaymentInfo.length > 0 && (() => {
                    // Only show months with remaining balance
                    const cicilanMonths = partialPaymentInfo.filter(p => p.sisa_tagihan > 0)
                    if (cicilanMonths.length === 0) return null

                    return (
                        <div style={{
                            marginBottom: '20px',
                            padding: '10px 15px',
                            border: '1px solid #f97316',
                            backgroundColor: '#fffbeb',
                            borderRadius: '4px'
                        }}>
                            <div style={{
                                fontSize: '11px',
                                fontWeight: 'bold',
                                color: '#c2410c',
                                marginBottom: '8px'
                            }}>⚠️ SISA TAGIHAN CICILAN</div>

                            {cicilanMonths.map((info, idx) => (
                                <div key={idx} style={{
                                    fontSize: '11px',
                                    marginBottom: idx < cicilanMonths.length - 1 ? '6px' : '0',
                                    paddingBottom: idx < cicilanMonths.length - 1 ? '6px' : '0',
                                    borderBottom: idx < cicilanMonths.length - 1 ? '1px dashed #fed7aa' : 'none'
                                }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <span style={{ fontWeight: 'bold' }}>
                                            {formatMonth(info.bulan_tagihan)} (Cicilan {info.payment_ids.length}x)
                                        </span>
                                        <span style={{ fontWeight: 'bold', color: '#dc2626' }}>
                                            Sisa: {formatCurrency(info.sisa_tagihan)}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )
                })()
            }

            {/* Signature */}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '30px', breakInside: 'avoid' }}>
                <div style={{ textAlign: 'center', width: '200px' }}>
                    <p>Penyetor</p>
                    <div style={{ height: '60px' }}></div>
                    <p style={{ borderTop: '1px solid #000', paddingTop: '5px' }}>({customer?.nama || '...................'})</p>
                </div>
                <div style={{ textAlign: 'center', width: '200px' }}>
                    <p>Petugas Penerima</p>
                    <div style={{ height: '60px' }}></div>
                    <p style={{ borderTop: '1px solid #000', paddingTop: '5px' }}>(...................)</p>
                </div>
            </div>

            {/* Footer Note */}
            <div style={{ marginTop: '20px', fontSize: '10px', borderTop: '1px solid #ccc', paddingTop: '5px', breakInside: 'avoid' }}>
                <p>Catatan: Simpan bukti pembayaran ini sebagai bukti pembayaran yang sah.</p>
                <p>Dicetak pada: {currentDate.toLocaleString('id-ID')}</p>
            </div>
        </div >
    )
}
