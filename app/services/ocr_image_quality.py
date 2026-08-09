"""
Merged from two branches during integration:
  - check_ocr_image_blur / check_ocr_image_overexposure: original functions,
    still used by app/routers/ocr.py (the generic /ocr/upload endpoint).
  - check_ocr_image_glare / check_resolution / check_image_quality: added
    from the deepfake-detection branch, used by the newer
    app/routers/passport.py and app/routers/payslip.py endpoints.

Kept both APIs intact rather than picking one, since two different routers
depend on two different function sets from this file.
"""
import cv2
import numpy as np


# -------------------------------------------------------
# Blur Detection (used by /ocr/upload, /passport/extract, /payslip/extract)
# -------------------------------------------------------

def check_ocr_image_blur(image, threshold=100.0):
    """
    Detect if the image is blurry using Laplacian variance.
    """
    gray_image = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    blur_score = cv2.Laplacian(gray_image, cv2.CV_64F).var()
    is_blurry = blur_score < threshold

    print("\n----- OCR IMAGE BLUR CHECK -----")
    print("Blur Score :", round(float(blur_score), 2))
    print("Threshold  :", threshold)
    print("Result     :", "IMAGE IS BLURRY" if is_blurry else "IMAGE IS CLEAR")
    print("--------------------------------\n")

    return {
        "is_blurry": bool(is_blurry),
        "blur_score": round(float(blur_score), 2),
        "threshold": threshold,
    }


# -------------------------------------------------------
# Overexposure Detection (used by /ocr/upload -- the original, brightness-
# percentage based check; kept unchanged so the existing router keeps working)
# -------------------------------------------------------

def check_ocr_image_overexposure(image, brightness_threshold=240, pixel_percentage_threshold=30.0):
    gray_image = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    bright_pixels = np.sum(gray_image >= brightness_threshold)
    total_pixels = gray_image.size
    bright_pixel_percentage = (bright_pixels / total_pixels) * 100
    is_overexposed = bright_pixel_percentage >= pixel_percentage_threshold

    print("\n----- OCR IMAGE OVEREXPOSURE CHECK -----")
    print("Bright Pixel Percentage :", round(float(bright_pixel_percentage), 2))
    print("Brightness Threshold     :", brightness_threshold)
    print("Pixel Percentage Limit   :", pixel_percentage_threshold)
    print("Result                   :", "IMAGE IS OVEREXPOSED" if is_overexposed else "IMAGE LIGHTING IS ACCEPTABLE")
    print("-----------------------------------------\n")

    return {
        "is_overexposed": bool(is_overexposed),
        "bright_pixel_percentage": round(float(bright_pixel_percentage), 2),
        "brightness_threshold": brightness_threshold,
        "pixel_percentage_threshold": pixel_percentage_threshold,
    }


# -------------------------------------------------------
# Glare Detection (Temporarily Disabled -- from deepfake branch)
# -------------------------------------------------------

def check_ocr_image_glare(image, brightness_threshold=245, min_glare_area=500, glare_percentage_threshold=8):
    """
    Temporarily disabled. White documents often get detected as glare;
    a better glare detector is still TODO. Kept as a stub so
    check_image_quality()'s shape doesn't change once it's implemented.
    """
    return {
        "is_glare": False,
        "glare_percentage": 0.0,
        "threshold": float(glare_percentage_threshold),
        "bright_region_threshold": int(brightness_threshold),
        "minimum_glare_area": int(min_glare_area),
    }


# -------------------------------------------------------
# Resolution Check (from deepfake branch)
# -------------------------------------------------------

def check_resolution(image, min_width=300, min_height=200):
    h, w = image.shape[:2]
    return {
        "is_low_resolution": bool(w < min_width or h < min_height),
        "width": int(w),
        "height": int(h),
        "minimum_width": int(min_width),
        "minimum_height": int(min_height),
    }


# -------------------------------------------------------
# Combined Quality Check -- used by /passport/extract and /payslip/extract
# -------------------------------------------------------

def check_image_quality(image):
    """
    Runs blur + glare + resolution checks together.
    """
    blur = check_ocr_image_blur(image)
    glare = check_ocr_image_glare(image)
    resolution = check_resolution(image)

    is_valid = (not blur["is_blurry"]) and (not glare["is_glare"]) and (not resolution["is_low_resolution"])

    return {
        "is_valid": bool(is_valid),
        "blur": blur,
        "glare": glare,
        "resolution": resolution,
    }
