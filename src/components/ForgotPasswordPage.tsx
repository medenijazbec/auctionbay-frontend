// src/components/ForgotPasswordPage.tsx
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import './ForgotPasswordPage.css';

const ForgotPasswordPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState<string>('');
  const [error, setError] = useState<string>('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      const res = await fetch('https://localhost:7056/api/Auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.Errors ? data.Errors[0].Description : 'Error sending reset link.');
      } else {
        setMessage(data.Message || 'If that email exists, a reset link has been sent.');
      }
    } catch (err) {
      setError('An error occurred while sending reset link.');
    }
  };

  return (
    <div className="forgot-password-page">
      <h2>Forgot Password</h2>
      {message && <p className="success-msg">{message}</p>}
      {error && <p className="error-msg">{error}</p>}
      <form onSubmit={handleSubmit}>
        <input
          type="email"
          placeholder="Enter your email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
        />
        <button type="submit" className="forgot-button">Send Reset Link</button>
      </form>
      <p>
        Remember your password? <Link to="/login" className="link">Login here</Link>
      </p>
    </div>
  );
};

export default ForgotPasswordPage;
