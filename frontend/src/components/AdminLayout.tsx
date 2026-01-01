'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { useQuery } from '@tanstack/react-query'
import { settingsApi } from '@/lib/api'
import {
  LayoutDashboard,
  Users,
  CreditCard,
  Receipt,
  Wallet,
  Tag,
  FileText,
  Database,
  Settings,
  LogOut,
  Menu,
  X,
  Filter,
  TrendingUp,
  Shield,
  Recycle,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

interface AdminLayoutProps {
  children: React.ReactNode
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const router = useRouter()
  const pathname = usePathname()
  const [user, setUser] = useState<any>(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [isMinimized, setIsMinimized] = useState(false)
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false)

  // Get settings for logo
  const { data: settings } = useQuery({
    queryKey: ['settings'],
    queryFn: async () => {
      const { data } = await settingsApi.get()
      return data
    },
  })

  useEffect(() => {
    const token = localStorage.getItem('token')
    const userData = localStorage.getItem('user')

    if (!token || !userData) {
      router.push('/login')
      return
    }

    const parsedUser = JSON.parse(userData)
    if (parsedUser.type !== 'admin') {
      router.push('/portal/dashboard')
      return
    }

    setUser(parsedUser)
  }, [router])

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    router.push('/login')
  }

  const menuItems = [
    { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard', badge: null, color: 'from-blue-500 to-cyan-500' },
    { href: '/customers', icon: Users, label: 'Pelanggan', badge: null, color: 'from-blue-500 to-cyan-500' },
    { href: '/billing', icon: CreditCard, label: 'Billing', badge: null, color: 'from-blue-500 to-cyan-500' },
    { href: '/transactions', icon: Receipt, label: 'Transaksi', badge: null, color: 'from-blue-500 to-cyan-500' },
    { href: '/deposits', icon: Wallet, label: 'Setoran', badge: null, color: 'from-blue-500 to-cyan-500' },
    { href: '/tariffs', icon: Tag, label: 'Tarif', badge: null, color: 'from-blue-500 to-cyan-500' },
    { href: '/tariffs/selective', icon: Filter, label: 'Tarif Selektif', badge: null, color: 'from-blue-500 to-cyan-500' },
    { href: '/rosok', icon: Recycle, label: 'Penjualan Rosok', badge: null, color: 'from-orange-500 to-red-500' },
    { href: '/reports', icon: TrendingUp, label: 'Laporan', badge: null, color: 'from-blue-500 to-cyan-500' },
    { href: '/backup', icon: Shield, label: 'Backup', badge: null, color: 'from-blue-500 to-cyan-500' },
  ]

  const getPageTitle = () => {
    if (pathname === '/billing/bulk') return 'Billing Kolektif'
    if (pathname === '/tariffs/selective') return 'Tarif Selektif'
    if (pathname?.startsWith('/customers/') && pathname !== '/customers') return 'Detail Pelanggan'
    return menuItems.find((item) => pathname === item.href)?.label || 'SABAMAS'
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        <div className="text-center">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-indigo-200 border-t-indigo-600 mx-auto"></div>
            <div className="absolute inset-0 rounded-full h-16 w-16 border-4 border-transparent border-r-purple-600 animate-ping mx-auto opacity-20"></div>
          </div>
          <p className="mt-6 text-gray-600 font-medium">Memuat...</p>
        </div>
      </div>
    )
  }

  if (!user) return null

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
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

      {/* Sidebar - Professional Light Theme */}
      <motion.aside
        className={`fixed inset-y-0 left-0 z-50 bg-white/80 backdrop-blur-xl border-r border-gray-200/50 shadow-2xl lg:shadow-none transition-all duration-300 ease-in-out lg:translate-x-0 ${isMinimized ? 'w-24' : 'w-72'
          } ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <div className="flex flex-col h-full">
          {/* Logo Section */}
          <div className={`relative flex items-center h-20 ${isMinimized ? 'justify-center px-0' : 'justify-between px-6'}`}>
            <Link href="/dashboard" className={`flex items-center gap-3 group ${isMinimized ? 'justify-center w-full' : ''}`}>
              <div className="relative w-10 h-10 flex items-center justify-center flex-shrink-0">
                <img
                  src="/assets/images/resources/logo-1.png"
                  alt="Logo"
                  className="w-full h-full object-contain"
                />
              </div>

              {!isMinimized && (
                <div className="min-w-0">
                  <h1 className="text-lg font-bold text-slate-900 tracking-tight leading-none mb-0.5 group-hover:text-emerald-600 transition-colors">
                    SABAMAS
                  </h1>
                  <p className="text-[11px] font-medium text-emerald-600 uppercase tracking-widest bg-emerald-50 px-1.5 py-0.5 rounded-md w-fit">
                    Admin Portal
                  </p>
                </div>
              )}
            </Link>

            {/* Mobile Close Button */}
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-lg transition-colors absolute right-4"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Desktop Minimize Toggle */}
            <button
              onClick={() => setIsMinimized(!isMinimized)}
              className="hidden lg:flex absolute -right-3 top-7 w-6 h-6 bg-white border border-slate-200 rounded-full items-center justify-center text-slate-400 hover:text-blue-600 shadow-sm z-50 cursor-pointer"
            >
              {isMinimized ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
            {!isMinimized && <p className="px-4 text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Menu Utama</p>}

            {menuItems.map((item) => {
              const Icon = item.icon
              const isExactMatch = pathname === item.href
              const isSubPathMatch = pathname?.startsWith(item.href + '/')
              const isMoreSpecificMatch = menuItems.some(other =>
                other.href !== item.href &&
                other.href.startsWith(item.href + '/') &&
                (pathname === other.href || pathname?.startsWith(other.href + '/'))
              )
              const isActive = isExactMatch || (isSubPathMatch && !isMoreSpecificMatch)

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  title={isMinimized ? item.label : undefined}
                  className={`relative flex items-center ${isMinimized ? 'justify-center px-0' : 'px-4'} py-3.5 rounded-2xl transition-all duration-300 group overflow-hidden ${isActive
                    ? 'bg-gray-900 text-white shadow-lg shadow-gray-900/20'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                  onClick={() => setSidebarOpen(false)}
                >
                  <div className="flex-shrink-0 relative z-10">
                    <Icon className={`w-5 h-5 transition-colors ${isActive ? 'text-white' : 'text-gray-500 group-hover:text-gray-900'}`} />
                  </div>

                  {!isMinimized && (
                    <>
                      <span className="ml-3 font-medium relative z-10 truncate flex-1">{item.label}</span>

                      {/* Badge */}
                      {item.badge && (
                        <span className="ml-2 px-2 py-0.5 text-[10px] font-bold bg-red-500 text-white rounded-full relative z-10">
                          {item.badge}
                        </span>
                      )}

                      {isActive && (
                        <motion.div
                          layoutId="activeTab"
                          className="absolute inset-0 bg-gray-900 rounded-2xl -z-0"
                          transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                        />
                      )}

                      {!isActive && (
                        <ChevronRight className="w-4 h-4 ml-auto opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all text-gray-400 relative z-10" />
                      )}
                    </>
                  )}

                  {isMinimized && isActive && (
                    <motion.div
                      layoutId="activeTabMinimized"
                      className="absolute inset-0 bg-gray-900 rounded-2xl -z-0"
                      transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                    />
                  )}
                </Link>
              )
            })}
          </nav>
        </div>
      </motion.aside>

      {/* Main Content */}
      <div className={`transition-all duration-300 ease-in-out ${isMinimized ? 'lg:pl-28' : 'lg:pl-72'}`}>
        {/* Top Bar */}
        <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-2xl border-b border-gray-200/50 shadow-lg">
          <div className="flex items-center justify-between px-6 py-3">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden p-2.5 text-gray-500 hover:text-gray-700 hover:bg-gradient-to-br hover:from-blue-50 hover:to-indigo-50 rounded-xl transition-all duration-200 hover:shadow-md hover:scale-105"
              >
                <Menu className="w-6 h-6" />
              </button>
              <div>
                <h1 className="text-xl font-extrabold bg-gradient-to-r from-gray-900 via-blue-900 to-indigo-900 bg-clip-text text-transparent">
                  {getPageTitle()}
                </h1>
                <p className="text-sm text-gray-500 hidden sm:block font-medium mt-0.5">
                  {new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </p>
              </div>
            </div>

            {/* Header actions */}
            <div className="flex items-center gap-3">
              <div className="hidden md:flex items-center gap-3 px-5 py-2.5 bg-gradient-to-r from-emerald-50 via-green-50 to-teal-50 rounded-2xl border border-emerald-200/50 shadow-md">
                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse shadow-lg shadow-emerald-500/50" />
                <span className="text-sm font-bold text-emerald-700">Sistem Aktif</span>
              </div>

              <div className="h-8 w-[1px] bg-slate-200 mx-1 hidden md:block"></div>

              {/* User Profile in Header */}
              <div className="flex items-center gap-3 pl-2">
                <div className="text-right hidden sm:block">
                  <p className="text-sm font-bold text-slate-900">{user.nama}</p>
                  <p className="text-xs text-slate-500">Administrator</p>
                </div>
                <div className="relative">
                  <button
                    onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                    onBlur={() => setTimeout(() => setProfileDropdownOpen(false), 200)}
                    className="relative w-10 h-10 rounded-full overflow-hidden bg-white border-2 border-slate-100 hover:border-blue-200 transition-colors focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
                  >
                    <img
                      src="/assets/images/resources/logo-1.png"
                      alt="Profile"
                      className="w-full h-full object-contain p-1"
                    />
                  </button>

                  {/* Dropdown Menu */}
                  {profileDropdownOpen && (
                    <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl shadow-xl shadow-slate-200/50 border border-slate-100 py-1 transition-all duration-200 transform origin-top-right z-50 animate-in fade-in zoom-in-95">
                      <div className="px-4 py-3 border-b border-slate-50 sm:hidden">
                        <p className="text-sm font-bold text-slate-900 truncate">{user.nama}</p>
                        <p className="text-xs text-slate-500 truncate">{user.email}</p>
                      </div>
                      <Link
                        href="/settings"
                        onClick={() => setProfileDropdownOpen(false)}
                        className="flex items-center gap-2 px-4 py-2.5 text-sm text-slate-600 hover:bg-slate-50 hover:text-blue-600 transition-colors"
                      >
                        <Settings className="w-4 h-4" />
                        Pengaturan
                      </Link>
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-rose-600 hover:bg-rose-50 transition-colors"
                      >
                        <LogOut className="w-4 h-4" />
                        Keluar
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-4 text-sm">
          {children}
        </main>
      </div>
    </div>
  )
}
