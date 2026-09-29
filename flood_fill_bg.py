import os
import cv2
import numpy as np

def remove_outer_bg(image_path):
    # Load image with alpha if available
    img = cv2.imread(image_path, cv2.IMREAD_UNCHANGED)
    if img is None:
        return
        
    if img.shape[2] == 3:
        b, g, r = cv2.split(img)
        a = np.ones(b.shape, dtype=b.dtype) * 255
        img = cv2.merge((b, g, r, a))

    h, w = img.shape[:2]
    
    # Floodfill background from top-left, top-right, bottom-left, bottom-right corners
    mask = np.zeros((h + 2, w + 2), np.uint8)
    
    # Convert BGR for floodFill check
    bgr = cv2.cvtColor(img, cv2.COLOR_BGRA2BGR)
    
    # Flood fill corners
    corners = [(0, 0), (w - 1, 0), (0, h - 1), (w - 1, h - 1), (10, 10), (w - 10, 10)]
    for pt in corners:
        cv2.floodFill(bgr, mask, pt, (0, 0, 0), (15, 15, 15), (15, 15, 15), flags=4 | (255 << 8) | cv2.FLOODFILL_MASK_ONLY)
    
    # mask is 255 for outer background
    outer_bg = mask[1:-1, 1:-1] == 255
    
    # Set alpha of outer background to 0
    img[outer_bg, 3] = 0
    
    cv2.imwrite(image_path, img)
    print(f"Flood-fill cleaned: {image_path}")

# Re-copy raw generated images first then flood-fill clean them
import shutil
shutil.copyfile(r"C:\Users\reyca\.gemini\antigravity\brain\105aa5b6-2134-4dbc-bf40-e6fe94d1934c\icon_book_clay_1790178415951.jpg", r"C:\Users\reyca\Downloads\SAFETYQUEST\mobile\assets\cool_book.png")
shutil.copyfile(r"C:\Users\reyca\.gemini\antigravity\brain\105aa5b6-2134-4dbc-bf40-e6fe94d1934c\icon_student_clay_1790178479369.jpg", r"C:\Users\reyca\Downloads\SAFETYQUEST\mobile\assets\cool_student.png")
shutil.copyfile(r"C:\Users\reyca\.gemini\antigravity\brain\105aa5b6-2134-4dbc-bf40-e6fe94d1934c\icon_trophy_clay_1790178458050.jpg", r"C:\Users\reyca\Downloads\SAFETYQUEST\mobile\assets\cool_trophy.png")

assets = [
    r"C:\Users\reyca\Downloads\SAFETYQUEST\mobile\assets\cool_book.png",
    r"C:\Users\reyca\Downloads\SAFETYQUEST\mobile\assets\cool_student.png",
    r"C:\Users\reyca\Downloads\SAFETYQUEST\mobile\assets\cool_trophy.png",
]

for asset in assets:
    remove_outer_bg(asset)
