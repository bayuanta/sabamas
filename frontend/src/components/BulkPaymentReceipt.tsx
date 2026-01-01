'use client'

import { formatCurrency, formatMonth } from '@/lib/utils'
import { useQuery } from '@tanstack/react-query'
import { settingsApi } from '@/lib/api'

interface BulkPaymentReceiptProps {
    payments: Array<{
        id?: string
        customer_nama: string
        bulan_dibayar: string[] | string
        jumlah_bayar: number
        metode_bayar: string
        catatan?: string
        tanggal_bayar?: string
        month_breakdown?: Record<string, { amount: number; source: string; details?: string }> | string
    }>
    isThermal?: boolean
}

export default function BulkPaymentReceipt({ payments, isThermal = false }: BulkPaymentReceiptProps) {
    // Get settings for logo
    const { data: settings } = useQuery({
        queryKey: ['settings'],
        queryFn: async () => {
            const { data } = await settingsApi.get()
            return data
        },
    })

    const currentDate = new Date()
    const totalAmount = payments.reduce((sum, p) => sum + p.jumlah_bayar, 0)
    const totalCustomers = payments.length
    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

    // Helper function to get amount for a specific month from a payment
    const getMonthAmount = (payment: any, month: string): number => {
        // Parse month_breakdown if it exists
        let monthBreakdown = null
        if (payment.month_breakdown) {
            monthBreakdown = typeof payment.month_breakdown === 'string'
                ? JSON.parse(payment.month_breakdown)
                : payment.month_breakdown
        }

        // If breakdown exists, use it
        if (monthBreakdown && monthBreakdown[month]) {
            return monthBreakdown[month].amount
        }

        // Fallback to equal distribution
        const paidMonths = Array.isArray(payment.bulan_dibayar)
            ? payment.bulan_dibayar
            : typeof payment.bulan_dibayar === 'string'
                ? JSON.parse(payment.bulan_dibayar)
                : []

        return payment.jumlah_bayar / paidMonths.length
    }

    if (isThermal) {
        // Thermal Receipt for Bulk
        return (
            <div id="bulk-receipt-thermal">
                <style dangerouslySetInnerHTML={{
                    __html: `
          @media print {
            body * {
              visibility: hidden;
            }
            #bulk-receipt-thermal,
            #bulk-receipt-thermal * {
              visibility: visible;
            }
            #bulk-receipt-thermal {
              position: absolute;
              left: 0;
              top: 0;
              width: 58mm;
              font-family: 'Courier New', monospace;
              font-size: 10px;
              line-height: 1.3;
              padding: 3mm;
              color: #000;
            }
            @page {
              size: 58mm auto;
              margin: 0;
            }
          }
          #bulk-receipt-thermal {
            display: none;
          }
        `}} />

                <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '13px', fontWeight: 'bold', marginBottom: '2px' }}>SABAMAS</div>
                    <div style={{ fontSize: '9px' }}>Sistem Billing Sampah</div>
                    <div style={{ fontSize: '9px', marginTop: '2px', fontWeight: 'bold' }}>NOTA KOLEKTIF</div>
                </div>

                <div style={{ borderTop: '1px dashed #000', margin: '3px 0' }}></div>

                <div style={{ display: 'flex', justifyContent: 'space-between', margin: '2px 0' }}>
                    <span>Tgl</span>
                    <span>{currentDate.toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric' })}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', margin: '2px 0' }}>
                    <span>Jam</span>
                    <span>{currentDate.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', margin: '2px 0', fontWeight: 'bold' }}>
                    <span>Total Pelanggan</span>
                    <span>{totalCustomers}</span>
                </div>

                <div style={{ borderTop: '1px dashed #000', margin: '3px 0' }}></div>

                {payments.map((payment, index) => {
                    const paidMonths = Array.isArray(payment.bulan_dibayar)
                        ? payment.bulan_dibayar
                        : typeof payment.bulan_dibayar === 'string'
                            ? JSON.parse(payment.bulan_dibayar)
                            : []

                    return (
                        <div key={index} style={{ marginBottom: '4px' }}>
                            <div style={{ fontWeight: 'bold', fontSize: '10px' }}>{index + 1}. {payment.customer_nama}</div>
                            {paidMonths.map((month: string) => (
                                <div key={month} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9px', marginLeft: '8px' }}>
                                    <span>{formatMonth(month)}</span>
                                    <span>{formatCurrency(getMonthAmount(payment, month))}</span>
                                </div>
                            ))}
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9px', marginLeft: '8px', fontWeight: 'bold' }}>
                                <span>Subtotal</span>
                                <span>{formatCurrency(payment.jumlah_bayar)}</span>
                            </div>
                        </div>
                    )
                })}

                <div style={{ borderTop: '1px dashed #000', margin: '3px 0' }}></div>

                <div style={{ display: 'flex', justifyContent: 'space-between', margin: '2px 0', fontWeight: 'bold', fontSize: '11px' }}>
                    <span>TOTAL SEMUA</span>
                    <span>{formatCurrency(totalAmount)}</span>
                </div>

                <div style={{ borderTop: '1px dashed #000', margin: '3px 0' }}></div>



                <div style={{ textAlign: 'center', fontSize: '8px', marginTop: '4mm' }}>
                    <div>Terima Kasih</div>
                    <div>{currentDate.toLocaleString('id-ID')}</div>
                </div>
            </div>
        )
    }

    // Helper to construct logo URL
    const getLogoUrl = (logoPath: string) => {
        if (!logoPath) return ''
        // Remove /api if present at the end of API_URL
        const baseUrl = API_URL.replace(/\/api\/?$/, '')
        // Ensure logoPath starts with /
        const cleanPath = logoPath.startsWith('/') ? logoPath : `/${logoPath}`
        return `${baseUrl}${cleanPath}`
    }

    // A4 Receipt for Bulk - Modern Professional Style
    return (
        <div id="bulk-receipt" style={{
            width: '210mm',
            minHeight: '297mm',
            margin: '0 auto',
            padding: '15mm',
            fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
            fontSize: '10pt',
            lineHeight: '1.4',
            color: '#333',
            backgroundColor: '#fff'
        }}>
            {/* ... styles ... */}
            <style dangerouslySetInnerHTML={{
                __html: `
        @media print {
          body * {
            visibility: hidden;
          }
          #bulk-receipt,
          #bulk-receipt * {
            visibility: visible;
          }
          #bulk-receipt {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            margin: 0;
            padding: 15mm;
          }
          @page {
            size: A4;
            margin: 0;
          }
          .page-break {
            page-break-before: always;
          }
          .no-break {
            page-break-inside: avoid;
          }
        }
        @media screen {
          #bulk-receipt {
            display: none;
          }
        }
        .receipt-table {
            width: 100%;
            border-collapse: collapse;
        }
        .receipt-table th {
            background-color: #f8f9fa;
            color: #495057;
            font-weight: 600;
            text-align: left;
            padding: 8px 12px;
            border-bottom: 2px solid #dee2e6;
            font-size: 9pt;
            text-transform: uppercase;
        }
        .receipt-table td {
            padding: 8px 12px;
            border-bottom: 1px solid #e9ecef;
            vertical-align: top;
        }
        .receipt-table tr:last-child td {
            border-bottom: none;
        }
      `}} />

            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px', borderBottom: '2px solid #228be6', paddingBottom: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                    {settings?.logo ? (
                        <img
                            src={getLogoUrl(settings.logo)}
                            alt="Logo"
                            style={{
                                width: '60px',
                                height: '60px',
                                objectFit: 'contain'
                            }}
                            onError={(e) => {
                                e.currentTarget.style.display = 'none'
                                // Show fallback text logic could go here but simple hide is better than broken image
                            }}
                        />
                    ) : (
                        <div style={{
                            width: '60px',
                            height: '60px',
                            backgroundColor: '#228be6',
                            color: '#fff',
                            borderRadius: '12px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 'bold',
                            fontSize: '24px'
                        }}>
                            S
                        </div>
                    )}
                    <div>
                        <div style={{ fontSize: '18pt', fontWeight: '800', color: '#1864ab', letterSpacing: '-0.5px' }}>SABAMAS</div>
                        <div style={{ fontSize: '9pt', color: '#868e96', fontWeight: '500' }}>Sahabat Bersih Masyarakat</div>
                        <div style={{ fontSize: '9pt', color: '#495057', width: '100%', lineHeight: '1.2' }}>
                            Dukuh Ngumbul RT 02/RW 02 Desa Kemasan Kecamatan Sawit Kabupaten Boyolali 57374 Provinsi Jawa Tengah
                        </div>
                        <div style={{ fontSize: '9pt', color: '#495057', marginTop: '2px' }}>
                            Telp: +62 858 6771 4590
                        </div>
                    </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '16pt', fontWeight: '700', color: '#343a40', textTransform: 'uppercase' }}>Bukti Pembayaran</div>
                    <div style={{ fontSize: '10pt', color: '#868e96', marginTop: '5px' }}>NO. REF: {currentDate.getTime().toString().slice(-8)}</div>
                    <div style={{ fontSize: '10pt', color: '#868e96' }}>TANGGAL: {currentDate.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</div>
                </div>
            </div>

            {/* Content */}
            <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px', backgroundColor: '#f1f3f5', padding: '15px', borderRadius: '8px' }}>
                    <div>
                        <div style={{ fontSize: '8pt', textTransform: 'uppercase', color: '#868e96', fontWeight: 'bold', marginBottom: '5px' }}>Informasi Kolektif</div>
                        <div style={{ fontSize: '11pt', fontWeight: 'bold', color: '#343a40' }}>{totalCustomers} Pelanggan</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '8pt', textTransform: 'uppercase', color: '#868e96', fontWeight: 'bold', marginBottom: '5px' }}>Total Pembayaran</div>
                        <div style={{ fontSize: '14pt', fontWeight: 'bold', color: '#228be6' }}>{formatCurrency(totalAmount)}</div>
                    </div>
                </div>

                <div style={{ marginBottom: '10px', fontSize: '10pt', fontWeight: 'bold', color: '#343a40' }}>RINCIAN PEMBAYARAN</div>

                <table className="receipt-table" style={{ width: '100%', marginBottom: '30px' }}>
                    <thead>
                        <tr>
                            <th style={{ width: '5%' }}>No</th>
                            <th style={{ width: '35%' }}>Pelanggan</th>
                            <th style={{ width: '40%' }}>Keterangan Periode</th>
                            <th style={{ width: '20%', textAlign: 'right' }}>Jumlah</th>
                        </tr>
                    </thead>
                    <tbody>
                        {payments.map((payment, index) => {
                            const paidMonths = Array.isArray(payment.bulan_dibayar)
                                ? payment.bulan_dibayar
                                : typeof payment.bulan_dibayar === 'string'
                                    ? JSON.parse(payment.bulan_dibayar)
                                    : []

                            // Format months for display
                            const monthsDisplay = paidMonths.map((m: string) => formatMonth(m)).join(', ');

                            return (
                                <tr key={index} className="no-break">
                                    <td style={{ color: '#868e96' }}>{index + 1}</td>
                                    <td>
                                        <div style={{ fontWeight: '600', color: '#343a40' }}>{payment.customer_nama}</div>
                                    </td>
                                    <td>
                                        <div style={{ fontSize: '9pt', color: '#495057', lineHeight: '1.4' }}>
                                            {monthsDisplay}
                                        </div>
                                        <div style={{ fontSize: '8pt', color: '#868e96', marginTop: '2px' }}>
                                            {paidMonths.length} Bulan
                                        </div>
                                    </td>
                                    <td style={{ textAlign: 'right', fontWeight: '600', color: '#343a40' }}>
                                        {formatCurrency(payment.jumlah_bayar)}
                                    </td>
                                </tr>
                            )
                        })}
                    </tbody>
                    <tfoot>
                        <tr style={{ backgroundColor: '#fff', borderTop: '2px solid #343a40' }}>
                            <td colSpan={3} style={{ textAlign: 'right', padding: '15px 12px', fontSize: '11pt', fontWeight: 'bold', color: '#343a40' }}>TOTAL KESELURUHAN</td>
                            <td style={{ textAlign: 'right', padding: '15px 12px', fontSize: '12pt', fontWeight: 'bold', color: '#228be6' }}>{formatCurrency(totalAmount)}</td>
                        </tr>
                    </tfoot>
                </table>

                {/* Footer / Signature Area */}
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '40px', breakInside: 'avoid' }} className="no-break">
                    <div style={{ width: '40%' }}>
                        <div style={{ fontSize: '9pt', color: '#868e96', marginBottom: '10px' }}>Catatan:</div>
                        <div style={{ fontSize: '9pt', color: '#495057', fontStyle: 'italic', lineHeight: '1.5' }}>
                            Terima kasih atas pembayaran Anda. Bukti pembayaran ini sah dan diterbitkan oleh sistem SABAMAS.
                            Mohon simpan bukti ini sebagai referensi.
                        </div>
                    </div>
                    <div style={{ width: '30%', textAlign: 'center' }}>
                        <div style={{ fontSize: '10pt', color: '#343a40', marginBottom: '60px' }}>Petugas,</div>
                        <div style={{ borderBottom: '1px solid #dee2e6', width: '80%', margin: '0 auto' }}></div>
                    </div>
                </div>

                <div style={{
                    textAlign: 'center',
                    marginTop: '40px',
                    borderTop: '1px solid #f1f3f5',
                    paddingTop: '15px',
                    color: '#adb5bd',
                    fontSize: '8pt'
                }}>
                    SABAMAS - Sistem Billing Sampah | Generated on {currentDate.toLocaleString('id-ID')}
                </div>
            </div>
        </div>
    )
}
