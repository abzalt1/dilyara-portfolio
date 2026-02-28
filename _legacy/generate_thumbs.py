import os
import json
from PIL import Image

def generate_thumbnails():
    img_dir = "img"
    thumbs_dir = os.path.join(img_dir, "thumbs")
    data_file = "data.json"
    
    if not os.path.exists(thumbs_dir):
        os.makedirs(thumbs_dir)
        
    try:
        with open(data_file, 'r', encoding='utf-8') as f:
            data = json.load(f)
    except FileNotFoundError:
        print(f"Error: {data_file} not found.")
        return
        
    for photo in data['photos']:
        img_path = photo.get('src', photo.get('url'))
        if not img_path:
            continue
        # Strip potential leading './' if present in the data.json paths
        if img_path.startswith('./img/'):
            img_path = img_path[2:]
        if not img_path.startswith('img/'):
            continue
            
        filename = os.path.basename(img_path)
        name, _ = os.path.splitext(filename)
        thumb_filename = f"{name}_thumb.webp"
        thumb_path = os.path.join(thumbs_dir, thumb_filename)
        
        photo['thumb'] = f"img/thumbs/{thumb_filename}"
        
        full_img_path = os.path.join(os.getcwd(), img_path)
        if os.path.exists(full_img_path) and not os.path.exists(os.path.join(os.getcwd(), photo['thumb'])):
            try:
                with Image.open(full_img_path) as im:
                    # Convert to RGB if necessary (e.g. RGBA or P)
                    if im.mode in ("RGBA", "P"):
                        im = im.convert("RGB")
                    im.thumbnail((500, 500))
                    im.save(os.path.join(os.getcwd(), photo['thumb']), "WEBP", quality=80)
                    print(f"Generated thumbnail: {thumb_filename}")
            except Exception as e:
                print(f"Error processing {filename}: {e}")
                
    with open(data_file, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    print("Updated data.json with thumb paths.")

if __name__ == "__main__":
    generate_thumbnails()
