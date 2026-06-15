# PersonaVerify

**Prove two online accounts belong to the same person — without revealing who that person is.**

PersonaVerify links two public profiles by analysing writing style, recurring topics, and cross-references, then issues a signed on-chain verdict of "same person" or not. The judgment is produced by GenLayer validators that crawl both pages and reason about them, and crucially it never outputs an identity — only a confidence-rated link. The result is reached by consensus, so no single node decides whether the link is real.

- **Contract (Bradbury, chain 4221):** `0x985A164A4AA18cd5AdC1cCd9e0CFfa31625dE21f`
- **Explorer:** https://explorer-bradbury.genlayer.com/contract/0x985A164A4AA18cd5AdC1cCd9e0CFfa31625dE21f
- **Live app:** https://personaverify.pages.dev

## What it does

The `PersonaVerify` contract exposes one write path and two views:

1. **`verify_link(account_a_url, account_b_url, hint)`** — validates both URLs are present, then runs the non-deterministic analysis. The leader function crawls each profile with `gl.nondet.web.render(a_url, mode="text")` / `render(b_url, ...)` (each truncated to 3000 chars), then calls `gl.nondet.exec_prompt(prompt, response_format="json")` instructing the model to decide same-person **without revealing identity**, returning `{"same_person": bool, "confidence": "high"/"medium"/"low", "signals": "<what matched>"}`. Consensus runs through `gl.vm.run_nondet_unsafe(leader_fn, validator_fn)`; `validator_fn` accepts a `gl.vm.Return` only if `same_person` is a bool and `confidence` is one of the three allowed labels. The record (requester address, both URLs, verdict, confidence, signals) is stored in `proofs: TreeMap[str, str]` keyed by an incrementing `proof_count`, and the key is returned.
2. **`get_proof(key)`** — view returning the stored proof record (or `{"exists": False}`).
3. **`stats()`** — view returning `{"total_proofs": <int>}`.

## Why GenLayer

A deterministic VM cannot read two web pages and judge whether the same human wrote both — that is stylometric inference over unstructured text, not arithmetic. There is no oracle that returns "these accounts share an author."

GenLayer's Optimistic Democracy turns that subjective call into a consensus result: the leader proposes a verdict, independent validators each re-crawl both profiles and re-run the judgment, and the answer only finalises if it passes `validator_fn`. The "no-doxxing" guarantee is enforced in the prompt contract itself — the schema has no identity field, only a boolean link and a confidence label.

Use GenLayer when the truth lives in natural language across the live web and you need trustless agreement on an interpretive verdict. Use a backend when you'd be happy trusting one server's opinion.

## Architecture

| Contract (GenLayer) | Frontend | EVM / off-chain |
| --- | --- | --- |
| `prove/persona_verify.py` | `prove/app` (React + Vite) | none — both profile crawls run inside the contract |

## Tech

- **GenVM Python**, pinned to `py-genlayer:1jb45aa8…jpz09h6` via the `Depends` header. Proofs are JSON-encoded into a `TreeMap[str, str]` with a `u256` counter.
- **Frontend** reads with `genlayer-js` (`createClient({ chain: testnetBradbury })` → `readContract`) and writes via **MetaMask without the snap** — it calls `wallet_switchEthereumChain` / `wallet_addEthereumChain` to force Bradbury (chain `4221`, hex `0x107d`) and signs with `writeContract`, awaiting a `FINALIZED` receipt.
- **UI:** React 19 + Vite + Tailwind v4 with `framer-motion` and `sonner`. The app is a two-field verifier: paste two profile URLs plus an optional hint, submit, and read back the same-person verdict, confidence, and the matched signals.

## Project structure

```
PersonaVerify/
├── prove/
│   ├── persona_verify.py     ← GenLayer contract (PersonaVerify)
│   └── app/                  ← production frontend
│       ├── index.html
│       ├── package.json
│       ├── vite.config.ts
│       ├── tsconfig*.json
│       ├── public/           ← favicon.svg, icons.svg
│       └── src/
│           ├── App.tsx       ← UI
│           ├── genlayer.ts   ← client, wallet, read/write helpers
│           ├── main.tsx
│           └── index.css
└── README.md
```

## Develop

```bash
cd prove/app
npm install
npm run dev      # local dev server (Vite)
npm run build    # type-check + production build to dist/
```

## Deploy the frontend

Cloudflare Pages:

- **Root directory:** `prove/app`
- **Build command:** `npm run build`
- **Output directory:** `dist`
- **Environment:** `NODE_VERSION=20`

## Why GenLayer (engineering notes)

- **The privacy guarantee is the schema.** Because the prompt's JSON contract has no name/identity field, validators can only ratify `same_person` + `confidence` + `signals`. There is structurally no place for a doxx to land on-chain.
- **Both fetches fail open independently.** Each `gl.nondet.web.render` is in its own try/except with a `"(failed)"` fallback, so one dead profile still yields a (low-confidence) verdict instead of reverting.
- **`validator_fn` rejects sloppy leaders.** It only trusts a `gl.vm.Return`, re-parses `calldata`, and pins `confidence` to exactly `high`/`medium`/`low` — an off-enum label fails consensus rather than polluting storage.
- **TreeMap stores serialized JSON.** Every read is `json.loads`, every write is `json.dumps`; the contract never mutates storage in place.

## License

MIT
