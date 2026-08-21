from paddleocr import PaddleOCR


# Initialize PaddleOCR only once
ocr = PaddleOCR(
    lang="en"
)


def extract_text_from_image(image):

    print("\n----- STARTING PADDLE OCR -----")

    try:
        # Run PaddleOCR
        result = ocr.predict(image)

        extracted_text = []

        # Read every OCR result
        for ocr_result in result:

            result_data = ocr_result.json

            # Check whether OCR result contains "res"
            if "res" not in result_data:
                continue

            # Get recognized text lines
            recognition_texts = result_data["res"].get(
                "rec_texts",
                []
            )

            # Store every valid text line
            for text in recognition_texts:

                if text and text.strip():
                    extracted_text.append(
                        text.strip()
                    )

        # Join all text lines
        full_text = "\n".join(extracted_text)

        print("\n----- OCR TEXT EXTRACTION -----")
        print("Text Lines Found :", len(extracted_text))

        if extracted_text:

            for index, text in enumerate(
                extracted_text,
                start=1
            ):
                print(
                    f"{index}. {text}"
                )

            print("Result           : TEXT DETECTED ✅")

        else:
            print("Result           : NO TEXT DETECTED ❌")

        print("--------------------------------")

        return {
            "text_found": len(extracted_text) > 0,
            "extracted_text": extracted_text,
            "full_text": full_text
        }

    except Exception as error:

        print("\n----- OCR ERROR -----")
        print("Error :", str(error))
        print("---------------------\n")

        return {
            "text_found": False,
            "extracted_text": [],
            "full_text": "",
            "error": str(error)
        }