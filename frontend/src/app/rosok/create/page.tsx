'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm, useFieldArray } from 'react-hook-form'
import { rosokApi } from '@/lib/api'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import { toast } from 'react-hot-toast'
import { Save, Plus, Trash2, Calculator, ArrowLeft } from 'lucide-react'
import AdminLayout from '@/components/AdminLayout'

export default function CreateRosokSalePage() {
    const router = useRouter()
    const queryClient = useQueryClient()
    const [grandTotal, setGrandTotal] = useState(0)

    const {
        register,
        control,
        handleSubmit,
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
        watchedItems.forEach((item) => {
            const berat = parseFloat(item.berat as string) || 0
            const harga = parseFloat(item.harga_per_kg as string) || 0
            const subtotal = berat * harga

            total += subtotal
        })

        setGrandTotal(total)
        setValue('total_harga', total)
    }, [JSON.stringify(watchedItems), setValue])

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
            return rosokApi.create(payload)
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['rosok-sales'] })
            toast.success('Transaksi penjualan berhasil dicatat')
            router.push('/rosok')
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Terjadi kesalahan')
        },
    })

    const onSubmit = (data: any) => {
        mutation.mutate(data)
    }

    return (
        <AdminLayout>
            <div className="max-w-4xl mx-auto space-y-6">
                <div className="flex items-center gap-4 mb-6">
                    <Button variant="outline" onClick={() => router.back()}>
                        <ArrowLeft className="w-5 h-5 mr-1" /> Kembali
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800">Catat Penjualan Baru</h1>
                        <p className="text-gray-600">Buat transaksi penjualan rosok baru</p>
                    </div>
                </div>

                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
                        {/* Header Info */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-6 bg-gray-50 rounded-xl border border-gray-100">
                            <Input
                                id="transaction-date"
                                label="Tanggal Transaksi"
                                type="date"
                                {...register('tanggal', { required: 'Tanggal wajib diisi' })}
                                error={errors.tanggal?.message as string}
                            />
                            <Input
                                id="buyer-name"
                                label="Pembeli (Opsional)"
                                placeholder="Nama pengepul / pembeli"
                                {...register('pembeli')}
                            />
                            <Input
                                id="transaction-notes"
                                label="Catatan (Opsional)"
                                placeholder="Keterangan tambahan..."
                                {...register('catatan')}
                            />
                        </div>

                        {/* Items List */}
                        <div className="space-y-4">
                            <div className="flex justify-between items-center border-b border-gray-100 pb-4">
                                <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                                    <Calculator className="w-5 h-5 text-blue-500" />
                                    Daftar Barang
                                </h3>
                                <Button
                                    type="button"
                                    onClick={() => append({ jenis_barang: '', berat: '', harga_per_kg: '', total_harga: 0 })}
                                    className="text-sm"
                                    variant="secondary"
                                >
                                    <Plus className="w-4 h-4 mr-2" /> Tambah Barang
                                </Button>
                            </div>

                            <div className="space-y-4">
                                {fields.map((field, index) => {
                                    // Calculate subtotal for display
                                    const currentBerat = parseFloat(watchedItems[index]?.berat as string) || 0;
                                    const currentHarga = parseFloat(watchedItems[index]?.harga_per_kg as string) || 0;
                                    const currentSubtotal = currentBerat * currentHarga;

                                    return (
                                        <div key={field.id} className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end p-5 border border-gray-200 rounded-xl hover:border-blue-300 transition-all bg-white shadow-sm group">
                                            <div className="md:col-span-1 flex justify-center items-center h-full pb-3">
                                                <span className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-sm">
                                                    {index + 1}
                                                </span>
                                            </div>
                                            <div className="md:col-span-4">
                                                <Input
                                                    id={`item-${index}-type`}
                                                    label="Jenis Barang"
                                                    placeholder="Contoh: Kardus, Besi"
                                                    {...register(`items.${index}.jenis_barang`, { required: 'Wajib diisi' })}
                                                    error={errors.items?.[index]?.jenis_barang?.message as string}
                                                    className="mb-0"
                                                />
                                            </div>
                                            <div className="md:col-span-2">
                                                <Input
                                                    id={`item-${index}-weight`}
                                                    label="Berat (kg)"
                                                    type="number"
                                                    step="0.01"
                                                    placeholder="0"
                                                    {...register(`items.${index}.berat`, { required: true, min: 0 })}
                                                    className="mb-0"
                                                />
                                            </div>
                                            <div className="md:col-span-3">
                                                <Input
                                                    id={`item-${index}-price`}
                                                    label="Harga/kg (Rp)"
                                                    type="number"
                                                    placeholder="0"
                                                    {...register(`items.${index}.harga_per_kg`, { required: true, min: 0 })}
                                                    className="mb-0"
                                                />
                                            </div>
                                            <div className="md:col-span-2 flex items-center justify-between md:flex-col md:items-end gap-2 pb-1">
                                                <div className="text-right w-full">
                                                    <span className="block text-xs font-medium text-gray-500 mb-1 md:hidden">Subtotal</span>
                                                    <div className="font-mono font-bold text-gray-900 bg-gray-50 py-2 px-3 rounded-lg border border-gray-200 w-full text-right">
                                                        Rp {currentSubtotal.toLocaleString('id-ID')}
                                                    </div>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => remove(index)}
                                                    className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all md:hidden"
                                                    disabled={fields.length === 1}
                                                    title="Hapus baris"
                                                >
                                                    <Trash2 className="w-5 h-5" />
                                                </button>
                                            </div>
                                            <div className="hidden md:block absolute right-4 translate-x-12 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    type="button"
                                                    onClick={() => remove(index)}
                                                    className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-all"
                                                    disabled={fields.length === 1}
                                                    title="Hapus baris"
                                                >
                                                    <Trash2 className="w-5 h-5" />
                                                </button>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>

                        {/* Footer Total */}
                        <div className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl border border-blue-100 flex flex-col md:flex-row items-center justify-between shadow-sm gap-4">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-white rounded-xl shadow-sm text-blue-600">
                                    <Calculator className="w-8 h-8" />
                                </div>
                                <div>
                                    <p className="text-lg text-blue-800 font-semibold">Total Estimasi Pendapatan</p>
                                    <p className="text-sm text-blue-600">Dihitung otomatis dari {fields.length} jenis barang</p>
                                </div>
                            </div>
                            <div className="text-4xl font-bold text-blue-700 font-mono tracking-tight">
                                Rp {grandTotal.toLocaleString('id-ID')}
                            </div>
                        </div>

                        <div className="flex justify-end gap-4 pt-6 mt-8 border-t border-gray-100">
                            <Button
                                type="button"
                                variant="outline"
                                size="lg"
                                onClick={() => router.back()}
                                disabled={isSubmitting}
                            >
                                Batal
                            </Button>
                            <Button
                                type="submit"
                                size="lg"
                                isLoading={isSubmitting}
                            >
                                <Save className="w-5 h-5 mr-2" />
                                Simpan Transaksi
                            </Button>
                        </div>
                    </form>
                </div>
            </div>
        </AdminLayout>
    )
}
