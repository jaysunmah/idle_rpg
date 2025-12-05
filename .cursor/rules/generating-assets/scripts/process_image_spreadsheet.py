import sys
import argparse
from pathlib import Path
from PIL import Image
import numpy as np


# --------------------------------------------------------------------------
# Constants
# --------------------------------------------------------------------------
ALPHA_THRESHOLD = 10  # Pixels with alpha below this are considered "empty"
PADDING = 5           # Padding around extracted frames
MIN_COMPONENT_PIXELS = 50  # Minimum pixels for a valid component
KMEANS_MAX_ITERATIONS = 100  # Max iterations for k-means clustering


# --------------------------------------------------------------------------
# Union-Find for connected component detection
# --------------------------------------------------------------------------
class UnionFind:
    def __init__(self):
        self.parent = {}
    
    def find(self, i):
        path = []
        curr = i
        while curr in self.parent and self.parent[curr] != curr:
            path.append(curr)
            curr = self.parent[curr]
        
        if curr not in self.parent:
            self.parent[curr] = curr
            return curr

        for node in path:
            self.parent[node] = curr
            
        return curr
    
    def union(self, i, j):
        root_i = self.find(i)
        root_j = self.find(j)
        if root_i != root_j:
            self.parent[root_i] = root_j


# --------------------------------------------------------------------------
# Frame detection functions
# --------------------------------------------------------------------------
def detect_connected_components(mask):
    """
    Detect connected components in a boolean mask using RLE + Union-Find.
    Returns a list of bounding boxes (left, top, right, bottom).
    """
    h, w = mask.shape
    runs = []
    run_id_counter = 0
    uf = UnionFind()
    
    # Extract runs (horizontal segments of True pixels)
    for y in range(h):
        row = mask[y]
        padded = np.concatenate(([False], row, [False]))
        diff = np.diff(padded.astype(int))
        starts = np.where(diff == 1)[0]
        ends = np.where(diff == -1)[0]
        
        for x0, x1 in zip(starts, ends):
            runs.append({'y': y, 'x0': x0, 'x1': x1, 'id': run_id_counter})
            run_id_counter += 1
            
    # Connect runs between adjacent rows
    runs_by_row = {}
    for r in runs:
        runs_by_row.setdefault(r['y'], []).append(r)
        
    for y in range(h - 1):
        current_rows = runs_by_row.get(y, [])
        next_rows = runs_by_row.get(y + 1, [])
        
        if not current_rows or not next_rows:
            continue
            
        for r1 in current_rows:
            for r2 in next_rows:
                if r1['x0'] < r2['x1'] and r2['x0'] < r1['x1']:
                    uf.union(r1['id'], r2['id'])

    # Group by component root
    components = {}
    for r in runs:
        root = uf.find(r['id'])
        if root not in components:
            components[root] = {
                'min_x': w, 'max_x': 0, 
                'min_y': h, 'max_y': 0, 
                'count': 0
            }
        
        c = components[root]
        c['min_x'] = min(c['min_x'], r['x0'])
        c['max_x'] = max(c['max_x'], r['x1'])
        c['min_y'] = min(c['min_y'], r['y'])
        c['max_y'] = max(c['max_y'], r['y'])
        c['count'] += (r['x1'] - r['x0'])
        
    # Convert to bboxes, filtering tiny noise
    res = []
    for c in components.values():
        if c['count'] > MIN_COMPONENT_PIXELS:
            res.append((c['min_x'], c['min_y'], c['max_x'], c['max_y'] + 1))
            
    return res


def merge_close_bboxes(bboxes, distance=10):
    """
    Merges bounding boxes that are close to each other.
    Repeats until no more merges occur.
    """
    if not bboxes:
        return []

    current = [list(b) for b in bboxes]
    
    while True:
        merged = False
        new_boxes = []
        used = [False] * len(current)
        
        for i in range(len(current)):
            if used[i]:
                continue
                
            l1, t1, r1, b1 = current[i]
            
            for j in range(i + 1, len(current)):
                if used[j]:
                    continue
                    
                l2, t2, r2, b2 = current[j]
                
                h_gap = max(0, max(l1, l2) - min(r1, r2))
                v_gap = max(0, max(t1, t2) - min(b1, b2))
                
                if h_gap <= distance and v_gap <= distance:
                    l1 = min(l1, l2)
                    t1 = min(t1, t2)
                    r1 = max(r1, r2)
                    b1 = max(b1, b2)
                    used[j] = True
                    merged = True
            
            new_boxes.append((l1, t1, r1, b1))
            
        if not merged:
            return [tuple(b) for b in new_boxes]
        
        current = [list(b) for b in new_boxes]


