import React from 'react'

// ─── Base Skeleton ───────────────────────────────────────────────────────────
// Light (admin/landing) or Dark (student panel) pulse block
export function Skeleton({ className = "", dark = false }) {
  return (
    <div className={`animate-pulse rounded ${dark ? "bg-white/[0.07]" : "bg-slate-200/70"} ${className}`} />
  )
}

// ─── STUDENT PANEL SKELETONS (Dark Theme) ────────────────────────────────────

// Dashboard Tab Skeleton — matches DashboardTab layout
export function DashboardSkeleton() {
  return (
    <div className="space-y-6 md:space-y-8 animate-fadeIn pb-20">
      {/* Header Greeting */}
      <div className="pt-2 space-y-2">
        <Skeleton dark className="h-9 w-56 rounded-lg" />
        <Skeleton dark className="h-4 w-72 rounded-md" />
      </div>

      {/* Fast Navigation Grid — 4 big action cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-zinc-900/70 backdrop-blur-md p-5 rounded-2xl border border-white/10 flex flex-col items-center justify-center gap-3.5">
            <Skeleton dark className="w-12 h-12 rounded-2xl" />
            <Skeleton dark className="h-3 w-20 rounded" />
          </div>
        ))}
      </div>

      {/* Upcoming Deadlines */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center justify-between">
          <Skeleton dark className="h-3 w-36 rounded" />
          <Skeleton dark className="h-3 w-16 rounded" />
        </div>
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="bg-zinc-900/70 border border-white/10 p-4 rounded-xl flex items-center gap-4">
            <Skeleton dark className="w-10 h-10 rounded-xl shrink-0" />
            <div className="flex-1 space-y-2">
              <Skeleton dark className="h-4 w-3/4 rounded" />
              <Skeleton dark className="h-3 w-1/2 rounded" />
            </div>
            <Skeleton dark className="h-6 w-16 rounded-lg shrink-0" />
          </div>
        ))}
      </div>

      {/* Recent Activity */}
      <div className="space-y-3 pt-2">
        <Skeleton dark className="h-3 w-32 rounded" />
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="bg-zinc-900/70 border border-white/10 p-4 rounded-xl flex items-center gap-4">
            <Skeleton dark className="w-9 h-9 rounded-full shrink-0" />
            <div className="flex-1 space-y-2">
              <Skeleton dark className="h-4 w-2/3 rounded" />
              <Skeleton dark className="h-3 w-1/3 rounded" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// Services Tab Skeleton — search, category chips, service cards
export function ServicesSkeleton() {
  return (
    <div className="animate-fadeIn pb-24 space-y-4">
      {/* Search Bar */}
      <div className="pt-2 pb-1">
        <Skeleton dark className="h-11 w-full rounded-xl" />
      </div>

      {/* Category Chips */}
      <div className="flex flex-wrap gap-2 pb-1">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} dark className="h-7 rounded-full" style={{ width: `${60 + Math.random() * 40}px` }} />
        ))}
      </div>

      {/* Price Filter */}
      <div className="flex flex-wrap gap-2 items-center pb-2">
        <Skeleton dark className="h-3 w-20 rounded" />
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} dark className="h-6 w-20 rounded-lg" />
        ))}
      </div>

      {/* Service List Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="bg-zinc-900/70 border border-white/10 p-4 rounded-xl flex items-center justify-between">
            <div className="flex-1 pr-4 space-y-2.5">
              <Skeleton dark className="h-4 w-3/4 rounded" />
              <div className="flex items-center gap-2">
                <Skeleton dark className="h-3 w-16 rounded" />
                <Skeleton dark className="h-4 w-12 rounded" />
              </div>
            </div>
            <Skeleton dark className="h-8 w-16 rounded-lg shrink-0" />
          </div>
        ))}
      </div>
    </div>
  )
}

// Exams Tab Skeleton — search, filters, exam cards with timelines
export function ExamsSkeleton() {
  return (
    <div className="animate-fadeIn pb-24 space-y-4">
      {/* Search Bar */}
      <div className="pt-2 pb-1">
        <Skeleton dark className="h-11 w-full rounded-xl" />
      </div>

      {/* Category Filter Chips */}
      <div className="flex flex-wrap gap-2 pb-1">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} dark className="h-7 rounded-full" style={{ width: `${55 + Math.random() * 45}px` }} />
        ))}
      </div>

      {/* Exam Cards */}
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="bg-zinc-900/70 border border-white/10 rounded-xl p-4 space-y-3">
          <div className="flex items-start justify-between">
            <div className="flex-1 space-y-2">
              <Skeleton dark className="h-5 w-4/5 rounded" />
              <div className="flex items-center gap-2">
                <Skeleton dark className="h-3 w-20 rounded" />
                <Skeleton dark className="h-4 w-16 rounded-full" />
              </div>
            </div>
            <Skeleton dark className="w-8 h-8 rounded-full shrink-0" />
          </div>
          {/* Timeline bar */}
          <div className="flex items-center gap-2 pt-1">
            <Skeleton dark className="h-2 flex-1 rounded-full" />
          </div>
          <div className="flex items-center justify-between">
            <Skeleton dark className="h-3 w-28 rounded" />
            <Skeleton dark className="h-7 w-24 rounded-lg" />
          </div>
        </div>
      ))}
    </div>
  )
}

