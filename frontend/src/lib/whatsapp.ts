import { formatCurrency, formatDateTime, formatMonth } from './utils'

interface PaymentData {
  customer_nama: string
  tanggal_bayar: string
  bulan_dibayar: string[]
  jumlah_bayar: number
  metode_bayar: string
  catatan?: string
  id: string
}

export function generatePaymentWhatsAppMessage(payment: PaymentData | null): string {
  if (!payment) return ''
  const message = `
*BUKTI PEMBAYARAN SABAMAS*
━━━━━━━━━━━━━━━━━━━

*Pelanggan:* ${payment.customer_nama}
*Tanggal:* ${formatDateTime(payment.tanggal_bayar)}
*No. Transaksi:* ${payment.id.substring(0, 13).toUpperCase()}

━━━━━━━━━━━━━━━━━━━
*RINCIAN PEMBAYARAN*

${payment.bulan_dibayar.map((month, index) => `${index + 1}. ${formatMonth(month)}`).join('\n')}

━━━━━━━━━━━━━━━━━━━
*Total Bulan:* ${payment.bulan_dibayar.length}
*Metode:* ${payment.metode_bayar.toUpperCase()}
*TOTAL BAYAR:* ${formatCurrency(payment.jumlah_bayar)}

${payment.catatan ? `*Catatan:* ${payment.catatan}\n` : ''}
━━━━━━━━━━━━━━━━━━━

Terima kasih atas pembayaran Anda! 🙏

_SABAMAS - Sistem Billing Sampah_
  `.trim()

  return message
}

export function generateArrearsWhatsAppMessage(customer: {
  nama: string
  alamat: string
  wilayah: string
  tunggakan: number
  bulan_tunggakan: number
  arrears?: {
    arrearMonths: Array<{
      month: string
      amount: number
      source: string
    }>
    totalArrears?: number
    totalMonths?: number
  }
}): string {
  const totalMonths = customer.arrears?.totalMonths ?? customer.bulan_tunggakan ?? 0
  const totalArrears = customer.arrears?.totalArrears ?? customer.tunggakan ?? 0
  const message = `
*INFORMASI TUNGGAKAN*
━━━━━━━━━━━━━━━━━━

*Pelanggan:* ${customer.nama}
*Alamat:* ${customer.alamat}
*Wilayah:* ${customer.wilayah}

━━━━━━━━━━━━━━━━━━
*RINCIAN TUNGGAKAN*

${customer.arrears?.arrearMonths?.map((arrear, index) =>
    `${index + 1}. ${formatMonth(arrear.month)} - ${formatCurrency(arrear.amount)}`
  ).join('\n') || 'Tidak ada tunggakan'}

━━━━━━━━━━━━━━━━━━
*Total Bulan:* ${totalMonths} bulan
*TOTAL TUNGGAKAN:* ${formatCurrency(totalArrears)}

Mohon segera lakukan pembayaran. 🙏

_SABAMAS - Sistem Billing Sampah_`.trim()

  return message
}

export function shareViaWhatsApp(message: string, phoneNumber?: string) {
  const encodedMessage = encodeURIComponent(message)
  const baseUrl = 'https://wa.me'

  // If phone number is provided, send to specific number
  // Otherwise, open WhatsApp with message ready to share
  const url = phoneNumber
    ? `${baseUrl}/${phoneNumber.replace(/\D/g, '')}?text=${encodedMessage}`
    : `${baseUrl}?text=${encodedMessage}`

  // Open WhatsApp in new tab
  window.open(url, '_blank')
}

export function copyToClipboard(text: string): Promise<boolean> {
  if (navigator.clipboard && window.isSecureContext) {
    return navigator.clipboard.writeText(text)
      .then(() => true)
      .catch(() => false)
  } else {
    // Fallback for older browsers
    const textArea = document.createElement('textarea')
    textArea.value = text
    textArea.style.position = 'fixed'
    textArea.style.left = '-999999px'
    document.body.appendChild(textArea)
    textArea.select()
    try {
      document.execCommand('copy')
      textArea.remove()
      return Promise.resolve(true)
    } catch (error) {
      textArea.remove()
      return Promise.resolve(false)
    }
  }
}
