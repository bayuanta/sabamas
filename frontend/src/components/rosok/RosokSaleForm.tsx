import { useState, useEffect } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm, useFieldArray } from 'react-hook-form'
import { rosokApi } from '@/lib/api'
import Modal from '@/components/ui/Modal'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import { toast } from 'react-hot-toast'
import { Save, Plus, Trash2, Calculator, Calendar, User, FileText, ShoppingBag, Coins } from 'lucide-react'

interface RosokSaleFormProps {
    isOpen: boolean
    onClose: () => void
    initialData?: any
    onSuccess?: () => void
}

export default function RosokSaleForm({
    isOpen,
    onClose,
    initialData,
    onSuccess,
}: RosokSaleFormProps) {
    const queryClient = useQueryClient()
    const [grandTotal, setGrandTotal] = useState(0)

    const {
        register,
        control,
        handleSubmit,
        reset,
        watch,
        setValue,
        formState: { errors, isSubmitting },
    } = useForm({
        defaultValues: {
            tanggal: new Date().toISOString().split('T')[0],
            pembeli: '',
            catatan: '',
            items: [
                { jenis_barang: '', berat: '', harga_per_kg: '', total_harga: 0 }
            ],
            total_harga: 0
        },
    })

    const { fields, append, remove } = useFieldArray({
        control,
        name: "items"
    });

    // Watch items to calculate totals
    const watchedItems = watch('items')

    useEffect(() => {
        let total = 0
        const updatedItems = watchedItems.map((item, index) => {
            const berat = parseFloat(item.berat as string) || 0
            const harga = parseFloat(item.harga_per_kg as string) || 0
            const subtotal = berat * harga

            total += subtotal
            return { ...item, total_harga: subtotal }
        })

        setGrandTotal(total)
        setValue('total_harga', total)
    }, [JSON.stringify(watchedItems), setValue])

    useEffect(() => {
        if (isOpen) {
            if (initialData) {
                reset({
                    tanggal: new Date(initialData.tanggal).toISOString().split('T')[0],
                    pembeli: initialData.pembeli || '',
                    catatan: initialData.catatan || '',
                    items: initialData.items?.length ? initialData.items.map((item: any) => ({
                        jenis_barang: item.jenis_barang,
                        berat: item.berat,
                        harga_per_kg: item.harga_per_kg,
                        total_harga: item.total_harga
                    })) : [{ jenis_barang: '', berat: '', harga_per_kg: '', total_harga: 0 }],
                    total_harga: initialData.total_harga || 0
                })
            } else {
                reset({
                    tanggal: new Date().toISOString().split('T')[0],
                    pembeli: '',
                    catatan: '',
                    items: [
                        { jenis_barang: '', berat: '', harga_per_kg: '', total_harga: 0 }
                    ],
                    total_harga: 0
                })
            }
        }
    }, [isOpen, initialData, reset])

    const mutation = useMutation({
        mutationFn: (data: any) => {
            const payload = {
                ...data,
                items: data.items.map((item: any) => ({
                    ...item,
                    berat: parseFloat(item.berat),
                    harga_per_kg: parseFloat(item.harga_per_kg),
                    total_harga: parseFloat(item.berat) * parseFloat(item.harga_per_kg)
                })),
                total_harga: grandTotal,
            }

            if (initialData) {
                return rosokApi.update(initialData.id, payload)
            }
            return rosokApi.create(payload)
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['rosok-sales'] })
            toast.success(initialData ? 'Penjualan berhasil diperbarui' : 'Penjualan berhasil dicatat')
            if (onSuccess) onSuccess()
            onClose()
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Terjadi kesalahan')
        },
    })

    const onSubmit = (data: any) => {
        mutation.mutate(data)
    }

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={initialData ? 'Edit Transaksi' : 'Transaksi Baru'}
            size="xl"
        >
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
                {/* Header Information Section */}
                <div className="bg-gray-50/50 p-6 rounded-2xl border border-gray-100">
                    <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide mb-4 flex items-center gap-2">
                        <FileText className="w-4 h-4 text-blue-500" />
                        Informasi Dasar
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="space-y-2">
                            <label className="text-xs font-semibold text-gray-500 uppercase flex items-center gap-2">
                                <Calendar className="w-3.5 h-3.5" /> Tanggal
                            </label>
                            <Input
                                type="date"
                                {...register('tanggal', { required: 'Tanggal wajib diisi' })}
                                error={errors.tanggal?.message as string}
                                className="bg-white"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-semibold text-gray-500 uppercase flex items-center gap-2">
                                <User className="w-3.5 h-3.5" /> Pembeli
                            </label>
                            <Input
                                placeholder="Nama pengepul..."
                                {...register('pembeli')}
                                className="bg-white"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-semibold text-gray-500 uppercase flex items-center gap-2">
                                <FileText className="w-3.5 h-3.5" /> Catatan
                            </label>
                            <Input
                                placeholder="Keterangan tambahan..."
                                {...register('catatan')}
                                className="bg-white"
                            />
                        </div>
                    </div>
                </div>

                {/* Items Section */}
                <div>
                    <div className="flex justify-between items-end mb-4 px-1">
                        <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide flex items-center gap-2">
                            <ShoppingBag className="w-4 h-4 text-blue-500" />
                            Daftar Barang
                        </h3>
                        <button
                            type="button"
                            onClick={() => append({ jenis_barang: '', berat: '', harga_per_kg: '', total_harga: 0 })}
                            className="text-sm bg-blue-50 hover:bg-blue-100 text-blue-600 hover:text-blue-700 font-medium py-2 px-3 rounded-lg flex items-center gap-1 transition-colors"
                        >
                            <Plus className="w-4 h-4" /> Tambah Barang
                        </button>
                    </div>

                    <div className="space-y-4 max-h-[50vh] overflow-y-auto pr-2 -mr-2">
                        {fields.map((field, index) => {
                            const currentBerat = parseFloat(watchedItems[index]?.berat as string) || 0;
                            const currentHarga = parseFloat(watchedItems[index]?.harga_per_kg as string) || 0;
                            const currentSubtotal = currentBerat * currentHarga;

                            return (
                                <div key={field.id} className="group relative bg-white p-4 rounded-xl border border-gray-200 shadow-sm hover:shadow-md hover:border-blue-200 transition-all duration-200">
                                    <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-start md:items-center">
                                        {/* Mobile: Header Row */}
                                        <div className="md:col-span-12 flex justify-between items-center md:hidden mb-2">
                                            <span className="text-sm font-bold text-gray-700">Barang #{index + 1}</span>
                                            <button
                                                type="button"
                                                onClick={() => remove(index)}
                                                disabled={fields.length === 1}
                                                className="text-red-400 p-1"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>

                                        {/* Item Name */}
                                        <div className="col-span-1 md:col-span-4">
                                            <div className="relative">
                                                <Input
                                                    placeholder="Nama / Jenis Barang"
                                                    {...register(`items.${index}.jenis_barang`, { required: 'Wajib diisi' })}
                                                    error={errors.items?.[index]?.jenis_barang?.message as string}
                                                    className="mb-0 focus:ring-blue-200"
                                                />
                                            </div>
                                        </div>

                                        {/* Weight */}
                                        <div className="col-span-1 md:col-span-2 relative">
                                            <div className="relative">
                                                <Input
                                                    type="number"
                                                    step="0.01"
                                                    placeholder="Berat"
                                                    {...register(`items.${index}.berat`, { required: true, min: 0 })}
                                                    className="mb-0 pr-8 text-right font-mono"
                                                />
                                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs font-medium pointer-events-none">kg</span>
                                            </div>
                                        </div>

                                        {/* Price */}
                                        <div className="col-span-1 md:col-span-3 relative">
                                            <div className="relative">
                                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs font-medium pointer-events-none">Rp</span>
                                                <Input
                                                    type="number"
                                                    placeholder="Harga/kg"
                                                    {...register(`items.${index}.harga_per_kg`, { required: true, min: 0 })}
                                                    className="mb-0 pl-8 text-right font-mono"
                                                />
                                            </div>
                                        </div>

                                        {/* Subtotal */}
                                        <div className="col-span-1 md:col-span-2 text-right md:text-right flex justify-between md:block items-center bg-gray-50 md:bg-transparent p-2 md:p-0 rounded-lg">
                                            <span className="text-xs text-gray-500 md:hidden">Subtotal:</span>
                                            <span className="font-mono font-semibold text-gray-900">
                                                Rp {currentSubtotal.toLocaleString('id-ID')}
                                            </span>
                                        </div>

                                        {/* Desktop Delete */}
                                        <div className="hidden md:flex md:col-span-1 justify-center">
                                            <button
                                                type="button"
                                                onClick={() => remove(index)}
                                                className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                                disabled={fields.length === 1}
                                                title="Hapus baris"
                                            >
                                                <Trash2 className="w-5 h-5" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>

                {/* Footer Totals */}
                <div className="mt-8 bg-gradient-to-r from-blue-600 to-indigo-600 p-6 rounded-2xl text-white shadow-lg shadow-blue-500/20">
                    <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                                <Coins className="w-8 h-8 text-white" />
                            </div>
                            <div>
                                <p className="text-blue-100 text-sm font-medium mb-1">Total Estimasi Pendapatan</p>
                                <div className="flex items-baseline gap-2">
                                    <span className="text-xs bg-white/20 px-2 py-0.5 rounded text-blue-50">{fields.length} Item</span>
                                    <span className="text-xs bg-white/20 px-2 py-0.5 rounded text-blue-50">
                                        {watchedItems.reduce((acc, curr) => acc + (parseFloat(curr.berat as string) || 0), 0).toLocaleString('id-ID', { maximumFractionDigits: 1 })} kg
                                    </span>
                                </div>
                            </div>
                        </div>
                        <div className="text-center md:text-right">
                            <p className="text-4xl font-bold font-mono tracking-tight">
                                Rp {grandTotal.toLocaleString('id-ID')}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="flex justify-end gap-3 pt-4">
                    <Button
                        type="button"
                        variant="ghost"
                        onClick={onClose}
                        disabled={isSubmitting}
                        className="text-gray-500 hover:text-gray-700 hover:bg-gray-100"
                    >
                        Batal
                    </Button>
                    <Button
                        type="submit"
                        isLoading={isSubmitting}
                        className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/30 px-8"
                    >
                        <Save className="w-4 h-4 mr-2" />
                        {initialData ? 'Simpan Perubahan' : 'Simpan Transaksi'}
                    </Button>
                </div>
            </form>
        </Modal>
    )
}
