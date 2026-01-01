'use client'

import { formatCurrency, formatDate, formatDateTime } from '@/lib/utils'
import { useQuery } from '@tanstack/react-query'
import { settingsApi } from '@/lib/api'

interface DepositReceiptProps {
    deposit: {
        id: string
        tanggal_setor: string
        jumlah_setor: number
        periode_awal: string
        periode_akhir: string
        payment_ids?: string[]
        catatan?: string
    }
    payments?: Array<{
        id: string
        customer_nama: string
        tanggal_bayar: string
        jumlah_bayar: number
    }>
}

export default function DepositReceipt({ deposit, payments }: DepositReceiptProps) {
    // Get settings for logo
    const { data: settings } = useQuery({
        queryKey: ['settings'],
        queryFn: async () => {
            const { data } = await settingsApi.get()
            return data
        },
    })

    const currentDate = new Date()
    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

    return (
        <div id="deposit-receipt">
            <style dangerouslySetInnerHTML={{
                __html: `
        @media print {
          body * {
            visibility: hidden;
          }
          #deposit-receipt,
          #deposit-receipt * {
            visibility: visible;
          }
          #deposit-receipt {
            position: absolute;
            left: 0;
            top: 0;
            width: 215.9mm;
            height: 110mm;
            margin: 0;
            padding: 10mm 15mm;
            font-family: 'Times New Roman', serif;
            font-size: 10pt;
            line-height: 1.3;
            color: #000;
            background: white;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
            box-sizing: border-box;
            border-bottom: 1px dashed #999;
          }
          @page {
            size: 215.9mm 330mm;
            margin: 0;
          }
        }
        #deposit-receipt {
          display: none;
          width: 215.9mm;
          height: 110mm;
          padding: 10mm 15mm;
          font-family: 'Times New Roman', serif;
          font-size: 10pt;
          line-height: 1.3;
          color: #000;
          background: white;
          box-sizing: border-box;
          border-bottom: 1px dashed #999;
        }
      `}} />

            {/* Minimal Header (No Letterhead) */}
            <div style={{
                borderBottom: '2px solid #000',
                paddingBottom: '10px',
                marginBottom: '20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
            }}>
                <div style={{ fontSize: '16pt', fontWeight: 'bold' }}>
                    BUKTI SETORAN SABAMAS
                </div>
                <div style={{ fontSize: '10pt' }}>
                    No: <b>{deposit.id.substring(0, 8)}</b>
                </div>
            </div>

            {/* Info Grid - 2 Columns */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '20px',
                marginBottom: '20px',
                fontSize: '11pt'
            }}>
                {/* Left Column */}
                <div>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <tbody>
                            <tr>
                                <td style={{ padding: '5px 0', width: '100px', color: '#555' }}>Tanggal Setor</td>
                                <td style={{ padding: '5px 0', width: '10px' }}>:</td>
                                <td style={{ padding: '5px 0', fontWeight: 'bold' }}>
                                    {formatDate(deposit.tanggal_setor)}
                                </td>
                            </tr>
                            <tr>
                                <td style={{ padding: '5px 0', color: '#555' }}>Periode</td>
                                <td style={{ padding: '5px 0' }}>:</td>
                                <td style={{ padding: '5px 0' }}>
                                    {formatDate(deposit.periode_awal)} s/d {formatDate(deposit.periode_akhir)}
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                {/* Right Column */}
                <div>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <tbody>
                            <tr>
                                <td style={{ padding: '5px 0', width: '100px', color: '#555' }}>Jumlah Trx</td>
                                <td style={{ padding: '5px 0', width: '10px' }}>:</td>
                                <td style={{ padding: '5px 0', fontWeight: 'bold' }}>
                                    {deposit.payment_ids?.length || 0} transaksi
                                </td>
                            </tr>
                            <tr>
                                <td style={{ padding: '5px 0', color: '#555' }}>Status</td>
                                <td style={{ padding: '5px 0' }}>:</td>
                                <td style={{ padding: '5px 0', fontWeight: 'bold', color: 'green' }}>
                                    BERHASIL
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Summary Box */}
            <div style={{
                marginTop: '10px',
                marginBottom: '30px',
                padding: '15px 20px',
                backgroundColor: '#f8f9fa',
                border: '2px solid #000',
                borderRadius: '8px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
            }}>
                <span style={{ fontWeight: 'bold', fontSize: '12pt', textTransform: 'uppercase' }}>TOTAL SETORAN DANA</span>
                <span style={{ fontWeight: 'bold', fontSize: '16pt' }}>
                    {formatCurrency(deposit.jumlah_setor)}
                </span>
            </div>

            {/* Signature - Compact */}
            <div style={{ marginTop: '20px' }}>
                <table style={{ width: '100%', fontSize: '10pt', borderCollapse: 'collapse' }}>
                    <tbody>
                        <tr>
                            <td style={{ width: '50%', textAlign: 'center', padding: '0' }}>
                                <div style={{ marginBottom: '50px' }}>Petugas Penyetor,</div>
                                <div style={{ borderTop: '1px solid #000', display: 'inline-block', minWidth: '150px', paddingTop: '5px', fontWeight: 'bold' }}>
                                    ( ..................................... )
                                </div>
                            </td>
                            <td style={{ width: '50%', textAlign: 'center', padding: '0' }}>
                                <div style={{ marginBottom: '50px' }}>Bendahara Penerima,</div>
                                <div style={{ borderTop: '1px solid #000', display: 'inline-block', minWidth: '150px', paddingTop: '5px', fontWeight: 'bold' }}>
                                    ( ..................................... )
                                </div>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>

            {/* Footer - Compact */}
            <div style={{
                position: 'absolute',
                bottom: '10mm',
                left: '15mm',
                right: '15mm',
                textAlign: 'center',
                fontSize: '8pt',
                color: '#666',
                fontStyle: 'italic',
                borderTop: '1px solid #eee',
                paddingTop: '5px'
            }}>
                <div>Dokumen ini sah dan dicetak otomatis oleh Sistem Sabamas pada {formatDateTime(new Date().toISOString())}</div>
            </div>
        </div>
    )
}
