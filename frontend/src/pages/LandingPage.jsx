import React from 'react';
import { useNavigate } from 'react-router-dom';

const LandingPage = () => {
  const navigate = useNavigate();

  const handleStartClick = () => {
    navigate('/input');
  };

  return (
    <div className="landing-page">
      <h1 className="montserrat-alternates-bold">Rubik's Cube Solver</h1>
      <p className="description montserrat-alternates-regular">
        Upload or select colors of your scrambled cube and watch it solve itself in 3D animation
      </p>
      <div className="cube-image">
        <img src="/rubiks-cube.png" alt="Rubik's Cube" className="cube-photo" />
      </div>
      <button className="start-btn montserrat-alternates-bold" onClick={handleStartClick}>
        Start Solving
      </button>
    </div>
  );
};

export default LandingPage;