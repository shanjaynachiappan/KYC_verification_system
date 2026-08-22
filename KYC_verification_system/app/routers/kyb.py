from fastapi import APIRouter
from pydantic import BaseModel
import re

router = APIRouter(prefix="/kyb", tags=["Business KYB"])

class CompanyValidationRequest(BaseModel):
    company_name: str
    cin: str
    gstin: str

class CompanyValidationResponse(BaseModel):
    valid: bool
    company_name_valid: bool
    cin_valid: bool
    gstin_valid: bool
    company_name_error: str | None = None
    cin_error: str | None = None
    gstin_error: str | None = None
    verification_type: str

def validate_gstin_checksum(gstin: str) -> bool:
    if len(gstin) != 15:
        return False
        
    chars = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ"
    sum_val = 0
    for i in range(14):
        c = gstin[i]
        if c not in chars:
            return False
        val = chars.index(c)
        multiplier = 1 if i % 2 == 0 else 2
        product = val * multiplier
        sum_val += (product // 36) + (product % 36)
        
    checksum_char = chars[(36 - (sum_val % 36)) % 36]
    return gstin[14] == checksum_char

@router.post("/validate-company", response_model=CompanyValidationResponse)
def validate_company(req: CompanyValidationRequest):
    company_name = req.company_name.strip()
    cin = req.cin.strip().upper()
    gstin = req.gstin.strip().upper()
    
    company_name_valid = True
    cin_valid = True
    gstin_valid = True
    
    company_name_error = None
    cin_error = None
    gstin_error = None
    
    # 1. Validate Company Name
    if not company_name:
        company_name_valid = False
        company_name_error = "Company legal name is required."
        
    # 2. Validate CIN
    if not cin:
        cin_valid = False
        cin_error = "CIN is required."
    elif not re.match(r"^[LU][0-9]{5}[A-Z]{2}[0-9]{4}[A-Z]{3}[0-9]{6}$", cin):
        cin_valid = False
        cin_error = "Please enter a valid CIN."
        
    # 3. Validate GSTIN
    if not gstin:
        gstin_valid = False
        gstin_error = "GSTIN is required."
    elif not re.match(r"^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$", gstin):
        gstin_valid = False
        gstin_error = "Please enter a valid GSTIN format."
    elif not validate_gstin_checksum(gstin):
        gstin_valid = False
        gstin_error = "Please enter a valid GSTIN."
        
    valid = company_name_valid and cin_valid and gstin_valid
    
    return CompanyValidationResponse(
        valid=valid,
        company_name_valid=company_name_valid,
        cin_valid=cin_valid,
        gstin_valid=gstin_valid,
        company_name_error=company_name_error,
        cin_error=cin_error,
        gstin_error=gstin_error,
        verification_type="local_validation"
    )
