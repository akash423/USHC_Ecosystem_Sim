import React, { useMemo, useState } from 'react'
import { RotateCcw, BookOpen, AlertTriangle, TrendingUp, Scale, GraduationCap, MessageSquareQuote, Eye, Shuffle, CheckCircle2 } from 'lucide-react'
import { MAX_TURNS, scenarios, strategicActions, metricMeta, stakeholderMeta, clamp, average } from './data/gameData'
import MetricBar from './components/MetricBar'
import StakeholderChip from './components/StakeholderChip'
import DeltaPill from './components/DeltaPill'
import ChoiceButton from './components/ChoiceButton'
import ActionButton from './components/ActionButton'
import SummaryCard from './components/SummaryCard'

const shuffle = (arr) => {
  const next = [...arr]
  for (let i = next.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[next[i], next[j]] = [next[j], next[i]]
  }
  return next
}

function cloneState(state) {
  return JSON.parse(JSON.stringify(state))
}

function applyPayload(baseMetrics, baseStakeholders, payload) {
  const metrics = { ...baseMetrics }
  const stakeholders = { ...baseStakeholders }
  Object.entries(payload.metrics || {}).forEach(([key, delta]) => {
    metrics[key] = clamp((metrics[key] ?? 0) + delta)
  })
  Object.entries(payload.stakeholders || {}).forEach(([key, delta]) => {
    stakeholders[key] = clamp((stakeholders[key] ?? 0) + delta)
  })
  metrics.alignment = clamp(average(stakeholders))
  return { metrics, stakeholders }
}

function getConditions(metrics, stakeholders) {
  const notes = []
  if (metrics.affordability < 40) notes.push('Affordability is fragile — cost pressure is eroding room to maneuver.')
  if (metrics.quality < 40) notes.push('Care quality is under pressure — system performance may deteriorate quickly during shocks.')
  if (metrics.access < 40) notes.push('Access gaps are widening — coverage and care continuity need attention.')
  if (metrics.innovation < 40) notes.push('Innovation is lagging — future productivity and care redesign may stall.')
  if (metrics.alignment < 45) notes.push('Stakeholder support is splintering — implementation risk is rising.')
  const weakestStakeholder = Object.entries(stakeholders).sort((a, b) => a[1] - b[1])[0]
  if (weakestStakeholder && weakestStakeholder[1] < 40) notes.push(`${stakeholderMeta[weakestStakeholder[0]].label} sentiment is especially weak.`)
  return notes.length ? notes : ['System conditions are stable. Use this breathing room to build long-term resilience instead of optimizing only one KPI.']
}

function evaluateOutcome(metrics, stakeholders, turn) {
  const criticalMetric = Object.values(metrics).some((v) => v <= 10)
  const criticalStakeholder = Object.values(stakeholders).some((v) => v <= 5)
  if (criticalMetric || criticalStakeholder) {
    return {
      state: 'loss',
      title: 'System imbalance triggered an ecosystem failure',
      summary: 'One or more critical indicators collapsed. In the real healthcare ecosystem, persistent imbalance erodes implementation capacity, trust, and the political feasibility of reform.',
    }
  }
  if (turn >= MAX_TURNS) {
    const win = metrics.affordability >= 60 && metrics.quality >= 60 && metrics.access >= 60 && metrics.alignment >= 55 && Object.values(stakeholders).every((v) => v >= 35)
    if (win) {
      return {
        state: 'win',
        title: 'Triple Aim-style balance achieved',
        summary: 'You finished the horizon with a strong balance of affordability, quality, access, and alignment. The result reinforces a core Burns lesson: ecosystem stewardship is less about maximizing one sector and more about coordinating interdependent actors around shared value.',
      }
    }
    return {
      state: 'partial',
      title: 'The decade ended with mixed results',
      summary: 'You avoided collapse but did not fully align the ecosystem around the Triple Aim. That still creates a useful learning outcome: most real-world systems live in persistent tension, and the insight comes from seeing which trade-offs repeatedly undermine performance.',
    }
  }
  return { state: 'ongoing' }
}

