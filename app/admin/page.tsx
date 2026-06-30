'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  Wallet, Users, TrendingUp, TrendingDown, CheckCircle, Clock, XCircle,
  Download, ArrowRight, RefreshCw, AlertTriangle, FileSpreadsheet
} from 'lucide-react'
import { toast } from '@/lib/toast'
import { dashboardApi, exportApi, formatRupiah, MONTHS_ID } from '@/lib/api'
import type { DashboardData } from '@/lib/types'
import AnimatedCounter from '@/components/AnimatedCounter'

export default function AdminDashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    try {
      setLoading(true)
      const res = await dashboardApi.get()
      setData(res.data.data)
    } finally {
      setLoading(false)
    }
  }

  const currentMonth = data?.summary.currentMonth || new Date().getMonth() + 1
  const currentYear = data?.summary.currentYear || new Date().getFullYear()
  const paidPercent = data
    ? Math.round((data.summary.currentMonthPaidCount / (data.summary.activeHouseholds || 1)) * 100)
    : 0

  const pendingCount = data?.currentMonthPayments.filter((p) => p.status === 'PENDING').length || 0

  return (
    <div className="p-3 sm:p-4 lg:p-6">
      {/* Page Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-5">
        <div>
          <h1 className="page-header text-[1.3rem] sm:text-[1.6rem] lg:text-[2rem]">Dashboard Admin</h1>
          <p className="text-slate-500 text-xs sm:text-sm">
            {MONTHS_ID[currentMonth - 1]} {currentYear}
          </p>
        </div>
        <button onClick={loadData} disabled={loading} className="btn-secondary w-full sm:w-auto justify-center text-sm">
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          {loading ? 'Memuat...' : 'Refresh'}
        </button>
      </div>

      {/* Alert pending payments */}
      {pendingCount > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3 sm:p-4 mb-5 flex flex-col sm:flex-row sm:items-center gap-3">
          <AlertTriangle size={20} className="text-amber-600 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-xs sm:text-sm font-semibold text-amber-900">
              {pendingCount} pembayaran menunggu verifikasi
            </p>
            <p className="text-[11px] sm:text-xs text-amber-700">Periksa dan verifikasi bukti transfer warga</p>
          </div>
          <Link href="/admin/payments?status=PENDING" className="btn-primary text-xs py-2 px-3 whitespace-nowrap w-full sm:w-auto justify-center">
            Verifikasi
            <ArrowRight size={14} />
          </Link>
        </div>
      )}

      <div className="stagger-children space-y-4">
        {/* Total Kas - Hero */}
        <div className="bg-gradient-to-br from-brand-700 to-brand-900 rounded-2xl p-4 sm:p-5 text-white overflow-hidden">
          <p className="text-brand-200 text-xs sm:text-sm mb-1">Total Kas Perumahan</p>
          <div className="text-[1.35rem] sm:text-3xl font-extrabold mb-3 leading-tight break-words">
            {loading ? (
              <div className="h-8 w-48 bg-white/20 rounded skeleton" />
            ) : (
              <AnimatedCounter
                value={data?.summary.totalKas || 0}
                prefix="Rp "
                formatter={(v) => v.toLocaleString('id-ID')}
              />
            )}
          </div>
          <div className="grid grid-cols-3 gap-2 sm:gap-3">
            <div className="bg-white/10 rounded-xl p-2 sm:p-3 text-center">
              <p className="text-[10px] sm:text-[11px] text-brand-200 mb-1">IPL Masuk</p>
              <p className="font-bold text-[11px] sm:text-sm break-words leading-tight">{formatRupiah(data?.summary.totalIPLVerified || 0)}</p>
            </div>
            <div className="bg-white/10 rounded-xl p-2 sm:p-3 text-center">
              <p className="text-[10px] sm:text-[11px] text-brand-200 mb-1">Non-IPL</p>
              <p className="font-bold text-[11px] sm:text-sm break-words leading-tight">{formatRupiah(data?.summary.totalIncome || 0)}</p>
            </div>
            <div className="bg-white/10 rounded-xl p-2 sm:p-3 text-center">
              <p className="text-[10px] sm:text-[11px] text-brand-200 mb-1">Keluar</p>
              <p className="font-bold text-[11px] sm:text-sm text-red-300 break-words leading-tight">{formatRupiah(data?.summary.totalExpense || 0)}</p>
            </div>
          </div>
        </div>

        {/* Stat Cards — kompak horizontal di mobile, vertikal di desktop */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
          <div className="card p-3 sm:p-5 flex sm:block items-center gap-3">
            <div className="w-9 h-9 bg-brand-100 rounded-xl flex items-center justify-center mb-0 sm:mb-3 flex-shrink-0">
              <Wallet size={18} className="text-brand-600" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-gray-500 mb-0.5 sm:mb-1">Terkumpul Bulan Ini</p>
              <p className="text-[15px] sm:text-xl font-bold text-gray-900 break-words leading-tight">
                {formatRupiah(data?.summary.currentMonthTotal || 0)}
              </p>
            </div>
          </div>
          <div className="card p-3 sm:p-5 flex sm:block items-center gap-3">
            <div className="w-9 h-9 bg-blue-100 rounded-xl flex items-center justify-center mb-0 sm:mb-3 flex-shrink-0">
              <Users size={18} className="text-blue-600" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-gray-500 mb-0.5 sm:mb-1">Total KK Aktif</p>
              <p className="text-[15px] sm:text-xl font-bold text-gray-900">
                <AnimatedCounter value={data?.summary.activeHouseholds || 0} />
              </p>
            </div>
          </div>
          <div className="card p-3 sm:p-5 flex sm:block items-center gap-3">
            <div className="w-9 h-9 bg-green-100 rounded-xl flex items-center justify-center mb-0 sm:mb-3 flex-shrink-0">
              <CheckCircle size={18} className="text-green-600" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-gray-500 mb-0.5 sm:mb-1">Sudah Bayar</p>
              <p className="text-[15px] sm:text-xl font-bold text-green-700">
                {data?.summary.currentMonthPaidCount || 0}
                <span className="text-sm text-gray-400 font-normal"> KK</span>
              </p>
            </div>
          </div>
          <div className="card p-3 sm:p-5 flex sm:block items-center gap-3">
            <div className="w-9 h-9 bg-red-100 rounded-xl flex items-center justify-center mb-0 sm:mb-3 flex-shrink-0">
              <XCircle size={18} className="text-red-600" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-gray-500 mb-0.5 sm:mb-1">Belum Bayar</p>
              <p className="text-[15px] sm:text-xl font-bold text-red-700">
                {data?.summary.unpaidCount || 0}
                <span className="text-sm text-gray-400 font-normal"> KK</span>
              </p>
            </div>
          </div>
        </div>

        {/* Progress bulan ini */}
        <div className="card">
          <div className="flex items-center justify-between mb-3">
            <h2 className="section-title">Progress {MONTHS_ID[currentMonth - 1]} {currentYear}</h2>
            <span className="text-brand-600 font-bold">{paidPercent}%</span>
          </div>
          <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden mb-2">
            <div
              className="h-full bg-gradient-to-r from-brand-500 to-brand-400 rounded-full transition-all duration-1000"
              style={{ width: `${paidPercent}%` }}
            />
          </div>
          <p className="text-sm text-gray-500">
            <span className="font-semibold text-brand-600">{data?.summary.currentMonthPaidCount}</span>
            {' '}dari{' '}
            <span className="font-semibold">{data?.summary.activeHouseholds}</span>
            {' '}KK sudah membayar
          </p>
        </div>

        {/* Quick Actions - Export */}
        <div className="card">
          <h2 className="section-title mb-4">Export Data</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3">
            <button
              onClick={() => exportApi.payments({ month: currentMonth, year: currentYear }).catch(() => toast.error('Gagal export'))}
              className="btn-secondary justify-start sm:justify-center sm:flex-col py-3 sm:py-4 gap-2.5 sm:gap-1.5 h-auto"
            >
              <FileSpreadsheet size={20} className="text-green-600 flex-shrink-0" />
              <span className="text-sm font-medium">Rekap IPL Bulan Ini</span>
              <span className="text-xs text-gray-400 ml-auto sm:ml-0">.xlsx</span>
            </button>
            <button
              onClick={() => exportApi.payments({ year: currentYear }).catch(() => toast.error('Gagal export'))}
              className="btn-secondary justify-start sm:justify-center sm:flex-col py-3 sm:py-4 gap-2.5 sm:gap-1.5 h-auto"
            >
              <FileSpreadsheet size={20} className="text-blue-600 flex-shrink-0" />
              <span className="text-sm font-medium">Rekap IPL Tahunan</span>
              <span className="text-xs text-gray-400 ml-auto sm:ml-0">.xlsx</span>
            </button>
            <button
              onClick={() => exportApi.transactions(currentYear).catch(() => toast.error('Gagal export'))}
              className="btn-secondary justify-start sm:justify-center sm:flex-col py-3 sm:py-4 gap-2.5 sm:gap-1.5 h-auto"
            >
              <FileSpreadsheet size={20} className="text-purple-600 flex-shrink-0" />
              <span className="text-sm font-medium">Laporan Keuangan</span>
              <span className="text-xs text-gray-400 ml-auto sm:ml-0">.xlsx</span>
            </button>
          </div>
        </div>

        {/* Quick Links */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Link href="/admin/payments" className="card-hover flex items-center gap-3">
            <div className="w-9 h-9 bg-amber-100 rounded-xl flex items-center justify-center">
              <Clock size={18} className="text-amber-600" />
            </div>
            <div>
              <p className="font-medium text-gray-900 text-sm">Verifikasi Pembayaran</p>
              {pendingCount > 0 && (
                <p className="text-xs text-amber-600">{pendingCount} menunggu</p>
              )}
            </div>
            <ArrowRight size={16} className="ml-auto text-gray-400" />
          </Link>
          <Link href="/admin/transactions" className="card-hover flex items-center gap-3">
            <div className="w-9 h-9 bg-purple-100 rounded-xl flex items-center justify-center">
              <TrendingUp size={18} className="text-purple-600" />
            </div>
            <div>
              <p className="font-medium text-gray-900 text-sm">Catat Transaksi</p>
              <p className="text-xs text-gray-400">Pemasukan & pengeluaran</p>
            </div>
            <ArrowRight size={16} className="ml-auto text-gray-400" />
          </Link>
          <Link href="/admin/households" className="card-hover flex items-center gap-3">
            <div className="w-9 h-9 bg-blue-100 rounded-xl flex items-center justify-center">
              <Users size={18} className="text-blue-600" />
            </div>
            <div>
              <p className="font-medium text-gray-900 text-sm">Kelola Data Warga</p>
              <p className="text-xs text-gray-400">{data?.summary.activeHouseholds} KK aktif</p>
            </div>
            <ArrowRight size={16} className="ml-auto text-gray-400" />
          </Link>
        </div>
      </div>
    </div>
  )
}
