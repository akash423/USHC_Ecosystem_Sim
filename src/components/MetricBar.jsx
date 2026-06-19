import React from 'react'
import { metricMeta } from '../data/gameData'

function getStatusTone(value) {
  if (value >= 70) return 'text-emerald-600'
  if (value >= 40) return 'text-amber-600'
  return 'text-rose-600'
}

export default function MetricBar({ metricKey, value }) {
  const meta = metricMeta[metricKey]
  const Icon = meta.icon
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-soft">
      <div className="mb-2 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="rounded-xl bg-slate-100 p-2 text-slate-700"><Icon className="h-4 w-4" /></div>
          <div>
            <div className="text-sm font-semibold text-slate-900">{meta.label}</div>
            <div className="text-xs text-slate-500">{meta.hint}</div>
          </div>
        </div>
        <div className={`text-lg font-bold ${getStatusTone(value)}`}>{value}</div>
      </div>
      <div className="h-3 w-full rounded-full bg-slate-100"><div className={`h-3 rounded-full ${meta.color} transition-all duration-500`} style={{ width: `${value}%` }} /></div>
    </div>
  )
}
