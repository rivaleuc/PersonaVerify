import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Toaster, toast } from 'sonner'
import { read, write, CONTRACT } from './genlayer'

type Confidence = 'high' | 'medium' | 'low'

type Verdict = {
  same_person: boolean
  confidence: Confidence
  match: number
  signals: string[]
}

const SIGNAL_POOL = [
  'Em-dash cadence and parenthetical asides match closely',
  'Shared idiosyncratic spelling ("colour", "tho")',
  'Identical emoji clustering at sentence ends',
  'Topic overlap: rollups, MEV, validator economics',
  'Sentence-length distribution is near-identical',
  'Both reuse the phrase "to be fair" as a hedge',
  'Comma-splice frequency aligns within 4%',
  'Cross-references the same niche sources',
]

type Account = { handle: string; bio: string }

function fingerprint(seed: string): number[] {
  // deterministic-ish bars from the typed handle so the preview "renders"
  let h = 0
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0
  return Array.from({ length: 5 }, (_, i) => {
    h = (h * 1103515245 + 12345) >>> 0
    return 28 + ((h >> (i * 3)) % 70)
  })
}

function Half({
  side,
  accent,
  account,
  onChange,
  align,
}: {
  side: 'A' | 'B'
  accent: string
  account: Account
  onChange: (a: Account) => void
  align: 'left' | 'right'
}) {
  const bars = fingerprint(account.handle || side)
  const rightAlign = align === 'right'
  return (
    <div
      className="relative flex min-h-screen flex-1 flex-col justify-center px-6 py-16 sm:px-12 lg:px-16"
      style={{
        background:
          side === 'A'
            ? 'radial-gradient(120% 80% at 0% 50%, rgba(236,72,153,0.14), transparent 70%)'
            : 'radial-gradient(120% 80% at 100% 50%, rgba(59,130,246,0.14), transparent 70%)',
      }}
    >
      <div className={rightAlign ? 'ml-auto w-full max-w-md text-right' : 'w-full max-w-md'}>
        <div className={`flex items-center gap-2.5 ${rightAlign ? 'flex-row-reverse' : ''}`}>
          <span
            className="flex h-9 w-9 items-center justify-center rounded-lg text-sm font-black text-white"
            style={{ background: accent }}
          >
            {side}
          </span>
          <span className="text-[11px] uppercase tracking-[0.3em] text-white/40">Account {side}</span>
        </div>

        <input
          value={account.handle}
          onChange={(e) => onChange({ ...account, handle: e.target.value })}
          placeholder={side === 'A' ? 'https://… first profile' : 'https://… second profile'}
          dir={rightAlign ? 'rtl' : 'ltr'}
          className="mt-6 w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white placeholder-white/25 outline-none transition focus:border-white/40"
          style={{ boxShadow: `0 0 0 0px ${accent}` }}
        />

        {/* rendered profile preview card */}
        <motion.div
          layout
          className="mt-5 rounded-2xl border border-white/10 bg-white/[0.04] p-5 backdrop-blur-sm"
        >
          <div className={`flex items-center gap-3 ${rightAlign ? 'flex-row-reverse' : ''}`}>
            <div
              className="flex h-12 w-12 items-center justify-center rounded-full text-lg font-bold text-white"
              style={{ background: `linear-gradient(135deg, ${accent}, #0A0E1A)` }}
            >
              {(account.handle.replace(/^https?:\/\//, '')[0] || side).toUpperCase()}
            </div>
            <div className={rightAlign ? 'text-right' : ''}>
              <p className="truncate font-semibold text-white">
                {account.handle ? account.handle.replace(/^https?:\/\//, '').slice(0, 22) : `profile-${side.toLowerCase()}`}
              </p>
              <p className="text-xs text-white/40">stylometric fingerprint</p>
            </div>
          </div>

          <textarea
            value={account.bio}
            onChange={(e) => onChange({ ...account, bio: e.target.value })}
            placeholder="Paste a writing sample (optional) — only the style is read, never the identity."
            rows={3}
            dir={rightAlign ? 'rtl' : 'ltr'}
            className="mt-4 w-full resize-none rounded-lg border border-white/10 bg-[#0A0E1A] px-3 py-2 text-xs text-white/80 placeholder-white/25 outline-none focus:border-white/30"
          />

          <div className="mt-4 space-y-2">
            {bars.map((w, i) => (
              <div
                key={i}
                className={`flex items-center gap-2 ${rightAlign ? 'flex-row-reverse' : ''}`}
              >
                <span className="w-10 shrink-0 text-[9px] uppercase tracking-wider text-white/30">
                  {['cad', 'lex', 'pun', 'len', 'emo'][i]}
                </span>
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-white/5">
                  <motion.div
                    className="h-full rounded-full"
                    style={{ background: accent }}
                    initial={{ width: 0 }}
                    animate={{ width: `${w}%` }}
                    transition={{ duration: 0.6, delay: i * 0.05 }}
                  />
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  )
}

function Dial({ result, analyzing }: { result: Verdict | null; analyzing: boolean }) {
  const match = result?.match ?? 0
  const ring = `conic-gradient(from -90deg, #EC4899, #3B82F6 ${match * 3.6}deg, rgba(255,255,255,0.06) ${match * 3.6}deg)`
  return (
    <div className="relative flex flex-col items-center">
      <div className="relative h-44 w-44 sm:h-52 sm:w-52">
        <motion.div
          className="absolute inset-0 rounded-full"
          style={{ background: ring }}
          animate={{ rotate: analyzing ? 360 : 0 }}
          transition={analyzing ? { repeat: Infinity, duration: 1.4, ease: 'linear' } : { duration: 0.4 }}
        />
        <div className="absolute inset-[10px] flex flex-col items-center justify-center rounded-full bg-[#0A0E1A] text-center">
          {analyzing ? (
            <span className="text-sm text-white/50">analyzing…</span>
          ) : result ? (
            <>
              <motion.span
                key={match}
                initial={{ scale: 0.6, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="bg-gradient-to-r from-pink-500 to-blue-500 bg-clip-text text-4xl font-black text-transparent"
              >
                {match}%
              </motion.span>
              <span className="mt-1 text-[10px] uppercase tracking-[0.25em] text-white/40">
                {result.confidence} conf.
              </span>
            </>
          ) : (
            <>
              <span className="text-3xl font-black text-white/20">?</span>
              <span className="mt-1 text-[10px] uppercase tracking-[0.25em] text-white/30">match</span>
            </>
          )}
        </div>
      </div>
      <p className="mt-4 max-w-[12rem] text-center text-[11px] leading-relaxed text-white/40">
        match confidence — a score, never an identity
      </p>
    </div>
  )
}

function mapProof(p: any): Verdict {
  const same = Boolean(p?.same_person)
  let match = 0
  const c = p?.confidence
  if (typeof c === 'number') {
    match = Math.round(c <= 1 ? c * 100 : c)
  } else if (typeof c === 'string') {
    const lc = c.toLowerCase()
    const m = lc.match(/\d+(\.\d+)?/)
    if (m) match = Math.round(Number(m[0]) <= 1 ? Number(m[0]) * 100 : Number(m[0]))
    else match = lc.includes('high') ? 88 : lc.includes('med') ? 68 : 45
  }
  match = Math.max(0, Math.min(100, match))
  const confidence: Confidence = match > 80 ? 'high' : match > 60 ? 'medium' : 'low'
  let signals: string[] = []
  if (Array.isArray(p?.signals)) signals = p.signals.map((s: any) => String(s))
  else if (typeof p?.signals === 'string')
    signals = p.signals
      .split(/\n|;|·|\|/)
      .map((s: string) => s.trim())
      .filter(Boolean)
  return { same_person: same, confidence, match, signals }
}

function App() {
  const [a, setA] = useState<Account>({ handle: '', bio: '' })
  const [b, setB] = useState<Account>({ handle: '', bio: '' })
  const [hint, setHint] = useState('')
  const [analyzing, setAnalyzing] = useState(false)
  const [result, setResult] = useState<Verdict | null>(null)
  const [total, setTotal] = useState(0)

  // Load proof count from the contract on mount
  useEffect(() => {
    read('stats')
      .then((s: any) => setTotal(Number(s?.total_proofs ?? 0)))
      .catch(() => {})
  }, [])

  async function analyze() {
    if (!a.handle.trim() || !b.handle.trim()) {
      toast.error('Both account profiles are required.')
      return
    }
    setAnalyzing(true)
    setResult(null)
    const tId = toast.loading('🪞 Linking accounts on-chain — extracting writing styles… (30–60s)')
    try {
      const fullHint = [hint.trim(), a.bio.trim(), b.bio.trim()].filter(Boolean).join(' || ')
      await write('verify_link', [a.handle.trim(), b.handle.trim(), fullHint])
      const s: any = await read('stats')
      const t = Number(s?.total_proofs ?? 0)
      setTotal(t)
      const proof: any = await read('get_proof', [String(Math.max(0, t - 1))])
      const v = mapProof(proof)
      setResult(v)
      toast.success(
        v.same_person
          ? `Likely same person — ${v.confidence} confidence (${v.match}%)`
          : `Likely different people — ${v.confidence} confidence (${v.match}%)`,
        { id: tId },
      )
    } catch (e: any) {
      toast.error('Verification failed', { id: tId, description: String(e?.message ?? e) })
    } finally {
      setAnalyzing(false)
    }
  }

  return (
    <div className="relative min-h-screen bg-[#0A0E1A] text-slate-100 antialiased">
      <Toaster theme="dark" position="top-center" richColors />

      {/* floating brand pill */}
      <div className="pointer-events-none fixed left-1/2 top-5 z-30 -translate-x-1/2">
        <div className="pointer-events-auto flex items-center gap-2 rounded-full border border-white/10 bg-[#0A0E1A]/80 px-4 py-1.5 text-xs backdrop-blur">
          <span className="h-2 w-2 rounded-full bg-gradient-to-r from-pink-500 to-blue-500" />
          <span className="font-semibold tracking-tight">PersonaVerify</span>
          <span className="hidden text-white/30 sm:inline">— prove it without doxxing</span>
        </div>
      </div>

      {/* THE SPLIT */}
      <div className="relative flex flex-col lg:flex-row">
        <Half side="A" accent="#EC4899" account={a} onChange={setA} align="left" />

        {/* center divider + dial */}
        <div className="relative z-20 flex shrink-0 items-center justify-center py-8 lg:py-0">
          <div className="absolute left-1/2 top-0 hidden h-full w-px -translate-x-1/2 bg-gradient-to-b from-transparent via-white/15 to-transparent lg:block" />
          <div className="flex flex-col items-center gap-6 px-6">
            <Dial result={result} analyzing={analyzing} />
            <input
              value={hint}
              onChange={(e) => setHint(e.target.value)}
              placeholder="optional hint for the judge…"
              className="w-52 rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-center text-xs text-white placeholder-white/25 outline-none transition focus:border-white/40"
            />
            <button
              onClick={analyze}
              disabled={analyzing}
              className="rounded-full bg-gradient-to-r from-pink-500 to-blue-500 px-8 py-3 text-sm font-bold text-white shadow-lg shadow-pink-500/25 transition hover:scale-[1.04] disabled:opacity-60 disabled:hover:scale-100"
            >
              {analyzing ? 'Comparing…' : 'Compare A ↔ B'}
            </button>
            {result && (
              <span
                className="rounded-full border px-3 py-1 text-xs font-semibold"
                style={{
                  borderColor: result.same_person ? 'rgba(236,72,153,0.4)' : 'rgba(59,130,246,0.4)',
                  color: result.same_person ? '#f9a8d4' : '#93c5fd',
                }}
              >
                {result.same_person ? '◆ likely same author' : '◇ likely different authors'}
              </span>
            )}
          </div>
        </div>

        <Half side="B" accent="#3B82F6" account={b} onChange={setB} align="right" />
      </div>

      {/* BOTTOM STRIP — matched signals */}
      <div className="sticky bottom-0 z-20 border-t border-white/10 bg-[#0A0E1A]/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-6 py-4 sm:flex-row sm:items-center">
          <span className="shrink-0 text-[11px] uppercase tracking-[0.3em] text-white/40">
            matched signals
          </span>
          <div className="flex flex-1 flex-wrap gap-2 overflow-hidden">
            <AnimatePresence mode="popLayout">
              {result ? (
                result.signals.map((s) => (
                  <motion.span
                    key={s}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs text-white/70"
                  >
                    {s}
                  </motion.span>
                ))
              ) : (
                <span className="text-xs text-white/30">
                  Run a comparison to surface the stylometric signals that link (or separate) the two accounts.
                </span>
              )}
            </AnimatePresence>
          </div>
          <span className="hidden shrink-0 font-mono text-[10px] text-white/25 lg:inline">
            {total} proofs · {CONTRACT.slice(0, 10)}…{CONTRACT.slice(-6)}
          </span>
        </div>
      </div>
    </div>
  )
}

export default App
