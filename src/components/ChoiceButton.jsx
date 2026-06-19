import React from 'react'
import { ArrowRight } from 'lucide-react'
import { metricMeta, stakeholderMeta } from '../data/gameData'

function deltaList(effects) {
  const metricBits = Object.entries(effects.metrics || {}).map(([k, v]) => `${metricMeta[k].label} ${v > 0 ? '+' : ''}${v}`)
  const stakeholderBits = Object.entries(effects.stakeholders || {}).map(([k, v]) => `${stakeholderMeta[k].label} ${v > 0 ? '+' : ''}${v}`)
  return [...metricBits, ...stakeholderBits]
}

export default function ChoiceButton({ choice, onClick, disabled, facilitatorMode }) {
  const deltas = deltaList(choice.effects)
  return (
    <button onClick={onClick} disabled={disabled} className="w-full rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-soft transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-60">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-sm font-semibold text-slate-900">{choice.label}</div>
          <div className="mt-1 text-sm text-slate-600">{choice.summary}</div>
          {facilitatorMode && <div className="mt-3 flex flex-wrap gap-2">{deltas.map((item) => <span key={item} className="rounded-full bg-slate-100 px-2 py-1 text-[11px] font-medium text-slate-700">{item}</span>)}</div>}
        </div>
        <ArrowRight className="mt-1 h-4 w-4 shrink-0 text-slate-400" />
      </div>
    </button>
  )
}
