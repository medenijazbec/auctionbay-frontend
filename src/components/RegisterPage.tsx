import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import styles from './RegisterPage.module.css';

import logo     from '../assets/logo.png';
import clock15  from '../assets/15clock.png';
import clock30  from '../assets/30clock.png';
import clock45  from '../assets/45clock.png';

const BACKEND_BASE_URL = 'https://localhost:7056';

/* ── Types & helpers (same logic as above) ── */
interface Auction {
  auctionId:     number;
  title:         string;
  description:   string;
  startingPrice: number;
  startDateTime: string;
  endDateTime:   string;
  auctionState:  string;
  createdAt:     string;
  mainImageUrl?: string;
}

const getTagText = (s: string) =>
  s === 'inProgress' ? 'In progress' : s === 'winning' ? 'Winning'
: s === 'done'       ? 'Done'       : 'Outbid';

const getTimeText = (s: string) =>
  s === 'inProgress' ? '30h' : s === 'winning' ? '20h'
: s === 'done'       ? '0h'  : '24h';

const getStatusClass = (s: string) =>
  s === 'inProgress' ? 'editable' : s === 'winning' ? 'winning'
: s === 'done'       ? 'done'     : '';

const getClockIcon = (end: string) => {
  const hrs = (new Date(end).getTime() - Date.now()) / 3.6e6;
  return hrs <= 15 ? clock15 : hrs <= 30 ? clock30 : clock45;
};

/* ───────────────────────────────────────────────────────── */
const RegisterPage: React.FC = () => {
  const navigate = useNavigate();

  /* promo auctions */
  const [auctions, setAuctions] = useState<Auction[]>([]);

  /* form state */
  const [name,  setName]  = useState('');
  const [surname, setSurname] = useState('');
  const [email, setEmail]     = useState('');
  const [password, setPassword] = useState('');
  const [confirm,  setConfirm]  = useState('');

  const [error,   setError]   = useState('');
  const [success, setSuccess] = useState('');

  /* fetch once */
  useEffect(() => {
    fetch(`${BACKEND_BASE_URL}/api/Auctions?page=1&pageSize=20`)
      .then(r => r.json())
      .then(setAuctions)
      .catch(() => {/* ignore */});
  }, []);

  /* memoised promo grid */
  const promoAuctions = useMemo<Auction[]>(() => {
    if (auctions.length <= 4) return auctions;
    return [...auctions].sort(() => Math.random() - 0.5).slice(0, 4);
  }, [auctions]);

  /* register */
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); setSuccess('');

    if (password !== confirm) {
      setError('Passwords do not match.');
      return;
    }

    try {
      const resp = await fetch(`${BACKEND_BASE_URL}/api/Auth/register`, {
        method : 'POST',
        headers: { 'Content-Type':'application/json' },
        body   : JSON.stringify({ name, surname, email, password, confirmPassword: confirm })
      });
      const data = await resp.json();

      if (!resp.ok) {
        setError(data.Errors ? data.Errors[0].Description : 'Registration failed.');
        return;
      }

      setSuccess('Registration successful! Redirecting…');
      setTimeout(() => navigate('/login'), 1500);
    } catch {
      setError('An error occurred during registration.');
    }
  };

  return (
    <div className={styles.registerPageContainer}>
      {/* ── Left column – promo grid ── */}
      <div className={styles.auctionGridContainer}>
        <div className={styles.auctionGrid}>
          {promoAuctions.map(a => (
            <div key={a.auctionId} className={styles.auctionCard}>
              <div className={styles.auctionCardHeader}>
                <span className={`${styles.auctionTag} ${styles[getStatusClass(a.auctionState)]}`}>
                  {getTagText(a.auctionState)}
                </span>
                <span className={`${styles.timeTag} ${styles[getStatusClass(a.auctionState)]}`}>
                  {getTimeText(a.auctionState)}
                  <img src={getClockIcon(a.endDateTime)} className={styles.clockIcon} />
                </span>
              </div>
              <div className={styles.auctionCardInfo}>
                <div className={styles.auctionTitle}>{a.title}</div>
                <div className={styles.auctionPrice}>{a.startingPrice} €</div>
              </div>
              <div className={styles.auctionCardImageContainer}>
                <img
                  className={styles.auctionCardImage}
                  src={a.mainImageUrl ? `${BACKEND_BASE_URL}${a.mainImageUrl}` : `${BACKEND_BASE_URL}/placeholder.png`}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Right column – registration form ── */}
      <div className={styles.registerFormContainer}>
        <div className={styles.brandIcon}><img src={logo} className={styles.logoImage} /></div>

        <h2 className={styles.formTitle}>Hello!</h2>
        <p  className={styles.formSubtitle}>Please enter your details</p>

        {error   && <p className={styles.errorMsg}>{error}</p>}
        {success && <p className={styles.successMsg}>{success}</p>}

        <form onSubmit={handleRegister} className={styles.registerForm}>
          <div className={styles.nameFields}>
            <div className={styles.nameField}>
              <label className={styles.inputLabel}>Name</label>
              <input type="text" placeholder="Enter your name" value={name}
                     onChange={e => setName(e.target.value)} required />
            </div>
            <div className={styles.nameField}>
              <label className={styles.inputLabel}>Surname</label>
              <input type="text" placeholder="Enter your surname" value={surname}
                     onChange={e => setSurname(e.target.value)} required />
            </div>
          </div>

          <label className={styles.inputLabel}>E‑mail</label>
          <input type="email" placeholder="Enter your E‑mail" value={email}
                 onChange={e => setEmail(e.target.value)} required />

          <label className={styles.inputLabel}>Password</label>
          <input type="password" placeholder="Enter your password" value={password}
                 onChange={e => setPassword(e.target.value)} required />

          <label className={styles.inputLabel}>Repeat password</label>
          <input type="password" placeholder="Retype your password" value={confirm}
                 onChange={e => setConfirm(e.target.value)} required />

          <button type="submit" className={styles.registerButton}>Sign up</button>
        </form>

        <p className={styles.footerText}>
          Already have an account?{' '}
          <Link to="/login" className={styles.loginLink}>Log in</Link>
        </p>
      </div>
    </div>
  );
};

export default RegisterPage;
