import { Printer, Share2, FileText, Download } from 'lucide-react'
import Button from '@/components/ui/Button'
import Modal from '@/components/ui/Modal'
import { formatCurrency, formatMonth } from '@/lib/utils'
import PaymentReceipt from '@/components/PaymentReceipt'
import { generateBillFilename, generatePDF } from '@/lib/pdf'
import ShareButton from '@/components/ui/ShareButton'
import { generatePaymentWhatsAppMessage } from '@/lib/whatsapp'

interface ReceiptModalProps {
  isOpen: boolean
  onClose: () => void
  payment: any
}

export default function ReceiptModal({ isOpen, onClose, payment }: ReceiptModalProps) {
  if (!payment) return null

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title="Cetak & Bagikan"
        size="sm"
      >
        <div className="space-y-4">
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="text-sm text-gray-600">Total Pembayaran</p>
            <p className="text-2xl font-bold text-primary">{formatCurrency(payment.jumlah_bayar)}</p>
            <p className="text-sm text-gray-500 mt-1">{payment.customer_nama}</p>
          </div>

          <div className="grid grid-cols-1 gap-3">
            <Button
              onClick={() => {
                const receipt = document.getElementById('payment-receipt');
                if (receipt) {
                  receipt.style.display = 'block';
                  setTimeout(() => {
                    window.print();
                    receipt.style.display = 'none';
                  }, 100);
                }
              }}
              variant="secondary"
              className="w-full justify-start"
            >
              <FileText className="w-5 h-5 mr-3" />
              Cetak A4
            </Button>

            <Button
              onClick={() => {
                const receipt = document.getElementById('payment-receipt-thermal');
                if (receipt) {
                  receipt.style.display = 'block';
                  setTimeout(() => {
                    window.print();
                    receipt.style.display = 'none';
                  }, 100);
                }
              }}
              variant="secondary"
              className="w-full justify-start"
            >
              <Printer className="w-5 h-5 mr-3" />
              Cetak Thermal
            </Button>

            <Button
              onClick={() => {
                const receipt = document.getElementById('payment-receipt-compact');
                if (receipt) {
                  receipt.style.display = 'block';
                  setTimeout(() => {
                    window.print();
                    receipt.style.display = 'none';
                  }, 100);
                }
              }}
              variant="secondary"
              className="w-full justify-start"
            >
              <Printer className="w-5 h-5 mr-3" />
              Hemat Kertas
            </Button>

            <Button
              onClick={async () => {
                const filename = generateBillFilename(payment.customer_nama || 'nota');
                await generatePDF('payment-receipt', filename);
              }}
              variant="secondary"
              className="w-full justify-start"
            >
              <Download className="w-5 h-5 mr-3" />
              Unduh PDF
            </Button>

            <div className="pt-2">
              <ShareButton
                message={generatePaymentWhatsAppMessage(payment)}
                title="Kirim via WhatsApp"
                defaultPhone={payment.customer?.nomor_telepon}
              />
            </div>
          </div>
        </div>
      </Modal>

      {/* Hidden Payment Receipts for Printing */}
      {payment && (
        <>
          <PaymentReceipt
            payment={payment}
            customer={payment.customer}
            isThermal={false}
          />
          <PaymentReceipt
            payment={payment}
            customer={payment.customer}
            isThermal={true}
          />
          <PaymentReceipt
            payment={payment}
            customer={payment.customer}
            isCompact={true}
          />
        </>
      )}
    </>
  )
}
