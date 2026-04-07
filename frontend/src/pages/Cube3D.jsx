import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera } from '@react-three/drei';
import { useLocation, useNavigate } from 'react-router-dom';
import * as THREE from 'three';

// Single small cube (one of 27)
const SmallCube = ({ position, colors, initialPosition, isAnimating, currentRotation }) => {
  const meshRef = useRef();
  const [rotationAngle, setRotationAngle] = useState(0);
  
  useFrame(() => {
    if (isAnimating && meshRef.current) {
      setRotationAngle(prev => {
        const newAngle = prev + 0.1;
        if (newAngle >= Math.PI / 2) {
          return Math.PI / 2;
        }
        return newAngle;
      });
    }
  });

  const createMaterial = (color, isVisible) => {
    if (!isVisible || !color) return null;
    return new THREE.MeshStandardMaterial({ color: color, roughness: 0.3, metalness: 0.05 });
  };

  const materials = [
    createMaterial(colors.right, true),
    createMaterial(colors.left, true),
    createMaterial(colors.up, true),
    createMaterial(colors.down, true),
    createMaterial(colors.front, true),
    createMaterial(colors.back, true),
  ];

  let rotation = [0, 0, 0];
  let positionOffset = [0, 0, 0];
  
  if (isAnimating && currentRotation) {
    const { axis, affectedPositions } = currentRotation;
    const isAffected = affectedPositions.some(pos => 
      pos[0] === initialPosition[0] && 
      pos[1] === initialPosition[1] && 
      pos[2] === initialPosition[2]
    );
    
    if (isAffected) {
      if (axis === 'y') {
        rotation[1] = rotationAngle;
        const radius = Math.sqrt(initialPosition[0] ** 2 + initialPosition[2] ** 2);
        const originalAngle = Math.atan2(initialPosition[2], initialPosition[0]);
        const newAngle = originalAngle + rotationAngle;
        positionOffset = [
          radius * Math.cos(newAngle) - initialPosition[0],
          0,
          radius * Math.sin(newAngle) - initialPosition[2]
        ];
      } else if (axis === 'x') {
        rotation[0] = rotationAngle;
        const radius = Math.sqrt(initialPosition[1] ** 2 + initialPosition[2] ** 2);
        const originalAngle = Math.atan2(initialPosition[2], initialPosition[1]);
        const newAngle = originalAngle + rotationAngle;
        positionOffset = [
          0,
          radius * Math.cos(newAngle) - initialPosition[1],
          radius * Math.sin(newAngle) - initialPosition[2]
        ];
      } else if (axis === 'z') {
        rotation[2] = rotationAngle;
        const radius = Math.sqrt(initialPosition[0] ** 2 + initialPosition[1] ** 2);
        const originalAngle = Math.atan2(initialPosition[1], initialPosition[0]);
        const newAngle = originalAngle + rotationAngle;
        positionOffset = [
          radius * Math.cos(newAngle) - initialPosition[0],
          radius * Math.sin(newAngle) - initialPosition[1],
          0
        ];
      }
    }
  }

  return (
    <mesh 
      ref={meshRef}
      position={[
        initialPosition[0] + positionOffset[0],
        initialPosition[1] + positionOffset[1],
        initialPosition[2] + positionOffset[2]
      ]}
      rotation={rotation}
    >
      <boxGeometry args={[0.96, 0.96, 0.96]} />
      {materials.map((mat, i) => mat && <meshStandardMaterial key={i} attach={`material-${i}`} {...mat} />)}
    </mesh>
  );
};

