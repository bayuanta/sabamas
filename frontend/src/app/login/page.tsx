'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { authApi, settingsApi } from '@/lib/api'
import Link from 'next/link'
import Image from 'next/image'
import { Eye, EyeOff, Loader2, ArrowRight, ShieldCheck, CheckCircle2, BarChart3, Users, Leaf } from 'lucide-react'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showPassword, setShowPassword] = useState(false)

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
      const { data } = await authApi.login(email, password)

      // Save to localStorage
      localStorage.setItem('token', data.access_token)
      localStorage.setItem('user', JSON.stringify(data.user))

      // Redirect to dashboard
      router.push('/dashboard')
    } catch (err: any) {
      setError(err.response?.data?.message || 'Login gagal. Periksa email dan password Anda.')
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
                  <div className="w-20 h-20 bg-brote-base/5 rounded-2xl flex items-center justify-center text-brote-base shadow-sm">
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
              <p className="text-brote-primary font-bold tracking-widest text-xs uppercase">Admin Portal</p>
              <div className="h-px w-8 bg-gray-200"></div>
            </div>
          </div>

          {/* Login Form */}
          <div className="space-y-6">
            <div className="mb-6 text-center">
              <h2 className="text-2xl font-bold text-gray-800">Selamat Datang</h2>
              <p className="text-brote-gray text-sm mt-1">Masuk untuk mengelola sistem.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <div className="bg-red-50 border border-red-100 text-red-600 px-4 py-3 rounded-lg text-sm flex items-center gap-3 animate-in slide-in-from-top-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0"></div>
                  <span>{error}</span>
                </div>
              )}

              <div className="space-y-2">
                <label htmlFor="email" className="block text-sm font-semibold text-gray-700 ml-1">
                  Email Address
                </label>
                <div className="relative group">
                  <input
                    id="email"
                    name="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brote-base/20 focus:border-brote-base transition-all text-gray-800 placeholder-gray-400 outline-none hover:border-gray-300"
                    placeholder="admin@sabamas.com"
                    autoComplete="email"
                    required
                    disabled={loading}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="password" className="block text-sm font-semibold text-gray-700 ml-1">
                  Password
                </label>
                <div className="relative group">
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brote-base/20 focus:border-brote-base transition-all text-gray-800 placeholder-gray-400 outline-none pr-12 hover:border-gray-300"
                    placeholder="••••••••"
                    autoComplete="current-password"
                    required
                    disabled={loading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-brote-base hover:bg-blue-800 text-white font-bold py-3.5 px-6 rounded-xl transition-all duration-200 shadow-lg shadow-brote-base/20 hover:shadow-brote-base/30 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 group"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Memproses...
                    </>
                  ) : (
                    <>
                      Masuk Dashboard
                      <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" strokeWidth={2} />
                    </>
                  )}
                </button>
              </div>
            </form>

            {/* Portal Link */}
            <div className="mt-8 pt-6 border-t border-gray-100 text-center">
              <Link
                href="/portal-login"
                className="text-brote-gray hover:text-brote-base text-sm font-medium transition-colors inline-flex items-center gap-2 group"
              >
                <span>Login sebagai Pelanggan</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Right Column - Hero Section */}
      <div className="hidden lg:flex lg:col-span-3 relative overflow-hidden">
        {/* Background Image */}
        <div className="absolute inset-0">
          <Image
            src="/assets/images/backgrounds/main-slider-2-1.jpg"
            alt="Waste Management Service"
            fill
            priority
            sizes="(max-width: 1024px) 0vw, 60vw"
            className="object-cover"
          />
          {/* Gradients/Overlays */}
          <div className="absolute inset-0 bg-brote-base/80 mix-blend-multiply"></div>
          <div className="absolute inset-0 bg-gradient-to-t from-brote-base/90 via-transparent to-transparent opacity-60"></div>
        </div>

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-end px-20 py-20 text-white animate-in fade-in slide-in-from-right-8 duration-700 w-full h-full">
          <div className="max-w-2xl mb-10">
            <div className="inline-flex items-center gap-3 px-4 py-2 bg-white/20 backdrop-blur-md border border-white/20 rounded-full mb-6">
              <span className="w-2 h-2 rounded-full bg-brote-primary animate-pulse"></span>
              <span className="text-sm font-semibold tracking-wide text-white">SABAMAS Operational System</span>
            </div>
            <h2 className="text-5xl font-black leading-tight mb-6">
              Layanan Kebersihan & <br />
              <span className="text-brote-primary">Pengelolaan Sampah</span>
            </h2>
            <p className="text-xl text-white/90 leading-relaxed max-w-lg">
              Sistem terintegrasi untuk pemantauan retribusi sampah dan manajemen pelanggan yang efisien.
            </p>
          </div>

          {/* Features Mini Grid */}
          <div className="grid grid-cols-2 gap-4 max-w-xl">
            <div className="bg-white/10 backdrop-blur-sm p-4 rounded-xl border border-white/10">
              <BarChart3 className="w-6 h-6 text-brote-primary mb-2" />
              <h3 className="font-bold">Real-time Data</h3>
              <p className="text-xs text-white/80">Monitor operasional harian</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm p-4 rounded-xl border border-white/10">
              <Users className="w-6 h-6 text-brote-primary mb-2" />
              <h3 className="font-bold">Database Warga</h3>
              <p className="text-xs text-white/80">Manajemen pelanggan terpusat</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
