import { useEffect, useMemo, useState } from 'react'
import type { PropsLocale, PropsRuntime, Translate } from '@deepseek-ai/dsh-client-ui-slots'
import { IconChecklistOutline14, IconChevronDownOutline14, IconDownloadOutline16 } from '@deepseek-ai/dsh-client-ui-primitives'

import type { JobView, SessionListState } from '@deepseek-ai/dsh-client-runtime/client'
import type { SessionStatsProjection } from '@deepseek-ai/dsh-session-stats/types'
import type { TokenUsageProjection } from '@deepseek-ai/dsh-token-meter/projection'
import { NS } from './locales.ts'
import type { MobileNavKey } from './locales.ts'

/** Full props of the status view tab entry. */
export type MobileStatusViewProps = PropsRuntime<'conversation.view'> & PropsLocale<typeof NS> & {
  /** Bound ctx.sessionLogDownload.download() for the current session. */
  downloadSessionLog?: (sessionId: string) => void
}

/** Compact token count: 517 / 12.2K / 517K / 1.2M (one decimal under three digits). */
function formatTokens(n: number): string {
  const scaled = (v: number): string => (v >= 100 ? String(Math.round(v)) : String(Math.round(v * 10) / 10))
  if (n < 1e3) return String(n)
  if (n < 1e6) return `${scaled(n / 1e3)}K`
  return `${scaled(n / 1e6)}M`
}

/** Compact duration: 45.2s under a minute, 2m42s from there on. */
function formatDuration(ms: number): string {
  if (!Number.isFinite(ms) || ms <= 0) return '—'
  const s = ms / 1e3
  if (s < 60) return `${Math.round(s * 10) / 10}s`
  const whole = Math.round(s)
  return `${Math.floor(whole / 60)}m${whole % 60}s`
}

/** Decode-throughput figure: whole tokens from ten up, one decimal below. */
function formatTokensPerSecond(tps: number): string {
  const clamped = Math.max(0, tps)
  return clamped >= 10 ? String(Math.round(clamped)) : String(Math.round(clamped * 10) / 10)
}

/** Sum the three disjoint prompt-side billing buckets. */
function billedInputTokens(usage: TokenUsageProjection): number {
  return usage.uncachedInputTokens + usage.cacheReadTokens + usage.cacheWriteTokens
}

/** Cache-hit share of prompt-side input; null when no input was billed.
* Kept as the exact ratio — the caller formats it (two decimals on the card). */
function cacheHitPercent(usage: TokenUsageProjection): number | null {
  const denominator = billedInputTokens(usage)
  return denominator === 0 ? null : (usage.cacheReadTokens / denominator) * 100
}

/**
 * Session status tab — a dashboard of the conversation's engine state.
 *
 * Layout (mobile-first, mirroring the official design language: one soft
 * card per group, hairline separators inside, accent blue for the live
 * state):
 *
 *   ● Running                    active          ← status line (no card)
 *   ┌─────────────────────────────────────────┐
 *   │ 轮数       5 │ 步数       136           │  ← core counts card
 *   │ 模型耗时 12m10s │ 工具耗时 1m54s        │
 *   └─────────────────────────────────────────┘
 *   ┌─────────────────────────────────────────┐
 *   │ 首字延迟  1.3s │ 解码速率  139 tok/s    │  ← latency card
 *   └─────────────────────────────────────────┘
 *   ┌─────────────────────────────────────────┐
 *   │ 缓存命中 99% │ 输入 14.7M │ 输出 76.9K  │  ← usage card (3 columns)
 *   └─────────────────────────────────────────┘
 *   排队消息 0 · 等待确认 0 · 运行中工具 bash     ← transient list
 *
 * Figures ride the durable `sessionStats` + `tokenUsage` projections when
 * the host provides them (client-window fallback for the counts). Every
 * value is a live subscription via the framework standard kit.
 */
/** Stable empty list so a session with no jobs keeps one array identity. */
const NO_TASKS: readonly JobView[] = []

/** A job the registry still holds open, and whose duration therefore ticks. */
function isLiveJob(job: JobView): boolean {
  return job.status === 'running' || job.status === 'stopping'
}

/** Human status word for the row. */
function jobStatusLabel(status: JobView['status'], t: Translate<MobileNavKey>): string {
  switch (status) {
    case 'running': return t('jobs.status.running')
    case 'stopping': return t('jobs.status.stopping')
    case 'completed': return t('jobs.status.completed')
    case 'killed': return t('jobs.status.killed')
    case 'failed': return t('jobs.status.failed')
    default: return t('jobs.status.completed')
  }
}

