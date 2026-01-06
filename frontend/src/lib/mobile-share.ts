export const shareViaWhatsApp = (transaction: any, phoneNumber?: string) => {
    const date = new Date(transaction.tanggal_bayar || new Date()).toLocaleString('id-ID')
    const nama = transaction.customer?.nama || transaction.customer_nama || 'Pelanggan'
    const total = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(transaction.jumlah_bayar || transaction.total)

    let details = ''

    // Billing Details
    if (transaction.bulan_dibayar && Array.isArray(transaction.bulan_dibayar)) {
        const listBulan = transaction.bulan_dibayar.map((b: string) => formatBulan(b)).join(', ')
        details = `Pembayaran: Iuran Bulanan\nBulan: ${listBulan}`
    }
    // Rosok Details
    else if (transaction.items && Array.isArray(transaction.items)) {
        details = `Transaksi: Penjualan Rosok\nItems: ${transaction.items.map((i: any) => `${i.name} (${i.weight}kg)`).join(', ')}`
    }

    const message = `*BUKTI PEMBAYARAN - SABAMAS*
--------------------------------
Tanggal: ${date}
Pelanggan: ${nama}
--------------------------------
${details}

*TOTAL: ${total}*
--------------------------------
Terima kasih telah membayar iuran sampah.
Simpan pesan ini sebagai bukti sah.
`

    const encodedMessage = encodeURIComponent(message)

    // If phone number exists, direct chat. Else open Whatsapp menu.
    // Format phone number: Replace 08 -> 628
    let targetUrl = ''
    if (phoneNumber) {
        let cleanPhone = phoneNumber.replace(/\D/g, '')
        if (cleanPhone.startsWith('0')) cleanPhone = '62' + cleanPhone.substring(1)
        targetUrl = `https://wa.me/${cleanPhone}?text=${encodedMessage}`
    } else {
        targetUrl = `https://wa.me/?text=${encodedMessage}`
    }

    window.open(targetUrl, '_blank')
}

const formatBulan = (bulanStr: string) => {
    const parts = bulanStr.split('-')
    if (parts.length !== 2) return bulanStr
    const date = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, 1)
    return date.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })
}
