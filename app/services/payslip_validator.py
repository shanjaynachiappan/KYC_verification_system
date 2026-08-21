import re


# ---------------------------------------------------
# Keyword Lists
# ---------------------------------------------------

MANDATORY_KEYWORDS = [
    "PAYSLIP",
    "SALARY",
    "EMPLOYEE",
]

OPTIONAL_KEYWORDS = [
    "EMPLOYEE ID",
    "EMPLOYEE NO",
    "EMP ID",
    "COMPANY",
    "BASIC",
    "BASIC PAY",
    "HRA",
    "ALLOWANCE",
    "DEDUCTION",
    "PF",
    "EPF",
    "ESI",
    "NET PAY",
    "NET SALARY",
    "GROSS",
    "GROSS SALARY",
    "EARNINGS",
    "MONTH",
    "PAY PERIOD",
    "BANK",
]


# ---------------------------------------------------
# Helper Functions
# ---------------------------------------------------

def contains_salary_amount(full_text):
    """
    Check if salary-like currency values exist.
    Examples:
        ₹45,000
        Rs.35000
        35000.00
    """

    patterns = [
        r"₹\s?\d[\d,]*\.?\d*",
        r"RS\.?\s?\d[\d,]*\.?\d*",
        r"\b\d{4,}\.?\d{0,2}\b",
    ]

    for pattern in patterns:
        if re.search(pattern, full_text, re.IGNORECASE):
            return True

    return False


def contains_employee_id(full_text):
    """
    Check whether an employee ID exists.
    """

    patterns = [
        r"EMPLOYEE\s*ID[:\-]?\s*[A-Z0-9]+",
        r"EMP\s*ID[:\-]?\s*[A-Z0-9]+",
        r"EMPLOYEE\s*NO[:\-]?\s*[A-Z0-9]+",
    ]

    for pattern in patterns:
        if re.search(pattern, full_text, re.IGNORECASE):
            return True

    return False


# ---------------------------------------------------
# Main Validation Function
# ---------------------------------------------------

def validate_payslip(extracted_text):
    """
    Validate whether the uploaded document is a payslip.

    Parameters
    ----------
    extracted_text : list[str]

    Returns
    -------
    dict
    """

    full_text = "\n".join(extracted_text).upper()

    validation_score = 0

    missing_fields = []

    # --------------------------------------------
    # Mandatory Keywords
    # --------------------------------------------

    for keyword in MANDATORY_KEYWORDS:

        if keyword in full_text:
            validation_score += 2
        else:
            missing_fields.append(keyword)

    # --------------------------------------------
    # Optional Keywords
    # --------------------------------------------

    for keyword in OPTIONAL_KEYWORDS:

        if keyword in full_text:
            validation_score += 1

    # --------------------------------------------
    # Employee ID
    # --------------------------------------------

    if contains_employee_id(full_text):
        validation_score += 2
    else:
        missing_fields.append("Employee ID")

    # --------------------------------------------
    # Salary Amount
    # --------------------------------------------

    if contains_salary_amount(full_text):
        validation_score += 2
    else:
        missing_fields.append("Salary Amount")

    # --------------------------------------------
    # Final Decision
    # --------------------------------------------

    is_valid = validation_score >= 8

    return {

        "document_type": "payslip",

        "is_valid": is_valid,

        "validation_score": validation_score,

        "missing_fields": missing_fields,

        "reason": (
            "Valid Payslip"
            if is_valid
            else "Payslip validation failed"
        )

    }