# PersonaVerify

PersonaVerify is a decentralized identity linker on GenLayer. Prove that two accounts across different platforms belong to the same person without revealing your real identity. AI validators analyze writing style, topics, timing, and cross-references to determine with confidence whether the accounts share a human behind them.

## Why GenLayer

Determining if two accounts are the same person requires analyzing behavioral patterns across platforms — writing style, topic overlap, timing correlations, and subtle cross-references. No oracle provides this. No hash comparison works. This is forensic-level interpretation that requires fetching both profiles and reasoning about human behavioral signals. GenLayer validators do this independently and reach consensus.

## Deployed

**GenLayer (Bradbury):** `0x985A164A4AA18cd5AdC1cCd9e0CFfa31625dE21f`

## Test

Linked: github.com/vbuterin ↔ twitter.com/VitalikButerin → **same_person: true, confidence: high** 🔥

## Structure

```
PersonaVerify/
├── prove/
│   ├── persona_verify.py  ← GenLayer contract
│   └── index.html         ← Frontend
└── .gitignore
```
