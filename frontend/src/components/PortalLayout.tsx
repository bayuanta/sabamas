'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import { settingsApi } from '@/lib/api'
import { isTokenExpired } from '@/lib/utils'
import { LayoutDashboard, Receipt, History, LogOut, Menu, X, UserCircle, Clock, ChevronRight } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

interface PortalLayoutProps {
  children: React.ReactNode
}

export default function PortalLayout({ children }: PortalLayoutProps) {
  const router = useRouter()
  const pathname = usePathname()
  const [user, setUser] = useState<any>(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [greeting, setGreeting] = useState('')

  // Get settings for logo
  const { data: settings } = useQuery({
    queryKey: ['settings'],
    queryFn: async () => {
      try {
        const { data } = await settingsApi.get()
        return data
      } catch (error) {
        return null
      }
    },
    staleTime: 5 * 60 * 1000,
    retry: false,
    enabled: !!user,
  })

  useEffect(() => {
    const token = localStorage.getItem('token')
    const userData = localStorage.getItem('user')

    if (!token || !userData || isTokenExpired(token)) {
      if (token || userData) {
        localStorage.removeItem('token')
        localStorage.removeItem('user')
      }
      router.push('/portal-login')
      return
    }

    const parsedUser = JSON.parse(userData)
    if (parsedUser.type !== 'customer') {
      router.push('/login')
      return
    }

    setUser(parsedUser)
  }, [router])

  useEffect(() => {
    const updateGreeting = () => {
      const hour = new Date().getHours()
      if (hour < 12) setGreeting('Selamat Pagi')
      else if (hour < 15) setGreeting('Selamat Siang')
      else if (hour < 18) setGreeting('Selamat Sore')
      else setGreeting('Selamat Malam')
    }
    updateGreeting()
  }, [])

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    router.push('/portal-login')
  }

  const menuItems = [
    { href: '/portal/dashboard', icon: LayoutDashboard, label: 'Dashboard', color: 'text-emerald-500' },
    { href: '/portal/tagihan', icon: Receipt, label: 'Tagihan', color: 'text-blue-500' },
    { href: '/portal/riwayat', icon: History, label: 'Riwayat', color: 'text-purple-500' },
  ]

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" />
          <p className="text-gray-500 font-medium animate-pulse">Memuat Portal...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50/50">
      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSidebarOpen(false)}
            className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.aside
        className={`fixed inset-y-0 left-0 z-50 w-72 bg-white/80 backdrop-blur-xl border-r border-gray-200/50 shadow-2xl lg:shadow-none lg:bg-white lg:border-r lg:translate-x-0 transition-transform duration-300 ease-in-out ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'
          } lg:translate-x-0`}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="h-20 flex items-center px-8 border-b border-gray-100">
            <Link href="/portal/dashboard" className="flex items-center gap-3 group">
              {settings?.logo ? (
                <div className="w-10 h-10 relative flex-shrink-0">
                  <img
                    src={`${(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001').replace(/\/api\/?$/, '')}${settings.logo}`}
                    alt="Logo"
                    className="w-full h-full object-contain"
                  />
                </div>
              ) : (
                <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/20 text-white">
                  <UserCircle className="w-6 h-6" />
                </div>
              )}
              <div className="flex flex-col">
                <span className="font-bold text-gray-900 leading-tight group-hover:text-emerald-600 transition-colors">SABAMAS</span>
                <span className="text-[10px] font-bold text-emerald-600 tracking-wider uppercase bg-emerald-50 px-1.5 py-0.5 rounded-md w-fit mt-0.5">Portal</span>
              </div>
            </Link>
          </div>

          {/* Nav Items */}
          <nav className="flex-1 px-4 py-8 space-y-2 overflow-y-auto">
            <p className="px-4 text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Menu Utama</p>
            {menuItems.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={`relative flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all duration-300 group overflow-hidden ${isActive
                      ? 'bg-gray-900 text-white shadow-lg shadow-gray-900/20'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                >
                  <Icon className={`w-5 h-5 transition-colors ${isActive ? 'text-white' : item.color}`} />
                  <span className="font-medium relative z-10">{item.label}</span>
                  {isActive && (
                    <motion.div
                      layoutId="activeTab"
                      className="absolute inset-0 bg-gray-900 rounded-2xl -z-0"
                      transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                    />
                  )}
                  {!isActive && (
                    <ChevronRight className="w-4 h-4 ml-auto opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all text-gray-400" />
                  )}
                </Link>
              )
            })}
          </nav>

          {/* User Profile */}
          <div className="p-4 border-t border-gray-100 bg-gray-50/50">
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex items-center justify-center font-bold text-lg shadow-md shadow-indigo-500/20">
                  {user.nama?.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-gray-900 truncate">{user.nama}</p>
                  <p className="text-xs text-gray-500 truncate">{user.nomor_pelanggan}</p>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100 rounded-xl transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Keluar</span>
              </button>
            </div>
          </div>
        </div>
      </motion.aside>

      {/* Main Content Area */}
      <div className="lg:ml-72 flex flex-col min-h-screen transition-all duration-300">
        {/* Header */}
        <header className="sticky top-0 z-30 h-20 px-6 sm:px-8 flex items-center justify-between bg-slate-50/80 backdrop-blur-md border-b border-gray-200/50">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 -ml-2 text-gray-600 hover:bg-white hover:shadow-sm rounded-xl lg:hidden transition-all"
            >
              <Menu className="w-6 h-6" />
            </button>

            <div className="flex flex-col">
              <h1 className="text-lg sm:text-xl font-bold text-gray-900 flex items-center gap-2">
                {greeting}, <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-600">{user.nama.split(' ')[0]}</span>
                <span className="text-2xl animate-pulse">👋</span>
              </h1>
              <div className="flex items-center gap-1.5 text-xs text-gray-500">
                <Clock className="w-3.5 h-3.5" />
                <span>{new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</span>
              </div>
            </div>
          </div>

          {/* Status Badge */}
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-200/50 rounded-full shadow-sm">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
            <span className="text-xs font-bold text-gray-700">Akun Aktif</span>
          </div>
        </header>

        {/* Dynamic Content */}
        <main className="flex-1 p-6 sm:p-8 max-w-7xl mx-auto w-full">
          {children}
        </main>
      </div>
    </div>
  )
}
