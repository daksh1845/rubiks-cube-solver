from rest_framework.decorators import api_view
from rest_framework.response import Response
from .solver import get_solution
from .color_detection import detect_face_colors

@api_view(['POST'])
def solve_cube(request):
    cube_state = request.data
    result = get_solution(cube_state)
    return Response(result)

@api_view(['POST'])
def detect_face(request):
    image_data = request.data.get('image')
    face = request.data.get('face')
    
    if not image_data:
        return Response({'success': False, 'error': 'No image provided'})
    
    try:
        colors = detect_face_colors(image_data, face)
        return Response({'success': True, 'colors': colors})
    except Exception as e:
        return Response({'success': False, 'error': str(e)})