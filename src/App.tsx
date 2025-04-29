// src/App.tsx
import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

import LandingPage from "./components/LandingPage";
import LoginPage from "./components/LoginPage";
import RegisterPage from "./components/RegisterPage";
import ForgotPasswordPage from "./components/ForgotPasswordPage";
import ProfilePage from "./components/ProfilePage";
import AuctionsPage from "./components/AuctionsPage";
import AuctionDetailPage from "./components/AuctionDetailPage";

import RequireAuth from "./components/RequireAuth";

import "./App.css";

export function App() {
  return (
    <Router>
      <Routes>
        {/* Public routes */}
        <Route index element={<LandingPage />} />
        <Route path="login" element={<LoginPage />} />
        <Route path="register" element={<RegisterPage />} />
        <Route path="forgot-password" element={<ForgotPasswordPage />} />
        <Route path="landing" element={<LandingPage />} />

        {/* Protected: Profile */}
        <Route
          path="profile"
          element={
            <RequireAuth>
              <ProfilePage />
            </RequireAuth>
          }
        />

        {/* Protected: Auctions + nested detail */}
        <Route
          path="auctions"
          element={
            <RequireAuth>
              <AuctionsPage />
            </RequireAuth>
          }
        >
          <Route
            path=":id"
            element={
              <RequireAuth>
                <AuctionDetailPage />
              </RequireAuth>
            }
          />
        </Route>

        {/* Fallback for any unknown URL */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
