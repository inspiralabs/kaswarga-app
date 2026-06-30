'use client'
import { useEffect, useState, useCallback } from 'react'
import { toast } from '@/lib/toast'
import {
  Plus, TrendingUp, TrendingDown, Loader2, Trash2,
  RefreshCw, Download, Wallet
} from 'lucide-react'
import {
  transactionApi,
  exportApi,
  formatRupiah,
  MONTHS_ID,
  formatMoneyInput,
  sanitizeDigits,
} from '@/lib/api'
import type { Transaction } from '@/lib/types'
import Modal from '@/components/ui/Modal'
import AnimatedSelect from '@/components/ui/AnimatedSelect'
import FilterPanel from '@/components/ui/FilterPanel'
import { motion } from 'motion/react'

const CATEGORIES = {
  INCOME: ['Donasi', 'Denda', 'Kontribusi Acara', 'Lainnya'],
  EXPENSE: ['Kebersihan', 'Keamanan', 'Perbaikan Fasilitas', 'Acara/Kegiatan', 'ATK', 'Lainnya'],
}

const YEAR_NOW = new Date().getFullYear()
const TYPE_OPTIONS = [
  { value: '', label: 'Semua' },
  { value: 'INCOME', label: 'Pemasukan' },
  { value: 'EXPENSE', label: 'Pengeluaran' },
]
const MONTH_OPTIONS = [
  { value: '', label: 'Semua' },
  ...MONTHS_ID.map((m, i) => ({ value: String(i + 1), label: m })),
]
const YEAR_OPTIONS = [YEAR_NOW - 3, YEAR_NOW - 2, YEAR_NOW - 1, YEAR_NOW].map((y) => ({
  value: String(y),
  label: String(y),
}))

