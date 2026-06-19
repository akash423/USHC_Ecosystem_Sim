import React from 'react'
import { stakeholderMeta } from '../data/gameData'

export default function StakeholderChip({ stakeholderKey, value }) {
  const meta = stakeholderMeta[stakeholderKey]
  const Icon = meta.icon
  return (
    <div className={`rounded-2xl border px-3 py-3 ${meta.tone}`}>
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2"><Icon className="h-4 w-4" /><span className="text-sm font-semibold">{meta.label}</span></div>
        <span className="text-sm font-bold">{value}</span>
      </div>
    </div>
  )
}