// Status Tab Skeleton — stats, application cards
export function StatusSkeleton() {
  return (
    <div className="animate-fadeIn pb-24 space-y-6">
      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="bg-zinc-900/70 border border-white/10 rounded-xl p-4 flex flex-col items-center gap-2">
            <Skeleton dark className="h-8 w-12 rounded" />
            <Skeleton dark className="h-3 w-16 rounded" />
          </div>
        ))}
      </div>

      {/* Section Header */}
      <div className="flex items-center justify-between">
        <Skeleton dark className="h-5 w-40 rounded" />
        <Skeleton dark className="h-3 w-16 rounded" />
      </div>

      {/* Application Cards */}
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="bg-zinc-900/70 border border-white/10 rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <Skeleton dark className="h-4 w-1/2 rounded" />
            <Skeleton dark className="h-5 w-20 rounded-full" />
          </div>
          <div className="flex items-center gap-3">
            <Skeleton dark className="h-3 w-24 rounded" />
            <Skeleton dark className="h-3 w-20 rounded" />
          </div>
          <Skeleton dark className="h-2 w-full rounded-full" />
        </div>
      ))}
    </div>
  )
}

// Notifications Tab Skeleton — header, filter chips, notification list
export function NotificationsSkeleton() {
  return (
    <div className="animate-fadeIn pb-20 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="space-y-1.5">
          <Skeleton dark className="h-5 w-32 rounded" />
          <Skeleton dark className="h-3 w-40 rounded" />
        </div>
        <Skeleton dark className="h-6 w-24 rounded-lg" />
      </div>

      {/* Filter Chips */}
      <div className="flex flex-wrap gap-2 pb-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} dark className="h-7 w-20 rounded-full" />
        ))}
      </div>

      {/* Notification Cards */}
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="bg-zinc-900/70 border border-white/10 rounded-xl p-4 space-y-3">
          <div className="flex items-start gap-3">
            <Skeleton dark className="w-8 h-8 rounded-full shrink-0" />
            <div className="flex-1 space-y-2">
              <Skeleton dark className="h-4 w-3/4 rounded" />
              <Skeleton dark className="h-3 w-full rounded" />
              <Skeleton dark className="h-3 w-2/3 rounded" />
            </div>
          </div>
          <div className="flex items-center justify-between pt-1">
            <Skeleton dark className="h-3 w-24 rounded" />
            <Skeleton dark className="h-3 w-16 rounded" />
          </div>
        </div>
      ))}
    </div>
  )
}

// Profile Tab Skeleton — avatar, info cards, settings
export function ProfileSkeleton() {
  return (
    <div className="animate-fadeIn pb-24 space-y-6">
      {/* Profile Header */}
      <div className="bg-zinc-900/70 border border-white/10 rounded-2xl p-6 flex flex-col items-center gap-4">
        <Skeleton dark className="w-20 h-20 rounded-full" />
        <div className="space-y-2 text-center">
          <Skeleton dark className="h-6 w-40 mx-auto rounded" />
          <Skeleton dark className="h-4 w-28 mx-auto rounded-full" />
        </div>
      </div>

      {/* Info Rows */}
      <div className="bg-zinc-900/70 border border-white/10 rounded-2xl p-5 space-y-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex justify-between items-center">
            <Skeleton dark className="h-4 w-1/3 rounded" />
            <Skeleton dark className="h-4 w-1/2 rounded" />
          </div>
        ))}
      </div>

      {/* Notification Preferences */}
      <div className="bg-zinc-900/70 border border-white/10 rounded-2xl p-5 space-y-4">
        <Skeleton dark className="h-5 w-48 rounded" />
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex items-center justify-between">
            <Skeleton dark className="h-4 w-2/5 rounded" />
            <Skeleton dark className="h-6 w-10 rounded-full" />
          </div>
        ))}
      </div>

      {/* Save Button */}
      <Skeleton dark className="h-12 w-full rounded-xl" />
    </div>
  )
}

