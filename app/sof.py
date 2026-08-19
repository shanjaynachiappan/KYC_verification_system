"""
Source of Funds (SOF) risk assessment -- SYNTHETIC simulation.

A real SOF check normally comes from a declared-income questionnaire plus
bank-statement / income-proof analysis. This demo has no such intake step,
so we deterministically *simulate* a declared income profile from the
user_id (same user_id always produces the same synthetic profile, so
repeated screenings in one demo session stay consistent) and run a small
rule-based risk model over it.

Swap _seeded_value()/assess_source_of_funds() for a real questionnaire +
bank-statement/income-proof pipeline before any production use.
"""
import hashlib

INCOME_BANDS = [
    "Below ₹5L/yr",
    "₹5L\u201315L/yr",
    "₹15L\u201350L/yr",
    "₹50L\u20131Cr/yr",
    "Above ₹1Cr/yr",
]

# (label, base risk)
SOURCE_CATEGORIES = [
    ("Salaried employment", "low"),
    ("Business income (registered entity)", "low"),
    ("Freelance / consulting income", "medium"),
    ("Property sale proceeds", "medium"),
    ("Cash-intensive trade business", "high"),
    ("Inheritance / gift", "medium"),
    ("Overseas remittance", "medium"),
]


def _seeded_value(seed: str, modulo: int) -> int:
    """Deterministic pseudo-random index in [0, modulo) derived from `seed`."""
    digest = hashlib.sha256(seed.encode("utf-8")).hexdigest()
    return int(digest, 16) % modulo


def assess_source_of_funds(user_id: str, name: str) -> dict:
    """
    Simulates a declared source-of-funds profile for `user_id` and scores it.
    Returns {"risk_level": "low"|"medium"|"high", "declared_income_band": str,
             "declared_source": str, "reasoning": str}
    """
    income_idx = _seeded_value(f"{user_id}:income", len(INCOME_BANDS))
    source_idx = _seeded_value(f"{user_id}:source", len(SOURCE_CATEGORIES))

    income_band = INCOME_BANDS[income_idx]
    source_label, base_risk = SOURCE_CATEGORIES[source_idx]

    risk_level = base_risk
    reasons = [
        f"Declared income band: {income_band}.",
        f"Declared source of funds: {source_label}.",
    ]

    # High declared income routed through a non-salaried / non-low-risk
    # channel warrants a closer look -- bump to high risk.
    if income_idx >= 3 and base_risk != "low":
        risk_level = "high"
        reasons.append(
            "High income volume through a non-salaried channel increases scrutiny."
        )

    if risk_level == "high":
        reasons.append(
            "Recommend Enhanced Due Diligence (EDD) and documentary proof of funds."
        )

    return {
        "risk_level": risk_level,
        "declared_income_band": income_band,
        "declared_source": source_label,
        "reasoning": " ".join(reasons),
    }