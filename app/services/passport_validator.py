import re


def validate_passport(extracted_text):
    """
    Validate whether the OCR text belongs to an Indian passport.

    Parameters
    ----------
    extracted_text : list
        OCR extracted text lines.

    Returns
    -------
    dict
    """

    # ---------------------------------------------
    # Combine OCR Text
    # ---------------------------------------------

    full_text = " ".join(extracted_text).upper()

    print("\n========== PASSPORT VALIDATION ==========\n")

    # ---------------------------------------------
    # Passport Keywords
    # ---------------------------------------------

    passport_keywords = [

        "PASSPORT",

        "REPUBLIC OF INDIA",

        "PASSPORT NO",

        "PASSPORT NUMBER",

        "NATIONALITY",

        "INDIAN",

        "IND",

        "DATE OF BIRTH",

        "DATE OF ISSUE",

        "DATE OF EXPIRY",

        "PLACE OF BIRTH",

        "PLACE OF ISSUE",

        "SURNAME",

        "GIVEN NAME",

        "SEX"

    ]

    keyword_count = 0
    found_keywords = []

    for keyword in passport_keywords:

        if keyword in full_text:

            keyword_count += 1
            found_keywords.append(keyword)

    # ---------------------------------------------
    # Passport Number Detection
    # ---------------------------------------------

    passport_pattern = r"\b[A-Z][0-9]{7}\b"

    passport_match = re.search(
        passport_pattern,
        full_text
    )

    passport_number_found = passport_match is not None

    # ---------------------------------------------
    # MRZ Detection
    # ---------------------------------------------

    mrz_found = False

    for line in extracted_text:

        line = line.upper().strip()

        if line.startswith("P<"):

            mrz_found = True
            break

    # ---------------------------------------------
    # Date Detection
    # ---------------------------------------------

    date_pattern = r"\d{2}[/-]\d{2}[/-]\d{4}"

    dates_found = re.findall(
        date_pattern,
        full_text
    )

    # ---------------------------------------------
    # Validation Score
    # ---------------------------------------------

    validation_score = 0

    validation_score += keyword_count

    if passport_number_found:
        validation_score += 2

    if mrz_found:
        validation_score += 3

    if len(dates_found) >= 2:
        validation_score += 2

    is_valid = validation_score >= 6

    # ---------------------------------------------
    # Debug Logs
    # ---------------------------------------------

    print("Keywords Found      :", keyword_count)
    print("Keyword List        :", found_keywords)
    print("Passport Number     :", passport_number_found)
    print("MRZ Found           :", mrz_found)
    print("Dates Found         :", dates_found)
    print("Validation Score    :", validation_score)

    if is_valid:
        print("Validation Result   : VALID PASSPORT ✅")
    else:
        print("Validation Result   : NOT A PASSPORT ❌")

    print("=========================================\n")

    # ---------------------------------------------
    # Return
    # ---------------------------------------------

    return {

        "is_valid": is_valid,

        "validation_score": validation_score,

        "keyword_count": keyword_count,

        "keywords_found": found_keywords,

        "passport_number_found": passport_number_found,

        "mrz_found": mrz_found,

        "dates_found": dates_found

    }