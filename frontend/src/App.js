import { BrowserRouter, Routes, Route } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import CubeInput from './pages/CubeInput';
import Cube3D from './pages/Cube3D';
import CameraUpload from './pages/CameraUpload';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/input" element={<CubeInput />} />
        <Route path="/solve" element={<Cube3D />} />
        <Route path="/upload" element={<CameraUpload />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;