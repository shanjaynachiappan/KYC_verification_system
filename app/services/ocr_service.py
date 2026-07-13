from paddleocr import PaddleOCR


# Create PaddleOCR object
ocr = PaddleOCR(
    lang="en",
    use_doc_orientation_classify=False,
    use_doc_unwarping=False,
    use_textline_orientation=False
)


def extract_text_from_document(image):

    # Run OCR on document image
    results = ocr.predict(image)

    extracted_text = []

    # Read OCR results
    for result in results:

        result_data = result.json

        texts = result_data["res"]["rec_texts"]

        for text in texts:
            extracted_text.append(text)

    # Combine extracted text
    full_text = "\n".join(extracted_text)

    print("\n----- DOCUMENT OCR -----")
    print("Extracted Text:")
    print(full_text)
    print("------------------------\n")

    return {
        "text_found": len(extracted_text) > 0,
        "extracted_text": extracted_text,
        "full_text": full_text
    }