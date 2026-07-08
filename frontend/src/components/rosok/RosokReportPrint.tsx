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
            padding: 15mm;
            background: white;
            }
            @page {
            size: A4 portrait;
            margin: 0;
            }
        }
        #${reportId} {
            width: 210mm; /* Portrait */
            min-height: 297mm;
            padding: 15mm;
            background: white;
            font-family: 'Times New Roman', serif;
            color: #000;
            box-sizing: border-box;
        }
        `}} />

            {/* Header */}
            <div style={{ borderBottom: '3px double #000', paddingBottom: '10px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '15px' }}>
                {settings?.logo || (typeof window !== 'undefined' && window.localStorage.getItem('logo_url')) ? (
                    <img
                        src={typeof window !== 'undefined' ? (window.localStorage.getItem('logo_url') || `${API_URL}${settings?.logo}`) : `${API_URL}${settings?.logo}`}
                        alt="Logo"
                        onError={(e) => {
                            e.currentTarget.style.display = 'none';
                            const parent = e.currentTarget.parentElement;
                            if (parent) {
                                parent.innerHTML = `
                                    <div style="width: 50px; height: 50px; border: 2px solid #000; display: flex; align-items: center; justify-content: center; font-size: 20px; font-weight: bold;">S</div>
                                `;
                            }
                        }}
                        style={{ width: '50px', height: '50px', objectFit: 'contain' }}
                    />
                ) : (
                    <div style={{ width: '50px', height: '50px', border: '2px solid #000', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', fontWeight: 'bold' }}>
                        S
                    </div>
                )}
                <div style={{ flex: 1, textAlign: 'center' }}>
                    <h1 style={{ margin: 0, fontSize: '18px', fontWeight: 'bold', textTransform: 'uppercase' }}>
                        {settings?.app_name || 'SABAMAS'}
                    </h1>
                    <p style={{ margin: '3px 0 0', fontSize: '11px' }}>
                        {settings?.app_description || 'Sistem Pengelolaan Sampah & Barang Bekas'}
                    </p>
                    <p style={{ margin: '2px 0', fontSize: '10px' }}>Dukuh Ngumbul RT 02/RW 02 Desa Kemasan Kecamatan Sawit Kabupaten Boyolali 57374 Provinsi Jawa Tengah</p>
                    <p style={{ margin: '2px 0', fontSize: '10px' }}>Telp: +62 858 6771 4590</p>
                </div>
                <div style={{ width: '50px' }}></div>
            </div>

            {/* Title */}
            <div style={{ textAlign: 'center', marginBottom: '15px' }}>
                <h2 style={{ margin: 0, fontSize: '14px', fontWeight: 'bold', textTransform: 'uppercase' }}>LAPORAN DETAIL PENJUALAN ROSOK</h2>
                {period && <p style={{ margin: '4px 0 0', fontSize: '11px' }}>Periode: {period}</p>}
            </div>

            {/* Table */}
            <div style={{ marginBottom: '20px' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #000', fontSize: '10px' }}>
                    <thead>
                        <tr style={{ backgroundColor: '#f0f0f0' }}>
                            <th style={{ border: '1px solid #000', padding: '5px', textAlign: 'center', width: '25px' }}>No</th>
                            <th style={{ border: '1px solid #000', padding: '5px', textAlign: 'left', width: '65px' }}>Tanggal</th>
                            <th style={{ border: '1px solid #000', padding: '5px', textAlign: 'left' }}>Pembeli</th>
                            <th style={{ border: '1px solid #000', padding: '5px', textAlign: 'left' }}>Jenis Barang</th>
                            <th style={{ border: '1px solid #000', padding: '5px', textAlign: 'right', width: '50px' }}>Berat</th>
                            <th style={{ border: '1px solid #000', padding: '5px', textAlign: 'right', width: '70px' }}>Harga/kg</th>
                            <th style={{ border: '1px solid #000', padding: '5px', textAlign: 'right', width: '80px' }}>Subtotal</th>
                        </tr>
                    </thead>
                    <tbody>
                        {sales.map((sale, saleIndex) => {
                            return sale.items.map((item: any, itemIndex: number) => (
                                <tr key={`${sale.id}-${itemIndex}`}>
                                    {itemIndex === 0 && (
                                        <>
                                            <td rowSpan={sale.items.length} style={{ border: '1px solid #000', padding: '5px', textAlign: 'center', verticalAlign: 'top' }}>{saleIndex + 1}</td>
                                            <td rowSpan={sale.items.length} style={{ border: '1px solid #000', padding: '5px', verticalAlign: 'top' }}>{format(new Date(sale.tanggal), 'dd/MM/yyyy')}</td>
                                            <td rowSpan={sale.items.length} style={{ border: '1px solid #000', padding: '5px', verticalAlign: 'top' }}>{sale.pembeli || '-'}</td>
                                        </>
                                    )}
                                    <td style={{ border: '1px solid #000', padding: '5px' }}>{item.jenis_barang}</td>
                                    <td style={{ border: '1px solid #000', padding: '5px', textAlign: 'right' }}>{item.berat} kg</td>
                                    <td style={{ border: '1px solid #000', padding: '5px', textAlign: 'right' }}>{formatCurrency(item.harga_per_kg).replace('Rp', '').trim()}</td>
                                    <td style={{ border: '1px solid #000', padding: '5px', textAlign: 'right' }}>{formatCurrency(item.total_harga).replace('Rp', '').trim()}</td>
                                </tr>
                            ))
                        })}
                    </tbody>
                    <tfoot>
                        <tr style={{ fontWeight: 'bold', backgroundColor: '#f0f0f0' }}>
                            <td colSpan={4} style={{ border: '1px solid #000', padding: '6px', textAlign: 'right' }}>TOTAL KESELURUHAN</td>
                            <td style={{ border: '1px solid #000', padding: '6px', textAlign: 'right' }}>{totalWeight.toFixed(2)} kg</td>
                            <td style={{ border: '1px solid #000', padding: '6px', textAlign: 'right' }}></td>
                            <td style={{ border: '1px solid #000', padding: '6px', textAlign: 'right' }}>
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
