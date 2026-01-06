'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import MobileHeader from '@/components/mobile/MobileHeader'
import { formatCurrency } from '@/lib/utils'
import { Search, Scale, Plus, Trash2, Save, ShoppingCart, Package } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

// Dummy Data Items Rosok (Should be from API)
const ROSOK_ITEMS = [
    { id: '1', name: 'Kardus', price: 2000, unit: 'kg' },
    { id: '2', name: 'Plastik Gelas', price: 3000, unit: 'kg' },
    { id: '3', name: 'Plastik Botol', price: 2500, unit: 'kg' },
    { id: '4', name: 'Besi', price: 5000, unit: 'kg' },
    { id: '5', name: 'Alumunium', price: 12000, unit: 'kg' },
    { id: '6', name: 'Tembaga', price: 80000, unit: 'kg' },
]

interface CartItem {
    itemId: string
    name: string
    price: number
    weight: number
    total: number
}

export default function MobileRosok() {
    const router = useRouter()
    const [cart, setCart] = useState<CartItem[]>([])
    const [isSelectingItem, setIsSelectingItem] = useState(false)
    const [customerName, setCustomerName] = useState('')

    // Add Item Flow
    const addItem = (item: typeof ROSOK_ITEMS[0], weight: number) => {
        const newItem: CartItem = {
            itemId: item.id,
            name: item.name,
            price: item.price,
            weight: weight,
            total: item.price * weight
        }
        setCart([...cart, newItem])
        setIsSelectingItem(false)
    }

    // Remove Item
    const removeItem = (index: number) => {
        const newCart = [...cart]
        newCart.splice(index, 1)
        setCart(newCart)
    }

    const totalAmount = cart.reduce((sum, item) => sum + item.total, 0)
    const totalWeight = cart.reduce((sum, item) => sum + item.weight, 0)

    // ... imports
    import { generateReceiptPDF } from '@/lib/mobile-print'
    import { shareViaWhatsApp } from '@/lib/mobile-share'

    // ... inside component
    const handleSave = () => {
        if (cart.length === 0) return

        // Create dummy transaction object
        const transaction = {
            tanggal_bayar: new Date().toISOString(),
            customer_nama: customerName || 'Pelanggan Umum',
            items: cart,
            jumlah_bayar: totalAmount
        }

        // Generate PDF directly
        generateReceiptPDF(transaction)

        // Reset cart
        if (confirm('Transaksi berhasil dicetak! Hapus keranjang?')) {
            setCart([])
            setCustomerName('')
            router.push('/m')
        }
    }

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            <MobileHeader title="Penjualan Rosok" showBack />

            <div className="flex-1 overflow-y-auto pb-32 p-4">
                {/* Customer Input */}
                <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm mb-4">
                    <label className="text-xs font-bold text-gray-500 uppercase mb-2 block">Nama Penjual / Pelanggan</label>
                    <input
                        type="text"
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        placeholder="Misal: Pak Budi..."
                        className="w-full text-lg font-semibold outline-none border-b border-gray-200 pb-2 focus:border-indigo-600 transition-colors"
                    />
                </div>

                {/* Cart List */}
                <div className="space-y-3 mb-4">
                    {cart.map((item, index) => (
                        <motion.div
                            key={`${item.itemId}-${index}`}
                            layout
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex justify-between items-center"
                        >
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center text-orange-600 font-bold">
                                    {item.name.charAt(0)}
                                </div>
                                <div>
                                    <p className="font-bold text-gray-900">{item.name}</p>
                                    <p className="text-sm text-gray-500">
                                        {item.weight} kg x {formatCurrency(item.price)}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <span className="font-bold text-gray-900">{formatCurrency(item.total)}</span>
                                <button onPress={() => removeItem(index)} className="text-red-400 p-1">
                                    <Trash2 className="w-5 h-5" />
                                </button>
                            </div>
                        </motion.div>
                    ))}

                    {/* Add Item Button */}
                    <button
                        onClick={() => setIsSelectingItem(true)}
                        className="w-full py-4 border-2 border-dashed border-indigo-200 rounded-xl flex items-center justify-center text-indigo-600 font-bold bg-indigo-50/50 hover:bg-indigo-50 transition-colors"
                    >
                        <Plus className="w-5 h-5 mr-2" />
                        Tambah Barang
                    </button>
                </div>
            </div>

            {/* Bottom Bar */}
            <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 safe-area-bottom shadow-[0_-5px_15px_rgba(0,0,0,0.05)]">
                <div className="flex justify-between items-center mb-4">
                    <div>
                        <p className="text-sm text-gray-500">Total {totalWeight} kg</p>
                        <p className="text-2xl font-bold text-gray-900">{formatCurrency(totalAmount)}</p>
                    </div>
                </div>
                <button
                    onClick={handleSave}
                    disabled={cart.length === 0}
                    className="w-full bg-gray-900 text-white font-bold py-4 rounded-xl shadow-lg flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <Save className="w-5 h-5 mr-2" />
                    Simpan Transaksi
                </button>
            </div>

            {/* Item Selector Modal */}
            <AnimatePresence>
                {isSelectingItem && (
                    <ItemSelector
                        onClose={() => setIsSelectingItem(false)}
                        onSelect={addItem}
                    />
                )}
            </AnimatePresence>
        </div>
    )
}

