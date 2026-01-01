'use client'

import React from 'react'

import { formatCurrency } from '@/lib/utils'
import { useQuery } from '@tanstack/react-query'
import { settingsApi } from '@/lib/api'
import { format } from 'date-fns'
import { id } from 'date-fns/locale'

interface RosokReportPrintProps {
    sales: any[]
    period?: string
}

const RosokReportPrint = React.forwardRef<HTMLDivElement, RosokReportPrintProps>(({ sales, period }, ref) => {
    const { data: settings } = useQuery({
        queryKey: ['settings'],
        queryFn: async () => {
            const { data } = await settingsApi.get()
            return data
        },
    })

    const currentDate = new Date()
    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'
    const reportId = 'rosok-report-print'

    const totalRevenue = sales.reduce((acc, curr) => acc + curr.total_harga, 0)
    const totalWeight = sales.reduce((acc, curr) => acc + curr.items.reduce((s: number, i: any) => s + i.berat, 0), 0)

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
                <h2 style={{ margin: 0, fontSize: '16px', fontWeight: 'bold', textTransform: 'uppercase' }}>LAPORAN PENJUALAN ROSOK</h2>
                {period && <p style={{ margin: '5px 0 0', fontSize: '12px' }}>Periode: {period}</p>}
            </div>

            {/* Table */}
            <div style={{ marginBottom: '20px' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #000', fontSize: '11px' }}>
                    <thead>
                        <tr style={{ backgroundColor: '#f0f0f0' }}>
                            <th style={{ border: '1px solid #000', padding: '6px', textAlign: 'center', width: '30px' }}>No</th>
                            <th style={{ border: '1px solid #000', padding: '6px', textAlign: 'left', width: '80px' }}>Tanggal</th>
                            <th style={{ border: '1px solid #000', padding: '6px', textAlign: 'left' }}>Pembeli</th>
                            <th style={{ border: '1px solid #000', padding: '6px', textAlign: 'left' }}>Resume Barang (Jenis - Berat - Harga)</th>
                            <th style={{ border: '1px solid #000', padding: '6px', textAlign: 'right', width: '70px' }}>Tot. Berat</th>
                            <th style={{ border: '1px solid #000', padding: '6px', textAlign: 'right', width: '100px' }}>Tot. Harga (Rp)</th>
                        </tr>
                    </thead>
                    <tbody>
                        {sales.map((sale, index) => {
                            const saleTotalWeight = sale.items.reduce((acc: number, item: any) => acc + item.berat, 0);
                            const itemDetails = sale.items.map((item: any) =>
                                `${item.jenis_barang} (${item.berat}kg @${formatCurrency(item.harga_per_kg).replace('Rp', '').trim()})`
                            ).join(', ');

                            return (
                                <tr key={sale.id}>
                                    <td style={{ border: '1px solid #000', padding: '6px', textAlign: 'center' }}>{index + 1}</td>
                                    <td style={{ border: '1px solid #000', padding: '6px' }}>{format(new Date(sale.tanggal), 'dd/MM/yyyy')}</td>
                                    <td style={{ border: '1px solid #000', padding: '6px' }}>{sale.pembeli || '-'}</td>
                                    <td style={{ border: '1px solid #000', padding: '6px' }}>{itemDetails}</td>
                                    <td style={{ border: '1px solid #000', padding: '6px', textAlign: 'right' }}>{saleTotalWeight.toFixed(2)}</td>
                                    <td style={{ border: '1px solid #000', padding: '6px', textAlign: 'right' }}>{formatCurrency(sale.total_harga).replace('Rp', '').trim()}</td>
                                </tr>
                            )
                        })}
                    </tbody>
                    <tfoot>
                        <tr style={{ fontWeight: 'bold', backgroundColor: '#f0f0f0' }}>
                            <td colSpan={4} style={{ border: '1px solid #000', padding: '8px', textAlign: 'right' }}>TOTAL KESELURUHAN</td>
                            <td style={{ border: '1px solid #000', padding: '8px', textAlign: 'right' }}>{totalWeight.toFixed(2)} kg</td>
                            <td style={{ border: '1px solid #000', padding: '8px', textAlign: 'right' }}>
                                {formatCurrency(totalRevenue)}
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

RosokReportPrint.displayName = 'RosokReportPrint'

export default RosokReportPrint
