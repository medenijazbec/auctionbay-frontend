import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import styles from './RegisterPage.module.css';

/* ───── assets ───────────────────────────────────────── */
import logo     from '../assets/logo.png';
import clock0   from '../assets/0clock.png';
import clock7   from '../assets/7clock.png';
import clock15  from '../assets/15clock.png';
import clock25  from '../assets/25clock.png';
import clock30  from '../assets/30clock.png';
import clock37  from '../assets/37clock.png';
import clock45  from '../assets/45clock.png';
import clock53  from '../assets/53clock.png';
import clock60  from '../assets/60clock.png';

const CLOCKS = [
  clock0, clock7, clock15, clock25,
  clock30, clock37, clock45, clock53, clock60
];

const BACKEND_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

/* ───── types ─────────────────────────────────────────── */
interface Auction {
  auctionId:     number;
  title:         string;
  startingPrice: number;
  startDateTime: string;
  endDateTime:   string;
  auctionState:  'outbid' | 'inProgress' | 'winning' | 'done';
  thumbnailUrl?:  string;
  mainImageUrl?: string;
}

interface ApiMessage {
  Errors?: { Description: string }[];
  Message?: string;
}

/* ───── helpers — identical to login page ────────────── */
const imgUrl = (u?: string) =>
  u?.startsWith('http') ? u : `${BACKEND_BASE_URL}${u ?? ''}`;

const getTagText = (s: Auction['auctionState']) =>
  s === 'inProgress' ? 'In progress'
: s === 'winning'    ? 'Winning'
: s === 'done'       ? 'Done'
:                      'Outbid';

const getStatusClass = (s: Auction['auctionState']) =>
  s === 'inProgress' ? 'editable'
: s === 'winning'    ? 'winning'
: s === 'done'       ? 'done'
:                      'outbid';

const hoursLeft = (endISO: string) =>
  Math.max(0, (new Date(endISO).getTime() - Date.now()) / 3_600_000);

const getTimeTagClass = (endISO: string) =>
  hoursLeft(endISO) <= 1 ? styles.urgent : styles.neutral;

const formatTimeLeft = (endISO: string) => {
  const ms   = Math.max(0, new Date(endISO).getTime() - Date.now());
  const mins = Math.ceil(ms / 60_000);
  if (mins < 60)               return `${mins} m`;
  const hrs  = Math.floor(mins / 60);
  if (hrs < 24)                return `${hrs} h`;
  return `${Math.ceil(hrs / 24)} d`;
};

const getClockIcon = (startISO: string, endISO: string) => {
  const now = Date.now();
  const s   = new Date(startISO).getTime();
  const e   = new Date(endISO).getTime();
  const pct = Math.min(Math.max((now - s) / (e - s), 0), 1);
  const idx = Math.round(pct * (CLOCKS.length - 1));
  return CLOCKS[idx];
};

