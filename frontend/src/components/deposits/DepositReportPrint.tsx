'use client'

import React from 'react'
import { formatCurrency, formatDate, formatDateTime } from '@/lib/utils'
import { useQuery } from '@tanstack/react-query'
import { settingsApi } from '@/lib/api'
import { format } from 'date-fns'
import { id } from 'date-fns/locale'

interface DepositReportPrintProps {
    deposit: any
    payments: any[]
}

const DepositReportPrint = React.forwardRef<HTMLDivElement, DepositReportPrintProps>(({ deposit, payments }, ref) => {
    const { data: settings } = useQuery({
        queryKey: ['settings'],
        queryFn: async () => {
            const { data } = await settingsApi.get()
            return data
        },
    })

    const currentDate = new Date()
    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'
    const reportId = 'deposit-report-print'

    // Sort payments if needed, e.g. by date
    const sortedPayments = [...payments].sort((a, b) => new Date(a.tanggal_bayar).getTime() - new Date(b.tanggal_bayar).getTime())

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
            size: A4; /* Portrait usually better for long lists */
            margin: 0;
            }
        }
        #${reportId} {
            width: 210mm; /* A4 Portrait width */
            min-height: 297mm;
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
                    {settings?.address && <p style={{ margin: '2px 0', fontSize: '11px' }}>{settings.address}</p>}
                </div>
                <div style={{ width: '60px' }}></div>
            </div>

            {/* Title & Info */}
            <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                <h2 style={{ margin: 0, fontSize: '16px', fontWeight: 'bold', textTransform: 'uppercase' }}>RINCIAN TRANSAKSI SETORAN</h2>
                <p style={{ margin: '5px 0 0', fontSize: '12px', fontWeight: 'bold' }}>No: {deposit.id.toUpperCase()}</p>
            </div>

            {/* Deposit Info Table */}
            <div style={{ marginBottom: '20px', border: '1px solid #000', padding: '10px' }}>
                <table style={{ width: '100%', fontSize: '11px' }}>
                    <tbody>
                        <tr>
                            <td style={{ width: '120px', fontWeight: 'bold' }}>Tanggal Setor</td>
                            <td style={{ width: '10px' }}>:</td>
                            <td>{formatDate(deposit.tanggal_setor)}</td>
                            <td style={{ width: '120px', fontWeight: 'bold' }}>Total Disetor</td>
                            <td style={{ width: '10px' }}>:</td>
                            <td style={{ fontWeight: 'bold' }}>{formatCurrency(deposit.jumlah_setor)}</td>
                        </tr>
                        <tr>
                            <td style={{ fontWeight: 'bold' }}>Periode Transaksi</td>
                            <td>:</td>
                            <td>{formatDate(deposit.periode_awal)} s/d {formatDate(deposit.periode_akhir)}</td>
                            <td style={{ fontWeight: 'bold' }}>Jumlah Transaksi</td>
                            <td>:</td>
                            <td>{payments.length} Item</td>
                        </tr>
                        {deposit.catatan && (
                            <tr>
                                <td style={{ fontWeight: 'bold', verticalAlign: 'top' }}>Catatan</td>
                                <td style={{ verticalAlign: 'top' }}>:</td>
                                <td colSpan={4}>{deposit.catatan}</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Transactions Table */}
            <div style={{ marginBottom: '20px' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #000', fontSize: '11px' }}>
                    <thead>
                        <tr style={{ backgroundColor: '#f0f0f0' }}>
                            <th style={{ border: '1px solid #000', padding: '6px', textAlign: 'center', width: '30px' }}>No</th>
                            <th style={{ border: '1px solid #000', padding: '6px', textAlign: 'left', width: '90px' }}>Tanggal</th>
                            <th style={{ border: '1px solid #000', padding: '6px', textAlign: 'left' }}>Nama Pelanggan</th>
                            <th style={{ border: '1px solid #000', padding: '6px', textAlign: 'left' }}>Wilayah</th>
                            <th style={{ border: '1px solid #000', padding: '6px', textAlign: 'right', width: '100px' }}>Jumlah (Rp)</th>
                        </tr>
                    </thead>
                    <tbody>
                        {sortedPayments.map((payment, index) => (
                            <tr key={payment.id}>
                                <td style={{ border: '1px solid #000', padding: '6px', textAlign: 'center' }}>{index + 1}</td>
                                <td style={{ border: '1px solid #000', padding: '6px' }}>{formatDate(payment.tanggal_bayar)}</td>
                                <td style={{ border: '1px solid #000', padding: '6px' }}>{payment.customer_nama}</td>
                                <td style={{ border: '1px solid #000', padding: '6px' }}>{payment.customer?.wilayah || '-'}</td>
                                <td style={{ border: '1px solid #000', padding: '6px', textAlign: 'right' }}>
                                    {formatCurrency(payment.jumlah_bayar).replace('Rp', '').trim()}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                    <tfoot>
                        <tr style={{ fontWeight: 'bold', backgroundColor: '#f0f0f0' }}>
                            <td colSpan={4} style={{ border: '1px solid #000', padding: '8px', textAlign: 'right' }}>TOTAL SETORAN</td>
                            <td style={{ border: '1px solid #000', padding: '8px', textAlign: 'right', fontSize: '12px' }}>
                                {formatCurrency(deposit.jumlah_setor)}
                            </td>
                        </tr>
                    </tfoot>
                </table>
            </div>

            {/* Footer Signatures */}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '40px', padding: '0 20px' }}>
                <div style={{ textAlign: 'center', width: '200px' }}>
                    <p style={{ marginBottom: '60px' }}>Disetor Oleh,</p>
                    <p style={{ borderTop: '1px solid #000', paddingTop: '5px', fontWeight: 'bold' }}>Petugas Lapangan</p>
                </div>
                <div style={{ textAlign: 'center', width: '200px' }}>
                    <p style={{ marginBottom: '60px' }}>Diterima Oleh,</p>
                    <p style={{ borderTop: '1px solid #000', paddingTop: '5px', fontWeight: 'bold' }}>Bendahara</p>
                </div>
            </div>

            {/* Footer Timestamp */}
            <div style={{ marginTop: '40px', fontSize: '10px', fontStyle: 'italic', textAlign: 'center', color: '#666' }}>
                Dicetak pada: {format(currentDate, 'dd MMMM yyyy HH:mm', { locale: id })}
            </div>
        </div>
    )
})

DepositReportPrint.displayName = 'DepositReportPrint'

export default DepositReportPrint
