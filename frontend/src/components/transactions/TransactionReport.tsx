import { formatCurrency, formatDateTime, formatMonth } from '@/lib/utils'

interface TransactionReportProps {
    data: any[]
    dateFrom?: string
    dateTo?: string
    totalAmount: number
}

export default function TransactionReport({ data, dateFrom, dateTo, totalAmount }: TransactionReportProps) {
    return (
        <div id="transaction-report" className="bg-white text-black p-4 font-sans" style={{ width: '210mm', minHeight: '297mm', margin: '0 auto' }}>
            <style dangerouslySetInnerHTML={{
                __html: `
        @media print {
          @page { size: A4 portrait; margin: 10mm; }
          body * { visibility: hidden; }
          #transaction-report, #transaction-report * { visibility: visible; }
          #transaction-report { 
            position: absolute; 
            left: 0; 
            top: 0; 
            width: 100%; 
            margin: 0; 
            padding: 8px;
            font-size: 9pt;
          }
          #transaction-report table {
            font-size: 8pt;
            page-break-inside: auto;
          }
          #transaction-report tr {
            page-break-inside: avoid;
            page-break-after: auto;
          }
          #transaction-report td, #transaction-report th {
            padding: 3px !important;
            word-break: break-word;
          }
        }
      `}} />

            <div className="text-center mb-4 border-b-2 border-gray-800 pb-2">
                <h1 className="text-xl font-bold uppercase mb-1 tracking-wide">Laporan Transaksi SABAMAS</h1>
                <p className="text-xs text-gray-600">
                    Periode: <span className="font-semibold">{dateFrom ? new Date(dateFrom).toLocaleDateString('id-ID') : 'Awal'}</span> s/d <span className="font-semibold">{dateTo ? new Date(dateTo).toLocaleDateString('id-ID') : 'Sekarang'}</span>
                </p>
            </div>

            <table className="w-full border-collapse border border-gray-800" style={{ fontSize: '9pt' }}>
                <thead>
                    <tr className="bg-gray-100">
                        <th className="border border-gray-800 p-1 text-center" style={{ width: '5%' }}>No</th>
                        <th className="border border-gray-800 p-1 text-center" style={{ width: '15%' }}>Tanggal</th>
                        <th className="border border-gray-800 p-1 text-left" style={{ width: '15%' }}>Pelanggan</th>
                        <th className="border border-gray-800 p-1 text-left" style={{ width: '35%' }}>Tagihan</th>
                        <th className="border border-gray-800 p-1 text-center" style={{ width: '10%' }}>Metode</th>
                        <th className="border border-gray-800 p-1 text-right" style={{ width: '20%' }}>Jumlah</th>
                    </tr>
                </thead>
                <tbody>
                    {data.map((item, index) => (
                        <tr key={item.id}>
                            <td className="border border-gray-800 p-1 text-center">{index + 1}</td>
                            <td className="border border-gray-800 p-1 text-xs">{formatDateTime(item.tanggal_bayar)}</td>
                            <td className="border border-gray-800 p-1">
                                <div className="font-semibold text-xs leading-tight">{item.customer_nama}</div>
                                <div className="text-[8px] text-gray-500 leading-tight">{item.customer?.wilayah}</div>
                            </td>
                            <td className="border border-gray-800 p-1 text-xs leading-tight" style={{ wordBreak: 'break-word' }}>
                                {Array.isArray(item.bulan_dibayar)
                                    ? item.bulan_dibayar.map((m: string) => formatMonth(m)).join(', ')
                                    : '-'}
                            </td>
                            <td className="border border-gray-800 p-1 capitalize text-center text-xs">{item.metode_bayar}</td>
                            <td className="border border-gray-800 p-1 text-right font-mono text-xs">{formatCurrency(item.jumlah_bayar)}</td>
                        </tr>
                    ))}
                </tbody>
                <tfoot>
                    <tr className="font-bold bg-gray-100">
                        <td colSpan={5} className="border border-gray-800 p-1 text-right uppercase text-xs">Total Pemasukan</td>
                        <td className="border border-gray-800 p-1 text-right font-mono text-sm">{formatCurrency(totalAmount)}</td>
                    </tr>
                </tfoot>
            </table>

            <div className="mt-8 flex justify-between text-xs text-gray-600">
                <div>
                    <p>Dicetak oleh: Admin</p>
                    <p>Waktu cetak: {new Date().toLocaleString('id-ID')}</p>
                </div>
                <div className="text-right">
                    <p className="mb-8">Mengetahui,</p>
                    <p>( .................................... )</p>
                </div>
            </div>
        </div>
    )
}
