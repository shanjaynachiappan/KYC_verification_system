import re


def classify_document(extracted_text):
    """
    Classify the uploaded document using OCR text.

    Parameters
    ----------
    extracted_text : list[str]

    Returns
    -------
    str
        "passport"
        "payslip"
        "unknown"
    """

    # ----------------------------------------
    # Convert OCR text to one string
    # ----------------------------------------

    full_text = "\n".join(extracted_text).upper()

    print("\n========== DOCUMENT CLASSIFICATION ==========\n")

    # ----------------------------------------
    # Passport Keywords
    # ----------------------------------------

    passport_keywords = [

        "PASSPORT",

        "REPUBLIC OF INDIA",

        "PASSPORT NO",

        "PASSPORT NUMBER",

        "NATIONALITY",

        "SURNAME",

        "GIVEN NAME",

        "DATE OF BIRTH",

        "DATE OF ISSUE",

        "DATE OF EXPIRY",

        "PLACE OF BIRTH",

        "PLACE OF ISSUE",

        "SEX"

    ]

    passport_keyword_count = 0

    found_passport_keywords = []

    for keyword in passport_keywords:

        if keyword in full_text:

            passport_keyword_count += 1

            found_passport_keywords.append(keyword)

    # ----------------------------------------
    # Passport Number Detection
    # ----------------------------------------

    passport_number_pattern = r"\b[A-Z][0-9]{7}\b"

    passport_number_found = bool(
        re.search(
            passport_number_pattern,
            full_text
        )
    )

    # ----------------------------------------
    # MRZ Detection
    # ----------------------------------------

    mrz_found = any(

        line.strip().upper().startswith("P<")

        for line in extracted_text

    )

    passport_score = passport_keyword_count

    if passport_number_found:
        passport_score += 2

    if mrz_found:
        passport_score += 3

    # ----------------------------------------
    # Payslip Keywords
    # ----------------------------------------

    payslip_keywords = [

        "PAYSLIP",

        "SALARY",

        "EMPLOYEE",

        "EMPLOYEE ID",

        "EMP ID",

        "EMPLOYEE NO",

        "PAY PERIOD",

        "MONTH",

        "PAY DATE",

        "NET PAY",

        "NET SALARY",

        "GROSS PAY",

        "GROSS SALARY",

        "BASIC",

        "BASIC PAY",

        "BASIC SALARY",

        "EARNINGS",

        "DEDUCTIONS",

        "PF",

        "EPF",

        "ESI",

        "HRA",

        "TAX"

    ]

    payslip_keyword_count = 0

    found_payslip_keywords = []

    for keyword in payslip_keywords:

        if keyword in full_text:

            payslip_keyword_count += 1

            found_payslip_keywords.append(keyword)

    payslip_score = payslip_keyword_count

    # ----------------------------------------
    # Debug Output
    # ----------------------------------------

    print("Passport Analysis")
    print("-----------------")
    print("Keyword Count :", passport_keyword_count)
    print("Keywords      :", found_passport_keywords)
    print("Passport No   :", passport_number_found)
    print("MRZ Found     :", mrz_found)
    print("Passport Score:", passport_score)

    print()

    print("Payslip Analysis")
    print("----------------")
    print("Keyword Count :", payslip_keyword_count)
    print("Keywords      :", found_payslip_keywords)
    print("Payslip Score :", payslip_score)

    # ----------------------------------------
    # Final Decision
    # ----------------------------------------

    if passport_score >= 5:

        print("\nDetected Document : PASSPORT")
        print("=========================================\n")

        return "passport"

    if payslip_score >= 4:

        print("\nDetected Document : PAYSLIP")
        print("=========================================\n")

        return "payslip"

    print("\nDetected Document : UNKNOWN")
    print("=========================================\n")

    return "unknown"