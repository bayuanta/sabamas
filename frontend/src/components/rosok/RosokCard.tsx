import React, { useState } from 'react'
import { format } from 'date-fns'
import { id } from 'date-fns/locale'
import { Printer, Edit2, Trash2, ChevronDown, ChevronUp, Calendar, User } from 'lucide-react'

interface RosokCardProps {
    sale: any
    isSelected: boolean
    onSelect: () => void
    onEdit: () => void
    onDelete: () => void
    onPrint: () => void
}

export default function RosokCard({ sale, isSelected, onSelect, onEdit, onDelete, onPrint }: RosokCardProps) {
    const [isExpanded, setIsExpanded] = useState(false)

    // Calculate totals
    const totalRevenue = sale.items?.reduce((sum: number, i: any) => sum + i.total_harga, 0) || 0
    const totalWeight = sale.items?.reduce((sum: number, i: any) => sum + i.berat, 0) || 0
    const itemCount = sale.items?.length || 0

    // Get top items for summary
    const topItems = sale.items?.slice(0, 3) || []
    const remainingCount = itemCount - 3

    return (
        <div
            className={`
                group relative bg-white rounded-2xl border transition-all duration-300 flex flex-col h-full
                ${isSelected
                    ? 'border-blue-500 ring-4 ring-blue-500/10 shadow-lg shadow-blue-500/20'
                    : 'border-gray-200 hover:border-blue-300 hover:shadow-lg hover:shadow-gray-200/50'
                }
            `}
        >
            {/* Selection Checkbox (Absolute) */}
            <div className="absolute top-3 left-3 z-10">
                <button
                    onClick={(e) => { e.stopPropagation(); onSelect(); }}
                    className={`
                        w-6 h-6 rounded-md border-2 flex items-center justify-center transition-all shadow-sm
                        ${isSelected
                            ? 'bg-blue-600 border-blue-600 text-white scale-110'
                            : 'bg-white border-gray-300 text-transparent hover:border-blue-400'
                        }
                    `}
                >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                </button>
            </div>

            {/* Header Area */}
            <div className="p-5 pb-3">
                <div className="flex justify-between items-start pl-8 mb-2">
                    <div className="flex flex-col">
                        <span className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-0.5 flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {format(new Date(sale.tanggal), 'dd MMM yyyy', { locale: id })}
                        </span>
                        <h3 className="text-lg font-bold text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-1 flex items-center gap-2">
                            {sale.pembeli ? (
                                <>
                                    <User className="w-4 h-4 text-gray-400" />
                                    {sale.pembeli}
                                </>
                            ) : (
                                <span className="text-gray-500 italic">Tanpa Nama</span>
                            )}
                        </h3>
                    </div>
                </div>

                {/* Main Stats Big Display */}
                <div className="flex items-end justify-between mt-3 mb-4 pl-0 border-b border-gray-100 pb-4 border-dashed">
                    <div>
                        <p className="text-[10px] text-gray-400 font-semibold uppercase">Total Berat</p>
                        <p className="text-sm font-bold text-gray-700">{totalWeight.toLocaleString('id-ID')} kg</p>
                    </div>
                    <div className="text-right">
                        <p className="text-[10px] text-gray-400 font-semibold uppercase">Total Nilai</p>
                        <p className="text-xl font-extrabold text-gray-900 bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                            Rp {totalRevenue.toLocaleString('id-ID')}
                        </p>
                    </div>
                </div>

                {/* Items Summary (Always Visible Small List) */}
                <div className="space-y-1.5 min-h-[60px]">
                    <p className="text-[10px] text-gray-400 font-semibold uppercase mb-1">Items Summary:</p>
                    {topItems.map((item: any, idx: number) => (
                        <div key={idx} className="flex justify-between items-center text-xs text-gray-600">
                            <span className="truncate max-w-[60%] flex items-center gap-1.5">
                                <span className="w-1 h-1 rounded-full bg-blue-400"></span>
                                {item.jenis_barang}
                            </span>
                            <span className="font-mono text-gray-500">{item.berat}kg</span>
                        </div>
                    ))}
                    {remainingCount > 0 && (
                        <p className="text-xs text-blue-500 font-medium pl-2.5">+{remainingCount} barang lainnya...</p>
                    )}
                </div>
            </div>

            {/* Expandable Full List Details */}
            {isExpanded && (
                <div className="px-5 pb-4 pt-0 text-gray-600 bg-gray-50/50 border-t border-gray-100 animate-in slide-in-from-top-2">
                    <div className="pt-3 space-y-2">
                        {sale.items?.slice(3).map((item: any, idx: number) => (
                            <div key={idx + 3} className="flex justify-between items-center text-xs">
                                <span className="truncate max-w-[60%] flex items-center gap-1.5">
                                    <span className="w-1 h-1 rounded-full bg-gray-300"></span>
                                    {item.jenis_barang}
                                </span>
                                <span className="font-mono text-gray-500">{item.berat}kg</span>
                            </div>
                        ))}
                        {sale.catatan && (
                            <div className="mt-3 pt-2 border-t border-gray-100">
                                <p className="text-xs font-semibold text-gray-400 uppercase">Catatan:</p>
                                <p className="text-xs text-gray-600 italic mt-0.5">{sale.catatan}</p>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Footer Actions */}
            <div className="mt-auto border-t border-gray-100 p-3 bg-gray-50/30 rounded-b-2xl flex items-center justify-between gap-2">
                {remainingCount > 0 || sale.catatan ? (
                    <button
                        onClick={() => setIsExpanded(!isExpanded)}
                        className="text-xs font-medium text-gray-500 hover:text-blue-600 flex items-center gap-1 px-2 py-1.5 rounded-lg hover:bg-blue-50 transition-colors"
                    >
                        {isExpanded ? (
                            <>Tutup Detail <ChevronUp className="w-3 h-3" /></>
                        ) : (
                            <>Lihat Detail <ChevronDown className="w-3 h-3" /></>
                        )}
                    </button>
                ) : (
                    <div></div> // Spacer
                )}

                <div className="flex items-center gap-1">
                    <button
                        onClick={onPrint}
                        className="p-2 text-gray-400 hover:text-gray-700 hover:bg-white hover:shadow-sm rounded-lg transition-all border border-transparent hover:border-gray-200"
                        title="Cetak Struk"
                    >
                        <Printer className="w-4 h-4" />
                    </button>
                    <button
                        onClick={onEdit}
                        className="p-2 text-gray-400 hover:text-orange-600 hover:bg-white hover:shadow-sm rounded-lg transition-all border border-transparent hover:border-gray-200"
                        title="Edit"
                    >
                        <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            if (confirm('Hapus transaksi ini?')) onDelete();
                        }}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-white hover:shadow-sm rounded-lg transition-all border border-transparent hover:border-gray-200"
                        title="Hapus"
                    >
                        <Trash2 className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </div>
    )
}