// About Tab Skeleton — info cards, contact
export function AboutSkeleton() {
  return (
    <div className="animate-fadeIn pb-24 space-y-6">
      {/* Hero */}
      <div className="bg-zinc-900/70 border border-white/10 rounded-2xl p-6 space-y-4 text-center">
        <Skeleton dark className="w-16 h-16 rounded-2xl mx-auto" />
        <Skeleton dark className="h-6 w-48 mx-auto rounded" />
        <div className="space-y-2">
          <Skeleton dark className="h-3 w-full rounded" />
          <Skeleton dark className="h-3 w-5/6 mx-auto rounded" />
          <Skeleton dark className="h-3 w-4/5 mx-auto rounded" />
        </div>
      </div>

      {/* Contact cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-zinc-900/70 border border-white/10 rounded-xl p-4 flex items-center gap-4">
            <Skeleton dark className="w-10 h-10 rounded-xl shrink-0" />
            <div className="flex-1 space-y-2">
              <Skeleton dark className="h-4 w-1/2 rounded" />
              <Skeleton dark className="h-3 w-3/4 rounded" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// Full-page student portal skeleton (used before tabs load)
export function StudentPortalSkeleton() {
  return <DashboardSkeleton />
}


// ─── LANDING PAGE SKELETONS (Dark Theme) ────────────────────────────────────

// Specifically for Landing.jsx -> Available Services
export function ServiceCardSkeleton() {
  return (
    <div className="bg-zinc-950/40 backdrop-blur-md border border-white/5 p-6 rounded-[22px] flex flex-col justify-between h-full space-y-6">
      <div className="space-y-4">
        {/* Category & Fee Header */}
        <div className="flex items-center justify-between">
          <Skeleton dark className="h-4 w-1/4 rounded-full" />
          <Skeleton dark className="h-6 w-16 rounded-lg" />
        </div>
        
        {/* Title */}
        <Skeleton dark className="h-6 w-5/6 rounded-md" />
        
        {/* Description lines */}
        <div className="space-y-2 pt-2">
          <Skeleton dark className="h-3 w-full rounded-md" />
          <Skeleton dark className="h-3 w-4/5 rounded-md" />
        </div>
      </div>

      {/* Button */}
      <Skeleton dark className="h-10 w-full rounded-xl" />
    </div>
  )
}

// Specifically for Landing.jsx -> Recent Announcements
export function AnnouncementSkeleton({ count = 3 }) {
  return (
    <div className="space-y-4 mt-6">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="rounded-xl p-5 bg-zinc-900/40 border border-white/5 space-y-4 shadow-sm">
          {/* Date Header */}
          <div className="flex items-center justify-between">
            <Skeleton dark className="h-5 w-20 rounded" />
            <Skeleton dark className="h-4 w-32 rounded" />
          </div>
          
          {/* Title */}
          <Skeleton dark className="h-5 w-3/4 rounded" />
          
          {/* Content lines */}
          <div className="space-y-2">
            <Skeleton dark className="h-3 w-full rounded" />
            <Skeleton dark className="h-3 w-11/12 rounded" />
            <Skeleton dark className="h-3 w-4/5 rounded" />
          </div>
          
          {/* Link */}
          <Skeleton dark className="h-4 w-40 rounded mt-2" />
        </div>
      ))}
    </div>
  )
}


// ─── ADMIN PANEL SKELETONS (Light Theme) ─────────────────────────────────────

// Specifically for Admin Dashboard
export function AdminDashboardSkeleton() {
  return (
    <div className="animate-fadeIn space-y-12 pb-10">
      <div className="flex justify-between items-center pb-6 border-b border-gray-100">
        <Skeleton className="h-8 w-64 rounded" />
        <Skeleton className="h-6 w-32 rounded" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-white rounded-[20px] p-6 shadow-sm border border-gray-50 flex flex-col justify-between">
            <div className="flex justify-between items-center mb-4">
              <Skeleton className="h-10 w-10 rounded-xl" />
              <Skeleton className="h-8 w-16 rounded" />
            </div>
            <Skeleton className="h-4 w-24 rounded mt-4" />
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-[20px] p-8 shadow-sm border border-gray-50">
          <Skeleton className="h-6 w-48 rounded mb-6" />
          <Skeleton className="h-64 w-full rounded-xl" />
        </div>
        <div className="flex flex-col gap-6 lg:col-span-1">
          <div className="bg-white rounded-[20px] p-7 shadow-sm border border-gray-50">
            <Skeleton className="h-10 w-10 rounded mb-4" />
            <Skeleton className="h-6 w-32 rounded mb-2" />
            <Skeleton className="h-4 w-full rounded mb-6" />
            <Skeleton className="h-4 w-24 rounded" />
          </div>
        </div>
      </div>
    </div>
  )
}

// Generic Table Skeleton for Admin Lists
export function TableSkeleton({ rows = 5 }) {
  return (
    <div className="w-full bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mt-6 animate-fadeIn">
      <div className="overflow-x-auto">
        <table className="w-full text-left min-w-[700px]">
          <thead>
            <tr className="bg-[var(--color-surface-base)]">
              {Array.from({ length: 5 }).map((_, i) => (
                <th key={i} className="py-4 px-6">
                  <Skeleton className="h-3 w-20 rounded" />
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {Array.from({ length: rows }).map((_, i) => (
              <tr key={i} className="bg-white">
                {Array.from({ length: 5 }).map((_, j) => (
                  <td key={j} className="py-5 px-6">
                    <Skeleton className="h-4 w-full max-w-[150px] rounded" />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
