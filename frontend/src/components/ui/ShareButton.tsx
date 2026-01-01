import { useState } from 'react'
import Button from './Button'
import Modal from './Modal'
import Input from './Input'
import { Share2, MessageCircle, Copy, Check } from 'lucide-react'

interface ShareButtonProps {
  message: string
  title?: string
  defaultPhone?: string
}

export default function ShareButton({ message, title = 'Share', defaultPhone }: ShareButtonProps) {
  const [modalOpen, setModalOpen] = useState(false)
  const [phoneNumber, setPhoneNumber] = useState(defaultPhone || '')
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(message)
    } else {
      const textArea = document.createElement('textarea')
      textArea.value = message
      textArea.style.position = 'fixed'
      textArea.style.left = '-999999px'
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand('copy')
      textArea.remove()
    }
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleWhatsAppShare = () => {
    const encodedMessage = encodeURIComponent(message)
    const phone = phoneNumber.replace(/\D/g, '')
    const url = phone
      ? `https://wa.me/${phone}?text=${encodedMessage}`
      : `https://wa.me?text=${encodedMessage}`

    window.open(url, '_blank')
    setModalOpen(false)
  }

  return (
    <>
      <Button variant="secondary" onClick={() => setModalOpen(true)}>
        <Share2 className="w-5 h-5 mr-2" />
        {title}
      </Button>

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Share via WhatsApp"
      >
        <div className="space-y-4">
          <div className="bg-gray-50 p-4 rounded-lg max-h-64 overflow-y-auto">
            <pre className="text-sm whitespace-pre-wrap">{message}</pre>
          </div>

          <Input
            id="whatsapp-phone-number"
            name="whatsappPhoneNumber"
            label="Nomor WhatsApp (Opsional)"
            placeholder="08123456789"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
          />

          <div className="flex space-x-3">
            <Button
              variant="secondary"
              onClick={handleCopy}
              className="flex-1"
            >
              {copied ? (
                <>
                  <Check className="w-5 h-5 mr-2" />
                  Tersalin!
                </>
              ) : (
                <>
                  <Copy className="w-5 h-5 mr-2" />
                  Salin Pesan
                </>
              )}
            </Button>
            <Button
              onClick={handleWhatsAppShare}
              className="flex-1"
            >
              <MessageCircle className="w-5 h-5 mr-2" />
              Buka WhatsApp
            </Button>
          </div>
        </div>
      </Modal>
    </>
  )
}
