import React from 'react'

export default function ActionButton({ action, onClick, disabled }) {
  return (
    <button onClick={onClick} disabled={disabled} className="w-full rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-soft transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-60">
      <div className="text-sm font-semibold text-slate-900">{action.title}</div>
      <div className="mt-1 text-sm text-slate-600">{action.subtitle}</div>
    </button>
  )
}
