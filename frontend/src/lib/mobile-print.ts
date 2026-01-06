import jsPDF from 'jspdf'
import 'jspdf-autotable'

// Extend jsPDF type locally to avoid missing type errors
interface jsPDFWithAutoTable extends jsPDF {
    autoTable: (options: any) => void
    lastAutoTable: { finalY: number }
}

export const generateReceiptPDF = (transaction: any) => {
    // Create PDF with width 58mm (standard thermal printer)
    // Height is auto-calculated based on content, initial estimate 100mm
    const doc = new jsPDF({
        unit: 'mm',
        format: [58, 210] // 58mm width, variable height (A4 height max for now)
    }) as jsPDFWithAutoTable

    const width = 58
    let yPos = 5

    // -- HEADER --
    doc.setFontSize(10)
    doc.setFont('helvetica', 'bold')
    doc.text('SABAMAS', width / 2, yPos, { align: 'center' })

    yPos += 4
    doc.setFontSize(7)
    doc.setFont('helvetica', 'normal')
    doc.text('Kemasan, Sawit, Boyolali', width / 2, yPos, { align: 'center' })

    yPos += 3
    doc.text('WA: 0812-3456-7890', width / 2, yPos, { align: 'center' })

    yPos += 3
    doc.setLineWidth(0.2)
    doc.line(2, yPos, width - 2, yPos)

    // -- INFO TRANSAKSI --
    yPos += 4
    doc.setFontSize(7)
    const date = new Date(transaction.tanggal_bayar || new Date()).toLocaleString('id-ID')

    doc.text(`Tgl: ${date}`, 2, yPos)
    yPos += 3
    doc.text(`Plg: ${transaction.customer?.nama || transaction.customer_nama || 'Guest'}`, 2, yPos)
    yPos += 3
    doc.text(`Kasir: Admin`, 2, yPos) // Static for now

    yPos += 3
    doc.line(2, yPos, width - 2, yPos)

    // -- ITEMS --
    yPos += 4

    // Handle Bulan Pembayaran
    if (transaction.bulan_dibayar && Array.isArray(transaction.bulan_dibayar)) {
        transaction.bulan_dibayar.forEach((bulan: string) => {
            doc.text(`Iuran ${formatBulan(bulan)}`, 2, yPos)
            // Check breakdown if available, else standard price
            const price = transaction.month_breakdown?.[bulan]?.amount || (transaction.jumlah_bayar / transaction.bulan_dibayar.length)
            doc.text(formatRupiah(price), width - 2, yPos, { align: 'right' })
            yPos += 3
        })
    }
    // Handle Rosok Items
    else if (transaction.items && Array.isArray(transaction.items)) {
        transaction.items.forEach((item: any) => {
            doc.text(`${item.name} (${item.weight}kg)`, 2, yPos)
            doc.text(formatRupiah(item.total), width - 2, yPos, { align: 'right' })
            yPos += 3
        })
    }

    yPos += 1
    doc.line(2, yPos, width - 2, yPos)

    // -- TOTAL --
    yPos += 4
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(8)
    doc.text('TOTAL', 2, yPos)
    doc.text(formatRupiah(transaction.jumlah_bayar || transaction.total), width - 2, yPos, { align: 'right' })

    // -- FOOTER --
    yPos += 8
    doc.setFont('helvetica', 'italic')
    doc.setFontSize(6)
    doc.text('Terima Kasih', width / 2, yPos, { align: 'center' })
    yPos += 3
    doc.text('Simpan struk ini sebagai bukti', width / 2, yPos, { align: 'center' })

    // Output
    // For mobile, better to open blob URL or save directly
    // 'dataurlnewwindow' opens in new tab for print
    const pdfOutput = doc.output('bloburl')
    window.open(pdfOutput, '_blank')
}

const formatBulan = (bulanStr: string) => {
    // 2025-01 -> Jan 2025
    const parts = bulanStr.split('-')
    if (parts.length !== 2) return bulanStr
    const date = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, 1)
    return date.toLocaleDateString('id-ID', { month: 'short', year: 'numeric' })
}

const formatRupiah = (num: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(num)
}
