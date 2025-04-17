// src/App.tsx
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LandingPage from './components/LandingPage';
import LoginPage from './components/LoginPage';
import RegisterPage from './components/RegisterPage';
import ForgotPasswordPage from './components/ForgotPasswordPage';

import './App.css';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/landing"  element={<LandingPage  />} />


      </Routes>
    </Router>
  );
}

export default App;
