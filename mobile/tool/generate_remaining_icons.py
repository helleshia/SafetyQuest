"""Create the last four transparent clay-style module icons locally."""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFilter

OUT = Path(__file__).resolve().parents[1] / "assets" / "modules"
S = 640
SCALE = 3


def canvas():
    return Image.new("RGBA", (S * SCALE, S * SCALE), (0, 0, 0, 0))


def rounded(draw, box, radius, fill, outline=None, width=1):
    box = tuple(int(v * SCALE) for v in box)
    draw.rounded_rectangle(box, radius=int(radius * SCALE), fill=fill, outline=outline, width=int(width * SCALE))


def shadow(base, box, radius=28, blur=18):
    layer = Image.new("RGBA", base.size, (0, 0, 0, 0))
    d = ImageDraw.Draw(layer)
    rounded(d, box, radius, (66, 46, 67, 90))
    layer = layer.filter(ImageFilter.GaussianBlur(blur * SCALE))
    base.alpha_composite(layer, (12 * SCALE, 18 * SCALE))


def downsample(im):
    return im.resize((S, S), Image.Resampling.LANCZOS)


def comm():
    im = canvas(); d = ImageDraw.Draw(im)
    shadow(im, (145, 155, 480, 495), 110)
    rounded(d, (160, 170, 455, 485), 105, (92, 143, 182, 255))
    rounded(d, (182, 190, 430, 457), 86, (126, 174, 205, 255))
    # handset
    rounded(d, (220, 235, 395, 420), 56, (241, 135, 112, 255))
    rounded(d, (193, 220, 275, 304), 34, (241, 135, 112, 255))
    rounded(d, (340, 350, 422, 435), 34, (241, 135, 112, 255))
    rounded(d, (215, 233, 277, 274), 20, (238, 214, 167, 255))
    rounded(d, (341, 381, 403, 422), 20, (238, 214, 167, 255))
    rounded(d, (255, 255, 370, 398), 35, (241, 135, 112, 255))
    # speech bubble
    rounded(d, (330, 70, 560, 220), 40, (247, 224, 185, 255))
    d.polygon([(390*SCALE, 215*SCALE), (425*SCALE, 215*SCALE), (400*SCALE, 255*SCALE)], fill=(247, 224, 185, 255))
    for x in (395, 445, 495):
        d.ellipse(((x-12)*SCALE, 130*SCALE, (x+12)*SCALE, 154*SCALE), fill=(244, 190, 75, 255))
    d.arc((175*SCALE, 165*SCALE, 265*SCALE, 255*SCALE), 190, 280, fill=(255,255,255,150), width=8*SCALE)
    return downsample(im)


def stranger():
    im = canvas(); d = ImageDraw.Draw(im)
    shadow(im, (135, 90, 505, 545), 90)
    d.polygon([(320*SCALE, 70*SCALE),(515*SCALE,150*SCALE),(480*SCALE,390*SCALE),(320*SCALE,545*SCALE),(160*SCALE,390*SCALE),(125*SCALE,150*SCALE)], fill=(227,111,99,255))
    d.polygon([(320*SCALE, 95*SCALE),(478*SCALE,160*SCALE),(448*SCALE,370*SCALE),(320*SCALE,500*SCALE),(192*SCALE,370*SCALE),(162*SCALE,160*SCALE)], fill=(157,211,183,255))
    # raised palm
    rounded(d, (252, 253, 387, 435), 40, (247, 224, 185, 255))
    for box in ((227,195,267,340),(263,160,303,334),(300,145,340,334),(337,175,377,342)):
        rounded(d, box, 20, (247,224,185,255))
    rounded(d, (268, 365, 368, 442), 32, (247,224,185,255))
    d.ellipse((421*SCALE, 398*SCALE, 493*SCALE, 470*SCALE), fill=(244,190,75,255))
    d.line([(440*SCALE,433*SCALE),(454*SCALE,447*SCALE),(478*SCALE,417*SCALE)], fill=(119,94,82,255), width=10*SCALE, joint="curve")
    return downsample(im)


def cyber():
    im = canvas(); d = ImageDraw.Draw(im)
    shadow(im, (95, 165, 545, 500), 38)
    rounded(d, (95, 170, 545, 465), 34, (91, 139, 180, 255))
    rounded(d, (125, 200, 515, 425), 22, (247, 224, 185, 255))
    d.polygon([(90*SCALE,470*SCALE),(550*SCALE,470*SCALE),(585*SCALE,510*SCALE),(55*SCALE,510*SCALE)], fill=(65,91,120,255))
    # shield and lock
    d.polygon([(320*SCALE,155*SCALE),(470*SCALE,210*SCALE),(445*SCALE,350*SCALE),(320*SCALE,445*SCALE),(195*SCALE,350*SCALE),(170*SCALE,210*SCALE)], fill=(230,117,101,255))
    d.polygon([(320*SCALE,178*SCALE),(445*SCALE,220*SCALE),(422*SCALE,335*SCALE),(320*SCALE,413*SCALE),(218*SCALE,335*SCALE),(195*SCALE,220*SCALE)], fill=(166,216,187,255))
    rounded(d, (278, 255, 363, 355), 17, (244,190,75,255))
    d.arc((287*SCALE, 218*SCALE, 354*SCALE, 285*SCALE), 180, 360, fill=(244,190,75,255), width=18*SCALE)
    d.ellipse((314*SCALE, 290*SCALE, 327*SCALE, 303*SCALE), fill=(119,94,82,255))
    return downsample(im)


def road():
    im = canvas(); d = ImageDraw.Draw(im)
    shadow(im, (115, 85, 525, 545), 45)
    rounded(d, (130, 80, 365, 445), 48, (91, 139, 180, 255))
    rounded(d, (158, 108, 337, 415), 36, (68, 91, 119, 255))
    for y, color in ((158,(226,107,96,255)),(250,(244,190,75,255)),(342,(133,205,153,255))):
        d.ellipse((195*SCALE,y*SCALE,300*SCALE,(y+105)*SCALE), fill=color)
    rounded(d, (285, 400, 340, 560), 18, (247,224,185,255))
    rounded(d, (350, 410, 575, 545), 24, (92, 143, 182,255))
    for x in (380, 425, 470, 515):
        rounded(d, (x, 425, x+25, 530), 8, (247,224,185,255))
    d.ellipse((423*SCALE, 80*SCALE, 483*SCALE, 140*SCALE), fill=(244,190,75,255))
    d.line([(438*SCALE,110*SCALE),(454*SCALE,126*SCALE),(477*SCALE,96*SCALE)], fill=(119,94,82,255), width=8*SCALE)
    return downsample(im)


for name, make in (("comm_3d.png", comm), ("stranger_3d.png", stranger), ("cyber_3d.png", cyber), ("road_3d.png", road)):
    OUT.mkdir(parents=True, exist_ok=True)
    make().save(OUT / name, optimize=True)
