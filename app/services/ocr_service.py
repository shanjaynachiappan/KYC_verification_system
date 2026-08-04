from paddleocr import PaddleOCR

# --------------------------------------------
# Initialize PaddleOCR (Only Once)
# --------------------------------------------

ocr = PaddleOCR(
    lang="en"
)


# --------------------------------------------
# OCR Extraction Function
# --------------------------------------------

def extract_text_from_image(image):
    """
    Extract text from the uploaded image using PaddleOCR.

    Parameters
    ----------
    image : numpy.ndarray

    Returns
    -------
    {
        "text_found": bool,
        "extracted_text": list,
        "full_text": str,
        "error": str (optional)
    }
    """

    print("\n========== STARTING PADDLE OCR ==========\n")

    try:

        # ------------------------------------
        # Run OCR
        # ------------------------------------

        result = ocr.predict(image)

        extracted_text = []

        # ------------------------------------
        # Parse OCR Result
        # ------------------------------------

        for page in result:

            if not hasattr(page, "json"):
                continue

            result_data = page.json

            if "res" not in result_data:
                continue

            recognition_texts = result_data["res"].get(
                "rec_texts",
                []
            )

            for text in recognition_texts:

                if text is None:
                    continue

                text = text.strip()

                if text:
                    extracted_text.append(text)

        # ------------------------------------
        # Join Text
        # ------------------------------------

        full_text = "\n".join(extracted_text)

        # ------------------------------------
        # Debug Output
        # ------------------------------------

        print("---------- OCR RESULT ----------")

        print(
            "Number of Text Lines :",
            len(extracted_text)
        )

        if extracted_text:

            for index, line in enumerate(
                extracted_text,
                start=1
            ):

                print(f"{index}. {line}")

            print("\nOCR Status : TEXT DETECTED ✅")

        else:

            print("\nOCR Status : NO TEXT DETECTED ❌")

        print("--------------------------------\n")

        # ------------------------------------
        # Return Result
        # ------------------------------------

        return {

            "text_found": len(extracted_text) > 0,

            "extracted_text": extracted_text,

            "full_text": full_text

        }

    except Exception as error:

        print("\n========== OCR ERROR ==========")

        print(str(error))

        print("===============================\n")

        return {

            "text_found": False,

            "extracted_text": [],

            "full_text": "",

            "error": str(error)

        }