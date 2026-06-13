import { useState, useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import { Toaster, toast } from 'sonner'

const CONTRACT = '0x985A164A4AA18cd5AdC1cCd9e0CFfa31625dE21f'

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
  'Sentence length distribution is near-identical',
  'Both reuse the phrase "to be fair" as a hedge',
  'Comma-splice frequency aligns within 4%',
  'Cross-references the same niche sources',
]

function confColor(c: Confidence) {
  if (c === 'high') return '#EC4899'
  if (c === 'medium') return '#a855f7'
  return '#3B82F6'
}

function Section({ children, className = '', id }: { children: React.ReactNode; className?: string; id?: string }) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-80px' })
  return (
    <motion.section
      ref={ref}
      id={id}
      initial={{ opacity: 0, y: 40 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.7, ease: 'easeOut' }}
      className={className}
    >
      {children}
    </motion.section>
  )
}

const STEPS = [
  { n: '01', t: 'Submit', d: 'Provide two public account URLs and an optional hint. No real names, ever.' },
  { n: '02', t: 'Render', d: 'Validators fetch both profiles and extract only the writing — never identity data.' },
  { n: '03', t: 'Compare', d: 'Stylometric signals — cadence, lexicon, punctuation — are matched across both.' },
  { n: '04', t: 'Prove', d: 'A same-person confidence score is written on-chain. The person stays anonymous.' },
]

const FEATURES = [
  { icon: '🪞', t: 'Stylometric Match', d: 'Compares cadence, lexicon, and punctuation fingerprints — not photos or names.' },
  { icon: '🛡️', t: 'Zero Doxxing', d: 'Outputs a confidence score and signals only. Never the underlying identity.' },
  { icon: '🔀', t: 'Dual-Panel Review', d: 'Side-by-side account analysis so every signal is traceable.' },
  { icon: '⚖️', t: 'Validator Consensus', d: 'Multiple AI validators must agree before a verdict is finalized.' },
  { icon: '🔗', t: 'On-Chain Proof', d: 'Every verdict is immutable and auditable on GenLayer.' },
  { icon: '🎯', t: 'Calibrated Confidence', d: 'High / medium / low confidence, with the matched signals shown.' },
]

const ACCOUNTS = {
  a: { handle: '@nightbuilder', platform: 'Mirror', meta: '142 posts • joined 2022' },
  b: { handle: '@0xdusk', platform: 'Farcaster', meta: '2.1k casts • joined 2023' },
}

function AccountPanel({
  side,
  handle,
  setHandle,
  accent,
}: {
  side: string
  handle: string
  setHandle: (v: string) => void
  accent: string
}) {
  return (
    <div className="flex-1 rounded-2xl border border-white/10 bg-white/[0.03] p-5">
      <div className="flex items-center justify-between">
        <span className="text-[10px] uppercase tracking-widest text-white/40">Account {side}</span>
        <span className="h-2 w-2 rounded-full" style={{ backgroundColor: accent }} />
      </div>
      <input
        value={handle}
        onChange={(e) => setHandle(e.target.value)}
        placeholder={`https://… profile ${side}`}
        className="mt-3 w-full rounded-xl border border-white/10 bg-[#0A0E1A] px-3 py-2.5 text-sm text-white placeholder-white/25 outline-none focus:border-white/30 transition"
      />
      <div className="mt-4 space-y-2">
        {[100, 75, 88, 60].map((w, i) => (
          <div key={i} className="h-2 rounded-full bg-white/5 overflow-hidden">
            <div className="h-full rounded-full opacity-40" style={{ width: `${w}%`, backgroundColor: accent }} />
          </div>
        ))}
      </div>
      <p className="mt-3 text-[11px] text-white/35">writing-style fingerprint (extracted, anonymized)</p>
    </div>
  )
}

