'use client'

import AdminLayout from '@/components/AdminLayout'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { customersApi, tariffsApi } from '@/lib/api'
import { useRouter } from 'next/navigation'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import Input from '@/components/ui/Input'
import { ArrowLeft } from 'lucide-react'
import { useState } from 'react'

export default function NewCustomerPage() {
  const router = useRouter()
  const queryClient = useQueryClient()

  const [formData, setFormData] = useState({
    nomor_pelanggan: '',
    nama: '',
    alamat: '',
    wilayah: '',
    nomor_telepon: '',
    tarif_id: '',
    status: 'aktif',
    tanggal_bergabung: new Date().toISOString().split('T')[0],
  })

  const [errors, setErrors] = useState<any>({})

  // Fetch tariff categories
  const { data: tariffsData } = useQuery({
    queryKey: ['tariff-categories'],
    queryFn: async () => {
      const { data } = await tariffsApi.getCategories()
      return data
    },
  })

  // Fetch wilayah list
  const { data: wilayahData } = useQuery({
    queryKey: ['wilayah-list'],
    queryFn: async () => {
      const { data } = await customersApi.getWilayahList()
      return data
    },
  })

  const createMutation = useMutation({
    mutationFn: (data: any) => customersApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] })
      router.push('/customers')
    },
    onError: (error: any) => {
      const errMsg = error.response?.data?.message || 'Terjadi kesalahan'
      if (typeof errMsg === 'object') {
        setErrors(errMsg)
      } else {
        alert(errMsg)
      }
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setErrors({})

    // Validation
    const newErrors: any = {}
    if (!formData.nomor_pelanggan.trim()) newErrors.nomor_pelanggan = 'Nomor pelanggan harus diisi'
    if (!formData.nama.trim()) newErrors.nama = 'Nama harus diisi'
    if (!formData.alamat.trim()) newErrors.alamat = 'Alamat harus diisi'
    if (!formData.wilayah.trim()) newErrors.wilayah = 'Wilayah harus diisi'
    if (!formData.tarif_id) newErrors.tarif_id = 'Tarif harus dipilih'

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    createMutation.mutate(formData)
  }

  const handleChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors((prev: any) => ({ ...prev, [field]: '' }))
    }
  }

  return (
    <AdminLayout>
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center space-x-4">
          <Button variant="ghost" onClick={() => router.push('/customers')}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Tambah Pelanggan Baru</h1>
            <p className="text-gray-600">Lengkapi formulir di bawah ini</p>
          </div>
        </div>

        {/* Form */}
        <Card>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Nomor Pelanggan */}
            <div>
              <label htmlFor="nomor_pelanggan" className="block text-sm font-medium text-gray-700 mb-2">
                Nomor Pelanggan <span className="text-red-500">*</span>
              </label>
              <Input
                id="nomor_pelanggan"
                name="nomor_pelanggan"
                type="text"
                value={formData.nomor_pelanggan}
                onChange={(e) => handleChange('nomor_pelanggan', e.target.value)}
                placeholder="Contoh: PLG0012"
                error={errors.nomor_pelanggan}
              />
              {errors.nomor_pelanggan && (
                <p className="mt-1 text-sm text-red-600">{errors.nomor_pelanggan}</p>
              )}
              <p className="mt-1 text-xs text-gray-500">
                Nomor pelanggan akan digunakan untuk login portal pelanggan
              </p>
            </div>

            {/* Nama */}
            <div>
              <label htmlFor="nama" className="block text-sm font-medium text-gray-700 mb-2">
                Nama Lengkap <span className="text-red-500">*</span>
              </label>
              <Input
                id="nama"
                name="nama"
                type="text"
                value={formData.nama}
                onChange={(e) => handleChange('nama', e.target.value)}
                placeholder="Masukkan nama lengkap"
                error={errors.nama}
              />
              {errors.nama && (
                <p className="mt-1 text-sm text-red-600">{errors.nama}</p>
              )}
            </div>

            {/* Alamat */}
            <div>
              <label htmlFor="alamat" className="block text-sm font-medium text-gray-700 mb-2">
                Alamat <span className="text-red-500">*</span>
              </label>
              <textarea
                id="alamat"
                name="alamat"
                value={formData.alamat}
                onChange={(e) => handleChange('alamat', e.target.value)}
                placeholder="Masukkan alamat lengkap"
                rows={3}
                className={`w-full px-3 py-2 border ${errors.alamat ? 'border-red-500' : 'border-gray-300'
                  } rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent`}
              />
              {errors.alamat && (
                <p className="mt-1 text-sm text-red-600">{errors.alamat}</p>
              )}
            </div>

            {/* Wilayah */}
            <div>
              <label htmlFor="wilayah" className="block text-sm font-medium text-gray-700 mb-2">
                Wilayah <span className="text-red-500">*</span>
              </label>
              {wilayahData && wilayahData.length > 0 ? (
                <select
                  id="wilayah"
                  name="wilayah"
                  value={formData.wilayah}
                  onChange={(e) => handleChange('wilayah', e.target.value)}
                  className={`w-full px-4 py-2 border ${errors.wilayah ? 'border-red-500' : 'border-gray-300'
                    } rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent`}
                >
                  <option value="">Pilih Wilayah</option>
                  {wilayahData.map((wilayah: string) => (
                    <option key={wilayah} value={wilayah}>
                      {wilayah}
                    </option>
                  ))}
                </select>
              ) : (
                <Input
                  id="wilayah"
                  name="wilayah"
                  type="text"
                  value={formData.wilayah}
                  onChange={(e) => handleChange('wilayah', e.target.value)}
                  placeholder="Contoh: RT 01, RT 02, dll"
                  error={errors.wilayah}
                />
              )}
              {errors.wilayah && (
                <p className="mt-1 text-sm text-red-600">{errors.wilayah}</p>
              )}
            </div>

            {/* Nomor Telepon */}
            <div>
              <label htmlFor="nomor_telepon" className="block text-sm font-medium text-gray-700 mb-2">
                Nomor Telepon
              </label>
              <Input
                id="nomor_telepon"
                name="nomor_telepon"
                type="tel"
                value={formData.nomor_telepon}
                onChange={(e) => handleChange('nomor_telepon', e.target.value)}
                placeholder="Contoh: 081234567890"
              />
              <p className="mt-1 text-xs text-gray-500">
                Opsional - untuk kontak pelanggan
              </p>
            </div>

            {/* Tarif */}
            <div>
              <label htmlFor="tarif_id" className="block text-sm font-medium text-gray-700 mb-2">
                Kategori Tarif <span className="text-red-500">*</span>
              </label>
              <select
                id="tarif_id"
                name="tarif_id"
                value={formData.tarif_id}
                onChange={(e) => handleChange('tarif_id', e.target.value)}
                className={`w-full px-4 py-2 border ${errors.tarif_id ? 'border-red-500' : 'border-gray-300'
                  } rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent`}
              >
                <option value="">Pilih Tarif</option>
                {tariffsData?.map((tariff: any) => (
                  <option key={tariff.id} value={tariff.id}>
                    {tariff.nama_kategori} - Rp {tariff.harga_per_bulan.toLocaleString('id-ID')}
                  </option>
                ))}
              </select>
              {errors.tarif_id && (
                <p className="mt-1 text-sm text-red-600">{errors.tarif_id}</p>
              )}
            </div>

            {/* Status */}
            <div>
              <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <select
                id="status"
                name="status"
                value={formData.status}
                onChange={(e) => handleChange('status', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              >
                <option value="aktif">Aktif</option>
                <option value="nonaktif">Nonaktif</option>
              </select>
            </div>

            {/* Tanggal Bergabung */}
            <div>
              <label htmlFor="tanggal_bergabung" className="block text-sm font-medium text-gray-700 mb-2">
                Tanggal Bergabung
              </label>
              <Input
                id="tanggal_bergabung"
                name="tanggal_bergabung"
                type="date"
                value={formData.tanggal_bergabung}
                onChange={(e) => handleChange('tanggal_bergabung', e.target.value)}
              />
              <p className="mt-1 text-xs text-gray-500">
                Tanggal pelanggan mulai bergabung
              </p>
            </div>

            {/* Buttons */}
            <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
              <Button
                type="button"
                variant="secondary"
                onClick={() => router.push('/customers')}
              >
                Batal
              </Button>
              <Button
                type="submit"
                isLoading={createMutation.isPending}
              >
                Simpan
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </AdminLayout>
  )
}
