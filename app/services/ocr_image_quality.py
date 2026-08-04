import cv2


# -------------------------------------------------------
# Blur Detection
# -------------------------------------------------------

def check_ocr_image_blur(image, threshold=100):
    """
    Detect if the image is blurry using Laplacian variance.
    """

    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)

    blur_score = cv2.Laplacian(gray, cv2.CV_64F).var()

    return {
        "is_blurry": bool(blur_score < threshold),
        "blur_score": float(round(blur_score, 2)),
        "threshold": int(threshold)
    }


# -------------------------------------------------------
# Glare Detection (Temporarily Disabled)
# -------------------------------------------------------

def check_ocr_image_glare(
    image,
    brightness_threshold=245,
    min_glare_area=500,
    glare_percentage_threshold=8
):
    """
    Temporarily disable glare detection.

    White documents often get detected as glare.
    We will implement a better glare detector later.
    """

    return {
        "is_glare": False,
        "glare_percentage": 0.0,
        "threshold": float(glare_percentage_threshold),
        "bright_region_threshold": int(brightness_threshold),
        "minimum_glare_area": int(min_glare_area)
    }


# -------------------------------------------------------
# Resolution Check
# -------------------------------------------------------

def check_resolution(
    image,
    min_width=300,
    min_height=200
):
    """
    Check whether the uploaded image has sufficient resolution.
    """

    h, w = image.shape[:2]

    return {
        "is_low_resolution": bool(
            w < min_width or h < min_height
        ),
        "width": int(w),
        "height": int(h),
        "minimum_width": int(min_width),
        "minimum_height": int(min_height)
    }


# -------------------------------------------------------
# Final Quality Check
# -------------------------------------------------------

def check_image_quality(image):
    """
    Run all quality checks.
    """

    blur = check_ocr_image_blur(image)

    glare = check_ocr_image_glare(image)

    resolution = check_resolution(image)

    is_valid = (
        (not blur["is_blurry"])
        and
        (not glare["is_glare"])
        and
        (not resolution["is_low_resolution"])
    )

    return {
        "is_valid": bool(is_valid),
        "blur": blur,
        "glare": glare,
        "resolution": resolution
    }