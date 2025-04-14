import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import styles from './RegisterPage.module.css';

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

const RegisterPage: React.FC = () => {
  const navigate = useNavigate();

  //State for auctions (to be shown on the left)
  const [auctions, setAuctions] = useState<Auction[]>([]);

  //Registration form states
  const [name, setName] = useState('');
  const [surname, setSurname] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  //Fetch auctions from the backend
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

  // elect up to 4 random auctions if more than 4 are available
  const selectedAuctions: Auction[] =
    auctions.length > 4 ? [...auctions].sort(() => Math.random() - 0.5).slice(0, 4) : auctions;

  //Handle registration form submission
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    try {
      const response = await fetch(`${BACKEND_BASE_URL}/api/Auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, surname, email, password, confirmPassword }),
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.Errors ? data.Errors[0].Description : 'Registration failed.');
        return;
      }
      setSuccess(data.Message || 'Registration successful.');
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (err) {
      setError('An error occurred during registration.');
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
                  <div className={styles.auctionPrice}>
                    {auction.startingPrice} €
                  </div>
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

      {/* Right Column: Registration Form */}
      <div className={styles.registerFormContainer}>
        {/* Logo in a yellow circle */}
        <div className={styles.brandIcon}>
          <img src={logo} alt="Main Logo" className={styles.logoImage} />
        </div>
        <h2 className={styles.formTitle}>Hello!</h2>
        <p className={styles.formSubtitle}>Please enter your details</p>

        {error && <p className={styles.errorMsg}>{error}</p>}
        {success && <p className={styles.successMsg}>{success}</p>}

        <form onSubmit={handleRegister} className={styles.registerForm}>
          {/* Name + Surname side by side */}
          <div className={styles.nameFields}>
            <div className={styles.nameField}>
              <label className={styles.inputLabel}>Name</label>
              <input
                type="text"
                placeholder="Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div className={styles.nameField}>
              <label className={styles.inputLabel}>Surname</label>
              <input
                type="text"
                placeholder="Surname"
                value={surname}
                onChange={(e) => setSurname(e.target.value)}
                required
              />
            </div>
          </div>

          <label className={styles.inputLabel}>E-mail</label>
          <input
            type="email"
            placeholder="E-mail"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <label className={styles.inputLabel}>Password</label>
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <label className={styles.inputLabel}>Repeat password</label>
          <input
            type="password"
            placeholder=" Repeat password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />

          <button type="submit" className={styles.registerButton}>
            Sign up
          </button>
        </form>

        <p className={styles.footerText}>
          Already have an account?{' '}
          <Link to="/login" className={styles.loginLink}>
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
};

export default RegisterPage;
