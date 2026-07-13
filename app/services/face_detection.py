import cv2


# Load OpenCV Haar Cascade face detector
face_cascade = cv2.CascadeClassifier(
    cv2.data.haarcascades
    + "haarcascade_frontalface_default.xml"
)


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

    print("\n----- FACE DETECTION -----")
    print("Faces Detected :", len(faces))

    if len(faces) == 0:
        print("Result         : NO FACE DETECTED ❌")
        print("--------------------------\n")

        return {
            "face_found": False,
            "face_count": 0,
            "face_image": None
        }

    if len(faces) > 1:
        print("Result         : MULTIPLE FACES DETECTED ❌")
        print("--------------------------\n")

        return {
            "face_found": False,
            "face_count": len(faces),
            "face_image": None
        }

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
    print("--------------------------\n")

    return {
        "face_found": True,
        "face_count": 1,
        "face_image": face_image
    }