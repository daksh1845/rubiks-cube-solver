import React, { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Webcam from 'react-webcam';
import axios from 'axios';

const CameraUpload = () => {
  const navigate = useNavigate();
  const webcamRef = useRef(null);
  const [showCamera, setShowCamera] = useState(false);
  const [currentFace, setCurrentFace] = useState(null);
  const [cubeState, setCubeState] = useState({
    U: Array(9).fill('white'),
    D: Array(9).fill('yellow'),
    L: Array(9).fill('orange'),
    R: Array(9).fill('red'),
    F: Array(9).fill('green'),
    B: Array(9).fill('blue')
  });
  const [loading, setLoading] = useState(false);
  const [cameraMode, setCameraMode] = useState('user');

  const faceLabelsFull = { U: 'UP', D: 'DOWN', L: 'LEFT', R: 'RIGHT', F: 'FRONT', B: 'BACK' };
  const faceLabelsShort = { U: 'U', D: 'D', L: 'L', R: 'R', F: 'F', B: 'B' };

  const colorMap = {
    white: '#ffffff',
    yellow: '#ffff00',
    orange: '#ffa500',
    red: '#ff0000',
    green: '#00ff00',
    blue: '#0000ff'
  };

  const openCameraForFace = (face) => {
    setCurrentFace(face);
    setShowCamera(true);
  };

  const capturePhoto = async () => {
    const imageSrc = webcamRef.current.getScreenshot();
    setShowCamera(false);
    
    setLoading(true);
    try {
      const response = await axios.post('http://localhost:8000/api/detect-face/', {
        image: imageSrc,
        face: currentFace
      });
      
      if (response.data.success) {
        const newCubeState = { ...cubeState };
        newCubeState[currentFace] = response.data.colors;
        setCubeState(newCubeState);
      } else {
        alert(response.data.error);
      }
    } catch (error) {
      alert('Failed to detect face. Please try again.');
    } finally {
      setLoading(false);
      setCurrentFace(null);
    }
  };

  const switchCamera = () => {
    setCameraMode(prev => prev === 'user' ? 'environment' : 'user');
  };

  const cancelCamera = () => {
    setShowCamera(false);
    setCurrentFace(null);
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const response = await axios.post('http://localhost:8000/solve/', cubeState);
      if (response.data.success) {
        navigate('/solve', { state: { solution: response.data.solution, cubeState: cubeState } });
      } else {
        alert(response.data.error);
      }
    } catch (error) {
      alert('Failed to solve cube. Please make sure backend is running.');
    } finally {
      setLoading(false);
    }
  };

  const renderSticker = (color) => {
    return (
      <div 
        className="sticker" 
        style={{ backgroundColor: colorMap[color] }}
      />
    );
  };

  const renderFace = (faceName, faceColors) => {
    return (
      <div className="face-wrapper">
        <h3>{faceLabelsShort[faceName]}</h3>
        <div className="face-grid">
          {faceColors.map((color, idx) => (
            <div key={idx}>{renderSticker(color)}</div>
          ))}
        </div>
        <button 
          className="capture-face-btn"
          onClick={() => openCameraForFace(faceName)}
          disabled={loading}
        >
          Capture
        </button>
      </div>
    );
  };

  return (
    <div className="camera-upload">
      <button className="back-btn" onClick={() => navigate('/input')}>← Back</button>
      <h2>Capture Each Face of Your Cube</h2>
      
      {showCamera && (
        <div className="camera-modal">
          <div className="camera-modal-content">
            <h3>Capture {faceLabelsFull[currentFace]} Face</h3>
            <div className="webcam-container">
              <Webcam
                audio={false}
                ref={webcamRef}
                screenshotFormat="image/jpeg"
                videoConstraints={{ facingMode: cameraMode }}
                className="webcam"
              />
            </div>
            <div className="camera-modal-buttons">
              <button className="switch-camera-btn" onClick={switchCamera}>🔄 Switch Camera</button>
              <button className="capture-btn" onClick={capturePhoto}>📸 Capture</button>
              <button className="cancel-btn" onClick={cancelCamera}>❌ Cancel</button>
            </div>
          </div>
        </div>
      )}
      
      <div className="faces-container">
        {Object.keys(cubeState).map((face) => renderFace(face, cubeState[face]))}
      </div>
      
      <button 
        className="submit-btn"
        onClick={handleSubmit}
        disabled={loading}
      >
        {loading ? 'Solving...' : 'Solve Cube'}
      </button>
    </div>
  );
};

export default CameraUpload;