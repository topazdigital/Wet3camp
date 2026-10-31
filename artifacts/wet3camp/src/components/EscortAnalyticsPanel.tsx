import { useState } from 'react'
import { AlertCircle, BarChart3, CalendarDays, MessageCircle, Phone, RefreshCw, Send, Share2, Smartphone, Eye } from 'lucide-react'
import { getGetEscortProfileAnalyticsQueryKey, useGetEscortProfileAnalytics } from '@workspace/api-client-react'

type Range = '7d' | '30d' | '90d'

const ranges: { value: Range; label: string }[] = [
  { value: '7d', label: '7 days' },
  { value: '30d', label: '30 days' },
  { value: '90d', label: '90 days' },
]

const number = (value: number) => Number(value || 0).toLocaleString()

function Metric({ label, value, icon: Icon, accent, testId }: {
  label: string
  value: number
  icon: typeof Eye
  accent: string
  testId: string
}) {
  return (
    <div className="rounded-xl border border-color bg-dark-bg/70 p-3 sm:p-4" data-testid={testId}>
      <div className="mb-2 flex items-center gap-2">
        <Icon size={14} style={{ color: accent }} />
        <span className="text-[10px] font-semibold uppercase tracking-wider text-text-muted">{label}</span>
      </div>
      <p className="text-xl font-black tabular-nums text-text-light" data-testid={`${testId}-value`}>{number(value)}</p>
    </div>
  )
}

