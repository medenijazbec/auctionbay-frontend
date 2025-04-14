import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import styles from './LoginPage.module.css';

import logo from '../assets/logo.png';

// Images / icons for auction cards and clock icons
import clock15 from '../assets/15clock.png';
import clock30 from '../assets/30clock.png';
import clock45 from '../assets/45clock.png';

const BACKEND_BASE_URL = 'https://localhost:7056';

interface Auction {
  auctionId: number;
  title: string;
  description: string;
  startingPrice: number;
  startDateTime: string;
  endDateTime: string;
  auctionState: string; //"outbid", "inProgress", "winning", "done"
  createdAt: string;
  mainImageUrl?: string;
}

//Helper Functions
//Same color & clock logic as in Landing Page
function getTagText(state: string): string {
  switch (state) {
    case 'inProgress':
      return 'In progress';
    case 'winning':
      return 'Winning';
    case 'done':
      return 'Done';
    default:
      return 'Outbid';
  }
}

function getTimeText(state: string): string {
  switch (state) {
    case 'inProgress':
      return '30h';
    case 'winning':
      return '20h';
    case 'done':
      return '0h';
    default:
      return '24h';
  }
}

function getStatusClass(state: string): string {
  switch (state) {
    case 'inProgress':
      return 'editable';
    case 'winning':
      return 'winning';
    case 'done':
      return 'done';
    default:
      return '';
  }
}

function getClockIcon(endDateTime: string): string {
  const now = new Date();
  const end = new Date(endDateTime);
  const diffHours = (end.getTime() - now.getTime()) / (1000 * 60 * 60);

  if (diffHours <= 15) {
    return clock15;
  } else if (diffHours <= 30) {
    return clock30;
  } else {
    return clock45;
  }
}

const LoginPage: React.FC = () => {
  const navigate = useNavigate();

  //State for auctions (left side)
  const [auctions, setAuctions] = useState<Auction[]>([]);

  //Login form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  //tch auctions from the backend
  const fetchAuctions = async () => {
    try {
      const response = await fetch(`${BACKEND_BASE_URL}/api/Auctions?page=1&pageSize=20`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });
      if (!response.ok) {
        throw new Error('Failed to fetch auctions');
      }
      const data = await response.json();
      setAuctions(data);
    } catch (err) {
      console.error('Error fetching auctions:', err);
    }
  };

  useEffect(() => {
    fetchAuctions();
  }, []);

  //Select up to 4 random auctions if more than 4 are available
  const selectedAuctions: Auction[] =
    auctions.length > 4 ? [...auctions].sort(() => Math.random() - 0.5).slice(0, 4) : auctions;

  //Handle login form submission
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      const response = await fetch(`${BACKEND_BASE_URL}/api/Auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();
      if (!response.ok) {
        setError(
          data.Errors
            ? data.Errors[0].Description
            : data.Message || 'Login failed. Please check your credentials.'
        );
        return;
      }

      setSuccess(data.Message || 'Login successful.');
      //shran token tle
      setTimeout(() => {
        navigate('/dashboard'); //on success se pol zrihtat
      }, 1500);
    } catch (err) {
      setError('An error occurred during login.');
    }
  };

  return (
    <div className={styles.registerPageContainer}>
      {/* Left Column: Auction Grid */}
      <div className={styles.auctionGridContainer}>
        <div className={styles.auctionGrid}>
          {selectedAuctions.map((auction) => {
            const tagText = getTagText(auction.auctionState);
            const timeText = getTimeText(auction.auctionState);
            const statusClass = getStatusClass(auction.auctionState);
            const clockImg = getClockIcon(auction.endDateTime);

            return (
              <div key={auction.auctionId} className={styles.auctionCard}>
                <div className={styles.auctionCardHeader}>
                  <span className={`${styles.auctionTag} ${styles[statusClass]}`}>
                    {tagText}
                  </span>
                  <span className={`${styles.timeTag} ${styles[statusClass]}`}>
                    {timeText}
                    <img src={clockImg} alt="Clock Icon" className={styles.clockIcon} />
                  </span>
                </div>
                <div className={styles.auctionCardInfo}>
                  <div className={styles.auctionTitle}>{auction.title}</div>
                  <div className={styles.auctionPrice}>{auction.startingPrice} €</div>
                </div>
                <div className={styles.auctionCardImageContainer}>
                  <img
                    className={styles.auctionCardImage}
                    src={
                      auction.mainImageUrl
                        ? `${BACKEND_BASE_URL}${auction.mainImageUrl}`
                        : `${BACKEND_BASE_URL}/placeholder.png`
                    }
                    alt={auction.title}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Right Column: Login Form */}
      <div className={styles.registerFormContainer}>
        {/* Logo in a yellow circle */}
        <div className={styles.brandIcon}>
          <img src={logo} alt="Main Logo" className={styles.logoImage} />
        </div>

        <h2 className={styles.formTitle}>Welcome back!</h2>
        <p className={styles.formSubtitle}>Please enter your details</p>

        {error && <p className={styles.errorMsg}>{error}</p>}
        {success && <p className={styles.successMsg}>{success}</p>}

        <form onSubmit={handleLogin} className={styles.registerForm}>
          <label className={styles.inputLabel}>E-mail</label>
          <input
            type="email"
            placeholder="Enter your E-mail"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <label className={styles.inputLabel}>Password</label>
          <input
            type="password"
            placeholder="Enter your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          {/* Forgot password link */}
          <div style={{ width: '100%', textAlign: 'right', marginBottom: '16px' }}>
            <Link to="/forgot-password" style={{ textDecoration: 'none', color: '#6c7078' }}>
              Forgot password?
            </Link>
          </div>

          <button type="submit" className={styles.registerButton}>
            Login
          </button>
        </form>

        <p className={styles.footerText}>
          Don’t have an account?{' '}
          <Link to="/register" className={styles.loginLink}>
            Sign Up
          </Link>
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
