import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const CubeInput = () => {
  const navigate = useNavigate();
  
  const solvedState = {
    U: Array(9).fill('white'),
    D: Array(9).fill('yellow'),
    L: Array(9).fill('orange'),
    R: Array(9).fill('red'),
    F: Array(9).fill('green'),
    B: Array(9).fill('blue')
  };

  const [cubeState, setCubeState] = useState(solvedState);

  const [loading, setLoading] = useState(false);
  const [openPicker, setOpenPicker] = useState({ face: null, index: null });
  const pickerRef = useRef(null);

  const colorOptions = ['white', 'yellow', 'orange', 'red', 'green', 'blue'];

  const colorMap = {
    white: '#ffffff',
    yellow: '#ffff00',
    orange: '#ffa500',
    red: '#ff0000',
    green: '#00ff00',
    blue: '#0000ff'
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (pickerRef.current && !pickerRef.current.contains(event.target)) {
        setOpenPicker({ face: null, index: null });
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const [isSolved, setIsSolved] = useState(false);

  useEffect(() => {
    const solved = Object.keys(cubeState).every(face => {
      const firstColor = cubeState[face][0];
      return cubeState[face].every(color => color === firstColor);
    });
    setIsSolved(solved);
  }, [cubeState]);

  const handleStickerClick = (face, index) => {
    if (openPicker.face === face && openPicker.index === index) {
      setOpenPicker({ face: null, index: null });
    } else {
      setOpenPicker({ face, index });
    }
  };

  const handleColorChange = (face, index, color) => {
    const newCubeState = { ...cubeState };
    newCubeState[face][index] = color;
    setCubeState(newCubeState);
    setOpenPicker({ face: null, index: null });
  };

  // ✅ FULL VALID MOVE LOGIC
  const applyMove = (state, move) => {
    const newState = JSON.parse(JSON.stringify(state));

    const rotateFace = (f) => {
      const t = [...newState[f]];
      newState[f][0]=t[6]; newState[f][1]=t[3]; newState[f][2]=t[0];
      newState[f][3]=t[7]; newState[f][4]=t[4]; newState[f][5]=t[1];
      newState[f][6]=t[8]; newState[f][7]=t[5]; newState[f][8]=t[2];
    };

    if (move === 'U') {
      rotateFace('U');
      const t = [...newState.F.slice(0,3)];
      newState.F.splice(0,3,...newState.R.slice(0,3));
      newState.R.splice(0,3,...newState.B.slice(0,3));
      newState.B.splice(0,3,...newState.L.slice(0,3));
      newState.L.splice(0,3,...t);
    }

    if (move === 'D') {
      rotateFace('D');
      const t = [...newState.F.slice(6,9)];
      newState.F.splice(6,3,...newState.L.slice(6,9));
      newState.L.splice(6,3,...newState.B.slice(6,9));
      newState.B.splice(6,3,...newState.R.slice(6,9));
      newState.R.splice(6,3,...t);
    }

    if (move === 'F') {
      rotateFace('F');
      const t = [newState.U[6],newState.U[7],newState.U[8]];
      newState.U[6]=newState.L[8]; newState.U[7]=newState.L[5]; newState.U[8]=newState.L[2];
      newState.L[8]=newState.D[2]; newState.L[5]=newState.D[1]; newState.L[2]=newState.D[0];
      newState.D[2]=newState.R[0]; newState.D[1]=newState.R[3]; newState.D[0]=newState.R[6];
      newState.R[0]=t[0]; newState.R[3]=t[1]; newState.R[6]=t[2];
    }

    if (move === 'B') {
      rotateFace('B');
      const t = [newState.U[0],newState.U[1],newState.U[2]];
      newState.U[0]=newState.R[2]; newState.U[1]=newState.R[5]; newState.U[2]=newState.R[8];
      newState.R[2]=newState.D[8]; newState.R[5]=newState.D[7]; newState.R[8]=newState.D[6];
      newState.D[8]=newState.L[0]; newState.D[7]=newState.L[3]; newState.D[6]=newState.L[6];
      newState.L[0]=t[2]; newState.L[3]=t[1]; newState.L[6]=t[0];
    }

    if (move === 'L') {
      rotateFace('L');
      const t = [newState.U[0],newState.U[3],newState.U[6]];
      newState.U[0]=newState.B[8]; newState.U[3]=newState.B[5]; newState.U[6]=newState.B[2];
      newState.B[8]=newState.D[0]; newState.B[5]=newState.D[3]; newState.B[2]=newState.D[6];
      newState.D[0]=newState.F[0]; newState.D[3]=newState.F[3]; newState.D[6]=newState.F[6];
      newState.F[0]=t[0]; newState.F[3]=t[1]; newState.F[6]=t[2];
    }

    if (move === 'R') {
      rotateFace('R');
      const t = [newState.U[2],newState.U[5],newState.U[8]];
      newState.U[2]=newState.F[2]; newState.U[5]=newState.F[5]; newState.U[8]=newState.F[8];
      newState.F[2]=newState.D[2]; newState.F[5]=newState.D[5]; newState.F[8]=newState.D[8];
      newState.D[2]=newState.B[6]; newState.D[5]=newState.B[3]; newState.D[8]=newState.B[0];
      newState.B[6]=t[2]; newState.B[3]=t[1]; newState.B[0]=t[0];
    }

    return newState;
  };

  const handleRandomize = () => {
  let state = JSON.parse(JSON.stringify(solvedState));

  const moves = ['U', 'R', 'F', 'L', 'D', 'B'];

  const applyMove = (s, move) => {
    const newState = JSON.parse(JSON.stringify(s));

    const rotateFace = (f) => {
      const t = [...newState[f]];
      newState[f][0]=t[6]; newState[f][1]=t[3]; newState[f][2]=t[0];
      newState[f][3]=t[7]; newState[f][4]=t[4]; newState[f][5]=t[1];
      newState[f][6]=t[8]; newState[f][7]=t[5]; newState[f][8]=t[2];
    };

    if (move === 'U') {
      rotateFace('U');
      const t = [...newState.F.slice(0,3)];
      newState.F.splice(0,3,...newState.R.slice(0,3));
      newState.R.splice(0,3,...newState.B.slice(0,3));
      newState.B.splice(0,3,...newState.L.slice(0,3));
      newState.L.splice(0,3,...t);
    }

    if (move === 'R') {
      rotateFace('R');
      const t = [newState.F[2], newState.F[5], newState.F[8]];
      newState.F[2]=newState.D[2]; newState.F[5]=newState.D[5]; newState.F[8]=newState.D[8];
      newState.D[2]=newState.B[6]; newState.D[5]=newState.B[3]; newState.D[8]=newState.B[0];
      newState.B[6]=newState.U[2]; newState.B[3]=newState.U[5]; newState.B[0]=newState.U[8];
      newState.U[2]=t[0]; newState.U[5]=t[1]; newState.U[8]=t[2];
    }

    if (move === 'F') {
      rotateFace('F');
      const t = [newState.U[6], newState.U[7], newState.U[8]];
      newState.U[6]=newState.L[8]; newState.U[7]=newState.L[5]; newState.U[8]=newState.L[2];
      newState.L[8]=newState.D[2]; newState.L[5]=newState.D[1]; newState.L[2]=newState.D[0];
      newState.D[2]=newState.R[0]; newState.D[1]=newState.R[3]; newState.D[0]=newState.R[6];
      newState.R[0]=t[0]; newState.R[3]=t[1]; newState.R[6]=t[2];
    }

    if (move === 'L') {
      rotateFace('L');
      const t = [newState.F[0], newState.F[3], newState.F[6]];
      newState.F[0]=newState.U[0]; newState.F[3]=newState.U[3]; newState.F[6]=newState.U[6];
      newState.U[0]=newState.B[8]; newState.U[3]=newState.B[5]; newState.U[6]=newState.B[2];
      newState.B[8]=newState.D[0]; newState.B[5]=newState.D[3]; newState.B[2]=newState.D[6];
      newState.D[0]=t[0]; newState.D[3]=t[1]; newState.D[6]=t[2];
    }

    if (move === 'D') {
      rotateFace('D');
      const t = [...newState.F.slice(6,9)];
      newState.F.splice(6,3,...newState.L.slice(6,9));
      newState.L.splice(6,3,...newState.B.slice(6,9));
      newState.B.splice(6,3,...newState.R.slice(6,9));
      newState.R.splice(6,3,...t);
    }

    if (move === 'B') {
      rotateFace('B');
      const t = [newState.U[2], newState.U[1], newState.U[0]];
      newState.U[2]=newState.R[2]; newState.U[1]=newState.R[5]; newState.U[0]=newState.R[8];
      newState.R[2]=newState.D[6]; newState.R[5]=newState.D[7]; newState.R[8]=newState.D[8];
      newState.D[6]=newState.L[6]; newState.D[7]=newState.L[3]; newState.D[8]=newState.L[0];
      newState.L[6]=t[0]; newState.L[3]=t[1]; newState.L[0]=t[2];
    }

    return newState;
  };

  // only 2 valid random moves
  for (let i = 0; i < 2; i++) {
    const move = moves[Math.floor(Math.random() * moves.length)];
    state = applyMove(state, move);
  }

  setCubeState(state);
};

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const response = await axios.post('http://localhost:8000/solve/', cubeState);
      if (response.data.success) {
        navigate('/solve', { state: { solution: response.data.solution, cubeState: cubeState } });
      } else {
        alert(response.data.error);
        setCubeState(solvedState);
      }
    } catch {
      alert('Invalid pattern');
      setCubeState(solvedState);
    } finally {
      setLoading(false);
    }
  };

  const renderSticker = (face, index, color) => {
    const isOpen = openPicker.face === face && openPicker.index === index;
    
    return (
      <div style={{ position: 'relative', display: 'inline-block' }} ref={isOpen ? pickerRef : null}>
        <div
          onClick={() => handleStickerClick(face, index)}
          style={{
            width: '50px',
            height: '50px',
            backgroundColor: colorMap[color],
            border: '1px solid black',
            margin: '2px',
            cursor: 'pointer'
          }}
        />
        {isOpen && (
          <div style={{
            position: 'absolute',
            top: '55px',
            backgroundColor: 'white',
            border: '1px solid #434343',
            zIndex: 100,
            display: 'flex',
            flexDirection: 'column'
          }}>
            {colorOptions.map((c) => (
              <div key={c} onClick={() => handleColorChange(face,index,c)}
                style={{width:'50px',height:'50px',backgroundColor:colorMap[c]}} />
            ))}
          </div>
        )}
      </div>
    );
  };

  const renderFace = (faceName, faceColors) => (
    <div style={{ margin: '20px' }}>
      <h3>{faceName}</h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)' }}>
        {faceColors.map((color, idx) => renderSticker(faceName, idx, color))}
      </div>
    </div>
  );

  return (
    <div className="cube-input">
      <button className="back-btn" onClick={() => navigate('/')}>← Back</button>
      <button className="upload-btn montserrat-alternates-regular" onClick={() => navigate('/upload')}>
        📷 Upload your Cube
      </button>
      
      <h2 className="montserrat-alternates-semibold">(or) Manually Set Cube Colors</h2>

      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center' }}>
        {Object.keys(cubeState).map(face => renderFace(face, cubeState[face]))}
      </div>

      <div className="btn-group">
        <button className="random-btn" onClick={handleRandomize}>Randomize (~2 rotations)</button>
        <button className="submit-btn" onClick={handleSubmit} disabled={loading || isSolved}>
          {loading ? 'Solving...' : (isSolved ? 'Solve Cube' : 'Solve Cube')}
        </button>
      </div>
    </div>
  );
};

export default CubeInput;