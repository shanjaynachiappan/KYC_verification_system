import os
import cv2

# ===============================================
# CONFIGURATION
# ===============================================

# Save cropped face for debugging
SAVE_FACE = True

# Output directory
OUTPUT_DIR = "app/output"

# Create folder automatically
os.makedirs(OUTPUT_DIR, exist_ok=True)

# ===============================================
# Load Haar Cascade
# ===============================================

face_cascade = cv2.CascadeClassifier(
    cv2.data.haarcascades +
    "haarcascade_frontalface_default.xml"
)

# ===============================================
# Face Detection Function
# ===============================================

def detect_face(image):

    gray_image = cv2.cvtColor(
        image,
        cv2.COLOR_BGR2GRAY
    )

    faces = face_cascade.detectMultiScale(
        gray_image,
        scaleFactor=1.1,
        minNeighbors=5,
        minSize=(100, 100)
    )

    print("\n========== FACE DETECTION ==========")
    print("Faces Detected :", len(faces))

    # ------------------------------------------
    # No Face
    # ------------------------------------------

    if len(faces) == 0:

        print("Result         : NO FACE DETECTED ❌")
        print("====================================\n")

        return {
            "face_found": False,
            "face_count": 0,
            "face_image": None,
            "x": None,
            "y": None,
            "width": None,
            "height": None
        }

    # ------------------------------------------
    # Multiple Faces
    # ------------------------------------------

    if len(faces) > 1:

        print("Result         : MULTIPLE FACES DETECTED ❌")
        print("====================================\n")

        return {
            "face_found": False,
            "face_count": len(faces),
            "face_image": None,
            "x": None,
            "y": None,
            "width": None,
            "height": None
        }

    # ------------------------------------------
    # Exactly One Face
    # ------------------------------------------

    x, y, width, height = faces[0]

    face_image = image[
        y:y + height,
        x:x + width
    ]

    print("Result         : ONE FACE DETECTED ✅")
    print("Face X         :", x)
    print("Face Y         :", y)
    print("Face Width     :", width)
    print("Face Height    :", height)
    print("Face Shape     :", face_image.shape)

    # ------------------------------------------
    # Save Cropped Face
    # ------------------------------------------

    if SAVE_FACE:

        save_path = os.path.join(
            OUTPUT_DIR,
            "cropped_face.jpg"
        )

        cv2.imwrite(
            save_path,
            face_image
        )

        print("Saved Face     :", save_path)

    print("====================================\n")

    return {

        "face_found": True,

        "face_count": 1,

        "face_image": face_image,

        "x": x,

        "y": y,

        "width": width,

        "height": height

    }