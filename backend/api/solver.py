import kociemba

def convert_to_kociemba_string(cube_state):
    color_to_char = {
        'white': 'U',
        'yellow': 'D',
        'orange': 'L',
        'red': 'R',
        'green': 'F',
        'blue': 'B'
    }
    
    order = ['U', 'R', 'F', 'D', 'L', 'B']
    result = []
    
    for face in order:
        face_colors = cube_state[face]
        for color in face_colors:
            result.append(color_to_char[color])
    
    return ''.join(result)

def get_solution(cube_state):
    try:
        # Check if cube is already solved
        is_solved = True
        for face in cube_state:
            first_color = cube_state[face][0]
            if not all(color == first_color for color in cube_state[face]):
                is_solved = False
                break
        
        if is_solved:
            return {"success": True, "solution": ""}
        
        kociemba_string = convert_to_kociemba_string(cube_state)
        solution = kociemba.solve(kociemba_string)
        return {"success": True, "solution": solution}
    except kociemba.InvalidCubeError:
        return {"success": False, "error": "Invalid cube state - please check your colors (each face must have exactly 9 stickers of valid colors)"}
    except kociemba.Error as e:
        return {"success": False, "error": f"Solving error: {str(e)}"}
    except Exception as e:
        return {"success": False, "error": f"Unexpected error: {str(e)}"}