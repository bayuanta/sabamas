'use client'

import AdminLayout from '@/components/AdminLayout'
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { tariffsApi } from '@/lib/api'
import { formatCurrency } from '@/lib/utils'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import Input from '@/components/ui/Input'
import Modal from '@/components/ui/Modal'
import { Plus, Edit, Trash2, Tag, AlertCircle, CheckCircle } from 'lucide-react'

export default function TariffsPage() {
  const queryClient = useQueryClient()
  const [modalOpen, setModalOpen] = useState(false)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<any>(null)
  const [categoryToDelete, setCategoryToDelete] = useState<any>(null)
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
      setModalOpen(false)
      resetForm()
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: any) => tariffsApi.updateCategory(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tariff-categories'] })
      setModalOpen(false)
      resetForm()
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => tariffsApi.deleteCategory(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tariff-categories'] })
      setDeleteModalOpen(false)
      setCategoryToDelete(null)
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

  const handleOpenModal = (category?: any) => {
    if (category) {
      setEditingCategory(category)
      setFormData({
        nama_kategori: category.nama_kategori,
        harga_per_bulan: category.harga_per_bulan.toString(),
        deskripsi: category.deskripsi || '',
      })
    } else {
      resetForm()
    }
    setModalOpen(true)
  }

  const handleSubmit = () => {
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

  const handleDeleteClick = (category: any) => {
    setCategoryToDelete(category)
    setDeleteModalOpen(true)
  }

  return (
    <AdminLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Manajemen Tarif</h1>
            <p className="text-gray-500 mt-1 text-lg">Kelola kategori dan harga layanan</p>
          </div>
          <Button
            onClick={() => handleOpenModal()}
            className="bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-500/30"
          >
            <Plus className="w-5 h-5 mr-2" />
            Tambah Kategori
          </Button>
        </div>

        {/* Categories Grid */}
        {isLoading ? (
          <div className="text-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-100 border-t-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-500 font-medium">Memuat data tarif...</p>
          </div>
        ) : categories && categories.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {categories.map((category: any) => (
              <div
                key={category.id}
                className="group bg-white rounded-xl p-4 shadow-md shadow-gray-200/50 border border-gray-100 hover:border-blue-300 transition-all duration-300 relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                  <Tag className="w-20 h-20 text-blue-600 transform rotate-12" />
                </div>

                <div className="relative z-10 flex flex-col h-full">
                  <div className="flex items-start justify-between mb-3">
                    <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center text-blue-600 group-hover:scale-105 transition-transform duration-300">
                      <Tag className="w-5 h-5" />
                    </div>
                    <div className="flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                      <button
                        onClick={() => handleOpenModal(category)}
                        className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteClick(category)}
                        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <h3 className="text-lg font-bold text-gray-900 mb-0.5">
                    {category.nama_kategori}
                  </h3>

                  <div className="mt-auto pt-3">
                    <p className="text-xs text-gray-500 mb-0.5">Harga Layanan</p>
                    <div className="flex items-baseline gap-1">
                      <span className="text-2xl font-bold text-blue-600 tracking-tight">
                        {formatCurrency(category.harga_per_bulan)}
                      </span>
                      <span className="text-xs text-gray-500 font-medium">/bulan</span>
                    </div>
                  </div>

                  {category.deskripsi && (
                    <div className="mt-3 pt-3 border-t border-gray-100">
                      <p className="text-xs text-gray-600 line-clamp-2">{category.deskripsi}</p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-gray-300">
            <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <Tag className="w-10 h-10 text-gray-300" />
            </div>
            <h3 className="text-lg font-bold text-gray-900">Belum ada kategori tarif</h3>
            <p className="text-gray-500 mt-2 mb-6">Mulai dengan menambahkan kategori tarif pertama Anda</p>
            <Button onClick={() => handleOpenModal()}>
              <Plus className="w-5 h-5 mr-2" />
              Tambah Kategori
            </Button>
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false)
          resetForm()
        }}
        title={editingCategory ? 'Edit Kategori Tarif' : 'Tambah Kategori Tarif'}
      >
        <div className="space-y-6">
          <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 flex items-start gap-3">
            <div className="mt-0.5">
              <CheckCircle className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-bold text-blue-900">Informasi Tarif</p>
              <p className="text-sm text-blue-700 mt-1">
                Pastikan harga yang dimasukkan sudah sesuai. Perubahan harga akan berlaku untuk tagihan bulan berikutnya.
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <Input
              id="category-name"
              name="nama_kategori"
              label="Nama Kategori"
              placeholder="Contoh: Rumah Tangga A"
              value={formData.nama_kategori}
              onChange={(e: any) => setFormData({ ...formData, nama_kategori: e.target.value })}
            />

            <Input
              id="monthly-price"
              name="harga_per_bulan"
              label="Harga per Bulan (Rp)"
              type="number"
              placeholder="Contoh: 15000"
              value={formData.harga_per_bulan}
              onChange={(e: any) => setFormData({ ...formData, harga_per_bulan: e.target.value })}
            />

            <div>
              <label htmlFor="category-description" className="block text-sm font-medium text-gray-700 mb-1">
                Deskripsi (Opsional)
              </label>
              <textarea
                id="category-description"
                name="deskripsi"
                className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all min-h-[100px]"
                placeholder="Tambahkan keterangan detail mengenai kategori ini..."
                value={formData.deskripsi}
                onChange={(e) => setFormData({ ...formData, deskripsi: e.target.value })}
              />
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-100">
            <Button
              variant="secondary"
              onClick={() => {
                setModalOpen(false)
                resetForm()
              }}
            >
              Batal
            </Button>
            <Button
              onClick={handleSubmit}
              isLoading={createMutation.isPending || updateMutation.isPending}
              disabled={!formData.nama_kategori || !formData.harga_per_bulan}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {editingCategory ? 'Simpan Perubahan' : 'Buat Kategori'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        title="Hapus Kategori"
      >
        {categoryToDelete && (
          <div className="text-center p-4">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-8 h-8 text-red-600" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">Hapus Kategori?</h3>
            <p className="text-gray-600 mb-6">
              Apakah Anda yakin ingin menghapus kategori <span className="font-bold text-gray-900">"{categoryToDelete.nama_kategori}"</span>?
              Tindakan ini tidak dapat dibatalkan.
            </p>

            <div className="flex justify-center space-x-3">
              <Button variant="secondary" onClick={() => setDeleteModalOpen(false)}>
                Batal
              </Button>
              <Button
                variant="danger"
                onClick={() => deleteMutation.mutate(categoryToDelete.id)}
                isLoading={deleteMutation.isPending}
              >
                Ya, Hapus
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </AdminLayout>
  )
}
