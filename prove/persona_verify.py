# { "Depends": "py-genlayer:1jb45aa8ynh2a9c9xn3b7qqh8sm5q93hwfp7jqmwsfhh8jpz09h6" }
import json
from genlayer import *

CONFIDENCE_ENUM = ("high", "medium", "low")


# ----------------------------------------------------------------------
# Deterministic verdict logic (module-level, unit-testable, shared by
# leader_fn and validator_fn). No free-form LLM text comparison.
# ----------------------------------------------------------------------
def validate_verdict(data) -> bool:
    if not isinstance(data, dict):
        return False
    same_person = data.get("same_person")
    if not isinstance(same_person, bool):
        return False
    confidence = data.get("confidence")
    if confidence not in CONFIDENCE_ENUM:
        return False
    signals = data.get("signals")
    if not isinstance(signals, str) or not signals.strip():
        return False
    # Cross-field anchor: a positive match cannot be low-confidence.
    if same_person and confidence == "low":
        return False
    return True


def normalize_verdict(raw) -> dict:
    if not isinstance(raw, dict):
        raw = {}
    confidence = raw.get("confidence")
    if confidence not in CONFIDENCE_ENUM:
        confidence = "low"
    same_person = bool(raw.get("same_person", False))
    # Leader enforces the invariant: if confidence is low, it cannot be a match.
    if confidence == "low":
        same_person = False
    signals = raw.get("signals")
    if not isinstance(signals, str) or not signals.strip():
        signals = "no distinguishing signals found"
    return {"same_person": same_person, "confidence": confidence, "signals": signals}


class PersonaVerify(gl.Contract):
    proofs: TreeMap[str, str]
    proof_count: u256

    def __init__(self):
        self.proof_count = u256(0)

    @gl.public.write
    def verify_link(self, account_a_url: str, account_b_url: str, hint: str) -> str:
        a_url = str(account_a_url).strip()
        b_url = str(account_b_url).strip()
        if not a_url or not b_url:
            raise Exception("both URLs required")
        verdict = self._analyze(a_url, b_url, hint)
        key = str(int(self.proof_count))
        record = {
            "requester": str(gl.message.sender_address),
            "account_a": a_url,
            "account_b": b_url,
            "same_person": verdict["same_person"],
            "confidence": verdict["confidence"],
            "signals": verdict["signals"],
        }
        self.proofs[key] = json.dumps(record)
        self.proof_count += u256(1)
        return key

    def _analyze(self, a_url, b_url, hint):
        def leader_fn() -> str:
            page_a = "(failed)"
            page_b = "(failed)"
            try:
                page_a = gl.nondet.web.render(a_url, mode="text")[:3000]
            except Exception:
                pass
            try:
                page_b = gl.nondet.web.render(b_url, mode="text")[:3000]
            except Exception:
                pass
            prompt = f"""Determine if two accounts belong to the same person WITHOUT revealing identity.

ACCOUNT A:
{page_a}

ACCOUNT B:
{page_b}

HINT: {str(hint)[:200]}

Analyze writing style, topics, cross-references.
A positive match (same_person true) must NOT be low confidence.
Reply ONLY valid JSON:
{{"same_person": true/false, "confidence": "high"/"medium"/"low", "signals": "<what matched>"}}"""
            raw = gl.nondet.exec_prompt(prompt, response_format="json")
            if not isinstance(raw, dict):
                try:
                    raw = json.loads(str(raw))
                except Exception:
                    raw = {}
            return json.dumps(normalize_verdict(raw))

        def validator_fn(leader_result) -> bool:
            if not isinstance(leader_result, gl.vm.Return):
                return False
            try:
                data = json.loads(leader_result.calldata)
            except Exception:
                return False
            return validate_verdict(data)

        return json.loads(gl.vm.run_nondet_unsafe(leader_fn, validator_fn))

    @gl.public.view
    def get_proof(self, key: str) -> dict:
        key = str(key)
        if key not in self.proofs:
            return {"exists": False}
        return json.loads(self.proofs[key])

    @gl.public.view
    def stats(self) -> dict:
        return {"total_proofs": int(self.proof_count)}
