'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  ArrowRight,
  Truck,
  Recycle,
  Users,
  Leaf,
  Phone,
  Mail,
  MapPin,
  Menu,
  X,
  ChevronRight,
  LogIn
} from 'lucide-react'
import Button from '@/components/ui/Button'

export default function Home() {
  const router = useRouter()
  const [isScrolled, setIsScrolled] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  // Handle scroll effect for navbar
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' })
      setMobileMenuOpen(false)
    }
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav
        className={`fixed w-full z-50 transition-all duration-300 ${isScrolled ? 'bg-white/90 backdrop-blur-md shadow-sm py-4' : 'bg-transparent py-6'
          }`}
      >
        <div className="container mx-auto px-4 md:px-6">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <div className="flex items-center space-x-2">
              <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                <Leaf className="w-6 h-6 text-white" />
              </div>
              <span className={`text-2xl font-bold ${isScrolled ? 'text-gray-900' : 'text-gray-900'}`}>
                SABAMAS
              </span>
            </div>

            {/* Desktop Menu */}
            <div className="hidden md:flex items-center space-x-8">
              <button onClick={() => scrollToSection('home')} className="text-gray-600 hover:text-primary font-medium transition">Beranda</button>
              <button onClick={() => scrollToSection('services')} className="text-gray-600 hover:text-primary font-medium transition">Layanan</button>
              <button onClick={() => scrollToSection('about')} className="text-gray-600 hover:text-primary font-medium transition">Tentang Kami</button>
              <button onClick={() => scrollToSection('contact')} className="text-gray-600 hover:text-primary font-medium transition">Kontak</button>
            </div>

            {/* Auth Buttons */}
            <div className="hidden md:flex items-center space-x-3">
              <Link href="/portal-login">
                <Button variant="ghost" className="text-gray-600 hover:text-primary">
                  Masuk Pelanggan
                </Button>
              </Link>
              <Link href="/login">
                <Button className="bg-primary hover:bg-primary-600 text-white px-6">
                  <LogIn className="w-4 h-4 mr-2" />
                  Login Admin
                </Button>
              </Link>
            </div>

            {/* Mobile Menu Button */}
            <button
              className="md:hidden text-gray-900"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu Overlay */}
        {mobileMenuOpen && (
          <div className="absolute top-full left-0 w-full bg-white shadow-lg py-4 px-4 flex flex-col space-y-4 md:hidden">
            <button onClick={() => scrollToSection('home')} className="text-left text-gray-600 font-medium py-2">Beranda</button>
            <button onClick={() => scrollToSection('services')} className="text-left text-gray-600 font-medium py-2">Layanan</button>
            <button onClick={() => scrollToSection('about')} className="text-left text-gray-600 font-medium py-2">Tentang Kami</button>
            <button onClick={() => scrollToSection('contact')} className="text-left text-gray-600 font-medium py-2">Kontak</button>
            <div className="border-t border-gray-100 pt-4 flex flex-col space-y-3">
              <Link href="/portal-login" className="w-full">
                <Button variant="secondary" className="w-full justify-center">
                  Masuk Pelanggan
                </Button>
              </Link>
              <Link href="/login" className="w-full">
                <Button className="w-full justify-center">
                  Login Admin
                </Button>
              </Link>
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section id="home" className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-green-100/50 via-transparent to-transparent"></div>
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_bottom_left,_var(--tw-gradient-stops))] from-blue-100/50 via-transparent to-transparent"></div>

        <div className="container mx-auto px-4 md:px-6">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center px-3 py-1 rounded-full bg-green-100 text-green-800 text-sm font-medium mb-6 animate-fade-in-up">
              <Leaf className="w-4 h-4 mr-2" />
              Solusi Kebersihan Terpercaya
            </div>
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight animate-fade-in-up delay-100">
              Mewujudkan Lingkungan <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-blue-600">
                Bersih & Sehat
              </span>
            </h1>
            <p className="text-lg md:text-xl text-gray-600 mb-10 leading-relaxed animate-fade-in-up delay-200">
              SABAMAS hadir sebagai mitra pengelolaan sampah profesional untuk menciptakan lingkungan yang lebih baik bagi masyarakat dan generasi masa depan.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-4 animate-fade-in-up delay-300">
              <Link href="/portal-login">
                <Button size="lg" className="w-full sm:w-auto px-8 py-4 text-lg shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-all">
                  Cek Tagihan Saya
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>
              <button onClick={() => scrollToSection('services')} className="w-full sm:w-auto px-8 py-4 text-lg font-medium text-gray-600 hover:text-primary transition flex items-center justify-center">
                Pelajari Layanan
                <ChevronRight className="w-5 h-5 ml-1" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 border-y border-gray-100 bg-gray-50/50">
        <div className="container mx-auto px-4 md:px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="text-center">
              <p className="text-4xl font-bold text-primary mb-2">1000+</p>
              <p className="text-gray-600">Pelanggan Aktif</p>
            </div>
            <div className="text-center">
              <p className="text-4xl font-bold text-blue-600 mb-2">50+</p>
              <p className="text-gray-600">Wilayah Layanan</p>
            </div>
            <div className="text-center">
              <p className="text-4xl font-bold text-green-600 mb-2">24/7</p>
              <p className="text-gray-600">Layanan Siaga</p>
            </div>
            <div className="text-center">
              <p className="text-4xl font-bold text-orange-500 mb-2">100%</p>
              <p className="text-gray-600">Komitmen Bersih</p>
            </div>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section id="services" className="py-20 bg-white">
        <div className="container mx-auto px-4 md:px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Layanan Kami</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Kami menyediakan berbagai layanan pengelolaan sampah yang terintegrasi untuk memenuhi kebutuhan rumah tangga dan bisnis Anda.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Service 1 */}
            <div className="group p-8 rounded-2xl bg-white border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
              <div className="w-14 h-14 bg-green-50 rounded-xl flex items-center justify-center mb-6 group-hover:bg-primary group-hover:text-white transition-colors">
                <Truck className="w-8 h-8 text-primary group-hover:text-white transition-colors" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Pengangkutan Sampah</h3>
              <p className="text-gray-600 leading-relaxed">
                Layanan pengangkutan sampah rutin terjadwal dari rumah ke rumah dengan armada yang memadai dan tim profesional.
              </p>
            </div>

            {/* Service 2 */}
            <div className="group p-8 rounded-2xl bg-white border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
              <div className="w-14 h-14 bg-blue-50 rounded-xl flex items-center justify-center mb-6 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                <Recycle className="w-8 h-8 text-blue-600 group-hover:text-white transition-colors" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Program Daur Ulang</h3>
              <p className="text-gray-600 leading-relaxed">
                Pengelolaan sampah terpilah untuk didaur ulang, mendukung ekonomi sirkular dan mengurangi beban TPA.
              </p>
            </div>

            {/* Service 3 */}
            <div className="group p-8 rounded-2xl bg-white border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
              <div className="w-14 h-14 bg-orange-50 rounded-xl flex items-center justify-center mb-6 group-hover:bg-orange-500 group-hover:text-white transition-colors">
                <Users className="w-8 h-8 text-orange-500 group-hover:text-white transition-colors" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Pemberdayaan Warga</h3>
              <p className="text-gray-600 leading-relaxed">
                Melibatkan masyarakat lokal dalam pengelolaan kebersihan lingkungan untuk menciptakan dampak sosial positif.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="py-20 bg-gray-50">
        <div className="container mx-auto px-4 md:px-6">
          <div className="flex flex-col md:flex-row items-center gap-12">
            <div className="w-full md:w-1/2">
              <div className="relative">
                <div className="absolute -top-4 -left-4 w-24 h-24 bg-primary/10 rounded-full blur-2xl"></div>
                <div className="absolute -bottom-4 -right-4 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl"></div>
                <div className="relative bg-white p-8 rounded-2xl shadow-lg border border-gray-100">
                  <div className="aspect-video bg-gray-200 rounded-lg mb-6 flex items-center justify-center">
                    <Leaf className="w-16 h-16 text-gray-400" />
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="flex-1">
                      <p className="text-3xl font-bold text-gray-900">10+</p>
                      <p className="text-sm text-gray-500">Tahun Pengalaman</p>
                    </div>
                    <div className="w-px h-12 bg-gray-200"></div>
                    <div className="flex-1">
                      <p className="text-3xl font-bold text-gray-900">5k+</p>
                      <p className="text-sm text-gray-500">Ton Sampah Dikelola</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="w-full md:w-1/2">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
                Tentang SABAMAS
              </h2>
              <p className="text-lg text-gray-600 mb-6 leading-relaxed">
                SABAMAS (Sahabat Bersih Masyarakat) adalah inisiatif pengelolaan sampah yang berfokus pada pelayanan prima dan keberlanjutan lingkungan. Kami percaya bahwa lingkungan yang bersih adalah hak setiap warga.
              </p>
              <p className="text-lg text-gray-600 mb-8 leading-relaxed">
                Dengan dukungan teknologi dan tim yang berdedikasi, kami terus berinovasi untuk memberikan solusi pengelolaan sampah yang efisien, transparan, dan ramah lingkungan.
              </p>
              {/* Read more button */}
              <Button variant="outline" className="border-primary text-primary hover:bg-primary hover:text-white">
                Baca Selengkapnya
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-primary overflow-hidden relative">
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 bg-white/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-80 h-80 bg-black/10 rounded-full blur-3xl"></div>

        <div className="container mx-auto px-4 md:px-6 relative z-10 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            Siap Mewujudkan Lingkungan Bersih?
          </h2>
          <p className="text-xl text-green-50 mb-10 max-w-2xl mx-auto">
            Bergabunglah dengan ribuan pelanggan kami yang telah merasakan kenyamanan layanan SABAMAS.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-4">
            <Link href="/portal-login">
              <Button size="lg" className="bg-white text-primary hover:bg-gray-100 w-full sm:w-auto">
                Daftar Sekarang
              </Button>
            </Link>
            <button onClick={() => scrollToSection('contact')} className="text-white border border-white/30 hover:bg-white/10 px-8 py-3 rounded-lg font-medium transition w-full sm:w-auto">
              Hubungi Kami
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer id="contact" className="bg-gray-900 text-white pt-20 pb-10">
        <div className="container mx-auto px-4 md:px-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center space-x-2 mb-6">
                <div className="w-8 h-8 bg-primary rounded flex items-center justify-center">
                  <Leaf className="w-5 h-5 text-white" />
                </div>
                <span className="text-2xl font-bold">SABAMAS</span>
              </div>
              <p className="text-gray-400 mb-8 max-w-md leading-relaxed">
                Solusi pengelolaan sampah terpadu untuk lingkungan yang lebih bersih, sehat, dan nyaman bagi kita semua.
              </p>
              <div className="flex space-x-4">
                {/* Social Media Placeholders */}
                <div className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center hover:bg-primary transition cursor-pointer">
                  <span className="font-bold">FB</span>
                </div>
                <div className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center hover:bg-primary transition cursor-pointer">
                  <span className="font-bold">IG</span>
                </div>
                <div className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center hover:bg-primary transition cursor-pointer">
                  <span className="font-bold">WA</span>
                </div>
              </div>
            </div>

            <div>
              <h4 className="text-lg font-bold mb-6">Tautan Cepat</h4>
              <ul className="space-y-4">
                <li><button onClick={() => scrollToSection('home')} className="text-gray-400 hover:text-primary transition">Beranda</button></li>
                <li><button onClick={() => scrollToSection('services')} className="text-gray-400 hover:text-primary transition">Layanan</button></li>
                <li><button onClick={() => scrollToSection('about')} className="text-gray-400 hover:text-primary transition">Tentang Kami</button></li>
                <li><Link href="/portal-login" className="text-gray-400 hover:text-primary transition">Portal Pelanggan</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="text-lg font-bold mb-6">Kontak</h4>
              <ul className="space-y-4">
                <li className="flex items-start space-x-3">
                  <MapPin className="w-5 h-5 text-primary mt-1" />
                  <span className="text-gray-400">Jl. Raya Utama No. 123, Kota Bersih, Indonesia</span>
                </li>
                <li className="flex items-center space-x-3">
                  <Phone className="w-5 h-5 text-primary" />
                  <span className="text-gray-400">+62 812-3456-7890</span>
                </li>
                <li className="flex items-center space-x-3">
                  <Mail className="w-5 h-5 text-primary" />
                  <span className="text-gray-400">info@sabamas.id</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 pt-8 text-center">
            <p className="text-gray-500">
              &copy; {new Date().getFullYear()} SABAMAS. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