export default function AdminTransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [filterType, setFilterType] = useState('')
  const [filterYear, setFilterYear] = useState(String(new Date().getFullYear()))
  const [filterMonth, setFilterMonth] = useState('')
  const [showAddModal, setShowAddModal] = useState(false)
  const [saving, setSaving] = useState(false)
  const [summary, setSummary] = useState({ incomeTotal: 0, expenseTotal: 0, net: 0 })

  // Form state
  const [form, setForm] = useState({
    type: 'EXPENSE' as 'INCOME' | 'EXPENSE',
    amount: '',
    description: '',
    category: '',
    date: new Date().toISOString().split('T')[0],
  })

  const loadTransactions = useCallback(async () => {
    setLoading(true)
    try {
      const res = await transactionApi.list({
        type: filterType || undefined,
        year: filterYear ? parseInt(filterYear) : undefined,
        month: filterMonth ? parseInt(filterMonth) : undefined,
        limit: 100,
      })
      setTransactions(res.data.data)
      setSummary(res.data.summary)
    } finally {
      setLoading(false)
    }
  }, [filterType, filterYear, filterMonth])

  useEffect(() => {
    loadTransactions()
  }, [loadTransactions])

  function resetForm() {
    setForm({
      type: 'EXPENSE',
      amount: '',
      description: '',
      category: '',
      date: new Date().toISOString().split('T')[0],
    })
  }

  async function handleSave() {
    const normalizedAmount = sanitizeDigits(form.amount)
    if (!normalizedAmount || !form.description || !form.date) {
      toast.error('Nominal, keterangan, dan tanggal wajib diisi')
      return
    }

    setSaving(true)
    try {
      await transactionApi.create({
        type: form.type,
        amount: parseInt(normalizedAmount),
        description: form.description,
        category: form.category || undefined,
        date: form.date,
      })
      toast.success('Transaksi berhasil dicatat!')
      setShowAddModal(false)
      resetForm()
      loadTransactions()
    } catch {
      toast.error('Gagal mencatat transaksi')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id: string, desc: string) {
    if (!confirm(`Hapus transaksi "${desc}"?`)) return
    try {
      await transactionApi.delete(id)
      toast.success('Transaksi dihapus')
      loadTransactions()
    } catch {
      toast.error('Gagal menghapus')
    }
  }

  const groupedByMonth: Record<string, Transaction[]> = {}
  transactions.forEach((t) => {
    const d = new Date(t.date)
    const key = `${MONTHS_ID[d.getMonth()]} ${d.getFullYear()}`
    if (!groupedByMonth[key]) groupedByMonth[key] = []
    groupedByMonth[key].push(t)
  })

  return (
    <div className="p-3 sm:p-4 lg:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-5">
        <div>
          <h1 className="page-header text-[1.3rem] sm:text-[1.6rem] lg:text-[2rem]">Kas Masuk & Keluar</h1>
          <p className="text-slate-500 text-xs sm:text-sm">Pemasukan dan pengeluaran selain IPL bulanan</p>
        </div>
        <div className="sm:ml-auto grid grid-cols-3 sm:flex gap-2 w-full sm:w-auto">
          <button onClick={loadTransactions} className="btn-secondary justify-center min-h-10">
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
          </button>
          <button onClick={() => exportApi.transactions(parseInt(filterYear)).catch(() => toast.error('Gagal export'))} className="btn-secondary text-sm justify-center min-h-10">
            <Download size={15} />
            Export
          </button>
          <button onClick={() => { resetForm(); setShowAddModal(true) }} className="btn-primary text-sm justify-center min-h-10">
            <Plus size={15} />
            Tambah
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-2.5 sm:gap-3 mb-5">
        <div className="card text-center p-3 sm:p-5">
          <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-2">
            <TrendingUp size={16} className="text-green-600" />
          </div>
          <p className="text-[11px] sm:text-xs text-gray-500 mb-0.5">Pemasukan</p>
          <p className="font-bold text-[11px] sm:text-sm break-words leading-tight">{formatRupiah(summary.incomeTotal)}</p>
        </div>
        <div className="card text-center p-3 sm:p-5">
          <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center mx-auto mb-2">
            <TrendingDown size={16} className="text-red-600" />
          </div>
          <p className="text-[11px] sm:text-xs text-gray-500 mb-0.5">Pengeluaran</p>
          <p className="font-bold text-[11px] sm:text-sm break-words leading-tight">{formatRupiah(summary.expenseTotal)}</p>
        </div>
        <div className={`card text-center p-3 sm:p-5 ${summary.net >= 0 ? 'bg-green-50' : 'bg-red-50'}`}>
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center mx-auto mb-2 ${summary.net >= 0 ? 'bg-green-100' : 'bg-red-100'}`}>
            <Wallet size={16} className={summary.net >= 0 ? 'text-green-600' : 'text-red-600'} />
          </div>
          <p className="text-[11px] sm:text-xs text-gray-500 mb-0.5">Saldo</p>
          <p className={`font-bold text-[11px] sm:text-sm break-words leading-tight ${summary.net >= 0 ? 'text-green-700' : 'text-red-700'}`}>
            {formatRupiah(Math.abs(summary.net))}
          </p>
        </div>
      </div>

      {/* Filters */}
      <FilterPanel activeCount={(filterType ? 1 : 0) + (filterMonth ? 1 : 0)}>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 sm:gap-3">
          <div>
            <label className="input-label">Tipe</label>
            <AnimatedSelect value={filterType} onChange={setFilterType} options={TYPE_OPTIONS} />
          </div>
          <div>
            <label className="input-label">Bulan</label>
            <AnimatedSelect value={filterMonth} onChange={setFilterMonth} options={MONTH_OPTIONS} />
          </div>
          <div className="col-span-2 sm:col-span-1">
            <label className="input-label">Tahun</label>
            <AnimatedSelect value={filterYear} onChange={setFilterYear} options={YEAR_OPTIONS} />
          </div>
        </div>
      </FilterPanel>

      {/* Transaction List */}
      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 size={32} className="animate-spin text-brand-600" />
        </div>
      ) : transactions.length === 0 ? (
        <div className="card text-center py-12 text-gray-400">
          <p>Tidak ada transaksi</p>
          <button onClick={() => setShowAddModal(true)} className="btn-primary text-sm mt-3 mx-auto">
            <Plus size={15} /> Tambah Transaksi
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {Object.entries(groupedByMonth).map(([monthLabel, items]) => {
            const monthIncome = items.filter((t) => t.type === 'INCOME').reduce((s, t) => s + t.amount, 0)
            const monthExpense = items.filter((t) => t.type === 'EXPENSE').reduce((s, t) => s + t.amount, 0)
            return (
              <div key={monthLabel}>
                <div className="flex items-center gap-2 sm:gap-3 mb-2">
                  <h3 className="font-semibold text-gray-700 text-xs sm:text-sm">{monthLabel}</h3>
                  <div className="flex-1 h-px bg-gray-100" />
                  <span className="text-[11px] sm:text-xs text-green-600">+{formatRupiah(monthIncome)}</span>
                  <span className="text-[11px] sm:text-xs text-red-600">-{formatRupiah(monthExpense)}</span>
                </div>
                <div className="space-y-2">
                  {items.map((t) => (
                    <div key={t.id} className="card-hover flex items-start sm:items-center gap-2.5 sm:gap-3">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${
                        t.type === 'INCOME' ? 'bg-green-100' : 'bg-red-100'
                      }`}>
                        {t.type === 'INCOME'
                          ? <TrendingUp size={16} className="text-green-600" />
                          : <TrendingDown size={16} className="text-red-600" />
                        }
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 text-sm truncate">{t.description}</p>
                        <p className="text-[11px] sm:text-xs text-gray-400">
                          {t.category && `${t.category} · `}
                          {new Date(t.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                          {' · '}{t.createdBy}
                        </p>
                      </div>
                      <p className={`font-semibold text-xs sm:text-sm flex-shrink-0 ${
                        t.type === 'INCOME' ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {t.type === 'INCOME' ? '+' : '-'}{formatRupiah(t.amount)}
                      </p>
                      <button
                        onClick={() => handleDelete(t.id, t.description)}
                        className="p-2.5 sm:p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors flex-shrink-0"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Add Transaction Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Catat Transaksi"
        size="md"
      >
        <div className="p-5 space-y-4">
          {/* Type Toggle — layoutId pill slides between options */}
          <div>
            <label className="input-label">Tipe Transaksi</label>
            <div className="relative flex bg-gray-100 rounded-xl p-1">
              {([
                { value: 'INCOME', label: 'Pemasukan', icon: TrendingUp, activeBg: 'bg-green-600' },
                { value: 'EXPENSE', label: 'Pengeluaran', icon: TrendingDown, activeBg: 'bg-red-600' },
              ] as const).map(({ value, label, icon: Icon, activeBg }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setForm({ ...form, type: value, category: '' })}
                  className="relative flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium z-10"
                >
                  {form.type === value && (
                    <motion.div
                      layoutId="type-pill"
                      className={`absolute inset-0 rounded-lg ${activeBg}`}
                      transition={{ type: 'spring', stiffness: 500, damping: 38 }}
                    />
                  )}
                  <span className={`relative z-10 flex items-center gap-2 transition-colors duration-150 ${
                    form.type === value ? 'text-white' : 'text-slate-600'
                  }`}>
                    <Icon size={16} />
                    {label}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="input-label">Tanggal</label>
            <input
              type="date"
              value={form.date}
              onChange={(e) => setForm({ ...form, date: e.target.value })}
              className="input-field"
            />
          </div>

          <div>
            <label className="input-label">Nominal (Rp)</label>
            <input
              type="text"
              inputMode="numeric"
              value={form.amount}
              onChange={(e) => setForm({ ...form, amount: formatMoneyInput(e.target.value) })}
              placeholder="Masukkan nominal"
              className="input-field"
            />
          </div>

          <div>
            <label className="input-label">Keterangan</label>
            <input
              type="text"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Apa keterangan transaksi ini?"
              className="input-field"
            />
          </div>

          <div>
            <label className="input-label">Kategori (opsional)</label>
            <AnimatedSelect
              value={form.category}
              onChange={(v) => setForm({ ...form, category: v })}
              placeholder="-- Pilih kategori --"
              options={[
                { value: '', label: '-- Pilih kategori --' },
                ...CATEGORIES[form.type].map((cat) => ({ value: cat, label: cat })),
              ]}
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button onClick={() => setShowAddModal(false)} className="btn-secondary flex-1 justify-center">
              Batal
            </button>
            <button onClick={handleSave} disabled={saving} className="btn-primary flex-1 justify-center">
              {saving ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
              {saving ? 'Menyimpan...' : 'Simpan'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
