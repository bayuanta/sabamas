'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { rosokApi } from '@/lib/api'
import { toast } from 'react-hot-toast'
import {
    Package,
    Construction,
    Wine,
    Cpu,
    Newspaper,
    Trash2,
    Save,
    ArrowLeft,
    Calculator,
    User,
    Calendar,
    FileText,
    ShoppingCart,
    MoreHorizontal
} from 'lucide-react'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import { format } from 'date-fns'
import { id } from 'date-fns/locale'

// Default/Common Items Configuration
const COMMON_ITEMS = [
    { id: 'kardus', name: 'Kardus', icon: Package, defaultPrice: 3500, color: 'bg-amber-100 text-amber-600', border: 'border-amber-200' },
    { id: 'besi', name: 'Besi', icon: Construction, defaultPrice: 8000, color: 'bg-slate-100 text-slate-600', border: 'border-slate-200' },
    { id: 'plastik', name: 'Plastik', icon: Wine, defaultPrice: 2500, color: 'bg-blue-100 text-blue-600', border: 'border-blue-200' },
    { id: 'tembaga', name: 'Tembaga', icon: Cpu, defaultPrice: 95000, color: 'bg-orange-100 text-orange-600', border: 'border-orange-200' },
    { id: 'kertas', name: 'Kertas', icon: Newspaper, defaultPrice: 2000, color: 'bg-stone-100 text-stone-600', border: 'border-stone-200' },
    { id: 'duplex', name: 'Duplex', icon: FileText, defaultPrice: 1500, color: 'bg-indigo-100 text-indigo-600', border: 'border-indigo-200' },
    { id: 'kaleng', name: 'Kaleng', icon: Package, defaultPrice: 4000, color: 'bg-red-100 text-red-600', border: 'border-red-200' },
    { id: 'botol', name: 'Botol', icon: Wine, defaultPrice: 1500, color: 'bg-emerald-100 text-emerald-600', border: 'border-emerald-200' },
]

