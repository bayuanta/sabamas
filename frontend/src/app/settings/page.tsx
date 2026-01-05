'use client'

import AdminLayout from '@/components/AdminLayout'
import { useState, useRef, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { customersApi, usersApi, settingsApi } from '@/lib/api'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import Input from '@/components/ui/Input'
import Modal from '@/components/ui/Modal'
import {
  Plus, Edit, Trash2, MapPin, Key, Image, Upload, Shield, AlertTriangle,
  CheckCircle, Info, Users, Mail, UserPlus, Settings, LayoutGrid, User, Eye, EyeOff
} from 'lucide-react'
import { toast } from 'react-hot-toast'

export default function SettingsPage() {
  const queryClient = useQueryClient()

  // Tabs State
  const [activeTab, setActiveTab] = useState<'general' | 'users' | 'account'>('general')

  // Modals State
  const [addModalOpen, setAddModalOpen] = useState(false)
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [passwordModalOpen, setPasswordModalOpen] = useState(false)

  // User Management State
  const [addUserModalOpen, setAddUserModalOpen] = useState(false)
  const [editUserModalOpen, setEditUserModalOpen] = useState(false)
  const [deleteUserModalOpen, setDeleteUserModalOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<any>(null)

  // Wilayah State
  const [selectedWilayah, setSelectedWilayah] = useState<string>('')
  const [newWilayah, setNewWilayah] = useState('')
  const [editWilayahName, setEditWilayahName] = useState('')

  // Account State
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [newEmail, setNewEmail] = useState('')
  const [emailPassword, setEmailPassword] = useState('') // Password verification for email change

  // Form Data
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })
  const [passwordError, setPasswordError] = useState('')

  const [userData, setUserData] = useState({
    nama: '',
    email: '',
    password: '',
    role: 'admin',
    status: 'aktif'
  })

  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [logoPreview, setLogoPreview] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Initialize current user
  useEffect(() => {
    const userStr = localStorage.getItem('user')
    if (userStr) {
      try {
        const user = JSON.parse(userStr)
        setCurrentUser(user)
        setNewEmail(user.email)
      } catch (e) {
        console.error('Failed to parse user', e)
      }
    }
  }, [])

  // --- QUERIES ---

  const { data: settings } = useQuery({
    queryKey: ['settings'],
    queryFn: async () => {
      const { data } = await settingsApi.get()
      return data
    },
  })

  const { data: wilayahList, isLoading: wilayahLoading } = useQuery({
    queryKey: ['wilayah-list'],
    queryFn: async () => {
      const { data } = await customersApi.getWilayahList()
      return data
    },
  })

  const { data: customers } = useQuery({
    queryKey: ['customers-all'],
    queryFn: async () => {
      const { data } = await customersApi.getAll({ limit: 1000 })
      return data
    },
  })

  const { data: users, isLoading: usersLoading } = useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const { data } = await usersApi.getAll()
      return data
    },
    enabled: activeTab === 'users'
  })

  // --- MUTATIONS ---

  // Wilayah Mutations
  const handleAddWilayah = async () => {
    if (!newWilayah.trim()) return
    try {
      await customersApi.createWilayah(newWilayah)
      queryClient.invalidateQueries({ queryKey: ['wilayah-list'] })
      setAddModalOpen(false)
      setNewWilayah('')
      toast.success('Wilayah berhasil ditambahkan')
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Gagal menambahkan wilayah')
    }
  }

  const handleEditWilayah = async () => {
    if (!editWilayahName.trim() || !selectedWilayah) return
    try {
      await customersApi.updateWilayah(selectedWilayah, editWilayahName)
      queryClient.invalidateQueries({ queryKey: ['wilayah-list'] })
      queryClient.invalidateQueries({ queryKey: ['customers-all'] })
      setEditModalOpen(false)
      setSelectedWilayah('')
      setEditWilayahName('')
      toast.success('Wilayah berhasil diperbarui')
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Gagal mengubah wilayah')
    }
  }

  const handleDeleteWilayah = async () => {
    if (!selectedWilayah) return
    try {
      await customersApi.deleteWilayah(selectedWilayah)
      queryClient.invalidateQueries({ queryKey: ['wilayah-list'] })
      setDeleteModalOpen(false)
      setSelectedWilayah('')
      toast.success('Wilayah berhasil dihapus')
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Gagal menghapus wilayah')
    }
  }

  // Account Mutations
  const changePasswordMutation = useMutation({
    mutationFn: (data: { currentPassword: string; newPassword: string }) =>
      usersApi.changePassword(data),
    onSuccess: () => {
      toast.success('Password berhasil diubah!')
      setPasswordModalOpen(false)
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' })
      setPasswordError('')
    },
    onError: (error: any) => {
      setPasswordError(error.response?.data?.message || 'Gagal mengubah password')
    },
  })

  const updateEmailMutation = useMutation({
    mutationFn: (data: { email: string }) =>
      usersApi.update(currentUser.id, data),
    onSuccess: (response) => {
      toast.success('Email berhasil diperbarui')
      // Update local storage
      const updatedUser = { ...currentUser, email: response.data.email }
      localStorage.setItem('user', JSON.stringify(updatedUser))
      setCurrentUser(updatedUser)
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Gagal memperbarui email')
    }
  })

  const handleUpdateEmail = () => {
    if (!newEmail || !newEmail.includes('@')) {
      toast.error('Email tidak valid')
      return
    }
    if (newEmail === currentUser.email) return

    if (confirm('Apakah Anda yakin ingin mengubah email? Anda akan menggunakan email baru untuk login selanjutnya.')) {
      updateEmailMutation.mutate({ email: newEmail })
    }
  }

  // Logo Mutation
  const uploadLogoMutation = useMutation({
    mutationFn: (file: File) => settingsApi.uploadLogo(file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] })
      toast.success('Logo berhasil diupload!')
      setLogoFile(null)
      setLogoPreview(null)
      if (fileInputRef.current) fileInputRef.current.value = ''
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Gagal upload logo')
    },
  })

  // User Management Mutations
  const createUserMutation = useMutation({
    mutationFn: (data: any) => usersApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
      setAddUserModalOpen(false)
      setUserData({ nama: '', email: '', password: '', role: 'admin', status: 'aktif' })
      toast.success('Pengguna berhasil ditambahkan')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Gagal menambahkan pengguna')
    }
  })

  const updateUserMutation = useMutation({
    mutationFn: (data: { id: string, payload: any }) => usersApi.update(data.id, data.payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
      setEditUserModalOpen(false)
      setSelectedUser(null)
      toast.success('Pengguna berhasil diperbarui')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Gagal memperbarui pengguna')
    }
  })

  const deleteUserMutation = useMutation({
    mutationFn: (id: string) => usersApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
      setDeleteUserModalOpen(false)
      setSelectedUser(null)
      toast.success('Pengguna berhasil dihapus')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Gagal menghapus pengguna')
    }
  })

  // --- HANDLERS ---

  const getCustomerCount = (wilayah: string) => {
    return customers?.data?.filter((c: any) => c.wilayah === wilayah).length || 0
  }

  const handleChangePassword = () => {
    setPasswordError('')
    if (!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
      setPasswordError('Semua field harus diisi')
      return
    }
    if (passwordData.newPassword.length < 6) {
      setPasswordError('Password baru minimal 6 karakter')
      return
    }
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordError('Password baru dan konfirmasi tidak cocok')
      return
    }
    changePasswordMutation.mutate({
      currentPassword: passwordData.currentPassword,
      newPassword: passwordData.newPassword,
    })
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (!file.type.match(/image\/(jpg|jpeg|png|gif|svg\+xml)/)) {
        toast.error('Hanya file gambar yang diperbolehkan')
        return
      }
      if (file.size > 2 * 1024 * 1024) {
        toast.error('Ukuran file maksimal 2MB')
        return
      }
      setLogoFile(file)
      const reader = new FileReader()
      reader.onloadend = () => setLogoPreview(reader.result as string)
      reader.readAsDataURL(file)
    }
  }

  // --- RENDER SECTIONS ---

  const renderGeneralSettings = () => (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Logo Section */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100 bg-gray-50/50">
          <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <Image className="w-5 h-5 text-blue-500" />
            Logo Aplikasi
          </h3>
        </div>
        <div className="p-6 space-y-6">
          <div className="bg-gray-50 border-2 border-dashed border-gray-200 rounded-xl p-6 flex items-center justify-center h-48 relative group">
            {logoPreview ? (
              <img src={logoPreview} alt="Preview" className="max-h-32 object-contain" />
            ) : settings?.logo ? (
              <img src={`${process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:3001'}${settings.logo}`} alt="Current Logo" className="max-h-32 object-contain" />
            ) : (
              <div className="text-center text-gray-400">
                <Image className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Belum ada logo</p>
              </div>
            )}
          </div>
          <div className="flex gap-4">
            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileChange} className="hidden" id="logo-upload" />
            <label htmlFor="logo-upload" className="flex-1 cursor-pointer bg-white border border-gray-300 hover:border-blue-500 hover:bg-blue-50 text-gray-700 font-medium py-2.5 px-4 rounded-xl text-center transition-all flex items-center justify-center gap-2">
              <Upload className="w-4 h-4" /> Pilih Logo
            </label>
            {logoFile && (
              <Button onClick={() => uploadLogoMutation.mutate(logoFile)} isLoading={uploadLogoMutation.isPending} className="px-6">
                Upload
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Wilayah Section */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
          <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <MapPin className="w-5 h-5 text-red-500" />
            Daftar Wilayah
          </h3>
          <Button size="sm" onClick={() => setAddModalOpen(true)} className="bg-white border border-gray-200 text-gray-700 hover:bg-gray-50">
            <Plus className="w-4 h-4 mr-2" /> Tambah
          </Button>
        </div>
        <div className="p-6 max-h-[500px] overflow-y-auto custom-scrollbar">
          {wilayahLoading ? (
            <div className="flex justify-center p-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>
          ) : wilayahList && wilayahList.length > 0 ? (
            <div className="grid grid-cols-1 gap-3">
              {wilayahList.map((wilayah: string) => (
                <div key={wilayah} className="flex items-center justify-between p-3 border border-gray-200 rounded-xl hover:border-blue-300 hover:shadow-sm bg-white transition-all">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-red-50 flex items-center justify-center text-red-500"><MapPin className="w-4 h-4" /></div>
                    <div>
                      <p className="font-bold text-gray-900 text-sm">{wilayah}</p>
                      <p className="text-xs text-gray-500">{getCustomerCount(wilayah)} pelanggan</p>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => { setSelectedWilayah(wilayah); setEditWilayahName(wilayah); setEditModalOpen(true); }} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg"><Edit className="w-4 h-4" /></button>
                    <button onClick={() => { setSelectedWilayah(wilayah); setDeleteModalOpen(true); }} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-10 text-gray-500">Belum ada data wilayah</div>
          )}
        </div>
      </div>
    </div>
  )

  const renderUserManagement = () => (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="p-6 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
        <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
          <Users className="w-5 h-5 text-blue-600" />
          Daftar Pengguna
        </h3>
        <Button onClick={() => {
          setUserData({ nama: '', email: '', password: '', role: 'admin', status: 'aktif' });
          setAddUserModalOpen(true);
        }}>
          <UserPlus className="w-4 h-4 mr-2" /> Tambah Pengguna
        </Button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Pengguna</th>
              <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Role</th>
              <th className="px-6 py-4 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {usersLoading ? (
              <tr><td colSpan={4} className="px-6 py-8 text-center text-gray-500">Memuat data...</td></tr>
            ) : users?.map((user: any) => (
              <tr key={user.id} className="hover:bg-gray-50/50 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-sm">
                      {user.nama.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="font-bold text-gray-900 text-sm">{user.nama}</div>
                      <div className="text-xs text-gray-500">{user.email}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium border ${user.role === 'admin' ? 'bg-purple-50 text-purple-700 border-purple-200' :
                    user.role === 'finance' ? 'bg-green-50 text-green-700 border-green-200' :
                      'bg-blue-50 text-blue-700 border-blue-200'
                    }`}>
                    {user.role}
                  </span>
                </td>
                <td className="px-6 py-4 text-center">
                  <span className={`inline-flex px-2 py-1 rounded-full text-xs font-bold ${user.status === 'aktif' ? 'text-green-600 bg-green-50' : 'text-red-600 bg-red-50'
                    }`}>
                    {user.status === 'aktif' ? 'Aktif' : 'Nonaktif'}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => {
                        setSelectedUser(user);
                        setUserData({ ...user, password: '' });
                        setEditUserModalOpen(true);
                      }}
                      className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    {user.email !== currentUser?.email && (
                      <button
                        onClick={() => {
                          setSelectedUser(user);
                          setDeleteUserModalOpen(true);
                        }}
                        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )

  const renderAccountSettings = () => (
    <div className="max-w-3xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">

      {/* Profile Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100 bg-white">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-blue-600 flex items-center justify-center text-white text-2xl font-bold shadow-lg shadow-blue-200">
              {currentUser?.nama?.charAt(0).toUpperCase()}
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">{currentUser?.nama}</h2>
              <p className="text-gray-500 flex items-center gap-1.5 mt-1">
                <Mail className="w-4 h-4" /> {currentUser?.email}
              </p>
            </div>
          </div>
        </div>

        <div className="p-8 space-y-8">
          {/* Change Email */}
          <div>
            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4 border-b border-gray-100 pb-2">Email Address</h3>
            <div className="flex flex-col md:flex-row gap-4 items-end">
              <div className="flex-1 w-full">
                <label htmlFor="new-email" className="block text-sm font-medium text-gray-600 mb-1.5">Email Baru</label>
                <Input
                  id="new-email"
                  name="newEmail"
                  value={newEmail}
                  onChange={(e: any) => setNewEmail(e.target.value)}
                  placeholder="nama@email.com"
                  type="email"
                />
              </div>
              <Button
                onClick={handleUpdateEmail}
                disabled={newEmail === currentUser?.email}
                isLoading={updateEmailMutation.isPending}
                className="bg-blue-600 text-white hover:bg-blue-700"
              >
                Update Email
              </Button>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              * Mengubah email akan memperbarui kredensial login Anda. Pastikan email aktif.
            </p>
          </div>

          {/* Change Password */}
          <div>
            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4 border-b border-gray-100 pb-2">Keamanan Password</h3>
            <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-gray-900">Password Login</h4>
                  <p className="text-sm text-gray-500 mt-1">Terakhir diubah: -</p>
                </div>
                <Button
                  variant="outline"
                  onClick={() => setPasswordModalOpen(true)}
                  className="border-gray-300 hover:border-blue-500 hover:text-blue-600"
                >
                  <Key className="w-4 h-4 mr-2" /> Ganti Password
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Pengaturan</h1>
            <p className="text-gray-500 mt-1">Kelola sistem, pengguna, dan preferensi akun</p>
          </div>
        </div>

        {/* Custom Tab Navigation */}
        <div className="flex flex-wrap gap-2 p-1.5 bg-white border border-gray-200 rounded-xl w-fit shadow-sm">
          <button
            onClick={() => setActiveTab('general')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${activeTab === 'general' ? 'bg-gray-900 text-white shadow-md' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'}`}
          >
            <Settings className="w-4 h-4" /> Umum & Wilayah
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${activeTab === 'users' ? 'bg-gray-900 text-white shadow-md' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'}`}
          >
            <Users className="w-4 h-4" /> Manajemen Pengguna
          </button>
          <button
            onClick={() => setActiveTab('account')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${activeTab === 'account' ? 'bg-gray-900 text-white shadow-md' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'}`}
          >
            <Shield className="w-4 h-4" /> Akun Saya
          </button>
        </div>

        {/* Content */}
        <div className="min-h-[500px]">
          {activeTab === 'general' && renderGeneralSettings()}
          {activeTab === 'users' && renderUserManagement()}
          {activeTab === 'account' && renderAccountSettings()}
        </div>
      </div>

      {/* --- MODALS --- */}

      {/* Add User Modal */}
      <Modal
        isOpen={addUserModalOpen}
        onClose={() => setAddUserModalOpen(false)}
        title="Tambah Pengguna Baru"
      >
        <div className="space-y-4">
          <Input
            label="Nama Lengkap"
            value={userData.nama}
            onChange={(e) => setUserData({ ...userData, nama: e.target.value })}
            placeholder="Ex: Budi Santoso"
          />
          <Input
            label="Email"
            type="email"
            value={userData.email}
            onChange={(e) => setUserData({ ...userData, email: e.target.value })}
            placeholder="email@domain.com"
          />
          <Input
            label="Password"
            type="password"
            value={userData.password}
            onChange={(e) => setUserData({ ...userData, password: e.target.value })}
            placeholder="Min. 6 karakter"
          />
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Role Akses</label>
            <select
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
              value={userData.role}
              onChange={(e) => setUserData({ ...userData, role: e.target.value })}
            >
              <option value="admin">Admin (Full Access)</option>
              <option value="finance">Finance (Keuangan)</option>
              <option value="collector">Collector (Petugas Lapangan)</option>
            </select>
          </div>

          <div className="flex justify-end gap-3 pt-4 mt-2 border-t border-gray-100">
            <Button variant="secondary" onClick={() => setAddUserModalOpen(false)}>Batal</Button>
            <Button onClick={() => createUserMutation.mutate(userData)} isLoading={createUserMutation.isPending}>Simpan</Button>
          </div>
        </div>
      </Modal>

      {/* Edit User Modal */}
      <Modal
        isOpen={editUserModalOpen}
        onClose={() => setEditUserModalOpen(false)}
        title="Edit Pengguna"
      >
        <div className="space-y-4">
          <Input
            label="Nama Lengkap"
            value={userData.nama}
            onChange={(e) => setUserData({ ...userData, nama: e.target.value })}
          />
          <Input
            label="Email"
            type="email"
            value={userData.email}
            onChange={(e) => setUserData({ ...userData, email: e.target.value })}
          />
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Password (Opsional)</label>
            <Input
              type="password"
              placeholder="Biarkan kosong jika tidak diubah"
              value={userData.password}
              onChange={(e) => setUserData({ ...userData, password: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Role</label>
              <select
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                value={userData.role}
                onChange={(e) => setUserData({ ...userData, role: e.target.value })}
              >
                <option value="admin">Admin</option>
                <option value="finance">Finance</option>
                <option value="collector">Collector</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Status</label>
              <select
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                value={userData.status}
                onChange={(e) => setUserData({ ...userData, status: e.target.value })}
              >
                <option value="aktif">Aktif</option>
                <option value="nonaktif">Nonaktif</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 mt-2 border-t border-gray-100">
            <Button variant="secondary" onClick={() => setEditUserModalOpen(false)}>Batal</Button>
            <Button onClick={() => updateUserMutation.mutate({ id: selectedUser.id, payload: userData })} isLoading={updateUserMutation.isPending}>Simpan Perubahan</Button>
          </div>
        </div>
      </Modal>

      {/* Delete User Modal */}
      <Modal
        isOpen={deleteUserModalOpen}
        onClose={() => setDeleteUserModalOpen(false)}
        title="Hapus Pengguna"
        size="sm"
      >
        <div className="text-center p-2">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="w-8 h-8 text-red-600" />
          </div>
          <h3 className="text-lg font-bold text-gray-900 mb-2">Hapus Pengguna?</h3>
          <p className="text-gray-500 mb-6">
            Apakah Anda yakin ingin menghapus pengguna <strong>{selectedUser?.nama}</strong>? Tindakan ini tidak dapat dibatalkan.
          </p>
          <div className="flex justify-center gap-3">
            <Button variant="secondary" onClick={() => setDeleteUserModalOpen(false)}>Batal</Button>
            <Button variant="danger" onClick={() => deleteUserMutation.mutate(selectedUser.id)} isLoading={deleteUserMutation.isPending}>Ya, Hapus</Button>
          </div>
        </div>
      </Modal>

      {/* Existing Modals (Wilayah & Password) */}
      <Modal
        isOpen={addModalOpen}
        onClose={() => { setAddModalOpen(false); setNewWilayah('') }}
        title="Tambah Wilayah Baru"
      >
        <div className="space-y-6">
          <Input label="Nama Wilayah" value={newWilayah} onChange={(e) => setNewWilayah(e.target.value)} placeholder="Contoh: RT 01, Blok A" />
          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-100">
            <Button variant="secondary" onClick={() => setAddModalOpen(false)}>Batal</Button>
            <Button onClick={handleAddWilayah}>Tambah</Button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={editModalOpen}
        onClose={() => { setEditModalOpen(false); setSelectedWilayah(''); setEditWilayahName('') }}
        title="Edit Wilayah"
      >
        <div className="space-y-6">
          <Input label="Nama Wilayah" value={editWilayahName} onChange={(e) => setEditWilayahName(e.target.value)} />
          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-100">
            <Button variant="secondary" onClick={() => setEditModalOpen(false)}>Batal</Button>
            <Button onClick={handleEditWilayah}>Simpan</Button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={deleteModalOpen}
        onClose={() => { setDeleteModalOpen(false); setSelectedWilayah('') }}
        title="Hapus Wilayah"
        size="sm"
      >
        <div className="text-center p-2">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4"><AlertTriangle className="w-8 h-8 text-red-600" /></div>
          <p className="text-gray-600 mb-6">Hapus wilayah <strong>{selectedWilayah}</strong>? <br />{getCustomerCount(selectedWilayah)} pelanggan terdaftar.</p>
          <div className="flex justify-center gap-3">
            <Button variant="secondary" onClick={() => setDeleteModalOpen(false)}>Batal</Button>
            <Button variant="danger" onClick={handleDeleteWilayah} disabled={getCustomerCount(selectedWilayah) > 0}>Hapus</Button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={passwordModalOpen}
        onClose={() => {
          setPasswordModalOpen(false)
          setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' })
          setPasswordError('')
        }}
        title="Ganti Password"
      >
        <div className="space-y-4">
          {passwordError && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-red-600" />
              <p className="text-sm font-medium text-red-800">{passwordError}</p>
            </div>
          )}
          <Input type="password" label="Password Saat Ini" value={passwordData.currentPassword} onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })} />
          <Input type="password" label="Password Baru" value={passwordData.newPassword} onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })} />
          <Input type="password" label="Konfirmasi Password" value={passwordData.confirmPassword} onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })} />
          <div className="flex justify-end pt-4">
            <Button onClick={handleChangePassword} isLoading={changePasswordMutation.isPending}>Simpan Password</Button>
          </div>
        </div>
      </Modal>

    </AdminLayout>
  )
}
