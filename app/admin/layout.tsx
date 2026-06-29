'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  LayoutDashboard, Users, CreditCard, ArrowLeftRight,
  LogOut, Home, Settings, Menu, X, ChevronRight, ShieldCheck, ChevronsUpDown
} from 'lucide-react'
import { motion, AnimatePresence } from 'motion/react'
import DropdownMenu from '@/components/ui/DropdownMenu'

const baseNavItems = [
  { href: '/admin', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/admin/payments', icon: CreditCard, label: 'Pembayaran IPL' },
  { href: '/admin/transactions', icon: ArrowLeftRight, label: 'Kas Masuk/Keluar' },
  { href: '/admin/households', icon: Users, label: 'Data Warga' },
  { href: '/admin/settings', icon: Settings, label: 'Pengaturan' },
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const [adminName, setAdminName] = useState('')
  const [adminRole, setAdminRole] = useState<'admin' | 'super-admin'>('admin')
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [authorized, setAuthorized] = useState(false)

  useEffect(() => {
    if (pathname === '/admin/login') return
    const token = localStorage.getItem('kas_warga_token')
    const adminRaw = token && localStorage.getItem('kas_warga_admin')
    try {
      if (!token || !adminRaw) throw new Error('unauthorized')
      const parsed = JSON.parse(adminRaw)
      if (!parsed?.name) throw new Error('invalid')
      setAdminName(parsed.name)
      setAdminRole(parsed?.role === 'super-admin' || parsed?.role === 'superadmin' ? 'super-admin' : 'admin')
      setAuthorized(true)
    } catch {
      localStorage.removeItem('kas_warga_token')
      localStorage.removeItem('kas_warga_admin')
      router.replace('/admin/login')
    }
  }, [pathname, router])

  if (pathname === '/admin/login') return <>{children}</>

  // Gate: jangan render dashboard sebelum auth terverifikasi (hindari flash sebelum redirect)
  if (!authorized) {
    return (
      <div className="min-h-dvh flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-brand-200 border-t-brand-600 rounded-full animate-spin" />
      </div>
    )
  }

  function logout() {
    localStorage.removeItem('kas_warga_token')
    localStorage.removeItem('kas_warga_admin')
    router.push('/admin/login')
  }

  const navItems = [...baseNavItems, { href: '/admin/admins', icon: ShieldCheck, label: 'Manajemen Admin' }]

  return (
    <div className="min-h-screen flex">
      {/* Sidebar - Desktop */}
      <aside className="hidden lg:flex flex-col w-72 bg-white/85 backdrop-blur border-r border-slate-200 fixed h-screen z-30">
        <div className="p-5 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-gradient-to-br from-brand-700 to-brand-500 rounded-xl flex items-center justify-center">
              <Home size={18} className="text-white" />
            </div>
            <div>
              <p className="font-bold text-slate-900 text-sm leading-tight">KasWarga</p>
              <p className="text-xs text-slate-500">Panel Operasional</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = pathname === item.href
            const { icon: Icon } = item
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-brand-50 text-brand-800 shadow-sm'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <Icon size={18} />
                {item.label}
                {isActive && <ChevronRight size={14} className="ml-auto" />}
              </Link>
            )
          })}
        </nav>

        <div className="p-4 border-t border-slate-200">
          <DropdownMenu
            trigger={
              <button className="w-full flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-slate-50 transition-colors outline-none">
                <div className="w-8 h-8 bg-brand-100 rounded-full flex items-center justify-center">
                  <span className="text-brand-800 font-bold text-xs">{adminName.charAt(0)}</span>
                </div>
                <div className="flex-1 min-w-0 text-left">
                  <p className="text-sm font-medium text-slate-900 truncate">{adminName}</p>
                  <p className="text-xs text-slate-500">{adminRole === 'super-admin' ? 'Super Admin' : 'Admin'}</p>
                </div>
                <ChevronsUpDown size={15} className="text-slate-400 flex-shrink-0" />
              </button>
            }
            items={[
              { label: 'Beranda Publik', icon: <Home size={15} />, href: '/' },
              { label: 'Keluar', icon: <LogOut size={15} />, onClick: logout, danger: true },
            ]}
          />
        </div>
      </aside>

      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-white/90 backdrop-blur border-b border-slate-200 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-br from-brand-700 to-brand-500 rounded-lg flex items-center justify-center">
            <Home size={16} className="text-white" />
          </div>
          <span className="font-bold text-slate-900 text-sm">KasWarga Admin</span>
        </div>
        <button
          onClick={() => setMobileMenuOpen(true)}
          className="w-10 h-10 rounded-xl hover:bg-slate-100 flex items-center justify-center"
          aria-label="Buka menu"
        >
          <Menu size={20} />
        </button>
      </div>

      {/* Mobile Drawer */}
      <AnimatePresence>
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <motion.div
            className="bg-black/50 absolute inset-0"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={() => setMobileMenuOpen(false)}
          />
          <motion.div
            className="relative bg-white w-72 h-full flex flex-col shadow-2xl"
            initial={{ x: -288 }}
            animate={{ x: 0 }}
            exit={{ x: -288 }}
            transition={{ type: 'spring', stiffness: 380, damping: 36, mass: 0.9 }}>

            <div className="p-5 flex items-center justify-between border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-gradient-to-br from-brand-700 to-brand-500 rounded-xl flex items-center justify-center">
                  <Home size={18} className="text-white" />
                </div>
                <div>
                  <p className="font-bold text-slate-900 text-sm">KasWarga</p>
                  <p className="text-xs text-slate-500">Panel Operasional</p>
                </div>
              </div>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="w-9 h-9 hover:bg-slate-100 rounded-xl flex items-center justify-center"
                aria-label="Tutup menu"
              >
                <X size={18} />
              </button>
            </div>
            <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
              {navItems.map((item) => {
                const isActive = pathname === item.href
                const { icon: Icon } = item
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium transition-all ${
                      isActive ? 'bg-brand-50 text-brand-800' : 'text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <Icon size={18} />
                    {item.label}
                  </Link>
                )
              })}
            </nav>
            <div
              className="p-4 border-t border-slate-100 flex gap-2"
              style={{ paddingBottom: 'max(16px, env(safe-area-inset-bottom, 16px))' }}
            >
              <Link
                href="/"
                className="btn-secondary flex-1 justify-center text-xs py-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                <Home size={14} />
                Publik
              </Link>
              <button onClick={logout} className="btn-danger flex-1 justify-center text-xs py-2">
                <LogOut size={14} />
                Keluar
              </button>
            </div>
          </motion.div>
        </div>
      )}
      </AnimatePresence>

      {/* Main Content */}
      <main className="flex-1 lg:ml-72 pt-14 lg:pt-0 min-h-screen">
        {children}
      </main>
    </div>
  )
}
