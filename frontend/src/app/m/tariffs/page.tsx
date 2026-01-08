'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { tariffsApi } from '@/lib/api'
import { formatCurrency } from '@/lib/utils'
import MobileHeader from '@/components/mobile/MobileHeader'
import { Plus, Edit, Trash2, Tag, ChevronLeft, ArrowLeft } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

export default function MobileTariffsPage() {
    const router = useRouter()
    const queryClient = useQueryClient()
    const [isEditMode, setIsEditMode] = useState(false)
    const [editingCategory, setEditingCategory] = useState<any>(null)

    // Modal state (managed locally for mobile simplicity)
    const [showForm, setShowForm] = useState(false)
    const [formData, setFormData] = useState({
        nama_kategori: '',
        harga_per_bulan: '',
        deskripsi: '',
    })

    const { data: categories, isLoading } = useQuery({
        queryKey: ['tariff-categories'],
        queryFn: async () => {
            const { data } = await tariffsApi.getCategories()
            return data
        },
    })

    const createMutation = useMutation({
        mutationFn: (data: any) => tariffsApi.createCategory(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['tariff-categories'] })
            setShowForm(false)
            resetForm()
        },
    })

    const updateMutation = useMutation({
        mutationFn: ({ id, data }: any) => tariffsApi.updateCategory(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['tariff-categories'] })
            setShowForm(false)
            resetForm()
        },
    })

    const deleteMutation = useMutation({
        mutationFn: (id: string) => tariffsApi.deleteCategory(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['tariff-categories'] })
        },
    })

    const resetForm = () => {
        setFormData({
            nama_kategori: '',
            harga_per_bulan: '',
            deskripsi: '',
        })
        setEditingCategory(null)
    }

    const handleEditClick = (category: any) => {
        setEditingCategory(category)
        setFormData({
            nama_kategori: category.nama_kategori,
            harga_per_bulan: category.harga_per_bulan.toString(),
            deskripsi: category.deskripsi || '',
        })
        setShowForm(true)
    }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        const data = {
            nama_kategori: formData.nama_kategori,
            harga_per_bulan: parseFloat(formData.harga_per_bulan),
            deskripsi: formData.deskripsi || undefined,
        }

        if (editingCategory) {
            updateMutation.mutate({ id: editingCategory.id, data })
        } else {
            createMutation.mutate(data)
        }
    }

    if (showForm) {
        return (
            <div className="min-h-screen bg-gray-50">
                {/* Form Header */}
                <div className="bg-white px-4 py-3 shadow-sm flex items-center gap-3 sticky top-0 z-10">
                    <button
                        onClick={() => setShowForm(false)}
                        className="p-2 -ml-2 hover:bg-gray-100 rounded-full"
                    >
                        <ArrowLeft className="w-6 h-6 text-gray-700" />
                    </button>
                    <h1 className="text-lg font-bold text-gray-900">
                        {editingCategory ? 'Edit Tarif' : 'Tambah Tarif'}
                    </h1>
                </div>

                <div className="p-4">
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="bg-white p-4 rounded-xl space-y-4 shadow-sm">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Nama Kategori</label>
                                <input
                                    type="text"
                                    required
                                    className="w-full px-4 py-3 rounded-lg bg-gray-50 border-transparent focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                                    placeholder="Contoh: Rumah Tangga A"
                                    value={formData.nama_kategori}
                                    onChange={(e) => setFormData({ ...formData, nama_kategori: e.target.value })}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Harga per Bulan</label>
                                <div className="relative">
                                    <span className="absolute left-4 top-3.5 text-gray-500 font-medium">Rp</span>
                                    <input
                                        type="number"
                                        required
                                        className="w-full pl-10 pr-4 py-3 rounded-lg bg-gray-50 border-transparent focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                                        placeholder="0"
                                        value={formData.harga_per_bulan}
                                        onChange={(e) => setFormData({ ...formData, harga_per_bulan: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Deskripsi (Opsional)</label>
                                <textarea
                                    className="w-full px-4 py-3 rounded-lg bg-gray-50 border-transparent focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all h-24 resize-none"
                                    placeholder="Tambahkan keterangan..."
                                    value={formData.deskripsi}
                                    onChange={(e) => setFormData({ ...formData, deskripsi: e.target.value })}
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={createMutation.isPending || updateMutation.isPending}
                            className="w-full bg-indigo-600 text-white font-bold py-4 rounded-xl shadow-lg shadow-indigo-200 active:scale-95 transition-all text-lg"
                        >
                            {createMutation.isPending || updateMutation.isPending ? 'Menyimpan...' : 'Simpan Tarif'}
                        </button>
                    </form>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gray-50 pb-20">
            <MobileHeader title="Daftar Tarif" />

            {/* Content */}
            <div className="p-4 space-y-4">
                {isLoading ? (
                    <div className="flex justify-center py-10">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                    </div>
                ) : categories?.length === 0 ? (
                    <div className="text-center py-20">
                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Tag className="w-8 h-8 text-gray-400" />
                        </div>
                        <h3 className="text-gray-900 font-bold">Belum ada Tarif</h3>
                        <p className="text-gray-500 text-sm mt-1">Tap tombol + untuk menambah</p>
                    </div>
                ) : (
                    <div className="grid gap-3">
                        {categories?.map((category: any) => (
                            <motion.div
                                key={category.id}
                                layoutId={category.id}
                                className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 relative overflow-hidden group"
                            >
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h3 className="font-bold text-gray-900 text-lg">{category.nama_kategori}</h3>
                                        {category.deskripsi && (
                                            <p className="text-sm text-gray-500 mt-1 line-clamp-1">{category.deskripsi}</p>
                                        )}
                                    </div>
                                    <div className="bg-indigo-50 px-3 py-1 rounded-lg">
                                        <span className="font-bold text-indigo-600 text-sm">
                                            {formatCurrency(category.harga_per_bulan)}
                                        </span>
                                        <span className="text-xs text-indigo-400 ml-1">/bln</span>
                                    </div>
                                </div>

                                {/* Quick Actions */}
                                <div className="mt-4 pt-3 border-t border-gray-50 flex gap-2 justify-end">
                                    <button
                                        onClick={() => handleEditClick(category)}
                                        className="flex items-center gap-1 text-sm font-medium text-gray-600 bg-gray-50 px-3 py-1.5 rounded-lg active:bg-gray-200"
                                    >
                                        <Edit className="w-4 h-4" />
                                        Edit
                                    </button>
                                    <button
                                        onClick={() => {
                                            if (confirm('Hapus tarif ini?')) {
                                                deleteMutation.mutate(category.id)
                                            }
                                        }}
                                        className="flex items-center gap-1 text-sm font-medium text-red-600 bg-red-50 px-3 py-1.5 rounded-lg active:bg-red-200"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                        Hapus
                                    </button>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>

            {/* FAB */}
            <motion.button
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                onClick={() => {
                    resetForm()
                    setShowForm(true)
                }}
                className="fixed bottom-6 right-6 w-14 h-14 bg-indigo-600 text-white rounded-full shadow-xl shadow-indigo-300 flex items-center justify-center z-40 active:scale-90 transition-transform"
            >
                <Plus className="w-7 h-7" />
            </motion.button>
        </div>
    )
}