def sort_frames_grid(bboxes):
    """
    Sort bounding boxes in reading order: top-to-bottom, then left-to-right.
    """
    if not bboxes:
        return []

    items = []
    for box in bboxes:
        l, t, r, b = box
        cx = (l + r) / 2
        cy = (t + b) / 2
        items.append({'bbox': box, 'cx': cx, 'cy': cy, 'h': b - t})

    items.sort(key=lambda x: x['cy'])
    
    rows = []
    current_row = [items[0]]
    
    for item in items[1:]:
        row_ys = [i['cy'] for i in current_row]
        avg_y = sum(row_ys) / len(row_ys)
        
        if abs(item['cy'] - avg_y) < (item['h'] * 0.6):
            current_row.append(item)
        else:
            rows.append(current_row)
            current_row = [item]
    
    rows.append(current_row)
    
    final_bboxes = []
    for row in rows:
        row.sort(key=lambda x: x['cx'])
        for item in row:
            final_bboxes.append(item['bbox'])
            
    return final_bboxes


# --------------------------------------------------------------------------
# K-means clustering for fixed frame count detection
# --------------------------------------------------------------------------
def detect_frames_by_count(mask, num_frames):
    """
    Detect exactly `num_frames` pixel masses using a two-step approach:
    1. First detect all connected components (blobs) to preserve connectivity
    2. Then cluster the blobs into `num_frames` groups using k-means on blob centroids
    
    This ensures pixels that are physically connected are never split apart.
    
    Returns:
        bboxes: list of bounding boxes (left, top, right, bottom)
        label_map: 2D array same size as mask, where each pixel has its cluster 
                   label (0 to num_frames-1), or -1 if not part of any cluster
    """
    h, w = mask.shape
    
    # Step 1: Detect all connected components
    print("  Step 1: Detecting connected components...")
    component_bboxes = detect_connected_components(mask)
    
    if not component_bboxes:
        return [], np.full((h, w), -1, dtype=np.int32)
    
    print(f"    Found {len(component_bboxes)} connected components")
    
    # Build a component label map (which component each pixel belongs to)
    # We need to re-run connected components to get pixel-level labels
    component_label_map = _build_component_label_map(mask)
    
    # Get list of unique component IDs and their centroids
    unique_components = []
    for comp_id in np.unique(component_label_map):
        if comp_id == -1:
            continue
        ys, xs = np.where(component_label_map == comp_id)
        if len(xs) > MIN_COMPONENT_PIXELS:
            centroid_x = xs.mean()
            centroid_y = ys.mean()
            unique_components.append({
                'id': comp_id,
                'centroid': np.array([centroid_x, centroid_y]),
                'pixel_count': len(xs),
                'bbox': (xs.min(), ys.min(), xs.max() + 1, ys.max() + 1)
            })
    
    print(f"    {len(unique_components)} components above minimum size threshold")
    
    if len(unique_components) == 0:
        return [], np.full((h, w), -1, dtype=np.int32)
    
    # If we have fewer or equal components than requested frames, each component is its own frame
    if len(unique_components) <= num_frames:
        print(f"    Component count ({len(unique_components)}) <= requested frames ({num_frames})")
        print(f"    Each component becomes its own frame")
        
        label_map = np.full((h, w), -1, dtype=np.int32)
        bboxes = []
        for frame_idx, comp in enumerate(unique_components):
            # Assign all pixels of this component to this frame
            label_map[component_label_map == comp['id']] = frame_idx
            bboxes.append(comp['bbox'])
            print(f"      Frame {frame_idx + 1}: {comp['pixel_count']} pixels, bbox {comp['bbox']}")
        
        return bboxes, label_map
    
    # Step 2: Cluster the component centroids into num_frames groups
    print(f"  Step 2: Clustering {len(unique_components)} components into {num_frames} frames...")
    
    # Get centroids as points array
    centroids_array = np.array([c['centroid'] for c in unique_components])
    
    # Initialize k-means centroids
    kmeans_centroids = _initialize_centroids(centroids_array, num_frames)
    
    # Run k-means on component centroids
    component_labels = np.zeros(len(unique_components), dtype=np.int32)
    
    for iteration in range(KMEANS_MAX_ITERATIONS):
        new_labels = _assign_to_nearest(centroids_array, kmeans_centroids)
        
        if np.array_equal(component_labels, new_labels):
            print(f"    Converged after {iteration + 1} iterations")
            break
        
        component_labels = new_labels
        
        # Update k-means centroids (weighted by pixel count)
        for k in range(num_frames):
            cluster_mask = component_labels == k
            if cluster_mask.any():
                cluster_comps = [unique_components[i] for i in range(len(unique_components)) if cluster_mask[i]]
                total_pixels = sum(c['pixel_count'] for c in cluster_comps)
                weighted_centroid = sum(c['centroid'] * c['pixel_count'] for c in cluster_comps) / total_pixels
                kmeans_centroids[k] = weighted_centroid
    else:
        print(f"    Reached max iterations ({KMEANS_MAX_ITERATIONS})")
    
    # Build final label map and bboxes
    label_map = np.full((h, w), -1, dtype=np.int32)
    frame_pixels = {k: {'xs': [], 'ys': [], 'count': 0} for k in range(num_frames)}
    
    for comp_idx, comp in enumerate(unique_components):
        frame_idx = component_labels[comp_idx]
        # Assign all pixels of this component to this frame
        comp_mask = component_label_map == comp['id']
        label_map[comp_mask] = frame_idx
        
        ys, xs = np.where(comp_mask)
        frame_pixels[frame_idx]['xs'].extend(xs)
        frame_pixels[frame_idx]['ys'].extend(ys)
        frame_pixels[frame_idx]['count'] += len(xs)
    
    # Compute bboxes for each frame
    bboxes = []
    for k in range(num_frames):
        if frame_pixels[k]['count'] > 0:
            xs = np.array(frame_pixels[k]['xs'])
            ys = np.array(frame_pixels[k]['ys'])
            bbox = (xs.min(), ys.min(), xs.max() + 1, ys.max() + 1)
            print(f"    Frame {k + 1}: {frame_pixels[k]['count']} pixels, bbox {bbox}")
            bboxes.append(bbox)
    
    return bboxes, label_map


