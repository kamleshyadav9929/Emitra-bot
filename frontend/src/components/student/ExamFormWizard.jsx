import React, { useState } from "react"
import { motion, AnimatePresence } from "motion/react"
import { 
  X, User, Phone, Mail, Calendar, GraduationCap, 
  UploadCloud, FileText, CheckCircle, ArrowRight, ArrowLeft, 
  Trash2, AlertCircle, RefreshCw, FileCheck, MessageSquare, Info
} from "lucide-react"
import * as api from "../../api"

// Helper to determine required documents based on the exam name
const getRequiredDocsForExam = (examName) => {
  const name = (examName || "").toLowerCase()
  if (name.includes("jee") || name.includes("neet")) {
    return [
      "Passport Size Photograph (Recent)",
      "Candidate Signature (on white paper)",
      "10th Marksheet & Certificate",
      "12th Marksheet (or admit card if appearing)",
      "Category Certificate (OBC/SC/ST/EWS if applicable)"
    ]
  }
  if (name.includes("ssc") || name.includes("upsc")) {
    return [
      "Passport Size Photograph",
      "Candidate Signature",
      "Graduation Marksheet/Degree",
      "Matriculation (10th) Certificate for DOB proof",
      "Caste/Category Certificate (if applicable)"
    ]
  }
  return [
    "Passport Size Photograph",
    "Candidate Signature",
    "Highest Qualification Marksheet",
    "Aadhar Card / Identity Proof"
  ]
}

const STEPS = [
  { id: 1, title: "Personal Details" },
  { id: 2, title: "Academic Info" },
  { id: 3, title: "Upload Files" },
  { id: 4, title: "Review & Submit" }
]

