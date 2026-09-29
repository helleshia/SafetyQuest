"""Debug helper for household hazard hunt placements."""
from PIL import Image, ImageDraw
import os

base_dir = os.path.join(os.path.dirname(__file__), "..", "assets", "modules")
tools = os.path.dirname(__file__)

# Matches household_electricity.dart _hazardHotspots.
spots = [
    ("knife", 0.28, 0.34, 0.14, 0.08, (80, 80, 80, 120)),
    ("candle", 0.42, 0.24, 0.08, 0.14, (255, 220, 40, 120)),
    ("cord", 0.08, 0.22, 0.30, 0.16, (200, 40, 40, 120)),
    ("cleaner", 0.16, 0.52, 0.12, 0.16, (255, 80, 180, 120)),
    ("wet_floor", 0.28, 0.62, 0.16, 0.12, (40, 120, 255, 120)),
    ("kettle", 0.52, 0.22, 0.14, 0.16, (255, 100, 40, 120)),
]

im = Image.open(os.path.join(base_dir, "household_hazards_scene.png")).convert("RGBA")
W, H = im.size
print(f"scene {W}x{H}")

out = im.copy()
draw = ImageDraw.Draw(out, "RGBA")
for name, x, y, w, h, color in spots:
    box = [x * W, y * H, (x + w) * W, (y + h) * H]
    draw.rectangle(box, fill=color, outline=(0, 0, 0, 220), width=3)
    draw.text((box[0] + 4, box[1] + 4), name, fill=(0, 0, 0, 255))
    print(f"{name}: ({x:.2f},{y:.2f})-({x+w:.2f},{y+h:.2f})")

out.convert("RGB").save(os.path.join(tools, "household_hotspot_debug.png"), quality=92)
im.convert("RGB").save(os.path.join(tools, "household_hazard_preview.png"), quality=92)
print("wrote debug + preview")
