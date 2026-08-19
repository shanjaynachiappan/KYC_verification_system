"""
Source of Funds (SOF) risk assessment.

Scores the applicant's OWN declared income band and source-of-funds
category (collected via a short form on the AML check screen -- see
AmlCheckPage.jsx) against a small rule-based risk model.

This does not verify the declaration against payslips/bank statements --
that would be a further production step (e.g. bank-statement analysis or
payslip OCR/cross-check). What it does do is use real applicant input
rather than a placeholder value, so the risk_level below reflects what the
person actually told us.

INCOME_BANDS_ORDER and SOURCE_RISK must stay in sync with the dropdown
options in AmlCheckPage.jsx -- if you add/rename an option on the frontend,
mirror it here.
"""

# Risk assigned to each source-of-funds category the applicant can declare.
SOURCE_RISK = {
    "Salaried employment": "low",
    "Business income (registered entity)": "low",
    "Freelance / consulting income": "medium",
    "Property sale proceeds": "medium",
    "Inheritance / gift": "medium",
    "Overseas remittance": "medium",
    "Cash-intensive trade business": "high",
}

# Income bands in ascending order -- used to detect "high income + risky source".
INCOME_BANDS_ORDER = [
    "Below ₹5L/yr",
    "₹5L–15L/yr",
    "₹15L–50L/yr",
    "₹50L–1Cr/yr",
    "Above ₹1Cr/yr",
]


def assess_source_of_funds(declared_income_band: str, declared_source: str) -> dict:
    """
    Scores the applicant's declared income band + source of funds.
    Returns {"risk_level": "low"|"medium"|"high", "declared_income_band": str,
             "declared_source": str, "reasoning": str}
    """
    base_risk = SOURCE_RISK.get(declared_source, "medium")
    income_idx = (
        INCOME_BANDS_ORDER.index(declared_income_band)
        if declared_income_band in INCOME_BANDS_ORDER
        else 2  # unrecognised value -> treat as mid-band rather than guessing high/low
    )

    risk_level = base_risk
    reasons = [
        f"Declared income band: {declared_income_band}.",
        f"Declared source of funds: {declared_source}.",
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
        "declared_income_band": declared_income_band,
        "declared_source": declared_source,
        "reasoning": " ".join(reasons),
    }