def _build_component_label_map(mask):
    """
    Build a 2D label map where each pixel has its connected component ID.
    Uses the same Union-Find approach as detect_connected_components.
    """
    h, w = mask.shape
    label_map = np.full((h, w), -1, dtype=np.int32)
    
    # Get runs and union-find structure
    runs = []
    run_id_counter = 0
    uf = UnionFind()
    
    for y in range(h):
        row = mask[y]
        padded = np.concatenate(([False], row, [False]))
        diff = np.diff(padded.astype(int))
        starts = np.where(diff == 1)[0]
        ends = np.where(diff == -1)[0]
        
        for x0, x1 in zip(starts, ends):
            runs.append({'y': y, 'x0': x0, 'x1': x1, 'id': run_id_counter})
            run_id_counter += 1
    
    # Connect runs between adjacent rows
    runs_by_row = {}
    for r in runs:
        runs_by_row.setdefault(r['y'], []).append(r)
    
    for y in range(h - 1):
        current_rows = runs_by_row.get(y, [])
        next_rows = runs_by_row.get(y + 1, [])
        
        if not current_rows or not next_rows:
            continue
        
        for r1 in current_rows:
            for r2 in next_rows:
                if r1['x0'] < r2['x1'] and r2['x0'] < r1['x1']:
                    uf.union(r1['id'], r2['id'])
    
    # Assign each pixel to its component root
    for r in runs:
        root = uf.find(r['id'])
        for x in range(r['x0'], r['x1']):
            label_map[r['y'], x] = root
    
    return label_map


