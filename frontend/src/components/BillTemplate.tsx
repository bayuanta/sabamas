'use client'

import { formatCurrency, formatMonth } from '@/lib/utils'
import { useQuery } from '@tanstack/react-query'
import { settingsApi } from '@/lib/api'

interface BillTemplateProps {
    customer: {
        nama: string
        alamat: string
        wilayah: string
        nomor_telepon?: string
        tarif?: {
            nama_kategori: string
            harga_per_bulan: number
        }
        arrears?: {
            totalArrears: number
            totalMonths: number
            arrearMonths: Array<{
                month: string
                amount: number
                details?: string
                source: string
            }>
        }
    }
}

export function BillTemplate({ customer }: BillTemplateProps) {
    const currentDate = new Date()
    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

    // Get settings for company info
    const { data: settings } = useQuery({
        queryKey: ['settings'],
        queryFn: async () => {
            const { data } = await settingsApi.get()
            return data
        },
    })

    // Generate letter number
    const letterNumber = `${Math.floor(Math.random() * 999).toString().padStart(3, '0')}/SABAMAS/${currentDate.getMonth() + 1}/${currentDate.getFullYear()}`

    return (
        <div id="bill-template" style={{
            width: '210mm',
            minHeight: '297mm',
            margin: '0 auto',
            padding: '20mm',
            fontFamily: "'Times New Roman', serif",
            fontSize: '12pt',
            lineHeight: '1.6',
            color: '#000',
            backgroundColor: '#fff'
        }}>
            <style dangerouslySetInnerHTML={{
                __html: `
                @media print {
                    body * {
                        visibility: hidden;
                    }
                    #bill-template,
                    #bill-template * {
                        visibility: visible;
                    }
                    #bill-template {
                        position: absolute;
                        left: 0;
                        top: 0;
                        width: 100%;
                        max-width: 210mm;
                        margin: 0;
                        padding: 20mm;
                    }
                    @page {
                        size: A4;
                        margin: 0;
                    }
                }
                @media screen {
                    #bill-template {
                        display: none;
                    }
                }
                `}} />

            {/* Letterhead */}
            <div style={{ borderBottom: '3px double #000', paddingBottom: '10px', marginBottom: '20px' }}>
                <table style={{ width: '100%' }}>
                    <tbody>
                        <tr>
                            <td style={{ width: '80px', verticalAlign: 'top' }}>
                                {settings?.logo || (typeof window !== 'undefined' && window.localStorage.getItem('logo_url')) ? (
                                    <img
                                        src={typeof window !== 'undefined' ? (window.localStorage.getItem('logo_url') || `${API_URL}${settings?.logo}`) : `${API_URL}${settings?.logo}`}
                                        alt="Logo"
                                        onError={(e) => {
                                            e.currentTarget.style.display = 'none';
                                            const parent = e.currentTarget.parentElement;
                                            if (parent) {
                                                parent.innerHTML = `
                                                    <div style="width: 70px; height: 70px; border: 2px solid #000; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 24px;">S</div>
                                                `;
                                            }
                                        }}
                                        style={{
                                            width: '70px',
                                            height: '70px',
                                            objectFit: 'contain'
                                        }}
                                    />
                                ) : (
                                    <div style={{
                                        width: '70px',
                                        height: '70px',
                                        border: '2px solid #000',
                                        borderRadius: '50%',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontWeight: 'bold',
                                        fontSize: '24px'
                                    }}>
                                        S
                                    </div>
                                )}
                            </td>
                            <td style={{ textAlign: 'center', verticalAlign: 'middle', paddingLeft: '10px', paddingRight: '10px' }}>
                                <div style={{ fontSize: '18pt', fontWeight: 'bold', marginBottom: '3px' }}>
                                    {settings?.company_name || 'SABAMAS'}
                                </div>
                                <div style={{ fontSize: '11pt', marginBottom: '2px' }}>
                                    {settings?.app_description || 'Sistem Billing Sampah'}
                                </div>
                                <div style={{ fontSize: '10pt', width: '100%', lineHeight: '1.2' }}>
                                    Dukuh Ngumbul RT 02/RW 02 Desa Kemasan Kecamatan Sawit Kabupaten Boyolali 57374 Provinsi Jawa Tengah
                                </div>
                                <div style={{ fontSize: '10pt', marginTop: '2px' }}>
                                    Telp: +62 858 6771 4590
                                </div>
                            </td>
                            <td style={{ width: '80px' }}></td>
                        </tr>
                    </tbody>
                </table>
            </div>

            {/* Letter Number and Date */}
            <div style={{ marginBottom: '20px' }}>
                <table style={{ width: '100%', fontSize: '11pt' }}>
                    <tbody>
                        <tr>
                            <td style={{ width: '100px' }}>Nomor</td>
                            <td style={{ width: '10px' }}>:</td>
                            <td>{letterNumber}</td>
                        </tr>
                        <tr>
                            <td>Tanggal</td>
                            <td>:</td>
                            <td>{currentDate.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</td>
                        </tr>
                        <tr>
                            <td>Perihal</td>
                            <td>:</td>
                            <td style={{ fontWeight: 'bold' }}>Tagihan Iuran Sampah</td>
                        </tr>
                    </tbody>
                </table>
            </div>

            {/* Recipient */}
            <div style={{ marginBottom: '20px' }}>
                <div>Kepada Yth.</div>
                <div style={{ fontWeight: 'bold' }}>Bapak/Ibu {customer.nama}</div>
                <div>{customer.alamat}</div>
                <div>{customer.wilayah}</div>
            </div>

            {/* Letter Body */}
            <div style={{ marginBottom: '20px', textAlign: 'justify' }}>
                <p style={{ marginBottom: '10px' }}>Dengan hormat,</p>
                <p style={{ marginBottom: '10px', textIndent: '30px' }}>
                    Melalui surat ini kami sampaikan informasi mengenai tunggakan iuran sampah atas nama Bapak/Ibu.
                    Berdasarkan catatan kami, terdapat tunggakan pembayaran iuran sampah sebagai berikut:
                </p>
            </div>

            {/* Arrears Table */}
            <div style={{ marginBottom: '20px' }}>
                <table style={{
                    width: '100%',
                    borderCollapse: 'collapse',
                    fontSize: '11pt'
                }}>
                    <thead>
                        <tr style={{ backgroundColor: '#f0f0f0' }}>
                            <th style={{
                                border: '1px solid #000',
                                padding: '8px',
                                textAlign: 'left',
                                width: '50px'
                            }}>No</th>
                            <th style={{
                                border: '1px solid #000',
                                padding: '8px',
                                textAlign: 'left'
                            }}>Bulan Tagihan</th>
                            <th style={{
                                border: '1px solid #000',
                                padding: '8px',
                                textAlign: 'right',
                                width: '150px'
                            }}>Jumlah (Rp)</th>
                        </tr>
                    </thead>
                    <tbody>
                        {customer.arrears?.arrearMonths && customer.arrears.arrearMonths.length > 0 ? (
                            customer.arrears.arrearMonths.map((arrear, index) => (
                                <tr key={arrear.month}>
                                    <td style={{ border: '1px solid #000', padding: '6px', textAlign: 'center' }}>
                                        {index + 1}
                                    </td>
                                    <td style={{ border: '1px solid #000', padding: '6px' }}>
                                        {formatMonth(arrear.month)}
                                    </td>
                                    <td style={{ border: '1px solid #000', padding: '6px', textAlign: 'right' }}>
                                        {formatCurrency(arrear.amount)}
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={3} style={{ border: '1px solid #000', padding: '10px', textAlign: 'center', fontStyle: 'italic' }}>
                                    Tidak ada tunggakan
                                </td>
                            </tr>
                        )}
                    </tbody>
                    <tfoot>
                        <tr style={{ backgroundColor: '#e8e8e8', fontWeight: 'bold' }}>
                            <td colSpan={2} style={{ border: '1px solid #000', padding: '8px', textAlign: 'right' }}>
                                TOTAL TUNGGAKAN
                            </td>
                            <td style={{ border: '1px solid #000', padding: '8px', textAlign: 'right', fontSize: '13pt' }}>
                                {formatCurrency(customer.arrears?.totalArrears || 0)}
                            </td>
                        </tr>
                    </tfoot>
                </table>
            </div>

            {/* Payment Instructions */}
            <div style={{ marginBottom: '20px', textAlign: 'justify' }}>
                <p style={{ marginBottom: '10px', textIndent: '30px' }}>
                    Kami mohon kepada Bapak/Ibu untuk dapat melakukan pembayaran tunggakan tersebut.
                    Pembayaran dapat dilakukan melalui petugas kami atau dapat menghubungi kantor kami.
                </p>
                <p style={{ marginBottom: '10px', textIndent: '30px' }}>
                    Demikian surat ini kami sampaikan. Atas perhatian dan kerjasamanya, kami ucapkan terima kasih.
                </p>
            </div>

            {/* Signature */}
            <div style={{ marginTop: '40px' }}>
                <table style={{ width: '100%', fontSize: '11pt' }}>
                    <tbody>
                        <tr>
                            <td style={{ width: '50%' }}></td>
                            <td style={{ width: '50%', textAlign: 'center' }}>
                                <div style={{ marginBottom: '5px' }}>
                                    Hormat kami,
                                </div>
                                <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>
                                    {settings?.company_name || 'SABAMAS'}
                                </div>
                                <div style={{ marginTop: '60px', marginBottom: '5px' }}>
                                    <div style={{
                                        borderBottom: '1px solid #000',
                                        display: 'inline-block',
                                        minWidth: '200px',
                                        paddingBottom: '2px'
                                    }}>
                                        {settings?.signature_name || ''}
                                    </div>
                                </div>
                                <div style={{ fontSize: '10pt' }}>
                                    {settings?.signature_title || 'Petugas SABAMAS'}
                                </div>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>

            {/* Footer */}
            {settings?.letter_footer && (
                <div style={{
                    position: 'absolute',
                    bottom: '15mm',
                    left: '20mm',
                    right: '20mm',
                    textAlign: 'center',
                    fontSize: '9pt',
                    fontStyle: 'italic',
                    borderTop: '1px solid #ccc',
                    paddingTop: '10px'
                }}>
                    {settings.letter_footer}
                </div>
            )}
        </div>
    )
}
