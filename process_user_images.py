import os
import rembg

src_dir = r"C:\Users\reyca\Downloads\image\module 1"
dest_dir = r"C:\Users\reyca\Downloads\SAFETYQUEST\mobile\assets\modules"

mapping = {
    "Gemini_Generated_Image_f3bguef3bguef3bg.jpg": "emergency_basics_p1.png",
    "image 2.jpg": "emergency_basics_p2.png",
    "emergency_basics_p3.png": "emergency_basics_p3.png",
    "emergency_basics_p4.png": "emergency_basics_p4.png",
    "emergency_basics_p5.png": "emergency_basics_p5.png",
    "emergency_basics_p6.png": "emergency_basics_p6.png",
    "emergency_basics_p7.png": "emergency_basics_p7.png"
}

os.makedirs(dest_dir, exist_ok=True)

for src_name, dest_name in mapping.items():
    src_path = os.path.join(src_dir, src_name)
    dest_path = os.path.join(dest_dir, dest_name)
    
    if os.path.exists(src_path):
        print(f"Processing {src_name} -> {dest_name}...")
        try:
            with open(src_path, "rb") as f:
                input_data = f.read()
            
            output_data = rembg.remove(input_data)
            
            with open(dest_path, "wb") as f:
                f.write(output_data)
            print(f"Success: {dest_name}")
        except Exception as e:
            print(f"Error processing {src_name}: {e}")
    else:
        print(f"Warning: {src_name} not found.")

print("All done!")
