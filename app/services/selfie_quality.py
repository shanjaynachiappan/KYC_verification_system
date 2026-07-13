import cv2
import numpy as np


def check_face_blur(face_image, threshold=100.0):

    # Convert cropped face image to grayscale
    gray_face = cv2.cvtColor(
        face_image,
        cv2.COLOR_BGR2GRAY
    )

    # Calculate blur score using Laplacian variance
    blur_score = cv2.Laplacian(
        gray_face,
        cv2.CV_64F
    ).var()

    # Check whether face is blurry
    is_blurry = blur_score < threshold

    # Print blur check result in terminal
    print("\n----- FACE BLUR CHECK -----")
    print("Blur Score :", round(float(blur_score), 2))
    print("Threshold  :", threshold)

    if is_blurry:
        print("Result     : FACE IS BLURRY ❌")
    else:
        print("Result     : FACE IS CLEAR ✅")

    print("---------------------------\n")

    # Return blur result
    return {
        "is_blurry": bool(is_blurry),
        "blur_score": round(float(blur_score), 2),
        "threshold": threshold
    }


def check_face_overexposure(
    face_image,
    brightness_threshold=240,
    pixel_percentage_threshold=30.0
):

    # Convert cropped face image to grayscale
    gray_face = cv2.cvtColor(
        face_image,
        cv2.COLOR_BGR2GRAY
    )

    # Count very bright pixels
    bright_pixels = np.sum(
        gray_face >= brightness_threshold
    )

    # Count total pixels in cropped face
    total_pixels = gray_face.size

    # Calculate percentage of very bright pixels
    bright_pixel_percentage = (
        bright_pixels / total_pixels
    ) * 100

    # Check whether face is overexposed
    is_overexposed = (
        bright_pixel_percentage
        >= pixel_percentage_threshold
    )

    # Print overexposure result in terminal
    print("\n----- FACE OVEREXPOSURE CHECK -----")
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
        print("Result                   : FACE IS OVEREXPOSED ❌")
    else:
        print("Result                   : FACE LIGHTING IS ACCEPTABLE ✅")

    print("-----------------------------------\n")

    # Return overexposure result
    return {
        "is_overexposed": bool(is_overexposed),
        "bright_pixel_percentage": round(
            float(bright_pixel_percentage),
            2
        ),
        "brightness_threshold": brightness_threshold,
        "pixel_percentage_threshold": pixel_percentage_threshold
    }