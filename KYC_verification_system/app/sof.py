def assess_sof(income_band: str, source: str) -> dict:
    """
    Assess source of funds risk level.
    """
    source = source.strip() if source else ""
    income_band = income_band.strip() if income_band else ""

    high_risk_sources = {
        "Cash-intensive trade business",
        "Overseas remittance"
    }
    
    medium_risk_sources = {
        "Freelance / consulting income",
        "Property sale proceeds",
        "Inheritance / gift",
        "Business income (registered entity)"
    }
    
    low_risk_sources = {
        "Salaried employment"
    }

    risk_level = "LOW"
    reasoning = "Standard source of funds."

    if source in high_risk_sources:
        risk_level = "HIGH"
        reasoning = "High risk source category."
    elif source in medium_risk_sources:
        risk_level = "MEDIUM"
        reasoning = "Medium risk source category."
    elif source not in low_risk_sources and source:
        risk_level = "MEDIUM"
        reasoning = "Unknown source category, defaulting to medium risk."

    # Additional logic based on income band can be added here
    if income_band in ["1Cr+", "50L-1Cr"] and risk_level == "MEDIUM":
        risk_level = "HIGH"
        reasoning += " Elevated risk due to high income band."

    return {
        "risk_level": risk_level,
        "reasoning": reasoning
    }
