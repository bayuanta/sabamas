import { formatCurrency } from '@/lib/utils'

interface ArrearsReportPrintProps {
    data: any[]
    wilayah?: string
    totalCustomers: number
    totalArrears: number
}

export default function ArrearsReportPrint({ data, wilayah, totalCustomers, totalArrears }: ArrearsReportPrintProps) {
    const currentDate = new Date()

    return (
        <div id="arrears-report-print" style={{
            width: '210mm',
            minHeight: '297mm',
            margin: '0 auto',
            padding: '20mm',
            backgroundColor: 'white',
            color: 'black',
            fontFamily: 'sans-serif',
            fontSize: '10pt'
        }}>
            <style dangerouslySetInnerHTML={{
                __html: `
                @media print {
                    @page { size: A4 portrait; margin: 10mm; }
                    body * { visibility: hidden; }
                    #arrears-report-print, #arrears-report-print * { visibility: visible; }
                    #arrears-report-print {
                        position: absolute;
                        left: 0;
                        top: 0;
                        width: 100%;
                        margin: 0;
                        padding: 0;
                    }
                }
                `
            }} />

            {/* Header */}
            <div className="text-center mb-6 border-b-2 border-black pb-4">
                <h1 className="text-xl font-bold uppercase mb-2">Laporan Tunggakan Pelanggan</h1>
                <p className="text-sm">
                    Wilayah: <span className="font-semibold">{wilayah || 'Semua Wilayah'}</span>
                    <span className="mx-2">|</span>
                    Tanggal Cetak: <span className="font-semibold">{currentDate.toLocaleDateString('id-ID')}</span>
                </p>
            </div>

            {/* Summary */}
            <div className="flex justify-between mb-6 text-sm border p-4 rounded bg-gray-50 border-gray-200">
                <div>
                    <span className="text-gray-600">Total Pelanggan Menunggak:</span>
                    <br />
                    <span className="font-bold text-lg">{totalCustomers}</span>
                </div>
                <div className="text-right">
                    <span className="text-gray-600">Total Nilai Tunggakan:</span>
                    <br />
                    <span className="font-bold text-lg">{formatCurrency(totalArrears)}</span>
                </div>
            </div>

            {/* Table */}
            <table className="w-full border-collapse text-sm">
                <thead>
                    <tr className="bg-gray-100 border-b-2 border-black text-left">
                        <th className="p-2 border border-gray-300 text-center w-[5%]">No</th>
                        <th className="p-2 border border-gray-300 w-[30%]">Pelanggan</th>
                        <th className="p-2 border border-gray-300 w-[20%]">Wilayah</th>
                        <th className="p-2 border border-gray-300 text-center w-[15%]">Jml Bulan</th>
                        <th className="p-2 border border-gray-300 text-right w-[30%]">Total Tunggakan</th>
                    </tr>
                </thead>
                <tbody>
                    {data.map((item, index) => (
                        <tr key={item.customer.id} className="border-b border-gray-200">
                            <td className="p-2 border border-gray-300 text-center">{index + 1}</td>
                            <td className="p-2 border border-gray-300">
                                <div className="font-bold">{item.customer.nama}</div>
                                <div className="text-xs text-gray-500">{item.customer.alamat}</div>
                            </td>
                            <td className="p-2 border border-gray-300">{item.customer.wilayah}</td>
                            <td className="p-2 border border-gray-300 text-center">{item.arrears.totalMonths}</td>
                            <td className="p-2 border border-gray-300 text-right font-bold">
                                {formatCurrency(item.arrears.totalArrears)}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>

            {/* Footer */}
            <div className="mt-8 pt-8 border-t border-gray-300 flex justify-between text-xs text-gray-500">
                <div>
                    Dicetak dari Sistem Sabamas
                </div>
                <div>
                    Halaman 1
                </div>
            </div>
        </div>
    )
}