def _initialize_centroids(points, k):
    """
    Initialize centroids using k-means++ algorithm for better initial placement.
    """
    n_points = len(points)
    centroids = np.zeros((k, 2), dtype=np.float64)
    
    # Pick first centroid randomly
    idx = np.random.randint(0, n_points)
    centroids[0] = points[idx]
    
    # Pick remaining centroids with probability proportional to distance squared
    for i in range(1, k):
        # Compute distances to nearest existing centroid
        dists = np.full(n_points, np.inf)
        for j in range(i):
            d = np.sum((points - centroids[j]) ** 2, axis=1)
            dists = np.minimum(dists, d)
        
        # Sample proportional to distance squared
        probs = dists / dists.sum()
        idx = np.random.choice(n_points, p=probs)
        centroids[i] = points[idx]
    
    return centroids


def _assign_to_nearest(points, centroids):
    """
    Assign each point to the nearest centroid.
    Returns array of cluster labels.
    """
    n_points = len(points)
    k = len(centroids)
    
    # Compute distances to all centroids
    dists = np.zeros((n_points, k))
    for i, centroid in enumerate(centroids):
        dists[:, i] = np.sum((points - centroid) ** 2, axis=1)
    
    # Return index of minimum distance
    return np.argmin(dists, axis=1)


# --------------------------------------------------------------------------
# Core functions
# --------------------------------------------------------------------------
def remove_background(img_data: np.ndarray, target_color=(255, 0, 0), tolerance=30) -> np.ndarray:
    """
    Removes the specified background color from image data, making it transparent.
    Returns modified numpy array.
    """
    data = img_data.copy()
    
    r, g, b = data[:,:,0], data[:,:,1], data[:,:,2]
    tr, tg, tb = target_color
    
    mask = (
        (r >= max(0, tr - tolerance)) & (r <= min(255, tr + tolerance)) &
        (g >= max(0, tg - tolerance)) & (g <= min(255, tg + tolerance)) &
        (b >= max(0, tb - tolerance)) & (b <= min(255, tb + tolerance))
    )
    
    data[:,:,3][mask] = 0
    return data


def detect_and_extract_frames(img: Image.Image, merge_distance=10, padding=PADDING, num_frames=None) -> list[tuple]:
    """
    Detects individual frames/sprites in a transparent image.
    
    If num_frames is specified, uses k-means clustering to find exactly that many
    pixel masses and assigns each pixel to its closest mass. Each extracted frame
    will only contain pixels belonging to that mass - all other pixels are zeroed out.
    
    Otherwise, uses connected component detection with merging.
    
    Returns list of (bbox, cropped_image) tuples.
    """
    pixels = np.array(img)
    alpha = pixels[:, :, 3]
    h, w = alpha.shape
    
    # Create mask of non-transparent pixels
    mask = alpha > ALPHA_THRESHOLD
    
    print("Detecting sprite boundaries...")
    
    label_map = None  # Will be set if using k-means clustering
    
    if num_frames is not None and num_frames > 0:
        # Use k-means clustering to find exactly num_frames masses
        print(f"  Using k-means clustering for {num_frames} frames...")
        detected_bboxes, label_map = detect_frames_by_count(mask, num_frames)
    else:
        # Use connected component detection (original method)
        detected_bboxes = detect_connected_components(mask)
        
        # Filter out huge components (likely artifacts)
        total_area = h * w
        filtered_bboxes = []
        for bbox in detected_bboxes:
            l, t, r, b = bbox
            area = (r - l) * (b - t)
            if area < total_area * 0.9:
                filtered_bboxes.append(bbox)
            else:
                print(f"  Ignoring huge component: {bbox} (Area: {area/total_area*100:.1f}%)")
        
        detected_bboxes = filtered_bboxes
        print(f"  Detected {len(detected_bboxes)} connected components")
        
        # Merge close components
        print(f"  Merging components within {merge_distance}px...")
        detected_bboxes = merge_close_bboxes(detected_bboxes, distance=merge_distance)
        print(f"  After merge: {len(detected_bboxes)} frames")
    
    # Sort in reading order and track original cluster indices
    sorted_bboxes = sort_frames_grid(detected_bboxes)
    
    # Build mapping from sorted order back to original cluster index
    bbox_to_cluster = {}
    for cluster_idx, bbox in enumerate(detected_bboxes):
        bbox_to_cluster[bbox] = cluster_idx
    
    # Extract each frame
    results = []
    for bbox in sorted_bboxes:
        left, top, right, bottom = bbox
        
        # Apply padding
        padded_left = max(0, left - padding)
        padded_top = max(0, top - padding)
        padded_right = min(w, right + padding)
        padded_bottom = min(h, bottom + padding)
        
        if label_map is not None:
            # K-means mode: zero out pixels not belonging to this cluster
            cluster_idx = bbox_to_cluster[bbox]
            
            # Create a copy of the image data for this frame
            frame_pixels = pixels.copy()
            
            # Zero out alpha for all pixels NOT in this cluster
            cluster_mask = label_map != cluster_idx
            frame_pixels[:, :, 3][cluster_mask] = 0
            
            # Create image and crop
            frame_full = Image.fromarray(frame_pixels)
            frame_img = frame_full.crop((padded_left, padded_top, padded_right, padded_bottom))
        else:
            # Connected component mode: just crop
            frame_img = img.crop((padded_left, padded_top, padded_right, padded_bottom))
        
        results.append((bbox, frame_img))
    
    return results


