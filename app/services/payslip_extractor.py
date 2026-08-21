import re


def clean_value(value):
    """
    Remove unwanted spaces and symbols.
    """

    if value is None:
        return ""

    value = re.sub(r"\s+", " ", value)

    return value.strip()


# -------------------------------------------------------
# Employee Name
# -------------------------------------------------------

def extract_employee_name(extracted_text):

    patterns = [
        "EMPLOYEE NAME",
        "NAME",
    ]

    for i, line in enumerate(extracted_text):

        upper = line.upper()

        for keyword in patterns:

            if keyword in upper:

                if ":" in line:
                    return clean_value(line.split(":")[-1])

                if i + 1 < len(extracted_text):
                    return clean_value(extracted_text[i + 1])

    return ""


# -------------------------------------------------------
# Employee ID
# -------------------------------------------------------

def extract_employee_id(full_text):

    patterns = [

        r"EMPLOYEE\s*ID[:\-]?\s*([A-Z0-9]+)",

        r"EMP\s*ID[:\-]?\s*([A-Z0-9]+)",

        r"EMPLOYEE\s*NO[:\-]?\s*([A-Z0-9]+)",

    ]

    for pattern in patterns:

        match = re.search(pattern, full_text, re.IGNORECASE)

        if match:
            return clean_value(match.group(1))

    return ""


# -------------------------------------------------------
# Company Name
# -------------------------------------------------------

def extract_company_name(extracted_text):

    if len(extracted_text) > 0:
        return clean_value(extracted_text[0])

    return ""


# -------------------------------------------------------
# Designation
# -------------------------------------------------------

def extract_designation(extracted_text):

    for i, line in enumerate(extracted_text):

        if "DESIGNATION" in line.upper():

            if ":" in line:
                return clean_value(line.split(":")[-1])

            if i + 1 < len(extracted_text):
                return clean_value(extracted_text[i + 1])

    return ""


# -------------------------------------------------------
# Department
# -------------------------------------------------------

def extract_department(extracted_text):

    for i, line in enumerate(extracted_text):

        if "DEPARTMENT" in line.upper():

            if ":" in line:
                return clean_value(line.split(":")[-1])

            if i + 1 < len(extracted_text):
                return clean_value(extracted_text[i + 1])

    return ""


# -------------------------------------------------------
# Pay Period
# -------------------------------------------------------

def extract_pay_period(full_text):

    patterns = [

        r"PAY\s*PERIOD[:\-]?\s*([A-Z0-9\s/-]+)",

        r"MONTH[:\-]?\s*([A-Z]+\s+\d{4})",

    ]

    for pattern in patterns:

        match = re.search(pattern, full_text, re.IGNORECASE)

        if match:
            return clean_value(match.group(1))

    return ""


# -------------------------------------------------------
# Salary Components
# -------------------------------------------------------

def extract_amount(label, full_text):

    pattern = rf"{label}\s*[:\-]?\s*₹?\s*([\d,]+(?:\.\d{{2}})?)"

    match = re.search(pattern, full_text, re.IGNORECASE)

    if match:
        return clean_value(match.group(1))

    return ""


# -------------------------------------------------------
# Main Extraction
# -------------------------------------------------------

def extract_payslip_details(extracted_text):

    full_text = "\n".join(extracted_text)

    employee_name = extract_employee_name(extracted_text)

    employee_id = extract_employee_id(full_text)

    company_name = extract_company_name(extracted_text)

    designation = extract_designation(extracted_text)

    department = extract_department(extracted_text)

    pay_period = extract_pay_period(full_text)

    basic_salary = extract_amount("BASIC", full_text)

    gross_salary = extract_amount("GROSS", full_text)

    net_salary = extract_amount("NET", full_text)

    pf = extract_amount("PF", full_text)

    esi = extract_amount("ESI", full_text)

    tax = extract_amount("TAX", full_text)

    return {

        "document_type": "payslip",

        "employee_name": employee_name,

        "employee_id": employee_id,

        "company_name": company_name,

        "designation": designation,

        "department": department,

        "pay_period": pay_period,

        "basic_salary": basic_salary,

        "gross_salary": gross_salary,

        "net_salary": net_salary,

        "pf": pf,

        "esi": esi,

        "tax": tax

    }