/** Elapsed time in at most two adjacent units (same vocabulary as the header control). */
function formatJobDuration(elapsedMs: number, t: Translate<MobileNavKey>): string {
  const total = Math.max(0, Math.floor(elapsedMs / 1e3))
  const seconds = total % 60
  const minutes = Math.floor(total / 60) % 60
  const hours = Math.floor(total / 3600)
  if (hours > 0) return t('jobs.duration.hours', { hours, minutes })
  if (minutes > 0) return t('jobs.duration.minutes', { minutes, seconds })
  return t('jobs.duration.seconds', { seconds })
}

/** Live rows first in start order, then settled rows newest-first. */
function orderedJobs(jobs: readonly JobView[]): JobView[] {
  return [...jobs].sort((left, right) => {
    const liveLeft = isLiveJob(left)
    if (liveLeft !== isLiveJob(right)) return liveLeft ? -1 : 1
    if (liveLeft) return left.startedAt - right.startedAt
    const finished = (right.finishedAt ?? right.startedAt) - (left.finishedAt ?? left.startedAt)
    return finished !== 0 ? finished : left.startedAt - right.startedAt
  })
}

/**
 * Background-jobs section inside the Status tab. The official header
 * control (ui-jobs "job-list") is hidden on mobile and its data surface —
 * jobsBySession on the sessions snapshot — is rendered here instead:
 * collapsed by default, one tap expands the live/settled task rows.
 */
