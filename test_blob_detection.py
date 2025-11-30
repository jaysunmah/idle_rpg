import numpy as np
from PIL import Image
import sys
import os

def detect_blobs(image_path):
    print(f"Loading {image_path}...")
    try:
        img = Image.open(image_path)
    except Exception as e:
        print(f"Failed to open image: {e}")
        return

    if img.mode != 'RGBA':
        img = img.convert('RGBA')

    pixels = np.array(img)
    alpha = pixels[:, :, 3]
    h, w = alpha.shape
    
    # Threshold
    mask = alpha > 10
    
    # Get all content pixel coordinates
    # argwhere returns (y, x)
    points = np.argwhere(mask)
    print(f"Found {len(points)} content pixels out of {h*w} ({len(points)/(h*w)*100:.1f}%)")
    
    # Convert to set of tuples for random access check
    # Actually, using the mask array for lookups is O(1)
    # Using a separate 'visited' array
    visited = np.zeros_like(mask, dtype=bool)
    
    blobs = []
    
    # Directions: 4-connectivity
    # (dy, dx)
    directions = [(-1, 0), (1, 0), (0, -1), (0, 1)]
    
    for y, x in points:
        if visited[y, x]:
            continue
            
        # Start new blob
        min_y, max_y = y, y
        min_x, max_x = x, x
        
        stack = [(y, x)]
        visited[y, x] = True
        pixel_count = 0
        
        while stack:
            cy, cx = stack.pop()
            pixel_count += 1
            
            min_y = min(min_y, cy)
            max_y = max(max_y, cy)
            min_x = min(min_x, cx)
            max_x = max(max_x, cx)
            
            for dy, dx in directions:
                ny, nx = cy + dy, cx + dx
                
                # Boundary check
                if 0 <= ny < h and 0 <= nx < w:
                    if mask[ny, nx] and not visited[ny, nx]:
                        visited[ny, nx] = True
                        stack.append((ny, nx))
        
        # Filter tiny noise
        if pixel_count > 10:
            blobs.append({
                'bbox': (min_x, min_y, max_x + 1, max_y + 1),
                'count': pixel_count,
                'center': ((min_x + max_x) / 2, (min_y + max_y) / 2)
            })

    print(f"Detected {len(blobs)} blobs.")
    for i, b in enumerate(blobs):
        print(f"Blob {i}: {b['bbox']}, area: {b['count']}")
    
    return blobs

def sort_blobs(blobs):
    # Sort by Y first
    blobs.sort(key=lambda b: b['center'][1])
    
    if not blobs:
        return []

    # Group into rows
    rows = []
    if blobs:
        current_row = [blobs[0]]
        row_y_sum = blobs[0]['center'][1]
        
        # Heuristic for row grouping:
        # If the next sprite's center Y is within some factor of the sprite height of the row average
        # Using a simple distance threshold?
        # Maybe use the height of the previous blob as a reference.
        
        for b in blobs[1:]:
            prev = current_row[-1]
            # If vertical overlap is significant?
            # Or if center Y is close?
            
            # Simple approach: If b.top < prev.bottom - tolerance?
            # But they are sorted by center Y.
            
            # Let's try: if b.center_y is within X pixels of row average center_y
            avg_y = row_y_sum / len(current_row)
            
            # Height of current blob
            h = b['bbox'][3] - b['bbox'][1]
            
            # If deviation is less than half height?
            if abs(b['center'][1] - avg_y) < (h * 0.5): # flexible threshold
                current_row.append(b)
                row_y_sum += b['center'][1]
            else:
                rows.append(current_row)
                current_row = [b]
                row_y_sum = b['center'][1]
        
        rows.append(current_row)
    
    # Sort each row by X
    final_order = []
    for row in rows:
        row.sort(key=lambda b: b['center'][0])
        final_order.extend(row)
        
    return final_order

if __name__ == "__main__":
    path = "public/assets/wizard_casting_spell_spreadsheet.png"
    if len(sys.argv) > 1:
        path = sys.argv[1]
    
    blobs = detect_blobs(path)
    sorted_blobs = sort_blobs(blobs)
    print("Sorted order:")
    for i, b in enumerate(sorted_blobs):
        print(f"Frame {i}: {b['bbox']}")
