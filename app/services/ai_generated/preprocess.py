from PIL import Image
import numpy as np


def preprocess_image(image: np.ndarray) -> Image.Image:
    """
    Convert OpenCV image (BGR) to PIL RGB image.

    Parameters:
        image (np.ndarray): OpenCV image

    Returns:
        PIL.Image.Image
    """

    # Convert BGR → RGB
    image = image[:, :, ::-1]

    # Convert to PIL Image
    image = Image.fromarray(image)

    return image