function JobsSection({
  useSessions,
  sessionId,
  t,
}: {
  useSessions: (selector: (state: SessionListState) => unknown) => unknown
  sessionId: string
  t: Translate<MobileNavKey>
}) {
  const jobs = (useSessions((state: SessionListState) => state.jobsBySession[sessionId]) as readonly JobView[] | undefined) ?? NO_TASKS
  const [open, setOpen] = useState(false)
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    if (!open || !jobs.some(isLiveJob)) return
    const timer = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(timer)
  }, [open, jobs])

  if (jobs.length === 0) return null
  // Auto-cleanup: killed jobs disappear entirely (they pile up fast from
  // cancelled runs), and settled rows are capped to the newest MAX_SETTLED
  // so the list can never grow without bound — live jobs always stay on top.
  const MAX_SETTLED = 8
  const rows = useMemo(() => {
    const sorted = orderedJobs(jobs.filter((job) => job.status !== 'killed'))
    const liveCount = sorted.filter(isLiveJob).length
    return sorted.slice(0, liveCount + MAX_SETTLED)
  }, [jobs])
  const liveCount = rows.filter(isLiveJob).length

  return (
    <div data-mobile-nav="jobs-card">
      <button
        type="button"
        data-mobile-nav="jobs-toggle"
        aria-expanded={open}
        aria-label={t('jobs.title')}
        onClick={() => setOpen((v) => !v)}
      >
        <span data-mobile-nav="jobs-icon">
          <IconChecklistOutline14 />
        </span>
        <span data-mobile-nav="jobs-title">{t('jobs.title')}</span>
        <span data-mobile-nav="jobs-count" data-live={liveCount > 0 ? '1' : '0'}>
          {liveCount > 0 ? t('jobs.countLive', { count: liveCount }) : t('jobs.count', { count: rows.length })}
        </span>
        <span data-mobile-nav="jobs-chevron" data-open={open ? '1' : '0'}>
          <IconChevronDownOutline14 />
        </span>
      </button>
      {open && (
        <div data-mobile-nav="jobs-list">
          {rows.map((job) => {
            const live = isLiveJob(job)
            const duration = formatJobDuration(live ? now - job.startedAt : (job.finishedAt ?? job.startedAt) - job.startedAt, t)
            const status = jobStatusLabel(job.status, t)
            return (
              <div key={job.id} data-mobile-nav="job-row" data-live={live ? '1' : '0'} data-state={job.status}>
                <span data-mobile-nav="job-dot" />
                <span data-mobile-nav="job-kind">{job.kind}</span>
                <span data-mobile-nav="job-label" title={job.label}>
                  {job.label}
                </span>
                <span data-mobile-nav="job-meta">
                  <span data-mobile-nav="job-status" title={job.detail ?? status}>
                    {status}
                  </span>
                  <span data-mobile-nav="job-duration">{duration}</span>
                </span>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export function MobileStatusView({ useSession, useSessions, useProjection, sessionId, downloadSessionLog, t }: MobileStatusViewProps) {
  const running = useSession((s) => s.running)
  const composerPhase = useSession((s) => s.composerPhase)
  const removed = useSession((s) => s.removed)
  const turnEnds = useSession((s) => s.turnEnds)
  const turnTimings = useSession((s) => s.turnTimings)
  const subagent = useSession((s) => s.subagent)
  const loadingOlder = useSession((s) => s.loadingOlder)
  const lastAgentError = useSession((s) => s.lastAgentError)
  const stats = useProjection('sessionStats')
  const usage = useProjection('tokenUsage')

  const fallback: SessionStatsProjection = {
    turns: turnEnds.size,
    steps: turnTimings.size,
    llmMs: 0,
    toolMs: 0,
    ttftMs: 0,
    ttftSteps: 0,
    decodeMs: 0,
    decodeTokens: 0,
  }
  const s: SessionStatsProjection = stats ?? fallback

  const phaseLabel =
    composerPhase === 'blank' ? t('status.blank') : composerPhase === 'engaging' ? 'engaging' : 'active'
  const showUsage = usage !== undefined && (billedInputTokens(usage) > 0 || usage.outputTokens > 0)
  const cacheHit = usage !== undefined ? cacheHitPercent(usage) : null
  // "Running tools" is deliberately NOT listed here: on mobile every tool
  // call also surfaces as a background job (Status tab jobs card), so a
  // duplicate inline row would just add noise.
  const transient = [
    ...(subagent !== null ? [{ label: t('status.subagent'), value: subagent.address.address }] : []),
    ...(loadingOlder ? [{ label: t('status.loadingOlder'), value: '…' }] : []),
  ]

  return (
    <div data-mobile-nav="status">
      <div data-mobile-nav="status-line">
        <span data-mobile-nav="status-dot" data-running={running ? '1' : '0'} />
        <span data-mobile-nav="status-label">{running ? t('status.running') : t('status.idle')}</span>
        <span data-mobile-nav="status-phase">
          {phaseLabel}
          {removed ? ` · ${t('status.removed')}` : ''}
        </span>
      </div>

      {downloadSessionLog !== undefined && (
        <button
          type="button"
          data-mobile-nav="status-export"
          disabled={sessionId === undefined}
          onClick={() => {
            if (sessionId !== undefined) downloadSessionLog(sessionId)
          }}
        >
          <IconDownloadOutline16 size={14} />
          <span>{t('status.exportLog')}</span>
        </button>
      )}

      <div data-mobile-nav="status-card">
        <div data-mobile-nav="status-cell">
          <span data-mobile-nav="cell-label">{t('status.turns')}</span>
          <span data-mobile-nav="cell-value">{s.turns}</span>
        </div>
        <div data-mobile-nav="status-cell">
          <span data-mobile-nav="cell-label">{t('status.steps')}</span>
          <span data-mobile-nav="cell-value">{s.steps}</span>
        </div>
        <div data-mobile-nav="status-cell">
          <span data-mobile-nav="cell-label">{t('status.llmTime')}</span>
          <span data-mobile-nav="cell-value">{formatDuration(s.llmMs)}</span>
        </div>
        <div data-mobile-nav="status-cell">
          <span data-mobile-nav="cell-label">{t('status.toolTime')}</span>
          <span data-mobile-nav="cell-value">{formatDuration(s.toolMs)}</span>
        </div>
      </div>

      <div data-mobile-nav="status-card">
        <div data-mobile-nav="status-cell">
          <span data-mobile-nav="cell-label">{t('status.ttft')}</span>
          <span data-mobile-nav="cell-value">{s.ttftSteps > 0 ? formatDuration(s.ttftMs / s.ttftSteps) : '—'}</span>
        </div>
        <div data-mobile-nav="status-cell">
          <span data-mobile-nav="cell-label">{t('status.throughput')}</span>
          <span data-mobile-nav="cell-value">
            {s.decodeMs > 0 ? `${formatTokensPerSecond(s.decodeTokens / (s.decodeMs / 1e3))} tok/s` : '—'}
          </span>
        </div>
      </div>

      <div data-mobile-nav="status-card" data-usage="1">
        <div data-mobile-nav="status-cell">
          <span data-mobile-nav="cell-label">{t('status.cacheHit')}</span>
          <span data-mobile-nav="cell-value">{cacheHit !== null ? `${cacheHit.toFixed(2)}%` : '—'}</span>
        </div>
        <div data-mobile-nav="status-cell">
          <span data-mobile-nav="cell-label">{t('status.inputTokens')}</span>
          <span data-mobile-nav="cell-value">{showUsage ? formatTokens(billedInputTokens(usage)) : '—'}</span>
        </div>
        <div data-mobile-nav="status-cell">
          <span data-mobile-nav="cell-label">{t('status.outputTokens')}</span>
          <span data-mobile-nav="cell-value">{showUsage ? formatTokens(usage.outputTokens) : '—'}</span>
        </div>
      </div>

      {transient.length > 0 && (
        <dl data-mobile-nav="status-list">
          {transient.map((row) => (
            <div key={row.label}>
              <dt>{row.label}</dt>
              <dd>{row.value}</dd>
            </div>
          ))}
        </dl>
      )}

      {lastAgentError !== null && (
        <div data-mobile-nav="status-error">{lastAgentError}</div>
      )}

      <JobsSection useSessions={useSessions} sessionId={sessionId} t={t} />
    </div>
  )
}
