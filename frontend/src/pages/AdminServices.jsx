import { useState, useEffect } from "react"
import { Plus, Pencil, Trash2, ToggleLeft, ToggleRight, X, CheckCircle2 } from "lucide-react"
import { getServices, createService, updateService, toggleService, deleteServiceApi } from "../api"

// ── Toast ───────────────────────────────────────────────────────────────────────
function Toast({ visible, message }) {
  return (
    <div className={`fixed bottom-24 md:bottom-8 right-6 z-50 flex items-center gap-2.5 px-4 py-3 bg-[#1a1a1a] text-white text-[12px] font-medium shadow-xl transition-all duration-300 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4 pointer-events-none"}`}>
      <CheckCircle2 size={14} className="text-[#4ade80] flex-shrink-0" />
      {message}
    </div>
  )
}

const CATEGORY_OPTIONS = [
  { key: "cert",       label: "📄 Pramaan Patra (Certificates)" },
  { key: "id",         label: "🪪 Pehchan (IDs & Updates)"      },
  { key: "bills",      label: "💡 Bills, Recharge & Taxes"       },
  { key: "forms",      label: "🎓 Siksha & Exams (Forms)"        },
  { key: "schemes",    label: "🏛️ Yojana & Pension"              },
  { key: "land_auto",  label: "🌾 Krishi, Khata & Vahan"         },
]

