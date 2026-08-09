import re


def clean_value(value):
    """
    Remove unwanted spaces and symbols.
    """

    if value is None:
        return ""

    value = value.replace("<", " ")

    value = re.sub(r"\s+", " ", value)

    return value.strip()


def extract_passport_number(full_text):
    """
    Extract passport number.
    """

    pattern = r"\b[A-Z][0-9]{7}\b"

    match = re.search(pattern, full_text)

    if match:
        return match.group()

    return ""


def extract_dates(full_text):
    """
    Extract all dates in DD/MM/YYYY or DD-MM-YYYY format.
    """

    pattern = r"\d{2}[/-]\d{2}[/-]\d{4}"

    return re.findall(pattern, full_text)


def extract_gender(full_text):
    """
    Extract gender.
    """

    full_text = full_text.upper()

    if re.search(r"\bMALE\b", full_text):
        return "M"

    if re.search(r"\bFEMALE\b", full_text):
        return "F"

    if re.search(r"\bM\b", full_text):
        return "M"

    if re.search(r"\bF\b", full_text):
        return "F"

    return ""


def extract_nationality(full_text):
    """
    Extract nationality.
    """

    full_text = full_text.upper()

    if "INDIAN" in full_text:
        return "INDIAN"

    if "IND" in full_text:
        return "INDIAN"

    return ""


def extract_name(extracted_text):
    """
    Extract surname and given name.
    """

    surname = ""
    given_name = ""

    for i, line in enumerate(extracted_text):

        text = line.upper()

        if "SURNAME" in text:

            if i + 1 < len(extracted_text):
                surname = clean_value(extracted_text[i + 1])

        if "GIVEN NAME" in text:

            if i + 1 < len(extracted_text):
                given_name = clean_value(extracted_text[i + 1])

    #
    # Fallback using MRZ
    #

    for line in extracted_text:

        if line.startswith("P<"):

            mrz = line.replace(" ", "")

            parts = mrz.split("<<")

            if len(parts) >= 2:

                name_part = parts[1]

                names = [
                    x for x in name_part.split("<")
                    if x.strip()
                ]

                if names and given_name == "":
                    given_name = clean_value(" ".join(names))

    return surname, given_name


def extract_place_of_birth(extracted_text):
    """
    Extract place of birth.
    """

    for i, line in enumerate(extracted_text):

        if "PLACE OF BIRTH" in line.upper():

            if i + 1 < len(extracted_text):
                return clean_value(extracted_text[i + 1])

    return ""


def extract_place_of_issue(extracted_text):
    """
    Extract place of issue.
    """

    for i, line in enumerate(extracted_text):

        if "PLACE OF ISSUE" in line.upper():

            if i + 1 < len(extracted_text):
                return clean_value(extracted_text[i + 1])

    return ""
def extract_mrz_details(extracted_text):
    """
    Extract details from the Machine Readable Zone (MRZ).
    """

    mrz_lines = []

    for line in extracted_text:

        line = line.strip().replace(" ", "")

        if line.startswith("P<"):
            mrz_lines.append(line)

        elif re.match(r"^[A-Z0-9<]{30,}$", line):
            mrz_lines.append(line)

    passport_number = ""
    surname = ""
    given_name = ""
    nationality = ""
    dob = ""
    gender = ""
    expiry_date = ""

    if len(mrz_lines) >= 2:

        line1 = mrz_lines[0]
        line2 = mrz_lines[1]

        # -------------------------------
        # Name Extraction
        # -------------------------------

        try:

            name_part = line1[5:]

            parts = name_part.split("<<")

            if len(parts) >= 2:

                surname = clean_value(parts[0])

                given_name = clean_value(
                    " ".join(
                        x for x in parts[1].split("<")
                        if x
                    )
                )

        except Exception:
            pass

        # -------------------------------
        # Passport Number
        # -------------------------------

        if len(line2) >= 9:
            passport_number = line2[:9].replace("<", "")

        # -------------------------------
        # Nationality
        # -------------------------------

        if len(line2) >= 13:

            nationality = line2[10:13]

            if nationality == "IND":
                nationality = "INDIAN"

        # -------------------------------
        # Date of Birth
        # -------------------------------

        if len(line2) >= 19:

            dob_raw = line2[13:19]

            if len(dob_raw) == 6:

                yy = int(dob_raw[:2])

                year = f"20{yy:02d}" if yy <= 30 else f"19{yy:02d}"

                month = dob_raw[2:4]

                day = dob_raw[4:6]

                dob = f"{day}/{month}/{year}"

        # -------------------------------
        # Gender
        # -------------------------------

        if len(line2) >= 21:
            gender = line2[20]

        # -------------------------------
        # Expiry Date
        # -------------------------------

        if len(line2) >= 27:

            exp_raw = line2[21:27]

            if len(exp_raw) == 6:

                yy = int(exp_raw[:2])

                year = f"20{yy:02d}" if yy <= 50 else f"19{yy:02d}"

                month = exp_raw[2:4]

                day = exp_raw[4:6]

                expiry_date = f"{day}/{month}/{year}"

    return {

        "passport_number": passport_number,

        "surname": surname,

        "given_name": given_name,

        "nationality": nationality,

        "date_of_birth": dob,

        "gender": gender,

        "date_of_expiry": expiry_date

    }


