import { SignIn } from "@clerk/react"
import { ShieldCheck } from "lucide-react"

export default function Login() {
  return (
    <div className="min-h-screen bg-[var(--color-surface-base)] flex font-inter">
      {/* Left panel — Bureau editorial masthead */}
      <div className="hidden md:flex w-1/2 flex-col justify-between p-14 bg-[#071E27] text-white relative overflow-hidden">
        {/* Subtle gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#164FA8]/20 to-transparent pointer-events-none" />

        <div className="flex items-center gap-3 relative z-10">
          <div className="w-8 h-8 border border-white/20 bg-white/5 flex items-center justify-center rounded-lg backdrop-blur-sm">
            <ShieldCheck size={15} className="text-white" />
          </div>
          <span className="text-[13px] font-bold tracking-widest uppercase text-white/70">e-Mitra Bureau</span>
        </div>

        <div className="relative z-10">
          <p className="text-[10px] text-white/30 font-bold tracking-[0.25em] uppercase mb-6">Admin System</p>
          <h1 className="text-5xl font-black leading-[1.05] tracking-tight font-display text-white">
            Manage.<br />Monitor.<br />Govern.
          </h1>
          <div className="mt-10 pt-8 border-t border-white/10">
            <p className="text-[13px] text-white/30 leading-relaxed max-w-xs">
              Secure administrative workspace for the e-Mitra student notification platform.
            </p>
          </div>
        </div>

        <div className="text-[10px] text-white/15 font-mono relative z-10">
          © {new Date().getFullYear()} e-Mitra Digital Bureau
        </div>
      </div>

      {/* Right panel — Clerk Sign In */}
      <div className="flex-1 flex items-center justify-center p-8 bg-[var(--color-surface-base)]">
        <div className="w-full max-w-sm flex flex-col items-center">
          {/* Mobile logo */}
          <div className="flex md:hidden items-center gap-3 mb-10 self-start">
            <div className="w-8 h-8 bg-[#071E27] flex items-center justify-center rounded-lg">
              <ShieldCheck size={14} className="text-white" />
            </div>
            <span className="text-[14px] font-black text-[#071E27] font-display tracking-tight">e-Mitra Admin</span>
          </div>

          <div className="w-full">
            <p className="text-[10px] text-[var(--color-primary)] font-bold tracking-[0.2em] uppercase mb-3">Bureau Access</p>
            <h2 className="text-3xl font-black text-[#0A1A40] leading-tight mb-8 font-display">Sign In</h2>

            <SignIn
              forceRedirectUrl="/admin"
              appearance={{
                elements: {
                  rootBox: "w-full",
                  card: "shadow-none bg-transparent border-none p-0 w-full gap-4",
                  cardBox: "shadow-none w-full",
                  headerTitle: "hidden",
                  headerSubtitle: "hidden",
                  header: "hidden",
                  socialButtonsBlockButton:
                    "border border-gray-200 rounded-[14px] font-bold text-[13px] text-gray-700 hover:bg-gray-50 transition-all h-12",
                  socialButtonsBlockButtonText: "font-bold text-[13px]",
                  dividerLine: "bg-gray-200",
                  dividerText: "text-gray-400 text-[11px] font-bold tracking-widest uppercase",
                  formFieldLabel: "text-[11px] font-bold text-gray-500 tracking-widest uppercase mb-1.5",
                  formFieldInput:
                    "w-full bg-white border-none px-5 py-4 text-[14px] text-[#0A1A40] placeholder:text-gray-400 outline-none rounded-[14px] shadow-[0_2px_12px_rgba(0,0,0,0.06)] focus:ring-2 focus:ring-[var(--color-primary)]/20 transition-all",
                  formButtonPrimary:
                    "w-full bg-gradient-to-br from-[var(--color-primary)] to-[#1a5ec8] text-white font-bold text-[14px] py-4 rounded-[14px] hover:shadow-lg hover:-translate-y-0.5 transition-all normal-case",
                  footerActionLink: "text-[var(--color-primary)] font-bold hover:underline",
                  identityPreviewText: "text-[13px] text-gray-700",
                  identityPreviewEditButton: "text-[var(--color-primary)]",
                  formFieldErrorText: "text-red-500 text-[12px] font-bold",
                  alert: "rounded-[12px] text-[13px]",
                  alertText: "text-[13px]",
                },
                layout: {
                  socialButtonsPlacement: "top",
                },
              }}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
