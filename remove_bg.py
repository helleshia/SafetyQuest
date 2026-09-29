import rembg
from PIL import Image
import os

files = [
    r'C:\Users\reyca\Downloads\SAFETYQUEST\mobile\assets\modules\comm_3d.png',
    r'C:\Users\reyca\Downloads\SAFETYQUEST\mobile\assets\modules\stranger_3d.png',
    r'C:\Users\reyca\Downloads\SAFETYQUEST\mobile\assets\modules\cyber_3d.png',
    r'C:\Users\reyca\Downloads\SAFETYQUEST\mobile\assets\modules\road_3d.png',
]

for file in files:
    if os.path.exists(file):
        try:
            print(f"Processing {file}...")
            with open(file, 'rb') as f:
                input_data = f.read()
            output_data = rembg.remove(input_data)
            with open(file, 'wb') as f:
                f.write(output_data)
            print(f"Success for {file}")
        except Exception as e:
            print(f"Error on {file}: {e}")
    else:
        print(f"File not found: {file}")
