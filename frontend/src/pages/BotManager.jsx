import { useState, useEffect } from "react"
import {
  MessageSquare, Wrench, Megaphone, Settings,
  Plus, Pencil, Trash2, ToggleLeft, ToggleRight,
  Save, CheckCircle2, Clock, BotMessageSquare,
  X, Bell, Languages,
} from "lucide-react"
import {
  getExams, createExam, deleteExamApi
} from "../api"
import { getExamColor } from "../constants/examColors"

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
      className={`flex items-center gap-2 px-5 py-2.5 text-[13px] font-bold transition-all rounded-[16px] shadow-sm ${
        active
          ? "bg-[var(--color-surface-low)] text-[var(--color-primary)] border border-[var(--color-surface-low)] shadow-ambient"
          : "bg-[var(--color-surface-lowest)] text-[var(--color-on-surface)] border border-transparent hover:text-[var(--color-primary)] hover:bg-[var(--color-surface-bright)]"
      }`}
    >
      <Icon size={14} />
      {label}
    </button>
  )
}

const TABS = [
  { id: "messages",      label: "Default Messages",    icon: MessageSquare, accent: "#3B82F6" },
  { id: "exams",         label: "Exams",               icon: Plus,          accent: "#EF4444" },
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
        <div key={key} className="bg-[var(--color-surface-lowest)] rounded-xl overflow-hidden shadow-ambient border-none">
          <div className="px-6 py-5 bg-[var(--color-surface-low)] flex items-start justify-between gap-4">
            <div>
              <p className="text-[14px] font-bold text-gray-900">{label}</p>
              <p className="text-[12px] text-gray-500 mt-1 font-medium">{sub}</p>
            </div>
            <button
              onClick={() => save(key)}
              className={`flex items-center gap-2 px-4 py-2 text-[13px] font-bold transition-all rounded-md flex-shrink-0 shadow-sm ${
                saved[key] ? "bg-[#10B981] text-white" : "bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-primary-container)] text-white hover:shadow-ambient hover:-translate-y-0.5"
              }`}
            >
              {saved[key] ? <CheckCircle2 size={14} /> : <Save size={14} />}
              {saved[key] ? "Saved!" : "Save"}
            </button>
          </div>
          <div className="p-6">
            <textarea
              rows={5}
              value={msgs[key]}
              onChange={e => setMsgs(p => ({ ...p, [key]: e.target.value }))}
              className="w-full border border-[var(--color-outline-variant)] px-5 py-4 text-[13px] text-[var(--color-on-surface)] bg-[var(--color-surface-lowest)] focus:outline-none shadow-sm resize-none transition-all leading-relaxed rounded-xl"
              placeholder="Message yahan likhein..."
            />
            <p className="text-[11px] text-gray-400 font-medium mt-2">{msgs[key].length} chars</p>
          </div>
        </div>
      ))}
    </div>
  )
}

// ══════════════════════════════════════════════════════════════════════════════
// TAB 2 — Services Manager (API-driven — changes reflect in bot immediately)
// ══════════════════════════════════════════════════════════════════════════════




// ══════════════════════════════════════════════════════════════════════════════
// TAB 3 — Auto Announcements
// ══════════════════════════════════════════════════════════════════════════════

