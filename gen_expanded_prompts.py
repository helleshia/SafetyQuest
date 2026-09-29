import re, os

files = [
    ('flood_safety.dart', 'flood_safety'),
    ('typhoon_safety.dart', 'typhoon_safety'),
    ('evacuation_drills.dart', 'evacuation_drills'),
    ('stranger_danger.dart', 'stranger_danger'),
    ('cyber_safety.dart', 'cyber_safety'),
    ('road_safety.dart', 'road_safety'),
]

base_dir = r'mobile\lib\features\lessons\modules'
new_tasks = []

for filename, module_name in files:
    filepath = os.path.join(base_dir, filename)
    content = open(filepath, encoding='utf-8').read()
    parts = content.split('StoryPage(')
    for i in range(1, len(parts)):
        part = parts[i]
        title_match = re.search(r"title:\s*'([^']+)'", part)
        text_match = re.search(r"text:\s*'([^']+)'", part, re.DOTALL)
        title = title_match.group(1) if title_match else ''
        text = (text_match.group(1) if text_match else '').replace('\n', ' ').strip()
        new_tasks.append({
            'file': filename,
            'page': i,
            'image_asset': f'assets/modules/{module_name}_p{i}.png',
            'title': title,
            'text': text
        })
    print(f'{filename}: {len(parts)-1} pages')

print(f'Total new tasks: {len(new_tasks)}')

md = '# 3D Image Prompts - Modules 4-11 (Expanded Pages)\n\n'
md += 'Save each image with the exact filename below and drop them in one folder.\n\n---\n\n'

current_file = ''
for t in new_tasks:
    if t['file'] != current_file:
        current_file = t['file']
        md += f'## Module: {current_file}\n\n'
    fname = t['image_asset'].split('/')[-1]
    prompt = f'A 3D isometric cute scene of {t["title"]}: {t["text"]}, claymation style, colorful and vibrant, isolated on a clean white background, kid-friendly UI icon style.'
    md += f'**Page {t["page"]}: {t["title"]}**\n'
    md += f'- Filename: `{fname}`\n'
    md += f'- Prompt:\n  > {prompt}\n\n'

out = r'C:\Users\reyca\.gemini\antigravity\brain\1ce8a496-9fbe-4c35-8ad4-091ca9f221a1\image_prompts_expanded.md'
with open(out, 'w', encoding='utf-8') as f:
    f.write(md)

print('Saved image_prompts_expanded.md')
