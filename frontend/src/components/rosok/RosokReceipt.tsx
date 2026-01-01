'use client'

import React from 'react'

import { formatCurrency } from '@/lib/utils'
import { useQuery } from '@tanstack/react-query'
import { settingsApi } from '@/lib/api'
import { format } from 'date-fns'
import { id } from 'date-fns/locale'

interface RosokReceiptProps {
    sale: {
        id: string
        tanggal: string
        pembeli?: string
        catatan?: string
        items: Array<{
            jenis_barang: string
            berat: number
            harga_per_kg: number
            total_harga: number
        }>
        total_harga: number
    }
    isThermal?: boolean
}

const RosokReceipt = React.forwardRef<HTMLDivElement, RosokReceiptProps>(({ sale, isThermal = false }, ref) => {
    // Return null if no sale data (though parent should control this)
    if (!sale) return null

    // Get settings for logo
    const { data: settings } = useQuery({
        queryKey: ['settings'],
        queryFn: async () => {
            const { data } = await settingsApi.get()
            return data
        },
    })

    const currentDate = new Date()
    const transactionDate = new Date(sale.tanggal)
    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'
    const receiptId = isThermal ? `rosok-receipt-thermal-${sale.id}` : `rosok-receipt-${sale.id}`

    if (isThermal) {
        // Thermal Receipt (58mm width)
        return (
            <div id={receiptId} ref={ref}>
                <style dangerouslySetInnerHTML={{
                    __html: `
            @media print {
            body * {
                visibility: hidden;
            }
            #${receiptId},
            #${receiptId} * {
                visibility: visible;
            }
            #${receiptId} {
                position: absolute;
                left: 0;
                top: 0;
                width: 58mm;
                max-width: 58mm;
                font-family: 'Courier New', 'Consolas', monospace;
                font-size: 8px;
                line-height: 1.3;
                padding: 1mm 2mm;
                color: #000;
                box-sizing: border-box;
            }
            @page {
                size: 58mm auto;
                margin: 0;
            }
            }
            #${receiptId} {
            width: 58mm;
            max-width: 58mm;
            font-family: 'Courier New', 'Consolas', monospace;
            font-size: 8px;
            line-height: 1.3;
            padding: 1mm 2mm;
            background: white;
            color: #000;
            box-sizing: border-box;
            }
        `}} />

                {/* Header */}
                <div style={{ textAlign: 'center', marginBottom: '2mm' }}>
                    <div style={{ fontSize: '10px', fontWeight: 'bold', marginBottom: '0.5mm', letterSpacing: '0.5px' }}>{settings?.app_name || 'SABAMAS'}</div>
                    <div style={{ fontSize: '7px', marginBottom: '0.5mm' }}>Penjualan Rosok</div>
                    <div style={{ fontSize: '8px', fontWeight: 'bold', marginTop: '1mm' }}>NOTA TRANSAKSI</div>
                </div>

                <div style={{ borderTop: '1px dashed #000', margin: '1mm 0' }}></div>

                {/* Transaction Info */}
                <table style={{ width: '100%', fontSize: '7px', borderCollapse: 'collapse' }}>
                    <tbody>
                        <tr>
                            <td style={{ padding: '0.5mm 0', width: '30%' }}>No</td>
                            <td style={{ padding: '0.5mm 0', width: '5%' }}>:</td>
                            <td style={{ padding: '0.5mm 0', fontWeight: 'bold' }}>{sale.id.substring(0, 8)}</td>
                        </tr>
                        <tr>
                            <td style={{ padding: '0.5mm 0' }}>Tgl</td>
                            <td style={{ padding: '0.5mm 0' }}>:</td>
                            <td style={{ padding: '0.5mm 0' }}>{format(transactionDate, 'dd/MM/yy', { locale: id })}</td>
                        </tr>
                        <tr>
                            <td style={{ padding: '0.5mm 0' }}>Pembeli</td>
                            <td style={{ padding: '0.5mm 0' }}>:</td>
                            <td style={{ padding: '0.5mm 0' }}>{sale.pembeli || '-'}</td>
                        </tr>
                    </tbody>
                </table>

                <div style={{ borderTop: '1px dashed #000', margin: '1mm 0' }}></div>

                {/* Items */}
                <div style={{ fontSize: '7px', fontWeight: 'bold', marginBottom: '0.5mm' }}>ITEM:</div>
                <table style={{ width: '100%', fontSize: '7px', borderCollapse: 'collapse' }}>
                    <tbody>
                        {sale.items.map((item, index) => (
                            <tr key={index}>
                                <td style={{ padding: '0.5mm 0' }} colSpan={3}>
                                    <div>{item.jenis_barang}</div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', paddingLeft: '2mm', color: '#333' }}>
                                        <span>{item.berat} kg x {formatCurrency(item.harga_per_kg).replace('Rp', '').trim()}</span>
                                        <span style={{ fontWeight: 'bold', color: '#000' }}>{formatCurrency(item.total_harga)}</span>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                <div style={{ borderTop: '1px solid #000', margin: '1mm 0' }}></div>

                {/* Total */}
                <table style={{ width: '100%', fontSize: '8px', marginBottom: '1mm' }}>
                    <tbody>
                        <tr>
                            <td style={{ padding: '0.5mm 0', fontWeight: 'bold' }}>TOTAL</td>
                            <td style={{ padding: '0.5mm 0', textAlign: 'right', fontWeight: 'bold', fontSize: '9px' }}>{formatCurrency(sale.total_harga)}</td>
                        </tr>
                    </tbody>
                </table>

                {sale.catatan && (
                    <>
                        <div style={{ borderTop: '1px dashed #000', margin: '1mm 0' }}></div>
                        <div style={{ fontSize: '6px', fontStyle: 'italic' }}>
                            <strong>Catatan:</strong> {sale.catatan}
                        </div>
                    </>
                )}

                <div style={{ borderTop: '1px dashed #000', margin: '1.5mm 0' }}></div>

                <div style={{ textAlign: 'center', fontSize: '7px', marginTop: '1mm' }}>
                    <div style={{ fontWeight: 'bold' }}>Terima Kasih</div>
                    <div style={{ fontSize: '5px', marginTop: '0.5mm', color: '#666' }}>
                        {format(currentDate, 'dd MMM yyyy HH:mm', { locale: id })}
                    </div>
                </div>
            </div>
        )
    }

    // Standard A4 Receipt
    return (
        <div id={receiptId} ref={ref}>
            <style dangerouslySetInnerHTML={{
                __html: `
        @media print {
            body * {
            visibility: hidden;
            }
            #${receiptId},
            #${receiptId} * {
            visibility: visible;
            }
            #${receiptId} {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            margin: 0;
            padding: 20mm;
            background: white;
            }
            @page {
            size: A4;
            margin: 0;
            }
        }
        #${receiptId} {
            width: 210mm;
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
                                    <div style="width: 80px; height: 80px; border: 2px solid #000; display: flex; align-items: center; justify-content: center; font-size: 32px; font-weight: bold;">S</div>
                                `;
                            }
                        }}
                        style={{ width: '80px', height: '80px', objectFit: 'contain' }}
                    />
                ) : (
                    <div style={{ width: '80px', height: '80px', border: '2px solid #000', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '32px', fontWeight: 'bold' }}>
                        S
                    </div>
                )}
                <div style={{ flex: 1, textAlign: 'center' }}>
                    <h1 style={{ margin: 0, fontSize: '24px', fontWeight: 'bold', textTransform: 'uppercase' }}>
                        {settings?.app_name || 'SABAMAS'}
                    </h1>
                    <p style={{ margin: '5px 0 0', fontSize: '14px' }}>
                        {settings?.app_description || 'Sistem Pengelolaan Sampah & Barang Bekas'}
                    </p>
                    <p style={{ margin: '2px 0', fontSize: '12px' }}>Dukuh Ngumbul RT 02/RW 02 Desa Kemasan Kecamatan Sawit Kabupaten Boyolali 57374 Provinsi Jawa Tengah</p>
                    <p style={{ margin: '2px 0', fontSize: '12px' }}>Telp: +62 858 6771 4590</p>
                </div>
                <div style={{ width: '80px' }}></div>
            </div>

            {/* Title */}
            <div style={{ textAlign: 'center', marginBottom: '30px' }}>
                <h2 style={{ margin: 0, fontSize: '18px', textDecoration: 'underline', fontWeight: 'bold' }}>BUKTI PENJUALAN ROSOK</h2>
                <p style={{ margin: '5px 0 0', fontSize: '14px' }}>Nomor: {sale.id}</p>
            </div>

            {/* Transaction Details */}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '30px' }}>
                <div style={{ width: '48%' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <tbody>
                            <tr>
                                <td style={{ width: '100px', padding: '5px 0' }}>Tanggal</td>
                                <td style={{ width: '10px', padding: '5px 0' }}>:</td>
                                <td style={{ padding: '5px 0', fontWeight: 'bold' }}>{format(transactionDate, 'dd MMMM yyyy, HH:mm', { locale: id })}</td>
                            </tr>
                            <tr>
                                <td style={{ padding: '5px 0' }}>Pihak Pembeli</td>
                                <td style={{ padding: '5px 0' }}>:</td>
                                <td style={{ padding: '5px 0', fontWeight: 'bold' }}>{sale.pembeli || '-'}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
                <div style={{ width: '48%' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <tbody>
                            <tr>
                                <td style={{ width: '100px', padding: '5px 0' }}>Catatan</td>
                                <td style={{ width: '10px', padding: '5px 0' }}>:</td>
                                <td style={{ padding: '5px 0' }}>{sale.catatan || '-'}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Items Table */}
            <div style={{ marginBottom: '30px' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #000' }}>
                    <thead>
                        <tr style={{ backgroundColor: '#f0f0f0' }}>
                            <th style={{ border: '1px solid #000', padding: '10px', textAlign: 'center', width: '50px' }}>No</th>
                            <th style={{ border: '1px solid #000', padding: '10px', textAlign: 'left' }}>Jenis Barang</th>
                            <th style={{ border: '1px solid #000', padding: '10px', textAlign: 'right' }}>Berat (kg)</th>
                            <th style={{ border: '1px solid #000', padding: '10px', textAlign: 'right' }}>Harga/kg</th>
                            <th style={{ border: '1px solid #000', padding: '10px', textAlign: 'right' }}>Total (Rp)</th>
                        </tr>
                    </thead>
                    <tbody>
                        {sale.items.map((item, index) => (
                            <tr key={index}>
                                <td style={{ border: '1px solid #000', padding: '8px', textAlign: 'center' }}>{index + 1}</td>
                                <td style={{ border: '1px solid #000', padding: '8px' }}>{item.jenis_barang}</td>
                                <td style={{ border: '1px solid #000', padding: '8px', textAlign: 'right' }}>{item.berat}</td>
                                <td style={{ border: '1px solid #000', padding: '8px', textAlign: 'right' }}>{formatCurrency(item.harga_per_kg).replace('Rp', '').trim()}</td>
                                <td style={{ border: '1px solid #000', padding: '8px', textAlign: 'right' }}>{formatCurrency(item.total_harga).replace('Rp', '').trim()}</td>
                            </tr>
                        ))}
                    </tbody>
                    <tfoot>
                        <tr style={{ fontWeight: 'bold', backgroundColor: '#f0f0f0' }}>
                            <td colSpan={4} style={{ border: '1px solid #000', padding: '10px', textAlign: 'right' }}>TOTAL TRANSAKSI</td>
                            <td style={{ border: '1px solid #000', padding: '10px', textAlign: 'right' }}>
                                {formatCurrency(sale.total_harga)}
                            </td>
                        </tr>
                    </tfoot>
                </table>
                <div style={{ marginTop: '5px', fontStyle: 'italic', fontSize: '12px' }}>
                    Terbilang: # {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(sale.total_harga).replace('Rp', '').trim()} #
                </div>
            </div>

            {/* Signature */}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '50px' }}>
                <div style={{ textAlign: 'center', width: '200px' }}>
                    <p>Pembeli</p>
                    <div style={{ height: '80px' }}></div>
                    <p style={{ borderTop: '1px solid #000', paddingTop: '5px' }}>({sale.pembeli || '...................'})</p>
                </div>
                <div style={{ textAlign: 'center', width: '200px' }}>
                    <p>Petugas/Admin</p>
                    <div style={{ height: '80px' }}></div>
                    <p style={{ borderTop: '1px solid #000', paddingTop: '5px' }}>(...................)</p>
                </div>
            </div>

            {/* Footer */}
            <div style={{ marginTop: '50px', fontSize: '10px', borderTop: '1px solid #ccc', paddingTop: '5px' }}>
                <p>Dicetak otomatis oleh Sistem Sabamas pada: {currentDate.toLocaleString('id-ID')}</p>
            </div>
        </div>
    )
})

RosokReceipt.displayName = 'RosokReceipt'

export default RosokReceipt
