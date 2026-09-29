from PIL import Image
import os

base = os.path.join(os.path.dirname(__file__), "..", "assets", "modules")
files = [
    "household_layer_medicine.png",
    "household_layer_cleaner.png",
    "household_layer_cord.png",
    "household_layer_puddle.png",
    "household_layer_candle.png",
    "household_layer_knife.png",
    "household_layer_kettle.png",
]


def content_bbox(im: Image.Image):
    px = im.load()
    w, h = im.size
    minx, miny, maxx, maxy = w, h, -1, -1
    for y in range(h):
        for x in range(w):
            r, g, b, a = px[x, y]
            if a < 12:
                continue
            if r < 18 and g < 18 and b < 18:
                continue
            minx = min(minx, x)
            miny = min(miny, y)
            maxx = max(maxx, x)
            maxy = max(maxy, y)
    if maxx < 0:
        return None
    pad = 4
    return (
        max(0, minx - pad),
        max(0, miny - pad),
        min(w, maxx + 1 + pad),
        min(h, maxy + 1 + pad),
    )


for name in files:
    path = os.path.join(base, name)
    im = Image.open(path).convert("RGBA")
    px = im.load()
    w, h = im.size
    for y in range(h):
        for x in range(w):
            r, g, b, a = px[x, y]
            if r < 18 and g < 18 and b < 18:
                px[x, y] = (0, 0, 0, 0)
    box = content_bbox(im)
    print(f"{name}: size={im.size} bbox={box}")
    if box:
        cropped = im.crop(box)
        cropped.save(path)
        print(f"  saved {cropped.size}")