export default function RosokPOS() {
    const router = useRouter()
    const queryClient = useQueryClient()

    // Transaction State
    const [date, setDate] = useState(new Date().toISOString().split('T')[0])
    const [buyer, setBuyer] = useState('')
    const [notes, setNotes] = useState('')
    const [cart, setCart] = useState<any[]>([])

    // Computed Totals
    const totalWeight = cart.reduce((acc, item) => acc + (parseFloat(item.weight) || 0), 0)
    const grandTotal = cart.reduce((acc, item) => acc + (parseFloat(item.total) || 0), 0)

    const addToCart = (itemConfig: any) => {
        // Add new item row
        setCart([...cart, {
            id: Date.now(),
            name: itemConfig.name,
            weight: '', // Start empty to force weigh input
            price: itemConfig.defaultPrice,
            total: 0,
            config: itemConfig
        }])
    }

    const updateItem = (id: number, field: string, value: any) => {
        setCart(cart.map(item => {
            if (item.id === id) {
                const updates: any = { [field]: value }

                // Auto calculate total
                if (field === 'weight' || field === 'price') {
                    const w = field === 'weight' ? parseFloat(value) : parseFloat(item.weight)
                    const p = field === 'price' ? parseFloat(value) : parseFloat(item.price)
                    updates.total = (isNaN(w) ? 0 : w) * (isNaN(p) ? 0 : p)
                }

                return { ...item, ...updates }
            }
            return item
        }))
    }

    const removeFromCart = (id: number) => {
        setCart(cart.filter(item => item.id !== id))
    }

    const mutation = useMutation({
        mutationFn: (data: any) => rosokApi.create(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['rosok-sales'] })
            toast.success('Transaksi berhasil disimpan')
            router.push('/rosok')
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Gagal menyimpan transaksi')
        }
    })

    const handleSubmit = () => {
        if (cart.length === 0) {
            toast.error('Keranjang masih kosong')
            return
        }

        const payload = {
            tanggal: date,
            pembeli: buyer,
            catatan: notes,
            items: cart.map(item => ({
                jenis_barang: item.name,
                berat: parseFloat(item.weight),
                harga_per_kg: parseFloat(item.price),
                total_harga: item.total
            })),
            total_harga: grandTotal
        }

        mutation.mutate(payload)
    }

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row h-screen overflow-hidden font-sans">
            {/* LEFT SIDE: ITEM GRID */}
            <div className="flex-1 flex flex-col overflow-hidden">
                {/* Header */}
                <div className="bg-white p-4 border-b border-gray-200 flex justify-between items-center shadow-sm z-10">
                    <div className="flex items-center gap-3">
                        <Button variant="ghost" size="sm" onClick={() => router.back()} className="text-gray-500 hover:bg-gray-100">
                            <ArrowLeft className="w-5 h-5" />
                        </Button>
                        <h1 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                            <div className="bg-blue-600 p-2 rounded-lg text-white">
                                <ShoppingCart className="w-5 h-5" />
                            </div>
                            Kasir Rosok
                        </h1>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                        <div className="hidden md:flex items-center gap-2 bg-gray-100 px-4 py-2 rounded-full font-medium">
                            <Calendar className="w-4 h-4 text-gray-400" />
                            {format(new Date(), 'dd MMMM yyyy', { locale: id })}
                        </div>
                    </div>
                </div>

                {/* Grid Content */}
                <div className="flex-1 overflow-y-auto p-4 md:p-8 bg-gray-50">
                    <div className="max-w-7xl mx-auto">
                        <div className="flex justify-between items-end mb-6">
                            <div>
                                <h2 className="text-lg font-bold text-gray-800">Pilih Jenis Barang</h2>
                                <p className="text-gray-500 text-sm mt-1">Klik barang untuk menambahkan ke transaksi</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                            {COMMON_ITEMS.map((item) => (
                                <button
                                    key={item.id}
                                    onClick={() => addToCart(item)}
                                    className={`
                                        relative group p-6 rounded-2xl border transition-all duration-200
                                        flex flex-col items-center justify-center gap-4 text-center
                                        bg-white hover:border-blue-500 hover:shadow-lg hover:-translate-y-1 active:scale-95
                                        shadow-sm ${item.border}
                                    `}
                                >
                                    <div className={`
                                        w-16 h-16 rounded-full flex items-center justify-center 
                                        transition-transform group-hover:scale-110 shadow-inner
                                        ${item.color} bg-opacity-20
                                    `}>
                                        <item.icon className={`w-8 h-8 ${item.color.split(' ')[1]}`} />
                                    </div>
                                    <div>
                                        <div className="font-bold text-gray-800 text-lg mb-1">{item.name}</div>
                                        <div className="inline-block px-3 py-1 rounded-full bg-gray-100 text-xs font-medium text-gray-600">
                                            Rp {item.defaultPrice.toLocaleString()}/kg
                                        </div>
                                    </div>
                                </button>
                            ))}

                            {/* Custom Item Button */}
                            <button
                                onClick={() => addToCart({ name: 'Lainnya', icon: Package, defaultPrice: 0, color: 'bg-gray-100 text-gray-500', border: 'border-dashed border-gray-300' })}
                                className="
                                        relative group p-6 rounded-2xl border-2 border-dashed border-gray-300 text-gray-400
                                        flex flex-col items-center justify-center gap-4 text-center bg-transparent
                                        hover:border-blue-400 hover:text-blue-500 hover:bg-blue-50 transition-all duration-200
                                    "
                            >
                                <div className="w-16 h-16 rounded-full bg-gray-50 shadow-inner flex items-center justify-center group-hover:bg-white group-hover:scale-110 transition-transform">
                                    <MoreHorizontal className="w-8 h-8" />
                                </div>
                                <div>
                                    <div className="font-bold text-lg mb-1">Lainnya</div>
                                    <div className="text-xs opacity-70">Input Manual</div>
                                </div>
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* RIGHT SIDE: BILLING/CART */}
            <div className="w-full md:w-[420px] lg:w-[480px] bg-white border-l border-gray-200 flex flex-col h-full shadow-2xl z-20">
                {/* Cart Header / Customer Info */}
                <div className="p-6 bg-gray-50/80 backdrop-blur-sm border-b border-gray-200 space-y-5">
                    <div className="flex justify-between items-center">
                        <h2 className="font-bold text-gray-800 text-lg">Detail Transaksi</h2>
                        <div className="bg-blue-100 text-blue-700 text-xs font-bold px-2 py-1 rounded uppercase">
                            Draft
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="grid grid-cols-3 gap-3">
                            <div className="col-span-1">
                                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5 block">Tanggal</label>
                                <input
                                    type="date"
                                    value={date}
                                    onChange={(e) => setDate(e.target.value)}
                                    className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-shadow font-medium text-gray-700"
                                />
                            </div>
                            <div className="col-span-2">
                                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5 block">Pembeli / Pengepul</label>
                                <div className="relative">
                                    <User className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                                    <input
                                        type="text"
                                        value={buyer}
                                        onChange={(e) => setBuyer(e.target.value)}
                                        placeholder="Nama pembeli..."
                                        className="w-full bg-white border border-gray-300 rounded-lg pl-9 pr-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-shadow font-medium"
                                    />
                                </div>
                            </div>
                        </div>
                        <div>
                            <input
                                type="text"
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                placeholder="Tambahkan catatan transaksi (opsional)..."
                                className="w-full bg-transparent border-b border-gray-300 px-1 py-2 text-sm focus:border-blue-500 outline-none transition-colors placeholder:text-gray-400"
                            />
                        </div>
                    </div>
                </div>

                {/* Cart Items */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50/30">
                    {cart.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-gray-400 opacity-60 p-8 text-center">
                            <div className="bg-gray-100 p-6 rounded-full mb-4">
                                <ShoppingCart className="w-12 h-12 text-gray-300" />
                            </div>
                            <h3 className="text-lg font-medium text-gray-600 mb-1">Keranjang Kosong</h3>
                            <p className="text-sm max-w-[200px]">Pilih barang dari daftar di sebelah kiri untuk memulai transaksi.</p>
                        </div>
                    ) : (
                        cart.map((item, index) => (
                            <div key={item.id} className="bg-white rounded-xl p-4 shadow-sm border border-gray-200 group hover:border-blue-400 hover:shadow-md transition-all animate-in slide-in-from-right-8 fade-in duration-300">
                                <div className="flex justify-between items-start mb-3">
                                    <div className="flex items-center gap-3">
                                        <div className={`p-2 rounded-lg ${item.config?.color?.split(' ')[0] || 'bg-gray-100'} bg-opacity-50`}>
                                            {item.config?.icon ? <item.config.icon className={`w-4 h-4 ${item.config.color?.split(' ')[1] || 'text-gray-500'}`} /> : <Package className="w-4 h-4" />}
                                        </div>
                                        {item.name === 'Lainnya' ? (
                                            <input
                                                type="text"
                                                className="font-bold text-gray-800 border-b-2 border-gray-200 focus:border-blue-500 outline-none w-32 py-0.5"
                                                placeholder="Nama Barang"
                                                autoFocus
                                                onBlur={(e) => updateItem(item.id, 'name', e.target.value)}
                                            />
                                        ) : (
                                            <span className="font-bold text-gray-800 text-base">{item.name}</span>
                                        )}
                                    </div>
                                    <button
                                        onClick={() => removeFromCart(item.id)}
                                        className="text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg p-1.5 transition-all opacity-0 group-hover:opacity-100"
                                        title="Hapus Item"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>

                                <div className="flex items-end gap-3">
                                    <div className="flex-1">
                                        <label className="text-[10px] uppercase font-bold text-gray-400 mb-1 block">Berat (kg)</label>
                                        <div className="relative">
                                            <input
                                                type="number"
                                                step="0.01"
                                                value={item.weight}
                                                onChange={(e) => updateItem(item.id, 'weight', e.target.value)}
                                                placeholder="0.00"
                                                autoFocus={item.name !== 'Lainnya'}
                                                className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-lg font-bold text-gray-800 focus:bg-white focus:border-blue-500 outline-none focus:ring-2 focus:ring-blue-100 transition-all"
                                            />
                                            <span className="absolute right-3 top-2.5 text-xs font-bold text-gray-400 pointer-events-none">KG</span>
                                        </div>
                                    </div>
                                    <div className="flex-1">
                                        <label className="text-[10px] uppercase font-bold text-gray-400 mb-1 block">Harga/kg</label>
                                        <div className="relative">
                                            <span className="absolute left-3 top-2.5 text-xs font-bold text-gray-400 pointer-events-none">Rp</span>
                                            <input
                                                type="number"
                                                value={item.price}
                                                onChange={(e) => updateItem(item.id, 'price', e.target.value)}
                                                className="w-full bg-gray-50 border border-gray-200 rounded-lg pl-8 pr-3 py-2 text-base font-medium text-gray-700 focus:bg-white focus:border-blue-500 outline-none focus:ring-2 focus:ring-blue-100 transition-all"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-3 pt-3 border-t border-dashed border-gray-100 flex justify-between items-center">
                                    <span className="text-xs text-gray-400">Subtotal</span>
                                    <span className="font-bold text-blue-600 text-lg">
                                        Rp {(item.total || 0).toLocaleString()}
                                    </span>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Footer Totals & Action */}
                <div className="bg-white border-t border-gray-200 p-6 shadow-[0_-10px_40px_rgba(0,0,0,0.05)] z-30">
                    <div className="space-y-3 mb-6">
                        <div className="flex justify-between items-center text-sm">
                            <span className="text-gray-500 font-medium">Total Item</span>
                            <span className="font-bold text-gray-800">{cart.length} barang</span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                            <span className="text-gray-500 font-medium">Total Berat</span>
                            <span className="font-bold text-gray-800">{totalWeight.toLocaleString()} kg</span>
                        </div>
                        <div className="h-px bg-gray-100 my-2"></div>
                        <div className="flex justify-between items-center">
                            <span className="text-lg font-bold text-gray-800">Total Bayar</span>
                            <span className="text-3xl font-extrabold text-blue-600 tracking-tight">Rp {grandTotal.toLocaleString()}</span>
                        </div>
                    </div>

                    <div className="grid grid-cols-4 gap-3">
                        <Button
                            variant="outline"
                            className="col-span-1 h-14 border-red-200 text-red-500 hover:bg-red-50 hover:text-red-700 hover:border-red-300"
                            onClick={() => {
                                if (confirm('Kosongkan keranjang?')) setCart([])
                            }}
                            title="Reset Transaksi"
                        >
                            <Trash2 className="w-5 h-5" />
                        </Button>
                        <Button
                            size="lg"
                            className="col-span-3 h-14 text-lg font-bold shadow-lg shadow-blue-500/30 hover:shadow-blue-600/40 hover:-translate-y-0.5 transition-all bg-gradient-to-r from-blue-600 to-blue-700"
                            onClick={handleSubmit}
                            isLoading={mutation.isPending}
                            disabled={cart.length === 0}
                        >
                            <Save className="w-5 h-5 mr-2" />
                            Proses Transaksi
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    )
}
