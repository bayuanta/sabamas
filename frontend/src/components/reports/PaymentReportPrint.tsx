'use client'

import React from 'react'

import { formatCurrency, formatDateTime } from '@/lib/utils'
import { useQuery } from '@tanstack/react-query'
import { settingsApi } from '@/lib/api'
import { format } from 'date-fns'
import { id } from 'date-fns/locale'

interface PaymentReportPrintProps {
    payments: any[]
    period?: string
}

const PaymentReportPrint = React.forwardRef<HTMLDivElement, PaymentReportPrintProps>(({ payments, period }, ref) => {
    const { data: settings } = useQuery({
        queryKey: ['settings'],
        queryFn: async () => {
            const { data } = await settingsApi.get()
            return data
        },
    })

    const currentDate = new Date()
    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'
    const reportId = 'payment-report-print'

    const totalAmount = payments.reduce((acc, curr) => acc + curr.jumlah_bayar, 0)
    const totalTransactions = payments.length

    return (
        <div id={reportId} ref={ref}>
            <style dangerouslySetInnerHTML={{
                __html: `
        @media print {
            body * {
            visibility: hidden;
            }
            #${reportId},
            #${reportId} * {
            visibility: visible;
            }
            #${reportId} {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            margin: 0;
            padding: 20mm;
            background: white;
            }
            @page {
            size: A4 landscape;
            margin: 0;
            }
        }
        #${reportId} {
            width: 297mm; /* Landscape */
            min-height: 210mm;
            padding: 20mm;
            background: white;
            font-family: 'Times New Roman', serif;
            color: #000;
            box-sizing: border-box;
        }
        `}} />

            {/* Header */}
            <div style={{ borderBottom: '3px double #000', paddingBottom: '10px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '20px' }}>
                {settings?.logo || (typeof window !== 'undefined' && window.localStorage.getItem('logo_url')) ? (
                    <img
                        src={typeof window !== 'undefined' ? (window.localStorage.getItem('logo_url') || `${API_URL}${settings?.logo}`) : `${API_URL}${settings?.logo}`}
                        alt="Logo"
                        onError={(e) => {
                            e.currentTarget.style.display = 'none';
                            const parent = e.currentTarget.parentElement;
                            if (parent) {
                                parent.innerHTML = `
                                    <div style="width: 60px; height: 60px; border: 2px solid #000; display: flex; align-items: center; justify-content: center; font-size: 24px; font-weight: bold;">S</div>
                                `;
                            }
                        }}
                        style={{ width: '60px', height: '60px', objectFit: 'contain' }}
                    />
                ) : (
                    <div style={{ width: '60px', height: '60px', border: '2px solid #000', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', fontWeight: 'bold' }}>
                        S
                    </div>
                )}
                <div style={{ flex: 1, textAlign: 'center' }}>
                    <h1 style={{ margin: 0, fontSize: '20px', fontWeight: 'bold', textTransform: 'uppercase' }}>
                        {settings?.app_name || 'SABAMAS'}
                    </h1>
                    <p style={{ margin: '5px 0 0', fontSize: '12px' }}>
                        {settings?.app_description || 'Sistem Pengelolaan Sampah & Barang Bekas'}
                    </p>
                    <p style={{ margin: '2px 0', fontSize: '11px' }}>Dukuh Ngumbul RT 02/RW 02 Desa Kemasan Kecamatan Sawit Kabupaten Boyolali 57374 Provinsi Jawa Tengah</p>
                    <p style={{ margin: '2px 0', fontSize: '11px' }}>Telp: +62 858 6771 4590</p>
                </div>
                <div style={{ width: '60px' }}></div>
            </div>

            {/* Title */}
            <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                <h2 style={{ margin: 0, fontSize: '16px', fontWeight: 'bold', textTransform: 'uppercase' }}>LAPORAN PEMBAYARAN</h2>
                {period && <p style={{ margin: '5px 0 0', fontSize: '12px' }}>Periode: {period}</p>}
            </div>

            {/* Table */}
            <div style={{ marginBottom: '20px' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #000', fontSize: '11px' }}>
                    <thead>
                        <tr style={{ backgroundColor: '#f0f0f0' }}>
                            <th style={{ border: '1px solid #000', padding: '6px', textAlign: 'center', width: '30px' }}>No</th>
                            <th style={{ border: '1px solid #000', padding: '6px', textAlign: 'left', width: '100px' }}>Waktu</th>
                            <th style={{ border: '1px solid #000', padding: '6px', textAlign: 'left' }}>Pelanggan</th>
                            <th style={{ border: '1px solid #000', padding: '6px', textAlign: 'left', width: '100px' }}>Metode</th>
                            <th style={{ border: '1px solid #000', padding: '6px', textAlign: 'right', width: '120px' }}>Jumlah (Rp)</th>
                        </tr>
                    </thead>
                    <tbody>
                        {payments.map((payment, index) => (
                            <tr key={payment.id}>
                                <td style={{ border: '1px solid #000', padding: '6px', textAlign: 'center' }}>{index + 1}</td>
                                <td style={{ border: '1px solid #000', padding: '6px' }}>{format(new Date(payment.tanggal_bayar), 'dd/MM/yyyy HH:mm')}</td>
                                <td style={{ border: '1px solid #000', padding: '6px' }}>
                                    <div style={{ fontWeight: 'bold' }}>{payment.customer_nama}</div>
                                    <div style={{ fontSize: '10px', color: '#666' }}>{payment.customer?.wilayah}</div>
                                </td>
                                <td style={{ border: '1px solid #000', padding: '6px' }}>
                                    <span style={{ textTransform: 'capitalize' }}>{payment.metode_bayar}</span>
                                </td>
                                <td style={{ border: '1px solid #000', padding: '6px', textAlign: 'right' }}>
                                    {formatCurrency(payment.jumlah_bayar).replace('Rp', '').trim()}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                    <tfoot>
                        <tr style={{ fontWeight: 'bold', backgroundColor: '#f0f0f0' }}>
                            <td colSpan={4} style={{ border: '1px solid #000', padding: '8px', textAlign: 'right' }}>TOTAL KESELURUHAN ({totalTransactions} Transaksi)</td>
                            <td style={{ border: '1px solid #000', padding: '8px', textAlign: 'right' }}>
                                {formatCurrency(totalAmount)}
                            </td>
                        </tr>
                    </tfoot>
                </table>
            </div>

            {/* Footer Info */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '30px' }}>
                <div style={{ textAlign: 'center', width: '200px' }}>
                    <p>Dicetak pada: {format(currentDate, 'dd MMMM yyyy HH:mm', { locale: id })}</p>
                    <div style={{ height: '60px' }}></div>
                    <p style={{ borderTop: '1px solid #000', paddingTop: '5px' }}>Admin Sabamas</p>
                </div>
            </div>
        </div>
    )
})

PaymentReportPrint.displayName = 'PaymentReportPrint'

export default PaymentReportPrint