/* ───── component ─────────────────────────────────────── */
const RegisterPage: React.FC = () => {
  const nav = useNavigate();

  /* promo auctions */
  const [auctions, setAuctions] = useState<Auction[]>([]);

  /* form state */
  const [name,   setName]   = useState('');
  const [surname, setSurname] = useState('');
  const [email,  setEmail]  = useState('');
  const [pass,   setPass]   = useState('');
  const [repeat, setRepeat] = useState('');

  const [msg, setMsg] =
    useState<{ type:'error'|'success'; text:string }|null>(null);

  /* fetch promo grid once */
  useEffect(() => {
    fetch(`${BACKEND_BASE_URL}/api/Auctions?page=1&pageSize=20`)
      .then(r => r.json())
      .then((rows: Auction[]) =>
        setAuctions(
          rows.map(a => ({
            ...a,
            auctionState: a.auctionState as Auction['auctionState'],
          }))
        )
      )
      .catch(() => {});
  }, []);

  const promoAuctions = useMemo(() => {
    if (auctions.length <= 4) return auctions;
    return [...auctions].sort(() => Math.random() - 0.5).slice(0, 4);
  }, [auctions]);

  /* registration handler */
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg(null);

    if (pass !== repeat) {
      setMsg({ type:'error', text:'Passwords do not match.' });
      return;
    }

    try {
      const resp = await fetch(`${BACKEND_BASE_URL}/api/Auth/register`, {
        method : 'POST',
        headers: { 'Content-Type':'application/json' },
        body   : JSON.stringify({
          name,
          surname,
          email,
          password:         pass,
          confirmPassword:  repeat
        })
      });

      const data: ApiMessage = await resp.json();

      if (!resp.ok) {
        setMsg({
          type :'error',
          text : data.Errors?.[0]?.Description || data.Message || 'Registration failed.'
        });
        return;
      }

      setMsg({ type:'success', text:'Registration successful! Redirecting…' });
      setTimeout(() => nav('/login', { replace:true }), 1500);
    } catch {
      setMsg({ type:'error', text:'Network error. Please try again.' });
    }
  };

  /* ── render ── */
  return (
    <div className={styles.registerPageContainer}>
      {/* left column – promo grid */}
      <div className={styles.auctionGridContainer}>
        <div className={styles.auctionGrid}>
          {promoAuctions.map(a => {
            const isDone = a.auctionState === 'done';
            return (
              <div key={a.auctionId} className={styles.auctionCard}>
                <div className={styles.auctionCardHeader}>
                  {/* status pill */}
                  <span
                    className={`${styles.auctionTag} ${styles[getStatusClass(a.auctionState)]}`}
                  >
                    {getTagText(a.auctionState)}
                  </span>

                  {/* time pill */}
                  {!isDone && (
                    <span
                      className={`${styles.timeTag} ${getTimeTagClass(a.endDateTime)}`}
                    >
                      {formatTimeLeft(a.endDateTime)}
                      <img
                        src={getClockIcon(a.startDateTime, a.endDateTime)}
                        className={styles.clockIcon}
                        alt=""
                      />
                    </span>
                  )}
                </div>

                <div className={styles.auctionCardInfo}>
                  <div className={styles.auctionTitle}>{a.title}</div>
                  <div className={styles.auctionPrice}>{a.startingPrice} €</div>
                </div>

                <div className={styles.auctionCardImageContainer}>
                  <img
                    className={styles.auctionCardImage}
                    src={imgUrl(a.thumbnailUrl || a.mainImageUrl)}
                    alt={a.title}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* right column – form */}
      <div className={styles.registerFormContainer}>
        <div className={styles.brandIcon}><img src={logo} className={styles.logoImage} /></div>

        <h2 className={styles.formTitle}>Hello!</h2>
        <p  className={styles.formSubtitle}>Please enter your details</p>

        {msg && (
          <p className={msg.type === 'error' ? styles.errorMsg : styles.successMsg}>
            {msg.text}
          </p>
        )}

        <form onSubmit={handleRegister} className={styles.registerForm}>
          <div className={styles.nameFields}>
            <div className={styles.nameField}>
              <label className={styles.inputLabel}>Name</label>
              <input
                type="text"
                placeholder="Enter your name"
                value={name}
                onChange={e => setName(e.target.value)}
                required
              />
            </div>
            <div className={styles.nameField}>
              <label className={styles.inputLabel}>Surname</label>
              <input
                type="text"
                placeholder="Enter your surname"
                value={surname}
                onChange={e => setSurname(e.target.value)}
                required
              />
            </div>
          </div>

          <label className={styles.inputLabel}>E-mail</label>
          <input
            type="email"
            placeholder="Enter your E-mail"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
          />

          <label className={styles.inputLabel}>Password</label>
          <input
            type="password"
            placeholder="Enter your password"
            value={pass}
            onChange={e => setPass(e.target.value)}
            required
          />

          <label className={styles.inputLabel}>Repeat password</label>
          <input
            type="password"
            placeholder="Retype your password"
            value={repeat}
            onChange={e => setRepeat(e.target.value)}
            required
          />

          <button type="submit" className={styles.registerButton}>Sign up</button>
        </form>

        <p className={styles.footerText}>
          Already have an account?{' '}
          <Link to="/login" className={styles.loginLink}>Log in</Link>
        </p>
      </div>
    </div>
  );
};

export default RegisterPage;