// Full Rubik's Cube
const RubiksCube = ({ solutionMoves, isPlaying, currentMoveIndex: externalMoveIndex, onMoveComplete, onAnimationComplete, initialCubeState }) => {
  // IMPORTANT FIX: Use initialCubeState if provided, otherwise solved state
  const [cubeState, setCubeState] = useState(() => {
    if (initialCubeState) {
      return initialCubeState;
    }
    return {
      U: Array(9).fill('white'),
      D: Array(9).fill('yellow'),
      L: Array(9).fill('orange'),
      R: Array(9).fill('red'),
      F: Array(9).fill('green'),
      B: Array(9).fill('blue')
    };
  });
  
  const [currentMoveIndex, setCurrentMoveIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [currentRotation, setCurrentRotation] = useState(null);
  const animationTimeoutRef = useRef(null);

  const colorMap = {
    white: '#ffffff',
    yellow: '#ffff00',
    orange: '#ffa500',
    red: '#ff0000',
    green: '#00ff00',
    blue: '#0000ff'
  };

  const faceColors = {
    U: 'white',
    D: 'yellow',
    L: 'orange',
    R: 'red',
    F: 'green',
    B: 'blue'
  };

  const parseMoves = (moveString) => {
    if (!moveString) return [];
    return moveString.trim().split(/\s+/);
  };

  const moves = parseMoves(solutionMoves);

  const getAffectedPositions = (face) => {
    const positions = [];
    switch(face) {
      case 'U':
        for (let x = -1; x <= 1; x++) {
          for (let z = -1; z <= 1; z++) {
            positions.push([x, 1, z]);
          }
        }
        break;
      case 'D':
        for (let x = -1; x <= 1; x++) {
          for (let z = -1; z <= 1; z++) {
            positions.push([x, -1, z]);
          }
        }
        break;
      case 'L':
        for (let y = -1; y <= 1; y++) {
          for (let z = -1; z <= 1; z++) {
            positions.push([-1, y, z]);
          }
        }
        break;
      case 'R':
        for (let y = -1; y <= 1; y++) {
          for (let z = -1; z <= 1; z++) {
            positions.push([1, y, z]);
          }
        }
        break;
      case 'F':
        for (let x = -1; x <= 1; x++) {
          for (let y = -1; y <= 1; y++) {
            positions.push([x, y, 1]);
          }
        }
        break;
      case 'B':
        for (let x = -1; x <= 1; x++) {
          for (let y = -1; y <= 1; y++) {
            positions.push([x, y, -1]);
          }
        }
        break;
      default:
        break;
    }
    return positions;
  };

  const rotateFaceColors = (state, face, times) => {
    const newState = JSON.parse(JSON.stringify(state));
    const faceArray = newState[face];
    
    for (let t = 0; t < times; t++) {
      const temp = [...faceArray];
      faceArray[0] = temp[6];
      faceArray[1] = temp[3];
      faceArray[2] = temp[0];
      faceArray[3] = temp[7];
      faceArray[4] = temp[4];
      faceArray[5] = temp[1];
      faceArray[6] = temp[8];
      faceArray[7] = temp[5];
      faceArray[8] = temp[2];
    }
    return newState;
  };

  const rotateAdjacent = (state, face, times) => {
    const newState = JSON.parse(JSON.stringify(state));
    
    for (let t = 0; t < times; t++) {
      if (face === 'U') {
        const temp = [...newState.F.slice(0, 3)];
        newState.F[0] = newState.R[0];
        newState.F[1] = newState.R[1];
        newState.F[2] = newState.R[2];
        newState.R[0] = newState.B[0];
        newState.R[1] = newState.B[1];
        newState.R[2] = newState.B[2];
        newState.B[0] = newState.L[0];
        newState.B[1] = newState.L[1];
        newState.B[2] = newState.L[2];
        newState.L[0] = temp[0];
        newState.L[1] = temp[1];
        newState.L[2] = temp[2];
      }
      else if (face === 'D') {
        const temp = [...newState.F.slice(6, 9)];
        newState.F[6] = newState.L[6];
        newState.F[7] = newState.L[7];
        newState.F[8] = newState.L[8];
        newState.L[6] = newState.B[6];
        newState.L[7] = newState.B[7];
        newState.L[8] = newState.B[8];
        newState.B[6] = newState.R[6];
        newState.B[7] = newState.R[7];
        newState.B[8] = newState.R[8];
        newState.R[6] = temp[0];
        newState.R[7] = temp[1];
        newState.R[8] = temp[2];
      }
      else if (face === 'L') {
        const temp = [newState.F[0], newState.F[3], newState.F[6]];
        newState.F[0] = newState.U[0];
        newState.F[3] = newState.U[3];
        newState.F[6] = newState.U[6];
        newState.U[0] = newState.B[8];
        newState.U[3] = newState.B[5];
        newState.U[6] = newState.B[2];
        newState.B[8] = newState.D[0];
        newState.B[5] = newState.D[3];
        newState.B[2] = newState.D[6];
        newState.D[0] = temp[0];
        newState.D[3] = temp[1];
        newState.D[6] = temp[2];
      }
      else if (face === 'R') {
        const temp = [newState.F[2], newState.F[5], newState.F[8]];
        newState.F[2] = newState.D[2];
        newState.F[5] = newState.D[5];
        newState.F[8] = newState.D[8];
        newState.D[2] = newState.B[6];
        newState.D[5] = newState.B[3];
        newState.D[8] = newState.B[0];
        newState.B[6] = newState.U[2];
        newState.B[3] = newState.U[5];
        newState.B[0] = newState.U[8];
        newState.U[2] = temp[0];
        newState.U[5] = temp[1];
        newState.U[8] = temp[2];
      }
      else if (face === 'F') {
        const temp = [newState.U[6], newState.U[7], newState.U[8]];
        newState.U[6] = newState.L[8];
        newState.U[7] = newState.L[5];
        newState.U[8] = newState.L[2];
        newState.L[8] = newState.D[2];
        newState.L[5] = newState.D[1];
        newState.L[2] = newState.D[0];
        newState.D[2] = newState.R[0];
        newState.D[1] = newState.R[3];
        newState.D[0] = newState.R[6];
        newState.R[0] = temp[0];
        newState.R[3] = temp[1];
        newState.R[6] = temp[2];
      }
      else if (face === 'B') {
        const temp = [newState.U[2], newState.U[1], newState.U[0]];
        newState.U[2] = newState.R[2];
        newState.U[1] = newState.R[5];
        newState.U[0] = newState.R[8];
        newState.R[2] = newState.D[6];
        newState.R[5] = newState.D[7];
        newState.R[8] = newState.D[8];
        newState.D[6] = newState.L[6];
        newState.D[7] = newState.L[3];
        newState.D[8] = newState.L[0];
        newState.L[6] = temp[0];
        newState.L[3] = temp[1];
        newState.L[0] = temp[2];
      }
    }
    return newState;
  };

  const applyMove = (move) => {
    setCubeState(prevState => {
      let newState = JSON.parse(JSON.stringify(prevState));
      const face = move[0];
      const suffix = move[1] || '';
      let times = 1;
      
      if (suffix === '2') times = 2;
      if (suffix === "'") times = 3;
      
      newState = rotateFaceColors(newState, face, times);
      newState = rotateAdjacent(newState, face, times);
      
      return newState;
    });
  };

  const executeMove = useCallback((index) => {
    if (index >= moves.length) {
      onAnimationComplete();
      return;
    }
    
    setIsAnimating(true);
    const move = moves[index];
    const face = move[0];
    let axis = 'y';
    
    if (face === 'U' || face === 'D') axis = 'y';
    if (face === 'L' || face === 'R') axis = 'x';
    if (face === 'F' || face === 'B') axis = 'z';
    
    const affectedPositions = getAffectedPositions(face);
    setCurrentRotation({ axis, angle: Math.PI / 2, affectedPositions });
    
    setTimeout(() => {
      applyMove(move);
      setIsAnimating(false);
      setCurrentRotation(null);
      const newIndex = index + 1;
      setCurrentMoveIndex(newIndex);
      onMoveComplete(newIndex);
    }, 300);
  }, [moves, onAnimationComplete, onMoveComplete]);

  useEffect(() => {
    if (isPlaying && !isAnimating && currentMoveIndex < moves.length) {
      animationTimeoutRef.current = setTimeout(() => {
        executeMove(currentMoveIndex);
      }, 100);
    }
    return () => {
      if (animationTimeoutRef.current) clearTimeout(animationTimeoutRef.current);
    };
  }, [isPlaying, isAnimating, currentMoveIndex, executeMove, moves.length]);

  useEffect(() => {
    if (externalMoveIndex !== undefined && externalMoveIndex !== currentMoveIndex && !isAnimating) {
      setCurrentMoveIndex(externalMoveIndex);
    }
  }, [externalMoveIndex, currentMoveIndex, isAnimating]);

  const positions = [];
  for (let x = -1; x <= 1; x++) {
    for (let y = -1; y <= 1; y++) {
      for (let z = -1; z <= 1; z++) {
        positions.push({ x, y, z });
      }
    }
  }

  const getColorsForPosition = (x, y, z) => {
    return {
      right: x === 1 ? faceColors.R : null,
      left: x === -1 ? faceColors.L : null,
      up: y === 1 ? faceColors.U : null,
      down: y === -1 ? faceColors.D : null,
      front: z === 1 ? faceColors.F : null,
      back: z === -1 ? faceColors.B : null,
    };
  };

// REPLACE ONLY getCurrentColors FUNCTION WITH THIS

const getCurrentColors = (x, y, z, colors) => {

  const getStickerIndex = (x, y, z, face) => {
    // ✅ FIXED STANDARD ORIENTATION (THIS WAS YOUR BUG)

    if (face === 'U') return (1 - z) * 3 + (x + 1);       // top
    if (face === 'D') return (z + 1) * 3 + (x + 1);       // bottom
    if (face === 'F') return (1 - y) * 3 + (x + 1);       // front
    if (face === 'B') return (1 - y) * 3 + (1 - x);       // back (reversed)
    if (face === 'L') return (1 - y) * 3 + (z + 1);       // left
    if (face === 'R') return (1 - y) * 3 + (1 - z);       // right

    return 4;
  };

  return {
    right: colors.right ? colorMap[cubeState.R[getStickerIndex(x, y, z, 'R')]] : null,
    left: colors.left ? colorMap[cubeState.L[getStickerIndex(x, y, z, 'L')]] : null,
    up: colors.up ? colorMap[cubeState.U[getStickerIndex(x, y, z, 'U')]] : null,
    down: colors.down ? colorMap[cubeState.D[getStickerIndex(x, y, z, 'D')]] : null,
    front: colors.front ? colorMap[cubeState.F[getStickerIndex(x, y, z, 'F')]] : null,
    back: colors.back ? colorMap[cubeState.B[getStickerIndex(x, y, z, 'B')]] : null,
  };
};


  return (
    <group>
      {positions.map((pos, idx) => {
        const colors = getColorsForPosition(pos.x, pos.y, pos.z);
        const hasAnyColor = Object.values(colors).some(c => c !== null);
        if (!hasAnyColor) return null;
        
        return (
          <SmallCube
            key={idx}
            initialPosition={[pos.x, pos.y, pos.z]}
            colors={getCurrentColors(pos.x, pos.y, pos.z, colors)}
            isAnimating={isAnimating}
            currentRotation={currentRotation}
          />
        );
      })}
    </group>
  );
};

// Main Cube3D Page Component
const Cube3D = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { solution, cubeState: initialCubeState } = location.state || { solution: '', cubeState: null };
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentMoveIndex, setCurrentMoveIndex] = useState(0);
  const [animationComplete, setAnimationComplete] = useState(false);
  const cubeRef = useRef();

  const moves = solution ? solution.trim().split(/\s+/) : [];

  const handlePlay = () => {
    setIsPlaying(true);
    setAnimationComplete(false);
  };
  
  const handleRestart = () => {
    setIsPlaying(false);
    setCurrentMoveIndex(0);
    setAnimationComplete(false);
    window.location.reload();
  };
  
  const handleMoveComplete = (newIndex) => {
    setCurrentMoveIndex(newIndex);
    if (newIndex >= moves.length) {
      setIsPlaying(false);
      setAnimationComplete(true);
    }
  };

  const handleAnimationComplete = () => {
    setIsPlaying(false);
    setAnimationComplete(true);
  };

  // Move explanation helper
  const getMoveExplanation = (move) => {
    const face = move[0];
    const suffix = move[1] || '';

    const faceNames = {
      'U': 'Up',
      'D': 'Down',
      'L': 'Left',
      'R': 'Right',
      'F': 'Front',
      'B': 'Back'
    };

    const direction = suffix === "'" ? "counter-clockwise" : (suffix === "2" ? "180 degrees" : "clockwise");
    const directionText = suffix === "2" ? "half turn" : `90° ${direction}`;

    return `${faceNames[face]} face → ${directionText}`;
  };

  return (
    <div className="cube-3d">
      <button className="back-btn montserrat-alternates-regular" onClick={() => navigate('/input')}>
        ← Back
      </button>
      
      <div className="canvas-container">
        <Canvas style={{ background: '#f0f0f0', borderRadius: '12px' }}>
          <PerspectiveCamera makeDefault position={[4, 3, 5]} />
          <OrbitControls enableZoom={true} enablePan={true} />
          <ambientLight intensity={0.6} />
          <directionalLight position={[5, 5, 5]} intensity={1} />
          <directionalLight position={[-5, -5, -5]} intensity={0.3} />
          <RubiksCube 
            ref={cubeRef}
            solutionMoves={solution} 
            isPlaying={isPlaying}
            currentMoveIndex={currentMoveIndex}
            onMoveComplete={handleMoveComplete}
            onAnimationComplete={handleAnimationComplete}
            initialCubeState={initialCubeState}
          />
        </Canvas>
      </div> 
      
      <div className="controls">
        <button 
          className="control-btn play" 
          onClick={handlePlay} 
          disabled={animationComplete}
          style={{ opacity: animationComplete ? 0.5 : 1, cursor: animationComplete ? 'not-allowed' : 'pointer' }}
        >
          ▶ Play
        </button>
        <button 
          className="control-btn restart" 
          onClick={handleRestart}
          disabled={!animationComplete}
          style={{ opacity: !animationComplete ? 0.5 : 1, cursor: !animationComplete ? 'not-allowed' : 'pointer' }}
        >
          🔄 Restart
        </button>
      </div>
      
      <div className="solution-text montserrat-alternates-regular">
        <strong>Solution ({moves.length} moves):</strong> {solution}
        <div className="move-list">
          <strong style={window.innerWidth <= 720 ? { display: 'block', marginBottom: '25px' } : {}}>Step-by-step:</strong>
          <ul>
            {moves.map((move, idx) => (
              <li key={idx}>
                <span className="move-name">{move}</span> → {getMoveExplanation(move)}
              </li>
            ))}
          </ul>
        </div>
      </div>
      
      {animationComplete && (
        <div className="completion-message montserrat-alternates-bold">
          🎉 Cube Solved! 🎉
        </div>
      )}
    </div>
  );
};

export default Cube3D;