'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import MobileHeader from '@/components/mobile/MobileHeader'
import { User, Lock, Bell, Moon, LogOut, ChevronRight, HelpCircle } from 'lucide-react'
import { motion } from 'framer-motion'

export default function MobileSettings() {
    const router = useRouter()
    const [user, setUser] = useState<any>(null)

    useEffect(() => {
        const userStr = localStorage.getItem('user')
        if (userStr) {
            setUser(JSON.parse(userStr))
        }
    }, [])

    const handleLogout = () => {
        if (confirm('Yakin ingin keluar?')) {
            localStorage.removeItem('token')
            localStorage.removeItem('user')
            localStorage.removeItem('rememberMe')
            router.push('/m-login')
        }
    }

    const menuGroups = [
        {
            title: 'Akun',
            items: [
                { icon: User, label: 'Edit Profil', action: () => { } },
                { icon: Lock, label: 'Ganti Password', action: () => { } },
            ]
        },
        {
            title: 'Aplikasi',
            items: [
                { icon: Bell, label: 'Notifikasi', action: () => { }, badge: 'On' },
                { icon: Moon, label: 'Mode Gelap', action: () => { }, badge: 'Off' },
            ]
        },
        {
            title: 'Lainnya',
            items: [
                { icon: HelpCircle, label: 'Bantuan & Support', action: () => { } },
                { icon: LogOut, label: 'Keluar', action: handleLogout, danger: true },
            ]
        }
    ]

    return (
        <div className="min-h-screen bg-gray-50 pb-20">
            <MobileHeader title="Pengaturan" showBack />

            <div className="p-4 space-y-6">
                {/* Profile Card */}
                <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex items-center gap-4">
                    <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-2xl shadow-lg">
                        {user?.nama?.charAt(0) || 'A'}
                    </div>
                    <div>
                        <h2 className="font-bold text-xl text-gray-900">{user?.nama || 'Admin Sabamas'}</h2>
                        <p className="text-gray-500 text-sm">{user?.email || 'admin@sabamas.com'}</p>
                        <span className="inline-block mt-1 px-3 py-1 bg-indigo-100 text-indigo-700 text-xs font-bold rounded-full uppercase">
                            Administrator
                        </span>
                    </div>
                </div>

                {/* Settings Groups */}
                {menuGroups.map((group, groupIndex) => (
                    <div key={group.title}>
                        <h3 className="text-sm font-bold text-gray-500 uppercase px-4 mb-2">{group.title}</h3>
                        <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100">
                            {group.items.map((item: any, index) => {
                                const Icon = item.icon
                                return (
                                    <button
                                        key={item.label}
                                        onClick={item.action}
                                        className={`w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors ${index !== group.items.length - 1 ? 'border-b border-gray-100' : ''
                                            }`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${item.danger ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-600'
                                                }`}>
                                                <Icon className="w-4 h-4" />
                                            </div>
                                            <span className={`font-semibold ${item.danger ? 'text-red-600' : 'text-gray-900'}`}>
                                                {item.label}
                                            </span>
                                        </div>
                                        <div className="flex items-center">
                                            {item.badge && (
                                                <span className="mr-2 text-xs font-semibold text-gray-400 bg-gray-100 px-2 py-1 rounded">
                                                    {item.badge}
                                                </span>
                                            )}
                                            <ChevronRight className="w-5 h-5 text-gray-400" />
                                        </div>
                                    </button>
                                )
                            })}
                        </div>
                    </div>
                ))}
            </div>

            <p className="text-center text-xs text-gray-300 mt-4">
                Versi Aplikasi 1.0.0 (Mobile Beta)
            </p>
        </div>
    )
}
