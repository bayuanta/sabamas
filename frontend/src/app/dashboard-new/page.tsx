import React from 'react';
import { Icon } from '@iconify/react';

export default function DashboardNewPage() {
    return (
        <div>
            <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                <h6 className="text-xl font-semibold text-neutral-900 dark:text-white">Dashboard Overview</h6>
                <button className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-sm font-medium transition-colors">
                    + Tambah Data
                </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
                <div className="card">
                    <div className="card-body p-6">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="mb-2 text-neutral-500">Total Pelanggan</p>
                                <h4 className="mb-2 text-2xl font-bold text-neutral-900 dark:text-white">1,234</h4>
                                <span className="text-success-600 text-sm font-medium flex items-center gap-1">
                                    <Icon icon="heroicons:arrow-trending-up" /> +12.5%
                                </span>
                            </div>
                            <div className="w-12 h-12 rounded-full bg-primary-50 dark:bg-primary-900/20 flex items-center justify-center text-primary-600 text-2xl">
                                <Icon icon="solar:users-group-rounded-bold-duotone" />
                            </div>
                        </div>
                    </div>
                </div>
                <div className="card">
                    <div className="card-body p-6">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="mb-2 text-neutral-500">Pendapatan Bulan Ini</p>
                                <h4 className="mb-2 text-2xl font-bold text-neutral-900 dark:text-white">Rp 45.2M</h4>
                                <span className="text-success-600 text-sm font-medium flex items-center gap-1">
                                    <Icon icon="heroicons:arrow-trending-up" /> +8.2%
                                </span>
                            </div>
                            <div className="w-12 h-12 rounded-full bg-warning-50 dark:bg-warning-900/20 flex items-center justify-center text-warning-600 text-2xl">
                                <Icon icon="solar:wallet-bold-duotone" />
                            </div>
                        </div>
                    </div>
                </div>
                <div className="card">
                    <div className="card-body p-6">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="mb-2 text-neutral-500">Tagihan Belum Bayar</p>
                                <h4 className="mb-2 text-2xl font-bold text-neutral-900 dark:text-white">85</h4>
                                <span className="text-danger-600 text-sm font-medium flex items-center gap-1">
                                    <Icon icon="heroicons:arrow-trending-down" /> -2.4%
                                </span>
                            </div>
                            <div className="w-12 h-12 rounded-full bg-danger-50 dark:bg-danger-900/20 flex items-center justify-center text-danger-600 text-2xl">
                                <Icon icon="solar:bill-list-bold-duotone" />
                            </div>
                        </div>
                    </div>
                </div>
                <div className="card">
                    <div className="card-body p-6">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="mb-2 text-neutral-500">Laporan Masuk</p>
                                <h4 className="mb-2 text-2xl font-bold text-neutral-900 dark:text-white">12</h4>
                                <span className="text-orange-600 text-sm font-medium flex items-center gap-1">
                                    <Icon icon="heroicons:exclamation-circle" /> New
                                </span>
                            </div>
                            <div className="w-12 h-12 rounded-full bg-info-50 dark:bg-info-900/20 flex items-center justify-center text-info-600 text-2xl">
                                <Icon icon="solar:chat-round-dots-bold-duotone" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="card h-full lg:col-span-2">
                    <div className="card-header flex justify-between items-center">
                        <h6 className="mb-0">Transaksi Terakhir</h6>
                        <button className="text-sm text-primary-600 hover:text-primary-700 font-medium">Lihat Semua</button>
                    </div>
                    <div className="card-body">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm text-neutral-600">
                                <thead className="bg-neutral-50 dark:bg-neutral-700 text-neutral-900 dark:text-white font-semibold">
                                    <tr>
                                        <th className="px-4 py-3 rounded-l-lg">Pelanggan</th>
                                        <th className="px-4 py-3">Tanggal</th>
                                        <th className="px-4 py-3">Jumlah</th>
                                        <th className="px-4 py-3 rounded-r-lg">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-neutral-200 dark:divide-neutral-700">
                                    {[1, 2, 3, 4, 5].map((i) => (
                                        <tr key={i} className="hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors">
                                            <td className="px-4 py-3 font-medium text-neutral-900 dark:text-white">Agus Santoso</td>
                                            <td className="px-4 py-3">30 Des 2025</td>
                                            <td className="px-4 py-3">Rp 150.000</td>
                                            <td className="px-4 py-3">
                                                <span className="px-2 py-1 rounded-full text-xs font-semibold bg-success-100 text-success-600">
                                                    Lunas
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
                <div className="card h-full">
                    <div className="card-header">
                        <h6 className="mb-0">Aktivitas Terkini</h6>
                    </div>
                    <div className="card-body">
                        <div className="space-y-6 relative before:absolute before:inset-0 before:ml-2 before:w-0.5 before:bg-neutral-200 dark:before:bg-neutral-700">
                            {[1, 2, 3].map((i) => (
                                <div key={i} className="relative flex gap-4">
                                    <span className="absolute left-0 top-1.5 ml-[5px] w-2 h-2 rounded-full border-2 border-white dark:border-neutral-800 bg-primary-600 z-10"></span>
                                    <div className="ml-6">
                                        <p className="text-sm text-neutral-900 dark:text-white font-medium">Pembayaran diterima</p>
                                        <p className="text-xs text-neutral-500 mt-1">Dari Bapak Budi sebesar Rp 50.000</p>
                                        <p className="text-xs text-neutral-400 mt-1">2 jam yang lalu</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