function AnnouncementModal({ ann, onSave, onClose, examOpts }) {
  const [form, setForm] = useState(ann || { exam: "ALL", message: "", runAt: "" })
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }))
  const valid = form.message.trim() && form.runAt

  const getMin = () => { const d = new Date(); d.setMinutes(d.getMinutes() - d.getTimezoneOffset() + 5); return d.toISOString().slice(0, 16) }

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-white shadow-xl rounded-[24px] overflow-hidden">
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 bg-[#F8FAFC]">
          <div>
            <p className="text-[10px] text-[#164FA8] font-bold tracking-widest uppercase">{ann ? "Edit" : "Schedule"}</p>
            <h2 className="text-[16px] font-bold text-gray-900 mt-1">Auto Announcement</h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-900 transition-colors p-1 bg-white rounded-full border border-gray-200"><X size={16} /></button>
        </div>
        <div className="px-6 py-5 space-y-4">
          <div>
            <label className="text-[10px] text-gray-500 font-bold tracking-widest uppercase block mb-2">Target Exam</label>
            <div className="flex flex-wrap gap-2">
              {examOpts.map(e => (
                <button
                  key={e}
                  onClick={() => set("exam", e)}
                  className={`px-4 py-2 text-[13px] font-bold transition-all rounded-[12px] shadow-sm ${form.exam === e ? "text-white border-transparent" : "bg-white text-gray-500 border border-gray-200 hover:border-[#164FA8] hover:text-[#164FA8]"}`}
                  style={form.exam === e ? { backgroundColor: getExamColor(e), borderColor: getExamColor(e) } : {}}
                >
                  {e}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-[10px] text-gray-500 font-bold tracking-widest uppercase block mb-2">Message *</label>
            <textarea
              rows={5} value={form.message} onChange={e => set("message", e.target.value)}
              className="w-full border border-gray-200 px-4 py-3 text-[13px] text-gray-900 focus:outline-none focus:border-[#164FA8] focus:ring-1 focus:ring-[#164FA8] shadow-sm resize-none transition-all rounded-[16px]"
              placeholder="JEE exam 30 din baad hai! Tayaari karo..."
            />
          </div>
          <div>
            <label className="text-[10px] text-gray-500 font-bold tracking-widest uppercase block mb-2">Send At *</label>
            <input
              type="datetime-local" min={getMin()} value={form.runAt} onChange={e => set("runAt", e.target.value)}
              className="w-full border border-gray-200 px-4 py-3 text-[13px] text-gray-900 bg-white focus:outline-none focus:border-[#164FA8] focus:ring-1 focus:ring-[#164FA8] shadow-sm transition-all rounded-[12px]"
            />
          </div>
        </div>
        <div className="px-6 pb-6 flex gap-3">
          <button onClick={onClose} className="flex-1 py-3 border border-gray-200 bg-white text-[13px] font-semibold text-gray-600 hover:border-gray-300 hover:bg-gray-50 transition-all rounded-[12px]">Cancel</button>
          <button
            onClick={() => valid && onSave(form)}
            disabled={!valid}
            className="flex-1 py-3 bg-[#4162EE] text-white text-[13px] font-bold hover:bg-[#3451D4] hover:shadow-lg transition-all rounded-[12px] disabled:opacity-50 disabled:cursor-not-allowed"
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
  const [examOpts, setExamOpts] = useState(["ALL"])

  useEffect(() => {
    getExams().then(d => setExamOpts(["ALL", ...d.exams.map(e => e.name)])).catch(console.error)
  }, [])

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
      {modal && <AnnouncementModal ann={modal === "add" ? null : modal} onSave={handleSave} onClose={() => setModal(null)} examOpts={examOpts} />}

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <p className="text-[12px] text-gray-500 font-medium">{anns.filter(a => !isPast(a.runAt)).length} upcoming · {anns.filter(a => isPast(a.runAt) || a.sent).length} done</p>
        <button
          onClick={() => setModal("add")}
          className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-primary-container)] text-white text-[13px] font-bold transition-all rounded-xl shadow-ambient hover:shadow-lg hover:-translate-y-0.5"
        >
          <Plus size={14} /> Schedule New
        </button>
      </div>

      <div className="bg-[var(--color-surface-lowest)] rounded-xl overflow-hidden shadow-ambient border-none">
        {anns.length === 0 && (
          <div className="py-16 text-center">
            <p className="text-[13px] text-gray-500 font-medium">Koi scheduled announcement nahi hai.</p>
          </div>
        )}
        {[...anns].sort((a, b) => new Date(a.runAt) - new Date(b.runAt)).map(ann => {
          const past = isPast(ann.runAt)
          return (
            <div key={ann.id} className={`flex flex-col sm:flex-row sm:items-start gap-4 px-6 py-6 transition-colors odd:bg-[var(--color-surface-low)] even:bg-[var(--color-surface-lowest)] hover:bg-[var(--color-surface-bright)] ${past ? "opacity-60 grayscale-[0.3]" : ""}`}>
              {/* Exam pill */}
              <span
                className="flex-shrink-0 mt-1 px-3 py-1 text-[11px] font-bold tracking-widest text-white uppercase rounded-[8px]"
                style={{ backgroundColor: getExamColor(ann.exam) }}
              >
                {ann.exam}
              </span>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <p className="text-[14px] font-bold text-gray-900 leading-relaxed max-w-3xl">{ann.message}</p>
                <div className="flex items-center gap-2 mt-2 text-[12px] text-gray-500 font-medium">
                  <Clock size={12} />
                  <span>{fmt(ann.runAt)}</span>
                  {past && <span className="text-[10px] font-bold text-[#10B981] bg-emerald-50 px-2 py-0.5 ml-1 rounded-full uppercase tracking-widest">DONE</span>}
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 flex-shrink-0">
                {!past && (
                  <button
                    onClick={() => setModal(ann)}
                    className="w-9 h-9 bg-transparent flex items-center justify-center text-gray-500 hover:text-[var(--color-primary)] hover:bg-[var(--color-surface-bright)] transition-all rounded-md"
                  >
                    <Pencil size={14} />
                  </button>
                )}
                <button
                  onClick={() => remove(ann.id)}
                  className="w-9 h-9 bg-transparent flex items-center justify-center text-gray-500 hover:text-red-500 hover:bg-[#fef2f2] transition-all rounded-md"
                >
                  <Trash2 size={14} />
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
// TAB 3.5 — Exams Manager
// ══════════════════════════════════════════════════════════════════════════════
function ExamsTab({ toast }) {
  const [exams, setExams] = useState([])
  const [loading, setLoading] = useState(true)
  const [newExam, setNewExam] = useState("")
  const [saving, setSaving] = useState(false)

  const load = () => {
    setLoading(true)
    getExams()
      .then(d => setExams(d.exams || []))
      .catch(() => toast("Failed to load exams"))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const handleAdd = async () => {
    const val = newExam.trim()
    if (!val) return
    setSaving(true)
    try {
      const res = await createExam({ name: val })
      if (res.success) {
        toast("✓ Exam added!")
        setNewExam("")
        load()
      } else {
        toast(res.error || "Error adding exam")
      }
    } catch {
      toast("Request failed")
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete ${name}? Students will keep their current preference but won't be able to select it again.`)) return
    await deleteExamApi(id)
    toast("Exam deleted")
    load()
  }

  return (
    <div className="space-y-6 max-w-xl">
      <div className="bg-[var(--color-surface-lowest)] p-6 rounded-xl shadow-ambient border-none">
        <label className="text-[10px] text-gray-500 font-bold tracking-widest uppercase block mb-3">Add New Exam</label>
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            value={newExam}
            onChange={e => setNewExam(e.target.value.toUpperCase())}
            onKeyDown={e => e.key === "Enter" && handleAdd()}
            placeholder="e.g. GATE"
            className="flex-1 border border-[var(--color-outline-variant)] px-5 py-3 text-[13px] text-gray-900 bg-white focus:outline-none focus:ring-0 shadow-sm transition-all rounded-xl"
          />
          <button
            onClick={handleAdd}
            disabled={!newExam.trim() || saving}
            className="px-8 py-3 bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-primary-container)] text-white text-[13px] font-bold transition-all rounded-xl shadow-ambient hover:shadow-lg hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? "Adding..." : "Add"}
          </button>
        </div>
      </div>

      <div className="bg-[var(--color-surface-lowest)] rounded-xl overflow-hidden shadow-ambient border-none">
        {loading ? (
          <div className="py-12 flex justify-center">
             <div className="w-6 h-6 border-2 border-[#164FA8] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : exams.length === 0 ? (
          <div className="py-12 text-center text-[13px] text-gray-500 font-medium">No exams found</div>
        ) : (
          exams.map(exam => {
            const color = getExamColor(exam.name)
            return (
              <div key={exam.id} className="flex flex-col sm:flex-row sm:items-center justify-between px-6 py-5 transition-colors gap-3 odd:bg-[var(--color-surface-low)] even:bg-[var(--color-surface-lowest)] hover:bg-[var(--color-surface-bright)]">
                <span
                   className="inline-flex items-center justify-center px-4 py-1.5 text-[11px] font-bold tracking-widest uppercase text-white rounded-[8px]"
                   style={{ backgroundColor: color }}
                >
                  {exam.name}
                </span>
                <button
                  onClick={() => handleDelete(exam.id, exam.name)}
                  className="w-9 h-9 bg-transparent flex items-center justify-center text-gray-500 hover:text-red-500 hover:bg-[#fef2f2] transition-all rounded-md"
                  title="Delete"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            )
          })
        )}
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
    <div className="max-w-2xl space-y-6">
      {/* Bot Name */}
      <div className="bg-[var(--color-surface-lowest)] rounded-xl overflow-hidden shadow-ambient border-none">
        <div className="px-6 py-4 bg-[var(--color-surface-low)] flex items-center gap-3">
          <div className="w-8 h-8 bg-transparent text-[var(--color-primary)] flex items-center justify-center">
            <BotMessageSquare size={14} />
          </div>
          <p className="text-[14px] font-bold text-[var(--color-on-surface)]">Bot Name</p>
        </div>
        <div className="px-6 py-5">
          <input
            type="text"
            value={settings.botName}
            onChange={e => set("botName", e.target.value)}
            className="w-full border border-[var(--color-outline-variant)] px-5 py-3.5 text-[13px] text-[var(--color-on-surface)] bg-transparent focus:outline-none focus:ring-0 shadow-sm transition-all rounded-xl"
            placeholder="e.g. E-Mitra Seva"
          />
          <p className="text-[12px] text-gray-500 font-medium mt-2">Ye naam broadcasts ke header mein dikhega.</p>
        </div>
      </div>

      {/* Language */}
      <div className="bg-[var(--color-surface-lowest)] rounded-xl overflow-hidden shadow-ambient border-none">
        <div className="px-6 py-4 bg-[var(--color-surface-low)] flex items-center gap-3">
          <div className="w-8 h-8 bg-transparent text-[var(--color-primary)] flex items-center justify-center">
            <Languages size={14} />
          </div>
          <p className="text-[14px] font-bold text-[var(--color-on-surface)]">Default Language</p>
        </div>
        <div className="px-6 py-5">
          <div className="flex flex-col sm:flex-row gap-3">
            {[
              { val: "hindi",    label: "हिंदी",  sub: "Pure Hindi" },
              { val: "english",  label: "English", sub: "Pure English" },
              { val: "hinglish", label: "Hinglish",sub: "Hindi + English mix" },
            ].map(({ val, label, sub }) => (
              <button
                key={val}
                onClick={() => set("language", val)}
                className={`flex-1 py-4 px-4 text-left transition-all rounded-xl shadow-ambient border-none ${
                  settings.language === val
                    ? "bg-[var(--color-primary-fixed)] text-[var(--color-primary)]"
                    : "bg-[var(--color-surface-lowest)] text-[var(--color-on-surface)] hover:bg-[var(--color-surface-low)]"
                }`}
              >
                <p className="text-[14px] font-bold">{label}</p>
                <p className={`text-[11px] font-medium mt-1 ${settings.language === val ? "text-[var(--color-on-surface)]" : "text-gray-400"}`}>{sub}</p>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Notification Cooldown */}
      <div className="bg-[var(--color-surface-lowest)] rounded-xl overflow-hidden shadow-ambient border-none">
        <div className="px-6 py-4 bg-[var(--color-surface-low)] flex items-center gap-3">
          <div className="w-8 h-8 bg-transparent text-[var(--color-primary)] flex items-center justify-center">
            <Bell size={14} />
          </div>
          <p className="text-[14px] font-bold text-[var(--color-on-surface)]">Notification Cooldown</p>
        </div>
        <div className="px-6 py-5">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="flex items-center gap-3 flex-wrap flex-1 bg-[var(--color-surface-low)] p-3 pl-4 rounded-xl">
              <span className="text-[13px] font-bold text-[var(--color-on-surface)]">Max limit</span>
              <input
                type="number"
                min={1} max={20}
                value={settings.maxMsgDay}
                onChange={e => set("maxMsgDay", Number(e.target.value))}
                className="w-20 border border-[var(--color-outline-variant)] px-3 py-2 text-[14px] font-bold text-[var(--color-on-surface)] bg-transparent text-center focus:outline-none focus:ring-0 shadow-sm transition-all rounded-xl"
              />
              <span className="text-[13px] font-medium text-gray-600">messages per student per day</span>
            </div>
          </div>
          <p className="text-[12px] text-gray-500 font-medium mt-3 px-1">Isse zyada messages ek din mein nahi jayenge.</p>
        </div>
      </div>

      {/* Save */}
      <button
        onClick={save}
        className="flex items-center justify-center gap-2 w-full py-4 bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-primary-container)] text-white text-[14px] font-bold transition-all rounded-xl shadow-ambient hover:shadow-lg hover:-translate-y-0.5"
      >
        <Save size={16} />
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
      <div className="flex items-end justify-between mb-8">
        <div>
          <p className="text-[11px] font-bold tracking-[0.15em] uppercase text-[#164FA8] mb-2">Configuration</p>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight leading-tight">Bot Manager</h1>
          <p className="text-[14px] text-gray-500 mt-2 max-w-2xl leading-relaxed">Bot ke messages, services, announcements aur settings manage karein.</p>
        </div>
      </div>

      {/* Tab bar */}
      <div className="flex gap-2 border-b border-transparent pb-2 mb-6 overflow-x-auto scroller-hide">
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
        {activeTab === "exams"         && <ExamsTab         toast={showToast} />}
        {activeTab === "announcements" && <AnnouncementsTab toast={showToast} />}
        {activeTab === "settings"      && <SettingsTab      toast={showToast} />}
      </div>
    </div>
  )
}
