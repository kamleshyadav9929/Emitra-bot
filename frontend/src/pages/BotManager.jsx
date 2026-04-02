import { useState, useEffect } from "react"
import {
  MessageSquare, Wrench, Megaphone, Settings,
  Plus, Pencil, Trash2, ToggleLeft, ToggleRight,
  Save, CheckCircle2, Clock, BotMessageSquare,
  X, Bell, Languages,
} from "lucide-react"
import {
  getServices, createService, updateService,
  toggleService, deleteServiceApi,
} from "../api"

// ── Local storage helpers ───────────────────────────────────────────────────────
const LS = {
  get: (key, fallback) => { try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback } catch { return fallback } },
  set: (key, val) => { try { localStorage.setItem(key, JSON.stringify(val)) } catch {} },
}

// ── Default values ──────────────────────────────────────────────────────────────
const DEFAULT_MESSAGES = {
  welcome:      "🙏 E-Mitra Seva mein aapka swagat hai!\n\nAap yahan se aadhar, PAN, income certificate aur bahut saari sarkaari seva le sakte hain.\n\n/help se sab options dekhein.",
  exam_confirm: "✅ Aapka exam {exam} set ho gaya hai!\n\nAb aap exam se related updates seedhe yahan paayenge.",
  unsubscribe:  "😢 Aapko E-Mitra notifications se unsubscribe kar diya gaya hai.\n\nWapas subscribe karne ke liye /start karein.",
}

const DEFAULT_SERVICES = [
  { id: 1, name: "Aadhar Update",       desc: "Naam, address, DOB update",    price: "₹50",  enabled: true  },
  { id: 2, name: "PAN Card",            desc: "Naye PAN ke liye apply karein", price: "₹110", enabled: true  },
  { id: 3, name: "Income Certificate",  desc: "Tehsil se income certificate",  price: "₹30",  enabled: true  },
  { id: 4, name: "Domicile Certificate",desc: "Niwas praman patra",            price: "₹30",  enabled: false },
  { id: 5, name: "Driving License",     desc: "DL ke liye apply / renew",      price: "₹200", enabled: true  },
]

const DEFAULT_ANNOUNCEMENTS = [
  { id: 1, exam: "JEE",  message: "JEE Mains ka admit card kal se download hoga!",     runAt: "2026-01-15T09:00", sent: false },
  { id: 2, exam: "NEET", message: "NEET 2026 registration form bharna shuru ho gaya.", runAt: "2026-02-01T10:00", sent: false },
]

const DEFAULT_SETTINGS = {
  botName:    "E-Mitra Seva",
  language:   "hinglish",
  maxMsgDay:  3,
}

// ── Toast ───────────────────────────────────────────────────────────────────────
function Toast({ visible, message }) {
  return (
    <div className={`fixed bottom-24 md:bottom-8 right-6 z-50 flex items-center gap-2.5 px-4 py-3 bg-[#1a1a1a] text-white text-[12px] font-medium shadow-xl transition-all duration-300 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4 pointer-events-none"}`}>
      <CheckCircle2 size={14} className="text-[#4ade80] flex-shrink-0" />
      {message}
    </div>
  )
}

// ── Tab button ──────────────────────────────────────────────────────────────────
function TabBtn({ id, label, icon: Icon, active, onClick, accent }) {
  return (
    <button
      onClick={() => onClick(id)}
      className={`flex items-center gap-2 px-4 py-2.5 text-[12px] font-semibold border-b-2 transition-all whitespace-nowrap ${
        active
          ? "border-b-2 text-black"
          : "border-transparent text-[#7A7A78] hover:text-black hover:border-[#E5E5E3]"
      }`}
      style={active ? { borderBottomColor: accent } : {}}
    >
      <Icon size={13} />
      {label}
    </button>
  )
}

const TABS = [
  { id: "messages",      label: "Default Messages",    icon: MessageSquare, accent: "#3B82F6" },
  { id: "services",      label: "Services",            icon: Wrench,        accent: "#22C55E" },
  { id: "announcements", label: "Auto Announcements",  icon: Megaphone,     accent: "#F97316" },
  { id: "settings",      label: "Bot Settings",        icon: Settings,      accent: "#A855F7" },
]

