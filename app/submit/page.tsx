'use client'
import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { toast } from '@/lib/toast'
import {
  ArrowLeft, Upload, CheckCircle, Loader2, AlertCircle,
  User, Wallet, X, Search,
} from 'lucide-react'
import {
  householdApi,
  paymentApi,
  MONTHS_ID,
  formatMoneyInput,
  sanitizeDigits,
} from '@/lib/api'
import type { Household } from '@/lib/types'
import AnimatedSelect from '@/components/ui/AnimatedSelect'

const CURRENT_YEAR = new Date().getFullYear()
const YEARS = [CURRENT_YEAR - 1, CURRENT_YEAR, CURRENT_YEAR + 1]
const MONTH_OPTIONS = MONTHS_ID.map((m, i) => ({ value: String(i + 1), label: m }))
const YEAR_OPTIONS = YEARS.map((y) => ({ value: String(y), label: String(y) }))

export default function SubmitPage() {
  const [households, setHouseholds] = useState<Household[]>([])
  const [selectedHousehold, setSelectedHousehold] = useState('')
  const [month, setMonth] = useState(new Date().getMonth() + 1)
  const [year, setYear] = useState(CURRENT_YEAR)
  const [amount, setAmount] = useState('')
  const [notes, setNotes] = useState('')
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [paidIds, setPaidIds] = useState<Set<string>>(new Set())

  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    loadHouseholds()
  }, [])

  // KK yang sudah upload bulan/tahun terpilih (menunggu/terverifikasi) tidak ditampilkan lagi
  useEffect(() => {
    loadPaidIds()
  }, [month, year])

  async function loadPaidIds() {
    try {
      const res = await paymentApi.list({ month, year, limit: 100 })
      const ids = new Set<string>(
        res.data.data
          .filter((p: { status: string }) => p.status !== 'REJECTED')
          .map((p: { householdId: string }) => p.householdId)
      )
      setPaidIds(ids)
      setSelectedHousehold((cur) => (cur && ids.has(cur) ? '' : cur))
    } catch {
      /* abaikan — daftar tetap tampil penuh bila gagal */
    }
  }

  async function loadHouseholds() {
    try {
      const res = await householdApi.list({ active: true })
      setHouseholds(res.data.data)
    } catch {
      toast.error('Gagal memuat daftar KK')
    }
  }

  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      toast.error('File harus berupa gambar')
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Ukuran gambar maksimal 5MB')
      return
    }

    setImageFile(file)
    setImagePreview(URL.createObjectURL(file))
  }

  function removeImage() {
    setImageFile(null)
    setImagePreview(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!selectedHousehold) return toast.error('Pilih KK terlebih dahulu')
    if (!imageFile) return toast.error('Upload bukti transfer terlebih dahulu')

    setSubmitting(true)
    try {
      const formData = new FormData()
      formData.append('householdId', selectedHousehold)
      formData.append('month', String(month))
      formData.append('year', String(year))
      const normalizedAmount = sanitizeDigits(amount)
      if (normalizedAmount) formData.append('amount', normalizedAmount)
      if (notes) formData.append('notes', notes)
      formData.append('proofImage', imageFile)

      await paymentApi.submit(formData)
      setSubmitted(true)
      toast.success('Bukti bayar berhasil dikirim!')
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })
        .response?.data?.message
      toast.error(msg || 'Gagal mengirim bukti pembayaran')
    } finally {
      setSubmitting(false)
    }
  }

  function resetForm() {
    setSubmitted(false)
    setSelectedHousehold('')
    setImageFile(null)
    setImagePreview(null)
    setAmount('')
    setNotes('')
    setSearchQuery('')
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const filteredHouseholds = households.filter((hh) => {
    if (paidIds.has(hh.id)) return false
    const q = searchQuery.toLowerCase()
    return (
      hh.name.toLowerCase().includes(q) ||
      `${hh.block}${hh.number}`.toLowerCase().includes(q) ||
      `blok ${hh.block}`.toLowerCase().includes(q)
    )
  })

  if (submitted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center max-w-sm animate-fade-in">
          <div className="w-20 h-20 bg-brand-100 rounded-full flex items-center justify-center mx-auto mb-5">
            <CheckCircle size={40} className="text-brand-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Terima Kasih!</h2>
          <p className="text-gray-500 mb-6 text-sm leading-relaxed">
            Bukti pembayaran IPL berhasil dikirim dan sedang menunggu verifikasi dari admin.
          </p>
          <div className="flex flex-col gap-3">
            <Link href="/" className="btn-primary justify-center">Lihat Dashboard</Link>
            <button onClick={resetForm} className="btn-secondary justify-center">Upload Lagi</button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-30">
        <div className="max-w-lg mx-auto px-4 py-4 flex items-center gap-3">
          <Link href="/" className="p-2 rounded-xl hover:bg-gray-100 transition-colors">
            <ArrowLeft size={20} className="text-gray-700" />
          </Link>
          <div>
            <h1 className="font-bold text-gray-900 text-sm">Upload Bukti Bayar IPL</h1>
            <p className="text-xs text-gray-400">Pesona Kahuripan 6 Gang 6</p>
          </div>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-5 pb-12">
        <form onSubmit={handleSubmit} className="stagger-children space-y-4">

          {/* ── Upload Foto ── */}
          <div className="card">
            <h2 className="font-semibold text-gray-900 mb-3 flex items-center gap-2 text-sm">
              <Upload size={16} className="text-brand-600" />
              Foto Bukti Transfer *
            </h2>

            {!imagePreview ? (
              <label
                htmlFor="image-upload"
                className="flex flex-col items-center justify-center w-full h-44 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-brand-400 hover:bg-brand-50/40 transition-all group"
              >
                <div className="w-11 h-11 bg-gray-100 group-hover:bg-brand-100 rounded-xl flex items-center justify-center mb-2 transition-colors">
                  <Upload size={20} className="text-gray-400 group-hover:text-brand-600 transition-colors" />
                </div>
                <p className="text-sm font-medium text-gray-700 group-hover:text-brand-700">Ketuk untuk upload foto</p>
                <p className="text-xs text-gray-400 mt-1">JPG, PNG, WEBP — Maks. 5MB</p>
                <input
                  id="image-upload"
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                />
              </label>
            ) : (
              <div className="relative">
                <div className="relative w-full h-52 rounded-xl overflow-hidden bg-gray-100">
                  <Image src={imagePreview} alt="Bukti transfer" fill className="object-contain" />
                </div>
                <button
                  type="button"
                  onClick={removeImage}
                  className="absolute top-2 right-2 w-8 h-8 bg-red-600 text-white rounded-full flex items-center justify-center hover:bg-red-700 transition-colors"
                >
                  <X size={15} />
                </button>
                <p className="text-xs text-brand-700 text-center mt-2">
                  ✓ Foto bukti transfer siap dikirim
                </p>
              </div>
            )}
          </div>

          {/* ── Pilih KK ── */}
          <div className="card">
            <h2 className="font-semibold text-gray-900 mb-3 flex items-center gap-2 text-sm">
              <User size={16} className="text-brand-600" />
              Identitas Warga *
            </h2>

            <div className="relative mb-2">
              <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Cari nama atau blok..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="input-field pl-9 text-sm"
              />
            </div>

            <div className="max-h-48 overflow-y-auto rounded-xl border border-gray-100 bg-gray-50/50">
              {filteredHouseholds.length === 0 ? (
                <p className="p-4 text-center text-sm text-gray-400">
                  {searchQuery
                    ? 'Tidak ditemukan'
                    : 'Semua KK sudah upload bukti untuk periode ini'}
                </p>
              ) : (
                filteredHouseholds.map((hh) => (
                  <button
                    key={hh.id}
                    type="button"
                    onClick={() => setSelectedHousehold(hh.id)}
                    className={`w-full flex items-center gap-3 p-3 text-left transition-colors border-b border-gray-100 last:border-0 ${
                      selectedHousehold === hh.id ? 'bg-brand-50' : 'hover:bg-white'
                    }`}
                  >
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                      selectedHousehold === hh.id ? 'bg-brand-600 text-white' : 'bg-gray-200 text-gray-600'
                    }`}>
                      {hh.block}{hh.number}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{hh.name}</p>
                      <p className="text-xs text-gray-400">Blok {hh.block} No. {hh.number}</p>
                    </div>
                    {selectedHousehold === hh.id && (
                      <CheckCircle size={16} className="text-brand-600 flex-shrink-0" />
                    )}
                  </button>
                ))
              )}
            </div>
          </div>

          {/* ── Detail Pembayaran ── */}
          <div className="card">
            <h2 className="font-semibold text-gray-900 mb-3 flex items-center gap-2 text-sm">
              <Wallet size={16} className="text-brand-600" />
              Detail Pembayaran
            </h2>

            <div className="grid grid-cols-2 gap-3 mb-3">
              <div>
                <label className="input-label">Bulan</label>
                <AnimatedSelect
                  value={String(month)}
                  onChange={(v) => setMonth(parseInt(v))}
                  options={MONTH_OPTIONS}
                />
              </div>
              <div>
                <label className="input-label">Tahun</label>
                <AnimatedSelect
                  value={String(year)}
                  onChange={(v) => setYear(parseInt(v))}
                  options={YEAR_OPTIONS}
                />
              </div>
            </div>

            <div className="mb-3">
              <label className="input-label">Nominal Transfer (Rp) — opsional</label>
              <input
                type="text"
                inputMode="numeric"
                value={amount}
                onChange={(e) => setAmount(formatMoneyInput(e.target.value))}
                placeholder="Isi jika berbeda dari iuran standar"
                className="input-field"
              />
              <p className="text-xs text-gray-400 mt-1">Kosongkan untuk menggunakan nominal iuran yang ditetapkan</p>
            </div>

            <div>
              <label className="input-label">Catatan — opsional</label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Misal: titip bayar bulan lalu"
                className="input-field text-sm"
              />
            </div>
          </div>

          {/* Info / validation hint */}
          {(!selectedHousehold || !imageFile) && (
            <div className="flex items-start gap-2.5 p-3 bg-amber-50 border border-amber-100 rounded-xl">
              <AlertCircle size={15} className="text-amber-600 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-amber-800">
                {!imageFile && !selectedHousehold
                  ? 'Upload bukti transfer dan pilih KK Anda'
                  : !imageFile
                  ? 'Upload foto bukti transfer terlebih dahulu'
                  : 'Pilih KK Anda dari daftar'}
              </p>
            </div>
          )}

          <button
            type="submit"
            disabled={submitting || !selectedHousehold || !imageFile}
            className="btn-primary w-full justify-center py-3.5 text-base"
          >
            {submitting ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                Mengirim...
              </>
            ) : (
              <>
                <CheckCircle size={18} />
                Kirim Bukti Pembayaran
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  )
}
