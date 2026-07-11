import React from 'react'

// Base premium borderless pulse block
export function Skeleton({ className = "" }) {
  return (
    <div className={`animate-pulse bg-slate-200/70 rounded ${className}`} />
  )
}

// Specifically for Landing.jsx -> Available Services
export function ServiceCardSkeleton() {
  return (
    <div className="bg-white p-6 rounded-2xl shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] flex flex-col justify-between h-full space-y-6">
      <div className="space-y-4">
        {/* Category & Fee Header */}
        <div className="flex items-center justify-between">
          <Skeleton className="h-4 w-1/4 rounded-full" />
          <Skeleton className="h-6 w-16 rounded-lg" />
        </div>
        
        {/* Title */}
        <Skeleton className="h-6 w-5/6 rounded-md" />
        
        {/* Description lines */}
        <div className="space-y-2 pt-2">
          <Skeleton className="h-3 w-full rounded-md" />
          <Skeleton className="h-3 w-4/5 rounded-md" />
        </div>
      </div>

      {/* Button */}
      <Skeleton className="h-10 w-full rounded-xl" />
    </div>
  )
}

// Specifically for Landing.jsx -> Recent Announcements
export function AnnouncementSkeleton({ count = 3 }) {
  return (
    <div className="space-y-4 mt-6">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="rounded-xl p-5 bg-slate-50/80 space-y-4 shadow-sm">
          {/* Date Header */}
          <div className="flex items-center justify-between">
            <Skeleton className="h-5 w-20 rounded" />
            <Skeleton className="h-4 w-32 rounded" />
          </div>
          
          {/* Title */}
          <Skeleton className="h-5 w-3/4 rounded" />
          
          {/* Content lines */}
          <div className="space-y-2">
            <Skeleton className="h-3 w-full rounded" />
            <Skeleton className="h-3 w-11/12 rounded" />
            <Skeleton className="h-3 w-4/5 rounded" />
          </div>
          
          {/* Link */}
          <Skeleton className="h-4 w-40 rounded mt-2" />
        </div>
      ))}
    </div>
  )
}

// Specifically for StudentPanel.jsx -> Main Dashboard Content
export function StudentPortalSkeleton() {
  return (
    <div className="space-y-8 w-full animate-fadeIn">
      {/* Header Greeting */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-3">
          <Skeleton className="h-8 w-64 rounded-md" />
          <Skeleton className="h-4 w-96 rounded-md" />
        </div>
        <Skeleton className="h-10 w-32 rounded-xl hidden md:block" />
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-white p-5 rounded-2xl shadow-[0_2px_15px_-3px_rgba(0,0,0,0.03)] space-y-4">
            <div className="flex justify-between items-start">
              <Skeleton className="h-4 w-1/2 rounded" />
              <Skeleton className="h-8 w-8 rounded-full" />
            </div>
            <Skeleton className="h-8 w-1/3 rounded" />
          </div>
        ))}
      </div>

      {/* Main Content Areas */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <Skeleton className="h-6 w-48 rounded" />
          <div className="bg-white p-6 rounded-2xl shadow-sm h-64 flex flex-col gap-4">
            <Skeleton className="h-12 w-full rounded-xl" />
            <Skeleton className="h-12 w-full rounded-xl" />
            <Skeleton className="h-12 w-full rounded-xl" />
          </div>
        </div>
        
        <div className="space-y-4">
          <Skeleton className="h-6 w-32 rounded" />
          <div className="bg-white p-6 rounded-2xl shadow-sm h-64 flex flex-col gap-4">
            <Skeleton className="h-16 w-full rounded-xl" />
            <Skeleton className="h-16 w-full rounded-xl" />
          </div>
        </div>
      </div>
    </div>
  )
}

// Specifically for StudentProfileDrawer.jsx
export function ProfileSkeleton() {
  return (
    <div className="bg-white rounded-3xl p-8 flex flex-col items-center justify-center space-y-6 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] animate-fadeIn">
      {/* Profile Image & Name */}
      <div className="flex flex-col items-center space-y-4 w-full">
        <Skeleton className="w-20 h-20 rounded-full" />
        <Skeleton className="h-6 w-40 rounded-md" />
        <Skeleton className="h-4 w-24 rounded-full" />
      </div>

      {/* Detail Rows */}
      <div className="w-full space-y-4 mt-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex justify-between items-center w-full">
            <Skeleton className="h-4 w-1/3 rounded" />
            <Skeleton className="h-4 w-1/2 rounded" />
          </div>
        ))}
      </div>
    </div>
  )
}