// ══════════════════════════════════════════════════════════════════════════════
// TAB 1 — Default Messages
// ══════════════════════════════════════════════════════════════════════════════
function MessagesTab({ toast }) {
  const [msgs, setMsgs] = useState(() => LS.get("bot_messages", DEFAULT_MESSAGES))
  const [saved, setSaved] = useState({})

  const save = (key) => {
    LS.set("bot_messages", msgs)
    setSaved(p => ({ ...p, [key]: true }))
    toast("Message saved!")
    setTimeout(() => setSaved(p => ({ ...p, [key]: false })), 1500)
  }

  const DEFS = [
    { key: "welcome",      label: "Welcome Message",              sub: "Jab koi pehli baar /start karta hai" },
    { key: "exam_confirm", label: "Exam Confirmation Message",    sub: "Jab student exam select kare — {exam} placeholder use karo" },
    { key: "unsubscribe",  label: "Unsubscribe Message",          sub: "Jab student notifications band kare" },
  ]

  return (
    <div className="space-y-6">
      {DEFS.map(({ key, label, sub }) => (
        <div key={key} className="border border-[#E5E5E3] bg-white">
          <div className="px-5 py-4 border-b border-[#E5E5E3] flex items-start justify-between gap-4">
            <div>
              <p className="text-[13px] font-semibold text-black">{label}</p>
              <p className="text-[11px] text-[#AEAEAC] mt-0.5">{sub}</p>
            </div>
            <button
              onClick={() => save(key)}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-semibold border transition-colors flex-shrink-0 ${
                saved[key] ? "bg-[#2E7D32] text-white border-[#2E7D32]" : "bg-black text-white border-black hover:bg-[#3D3D3D]"
              }`}
            >
              {saved[key] ? <CheckCircle2 size={12} /> : <Save size={12} />}
              {saved[key] ? "Saved!" : "Save"}
            </button>
          </div>
          <div className="p-5">
            <textarea
              rows={5}
              value={msgs[key]}
              onChange={e => setMsgs(p => ({ ...p, [key]: e.target.value }))}
              className="w-full border border-[#E5E5E3] px-4 py-3 text-[13px] text-black bg-white focus:outline-none focus:border-black resize-none transition-colors leading-relaxed font-mono"
              placeholder="Message yahan likhein..."
            />
            <p className="text-[10px] text-[#AEAEAC] font-mono mt-1">{msgs[key].length} chars</p>
          </div>
        </div>
      ))}
    </div>
  )
}

// ══════════════════════════════════════════════════════════════════════════════
// TAB 2 — Services Manager (API-driven — changes reflect in bot immediately)
// ══════════════════════════════════════════════════════════════════════════════

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
  }
  const [form, setForm] = useState(service
    ? { name: service.name, description: service.description || "", price: service.price || "",
        category_key: service.category_key || "cert",
        category_label: service.category_label || CATEGORY_OPTIONS[0].label,
        enabled: Boolean(service.enabled) }
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
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-white border border-[#0A0A0A] shadow-[4px_4px_0px_#0A0A0A]">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E5E5E3] bg-[#F7F7F5]">
          <div>
            <p className="text-[10px] text-[#AEAEAC] font-semibold tracking-[0.18em] uppercase">{service ? "Edit Service" : "Add Service"}</p>
            <h2 className="text-[15px] font-semibold text-black mt-0.5">{service?.name || "New Service"}</h2>
          </div>
          <button onClick={onClose} className="text-[#AEAEAC] hover:text-black transition-colors"><X size={18} /></button>
        </div>
        <div className="px-6 py-5 space-y-4">
          {/* Category */}
          <div>
            <label className="text-[10px] text-[#AEAEAC] font-semibold tracking-[0.15em] uppercase block mb-1.5">Category *</label>
            <select
              value={form.category_key}
              onChange={e => handleCategoryChange(e.target.value)}
              className="w-full border border-[#E5E5E3] px-4 py-2.5 text-[13px] text-black bg-white focus:outline-none focus:border-black transition-colors"
            >
              {CATEGORY_OPTIONS.map(c => <option key={c.key} value={c.key}>{c.label}</option>)}
            </select>
          </div>
          {/* Name */}
          <div>
            <label className="text-[10px] text-[#AEAEAC] font-semibold tracking-[0.15em] uppercase block mb-1.5">Service Name *</label>
            <input
              type="text" value={form.name} onChange={e => set("name", e.target.value)}
              className="w-full border border-[#E5E5E3] px-4 py-2.5 text-[13px] text-black focus:outline-none focus:border-black transition-colors"
              placeholder="e.g. Aadhar Update"
            />
          </div>
          {/* Description */}
          <div>
            <label className="text-[10px] text-[#AEAEAC] font-semibold tracking-[0.15em] uppercase block mb-1.5">Description</label>
            <input
              type="text" value={form.description} onChange={e => set("description", e.target.value)}
              className="w-full border border-[#E5E5E3] px-4 py-2.5 text-[13px] text-black focus:outline-none focus:border-black transition-colors"
              placeholder="Short description (optional)"
            />
          </div>
          {/* Price */}
          <div>
            <label className="text-[10px] text-[#AEAEAC] font-semibold tracking-[0.15em] uppercase block mb-1.5">Price (optional)</label>
            <input
              type="text" value={form.price} onChange={e => set("price", e.target.value)}
              className="w-full border border-[#E5E5E3] px-4 py-2.5 text-[13px] text-black focus:outline-none focus:border-black transition-colors"
              placeholder="e.g. ₹50 or Free"
            />
          </div>
          {/* Toggle */}
          <div className="flex items-center gap-3">
            <label className="text-[12px] font-semibold text-black">Active in Bot</label>
            <button onClick={() => set("enabled", !form.enabled)} className="transition-colors">
              {form.enabled
                ? <ToggleRight size={26} className="text-[#2E7D32]" />
                : <ToggleLeft size={26} className="text-[#AEAEAC]" />}
            </button>
            <span className="text-[11px] text-[#7A7A78]">{form.enabled ? "Visible in /services" : "Hidden from bot"}</span>
          </div>
        </div>
        <div className="px-6 pb-5 flex gap-3">
          <button onClick={onClose} className="flex-1 py-2.5 border border-[#E5E5E3] text-[13px] text-[#7A7A78] hover:border-black hover:text-black transition-colors">Cancel</button>
          <button
            onClick={() => valid && !loading && onSave(form)}
            disabled={!valid || loading}
            className="flex-1 py-2.5 bg-black text-white text-[13px] font-semibold hover:bg-[#3D3D3D] transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            {loading ? "Saving..." : service ? "Update" : "Add Service"}
          </button>
        </div>
      </div>
    </div>
  )
}

function ServicesTab({ toast }) {
  const [services, setServices] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [modal, setModal] = useState(null) // null | "add" | { ...service }

  const load = () => {
    setLoading(true)
    getServices()
      .then(d => setServices(d.services || []))
      .catch(() => toast("Failed to load services"))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const handleToggle = async (id) => {
    await toggleService(id)
    setServices(prev => prev.map(s => s.id === id ? { ...s, enabled: s.enabled ? 0 : 1 } : s))
  }

  const handleDelete = async (id) => {
    if (!window.confirm("Is service ko bot se hata dein?")) return
    await deleteServiceApi(id)
    setServices(prev => prev.filter(s => s.id !== id))
    toast("Service delete ho gayi!")
  }

  const handleSave = async (form) => {
    setSaving(true)
    try {
      if (modal === "add") {
        await createService(form)
        toast("✓ Service add ho gayi — bot mein live hai!")
      } else {
        await updateService(modal.id, form)
        toast("✓ Service update ho gayi — bot mein live hai!")
      }
      setModal(null)
      load()
    } catch {
      toast("Error: save nahi hua")
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
    <div className="space-y-4">
      {modal && <ServiceModal service={modal === "add" ? null : modal} onSave={handleSave} onClose={() => setModal(null)} loading={saving} />}

      <div className="flex items-center justify-between">
        <div>
          <p className="text-[11px] text-[#AEAEAC] font-mono">
            {services.length} services · {services.filter(s => s.enabled).length} active in bot
          </p>
          <p className="text-[10px] text-[#22C55E] mt-0.5">✓ Changes reflect in Telegram bot immediately</p>
        </div>
        <button
          onClick={() => setModal("add")}
          className="flex items-center gap-2 px-3 py-2 bg-black text-white text-[12px] font-semibold hover:bg-[#3D3D3D] transition-colors"
        >
          <Plus size={13} /> Add Service
        </button>
      </div>

      {loading ? (
        <div className="py-16 flex justify-center">
          <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="space-y-4">
          {Object.entries(grouped).map(([catLabel, items]) => (
            <div key={catLabel} className="border border-[#E5E5E3] bg-white">
              <div className="px-5 py-3 bg-[#F7F7F5] border-b border-[#E5E5E3]">
                <p className="text-[11px] font-semibold text-[#3D3D3D]">{catLabel}</p>
              </div>
              {items.map(s => (
                <div key={s.id} className="flex items-center gap-4 px-5 py-3.5 border-b border-[#E5E5E3] last:border-0 hover:bg-[#F7F7F5] transition-colors">
                  <button onClick={() => handleToggle(s.id)} className="flex-shrink-0 transition-colors">
                    {s.enabled
                      ? <ToggleRight size={22} className="text-[#2E7D32]" />
                      : <ToggleLeft size={22} className="text-[#AEAEAC]" />}
                  </button>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className={`text-[13px] font-semibold ${s.enabled ? "text-black" : "text-[#AEAEAC]"}`}>{s.name}</p>
                      {s.price && <span className="text-[10px] font-semibold border border-[#E5E5E3] px-1.5 py-0.5 text-[#7A7A78]">{s.price}</span>}
                      {!s.enabled && <span className="text-[9px] font-bold tracking-wider uppercase bg-[#F7F7F5] border border-[#E5E5E3] px-1.5 py-0.5 text-[#AEAEAC]">OFF</span>}
                    </div>
                    {s.description && <p className="text-[11px] text-[#7A7A78] mt-0.5">{s.description}</p>}
                  </div>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <button onClick={() => setModal(s)} className="w-8 h-8 border border-[#E5E5E3] flex items-center justify-center text-[#7A7A78] hover:border-black hover:text-black transition-colors" title="Edit">
                      <Pencil size={13} />
                    </button>
                    <button onClick={() => handleDelete(s.id)} className="w-8 h-8 border border-[#E5E5E3] flex items-center justify-center text-[#7A7A78] hover:border-red-500 hover:text-red-500 hover:bg-red-50 transition-colors" title="Delete">
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ))}
          {services.length === 0 && (
            <div className="py-12 text-center border border-[#E5E5E3]">
              <p className="text-[13px] text-[#AEAEAC]">Koi service nahi. "Add Service" se shuru karein.</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}


// ══════════════════════════════════════════════════════════════════════════════
// TAB 3 — Auto Announcements
// ══════════════════════════════════════════════════════════════════════════════
const EXAM_OPTS = ["ALL", "JEE", "NEET", "SSC", "UPSC", "CUET"]
const EXAM_BAR = { JEE: "#3B82F6", NEET: "#22C55E", SSC: "#F97316", UPSC: "#EF4444", CUET: "#A855F7", ALL: "#0A0A0A" }

function AnnouncementModal({ ann, onSave, onClose }) {
  const [form, setForm] = useState(ann || { exam: "ALL", message: "", runAt: "" })
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }))
  const valid = form.message.trim() && form.runAt

  const getMin = () => { const d = new Date(); d.setMinutes(d.getMinutes() - d.getTimezoneOffset() + 5); return d.toISOString().slice(0, 16) }

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-white border border-[#0A0A0A] shadow-[4px_4px_0px_#0A0A0A]">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E5E5E3] bg-[#F7F7F5]">
          <div>
            <p className="text-[10px] text-[#AEAEAC] font-semibold tracking-[0.18em] uppercase">{ann ? "Edit" : "Schedule"}</p>
            <h2 className="text-[15px] font-semibold text-black mt-0.5">Auto Announcement</h2>
          </div>
          <button onClick={onClose} className="text-[#AEAEAC] hover:text-black transition-colors"><X size={18} /></button>
        </div>
        <div className="px-6 py-5 space-y-4">
          <div>
            <label className="text-[10px] text-[#AEAEAC] font-semibold tracking-[0.15em] uppercase block mb-1.5">Target Exam</label>
            <div className="flex flex-wrap gap-2">
              {EXAM_OPTS.map(e => (
                <button
                  key={e}
                  onClick={() => set("exam", e)}
                  className={`px-3 py-1.5 text-[12px] font-bold border transition-colors ${form.exam === e ? "text-white border-transparent" : "bg-white text-[#7A7A78] border-[#E5E5E3] hover:border-black hover:text-black"}`}
                  style={form.exam === e ? { backgroundColor: EXAM_BAR[e], borderColor: EXAM_BAR[e] } : {}}
                >
                  {e}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-[10px] text-[#AEAEAC] font-semibold tracking-[0.15em] uppercase block mb-1.5">Message *</label>
            <textarea
              rows={4} value={form.message} onChange={e => set("message", e.target.value)}
              className="w-full border border-[#E5E5E3] px-4 py-3 text-[13px] text-black focus:outline-none focus:border-black resize-none transition-colors"
              placeholder="JEE exam 30 din baad hai! Tayaari karo..."
            />
          </div>
          <div>
            <label className="text-[10px] text-[#AEAEAC] font-semibold tracking-[0.15em] uppercase block mb-1.5">Send At *</label>
            <input
              type="datetime-local" min={getMin()} value={form.runAt} onChange={e => set("runAt", e.target.value)}
              className="border border-[#E5E5E3] px-4 py-2.5 text-[13px] text-black bg-white focus:outline-none focus:border-black transition-colors"
            />
          </div>
        </div>
        <div className="px-6 pb-5 flex gap-3">
          <button onClick={onClose} className="flex-1 py-2.5 border border-[#E5E5E3] text-[13px] text-[#7A7A78] hover:border-black hover:text-black transition-colors">Cancel</button>
          <button
            onClick={() => valid && onSave(form)}
            disabled={!valid}
            className="flex-1 py-2.5 bg-black text-white text-[13px] font-semibold hover:bg-[#3D3D3D] transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            {ann ? "Update" : "Schedule"}
          </button>
        </div>
      </div>
    </div>
  )
}

function AnnouncementsTab({ toast }) {
  const [anns, setAnns] = useState(() => LS.get("bot_announcements", DEFAULT_ANNOUNCEMENTS))
  const [modal, setModal] = useState(null)

  const persist = (updated) => { setAnns(updated); LS.set("bot_announcements", updated) }
  const remove = (id) => { if (window.confirm("Delete this scheduled announcement?")) persist(anns.filter(a => a.id !== id)) }
  const handleSave = (form) => {
    if (modal === "add") { persist([...anns, { ...form, id: Date.now(), sent: false }]); toast("Announcement scheduled!") }
    else { persist(anns.map(a => a.id === modal.id ? { ...a, ...form } : a)); toast("Announcement updated!") }
    setModal(null)
  }

  const fmt = (dt) => new Date(dt).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })
  const isPast = (dt) => new Date(dt) < new Date()

  return (
    <div className="space-y-4">
      {modal && <AnnouncementModal ann={modal === "add" ? null : modal} onSave={handleSave} onClose={() => setModal(null)} />}

      <div className="flex items-center justify-between">
        <p className="text-[11px] text-[#AEAEAC] font-mono">{anns.filter(a => !isPast(a.runAt)).length} upcoming · {anns.filter(a => isPast(a.runAt) || a.sent).length} done</p>
        <button
          onClick={() => setModal("add")}
          className="flex items-center gap-2 px-3 py-2 bg-black text-white text-[12px] font-semibold hover:bg-[#3D3D3D] transition-colors"
        >
          <Plus size={13} /> Schedule New
        </button>
      </div>

      <div className="border border-[#E5E5E3] bg-white divide-y divide-[#E5E5E3]">
        {anns.length === 0 && (
          <div className="py-12 text-center">
            <p className="text-[13px] text-[#AEAEAC]">Koi scheduled announcement nahi hai.</p>
          </div>
        )}
        {[...anns].sort((a, b) => new Date(a.runAt) - new Date(b.runAt)).map(ann => {
          const past = isPast(ann.runAt)
          return (
            <div key={ann.id} className={`flex items-start gap-4 px-5 py-4 hover:bg-[#F7F7F5] transition-colors ${past ? "opacity-60" : ""}`}>
              {/* Exam pill */}
              <span
                className="flex-shrink-0 mt-0.5 px-2 py-0.5 text-[10px] font-bold text-white"
                style={{ backgroundColor: EXAM_BAR[ann.exam] || "#0A0A0A" }}
              >
                {ann.exam}
              </span>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <p className="text-[13px] text-[#3D3D3D] line-clamp-2">{ann.message}</p>
                <div className="flex items-center gap-1.5 mt-1.5 text-[11px] text-[#AEAEAC] font-mono">
                  <Clock size={11} />
                  <span>{fmt(ann.runAt)}</span>
                  {past && <span className="text-[10px] font-semibold text-[#AEAEAC] border border-[#E5E5E3] px-1.5 py-0.5 ml-1">DONE</span>}
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1.5 flex-shrink-0">
                {!past && (
                  <button
                    onClick={() => setModal(ann)}
                    className="w-8 h-8 border border-[#E5E5E3] flex items-center justify-center text-[#7A7A78] hover:border-black hover:text-black transition-colors"
                  >
                    <Pencil size={13} />
                  </button>
                )}
                <button
                  onClick={() => remove(ann.id)}
                  className="w-8 h-8 border border-[#E5E5E3] flex items-center justify-center text-[#7A7A78] hover:border-red-500 hover:text-red-500 hover:bg-red-50 transition-colors"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ══════════════════════════════════════════════════════════════════════════════
// TAB 4 — Bot Settings
// ══════════════════════════════════════════════════════════════════════════════
function SettingsTab({ toast }) {
  const [settings, setSettings] = useState(() => LS.get("bot_settings", DEFAULT_SETTINGS))
  const set = (k, v) => setSettings(p => ({ ...p, [k]: v }))

  const save = () => {
    LS.set("bot_settings", settings)
    toast("Settings saved!")
  }

  return (
    <div className="max-w-xl space-y-6">
      {/* Bot Name */}
      <div className="border border-[#E5E5E3] bg-white">
        <div className="px-5 py-4 border-b border-[#E5E5E3] flex items-center gap-2">
          <BotMessageSquare size={14} className="text-[#7A7A78]" />
          <p className="text-[12px] font-semibold text-black">Bot Name</p>
        </div>
        <div className="px-5 py-4">
          <input
            type="text"
            value={settings.botName}
            onChange={e => set("botName", e.target.value)}
            className="w-full border border-[#E5E5E3] px-4 py-2.5 text-[13px] text-black focus:outline-none focus:border-black transition-colors"
            placeholder="e.g. E-Mitra Seva"
          />
          <p className="text-[11px] text-[#AEAEAC] mt-1.5">Ye naam broadcasts ke header mein dikhega.</p>
        </div>
      </div>

      {/* Language */}
      <div className="border border-[#E5E5E3] bg-white">
        <div className="px-5 py-4 border-b border-[#E5E5E3] flex items-center gap-2">
          <Languages size={14} className="text-[#7A7A78]" />
          <p className="text-[12px] font-semibold text-black">Default Language</p>
        </div>
        <div className="px-5 py-4">
          <div className="flex gap-3">
            {[
              { val: "hindi",    label: "हिंदी",  sub: "Pure Hindi" },
              { val: "english",  label: "English", sub: "Pure English" },
              { val: "hinglish", label: "Hinglish",sub: "Hindi + English mix" },
            ].map(({ val, label, sub }) => (
              <button
                key={val}
                onClick={() => set("language", val)}
                className={`flex-1 border py-3 px-3 text-left transition-colors ${
                  settings.language === val
                    ? "border-black bg-black text-white"
                    : "border-[#E5E5E3] bg-white text-[#3D3D3D] hover:border-black"
                }`}
              >
                <p className="text-[13px] font-semibold">{label}</p>
                <p className={`text-[10px] mt-0.5 ${settings.language === val ? "text-white/70" : "text-[#AEAEAC]"}`}>{sub}</p>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Notification Cooldown */}
      <div className="border border-[#E5E5E3] bg-white">
        <div className="px-5 py-4 border-b border-[#E5E5E3] flex items-center gap-2">
          <Bell size={14} className="text-[#7A7A78]" />
          <p className="text-[12px] font-semibold text-black">Notification Cooldown</p>
        </div>
        <div className="px-5 py-4">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3 flex-1">
              <span className="text-[13px] text-[#3D3D3D]">Max</span>
              <input
                type="number"
                min={1} max={20}
                value={settings.maxMsgDay}
                onChange={e => set("maxMsgDay", Number(e.target.value))}
                className="w-20 border border-[#E5E5E3] px-3 py-2 text-[13px] text-black text-center focus:outline-none focus:border-black transition-colors"
              />
              <span className="text-[13px] text-[#3D3D3D]">messages per student per day</span>
            </div>
          </div>
          <p className="text-[11px] text-[#AEAEAC] mt-2">Isse zyada messages ek din mein nahi jayenge.</p>
        </div>
      </div>

      {/* Save */}
      <button
        onClick={save}
        className="flex items-center gap-2 px-5 py-3 bg-black text-white text-[13px] font-semibold hover:bg-[#3D3D3D] transition-colors"
      >
        <Save size={14} />
        Save All Settings
      </button>
    </div>
  )
}

// ══════════════════════════════════════════════════════════════════════════════
// MAIN PAGE
// ══════════════════════════════════════════════════════════════════════════════
export default function BotManager() {
  const [activeTab, setActiveTab] = useState("messages")
  const [toastVisible, setToastVisible] = useState(false)
  const [toastMsg, setToastMsg] = useState("")

  const showToast = (msg) => {
    setToastMsg(msg)
    setToastVisible(true)
    setTimeout(() => setToastVisible(false), 2500)
  }


  return (
    <div className="space-y-6">
      <Toast visible={toastVisible} message={toastMsg} />

      {/* Header */}
      <div className="border-b border-[#E5E5E3] pb-6">
        <p className="text-[10px] font-semibold tracking-[0.18em] uppercase text-[#AEAEAC] mb-2">Configuration</p>
        <h1 className="text-3xl font-light text-black tracking-tight">Bot Manager</h1>
        <p className="text-[13px] text-[#7A7A78] mt-1">Bot ke messages, services, announcements aur settings manage karein.</p>
      </div>

      {/* Tab bar */}
      <div className="flex border-b border-[#E5E5E3] -mb-px overflow-x-auto">
        {TABS.map(tab => (
          <TabBtn
            key={tab.id}
            id={tab.id}
            label={tab.label}
            icon={tab.icon}
            active={activeTab === tab.id}
            onClick={setActiveTab}
            accent={tab.accent}
          />
        ))}
      </div>

      {/* Tab content */}
      <div>
        {activeTab === "messages"      && <MessagesTab      toast={showToast} />}
        {activeTab === "services"      && <ServicesTab      toast={showToast} />}
        {activeTab === "announcements" && <AnnouncementsTab toast={showToast} />}
        {activeTab === "settings"      && <SettingsTab      toast={showToast} />}
      </div>
    </div>
  )
}
