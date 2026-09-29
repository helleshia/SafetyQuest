import os, glob, re, json

files = [
    'emergency_basics.dart', 'earthquake.dart', 'fire_safety.dart', 
    'flood_safety.dart', 'typhoon_safety.dart', 'evacuation_drills.dart', 
    'go_bag.dart', 'emergency_comm.dart', 'stranger_danger.dart', 
    'cyber_safety.dart', 'road_safety.dart'
]

base_dir = r'C:\Users\reyca\Downloads\SAFETYQUEST\mobile\lib\features\lessons\modules'
tasks = []

for filename in files:
    filepath = os.path.join(base_dir, filename)
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # We need to find all StoryPage(...) blocks
    # To do this reliably, we can split by 'StoryPage('
    parts = content.split('StoryPage(')
    new_content = parts[0]
    
    module_name = filename.replace('.dart', '')
    
    for i in range(1, len(parts)):
        part = parts[i]
        page_idx = i
        image_asset = f'assets/modules/{module_name}_p{page_idx}.png'
        
        # extract title and text
        title_match = re.search(r"title:\s*'([^']+)'", part)
        text_match = re.search(r"text:\s*'([^']+)'", part)
        
        title = title_match.group(1) if title_match else ""
        text = text_match.group(1) if text_match else ""
        
        tasks.append({
            'file': filename,
            'page': page_idx,
            'image_asset': image_asset,
            'title': title,
            'text': text
        })
        
        # replace props with image.
        # Find the scene: Scene( ... props: [ ... ] )
        # Regex to find props array
        # Note: we only want to replace props inside the StoryPage scene, not simulations
        # But wait, SimSteps also have scenes with props! 
        # The split by 'StoryPage(' means `part` is the rest of the file after StoryPage(
        # We should only replace the first `props: [ ... ],` in `part`.
        
        # Actually, it's safer to use regex to find the Scene inside StoryPage
        part = re.sub(r'(scene:\s*Scene\([^)]*?)(props:\s*\[.*?\])([^)]*\))', 
                      r"\1image: '" + image_asset + r"'\3", 
                      part, count=1, flags=re.DOTALL)
        
        new_content += 'StoryPage(' + part
        
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(new_content)

with open(r'C:\Users\reyca\Downloads\SAFETYQUEST\image_tasks.json', 'w', encoding='utf-8') as f:
    json.dump(tasks, f, indent=2)

print(f"Extracted {len(tasks)} tasks and updated dart files.")