function ItemSelector({ onClose, onSelect }: { onClose: () => void, onSelect: (item: any, weight: number) => void }) {
    const [selectedItem, setSelectedItem] = useState<any>(null)
    const [weight, setWeight] = useState('')

    const handleConfirm = () => {
        if (!selectedItem || !weight) return
        onSelect(selectedItem, parseFloat(weight))
    }

    return (
        <div className="fixed inset-0 z-50 bg-black/50 flex flex-col justify-end">
            <motion.div
                initial={{ y: '100%' }}
                animate={{ y: 0 }}
                exit={{ y: '100%' }}
                className="bg-white rounded-t-3xl p-6 min-h-[70vh] flex flex-col"
            >
                <div className="w-12 h-1.5 bg-gray-200 rounded-full mx-auto mb-6" />

                <h3 className="text-xl font-bold mb-6">Pilih Barang</h3>

                {!selectedItem ? (
                    <div className="grid grid-cols-2 gap-3 overflow-y-auto">
                        {ROSOK_ITEMS.map((item) => (
                            <button
                                key={item.id}
                                onClick={() => setSelectedItem(item)}
                                className="p-4 border border-gray-200 rounded-xl text-left hover:border-indigo-500 hover:bg-indigo-50 transition-colors"
                            >
                                <p className="font-bold text-gray-900">{item.name}</p>
                                <p className="text-sm text-gray-500">{formatCurrency(item.price)} / {item.unit}</p>
                            </button>
                        ))}
                    </div>
                ) : (
                    <div className="flex-1 flex flex-col">
                        <div className="flex items-center gap-4 mb-6">
                            <button onClick={() => setSelectedItem(null)} className="text-gray-400">Kembali</button>
                            <h4 className="font-bold text-lg">{selectedItem.name}</h4>
                        </div>

                        <div className="bg-gray-50 rounded-2xl p-6 mb-6">
                            <div className="flex justify-between items-end mb-2">
                                <span className="text-gray-500 font-bold">BERAT</span>
                                <span className="text-indigo-600 font-bold">{selectedItem.unit}</span>
                            </div>
                            <input
                                type="number"
                                autoFocus
                                value={weight}
                                onChange={(e) => setWeight(e.target.value)}
                                placeholder="0.0"
                                className="w-full bg-transparent text-5xl font-bold text-gray-900 outline-none placeholder:text-gray-300"
                            />
                        </div>

                        <button
                            onClick={handleConfirm}
                            disabled={!weight}
                            className="mt-auto w-full bg-indigo-600 text-white font-bold py-4 rounded-xl disabled:opacity-50"
                        >
                            Tambahkan
                        </button>
                    </div>
                )}
            </motion.div>
        </div>
    )
}
