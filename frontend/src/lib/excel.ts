import ExcelJS from 'exceljs'
import { saveAs } from 'file-saver'
import { formatDateTime, formatMonth } from './utils'

export const generateExcelReport = async (data: any[], dateFrom?: string, dateTo?: string) => {
    const workbook = new ExcelJS.Workbook()
    const worksheet = workbook.addWorksheet('Laporan Transaksi')

    // Set column widths
    worksheet.columns = [
        { header: 'No', key: 'no', width: 5 },
        { header: 'Tanggal', key: 'tanggal', width: 20 },
        { header: 'Pelanggan', key: 'pelanggan', width: 30 },
        { header: 'Wilayah', key: 'wilayah', width: 20 },
        { header: 'Bulan Tagihan', key: 'bulan', width: 30 },
        { header: 'Metode', key: 'metode', width: 15 },
        { header: 'Status', key: 'status', width: 15 },
        { header: 'Jumlah (Rp)', key: 'jumlah', width: 20 },
    ]

    // Add Title
    worksheet.mergeCells('A1:H1')
    const titleCell = worksheet.getCell('A1')
    titleCell.value = 'LAPORAN TRANSAKSI SABAMAS'
    titleCell.font = { name: 'Arial', size: 16, bold: true }
    titleCell.alignment = { vertical: 'middle', horizontal: 'center' }

    // Add Period
    worksheet.mergeCells('A2:H2')
    const periodCell = worksheet.getCell('A2')
    const periodStr = `${dateFrom ? new Date(dateFrom).toLocaleDateString('id-ID') : 'Awal'} s/d ${dateTo ? new Date(dateTo).toLocaleDateString('id-ID') : 'Sekarang'}`
    periodCell.value = `Periode: ${periodStr}`
    periodCell.font = { name: 'Arial', size: 12, italic: true }
    periodCell.alignment = { vertical: 'middle', horizontal: 'center' }

    // Add Empty Row
    worksheet.addRow([])

    // Style Header Row
    const headerRow = worksheet.getRow(4)
    headerRow.values = ['No', 'Tanggal', 'Pelanggan', 'Wilayah', 'Bulan Tagihan', 'Metode', 'Status', 'Jumlah (Rp)']
    headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } }
    headerRow.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF2F855A' } // Emerald green
    }
    headerRow.alignment = { vertical: 'middle', horizontal: 'center' }
    headerRow.height = 25

    // Add Data
    let totalAmount = 0
    data.forEach((item, index) => {
        const months = Array.isArray(item.bulan_dibayar)
            ? item.bulan_dibayar.map((m: string) => formatMonth(m)).join(', ')
            : '-'

        totalAmount += item.jumlah_bayar

        const row = worksheet.addRow({
            no: index + 1,
            tanggal: formatDateTime(item.tanggal_bayar),
            pelanggan: item.customer_nama,
            wilayah: item.customer?.wilayah || '-',
            bulan: months,
            metode: item.metode_bayar,
            status: item.is_deposited ? 'Disetor' : 'Belum Disetor',
            jumlah: item.jumlah_bayar
        })

        // Alignments
        row.getCell('no').alignment = { horizontal: 'center' }
        row.getCell('tanggal').alignment = { horizontal: 'center' }
        row.getCell('metode').alignment = { horizontal: 'center' }
        row.getCell('status').alignment = { horizontal: 'center' }
        row.getCell('jumlah').numFmt = '#,##0'
    })

    // Add Total Row
    const totalRow = worksheet.addRow(['', '', '', '', '', '', 'TOTAL PEMASUKAN', totalAmount])
    totalRow.font = { bold: true }
    totalRow.getCell(7).alignment = { horizontal: 'right' }
    totalRow.getCell(8).numFmt = '#,##0'
    totalRow.getCell(8).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFEDF2F7' } // Gray 100
    }

    // Add Borders to all cells
    worksheet.eachRow((row: ExcelJS.Row, rowNumber: number) => {
        if (rowNumber >= 4) {
            row.eachCell((cell: ExcelJS.Cell) => {
                cell.border = {
                    top: { style: 'thin' },
                    left: { style: 'thin' },
                    bottom: { style: 'thin' },
                    right: { style: 'thin' }
                }
            })
        }
    })

    // Generate File
    const buffer = await workbook.xlsx.writeBuffer()
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
    saveAs(blob, `Laporan_Transaksi_SABAMAS_${new Date().toISOString().split('T')[0]}.xlsx`)
}
