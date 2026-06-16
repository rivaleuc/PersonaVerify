"""Deterministic-invariant tests for the PersonaVerify contract.

ANCHOR (cross-field): if same_person is True then confidence must be
'high' or 'medium'; signals non-empty; confidence in enum.
Leader enforces: if confidence=='low' then same_person=False.
"""


def test_normalized_output_always_passes(contract):
    samples = [
        {"same_person": True, "confidence": "low", "signals": "x"},   # low+match -> coerced
        {"same_person": True, "confidence": "high", "signals": ""},
        {"same_person": False, "confidence": "bogus", "signals": "y"},
        {"same_person": True},
        {},
        "not a dict",
        None,
    ]
    for raw in samples:
        v = contract.normalize_verdict(raw)
        assert contract.validate_verdict(v), raw
        # invariant: a positive match is never low-confidence
        if v["confidence"] == "low":
            assert v["same_person"] is False


def test_leader_demotes_low_confidence_match(contract):
    v = contract.normalize_verdict({"same_person": True, "confidence": "low", "signals": "x"})
    assert v["same_person"] is False


def test_positive_low_confidence_rejected(contract):
    assert not contract.validate_verdict(
        {"same_person": True, "confidence": "low", "signals": "matched style"}
    )


def test_bad_enum_rejected(contract):
    assert not contract.validate_verdict(
        {"same_person": False, "confidence": "very-high", "signals": "x"}
    )


def test_empty_signals_rejected(contract):
    assert not contract.validate_verdict(
        {"same_person": True, "confidence": "high", "signals": "   "}
    )


def test_non_bool_same_person_rejected(contract):
    assert not contract.validate_verdict(
        {"same_person": 1, "confidence": "high", "signals": "x"}
    )
