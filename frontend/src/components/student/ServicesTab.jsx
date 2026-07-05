import { Fragment } from "react"
import { Search, AlertCircle, CheckCircle2, Check, Info, MessageSquare } from "lucide-react"

export default function ServicesTab({
    lang,
    isLoggedIn,
    services,
    flatServicesList,
    serviceSearch,
    setServiceSearch,
    serviceCatFilter,
    setServiceCatFilter,
    servicesSubTab,
    setServicesSubTab,
    history,
    expandedAppId,
    setExpandedAppId,
    getStatusDetails,
    triggerSignIn,
    setActiveServiceForForm,
    setFormSuccessId,
    setFormDataDesc,
    config
}) {
    return (
        <div className="space-y-8 animate-fadeIn text-left">
            <div className="border-b border-apple-divider-soft pb-4">
                <h2 className="text-xl font-black text-slate-900 font-display">
                    {lang === 'EN' ? 'Official e-Mitra Filing Services' : 'आधिकारिक ई-मित्र सेवाएँ'}
                </h2>
                <p className="text-[12px] text-slate-400 mt-0.5">
                    {lang === 'EN' ? 'Browse official government documents and request quick filing desk help.' : 'आधिकारिक सरकारी दस्तावेजों को ब्राउज़ करें और त्वरित सहायता के लिए अनुरोध दर्ज करें।'}
                </p>
            </div>

            {isLoggedIn && (
                <div className="flex bg-apple-canvas-parchment p-1 rounded-full border border-apple-divider-soft w-fit mb-6 shadow-inner">
                    <button
                        onClick={() => setServicesSubTab("catalog")}
                        className={`py-2 px-5 text-[13px] font-semibold rounded-full transition-all apple-active-scale cursor-pointer border-none ${
                            servicesSubTab === "catalog"
                                ? "bg-apple-canvas text-apple-primary shadow-sm"
                                : "text-apple-ink/50 hover:text-apple-ink"
                        }`}
                    >
                        {lang === 'EN' ? 'Services Catalog' : 'सेवाएं सूची'}
                    </button>
                    <button
                        onClick={() => setServicesSubTab("requests")}
                        className={`py-2 px-5 text-[13px] font-semibold rounded-full transition-all apple-active-scale cursor-pointer border-none ${
                            servicesSubTab === "requests"
                                ? "bg-apple-canvas text-apple-primary shadow-sm"
                                : "text-apple-ink/50 hover:text-apple-ink"
                        }`}
                    >
                        {lang === 'EN' ? 'My Filings' : 'मेरे आवेदन'}
                    </button>
                </div>
            )}

            {(!isLoggedIn || servicesSubTab === "catalog") ? (
                <div className="space-y-6">
                    {/* Catalog Filters */}
                    <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                        <div className="relative w-full sm:w-72">
                            <Search size={16} className="absolute left-4.5 top-1/2 -translate-y-1/2 text-apple-ink/40" />
                            <input 
                                type="text"
                                value={serviceSearch}
                                onChange={e => setServiceSearch(e.target.value)}
                                placeholder={lang === 'EN' ? 'Search services...' : 'सेवाएं खोजें...'}
                                className="w-full bg-apple-canvas border border-apple-hairline text-[14px] text-apple-ink placeholder:text-apple-ink/40 pl-11 pr-8 py-2.5 rounded-full focus:outline-none focus:border-apple-primary-focus focus:ring-2 focus:ring-apple-primary-focus/10 transition-all shadow-sm font-semibold"
                            />
                        </div>

                        <select
                            value={serviceCatFilter}
                            onChange={e => setServiceCatFilter(e.target.value)}
                            className="px-4 py-2.5 bg-apple-canvas border border-apple-hairline text-[14px] text-apple-ink/75 rounded-full focus:outline-none focus:border-apple-primary-focus focus:ring-2 focus:ring-apple-primary-focus/10 transition-all shadow-sm cursor-pointer font-semibold"
                        >
                            <option value="ALL">{lang === 'EN' ? 'All Categories' : 'सभी श्रेणियां'}</option>
                            {Object.entries(services).map(([k, cat]) => (
                                <option key={k} value={k}>{cat.label}</option>
                            ))}
                        </select>
                    </div>

                    {/* Grid */}
                    {flatServicesList.length === 0 ? (
                        <div className="bg-apple-canvas border border-apple-hairline rounded-[18px] p-16 text-center text-slate-400 border-solid">
                            No service records matching selections.
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {flatServicesList.map((svc, idx) => (
                                <div key={idx} className="bg-apple-canvas border border-apple-hairline rounded-[18px] p-6 shadow-sm hover:shadow-md hover:border-apple-ink/30 transition-all duration-300 flex flex-col justify-between group border-solid">
                                    <div className="space-y-3 text-left">
                                        <div className="flex items-center justify-between text-[9px] font-extrabold uppercase text-slate-400 tracking-wider">
                                            <span>{svc.categoryLabel}</span>
                                            <span className="text-apple-primary bg-apple-surface-pearl px-2.5 py-0.8 rounded-lg border border-apple-divider-soft font-extrabold">Fee: {svc.price || "₹50"}</span>
                                        </div>
                                        <h4 className="text-[14.5px] font-extrabold text-slate-900 group-hover:text-apple-primary transition-colors leading-snug">{svc.name}</h4>
                                        <p className="text-[12px] text-slate-500 font-normal leading-relaxed">{svc.description || "Secure filing registration services with error validation."}</p>
                                    </div>

                                    <button
                                        onClick={() => {
                                            if (!isLoggedIn) triggerSignIn()
                                            else {
                                                setActiveServiceForForm(svc)
                                                setFormSuccessId("")
                                                setFormDataDesc("")
                                            }
                                        }}
                                        className="mt-6 w-full py-2.5 bg-apple-primary hover:bg-apple-primary-focus text-white text-[13px] font-semibold rounded-full transition-all apple-active-scale shadow-sm border-none cursor-pointer"
                                    >
                                        {lang === 'EN' ? 'Request This Service' : 'इस सेवा का अनुरोध करें'}
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            ) : (
                /* History table */
                <div className="space-y-6">
                    {history.length === 0 ? (
                        <div className="bg-apple-canvas border border-apple-hairline rounded-[18px] p-16 text-center text-slate-400 border-solid">
                            No submitted requests found.
                        </div>
                    ) : (
                        <div className="bg-apple-canvas border border-apple-hairline rounded-[18px] overflow-hidden shadow-sm border-solid">
                            <div className="overflow-x-auto">
                                <table className="w-full text-[12.5px] border-collapse text-left">
                                    <thead>
                                        <tr className="bg-apple-canvas-parchment border-b border-apple-divider-soft text-apple-ink/50 font-bold tracking-wider text-[11px] uppercase">
                                            <th className="py-4 px-5">ID</th>
                                            <th className="py-4 px-4">Service Details</th>
                                            <th className="py-4 px-4">Filing Date</th>
                                            <th className="py-4 px-4">Status</th>
                                            <th className="py-4 px-4 text-right pr-6">Remarks / Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-apple-divider-soft">
                                        {history.map((app) => {
                                            const isExpanded = expandedAppId === app.id
                                            const statDetails = getStatusDetails(app.status, !!app.remarks)
                                            return (
                                                <Fragment key={app.id}>
                                                    <tr 
                                                        onClick={() => setExpandedAppId(isExpanded ? null : app.id)}
                                                        className={`border-b border-apple-divider-soft hover:bg-apple-canvas-parchment/30 transition-colors cursor-pointer ${isExpanded ? "bg-apple-canvas-parchment/20" : ""}`}
                                                    >
                                                        <td className="py-5 px-5 font-bold text-apple-ink font-mono text-[12px]">{app.id}</td>
                                                        <td className="py-5 px-4 text-left">
                                                            <span className="font-extrabold text-slate-900 block text-[13.5px]">{app.service_name}</span>
                                                            <span className="inline-block text-[8px] font-extrabold text-apple-primary bg-apple-surface-pearl border border-apple-divider-soft px-2 py-0.5 rounded uppercase mt-1 tracking-wider">{app.category}</span>
                                                        </td>
                                                        <td className="py-5 px-4 font-semibold text-slate-400">{new Date(app.requested_at).toLocaleDateString("en-IN")}</td>
                                                        <td className="py-5 px-4">
                                                            <span className={`text-[8.5px] font-extrabold uppercase tracking-widest px-2.5 py-1 rounded-md border ${statDetails.colorClass}`}>
                                                                {lang === 'EN' ? statDetails.label : statDetails.labelHi}
                                                            </span>
                                                        </td>
                                                        <td className="py-5 px-4 text-right text-slate-500 font-semibold truncate max-w-xs pr-6">
                                                            {app.remarks ? (
                                                                <span className="inline-flex items-center gap-1 text-amber-600 text-[11px] font-bold bg-amber-50 px-2.5 py-1 rounded-md border border-amber-200/50">
                                                                    <AlertCircle size={12} className="animate-pulse" /> Action Required
                                                                </span>
                                                            ) : (
                                                                <span className="text-slate-400 text-[11px] font-semibold">{lang === 'EN' ? 'Click to expand' : 'विस्तार करें'}</span>
                                                            )}
                                                        </td>
                                                    </tr>

                                                    {isExpanded && (
                                                        <tr className="bg-apple-surface-pearl">
                                                            <td colSpan={5} className="p-6 space-y-4">
                                                                <div className="bg-apple-canvas border border-apple-hairline rounded-[18px] p-5 shadow-sm max-w-xl text-left border-solid">
                                                                    <p className="text-[9.5px] font-extrabold uppercase tracking-widest text-slate-400 mb-4">Filing Process Timeline</p>
                                                                    <div className="relative flex justify-between items-center w-full py-1 px-4">
                                                                        <div className="absolute left-0 right-0 h-0.5 bg-slate-100 top-1/2 -translate-y-1/2 z-0" />
                                                                        <div className="absolute left-0 h-0.5 bg-apple-primary top-1/2 -translate-y-1/2 z-0 transition-all duration-500" style={{ width: `${(statDetails.stepIndex / 3) * 100}%` }} />
                                                                        {["Submitted", "Review", "Processing", "Done"].map((step, sIdx) => {
                                                                            const isActive = statDetails.stepIndex >= sIdx
                                                                            return (
                                                                                <div key={sIdx} className="relative z-10 flex flex-col items-center">
                                                                                    <div className={`w-4 h-4 rounded-full flex items-center justify-center border-2 ${isActive ? "bg-apple-primary border-apple-primary text-white" : "bg-white border-slate-200 text-slate-300"}`}>
                                                                                        {isActive && <Check size={8} strokeWidth={3} />}
                                                                                    </div>
                                                                                    <span className={`text-[9.5px] font-bold mt-1.5 ${isActive ? "text-apple-primary font-extrabold" : "text-slate-400"}`}>{step}</span>
                                                                                </div>
                                                                            )
                                                                        })}
                                                                    </div>
                                                                </div>

                                                                {app.remarks && (
                                                                    <div className="p-4 bg-amber-50/80 rounded-2xl border border-amber-250 flex items-start gap-2.5 max-w-xl shadow-sm text-left">
                                                                        <Info size={15} className="text-amber-600 shrink-0 mt-0.5" />
                                                                        <div className="space-y-1.5">
                                                                            <p className="text-[9.5px] font-extrabold text-amber-805 uppercase tracking-widest">Operator Action Remark</p>
                                                                            <p className="text-[12.5px] text-amber-900 leading-normal font-semibold mt-0.5">{app.remarks}</p>
                                                                            <div className="pt-2">
                                                                                <a 
                                                                                    href={`https://wa.me/${config.whatsapp_number || "916377964293"}?text=Hello%2C%20regarding%20my%20request%20${app.id}%20which%2520requires%20attention.`} 
                                                                                    target="_blank" rel="noopener noreferrer"
                                                                                    className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-[11px] font-bold rounded-xl inline-flex items-center gap-1.5 shadow-sm transition-all active:scale-95 text-center decoration-none border-none cursor-pointer"
                                                                                >
                                                                                    Chat Support on WhatsApp <MessageSquare size={12} />
                                                                                </a>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                )}
                                                            </td>
                                                        </tr>
                                                    )}
                                                </Fragment>
                                            )
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}