function ServiceModal({ service, onSave, onClose, loading }) {
  const defaultForm = {
    name: "", description: "", price: "",
    category_key: "cert",
    category_label: "📄 Pramaan Patra (Certificates)",
    enabled: true,
    show_in_web: true,
  }
  const [form, setForm] = useState(service
    ? { name: service.name, description: service.description || "", price: service.price || "",
        category_key: service.category_key || "cert",
        category_label: service.category_label || CATEGORY_OPTIONS[0].label,
        enabled: Boolean(service.enabled),
        show_in_web: service.show_in_web !== undefined ? Boolean(service.show_in_web) : true }
    : defaultForm
  )
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }))
  const valid = form.name.trim().length > 0

  const handleCategoryChange = (key) => {
    const cat = CATEGORY_OPTIONS.find(c => c.key === key)
    set("category_key", key)
    set("category_label", cat?.label || key)
  }

  return (
    <div className="fixed inset-0 z-50 bg-[#071e27]/40 backdrop-blur-md flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-[var(--color-surface-lowest)] shadow-ambient rounded-[16px] overflow-hidden">
        <div className="flex items-center justify-between px-6 py-5 bg-[var(--color-surface-low)]">
          <div>
            <p className="text-[10px] text-[var(--color-primary)] font-bold tracking-widest uppercase">{service ? "Edit Service" : "Add Service"}</p>
            <h2 className="text-[16px] font-bold text-[var(--color-on-surface)] mt-1">{service?.name || "New Service"}</h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-[var(--color-on-surface)] transition-colors p-1 bg-transparent"><X size={16} /></button>
        </div>
        <div className="px-6 py-5 space-y-4">
          {/* Category */}
          <div>
            <label className="text-[10px] text-gray-500 font-bold tracking-widest uppercase block mb-2">Category *</label>
            <select
              value={form.category_key}
              onChange={e => handleCategoryChange(e.target.value)}
              className="w-full border border-gray-200 px-4 py-3 text-[13px] text-gray-900 bg-white focus:outline-none focus:border-[#164FA8] focus:ring-1 focus:ring-[#164FA8] shadow-sm rounded-[12px] transition-all"
            >
              {CATEGORY_OPTIONS.map(c => <option key={c.key} value={c.key}>{c.label}</option>)}
            </select>
          </div>
          {/* Name */}
          <div>
            <label className="text-[10px] text-gray-500 font-bold tracking-widest uppercase block mb-2">Service Name *</label>
            <input
              type="text" value={form.name} onChange={e => set("name", e.target.value)}
              className="w-full border border-gray-200 px-4 py-3 text-[13px] text-gray-900 focus:outline-none focus:border-[#164FA8] focus:ring-1 focus:ring-[#164FA8] shadow-sm rounded-[12px] transition-all"
              placeholder="e.g. Aadhar Update"
            />
          </div>
          {/* Description */}
          <div>
            <label className="text-[10px] text-gray-500 font-bold tracking-widest uppercase block mb-2">Description</label>
            <input
              type="text" value={form.description} onChange={e => set("description", e.target.value)}
              className="w-full border border-gray-200 px-4 py-3 text-[13px] text-gray-900 focus:outline-none focus:border-[#164FA8] focus:ring-1 focus:ring-[#164FA8] shadow-sm rounded-[12px] transition-all"
              placeholder="Short description (optional)"
            />
          </div>
          {/* Price */}
          <div>
            <label className="text-[10px] text-gray-500 font-bold tracking-widest uppercase block mb-2">Price (optional)</label>
            <input
              type="text" value={form.price} onChange={e => set("price", e.target.value)}
              className="w-full border border-gray-200 px-4 py-3 text-[13px] text-gray-900 focus:outline-none focus:border-[#164FA8] focus:ring-1 focus:ring-[#164FA8] shadow-sm rounded-[12px] transition-all"
              placeholder="e.g. ₹50 or Free"
            />
          </div>
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-3 bg-[var(--color-surface-low)] p-4 rounded-xl">
              <label className="text-[13px] font-bold text-[var(--color-on-surface)] flex-1">Active in Telegram Bot</label>
              <button onClick={() => set("enabled", !form.enabled)} className="transition-all hover:scale-105 active:scale-95">
                {form.enabled
                  ? <ToggleRight size={28} className="text-[#10B981]" />
                  : <ToggleLeft size={28} className="text-[var(--color-outline-variant)]" />}
              </button>
            </div>
            <div className="flex items-center gap-3 bg-[var(--color-surface-low)] p-4 rounded-xl">
              <label className="text-[13px] font-bold text-[var(--color-on-surface)] flex-1">Active on Web Portal</label>
              <button onClick={() => set("show_in_web", !form.show_in_web)} className="transition-all hover:scale-105 active:scale-95">
                {form.show_in_web
                  ? <ToggleRight size={28} className="text-[#10B981]" />
                  : <ToggleLeft size={28} className="text-[var(--color-outline-variant)]" />}
              </button>
            </div>
          </div>
        </div>
        <div className="px-6 pb-6 flex gap-3">
          <button onClick={onClose} className="flex-1 py-3 bg-[var(--color-surface-bright)] text-[13px] font-semibold text-[var(--color-on-surface)] hover:bg-[var(--color-surface-low)] transition-all rounded-xl">Cancel</button>
          <button
            onClick={() => valid && !loading && onSave(form)}
            disabled={!valid || loading}
            className="flex-1 py-3 bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-primary-container)] text-white text-[13px] font-bold hover:shadow-ambient transition-all rounded-xl disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Saving..." : service ? "Update" : "Add Service"}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function AdminServices() {
  const [services, setServices] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [modal, setModal] = useState(null) // null | "add" | { ...service }

  const [toastVisible, setToastVisible] = useState(false)
  const [toastMsg, setToastMsg] = useState("")

  const showToast = (msg) => {
    setToastMsg(msg)
    setToastVisible(true)
    setTimeout(() => setToastVisible(false), 2500)
  }

  const load = () => {
    setLoading(true)
    getServices()
      .then(d => setServices(d.services || []))
      .catch(() => showToast("Failed to load services"))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const handleToggle = async (id) => {
    await toggleService(id)
    setServices(prev => prev.map(s => s.id === id ? { ...s, enabled: s.enabled ? 0 : 1 } : s))
  }

  const handleDelete = async (id) => {
    if (!window.confirm("Is service ko delete kar dein?")) return
    await deleteServiceApi(id)
    setServices(prev => prev.filter(s => s.id !== id))
    showToast("Service delete ho gayi!")
  }

  const handleSave = async (form) => {
    setSaving(true)
    try {
      if (modal === "add") {
        await createService(form)
        showToast("✓ Service add ho gayi — live hai!")
      } else {
        await updateService(modal.id, form)
        showToast("✓ Service update ho gayi — live hai!")
      }
      setModal(null)
      load()
    } catch {
      showToast("Error: save nahi hua")
    } finally {
      setSaving(false)
    }
  }

  const grouped = services.reduce((acc, s) => {
    const key = s.category_label || s.category_key
    if (!acc[key]) acc[key] = []
    acc[key].push(s)
    return acc
  }, {})

  return (
    <div className="space-y-6">
      <Toast visible={toastVisible} message={toastMsg} />

      <div className="flex items-end justify-between mb-8">
        <div>
          <p className="text-[11px] font-bold tracking-[0.15em] uppercase text-[#164FA8] mb-2">Management</p>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight leading-tight">Services</h1>
          <p className="text-[14px] text-gray-500 mt-2 max-w-2xl leading-relaxed">Bot aur web portal ki sabhi services ko yahan se manage karein.</p>
        </div>
      </div>

      {modal && <ServiceModal service={modal === "add" ? null : modal} onSave={handleSave} onClose={() => setModal(null)} loading={saving} />}

      <div className="flex items-center justify-between">
        <div>
          <p className="text-[12px] text-gray-500 font-medium">
            {services.length} Total Services · <span className="text-[#10B981] font-bold">{services.filter(s => s.enabled || s.show_in_web).length} Active</span>
          </p>
          <p className="text-[11px] font-bold tracking-wider text-[var(--color-primary)] mt-1 uppercase">✓ Realtime Sync Enabled</p>
        </div>
        <button
          onClick={() => setModal("add")}
          className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-primary-container)] text-white text-[13px] font-bold transition-all rounded-xl shadow-ambient hover:-translate-y-0.5"
        >
          <Plus size={14} /> Add Service
        </button>
      </div>

      {loading ? (
        <div className="py-16 flex justify-center">
          <div className="w-6 h-6 border-2 border-[#164FA8] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(grouped).map(([catLabel, items]) => (
            <div key={catLabel} className="bg-[var(--color-surface-lowest)] rounded-xl overflow-hidden shadow-ambient mb-6 border-none">
              <div className="px-6 py-4 bg-[var(--color-surface-base)]">
                <p className="text-[11px] font-bold tracking-widest text-[var(--color-primary)] uppercase">{catLabel}</p>
              </div>
              {items.map((s, i) => (
                <div key={s.id} className={`flex flex-col sm:flex-row sm:items-center gap-4 px-6 py-5 transition-colors odd:bg-[var(--color-surface-low)] even:bg-[var(--color-surface-lowest)] hover:bg-[var(--color-surface-bright)]`}>
                  <div className="flex items-start justify-between w-full sm:w-auto flex-1 min-w-0">
                    <div className="flex gap-4">
                      <button onClick={() => handleToggle(s.id)} className="flex-shrink-0 transition-transform active:scale-95 mt-1">
                        {s.enabled
                          ? <ToggleRight size={26} className="text-[#10B981]" />
                          : <ToggleLeft size={26} className="text-[var(--color-outline-variant)]" />}
                      </button>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 flex-wrap">
                          <p className={`text-[14px] font-bold ${s.enabled || s.show_in_web ? "text-[var(--color-on-surface)]" : "text-gray-400"}`}>{s.name}</p>
                          {s.price && <span className="text-[11px] font-bold bg-[var(--color-primary-fixed)] text-[var(--color-primary)] px-2 py-0.5 rounded-full">{s.price}</span>}
                          <div className="flex items-center gap-1.5 ml-1">
                             <span className={`text-[9px] font-bold tracking-widest uppercase px-2 py-0.5 rounded-full ${s.enabled ? "bg-[#d1fae5] text-[#10B981]" : "bg-gray-100 text-gray-400"}`}>Bot: {s.enabled ? "ON" : "OFF"}</span>
                             <span className={`text-[9px] font-bold tracking-widest uppercase px-2 py-0.5 rounded-full ${s.show_in_web ? "bg-[#d1fae5] text-[#10B981]" : "bg-gray-100 text-gray-400"}`}>Web: {s.show_in_web ? "ON" : "OFF"}</span>
                          </div>
                        </div>
                        {s.description && <p className="text-[12px] text-gray-500 mt-1 font-medium leading-relaxed max-w-2xl">{s.description}</p>}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0 self-end sm:self-auto mt-2 sm:mt-0">
                    <button onClick={() => setModal(s)} className="w-9 h-9 border bg-[var(--color-surface-lowest)] hover:bg-[var(--color-surface-low)] border-none shadow-ambient flex items-center justify-center text-gray-500 hover:text-[var(--color-primary)] transition-all rounded-md" title="Edit">
                      <Pencil size={14} />
                    </button>
                    <button onClick={() => handleDelete(s.id)} className="w-9 h-9 border bg-[var(--color-surface-lowest)] hover:bg-[#fef2f2] border-none shadow-ambient flex items-center justify-center text-gray-500 hover:text-red-500 transition-all rounded-md" title="Delete">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ))}
          {services.length === 0 && (
            <div className="py-16 text-center border border-gray-100 bg-white rounded-[24px]">
              <p className="text-[13px] text-gray-500 font-medium">Koi service nahi. "Add Service" se shuru karein.</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
