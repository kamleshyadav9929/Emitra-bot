import React, { useState, useEffect } from "react"
import { motion, AnimatePresence } from "motion/react"
import { 
  X, UploadCloud, FileText, CheckCircle, ArrowRight, ArrowLeft, 
  Trash2, AlertCircle, RefreshCw, FileCheck, Info
} from "lucide-react"
import * as api from "../../api"
import { useAuth } from "../../context/AuthContext"

// Helper to determine required documents based on the exam definition from the database
const getRequiredDocsForExam = (examName, examsList) => {
  const exam = (examsList || []).find(e => e.name === examName)
  if (exam && exam.required_documents) {
    return exam.required_documents
      .split(",")
      .map(d => d.trim())
      .filter(Boolean)
  }
  
  // Default fallback list
  return [
    "Passport Size Photograph",
    "Candidate Signature",
    "Highest Qualification Marksheet",
    "Aadhar Card / Identity Proof"
  ]
}

// Helper to determine if a document is required based on category and name
const isDocRequired = (docLabel, category) => {
  const label = docLabel.toLowerCase()
  if (label.includes("optional")) return false
  if (label.includes("category certificate") || label.includes("caste") || label.includes("ews certificate")) {
    // Only required if category is not General
    return category && category !== "General" && category !== "GEN"
  }
  return true
}

const STEPS = [
  { id: 1, title: "Upload Files" },
  { id: 2, title: "Review & Submit" }
]

