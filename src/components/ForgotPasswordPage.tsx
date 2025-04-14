import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import styles from './ForgotPasswordPage.module.css';

import logo from '../assets/logo.png';
import backarrow from '../assets/backarrow.png';

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

const ForgotPasswordPage: React.FC = () => {
  const navigate = useNavigate();

  //State for auctions (left side)
  const [auctions, setAuctions] = useState<Auction[]>([]);

  //Forgot password form states
  const [email, setEmail] = useState('');
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

  //Select up to 4 random auctions if more than 4 are available
  const selectedAuctions: Auction[] =
    auctions.length > 4 ? [...auctions].sort(() => Math.random() - 0.5).slice(0, 4) : auctions;

  //Handle forgot password form submission
  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      const response = await fetch(`${BACKEND_BASE_URL}/api/Auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();
      if (!response.ok) {
        setError(
          data.Errors
            ? data.Errors[0].Description
            : data.Message || 'Could not send reset instructions. Please try again.'
        );
        return;
      }

      setSuccess(data.Message || 'Reset instructions have been sent to your email.');
      /*
      stuff za navigation gre tle sm pol k bm figuro out ka naj z tem nardim, mail server?
      
      
      */ 



      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (err) {
      setError('An error occurred while sending reset instructions.');
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

      {/* Right Column: Forgot Password Form */}
      <div className={styles.registerFormContainer}>
        <div className={styles.brandIcon}>
          <img src={logo} alt="Main Logo" className={styles.logoImage} />
        </div>

        <h2 className={styles.formTitle}>Forgot password?</h2>
        <p className={styles.formSubtitle}>
          No worries, we will send you reset instructions
        </p>

        {error && <p className={styles.errorMsg}>{error}</p>}
        {success && <p className={styles.successMsg}>{success}</p>}

        <form onSubmit={handleForgotPassword} className={styles.registerForm}>
          <label className={styles.inputLabel}>E-mail</label>
          <input
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <button type="submit" className={styles.registerButton}>
            Reset password
          </button>
        </form>

        <div className={styles.backLinkContainer}>
          <Link to="/login" className={styles.backLink}>
            <img src={backarrow} alt="Back arrow" className={styles.backArrow} />
            <span>Back to login</span>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
