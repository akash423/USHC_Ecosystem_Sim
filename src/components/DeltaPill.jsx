import React from 'react'

export default function DeltaPill({ value }) {
  const tone = value > 0 ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : value < 0 ? 'bg-rose-50 text-rose-700 border-rose-200' : 'bg-slate-50 text-slate-600 border-slate-200'
  const sign = value > 0 ? '+' : ''
  return <span className={`rounded-full border px-2 py-1 text-xs font-semibold ${tone}`}>{`${sign}${value}`}</span>
}