def process_spritesheet(
    input_path: Path,
    output_dir: Path,
    num_frames: int,
    target_color=(255, 0, 0),
    tolerance=30,
    merge_distance=10,
    padding=PADDING,
):
    """
    Full pipeline: remove background and extract individual frames.
    
    Args:
        input_path: Path to input spritesheet image
        output_dir: Directory to save extracted frames
        num_frames: Number of frames to detect using k-means clustering
        target_color: Background color to remove (default: red)
        tolerance: Color tolerance for background removal
        merge_distance: Max distance to merge nearby components
        padding: Padding around extracted frames
    """
    print(f"Processing {input_path}...")
    
    try:
        img = Image.open(input_path).convert("RGBA")
    except FileNotFoundError:
        print(f"Error: File not found at {input_path}")
        sys.exit(1)
    
    # Ensure output directory exists
    output_dir.mkdir(parents=True, exist_ok=True)
    
    # Remove background
    print("Removing background...")
    data = np.array(img)
    data = remove_background(data, target_color, tolerance)
    result = Image.fromarray(data)
    
    # Extract frames
    frames = detect_and_extract_frames(result, merge_distance=merge_distance, padding=padding, num_frames=num_frames)
    
    if not frames:
        print("Warning: No frames detected!")
        return result, []
    
    # Save frames directly to output directory
    print(f"\nExtracting {len(frames)} frames to {output_dir}/")
    print("-" * 40)
    
    saved_paths = []
    for i, (bbox, frame_img) in enumerate(frames):
        filename = f"frame_{i+1}.png"
        frame_path = output_dir / filename
        frame_img.save(frame_path)
        
        w, h = frame_img.size
        l, t, r, b = bbox
        print(f"  Frame {i+1}: bbox ({int(l)}, {int(t)}, {int(r)}, {int(b)}) -> {w}x{h}px")
        print(f"           Saved: {frame_path}")
        saved_paths.append(frame_path)
    
    print("-" * 40)
    print(f"Extraction complete! {len(frames)} frames saved.")
    return result, saved_paths


def main():
    parser = argparse.ArgumentParser(
        description="Remove background color from spritesheet and extract individual frames.",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  # Basic usage - extract 5 frames from spritesheet
  python process_image_spreadsheet.py spritesheet.png ./output 5
  
  # With optional parameters
  python process_image_spreadsheet.py spritesheet.png ./output 5 -m 20 -p 10

Output structure:
  ./output/
    frame_1.png
    frame_2.png
    ...
"""
    )
    parser.add_argument("input_image", type=Path,
                        help="Path to the input image file")
    parser.add_argument("output_dir", type=Path,
                        help="Directory to save extracted frames")
    parser.add_argument("num_frames", type=int,
                        help="Number of frames to detect using k-means clustering")
    parser.add_argument("-t", "--tolerance", type=int, default=50,
                        help="Color tolerance for background removal (default: 30)")
    parser.add_argument("-m", "--merge-distance", type=int, default=10,
                        help="Max distance to merge nearby components (default: 10)")
    parser.add_argument("-p", "--padding", type=int, default=PADDING,
                        help=f"Padding around extracted frames (default: {PADDING})")
    
    args = parser.parse_args()
    
    process_spritesheet(
        input_path=args.input_image.resolve(),
        output_dir=args.output_dir.resolve(),
        num_frames=args.num_frames,
        tolerance=args.tolerance,
        merge_distance=args.merge_distance,
        padding=args.padding,
    )


if __name__ == "__main__":
    main()