function App() {
  const [urlA, setUrlA] = useState('')
  const [urlB, setUrlB] = useState('')
  const [hint, setHint] = useState('')
  const [analyzing, setAnalyzing] = useState(false)
  const [result, setResult] = useState<Verdict | null>(null)

  function runAnalysis(e: React.FormEvent) {
    e.preventDefault()
    if (!urlA.trim() || !urlB.trim()) {
      toast.error('Both account URLs are required.')
      return
    }
    setAnalyzing(true)
    setResult(null)
    toast('🪞 Extracting writing styles from both accounts…')
    setTimeout(() => {
      const match = Math.floor(40 + Math.random() * 60)
      const confidence: Confidence = match > 80 ? 'high' : match > 60 ? 'medium' : 'low'
      const same = match > 62
      const signals = [...SIGNAL_POOL].sort(() => Math.random() - 0.5).slice(0, 3)
      const verdict: Verdict = { same_person: same, confidence, match, signals }
      setResult(verdict)
      setAnalyzing(false)
      toast.success(
        same
          ? `Likely same person — ${confidence} confidence (${match}%)`
          : `Likely different people — ${confidence} confidence (${match}%)`,
      )
    }, 3000)
  }

  return (
    <div className="min-h-screen bg-[#0A0E1A] text-slate-100 antialiased relative overflow-hidden">
      <Toaster theme="dark" position="top-right" richColors />

      {/* gradient glows */}
      <div className="pointer-events-none fixed -top-40 -left-32 h-[520px] w-[520px] rounded-full bg-pink-500/20 blur-[120px]" />
      <div className="pointer-events-none fixed -top-20 -right-32 h-[520px] w-[520px] rounded-full bg-blue-500/20 blur-[120px]" />

      {/* NAVBAR */}
      <nav className="relative z-10 flex items-center justify-between px-6 py-4 border-b border-white/5 backdrop-blur-sm">
        <div className="flex items-center gap-2.5">
          <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-pink-500 to-blue-500 flex items-center justify-center font-bold">
            ID
          </div>
          <div>
            <h1 className="font-bold tracking-tight leading-none">PersonaVerify</h1>
            <p className="text-[10px] text-white/40 uppercase tracking-widest">style → identity link</p>
          </div>
        </div>
        <div className="hidden sm:flex items-center gap-6 text-sm text-white/60">
          <a href="#how" className="hover:text-white transition">How it works</a>
          <a href="#features" className="hover:text-white transition">Features</a>
          <a href="#verify" className="hover:text-white transition">Verify</a>
        </div>
        <a
          href="#verify"
          className="rounded-lg bg-gradient-to-r from-pink-500 to-blue-500 px-4 py-2 text-sm font-semibold text-white hover:opacity-90 transition"
        >
          Run a check
        </a>
      </nav>

      {/* HERO */}
      <header className="relative z-10 mx-auto max-w-5xl px-6 pt-20 pb-14 text-center">
        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
          <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-xs text-white/70">
            <span className="h-2 w-2 rounded-full bg-gradient-to-r from-pink-500 to-blue-500" />
            Live on GenLayer Bradbury
          </span>
          <h2 className="mt-6 text-5xl sm:text-6xl font-extrabold tracking-tight leading-tight">
            Same person?
            <br />
            <span className="bg-gradient-to-r from-pink-500 to-blue-500 bg-clip-text text-transparent">
              Prove it without doxxing.
            </span>
          </h2>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-white/60">
            PersonaVerify links two accounts to one author through writing-style analysis — cadence, lexicon,
            punctuation. You get a <span className="text-pink-400">confidence score</span>, never an{' '}
            <span className="text-blue-400">identity</span>.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <a
              href="#verify"
              className="rounded-xl bg-gradient-to-r from-pink-500 to-blue-500 px-7 py-3.5 font-bold text-white shadow-lg shadow-pink-500/20 hover:scale-[1.03] transition"
            >
              Link two accounts →
            </a>
            <a
              href="#how"
              className="rounded-xl border border-white/15 px-7 py-3.5 font-semibold text-white/80 hover:bg-white/5 transition"
            >
              How it works
            </a>
          </div>
          <p className="mt-6 font-mono text-[11px] text-white/30 break-all">contract {CONTRACT}</p>
        </motion.div>
      </header>

      {/* DUAL-PANEL PREVIEW */}
      <Section className="relative z-10 mx-auto max-w-5xl px-6 pb-8">
        <div className="rounded-3xl border border-white/10 bg-white/[0.02] p-6">
          <div className="flex flex-col items-stretch gap-4 sm:flex-row">
            <div className="flex-1 rounded-2xl border border-pink-500/20 bg-pink-500/[0.04] p-5">
              <p className="text-[10px] uppercase tracking-widest text-pink-400/70">Account A</p>
              <p className="mt-1 font-semibold">{ACCOUNTS.a.handle}</p>
              <p className="text-xs text-white/40">{ACCOUNTS.a.platform} • {ACCOUNTS.a.meta}</p>
            </div>
            <div className="flex items-center justify-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-pink-500 to-blue-500 text-sm font-bold shadow-lg shadow-blue-500/30">
                87%
              </div>
            </div>
            <div className="flex-1 rounded-2xl border border-blue-500/20 bg-blue-500/[0.04] p-5 text-right">
              <p className="text-[10px] uppercase tracking-widest text-blue-400/70">Account B</p>
              <p className="mt-1 font-semibold">{ACCOUNTS.b.handle}</p>
              <p className="text-xs text-white/40">{ACCOUNTS.b.platform} • {ACCOUNTS.b.meta}</p>
            </div>
          </div>
          <p className="mt-4 text-center text-xs text-white/40">
            Sample verdict: <span className="text-pink-300">likely same author</span> · high confidence · identity never revealed
          </p>
        </div>
      </Section>

      {/* HOW IT WORKS */}
      <Section id="how" className="relative z-10 mx-auto max-w-6xl px-6 py-20 scroll-mt-20">
        <h2 className="text-center text-3xl font-bold">How it works</h2>
        <p className="mt-3 text-center text-white/50">Four steps from two handles to a private proof.</p>
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((s) => (
            <div key={s.n} className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
              <span className="font-mono text-3xl font-bold bg-gradient-to-r from-pink-500 to-blue-500 bg-clip-text text-transparent">
                {s.n}
              </span>
              <h3 className="mt-3 font-semibold">{s.t}</h3>
              <p className="mt-2 text-sm text-white/55 leading-relaxed">{s.d}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* FEATURES */}
      <Section id="features" className="relative z-10 mx-auto max-w-6xl px-6 py-12 scroll-mt-20">
        <h2 className="text-center text-3xl font-bold">Privacy-preserving by design</h2>
        <p className="mt-3 text-center text-white/50">Linkage without exposure.</p>
        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => (
            <div
              key={f.t}
              className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 hover:bg-white/[0.06] hover:border-white/20 transition"
            >
              <div className="text-3xl">{f.icon}</div>
              <h3 className="mt-4 font-semibold">{f.t}</h3>
              <p className="mt-2 text-sm text-white/55 leading-relaxed">{f.d}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* DEMO — dual panel form */}
      <Section id="verify" className="relative z-10 mx-auto max-w-3xl px-6 py-20 scroll-mt-20">
        <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-8 backdrop-blur-sm">
          <h2 className="text-2xl font-bold">Link two accounts</h2>
          <p className="mt-2 text-sm text-white/55">
            Paste two public profile URLs. Validators compare writing style and return a confidence score —
            no identity is ever revealed. (Demo: simulated verdict.)
          </p>
          <form onSubmit={runAnalysis} className="mt-6">
            <div className="flex flex-col gap-4 sm:flex-row">
              <AccountPanel side="A" handle={urlA} setHandle={setUrlA} accent="#EC4899" />
              <AccountPanel side="B" handle={urlB} setHandle={setUrlB} accent="#3B82F6" />
            </div>
            <input
              value={hint}
              onChange={(e) => setHint(e.target.value)}
              placeholder="Optional hint (e.g. both post about MEV)"
              className="mt-4 w-full rounded-xl border border-white/10 bg-[#0A0E1A] px-4 py-3 text-sm text-white placeholder-white/25 outline-none focus:border-white/30 transition"
            />
            <button
              type="submit"
              disabled={analyzing}
              className="mt-4 w-full rounded-xl bg-gradient-to-r from-pink-500 to-blue-500 py-3.5 font-bold text-white shadow-lg shadow-pink-500/20 hover:scale-[1.01] transition disabled:opacity-60 disabled:hover:scale-100"
            >
              {analyzing ? 'Analyzing writing styles…' : '🪞 Run style match'}
            </button>
          </form>

          {analyzing && (
            <div className="mt-6 rounded-xl border border-white/10 bg-[#0A0E1A] p-5">
              <div className="flex items-center gap-3 text-sm text-white/70">
                <span className="h-3 w-3 animate-spin rounded-full border-2 border-pink-400 border-t-transparent" />
                Rendering profiles, extracting stylometric fingerprints, polling validators…
              </div>
              <div className="mt-3 h-1 w-full overflow-hidden rounded-full bg-white/10">
                <motion.div
                  className="h-full bg-gradient-to-r from-pink-500 to-blue-500"
                  initial={{ width: '0%' }}
                  animate={{ width: '100%' }}
                  transition={{ duration: 3, ease: 'linear' }}
                />
              </div>
            </div>
          )}

          {result && (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-6 rounded-xl border border-white/10 bg-[#0A0E1A] p-6"
            >
              <div className="flex items-center gap-5">
                <div
                  className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full text-lg font-bold"
                  style={{
                    background: `conic-gradient(${confColor(result.confidence)} ${result.match * 3.6}deg, rgba(255,255,255,0.08) 0deg)`,
                  }}
                >
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#0A0E1A]">
                    {result.match}%
                  </div>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-widest text-white/40">verdict</p>
                  <p className="mt-1 text-lg font-bold" style={{ color: confColor(result.confidence) }}>
                    {result.same_person ? 'Likely the same person' : 'Likely different people'}
                  </p>
                  <p className="text-sm text-white/50">{result.confidence} confidence · identity not revealed</p>
                </div>
              </div>
              <div className="mt-5">
                <p className="text-xs uppercase tracking-widest text-white/40">matched signals</p>
                <ul className="mt-2 space-y-1.5">
                  {result.signals.map((s) => (
                    <li key={s} className="flex items-start gap-2 text-sm text-white/70">
                      <span className="mt-0.5 text-pink-400">▹</span>
                      {s}
                    </li>
                  ))}
                </ul>
              </div>
            </motion.div>
          )}
        </div>
      </Section>

      {/* FOOTER */}
      <footer className="relative z-10 border-t border-white/5 px-6 py-10">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 sm:flex-row">
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded bg-gradient-to-br from-pink-500 to-blue-500 text-[10px] font-bold">
              ID
            </span>
            <span className="font-semibold">PersonaVerify</span>
            <span className="text-white/30 text-sm">— writing-style identity link</span>
          </div>
          <p className="font-mono text-[11px] text-white/30 break-all">{CONTRACT}</p>
          <p className="text-xs text-white/30">Built on GenLayer</p>
        </div>
      </footer>
    </div>
  )
}

export default App
