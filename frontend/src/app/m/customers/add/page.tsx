'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { customersApi, tariffsApi } from '@/lib/api'
import MobileHeader from '@/components/mobile/MobileHeader'
import { User, Phone, MapPin, Map, Wallet, Save, Loader2, CreditCard } from 'lucide-react'
import { toast } from 'react-hot-toast'

export default function AddCustomerPage() {
    const router = useRouter()
    const [isLoading, setIsLoading] = useState(false)
    const [isFetching, setIsFetching] = useState(true)
    const [tariffs, setTariffs] = useState<any[]>([])
    const [wilayahs, setWilayahs] = useState<string[]>([])

    // Form State
    const [formData, setFormData] = useState({
        nomor_pelanggan: '',
        nama: '',
        nomor_telepon: '',
        alamat: '',
        wilayah: '',
        tarif_id: '',
        status: 'aktif',
        tanggal_bergabung: new Date().toISOString().split('T')[0]
    })

    // Fetch Data on Mount
    useEffect(() => {
        const loadData = async () => {
            try {
                const [tariffsRes, wilayahRes] = await Promise.all([
                    tariffsApi.getCategories(),
                    customersApi.getWilayahList()
                ])
                setTariffs(tariffsRes.data || [])
                // Assuming wilayahRes.data is array of strings or objects {wilayah: string}
                const wList = Array.isArray(wilayahRes.data)
                    ? wilayahRes.data.map((w: any) => typeof w === 'string' ? w : w.wilayah)
                    : []
                setWilayahs(wList)

                // Set default tarif if available
                if (tariffsRes.data && tariffsRes.data.length > 0) {
                    setFormData(prev => ({ ...prev, tarif_id: tariffsRes.data[0].id }))
                }
            } catch (error) {
                console.error('Failed to load data', error)
                toast.error('Gagal memuat data opsi')
            } finally {
                setIsFetching(false)
            }
        }
        loadData()
    }, [])

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target
        setFormData(prev => ({ ...prev, [name]: value }))
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!formData.nomor_pelanggan || !formData.nama || !formData.tarif_id || !formData.alamat || !formData.wilayah) {
            toast.error('Mohon lengkapi semua field bertanda bintang (*)')
            return
        }

        setIsLoading(true)
        try {
            await customersApi.create(formData)
            toast.success('Pelanggan berhasil ditambahkan')
            router.push('/m/customers')
        } catch (error: any) {
            console.error(error)
            toast.error(error.response?.data?.message || 'Gagal menyimpan data pelanggan')
        } finally {
            setIsLoading(false)
        }
    }

    if (isFetching) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gray-50 pb-20">
            <MobileHeader title="Tambah Pelanggan" backUrl="/m/customers" />

            <div className="p-5">
                <form onSubmit={handleSubmit} className="space-y-5">

                    {/* Identitas */}
                    <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                            Identitas
                        </label>
                        <div className="space-y-4">
                            <div>
                                <label htmlFor="nomor_pelanggan" className="block text-sm font-medium text-gray-900 mb-1">Nomor Pelanggan <span className="text-red-500">*</span></label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <CreditCard className="h-5 w-5 text-gray-400" />
                                    </div>
                                    <input
                                        type="text"
                                        id="nomor_pelanggan"
                                        name="nomor_pelanggan"
                                        value={formData.nomor_pelanggan}
                                        onChange={handleChange}
                                        className="pl-10 block w-full rounded-xl border-gray-200 bg-gray-50 focus:border-indigo-500 focus:ring-indigo-500 text-sm py-2.5 transition-all outline-none"
                                        placeholder="Contoh: PLG0001"
                                        required
                                    />
                                </div>
                                <p className="mt-1 text-[10px] text-gray-500">Nomor ini digunakan untuk login portal pelanggan</p>
                            </div>

                            <div>
                                <label htmlFor="nama" className="block text-sm font-medium text-gray-900 mb-1">Nama Lengkap <span className="text-red-500">*</span></label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <User className="h-5 w-5 text-gray-400" />
                                    </div>
                                    <input
                                        type="text"
                                        id="nama"
                                        name="nama"
                                        value={formData.nama}
                                        onChange={handleChange}
                                        className="pl-10 block w-full rounded-xl border-gray-200 bg-gray-50 focus:border-indigo-500 focus:ring-indigo-500 text-sm py-2.5 transition-all outline-none"
                                        placeholder="Contoh: Budi Santoso"
                                        required
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Kontak */}
                    <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                            Kontak
                        </label>
                        <div className="space-y-4">
                            <div>
                                <label htmlFor="nomor_telepon" className="block text-sm font-medium text-gray-900 mb-1">Nomor WhatsApp</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Phone className="h-5 w-5 text-gray-400" />
                                    </div>
                                    <input
                                        type="tel"
                                        id="nomor_telepon"
                                        name="nomor_telepon"
                                        value={formData.nomor_telepon}
                                        onChange={handleChange}
                                        className="pl-10 block w-full rounded-xl border-gray-200 bg-gray-50 focus:border-indigo-500 focus:ring-indigo-500 text-sm py-2.5 transition-all outline-none"
                                        placeholder="08xxxxxxxxxx"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Domisili */}
                    <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                            Domisili
                        </label>
                        <div className="space-y-4">
                            <div>
                                <label htmlFor="alamat" className="block text-sm font-medium text-gray-900 mb-1">Alamat Lengkap <span className="text-red-500">*</span></label>
                                <div className="relative">
                                    <div className="absolute top-3 left-0 pl-3 flex items-start pointer-events-none">
                                        <MapPin className="h-5 w-5 text-gray-400" />
                                    </div>
                                    <textarea
                                        id="alamat"
                                        name="alamat"
                                        rows={2}
                                        value={formData.alamat}
                                        onChange={handleChange}
                                        className="pl-10 block w-full rounded-xl border-gray-200 bg-gray-50 focus:border-indigo-500 focus:ring-indigo-500 text-sm py-2.5 px-3 transition-all outline-none resize-none"
                                        placeholder="Jalan, No. Rumah..."
                                        required
                                    />
                                </div>
                            </div>

                            <div>
                                <label htmlFor="wilayah" className="block text-sm font-medium text-gray-900 mb-1">Wilayah / RT <span className="text-red-500">*</span></label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Map className="h-5 w-5 text-gray-400" />
                                    </div>
                                    <input
                                        list="wilayah-list"
                                        type="text"
                                        id="wilayah"
                                        name="wilayah"
                                        value={formData.wilayah}
                                        onChange={handleChange}
                                        className="pl-10 block w-full rounded-xl border-gray-200 bg-gray-50 focus:border-indigo-500 focus:ring-indigo-500 text-sm py-2.5 transition-all outline-none"
                                        placeholder="Pilih atau ketik..."
                                        required
                                    />
                                    <datalist id="wilayah-list">
                                        {wilayahs.map((w, idx) => (
                                            <option key={idx} value={w} />
                                        ))}
                                    </datalist>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Layanan */}
                    <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                            Layanan
                        </label>
                        <div className="space-y-4">
                            <div>
                                <label htmlFor="tarif_id" className="block text-sm font-medium text-gray-900 mb-1">Kategori Tarif <span className="text-red-500">*</span></label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Wallet className="h-5 w-5 text-gray-400" />
                                    </div>
                                    <select
                                        id="tarif_id"
                                        name="tarif_id"
                                        value={formData.tarif_id}
                                        onChange={handleChange}
                                        className="pl-10 block w-full rounded-xl border-gray-200 bg-gray-50 focus:border-indigo-500 focus:ring-indigo-500 text-sm py-2.5 transition-all outline-none appearance-none"
                                        required
                                    >
                                        <option value="" disabled>Pilih Kategori</option>
                                        {tariffs.map((t) => (
                                            <option key={t.id} value={t.id}>
                                                {t.nama_kategori} - Rp {t.harga_per_bulan.toLocaleString('id-ID')}
                                            </option>
                                        ))}
                                    </select>
                                    <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                                        <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                                        </svg>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label htmlFor="status" className="block text-sm font-medium text-gray-900 mb-1">Status</label>
                                    <select
                                        id="status"
                                        name="status"
                                        value={formData.status}
                                        onChange={handleChange}
                                        className="block w-full rounded-xl border-gray-200 bg-gray-50 focus:border-indigo-500 focus:ring-indigo-500 text-sm py-2.5 px-3 transition-all outline-none"
                                    >
                                        <option value="aktif">Aktif</option>
                                        <option value="nonaktif">Nonaktif</option>
                                    </select>
                                </div>
                                <div>
                                    <label htmlFor="tanggal_bergabung" className="block text-sm font-medium text-gray-900 mb-1">Bergabung</label>
                                    <input
                                        type="date"
                                        id="tanggal_bergabung"
                                        name="tanggal_bergabung"
                                        value={formData.tanggal_bergabung}
                                        onChange={handleChange}
                                        className="block w-full rounded-xl border-gray-200 bg-gray-50 focus:border-indigo-500 focus:ring-indigo-500 text-sm py-2.5 px-3 transition-all outline-none"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Submit Button */}
                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full bg-indigo-600 text-white font-bold py-3.5 px-4 rounded-2xl shadow-lg shadow-indigo-200 active:scale-95 transition-all flex items-center justify-center gap-2 mt-6 disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                        {isLoading ? (
                            <>
                                <Loader2 className="w-5 h-5 animate-spin" />
                                Menyimpan...
                            </>
                        ) : (
                            <>
                                <Save className="w-5 h-5" />
                                Simpan Pelanggan
                            </>
                        )}
                    </button>

                </form>
            </div>
        </div>
    )
}
