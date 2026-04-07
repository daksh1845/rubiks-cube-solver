import cv2
import numpy as np
from PIL import Image
import io
import base64

def detect_face_colors(image_data, face):
    # Decode base64 image
    if ',' in image_data:
        image_data = image_data.split(',')[1]
    
    image_bytes = base64.b64decode(image_data)
    image = Image.open(io.BytesIO(image_bytes))
    image = np.array(image)
    image = cv2.cvtColor(image, cv2.COLOR_RGB2BGR)
    
    # Define color ranges in HSV
    color_ranges = {
        'white': ([0, 0, 200], [180, 30, 255]),
        'yellow': ([20, 100, 100], [30, 255, 255]),
        'orange': ([5, 100, 100], [15, 255, 255]),
        'red': ([0, 100, 100], [5, 255, 255]),
        'green': ([40, 100, 100], [80, 255, 255]),
        'blue': ([90, 100, 100], [120, 255, 255])
    }
    
    hsv = cv2.cvtColor(image, cv2.COLOR_BGR2HSV)
    
    # Divide image into 3x3 grid for 9 stickers
    height, width = image.shape[:2]
    cell_height = height // 3
    cell_width = width // 3
    
    colors = []
    
    for row in range(3):
        for col in range(3):
            y1 = row * cell_height
            y2 = (row + 1) * cell_height
            x1 = col * cell_width
            x2 = (col + 1) * cell_width
            
            roi = hsv[y1:y2, x1:x2]
            avg_hue = np.mean(roi[:, :, 0])
            avg_sat = np.mean(roi[:, :, 1])
            avg_val = np.mean(roi[:, :, 2])
            
            detected_color = 'white'
            
            for color_name, (lower, upper) in color_ranges.items():
                if lower[0] <= avg_hue <= upper[0] and lower[1] <= avg_sat <= upper[1] and lower[2] <= avg_val <= upper[2]:
                    detected_color = color_name
                    break
            
            colors.append(detected_color)
    
    return colors