def extract_dates_from_document(extracted_text):
    """
    Extract DOB, Issue Date and Expiry Date from OCR text.
    """

    full_text = "\n".join(extracted_text)

    dates = extract_dates(full_text)

    dob = ""
    issue_date = ""
    expiry_date = ""

    if len(dates) >= 1:
        dob = dates[0]

    if len(dates) >= 2:
        issue_date = dates[-2]

    if len(dates) >= 3:
        expiry_date = dates[-1]

    return dob, issue_date, expiry_date
def extract_passport_details(extracted_text):
    """
    Main Passport Extraction Function

    Workflow:
    1. Extract details using OCR.
    2. Extract details using MRZ.
    3. Merge both results.
    4. Return final JSON.
    """

    # -----------------------------------------
    # Convert OCR list to single string
    # -----------------------------------------

    full_text = "\n".join(extracted_text)

    # -----------------------------------------
    # OCR Extraction
    # -----------------------------------------

    passport_number = extract_passport_number(full_text)

    surname, given_name = extract_name(extracted_text)

    nationality = extract_nationality(full_text)

    gender = extract_gender(full_text)

    place_of_birth = extract_place_of_birth(extracted_text)

    place_of_issue = extract_place_of_issue(extracted_text)

    dob, issue_date, expiry_date = extract_dates_from_document(extracted_text)

    # -----------------------------------------
    # MRZ Extraction
    # -----------------------------------------

    mrz = extract_mrz_details(extracted_text)

    if mrz:

        if not passport_number:
            passport_number = mrz.get("passport_number", "")

        if not surname:
            surname = mrz.get("surname", "")

        if not given_name:
            given_name = mrz.get("given_name", "")

        if not nationality:
            nationality = mrz.get("nationality", "")

        if not dob:
            dob = mrz.get("date_of_birth", "")

        if not gender:
            gender = mrz.get("gender", "")

        if not expiry_date:
            expiry_date = mrz.get("date_of_expiry", "")

    # -----------------------------------------
    # Clean Values
    # -----------------------------------------

    passport_number = clean_value(passport_number)

    surname = clean_value(surname)

    given_name = clean_value(given_name)

    nationality = clean_value(nationality)

    dob = clean_value(dob)

    gender = clean_value(gender)

    place_of_birth = clean_value(place_of_birth)

    place_of_issue = clean_value(place_of_issue)

    issue_date = clean_value(issue_date)

    expiry_date = clean_value(expiry_date)

    # -----------------------------------------
    # Return Final JSON
    # -----------------------------------------

    return {

        "document_type": "passport",

        "passport_number": passport_number,

        "surname": surname,

        "given_name": given_name,

        "nationality": nationality,

        "date_of_birth": dob,

        "gender": gender,

        "place_of_birth": place_of_birth,

        "place_of_issue": place_of_issue,

        "date_of_issue": issue_date,

        "date_of_expiry": expiry_date

    }