export default function ExamFormWizard({ isOpen, onClose, examName, config = {}, exams = [] }) {
  const { user } = useAuth()
  const [currentStep, setCurrentStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)
  const [appId, setAppId] = useState(null)

  // Form states pre-filled from Clerk profile
  const [formData, setFormData] = useState({
    name: user?.name || "Student",
    phone: user?.phone ? user.phone.replace("+91", "").replace(" ", "").trim() : "",
    email: user?.email || "",
    dob: "",
    gender: "",
    category: user?.category || "General",
    qualification: "",
    board: "",
    passingYear: "",
    marks: "",
    docSubmissionMethod: "upload" // 'upload' or 'whatsapp'
  })

  // Dynamic files state
  const [files, setFiles] = useState({})

  // React to user context changes (in case Clerk session load finishes after mount)
  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        name: prev.name && prev.name !== "Student" ? prev.name : (user.name || "Student"),
        phone: prev.phone ? prev.phone : (user.phone ? user.phone.replace("+91", "").replace(" ", "").trim() : ""),
        email: prev.email ? prev.email : (user.email || ""),
        category: prev.category && prev.category !== "General" ? prev.category : (user.category || "General")
      }))
    }
  }, [user])

  const requiredDocs = getRequiredDocsForExam(examName, exams)

  const handleFileChange = (e, docLabel) => {
    const file = e.target.files[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert("File size should be less than 5MB")
        return
      }
      setFiles(prev => ({ ...prev, [docLabel]: file }))
    }
  }

  const removeFile = (docLabel) => {
    setFiles(prev => ({ ...prev, [docLabel]: null }))
  }

  const validateStep = (step) => {
    setError("")
    if (step === 1) {
      if (formData.docSubmissionMethod === "upload") {
        for (const docLabel of requiredDocs) {
          if (isDocRequired(docLabel, formData.category) && !files[docLabel]) {
            return `Please upload your ${docLabel}`
          }
        }
      }
    }
    return null
  }

  const handleNext = () => {
    const stepError = validateStep(currentStep)
    if (stepError) {
      setError(stepError)
      return
    }
    setCurrentStep(prev => prev + 1)
  }

  const handleBack = () => {
    setError("")
    setCurrentStep(prev => prev - 1)
  }

  const handleSubmit = async () => {
    setLoading(true)
    setError("")
    try {
      const data = new FormData()
      
      // Append text fields
      Object.entries(formData).forEach(([key, val]) => {
        data.append(key, val)
      })
      const selectedExam = exams.find(e => e.name === examName)
      data.append("exam_cycle_id", selectedExam?.cycle_id || "")

      // Append files only if they chose upload method
      if (formData.docSubmissionMethod === "upload") {
        Object.entries(files).forEach(([docLabel, file]) => {
          if (file) {
            data.append(docLabel, file)
          }
        })
      }

      const res = await api.submitFormApplication(data)
      if (res.success) {
        setAppId(res.application_id)
        setSuccess(true)
      } else {
        setError(res.error || "Submission failed.")
      }
    } catch (err) {
      setError(err?.message || "An unexpected error occurred. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  // Prepares the WhatsApp direct share text
  const getWhatsAppMessage = () => {
    const refId = `#EM-${appId}`
    const text = `Namaste Krishna Emitra! Maine website par *${examName}* ke liye form details fill kar di hain.\n\n*Reference ID:* ${refId}\n*Student Name:* ${formData.name}\n*Phone:* ${formData.phone}\n\nMain abhi is message ke saath required documents share kar raha hoon. Please form fill karke receipt bhej dein.`
    return `https://wa.me/${config.whatsapp_number || "916377964293"}?text=${encodeURIComponent(text)}`
  }

  const inputClass = "w-full border border-white/10 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 rounded-xl px-4 py-3 text-[13px] bg-white/5 transition-all outline-none text-white placeholder:text-slate-500"
  const labelClass = "text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5 block"

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
          {/* Overlay */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={!loading ? onClose : null}
            className="absolute inset-0 bg-black/60 backdrop-blur-md"
          />

          {/* Modal Card */}
          <motion.div 
            initial={{ opacity: 0, y: 30, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.98 }}
            transition={{ type: "spring", duration: 0.45 }}
            className="relative w-full max-w-2xl bg-[#0b0f19]/95 border border-white/15 shadow-[0_24px_50px_rgba(0,0,0,0.3)] rounded-3xl overflow-hidden flex flex-col h-[80vh] sm:h-[85vh] min-h-0 backdrop-blur-xl"
          >
            {/* Header */}
            <div className="px-6 py-5 border-b border-white/10 flex items-center justify-between bg-white/5">
              <div>
                <p className="text-[10px] font-bold tracking-widest text-blue-400 uppercase">Online Form Assistant</p>
                <h3 className="text-[16px] font-bold text-white mt-0.5">{examName} Application</h3>
              </div>
              {!loading && (
                <button 
                  onClick={onClose} 
                  className="p-1.5 hover:bg-white/5 rounded-full text-slate-400 hover:text-white transition-all cursor-pointer border-none bg-transparent"
                  aria-label="Close modal"
                >
                  <X size={18} />
                </button>
              )}
            </div>

            {/* Stepper Progress Bar */}
            {!success && (
              <div className="px-8 py-4 bg-white/5 border-b border-white/10 flex items-center gap-2 overflow-x-auto shrink-0 scrollbar-hide">
                {STEPS.map((step) => {
                  const isActive = currentStep === step.id
                  const isCompleted = currentStep > step.id
                  return (
                    <div key={step.id} className="flex items-center gap-2 shrink-0">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold border transition-all ${
                        isCompleted 
                          ? "bg-blue-600 border-blue-600 text-white" 
                          : isActive 
                            ? "bg-white/5 border-blue-500 text-blue-400 ring-4 ring-blue-500/10" 
                            : "bg-white/5 border-white/10 text-slate-500"
                      }`}>
                        {isCompleted ? "✓" : step.id}
                      </div>
                      <span className={`text-[12px] font-medium transition-all ${
                        isActive ? "text-blue-400 font-semibold" : isCompleted ? "text-white" : "text-slate-500"
                      }`}>
                        {step.title}
                      </span>
                      {step.id < 2 && <div className="w-6 h-[1px] bg-white/10 hidden sm:block mx-1" />}
                    </div>
                  )
                })}
              </div>
            )}

            {/* Content Scroll Area */}
            <div className="flex-1 min-h-0 overflow-y-auto p-6 pr-4 sm:p-8 sm:pr-6 scrollbar-thin">
              {error && (
                <div className="mb-6 p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl flex items-center gap-3 text-rose-400 text-[12.5px] font-medium">
                  <AlertCircle size={16} className="shrink-0" />
                  {error}
                </div>
              )}

              {!success ? (
                <div className="space-y-6">
                  {/* STEP 1: Upload Files or Select WhatsApp */}
                  {currentStep === 1 && (
                    <motion.div initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }} className="space-y-6 text-left">
                      
                      {/* Social Category Picker (needed to determine if category certificate is required) */}
                      <div>
                        <label className={labelClass}>Social Category *</label>
                        <div className="grid grid-cols-5 gap-2">
                          {["General", "OBC", "SC", "ST", "EWS"].map((cat) => (
                            <button
                              key={cat} type="button"
                              onClick={() => setFormData(p => ({ ...p, category: cat }))}
                              className={`py-2.5 px-1 text-[12px] font-bold rounded-xl border transition-all text-center cursor-pointer ${
                                formData.category === cat 
                                  ? "bg-blue-600 text-white border-blue-500 shadow-sm font-semibold"
                                  : "bg-white/5 text-slate-300 border-white/10 hover:bg-white/10"
                              }`}
                            >
                              {cat}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Document Submission Toggle */}
                      <div className="space-y-2">
                        <label className={labelClass}>How would you like to submit your documents?</label>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                          <button
                            type="button"
                            onClick={() => setFormData(p => ({ ...p, docSubmissionMethod: "upload" }))}
                            className={`py-4 px-5 text-[13px] font-bold rounded-2xl border text-left flex items-start gap-3 transition-all cursor-pointer ${
                              formData.docSubmissionMethod === "upload"
                                ? "bg-blue-500/10 text-blue-400 border-blue-500/30 ring-2 ring-blue-500/10"
                                : "bg-white/5 text-slate-300 border-white/10 hover:bg-white/10"
                            }`}
                          >
                            <div className="mt-0.5">🌐</div>
                            <div>
                              <p className="font-semibold text-[13.5px]">Upload Securely Here</p>
                              <p className="text-[10px] font-medium text-slate-500 mt-0.5">Submit files directly on website</p>
                            </div>
                          </button>
                          <button
                            type="button"
                            onClick={() => setFormData(p => ({ ...p, docSubmissionMethod: "whatsapp" }))}
                            className={`py-4 px-5 text-[13px] font-bold rounded-2xl border text-left flex items-start gap-3 transition-all cursor-pointer ${
                              formData.docSubmissionMethod === "whatsapp"
                                ? "bg-[#25D366]/10 text-[#25D366] border-[#25D366]/30 ring-2 ring-[#25D366]/10"
                                : "bg-white/5 text-slate-300 border-white/10 hover:bg-white/10"
                            }`}
                          >
                            <div className="mt-0.5">💬</div>
                            <div>
                              <p className="font-semibold text-[13.5px]">Send via WhatsApp</p>
                              <p className="text-[10px] font-medium text-slate-500 mt-0.5">Share directly with operator later</p>
                            </div>
                          </button>
                        </div>
                      </div>

                      {/* Display based on selection */}
                      {formData.docSubmissionMethod === "whatsapp" ? (
                        <div className="p-5 border border-dashed border-[#25D366]/30 bg-[#25D366]/5 rounded-2xl space-y-4">
                          <div className="flex gap-2.5 items-start">
                            <Info size={16} className="text-[#25D366] shrink-0 mt-0.5" />
                            <div>
                              <h4 className="text-[13.5px] font-bold text-white">No Uploads Required!</h4>
                              <p className="text-[11.5px] text-slate-300 mt-1 leading-normal font-normal">
                                Secure document handling. Aap click karke register kar dein, aur direct WhatsApp/Telegram par operator ke saath safe format mein share karein.
                              </p>
                            </div>
                          </div>

                          <div className="border-t border-white/10 pt-3">
                            <p className="text-[10px] font-bold text-[#25D366] uppercase tracking-wider mb-2">Required Documents for {examName}:</p>
                            <ul className="space-y-1.5 pl-4 list-disc text-[12px] text-slate-300 font-medium">
                              {requiredDocs.map((doc, idx) => {
                                const isRequired = isDocRequired(doc, formData.category)
                                return (
                                  <li key={idx}>
                                    {doc} {isRequired ? "*" : "(Optional)"}
                                  </li>
                                )
                              })}
                            </ul>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          <div className="p-4 bg-white/5 border border-white/10 rounded-2xl flex items-start gap-3">
                            <AlertCircle size={16} className="text-blue-400 shrink-0 mt-0.5" />
                            <p className="text-[11.5px] text-slate-400 leading-normal font-medium">
                              Please upload clear images or PDFs. Files are stored securely on our admin portal.
                            </p>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {requiredDocs.map((docLabel) => {
                              const file = files[docLabel]
                              const isRequired = isDocRequired(docLabel, formData.category)
                              return (
                                <div key={docLabel} className={`border rounded-2xl p-4 flex flex-col justify-between min-h-[140px] hover:shadow-[0_4px_16px_rgba(0,0,0,0.3)] transition-all duration-300 ${
                                  file 
                                    ? "border-emerald-500/30 bg-emerald-550/[0.02]" 
                                    : "border-white/10 bg-white/5"
                                }`}>
                                  <div>
                                    <span className="text-[11.5px] font-bold text-white block mb-2">
                                      {docLabel} {isRequired ? "*" : "(Optional)"}
                                    </span>
                                    {file ? (
                                      <div className="flex flex-col items-center justify-center py-3 px-3 border border-solid border-emerald-500/25 rounded-xl bg-emerald-500/10 relative min-h-[94px]">
                                        <FileCheck size={20} className="text-[#10B981]" />
                                        <span className="text-[11px] font-bold text-emerald-450 mt-1.5 truncate w-full text-center px-1" title={file.name}>
                                          {file.name}
                                        </span>
                                        <span className="text-[9px] font-extrabold text-emerald-500/70 mt-0.5">
                                          {file.size > 1024 * 1024 ? (file.size / (1024 * 1024)).toFixed(2) + " MB" : (file.size / 1024).toFixed(1) + " KB"}
                                        </span>
                                        <button 
                                          type="button" 
                                          onClick={() => removeFile(docLabel)} 
                                          className="mt-2 px-2.5 py-1 bg-red-500/15 hover:bg-red-500/25 border border-red-500/20 hover:border-red-500/30 text-red-400 text-[9.5px] font-black rounded-lg transition-all cursor-pointer"
                                        >
                                          Remove File
                                        </button>
                                      </div>
                                    ) : (
                                      <label className="flex flex-col items-center justify-center py-6 px-4 border border-dashed border-white/10 rounded-xl hover:bg-white/5 hover:border-blue-500 transition-all cursor-pointer group">
                                        <UploadCloud size={20} className="text-slate-550 group-hover:text-blue-400 transition-colors" />
                                        <span className="text-[11.5px] font-semibold text-slate-400 group-hover:text-blue-400 transition-colors mt-2">Select File</span>
                                        <input 
                                          type="file" accept="image/*,application/pdf" 
                                          onChange={(e) => handleFileChange(e, docLabel)} 
                                          className="hidden"
                                        />
                                      </label>
                                    )}
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                        </div>
                      )}
                    </motion.div>
                  )}

                  {/* STEP 2: Review & Submit */}
                  {currentStep === 2 && (
                    <motion.div initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }} className="space-y-6 text-left">
                      <div className="p-4 bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[12px] font-medium rounded-2xl">
                        Please review your application details. Once submitted, form filling will be processed by Krishna Emitra Desk.
                      </div>

                      {/* Details Grid */}
                      <div className="bg-white/5 border border-white/10 rounded-2xl p-5 grid grid-cols-2 gap-x-6 gap-y-4">
                        <div className="col-span-2 border-b border-white/10 pb-2 mb-1">
                          <h4 className="text-[12.5px] font-bold text-white uppercase tracking-wider">Student Profile</h4>
                        </div>
                        <div>
                          <span className="text-[10px] uppercase font-bold text-slate-550">Name</span>
                          <p className="text-[13px] font-semibold text-white mt-0.5">{formData.name}</p>
                        </div>
                        <div>
                          <span className="text-[10px] uppercase font-bold text-slate-550">Phone</span>
                          <p className="text-[13px] font-semibold text-white mt-0.5">{formData.phone}</p>
                        </div>
                        <div>
                          <span className="text-[10px] uppercase font-bold text-slate-550">Email</span>
                          <p className="text-[13px] font-semibold text-white mt-0.5">{formData.email || "-"}</p>
                        </div>
                        <div>
                          <span className="text-[10px] uppercase font-bold text-slate-550">Category</span>
                          <p className="text-[13px] font-semibold text-white mt-0.5">{formData.category}</p>
                        </div>

                        <div className="col-span-2 border-b border-white/10 pb-2 mt-2 mb-1">
                          <h4 className="text-[12.5px] font-bold text-white uppercase tracking-wider">Documents Delivery</h4>
                        </div>
                        <div className="col-span-2 text-[13px] font-semibold">
                          {formData.docSubmissionMethod === "whatsapp" ? (
                            <span className="text-amber-400 flex items-center gap-1.5 font-bold">💬 Will send required documents via WhatsApp later</span>
                          ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[#10B981]">
                              {Object.entries(files).map(([docLabel, file]) => {
                                if (!file) return null
                                return (
                                  <div key={docLabel} className="flex items-center gap-1.5 min-w-0">
                                    <FileCheck size={14} className="text-[#10B981] shrink-0" />
                                    <span className="truncate" title={docLabel}>{docLabel}</span>
                                  </div>
                                )
                              })}
                            </div>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </div>
              ) : (
                /* SUCCESS SCREEN */
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }} 
                  animate={{ opacity: 1, scale: 1 }} 
                  className="text-center py-6 space-y-6 max-w-sm mx-auto"
                >
                  <div className="w-16 h-16 bg-emerald-500/10 text-[#10B981] flex items-center justify-center rounded-full mx-auto border border-emerald-500/20">
                    <CheckCircle size={36} />
                  </div>
                  
                  <div className="space-y-2 text-center">
                    <h4 className="text-2xl font-bold text-white">Details Saved!</h4>
                    <p className="text-[13px] text-slate-355 leading-relaxed">
                      Aapki details safely register ho gayi hain. Humare operator aapka form check karenge.
                    </p>
                  </div>

                  <div className="bg-white/5 border border-white/10 p-4.5 rounded-2xl">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Reference Application ID</span>
                    <span className="text-[20px] font-black text-white tracking-tight block mt-1">#EM-{appId}</span>
                  </div>

                  <div className="pt-4 flex flex-col gap-3.5">
                    {formData.docSubmissionMethod === "whatsapp" ? (
                      <a 
                        href={getWhatsAppMessage()}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full py-3.5 bg-[#25D366] hover:bg-[#22c35e] text-white text-[13px] font-bold rounded-2xl shadow-sm transition-all active:scale-[0.98] flex items-center justify-center gap-2 decoration-none"
                      >
                        <MessageSquare size={16} /> Send Documents on WhatsApp
                      </a>
                    ) : (
                      <button 
                        onClick={onClose} 
                        className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white text-[12.5px] font-semibold rounded-xl transition-all active:scale-[0.98] cursor-pointer border-none"
                      >
                        Done &amp; Go Back
                      </button>
                    )}
                    <p className="text-[10.5px] text-slate-500 px-4 leading-normal font-normal">
                      Aap tracking tab me mobile number daal kar kisi bhi samay apne form ka status check kar sakte hain.
                    </p>
                  </div>
                </motion.div>
              )}
            </div>

            {/* Footer buttons */}
            {!success && (
              <div className="px-6 py-5 border-t border-white/10 bg-white/5 flex items-center justify-between shrink-0">
                {currentStep > 1 ? (
                  <button 
                    type="button"
                    onClick={handleBack} 
                    disabled={loading}
                    className="flex items-center gap-1.5 px-4.5 py-2.5 border border-white/10 bg-white/5 text-white text-[12.5px] font-semibold rounded-xl hover:bg-white/10 transition-all disabled:opacity-50 cursor-pointer"
                  >
                    <ArrowLeft size={14} /> Back
                  </button>
                ) : (
                  <div />
                )}

                {currentStep < 2 ? (
                  <button 
                    type="button"
                    onClick={handleNext}
                    className="flex items-center gap-1.5 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-[12.5px] font-semibold rounded-xl shadow-sm transition-all cursor-pointer border-none"
                  >
                    Next Step <ArrowRight size={14} />
                  </button>
                ) : (
                  <button 
                    type="button"
                    onClick={handleSubmit}
                    disabled={loading}
                    className="flex items-center gap-2 px-6 py-2.5 bg-white text-black hover:bg-slate-100 text-[12.5px] font-bold rounded-xl shadow-md transition-all disabled:opacity-60 cursor-pointer border-none"
                  >
                    {loading ? (
                      <>
                        <RefreshCw size={14} className="animate-spin" /> Processing...
                      </>
                    ) : (
                      <>
                        Submit Form <ArrowRight size={14} />
                      </>
                    )}
                  </button>
                )}
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
