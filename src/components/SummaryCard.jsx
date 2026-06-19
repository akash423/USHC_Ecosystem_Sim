import React from 'react'

export default function SummaryCard({ title, children, icon }) {
  const Icon = icon
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-soft">
      <div className="mb-3 flex items-center gap-2 text-slate-900"><div className="rounded-xl bg-slate-100 p-2"><Icon className="h-4 w-4" /></div><h3 className="font-semibold">{title}</h3></div>
      {children}
    </div>
  )
}
