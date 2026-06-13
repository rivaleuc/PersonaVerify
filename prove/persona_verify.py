# { "Depends": "py-genlayer:1jb45aa8ynh2a9c9xn3b7qqh8sm5q93hwfp7jqmwsfhh8jpz09h6" }
import json
from genlayer import *

class PersonaVerify(gl.Contract):
    proofs: TreeMap[str, str]
    proof_count: u256

    def __init__(self):
        self.proof_count = u256(0)

    @gl.public.write
    def verify_link(self, account_a_url: str, account_b_url: str, hint: str) -> str:
        a_url = str(account_a_url).strip(); b_url = str(account_b_url).strip()
        if not a_url or not b_url: raise Exception("both URLs required")
        verdict = self._analyze(a_url, b_url, hint)
        key = str(int(self.proof_count))
        record = {"requester": str(gl.message.sender_address), "account_a": a_url, "account_b": b_url, "same_person": verdict["same_person"], "confidence": verdict["confidence"], "signals": verdict["signals"]}
        self.proofs[key] = json.dumps(record)
        self.proof_count += u256(1)
        return key

    def _analyze(self, a_url, b_url, hint):
        def leader_fn() -> str:
            page_a = "(failed)"; page_b = "(failed)"
            try: page_a = gl.nondet.web.render(a_url, mode="text")[:3000]
            except: pass
            try: page_b = gl.nondet.web.render(b_url, mode="text")[:3000]
            except: pass
            prompt = f"""Determine if two accounts belong to same person WITHOUT revealing identity.\n\nACCOUNT A:\n{page_a}\n\nACCOUNT B:\n{page_b}\n\nHINT: {str(hint)[:200]}\n\nAnalyze writing style, topics, cross-references.\nReply JSON: {{"same_person": true/false, "confidence": "high"/"medium"/"low", "signals": "<what matched>"}}"""
            raw = gl.nondet.exec_prompt(prompt, response_format="json")
            return json.dumps(raw) if isinstance(raw, dict) else str(raw).strip()
        def validator_fn(r) -> bool:
            if not isinstance(r, gl.vm.Return): return False
            try: d = json.loads(r.calldata); return isinstance(d.get("same_person"), bool) and d.get("confidence") in ("high","medium","low")
            except: return False
        return json.loads(gl.vm.run_nondet_unsafe(leader_fn, validator_fn))

    @gl.public.view
    def get_proof(self, key: str) -> dict:
        key = str(key)
        if key not in self.proofs: return {"exists": False}
        return json.loads(self.proofs[key])

    @gl.public.view
    def stats(self) -> dict:
        return {"total_proofs": int(self.proof_count)}