export default function ExamFormWizard({ isOpen, onClose, examName, config = {} }) {
  const [currentStep, setCurrentStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)
  const [appId, setAppId] = useState(null)

  // Form states
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    dob: "",
    gender: "",
    category: "",
    qualification: "",
    board: "",
    passingYear: "",
    marks: "",
    docSubmissionMethod: "upload" // 'upload' or 'whatsapp'
  })

  // File states
  const [files, setFiles] = useState({
    photo: null,
    signature: null,
    marksheet: null,
    id_proof: null
  })

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleFileChange = (e, type) => {
    const file = e.target.files[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert("File size should be less than 5MB")
        return
      }
      setFiles(prev => ({ ...prev, [type]: file }))
    }
  }

  const removeFile = (type) => {
    setFiles(prev => ({ ...prev, [type]: null }))
  }

  const validateStep = (step) => {
    setError("")
    if (step === 1) {
      if (!formData.name.trim()) return "Please enter your full name"
      if (!formData.phone.trim() || !/^[6-9]\d{9}$/.test(formData.phone)) return "Please enter a valid 10-digit phone number"
      if (!formData.dob) return "Please enter your date of birth"
      if (!formData.gender) return "Please select your gender"
      if (!formData.category) return "Please select your social category"
    } else if (step === 2) {
      if (!formData.qualification) return "Please select your highest qualification"
      if (!formData.board.trim()) return "Please enter Board/University name"
      if (!formData.passingYear || formData.passingYear < 1980 || formData.passingYear > 2026) return "Please enter a valid passing year"
      if (!formData.marks.trim()) return "Please enter your marks/CGPA"
    } else if (step === 3) {
      if (formData.docSubmissionMethod === "upload") {
        if (!files.photo) return "Please upload your passport-size photo"
        if (!files.signature) return "Please upload your signature"
        if (!files.marksheet) return "Please upload your qualification marksheet"
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
      data.append("exam", examName)

      // Append files only if they chose upload method
      if (formData.docSubmissionMethod === "upload") {
        Object.entries(files).forEach(([key, file]) => {
          if (file) {
            data.append(key, file)
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
    const text = `Namaste Krishna Emitra! Maine website par *${examName}* ke liye form details fill kar di hain.\n\n*Reference ID:* ${refId}\n*Student Name:* ${formData.name}\n*Phone:* ${formData.phone}\n\nMain abhi is message ke saath required documents (Photo, Signature aur Marksheets) share kar raha hoon. Please form fill karke receipt bhej dein.`
    return `https://wa.me/${config.whatsapp_number || "916377964293"}?text=${encodeURIComponent(text)}`
  }

  const requiredDocs = getRequiredDocsForExam(examName)
  const inputClass = "w-full border border-gray-200 focus:border-[#0071e3] focus:ring-2 focus:ring-[#0071e3]/10 rounded-xl px-4 py-3 text-[13px] bg-white transition-all outline-none text-[#1d1d1f]"
  const labelClass = "text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-1.5 block"

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Overlay */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={!loading ? onClose : null}
            className="absolute inset-0 bg-[#1d1d1f]/40 backdrop-blur-md"
          />

          {/* Modal Card */}
          <motion.div 
            initial={{ opacity: 0, y: 30, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.98 }}
            transition={{ type: "spring", duration: 0.45 }}
            className="relative w-full max-w-2xl bg-white border border-[#e5e5e7] shadow-[0_24px_50px_rgba(0,0,0,0.15)] rounded-3xl overflow-hidden flex flex-col max-h-[90vh]"
          >
            {/* Header */}
            <div className="px-6 py-5 border-b border-[#e5e5e7] flex items-center justify-between bg-[#f5f5f7]/55">
              <div>
                <p className="text-[10px] font-bold tracking-widest text-[#0071e3] uppercase">Online Form Assistant</p>
                <h3 className="text-[16px] font-bold text-[#1d1d1f] mt-0.5">{examName} Application Form</h3>
              </div>
              {!loading && (
                <button 
                  onClick={onClose} 
                  className="p-1.5 hover:bg-gray-100 rounded-full text-gray-400 hover:text-[#1d1d1f] transition-all"
                  aria-label="Close modal"
                >
                  <X size={18} />
                </button>
              )}
            </div>

            {/* Stepper Progress Bar */}
            {!success && (
              <div className="px-8 py-4 bg-white border-b border-[#e5e5e7] flex items-center gap-2 overflow-x-auto shrink-0 scrollbar-hide">
                {STEPS.map((step) => {
                  const isActive = currentStep === step.id
                  const isCompleted = currentStep > step.id
                  return (
                    <div key={step.id} className="flex items-center gap-2 shrink-0">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold border transition-all ${
                        isCompleted 
                          ? "bg-[#0071e3] border-[#0071e3] text-white" 
                          : isActive 
                            ? "bg-white border-[#0071e3] text-[#0071e3] ring-4 ring-[#0071e3]/10" 
                            : "bg-[#f5f5f7] border-gray-200 text-gray-400"
                      }`}>
                        {isCompleted ? "✓" : step.id}
                      </div>
                      <span className={`text-[12px] font-medium transition-all ${
                        isActive ? "text-[#0071e3] font-semibold" : isCompleted ? "text-[#1d1d1f]" : "text-gray-400"
                      }`}>
                        {step.title}
                      </span>
                      {step.id < 4 && <div className="w-6 h-[1px] bg-gray-200 hidden sm:block mx-1" />}
                    </div>
                  )
                })}
              </div>
            )}

            {/* Content Scroll Area */}
            <div className="flex-1 overflow-y-auto p-6 sm:p-8">
              {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-3 text-red-700 text-[12.5px] font-medium">
                  <AlertCircle size={16} className="shrink-0" />
                  {error}
                </div>
              )}

              {!success ? (
                <div className="space-y-6">
                  {/* STEP 1: Personal Details */}
                  {currentStep === 1 && (
                    <motion.div initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }} className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      <div className="sm:col-span-2">
                        <label className={labelClass}>Full Name (As per Matriculation Certificate) *</label>
                        <div className="relative">
                          <User size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                          <input 
                            type="text" name="name" value={formData.name} onChange={handleChange} 
                            placeholder="Enter full name" className={`${inputClass} pl-10`}
                          />
                        </div>
                      </div>

                      <div>
                        <label className={labelClass}>Mobile Number (WhatsApp Preferred) *</label>
                        <div className="relative">
                          <Phone size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                          <input 
                            type="tel" name="phone" value={formData.phone} onChange={handleChange} 
                            placeholder="10-digit number" className={`${inputClass} pl-10`}
                          />
                        </div>
                      </div>

                      <div>
                        <label className={labelClass}>Email Address</label>
                        <div className="relative">
                          <Mail size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                          <input 
                            type="email" name="email" value={formData.email} onChange={handleChange} 
                            placeholder="name@example.com" className={`${inputClass} pl-10`}
                          />
                        </div>
                      </div>

                      <div>
                        <label className={labelClass}>Date of Birth *</label>
                        <div className="relative">
                          <Calendar size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                          <input 
                            type="date" name="dob" value={formData.dob} onChange={handleChange} 
                            className={`${inputClass} pl-10`}
                          />
                        </div>
                      </div>

                      <div>
                        <label className={labelClass}>Gender *</label>
                        <select name="gender" value={formData.gender} onChange={handleChange} className={inputClass}>
                          <option value="">Select Gender</option>
                          <option value="Male">Male</option>
                          <option value="Female">Female</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>

                      <div className="sm:col-span-2">
                        <label className={labelClass}>Social Category *</label>
                        <div className="grid grid-cols-5 gap-2">
                          {["General", "OBC", "SC", "ST", "EWS"].map((cat) => (
                            <button
                              key={cat} type="button"
                              onClick={() => setFormData(p => ({ ...p, category: cat }))}
                              className={`py-2.5 px-1 text-[12px] font-bold rounded-xl border transition-all text-center ${
                                formData.category === cat 
                                  ? "bg-[#0071e3] text-white border-[#0071e3] shadow-sm font-semibold"
                                  : "bg-[#f5f5f7] text-[#1d1d1f] border-transparent hover:bg-gray-200"
                              }`}
                            >
                              {cat}
                            </button>
                          ))}
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {/* STEP 2: Academic Info */}
                  {currentStep === 2 && (
                    <motion.div initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }} className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      <div>
                        <label className={labelClass}>Highest Qualification *</label>
                        <select name="qualification" value={formData.qualification} onChange={handleChange} className={inputClass}>
                          <option value="">Select Qualification</option>
                          <option value="10th Pass">10th Pass</option>
                          <option value="12th Pass">12th Pass</option>
                          <option value="Graduate">Graduate (Degree)</option>
                          <option value="Post Graduate">Post Graduate (PG)</option>
                        </select>
                      </div>

                      <div>
                        <label className={labelClass}>Board / University *</label>
                        <div className="relative">
                          <GraduationCap size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                          <input 
                            type="text" name="board" value={formData.board} onChange={handleChange} 
                            placeholder="e.g. CBSE, BSER, RU" className={`${inputClass} pl-10`}
                          />
                        </div>
                      </div>

                      <div>
                        <label className={labelClass}>Passing Year *</label>
                        <input 
                          type="number" name="passingYear" value={formData.passingYear} onChange={handleChange} 
                          placeholder="e.g. 2024" className={inputClass} min="1980" max="2026"
                        />
                      </div>

                      <div>
                        <label className={labelClass}>Marks obtained (Percentage/CGPA) *</label>
                        <input 
                          type="text" name="marks" value={formData.marks} onChange={handleChange} 
                          placeholder="e.g. 84.5% or 8.8 CGPA" className={inputClass}
                        />
                      </div>
                    </motion.div>
                  )}

                  {/* STEP 3: Upload Files or Select WhatsApp */}
                  {currentStep === 3 && (
                    <motion.div initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
                      {/* Document Submission Toggle */}
                      <div className="space-y-2">
                        <label className={labelClass}>How would you like to submit your documents?</label>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                          <button
                            type="button"
                            onClick={() => setFormData(p => ({ ...p, docSubmissionMethod: "upload" }))}
                            className={`py-4 px-5 text-[13px] font-bold rounded-2xl border text-left flex items-start gap-3 transition-all ${
                              formData.docSubmissionMethod === "upload"
                                ? "bg-[#0071e3]/5 text-[#0071e3] border-[#0071e3] ring-2 ring-[#0071e3]/10"
                                : "bg-white text-[#1d1d1f] border-[#e5e5e7] hover:bg-[#f5f5f7]"
                            }`}
                          >
                            <div className="mt-0.5">🌐</div>
                            <div>
                              <p className="font-semibold text-[13.5px]">Upload Securely Here</p>
                              <p className="text-[10px] font-medium text-gray-500 mt-0.5">Submit files directly on website</p>
                            </div>
                          </button>
                          <button
                            type="button"
                            onClick={() => setFormData(p => ({ ...p, docSubmissionMethod: "whatsapp" }))}
                            className={`py-4 px-5 text-[13px] font-bold rounded-2xl border text-left flex items-start gap-3 transition-all ${
                              formData.docSubmissionMethod === "whatsapp"
                                ? "bg-[#25D366]/5 text-[#25D366] border-[#25D366] ring-2 ring-[#25D366]/10"
                                : "bg-white text-[#1d1d1f] border-[#e5e5e7] hover:bg-[#f5f5f7]"
                            }`}
                          >
                            <div className="mt-0.5">💬</div>
                            <div>
                              <p className="font-semibold text-[13.5px]">Send via WhatsApp</p>
                              <p className="text-[10px] font-medium text-gray-500 mt-0.5">Share directly with operator later</p>
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
                              <h4 className="text-[13.5px] font-bold text-[#1d1d1f]">No Uploads Required!</h4>
                              <p className="text-[11.5px] text-gray-500 mt-1 leading-normal">
                                Secure document handling. Aap click karke details bhar dein, aur direct WhatsApp/Telegram par operator ke saath safe format mein share karein.
                              </p>
                            </div>
                          </div>

                          <div className="border-t border-gray-100 pt-3">
                            <p className="text-[10px] font-bold text-[#25D366] uppercase tracking-wider mb-2">Required Documents for {examName}:</p>
                            <ul className="space-y-1.5 pl-4 list-disc text-[12px] text-gray-600 font-medium">
                              {requiredDocs.map((doc, idx) => (
                                <li key={idx}>{doc}</li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          <div className="p-4 bg-[#f5f5f7]/55 border border-[#e5e5e7] rounded-2xl flex items-start gap-3">
                            <AlertCircle size={16} className="text-[#0071e3] shrink-0 mt-0.5" />
                            <p className="text-[11.5px] text-[#86868b] leading-normal font-medium">
                              Please upload clear images or PDFs. Files are stored securely on our admin portal.
                            </p>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {[
                              { key: "photo", label: "Passport Photo *" },
                              { key: "signature", label: "Signature *" },
                              { key: "marksheet", label: "Qualification Certificate / Marksheet *" },
                              { key: "id_proof", label: "Aadhar Card (Optional)" }
                            ].map((item) => {
                              const file = files[item.key]
                              return (
                                <div key={item.key} className="border border-[#e5e5e7] rounded-2xl p-4 flex flex-col justify-between bg-white min-h-[140px] hover:shadow-[0_4px_16px_rgba(0,0,0,0.01)] transition-all">
                                  <div>
                                    <span className="text-[11.5px] font-bold text-[#1d1d1f] block mb-2">{item.label}</span>
                                    {file ? (
                                      <div className="flex items-center justify-between p-2.5 bg-[#f0fdf4] border border-emerald-100 rounded-xl">
                                        <div className="flex items-center gap-2 min-w-0">
                                          <FileCheck size={16} className="text-[#10B981] shrink-0" />
                                          <span className="text-[12px] font-semibold text-emerald-800 truncate pr-2">{file.name}</span>
                                        </div>
                                        <button 
                                          type="button" onClick={() => removeFile(item.key)} 
                                          className="p-1 hover:bg-[#dcfce7] rounded-full text-emerald-600 hover:text-red-500 transition-colors"
                                        >
                                          <Trash2 size={13} />
                                        </button>
                                      </div>
                                    ) : (
                                      <label className="flex flex-col items-center justify-center py-6 px-4 border border-dashed border-gray-200 rounded-xl hover:bg-[#f5f5f7] hover:border-[#0071e3] transition-all cursor-pointer group">
                                        <UploadCloud size={20} className="text-gray-400 group-hover:text-[#0071e3] transition-colors" />
                                        <span className="text-[11.5px] font-semibold text-gray-500 group-hover:text-[#0071e3] transition-colors mt-2">Select File</span>
                                        <input 
                                          type="file" accept="image/*,application/pdf" 
                                          onChange={(e) => handleFileChange(e, item.key)} 
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

                  {/* STEP 4: Review & Submit */}
                  {currentStep === 4 && (
                    <motion.div initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
                      <div className="p-4 bg-amber-50 border border-amber-100 text-amber-800 text-[12px] font-medium rounded-2xl">
                        Please review your application details. Once submitted, form filling will be processed by Krishna Emitra Desk.
                      </div>

                      {/* Details Grid */}
                      <div className="bg-[#f5f5f7]/40 border border-[#e5e5e7] rounded-2xl p-5 grid grid-cols-2 gap-x-6 gap-y-4">
                        <div className="col-span-2 border-b border-gray-200 pb-2 mb-1">
                          <h4 className="text-[12.5px] font-bold text-[#1d1d1f] uppercase tracking-wider">Student Profile</h4>
                        </div>
                        <div>
                          <span className="text-[10px] uppercase font-bold text-gray-400">Name</span>
                          <p className="text-[13px] font-semibold text-[#1d1d1f] mt-0.5">{formData.name}</p>
                        </div>
                        <div>
                          <span className="text-[10px] uppercase font-bold text-gray-400">Phone</span>
                          <p className="text-[13px] font-semibold text-[#1d1d1f] mt-0.5">{formData.phone}</p>
                        </div>
                        <div>
                          <span className="text-[10px] uppercase font-bold text-gray-400">Email</span>
                          <p className="text-[13px] font-semibold text-[#1d1d1f] mt-0.5">{formData.email || "-"}</p>
                        </div>
                        <div>
                          <span className="text-[10px] uppercase font-bold text-gray-400">Date of Birth</span>
                          <p className="text-[13px] font-semibold text-[#1d1d1f] mt-0.5">{formData.dob}</p>
                        </div>
                        <div>
                          <span className="text-[10px] uppercase font-bold text-gray-400">Gender</span>
                          <p className="text-[13px] font-semibold text-[#1d1d1f] mt-0.5">{formData.gender}</p>
                        </div>
                        <div>
                          <span className="text-[10px] uppercase font-bold text-gray-400">Category</span>
                          <p className="text-[13px] font-semibold text-[#1d1d1f] mt-0.5">{formData.category}</p>
                        </div>

                        <div className="col-span-2 border-b border-gray-200 pb-2 mt-2 mb-1">
                          <h4 className="text-[12.5px] font-bold text-[#1d1d1f] uppercase tracking-wider">Academic Record</h4>
                        </div>
                        <div>
                          <span className="text-[10px] uppercase font-bold text-gray-400">Highest Qualification</span>
                          <p className="text-[13px] font-semibold text-[#1d1d1f] mt-0.5">{formData.qualification}</p>
                        </div>
                        <div>
                          <span className="text-[10px] uppercase font-bold text-gray-400">Board/University</span>
                          <p className="text-[13px] font-semibold text-[#1d1d1f] mt-0.5">{formData.board}</p>
                        </div>
                        <div>
                          <span className="text-[10px] uppercase font-bold text-gray-400">Passing Year</span>
                          <p className="text-[13px] font-semibold text-[#1d1d1f] mt-0.5">{formData.passingYear}</p>
                        </div>
                        <div>
                          <span className="text-[10px] uppercase font-bold text-gray-400">Marks / CGPA</span>
                          <p className="text-[13px] font-semibold text-[#1d1d1f] mt-0.5">{formData.marks}</p>
                        </div>

                        <div className="col-span-2 border-b border-gray-200 pb-2 mt-2 mb-1">
                          <h4 className="text-[12.5px] font-bold text-[#1d1d1f] uppercase tracking-wider">Documents Delivery</h4>
                        </div>
                        <div className="col-span-2 text-[13px] font-semibold">
                          {formData.docSubmissionMethod === "whatsapp" ? (
                            <span className="text-amber-600 flex items-center gap-1.5">💬 Will send required documents via WhatsApp later</span>
                          ) : (
                            <div className="grid grid-cols-2 gap-2 text-emerald-800">
                              <div className="flex items-center gap-1.5"><FileCheck size={14} className="text-[#10B981]" /> Photo</div>
                              <div className="flex items-center gap-1.5"><FileCheck size={14} className="text-[#10B981]" /> Signature</div>
                              <div className="flex items-center gap-1.5"><FileCheck size={14} className="text-[#10B981]" /> Marksheet</div>
                              {files.id_proof && <div className="flex items-center gap-1.5"><FileCheck size={14} className="text-[#10B981]" /> ID Proof</div>}
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
                  <div className="w-16 h-16 bg-emerald-50 text-[#10B981] flex items-center justify-center rounded-full mx-auto border border-emerald-100">
                    <CheckCircle size={36} />
                  </div>
                  
                  <div className="space-y-2">
                    <h4 className="text-2xl font-bold text-[#1d1d1f]">Details Saved!</h4>
                    <p className="text-[13px] text-[#86868b] leading-relaxed">
                      Aapki details safely register ho gayi hain. Humare operator aapka form check karenge.
                    </p>
                  </div>

                  <div className="bg-[#f5f5f7] border border-[#e5e5e7] p-4.5 rounded-2xl">
                    <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block">Reference Application ID</span>
                    <span className="text-[20px] font-black text-[#1d1d1f] tracking-tight block mt-1">#EM-{appId}</span>
                  </div>

                  <div className="pt-4 flex flex-col gap-3.5">
                    {formData.docSubmissionMethod === "whatsapp" ? (
                      <a 
                        href={getWhatsAppMessage()}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full py-3.5 bg-[#25D366] hover:bg-[#22c35e] text-white text-[13px] font-bold rounded-2xl shadow-sm transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                      >
                        <MessageSquare size={16} /> Send Documents on WhatsApp
                      </a>
                    ) : (
                      <button 
                        onClick={onClose} 
                        className="w-full py-3 bg-[#0071e3] hover:bg-[#0077ed] text-white text-[12.5px] font-semibold rounded-xl transition-all active:scale-[0.98]"
                      >
                        Done &amp; Go Back
                      </button>
                    )}
                    <p className="text-[10.5px] text-[#86868b] px-4 leading-normal">
                      Aap tracking tab me mobile number daal kar kisi bhi samay apne form ka status check kar sakte hain.
                    </p>
                  </div>
                </motion.div>
              )}
            </div>

            {/* Footer buttons */}
            {!success && (
              <div className="px-6 py-5 border-t border-[#e5e5e7] bg-[#f5f5f7]/55 flex items-center justify-between shrink-0">
                {currentStep > 1 ? (
                  <button 
                    type="button"
                    onClick={handleBack} 
                    disabled={loading}
                    className="flex items-center gap-1.5 px-4.5 py-2.5 border border-[#d2d2d7] bg-white text-[#1d1d1f] text-[12.5px] font-semibold rounded-xl hover:bg-gray-50 transition-all disabled:opacity-50"
                  >
                    <ArrowLeft size={14} /> Back
                  </button>
                ) : (
                  <div />
                )}

                {currentStep < 4 ? (
                  <button 
                    type="button"
                    onClick={handleNext}
                    className="flex items-center gap-1.5 px-5 py-2.5 bg-[#0071e3] hover:bg-[#0077ed] text-white text-[12.5px] font-semibold rounded-xl shadow-sm transition-all"
                  >
                    Next Step <ArrowRight size={14} />
                  </button>
                ) : (
                  <button 
                    type="button"
                    onClick={handleSubmit}
                    disabled={loading}
                    className="flex items-center gap-2 px-6 py-2.5 bg-[#1d1d1f] hover:bg-[#2d2d2f] text-white text-[12.5px] font-bold rounded-xl shadow-md transition-all disabled:opacity-60"
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