function Breakdown({ title, rows, testId, note }: {
  title: string
  rows: { name: string; views: number }[]
  testId: string
  note?: string
}) {
  const max = Math.max(...rows.map(row => row.views), 1)
  return (
    <section className="rounded-2xl border border-color bg-card-bg p-4 sm:p-5">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-bold text-text-light">{title}</h3>
          {note && <p className="mt-1 text-[10px] leading-relaxed text-text-muted">{note}</p>}
        </div>
        <BarChart3 size={15} className="mt-0.5 shrink-0 text-[#FFD700]" />
      </div>
      {rows.length === 0 ? (
        <p className="rounded-xl border border-dashed border-color px-3 py-5 text-center text-xs text-text-muted">No breakdown data for this period.</p>
      ) : (
        <div className="space-y-3">
          {rows.map((row, index) => (
            <div key={`${row.name}-${index}`} data-testid={`${testId}-row-${index}`}>
              <div className="mb-1 flex items-center justify-between gap-3 text-xs">
                <span className="truncate text-text-light">{row.name || 'Unknown'}</span>
                <span className="shrink-0 font-semibold tabular-nums text-text-muted">{number(row.views)}</span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-dark-bg">
                <div className="h-full rounded-full bg-[#D4A72C]" style={{ width: `${Math.max(row.views > 0 ? 3 : 0, (row.views / max) * 100)}%` }} />
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}

export default function EscortAnalyticsPanel() {
  const [range, setRange] = useState<Range>('30d')
  const params = { range }
  const { data, isLoading, isError, refetch, isFetching } = useGetEscortProfileAnalytics(params, {
    query: { queryKey: getGetEscortProfileAnalyticsQueryKey(params) },
  })

  const allTotals = data?.totals
  const isEmpty = !!allTotals && Object.values(allTotals).every(value => Number(value) === 0)
  const chartRows = data?.daily ?? []
  const maxViews = Math.max(...chartRows.map(row => row.views), 1)
  const hasAnyViews = chartRows.some(row => row.views > 0)

  return (
    <div className="mx-auto max-w-6xl space-y-4" data-testid="panel-profile-analytics">
      <header className="flex flex-col gap-4 rounded-2xl border border-[#8B0000]/30 bg-gradient-to-br from-[#321719] via-card-bg to-card-bg p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
        <div>
          <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.2em] text-[#D4A72C]">Private profile insights</p>
          <h2 className="text-lg font-black text-text-light sm:text-xl">Understand what brings people to you.</h2>
          <p className="mt-1 max-w-xl text-xs leading-relaxed text-text-muted">A clear view of profile visits, contact button taps, and discovery context.</p>
        </div>
        <div className="flex shrink-0 rounded-xl border border-color bg-dark-bg p-1" role="group" aria-label="Analytics date range">
          {ranges.map(option => (
            <button
              key={option.value}
              type="button"
              onClick={() => setRange(option.value)}
              aria-pressed={range === option.value}
              data-testid={`button-analytics-range-${option.value}`}
              className={`rounded-lg px-3 py-2 text-[11px] font-semibold transition-colors ${range === option.value ? 'bg-[#8B0000] text-white' : 'text-text-muted hover:text-text-light'}`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </header>

      {isLoading ? (
        <div className="space-y-4" aria-label="Loading analytics" data-testid="status-analytics-loading">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {Array.from({ length: 5 }, (_, index) => <div key={index} className="h-20 animate-pulse rounded-xl border border-color bg-card-bg" />)}
          </div>
          <div className="h-56 animate-pulse rounded-2xl border border-color bg-card-bg" />
          <div className="grid gap-4 md:grid-cols-2"><div className="h-44 animate-pulse rounded-2xl border border-color bg-card-bg" /><div className="h-44 animate-pulse rounded-2xl border border-color bg-card-bg" /></div>
        </div>
      ) : isError || !data ? (
        <div className="rounded-2xl border border-[#D98272]/30 bg-[#321719]/50 p-5 sm:p-7" data-testid="status-analytics-error">
          <div className="flex items-start gap-3">
            <AlertCircle size={19} className="mt-0.5 shrink-0 text-[#D98272]" />
            <div className="flex-1">
              <h3 className="text-sm font-bold text-text-light">Analytics could not be loaded</h3>
              <p className="mt-1 text-xs leading-relaxed text-text-muted">Your profile is unchanged. Check your connection and try again.</p>
              <button type="button" onClick={() => refetch()} disabled={isFetching} data-testid="button-analytics-retry" className="mt-4 inline-flex items-center gap-2 rounded-lg border border-[#D98272]/40 px-3 py-2 text-xs font-semibold text-text-light hover:bg-[#D98272]/10 disabled:opacity-60">
                <RefreshCw size={13} className={isFetching ? 'animate-spin' : ''} /> Try again
              </button>
            </div>
          </div>
        </div>
      ) : (
        <>
          {isEmpty && (
            <div className="flex items-start gap-3 rounded-xl border border-[#D4A72C]/25 bg-[#D4A72C]/[0.06] p-4" data-testid="status-analytics-empty">
              <CalendarDays size={16} className="mt-0.5 shrink-0 text-[#D4A72C]" />
              <div>
                <p className="text-xs font-bold text-text-light">No recorded activity in this period</p>
                <p className="mt-1 text-[11px] leading-relaxed text-text-muted">There are no visits or contact actions to show yet. This panel will update when real activity is recorded.</p>
              </div>
            </div>
          )}
          <section className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-5" aria-label="Profile activity totals">
            <Metric label="Profile views" value={data.totals.views} icon={Eye} accent="#D4A72C" testId="metric-analytics-views" />
            <Metric label="WhatsApp taps" value={data.totals.whatsappClicks} icon={MessageCircle} accent="#78B88A" testId="metric-analytics-whatsapp" />
            <Metric label="Telegram taps" value={data.totals.telegramClicks} icon={Send} accent="#7BB8D4" testId="metric-analytics-telegram" />
            <Metric label="Call taps" value={data.totals.callClicks} icon={Phone} accent="#D98272" testId="metric-analytics-calls" />
            <Metric label="SMS taps" value={data.totals.smsClicks} icon={Smartphone} accent="#C49AD1" testId="metric-analytics-sms" />
          </section>

          <section className="grid gap-4 lg:grid-cols-[1.55fr_1fr]">
            <div className="rounded-2xl border border-color bg-card-bg p-4 sm:p-5" data-testid="chart-daily-profile-views">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-bold text-text-light">Profile views over time</h3>
                  <p className="mt-1 text-[10px] text-text-muted">Daily anonymous sessions · last {range.replace('d', ' days')}</p>
                </div>
                <span className="rounded-lg bg-[#D4A72C]/10 px-2.5 py-1.5 text-xs font-bold tabular-nums text-[#D4A72C]">{number(data.totals.views)} total</span>
              </div>
              {hasAnyViews ? (
                <div className="flex h-36 items-end gap-1.5 border-b border-color pb-2 sm:h-44 sm:gap-2">
                  {chartRows.map((row, index) => {
                    const height = Math.max(row.views > 0 ? 5 : 0, row.views / maxViews * 100)
                    const date = new Date(`${row.date}T00:00:00`)
                    const label = Number.isNaN(date.getTime()) ? row.date : date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
                    const showLabel = chartRows.length <= 10 || index % Math.ceil(chartRows.length / 8) === 0 || index === chartRows.length - 1
                    return (
                      <div key={`${row.date}-${index}`} className="group flex h-full min-w-0 flex-1 flex-col justify-end" title={`${label}: ${number(row.views)} views`} data-testid={`bar-daily-views-${index}`}>
                        <div className="w-full rounded-t-sm bg-[#8B0000] transition-colors group-hover:bg-[#D4A72C]" style={{ height: `${height}%`, minHeight: row.views > 0 ? 3 : 0 }} />
                        <span className="mt-2 h-3 overflow-hidden text-center text-[8px] text-text-muted">{showLabel ? label : ''}</span>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="flex h-36 items-center justify-center rounded-xl border border-dashed border-color text-center text-xs text-text-muted sm:h-44" data-testid="empty-daily-views">No profile views recorded in this period.</div>
              )}
              <div className="mt-3 flex items-center gap-2 text-[10px] text-text-muted"><span className="h-2 w-2 rounded-sm bg-[#8B0000]" /> Views</div>
            </div>

            <section className="rounded-2xl border border-color bg-card-bg p-4 sm:p-5" data-testid="section-more-actions">
              <h3 className="text-sm font-bold text-text-light">Other recorded actions</h3>
              <p className="mt-1 text-[10px] text-text-muted">Button taps and booking rows in this period</p>
              <div className="mt-4 divide-y divide-color/60">
                {[
                  { name: 'Share taps', value: data.totals.shareClicks, icon: Share2, id: 'share' },
                  { name: 'Platform messages', value: data.totals.platformMessageClicks, icon: MessageCircle, id: 'messages' },
                  { name: 'Booking requests', value: data.totals.bookingRequests, icon: CalendarDays, id: 'bookings' },
                ].map(item => {
                  const Icon = item.icon
                  return <div key={item.id} className="flex items-center justify-between py-3 first:pt-0 last:pb-0" data-testid={`metric-analytics-${item.id}`}>
                    <span className="flex items-center gap-2 text-xs text-text-muted"><Icon size={14} className="text-[#D4A72C]" />{item.name}</span>
                    <span className="text-sm font-bold tabular-nums text-text-light" data-testid={`metric-analytics-${item.id}-value`}>{number(item.value)}</span>
                  </div>
                })}
              </div>
            </section>
          </section>

          <section className="grid gap-4 md:grid-cols-2">
            <Breakdown title="How people found you" rows={data.sources} testId="analytics-source" note="Source recorded when a visit was attributed." />
            <Breakdown title="Search-city context" rows={data.cities} testId="analytics-city" note="These are search-city values, not a visitor’s exact location." />
          </section>

          <aside className="rounded-xl border border-color bg-card-bg/70 p-4" data-testid="note-analytics-methodology">
            <h3 className="text-[11px] font-bold uppercase tracking-wider text-text-light">How to read these numbers</h3>
            <ul className="mt-2 grid gap-x-6 gap-y-1.5 text-[10px] leading-relaxed text-text-muted sm:grid-cols-2">
              <li>Views are anonymous sessions deduplicated for 30 minutes.</li>
              <li>Contact values are button taps, not confirmed conversations or calls.</li>
              <li>Booking requests come from recorded booking rows.</li>
              <li>Tracking starts after a profile is claimed; earlier visits are not included.</li>
              <li>City values show search-city context, never a visitor’s exact location.</li>
            </ul>
            <p className="mt-3 border-t border-color pt-2 text-[10px] text-text-muted">These insights describe recorded activity only; they do not guarantee traffic or search ranking.</p>
          </aside>
        </>
      )}
    </div>
  )
}
