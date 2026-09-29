import os
from rembg import remove
from PIL import Image

image_path = r"C:\Users\reyca\.gemini\antigravity\brain\223065fc-9442-4e67-bd04-38587bb4910a\earthquake_p4_1790402906503.png"
out_path = r"C:\Users\reyca\Downloads\SAFETYQUEST\mobile\assets\modules\earthquake_p4.png"

os.makedirs(os.path.dirname(out_path), exist_ok=True)
if os.path.exists(image_path):
    print(f"Processing {image_path}")
    input_image = Image.open(image_path)
    output_image = remove(input_image)
    output_image.save(out_path, "PNG")
    print(f"Saved to {out_path}")
else:
    print("Image not found.")
