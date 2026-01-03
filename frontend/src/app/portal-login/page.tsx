'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { authApi, settingsApi } from '@/lib/api'
import Link from 'next/link'
import Image from 'next/image'
import { Eye, EyeOff, Loader2, ArrowRight, UserCircle, CheckCircle2, CreditCard, Clock, Smartphone, Leaf } from 'lucide-react'

import { Capacitor } from '@capacitor/core'

export default function PortalLoginPage() {
  const router = useRouter()
  const [identifier, setIdentifier] = useState('')
  const [loginKey, setLoginKey] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showPin, setShowPin] = useState(false)

  const isNative = Capacitor.isNativePlatform()

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
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const { data } = await authApi.customerLogin(identifier, loginKey)

      // Save to localStorage
      localStorage.setItem('token', data.access_token)
      localStorage.setItem('user', JSON.stringify(data.user))

      // Redirect to portal dashboard
      router.push('/portal/dashboard')
    } catch (err: any) {
      console.error('Portal Login Error:', err)
      const errorMessage = err.response?.data?.message || err.message || 'Login gagal. Periksa ID/Nomor Telepon dan PIN Anda.'
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-5 bg-slate-50">
      {/* Left Column - Login Form */}
      <div className="lg:col-span-2 flex items-center justify-center p-6 lg:p-12 relative overflow-hidden bg-white shadow-xl z-20">
        {/* Background Pattern */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-brote-base/5 rounded-full blur-[60px] -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-brote-primary/10 rounded-full blur-[60px] translate-y-1/2 -translate-x-1/2 pointer-events-none"></div>

        <div className="w-full max-w-md animate-in fade-in slide-in-from-left-8 duration-700 relative z-10">
          {/* Logo & Title */}
          <div className="text-center mb-10">
            <Link href="/" className="inline-block group">
              <div className="flex justify-center mb-6 transition-transform group-hover:scale-105 duration-300">
                {settings?.logo ? (
                  <div className="w-24 h-24 relative">
                    <img
                      src={`${(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001').replace(/\/api\/?$/, '')}${settings.logo}?t=${new Date().getTime()}`}
                      alt="Logo"
                      className="w-full h-full object-contain drop-shadow-md"
                    />
                  </div>
                ) : (
                  <div className="w-20 h-20 bg-brote-base/5 rounded-2xl flex items-center justify-center text-brote-base shadow-sm ring-4 ring-white">
                    <Leaf className="w-10 h-10" />
                  </div>
                )}
              </div>
            </Link>

            <h1 className="text-3xl font-bold text-brote-base mb-2 font-jakarta">
              SABAMAS
            </h1>
            <div className="flex items-center justify-center gap-2 mb-2">
              <div className="h-px w-8 bg-gray-200"></div>
              <p className="text-brote-primary font-bold tracking-widest text-xs uppercase">Portal Pelanggan</p>
              <div className="h-px w-8 bg-gray-200"></div>
            </div>
          </div>

          {/* Login Form */}
          <div className="space-y-6">
            <div className="mb-6 text-center">
              <h2 className="text-2xl font-bold text-gray-800">Selamat Datang</h2>
              <p className="text-brote-gray text-sm mt-1">Masuk untuk mengecek tagihan & pembayaran.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <div className="bg-red-50 border border-red-100 text-red-600 px-4 py-3 rounded-lg text-sm flex items-center gap-3 animate-in slide-in-from-top-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0"></div>
                  <span>{error}</span>
                </div>
              )}

              <div className="space-y-2">
                <label htmlFor="identifier" className="block text-sm font-semibold text-gray-700 ml-1">
                  Nomor Pelanggan / HP
                </label>
                <div className="relative group">
                  <input
                    id="identifier"
                    type="text"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    className="w-full px-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brote-base/20 focus:border-brote-base transition-all text-gray-900 placeholder-gray-400 outline-none hover:border-gray-300"
                    placeholder="Contoh: 081234567890"
                    name="identifier"
                    autoComplete="username"
                    required
                    disabled={loading}
                  />
                  <UserCircle className="w-5 h-5 text-gray-400 absolute right-4 top-1/2 -translate-y-1/2" />
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="loginKey" className="block text-sm font-semibold text-gray-700 ml-1">
                  PIN
                </label>
                <div className="relative group">
                  <input
                    id="loginKey"
                    type={showPin ? "text" : "password"}
                    value={loginKey}
                    onChange={(e) => setLoginKey(e.target.value)}
                    className="w-full px-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brote-base/20 focus:border-brote-base transition-all text-gray-900 placeholder-gray-400 outline-none pr-12 hover:border-gray-300"
                    placeholder="Masukkan PIN"
                    name="loginKey"
                    autoComplete="current-password"
                    required
                    disabled={loading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPin(!showPin)}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    {showPin ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-brote-secondary hover:bg-brote-base text-white font-bold py-3.5 px-6 rounded-xl transition-all duration-200 shadow-lg shadow-brote-base/20 hover:shadow-brote-base/30 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 group bg-gradient-to-r from-brote-base to-blue-700"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Memproses...
                    </>
                  ) : (
                    <>
                      Masuk Portal
                      <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </button>
              </div>
            </form>

            {/* Admin Link - Hide on Mobile App */}
            {!isNative && (
              <div className="mt-8 pt-6 border-t border-gray-100 text-center">
                <Link
                  href="/login"
                  className="text-brote-gray hover:text-brote-base text-sm font-medium transition-colors inline-flex items-center gap-2 group"
                >
                  <ArrowRight className="w-4 h-4 rotate-180 group-hover:-translate-x-1 transition-transform" />
                  <span>Login sebagai Admin</span>
                </Link>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="mt-8 text-center">
            <p className="text-xs text-brote-gray/60">
              &copy; {new Date().getFullYear()} SABAMAS. All rights reserved.
            </p>
          </div>
        </div>
      </div>

      {/* Right Column - Hero Section */}
      <div className="hidden lg:flex lg:col-span-3 relative overflow-hidden bg-brote-base">
        {/* Background Image */}
        <div className="absolute inset-0">
          <Image
            src="/assets/images/backgrounds/main-slider-2-2.jpg"
            alt="Customer Service"
            fill
            priority
            sizes="(max-width: 1024px) 0vw, 60vw"
            className="object-cover"
          />
          {/* Gradients/Overlays */}
          <div className="absolute inset-0 bg-brote-base/80 mix-blend-multiply"></div>
          <div className="absolute inset-0 bg-gradient-to-bl from-brote-base/90 via-transparent to-transparent opacity-60"></div>
        </div>

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-center px-16 py-12 text-white animate-in fade-in slide-in-from-right-8 duration-700 h-full">
          <div className="max-w-xl ml-auto text-right">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full mb-8 ml-auto">
              <div className="w-2 h-2 bg-brote-primary rounded-full animate-pulse"></div>
              <span className="text-sm font-semibold">Layanan Digital 24/7</span>
            </div>

            {/* Main Heading */}
            <h2 className="text-5xl font-black leading-tight mb-6">
              Kemudahan <br />
              <span className="text-brote-primary">Pembayaran Online</span>
            </h2>

            <p className="text-xl text-white/90 mb-12 leading-relaxed">
              Kelola tagihan retribusi sampah Anda dengan mudah, cepat, dan transparan melalui portal digital kami.
            </p>

            {/* Features */}
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm hover:bg-white/10 transition-colors text-right">
                <CreditCard className="w-8 h-8 text-brote-primary mb-3 ml-auto" />
                <h3 className="font-bold text-lg">Cek Tagihan</h3>
                <p className="text-sm text-white/70">Info tagihan real-time</p>
              </div>
              <div className="p-4 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm hover:bg-white/10 transition-colors text-right">
                <Smartphone className="w-8 h-8 text-brote-primary mb-3 ml-auto" />
                <h3 className="font-bold text-lg">Akses Mudah</h3>
                <p className="text-sm text-white/70">Dari HP atau Laptop</p>
              </div>
              <div className="p-4 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm hover:bg-white/10 transition-colors text-right">
                <Clock className="w-8 h-8 text-brote-primary mb-3 ml-auto" />
                <h3 className="font-bold text-lg">Riwayat</h3>
                <p className="text-sm text-white/70">Catatan pembayaran lengkap</p>
              </div>
              <div className="p-4 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm hover:bg-white/10 transition-colors text-right">
                <CheckCircle2 className="w-8 h-8 text-brote-primary mb-3 ml-auto" />
                <h3 className="font-bold text-lg">Aman</h3>
                <p className="text-sm text-white/70">Data terenkripsi & privat</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
