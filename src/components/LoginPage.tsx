import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import styles from './LoginPage.module.css';

import logo     from '../assets/logo.png';
import clock15  from '../assets/15clock.png';
import clock30  from '../assets/30clock.png';
import clock45  from '../assets/45clock.png';

const BACKEND_BASE_URL = 'https://localhost:7056';

/* ─── Types ────────────────────────────────────────────── */
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
interface LoginResponse {
  Token?:  string;  // what the backend sends
  token?:  string;  // just in case it’s lower‑case
  Error?:  string;
  Message?:string;
}

/* ─── Helpers (same as LandingPage) ────────────────────── */
const getTagText = (s: string) =>
  s === 'inProgress' ? 'In progress'
: s === 'winning'    ? 'Winning'
: s === 'done'       ? 'Done'
:                      'Outbid';

const getTimeText = (s: string) =>
  s === 'inProgress' ? '30h'
: s === 'winning'    ? '20h'
: s === 'done'       ? '0h'
:                      '24h';

const getStatusClass = (s: string) =>
  s === 'inProgress' ? 'editable'
: s === 'winning'    ? 'winning'
: s === 'done'       ? 'done'
:                      '';

const getClockIcon = (end: string) => {
  const hrs = (new Date(end).getTime() - Date.now()) / 3.6e6;
  return hrs <= 15 ? clock15 : hrs <= 30 ? clock30 : clock45;
};

/* ──────────────────────────────────────────────────────── */
const LoginPage: React.FC = () => {
  const navigate = useNavigate();

  /* promo auctions */
  const [auctions, setAuctions] = useState<Auction[]>([]);

  /* form state */
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [msg,      setMsg]      = useState<{ type: 'error'|'success'; text: string }|null>(null);

  /* fetch promo auctions ONCE */
  useEffect(() => {
    fetch(`${BACKEND_BASE_URL}/api/Auctions?page=1&pageSize=20`)
      .then(r => r.json())
      .then(setAuctions)
      .catch(() => {/* ignore promo grid errors */});
  }, []);

  /* memoised “pick ≤4 random auctions” */
  const promoAuctions = useMemo(() => {
    if (auctions.length <= 4) return auctions;
    const shuffled = [...auctions].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, 4);
  }, [auctions]);

  /* login handler */
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg(null);

    try {
      const resp = await fetch(`${BACKEND_BASE_URL}/api/Auth/login`, {
        method : 'POST',
        headers: { 'Content-Type': 'application/json' },
        /* backend DTO uses Email / Password (Pascal‑case) */
        body   : JSON.stringify({ Email: email, Password: password })
      });

      const data: LoginResponse = await resp.json();

      if (!resp.ok || (!data.Token && !data.token)) {
        const text = data.Error || data.Message || 'Login failed.';
        setMsg({ type:'error', text });
        return;
      }

      /* success */
      const jwt = data.Token || data.token!;
      localStorage.setItem('token', jwt);
      setMsg({ type:'success', text:'Login successful! Redirecting…' });
      navigate('/landing', { replace: true });
    } catch {
      setMsg({ type:'error', text:'Network error. Please try again.' });
    }
  };

  /* ─── JSX ────────────────────────────────────────────── */
  return (
    <div className={styles.registerPageContainer}>
      {/* ── Left column – promo grid ───────────────────── */}
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
                  src={
                    a.mainImageUrl
                      ? `${BACKEND_BASE_URL}${a.mainImageUrl}`
                      : `${BACKEND_BASE_URL}/placeholder.png`
                  }
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Right column – login form ─────────────────── */}
      <div className={styles.registerFormContainer}>
        <div className={styles.brandIcon}>
          <img src={logo} className={styles.logoImage} />
        </div>

        <h2 className={styles.formTitle}>Welcome back!</h2>
        <p  className={styles.formSubtitle}>Please enter your details</p>

        {msg && (
          <p className={msg.type === 'error' ? styles.errorMsg : styles.successMsg}>
            {msg.text}
          </p>
        )}

        <form onSubmit={handleLogin} className={styles.registerForm}>
          <label className={styles.inputLabel}>E‑mail</label>
          <input
            type="email"
            placeholder="Enter your E‑mail"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
          />

          <label className={styles.inputLabel}>Password</label>
          <input
            type="password"
            placeholder="Enter your password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
          />

          <div style={{ width:'100%', textAlign:'right', marginBottom:16 }}>
            <Link to="/forgot-password" style={{ textDecoration:'none', color:'#6c7078' }}>
              Forgot password?
            </Link>
          </div>

          <button type="submit" className={styles.registerButton}>Login</button>
        </form>

        <p className={styles.footerText}>
          Don’t have an account?{' '}
          <Link to="/register" className={styles.loginLink}>Sign Up</Link>
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
