import cv2
import numpy as np


def check_document_blur(image, threshold=100.0):

    # Convert document image to grayscale
    gray_image = cv2.cvtColor(
        image,
        cv2.COLOR_BGR2GRAY
    )

    # Calculate blur score using Laplacian variance
    blur_score = cv2.Laplacian(
        gray_image,
        cv2.CV_64F
    ).var()

    # Check whether document is blurry
    is_blurry = blur_score < threshold

    print("\n----- DOCUMENT BLUR CHECK -----")
    print("Blur Score :", round(float(blur_score), 2))
    print("Threshold  :", threshold)

    if is_blurry:
        print("Result     : DOCUMENT IS BLURRY ❌")
    else:
        print("Result     : DOCUMENT IS CLEAR ✅")

    print("--------------------------------\n")

    return {
        "is_blurry": bool(is_blurry),
        "blur_score": round(float(blur_score), 2),
        "threshold": threshold
    }


def check_document_overexposure(
    image,
    brightness_threshold=240,
    pixel_percentage_threshold=30.0
):

    # Convert document image to grayscale
    gray_image = cv2.cvtColor(
        image,
        cv2.COLOR_BGR2GRAY
    )

    # Count very bright pixels
    bright_pixels = np.sum(
        gray_image >= brightness_threshold
    )

    # Count total pixels
    total_pixels = gray_image.size

    # Calculate bright pixel percentage
    bright_pixel_percentage = (
        bright_pixels / total_pixels
    ) * 100

    # Check whether document is overexposed
    is_overexposed = (
        bright_pixel_percentage
        >= pixel_percentage_threshold
    )

    print("\n----- DOCUMENT OVEREXPOSURE CHECK -----")
    print(
        "Bright Pixel Percentage :",
        round(float(bright_pixel_percentage), 2)
    )
    print(
        "Brightness Threshold     :",
        brightness_threshold
    )
    print(
        "Pixel Percentage Limit   :",
        pixel_percentage_threshold
    )

    if is_overexposed:
        print("Result                   : DOCUMENT IS OVEREXPOSED ❌")
    else:
        print("Result                   : DOCUMENT LIGHTING IS ACCEPTABLE ✅")

    print("---------------------------------------\n")

    return {
        "is_overexposed": bool(is_overexposed),
        "bright_pixel_percentage": round(
            float(bright_pixel_percentage),
            2
        ),
        "brightness_threshold": brightness_threshold,
        "pixel_percentage_threshold": pixel_percentage_threshold
    }