function makeInitialState() {
  const deck = shuffle([...Array(scenarios.length).keys()]).slice(0, MAX_TURNS)
  return {
    metrics: { affordability: 58, quality: 55, access: 54, innovation: 52, alignment: 55 },
    stakeholders: { providers: 55, payers: 55, producers: 55, public: 55 },
    turn: 1,
    scenarioPointer: 0,
    scenarioDeck: deck,
    actionUsed: false,
    logs: [{ type: 'system', title: 'Simulation started', text: 'You are the Ecosystem Strategist. Guide the U.S. healthcare ecosystem across 10 turns while balancing cost, quality, access, innovation, and stakeholder support.' }],
    pendingEffects: [],
    status: 'intro',
    endState: null,
    facilitatorMode: false,
  }
}

export default function App() {
  const initialState = useMemo(() => makeInitialState(), [])
  const [game, setGame] = useState(initialState)

  const currentScenario = scenarios[game.scenarioDeck?.[game.scenarioPointer] ?? 0]
  const conditionNotes = getConditions(game.metrics, game.stakeholders)
  const latestLogs = [...game.logs].slice(-6).reverse()

  const resetGame = () => setGame({ ...makeInitialState(), facilitatorMode: game.facilitatorMode })
  const startGame = () => setGame((prev) => ({ ...prev, status: 'playing' }))
  const toggleFacilitatorMode = () => setGame((prev) => ({ ...prev, facilitatorMode: !prev.facilitatorMode }))
  const reshuffleDeck = () => setGame((prev) => ({ ...prev, scenarioDeck: shuffle([...Array(scenarios.length).keys()]).slice(0, MAX_TURNS), scenarioPointer: 0, turn: 1, pendingEffects: [], logs: [{ type: 'system', title: 'Deck refreshed', text: 'A new scenario sequence has been generated for replay or live facilitation.' }], status: prev.status === 'intro' ? 'intro' : 'playing', endState: null, actionUsed: false }))

  const applyPendingAtTurnStart = (draft) => {
    const dueNow = draft.pendingEffects.filter((e) => e.turnsRemaining <= 0)
    const remaining = draft.pendingEffects.filter((e) => e.turnsRemaining > 0).map((e) => ({ ...e, turnsRemaining: e.turnsRemaining - 1 }))
    let metrics = { ...draft.metrics }
    let stakeholders = { ...draft.stakeholders }
    const newLogs = [...draft.logs]
    dueNow.forEach((effect) => {
      const result = applyPayload(metrics, stakeholders, effect)
      metrics = result.metrics
      stakeholders = result.stakeholders
      newLogs.push({ type: 'delayed', title: 'Delayed ripple effect', text: effect.log || 'A prior decision continues to reshape the ecosystem.' })
    })
    return { ...draft, metrics, stakeholders, pendingEffects: remaining, logs: newLogs }
  }

  const useStrategicAction = (action) => {
    if (game.actionUsed || game.status !== 'playing') return
    setGame((prev) => {
      const next = cloneState(prev)
      const result = applyPayload(next.metrics, next.stakeholders, action.immediate)
      next.metrics = result.metrics
      next.stakeholders = result.stakeholders
      next.actionUsed = true
      next.logs.push({ type: 'action', title: action.title, text: action.immediate.feedback })
      next.logs.push({ type: 'lesson', title: 'Leadership insight', text: action.immediate.lesson })
      return next
    })
  }

  const resolveChoice = (choice) => {
    if (game.status !== 'playing') return
    setGame((prev) => {
      let next = cloneState(prev)
      const applied = applyPayload(next.metrics, next.stakeholders, choice.effects)
      next.metrics = applied.metrics
      next.stakeholders = applied.stakeholders
      next.logs.push({ type: 'decision', title: currentScenario.title, text: choice.effects.feedback })
      next.logs.push({ type: 'lesson', title: 'Burns lens', text: choice.effects.lesson || currentScenario.concept })
      ;(choice.effects.delayed || []).forEach((d) => next.pendingEffects.push({ turnsRemaining: d.turns, metrics: d.metrics || {}, stakeholders: d.stakeholders || {}, log: d.log }))
      const immediateResult = evaluateOutcome(next.metrics, next.stakeholders, next.turn)
      if (immediateResult.state === 'loss') return { ...next, status: 'complete', endState: immediateResult }
      if (next.turn >= MAX_TURNS) {
        const result = evaluateOutcome(next.metrics, next.stakeholders, MAX_TURNS)
        return { ...next, status: 'complete', endState: result }
      }
      next.turn += 1
      next.scenarioPointer += 1
      next.actionUsed = false
      next = applyPendingAtTurnStart(next)
      const afterPending = evaluateOutcome(next.metrics, next.stakeholders, next.turn - 1)
      if (afterPending.state === 'loss') return { ...next, status: 'complete', endState: afterPending }
      return next
    })
  }

  const finalKpiNarrative = useMemo(() => {
    const winners = Object.entries(game.metrics).filter(([key, value]) => key !== 'alignment' && value >= 65).map(([key]) => metricMeta[key].label)
    const laggards = Object.entries(game.metrics).filter(([key, value]) => value < 50).map(([key]) => metricMeta[key].label)
    return { winners, laggards }
  }, [game.metrics])

  if (game.status === 'intro') {
    return (
      <div className="min-h-screen bg-slate-50 p-6 text-slate-900">
        <div className="mx-auto max-w-7xl space-y-6">
          <div className="rounded-[28px] border border-slate-200 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-8 text-white shadow-soft">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
              <div className="max-w-3xl space-y-4">
                <div className="inline-flex items-center rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-slate-100">Leadership Training Prototype</div>
                <div>
                  <h1 className="text-3xl font-bold tracking-tight md:text-5xl">Ecosystem Steward</h1>
                  <p className="mt-3 max-w-2xl text-base text-slate-300 md:text-lg">A serious game for senior leaders to experience how power, incentives, scale, trust, and interdependence shape the U.S. healthcare ecosystem.</p>
                </div>
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-4"><div className="text-sm font-semibold">Pattern 1: Strategy/Simulation</div><div className="mt-1 text-sm text-slate-300">Manage KPIs and stakeholder states over 10 turns.</div></div>
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-4"><div className="text-sm font-semibold">Pattern 2: Narrative Decisions</div><div className="mt-1 text-sm text-slate-300">Respond to executive scenario cards with visible trade-offs.</div></div>
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-4"><div className="text-sm font-semibold">Facilitator Mode</div><div className="mt-1 text-sm text-slate-300">Adds discussion prompts, teaching notes, and visible trade-off cues.</div></div>
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-4"><div className="text-sm font-semibold">Scenario Library</div><div className="mt-1 text-sm text-slate-300">16 cross-sector cards spanning providers, payers, policy, innovation, and resilience.</div></div>
                </div>
              </div>
              <div className="w-full max-w-md rounded-3xl border border-white/10 bg-white/5 p-5 backdrop-blur-sm">
                <div className="mb-4 flex items-center gap-2"><Scale className="h-5 w-5 text-sky-300" /><div className="font-semibold">How to win</div></div>
                <ul className="space-y-3 text-sm text-slate-200">
                  <li className="rounded-2xl bg-white/5 p-3">Keep <strong>Cost Containment</strong>, <strong>Care Quality</strong>, and <strong>Access</strong> at healthy levels.</li>
                  <li className="rounded-2xl bg-white/5 p-3">Maintain enough <strong>Stakeholder Alignment</strong> to implement change.</li>
                  <li className="rounded-2xl bg-white/5 p-3">Use one strategic action each turn, then resolve a scenario card and absorb ripple effects.</li>
                </ul>
                <div className="mt-5 flex gap-3">
                  <button onClick={startGame} className="inline-flex flex-1 items-center justify-center rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-slate-900 shadow-sm transition hover:translate-y-[-1px]">Start the Simulation</button>
                  <button onClick={toggleFacilitatorMode} className={`inline-flex items-center justify-center rounded-2xl px-4 py-3 text-sm font-semibold shadow-sm transition ${game.facilitatorMode ? 'bg-sky-500 text-white' : 'bg-slate-700 text-white'}`}>{game.facilitatorMode ? 'Facilitator On' : 'Facilitator Off'}</button>
                </div>
              </div>
            </div>
          </div>
          <div className="grid gap-6 lg:grid-cols-3">
            <SummaryCard title="Included in this MVP" icon={BookOpen}><ul className="space-y-2 text-sm text-slate-600"><li>• 16 scenario cards covering consolidation, payment, innovation, coverage, resilience, digital health, and intermediaries</li><li>• Strategic action layer for proactive leadership moves</li><li>• Delayed ripple effects to show second-order ecosystem consequences</li><li>• Executive dashboard layout with KPI bars, stakeholder sentiment, and a running decision log</li></ul></SummaryCard>
            <SummaryCard title="Facilitator mode" icon={GraduationCap}><ul className="space-y-2 text-sm text-slate-600"><li>• Discussion prompts for each card</li><li>• 'What to watch' guidance for the most relevant KPIs</li><li>• Suggested debrief language to link gameplay back to leadership lessons</li><li>• Optional visible choice-impact chips to support live training discussion</li></ul></SummaryCard>
            <SummaryCard title="Prototype design note" icon={AlertTriangle}><p className="text-sm text-slate-600">The simulation intentionally uses lightweight, editable rules rather than economic realism. That makes the MVP explainable, easy to change, and practical for workshop pilots.</p></SummaryCard>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-soft">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-slate-600">Ecosystem Steward • Turn {Math.min(game.turn, MAX_TURNS)} of {MAX_TURNS}</div>
              <h1 className="mt-3 text-2xl font-bold tracking-tight text-slate-900 md:text-4xl">Executive Simulation Dashboard</h1>
              <p className="mt-2 max-w-3xl text-sm text-slate-600 md:text-base">Balance affordability, quality, access, innovation, and stakeholder cohesion while responding to the kind of cross-sector dilemmas senior healthcare leaders face.</p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3"><div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Current Objective</div><div className="mt-1 text-sm font-semibold text-slate-900">Finish the horizon with a healthy Triple Aim balance</div></div>
              <button onClick={toggleFacilitatorMode} className={`inline-flex items-center gap-2 rounded-2xl px-4 py-3 text-sm font-semibold shadow-sm transition ${game.facilitatorMode ? 'bg-sky-500 text-white' : 'border border-slate-200 bg-white text-slate-700'}`}><GraduationCap className="h-4 w-4" /> {game.facilitatorMode ? 'Facilitator Mode On' : 'Facilitator Mode Off'}</button>
              <button onClick={reshuffleDeck} className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-slate-300"><Shuffle className="h-4 w-4" /> New deck</button>
              <button onClick={resetGame} className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-slate-300"><RotateCcw className="h-4 w-4" /> Reset</button>
            </div>
          </div>
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.15fr_1.85fr_1.2fr]">
          <div className="space-y-6">
            <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-soft">
              <div className="mb-4 flex items-center justify-between"><h2 className="text-lg font-semibold text-slate-900">Core Metrics</h2><div className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">Higher is better</div></div>
              <div className="space-y-3">{Object.entries(game.metrics).map(([key, value]) => <MetricBar key={key} metricKey={key} value={value} />)}</div>
            </div>
            <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-soft">
              <div className="mb-4 flex items-center justify-between"><h2 className="text-lg font-semibold text-slate-900">Stakeholder Sentiment</h2><div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Alignment rolls up from these states</div></div>
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">{Object.entries(game.stakeholders).map(([key, value]) => <StakeholderChip key={key} stakeholderKey={key} value={value} />)}</div>
            </div>
          </div>

          <div className="space-y-6">
            {game.status === 'complete' ? (
              <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-soft">
                <div className="rounded-3xl bg-slate-900 p-6 text-white">
                  <div className="inline-flex items-center rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-slate-200">Simulation Complete</div>
                  <h2 className="mt-4 text-3xl font-bold tracking-tight">{game.endState?.title}</h2>
                  <p className="mt-3 max-w-3xl text-sm text-slate-300 md:text-base">{game.endState?.summary}</p>
                </div>
                <div className="mt-6 grid gap-4 lg:grid-cols-2">
                  <SummaryCard title="What your run optimized" icon={TrendingUp}>{finalKpiNarrative.winners.length ? <ul className="space-y-2 text-sm text-slate-600">{finalKpiNarrative.winners.map((item) => <li key={item}>• {item} finished in a healthy range</li>)}</ul> : <p className="text-sm text-slate-600">No KPI clearly finished in a high-confidence zone — a useful reminder that diffuse systems rarely improve automatically.</p>}</SummaryCard>
                  <SummaryCard title="What still needs work" icon={AlertTriangle}>{finalKpiNarrative.laggards.length ? <ul className="space-y-2 text-sm text-slate-600">{finalKpiNarrative.laggards.map((item) => <li key={item}>• {item} remained below the target operating range</li>)}</ul> : <p className="text-sm text-slate-600">No indicator ended in the danger zone. Your main challenge was balancing competing goals consistently rather than recovering from collapse.</p>}</SummaryCard>
                </div>
                <div className="mt-6 rounded-3xl border border-slate-200 bg-slate-50 p-5">
                  <div className="mb-3 text-lg font-semibold text-slate-900">Debrief: Leadership lessons surfaced</div>
                  <div className="grid gap-3 md:grid-cols-2">
                    <div className="rounded-2xl bg-white p-4 shadow-soft"><div className="text-sm font-semibold text-slate-900">1. Ecosystems reward alignment, not isolated wins</div><p className="mt-2 text-sm text-slate-600">Several choices improved one sector while creating backlash elsewhere. Implementation capacity depends on whether major actors can live with the solution.</p></div>
                    <div className="rounded-2xl bg-white p-4 shadow-soft"><div className="text-sm font-semibold text-slate-900">2. Scale without guardrails can worsen affordability</div><p className="mt-2 text-sm text-slate-600">Consolidation and bargaining leverage can increase power quickly; the simulation shows why leaders often pair scale moves with accountability and incentive redesign.</p></div>
                    <div className="rounded-2xl bg-white p-4 shadow-soft"><div className="text-sm font-semibold text-slate-900">3. Technology is a force multiplier, not a magic wand</div><p className="mt-2 text-sm text-slate-600">Digital tools improved coordination only when trust, workflow fit, and governance stayed intact.</p></div>
                    <div className="rounded-2xl bg-white p-4 shadow-soft"><div className="text-sm font-semibold text-slate-900">4. Second-order effects matter</div><p className="mt-2 text-sm text-slate-600">Delayed ripple effects surfaced why short-term wins can still create future pain. That pattern mirrors real healthcare reform, where contracts, politics, and behavior evolve over time.</p></div>
                  </div>
                </div>
                <div className="mt-6 flex flex-wrap gap-3"><button onClick={resetGame} className="inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:translate-y-[-1px]"><RotateCcw className="h-4 w-4" /> Play Again</button></div>
              </div>
            ) : (
              <>
                <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-soft">
                  <div className="mb-5 flex items-start justify-between gap-4"><div><div className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-slate-600">{currentScenario.domain}</div><h2 className="mt-3 text-2xl font-bold tracking-tight text-slate-900">{currentScenario.title}</h2><p className="mt-3 text-sm leading-6 text-slate-600 md:text-base">{currentScenario.text}</p></div></div>
                  <div className="rounded-2xl border border-sky-100 bg-sky-50 p-4"><div className="text-xs font-semibold uppercase tracking-[0.2em] text-sky-700">Concept in focus</div><div className="mt-2 text-sm text-sky-900">{currentScenario.concept}</div></div>
                  <div className="mt-6"><div className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">Decision options</div><div className="grid gap-3">{currentScenario.choices.map((choice) => <ChoiceButton key={choice.label} choice={choice} onClick={() => resolveChoice(choice)} disabled={false} facilitatorMode={game.facilitatorMode} />)}</div></div>
                </div>
                <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-soft">
                  <div className="mb-4 flex items-center justify-between gap-3"><div><h2 className="text-lg font-semibold text-slate-900">Strategic Leadership Action</h2><p className="mt-1 text-sm text-slate-600">Optional but recommended: play one proactive move before resolving the scenario card.</p></div><div className={`rounded-full px-3 py-1 text-xs font-semibold ${game.actionUsed ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>{game.actionUsed ? 'Action used this turn' : '1 action available'}</div></div>
                  <div className="grid gap-3 lg:grid-cols-2">{strategicActions.map((action) => <ActionButton key={action.id} action={action} onClick={() => useStrategicAction(action)} disabled={game.actionUsed} />)}</div>
                </div>
              </>
            )}
          </div>

          <div className="space-y-6">
            <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-soft"><div className="mb-4 flex items-center justify-between gap-3"><h2 className="text-lg font-semibold text-slate-900">Situation Update</h2><div className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">Turn start readout</div></div><div className="space-y-3">{conditionNotes.map((note, idx) => <div key={idx} className="rounded-2xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">{note}</div>)}</div></div>
            {game.facilitatorMode && game.status !== 'complete' && <div className="rounded-[28px] border border-sky-200 bg-sky-50 p-5 shadow-soft"><div className="mb-4 flex items-center justify-between"><div className="flex items-center gap-2 text-sky-900"><GraduationCap className="h-5 w-5" /><h2 className="text-lg font-semibold">Facilitator mode</h2></div><div className="rounded-full bg-white/80 px-3 py-1 text-xs font-semibold text-sky-700">Live training support</div></div><div className="space-y-4"><div className="rounded-2xl bg-white p-4 shadow-soft"><div className="mb-2 flex items-center gap-2 text-slate-900"><MessageSquareQuote className="h-4 w-4" /><div className="text-sm font-semibold">Discussion prompts</div></div><ul className="space-y-2 text-sm text-slate-700">{currentScenario.facilitator.prompts.map((prompt) => <li key={prompt}>• {prompt}</li>)}</ul></div><div className="rounded-2xl bg-white p-4 shadow-soft"><div className="mb-2 flex items-center gap-2 text-slate-900"><Eye className="h-4 w-4" /><div className="text-sm font-semibold">What to watch</div></div><div className="flex flex-wrap gap-2">{currentScenario.facilitator.watchFors.map((item) => <span key={item} className="rounded-full border border-sky-200 bg-sky-100 px-2 py-1 text-xs font-semibold text-sky-800">{item}</span>)}</div></div><div className="rounded-2xl bg-white p-4 shadow-soft"><div className="mb-2 flex items-center gap-2 text-slate-900"><CheckCircle2 className="h-4 w-4" /><div className="text-sm font-semibold">Suggested debrief</div></div><p className="text-sm text-slate-700">{currentScenario.facilitator.debrief}</p></div></div></div>}
            <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-soft"><div className="mb-4 flex items-center justify-between"><h2 className="text-lg font-semibold text-slate-900">Recent Outcomes</h2><div className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">Most recent 6 entries</div></div><div className="space-y-3">{latestLogs.map((log, idx) => <div key={`${log.title}-${idx}`} className="rounded-2xl border border-slate-200 p-3"><div className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">{log.title}</div><div className="mt-1 text-sm text-slate-700">{log.text}</div></div>)}</div></div>
            <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-soft"><div className="mb-4 text-lg font-semibold text-slate-900">KPI Snapshot</div><div className="grid gap-2">{Object.entries(game.metrics).map(([key, value]) => <div key={key} className="flex items-center justify-between rounded-2xl border border-slate-200 px-3 py-2"><span className="text-sm text-slate-700">{metricMeta[key].label}</span><DeltaPill value={value - 55} /></div>)}</div></div>
          </div>
        </div>
      </div>
    </div>
  )
}
