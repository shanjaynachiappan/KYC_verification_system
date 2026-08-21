import re


def identify_document(full_text):

    # Convert OCR text to uppercase
    text = full_text.upper()

    # Normalize extra spaces
    normalized_text = re.sub(
        r"\s+",
        " ",
        text
    )

    # Aadhaar keywords
    aadhaar_keywords = [
        "AADHAAR",
        "UNIQUE IDENTIFICATION AUTHORITY",
        "GOVERNMENT OF INDIA"
    ]

    # PAN keywords
    pan_keywords = [
        "INCOME TAX DEPARTMENT",
        "PERMANENT ACCOUNT NUMBER"
    ]

    # Aadhaar number pattern
    aadhaar_pattern = r"\b\d{4}\s?\d{4}\s?\d{4}\b"

    # PAN number pattern
    pan_pattern = r"\b[A-Z]{5}[0-9]{4}[A-Z]\b"

    # Search document numbers
    aadhaar_match = re.search(
        aadhaar_pattern,
        normalized_text
    )

    pan_match = re.search(
        pan_pattern,
        normalized_text
    )

    # Check Aadhaar keywords
    aadhaar_keyword_found = any(
        keyword in text
        for keyword in aadhaar_keywords
    )

    # Check PAN keywords
    pan_keyword_found = any(
        keyword in text
        for keyword in pan_keywords
    )

    document_type = "unsupported"
    document_number = None

    # Verify Aadhaar
    if aadhaar_keyword_found and aadhaar_match:
        document_type = "aadhaar"
        document_number = aadhaar_match.group()

    # Verify PAN
    elif pan_keyword_found and pan_match:
        document_type = "pan"
        document_number = pan_match.group()

    print("\n----- DOCUMENT IDENTIFICATION -----")
    print("Aadhaar Keyword Found :", aadhaar_keyword_found)
    print("Aadhaar Number Found  :", aadhaar_match is not None)
    print("PAN Keyword Found     :", pan_keyword_found)
    print("PAN Number Found      :", pan_match is not None)
    print("Document Type         :", document_type)
    print("Document Number       :", document_number)
    print("-----------------------------------\n")

    return {
        "document_type": document_type,
        "document_number": document_number,
        "is_supported": document_type != "unsupported"
    }


def extract_person_details(full_text, document_type):

    # Split OCR text into separate lines
    lines = [
        line.strip()
        for line in full_text.split("\n")
        if line.strip()
    ]

    text = full_text.upper()

    name = None
    date_of_birth = None
    gender = None

    # DOB pattern
    dob_pattern = r"\b\d{2}[/-]\d{2}[/-]\d{4}\b"

    dob_match = re.search(
        dob_pattern,
        text
    )

    if dob_match:
        date_of_birth = dob_match.group()

    # Gender detection
    if re.search(r"\bFEMALE\b", text):
        gender = "Female"

    elif re.search(r"\bMALE\b", text):
        gender = "Male"

    # Name extraction for Aadhaar
    if document_type == "aadhaar":

        for index, line in enumerate(lines):

            upper_line = line.upper()

            if "DOB" in upper_line or "YEAR OF BIRTH" in upper_line:

                if index > 0:
                    name = lines[index - 1]

                break

    # Name extraction for PAN
    elif document_type == "pan":

        for index, line in enumerate(lines):

            upper_line = line.upper()

            if "FATHER" in upper_line:

                if index > 0:
                    name = lines[index - 1]

                break

    print("\n----- PERSON DETAILS -----")
    print("Name          :", name)
    print("Date of Birth :", date_of_birth)
    print("Gender        :", gender)
    print("--------------------------\n")

    return {
        "name": name,
        "date_of_birth": date_of_birth,
        "gender": gender
    }