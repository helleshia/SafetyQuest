import json

with open(r'C:\Users\reyca\Downloads\SAFETYQUEST\image_tasks.json', 'r', encoding='utf-8') as f:
    tasks = json.load(f)

md_content = "# 🎨 3D Image Prompts for Story Pages\n\n"
md_content += "Here are the prompts you can use in Midjourney, DALL-E, or other AI image generators. Once you have generated the images, save them using the exact **Filename** provided below, and we can easily integrate them into the app.\n\n"
md_content += "---\n\n"

current_file = ""
for task in tasks:
    if task['file'] != current_file:
        current_file = task['file']
        md_content += f"## 📖 Module: `{current_file}`\n\n"
    
    filename = task['image_asset'].split('/')[-1]
    prompt = f"A 3D isometric cute scene of {task['title']}: {task['text']}, claymation style, colorful and vibrant, isolated on a clean white background, UI icon style."
    
    md_content += f"**Page {task['page']}: {task['title']}**\n"
    md_content += f"- **Filename**: `{filename}`\n"
    md_content += f"- **Prompt**: \n  > {prompt}\n\n"

with open(r'C:\Users\reyca\.gemini\antigravity\brain\1ce8a496-9fbe-4c35-8ad4-091ca9f221a1\image_prompts.md', 'w', encoding='utf-8') as f:
    f.write(md_content)

print("Generated markdown artifact.")
