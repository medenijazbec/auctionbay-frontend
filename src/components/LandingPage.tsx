import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './LandingPage.css';

/* ───── Assets ───────────────────────────────────────────── */
import logo        from '../assets/logo.png';
import houseIcon   from '../assets/home.png';
import profileIcon from '../assets/profile.png';
import bellIcon    from '../assets/bell.png';
import plusIcon    from '../assets/plus.png';
import userPicIcon from '../assets/userpic.png';
import gearIcon    from '../assets/gear.png';
import trashIcon   from '../assets/trash.png';
import clock15     from '../assets/15clock.png';
import clock30     from '../assets/30clock.png';
import clock45     from '../assets/45clock.png';

/* ───── Types & constants ────────────────────────────────── */
interface Auction {
  auctionId:     number;
  title:         string;
  description:   string;
  startingPrice: number;
  startDateTime: string;
  endDateTime:   string;
  auctionState:  'outbid' | 'inProgress' | 'winning' | 'done';
  createdBy:     string;
  mainImageUrl?: string;
}
interface ProfileMeDto {
  firstName?: string;
  lastName?:  string;
  email:      string;
  id:         string;
  profilePictureUrl?: string;
}

const BACKEND_BASE_URL = 'https://localhost:7056';

/* ───── Helpers ──────────────────────────────────────────── */
const getTagText = (s:Auction['auctionState']) =>
  s === 'inProgress' ? 'In progress'
  : s === 'winning'  ? 'Winning'
  : s === 'done'     ? 'Done'
  : 'Outbid';

const getTimeText = (s:Auction['auctionState']) =>
  s === 'inProgress' ? '30h'
  : s === 'winning'  ? '20h'
  : s === 'done'     ? '0h'
  : '24h';

const getStatusClass = (s:Auction['auctionState']) =>
  s === 'inProgress' ? 'editable'
  : s === 'winning'  ? 'winning'
  : s === 'done'     ? 'done'
  : '';

const getClockIcon = (end:string) => {
  const hrs = (new Date(end).getTime() - Date.now()) / 3.6e6;
  return hrs <= 15 ? clock15 : hrs <= 30 ? clock30 : clock45;
};

const imgUrl = (u?:string) => u?.startsWith('http') ? u : `${BACKEND_BASE_URL}${u ?? ''}`;

/* ─────────────────────────────────────────────────────────── */
const LandingPage:React.FC = () => {
  const nav  = useNavigate();
  const jwt  = localStorage.getItem('token');

  /* ─── greeting state ─────────────────────────────── */
  const [userName, setUserName] = useState<string>('there');

  useEffect(() => {
    if (!jwt) return;

    fetch(`${BACKEND_BASE_URL}/api/Profile/me`, {
      headers: { Authorization: `Bearer ${jwt}` }
    })
      .then(async r => {
        if (!r.ok) throw new Error('unauthorised');
        const p: ProfileMeDto = await r.json();

        const niceName = `${p.firstName ?? ''} ${p.lastName ?? ''}`.trim()
                      || p.email.split('@')[0]
                      || 'there';
        setUserName(niceName);
      })
      .catch(() => {
        localStorage.removeItem('token');
        setUserName('there');
      });
  }, [jwt]);

  /* ─── dropdown ───────────────────────────────────── */
  const [menuOpen, setMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const logOut = () => {
    localStorage.removeItem('token');
    nav('/login', { replace:true });
  };

  /* ─── auctions data ──────────────────────────────── */
  const [auctions,   setAuctions]   = useState<Auction[]>([]);
  const [page,       setPage]       = useState(1);
  const [hasMore,    setHasMore]    = useState(true);
  const [loading,    setLoading]    = useState(false);

  const [activeNav,  setActiveNav]  = useState<'auctions'|'profile'>('auctions');
  const [subTab,     setSubTab]     = useState<'myAuctions'|'bidding'|'won'>('myAuctions');

  const [myAuctions, setMyAuctions] = useState<Auction[]>([]);
  const [bidding]    = useState<Auction[]>([]);
  const [won]        = useState<Auction[]>([]);

  /* ─── load public auctions ───────────────────────── */
  useEffect(() => {
    if (activeNav !== 'auctions') return;

    setLoading(true);
    fetch(`${BACKEND_BASE_URL}/api/Auctions?page=${page}&pageSize=9`)
      .then(r => r.json())
      .then((rows:Auction[]) => {
        setAuctions(prev => [...prev, ...rows]);
        if (rows.length < 9) setHasMore(false);
      })
      .finally(() => setLoading(false));
  }, [page, activeNav]);

  /* ─── click outside profile popup ────────────────── */
  useEffect(() => {
    const onBodyClick = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };

    if (menuOpen) document.addEventListener('click', onBodyClick);
    return () => document.removeEventListener('click', onBodyClick);
  }, [menuOpen]);


  /* ─── infinite scroll ────────────────────────────── */
  useEffect(() => {
    const onScroll = () => {
      if (loading || !hasMore || activeNav !== 'auctions') return;
      if (window.innerHeight + window.scrollY + 200 >= document.body.scrollHeight) {
        setPage(p => p + 1);
      }
    };
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, [loading, hasMore, activeNav]);



  /* ─── profile data ───────────────────────────────── */

  useEffect(() => {
    if (!jwt) return;
  
    fetch(`${BACKEND_BASE_URL}/api/Profile/me`, {
      headers: { Authorization: `Bearer ${jwt}` }
    })
      .then(async r => {
        if (r.status === 401)  throw new Error('unauthorized');   //only 401
        if (!r.ok)             throw new Error('server');
  
        const p: ProfileMeDto = await r.json();
        const niceName =
          `${p.firstName ?? ''} ${p.lastName ?? ''}`.trim() ||
          p.email.split('@')[0] ||
          'there';
        setUserName(niceName);
      })
      .catch(err => {
        if (err.message === 'unauthorized') {
          localStorage.removeItem('token');        // token really invalid
        }
        setUserName('there');
      });
  }, [jwt]);






  /* ─── profile delete ────────────────────────────── */
  const handleDelete = (id:number) => {
    if (!confirm('Delete this auction?')) return;

    fetch(`${BACKEND_BASE_URL}/api/Profile/auction/${id}`, {
      method:'DELETE',
      headers:{ Authorization:`Bearer ${jwt}` }
    }).then(r => {
      if (r.ok) setMyAuctions(prev => prev.filter(a => a.auctionId !== id));
    });
  };

  /* ─── helpers ─────────────────────────────────────── */
  const placeholders = (n:number) => Array.from({ length:n }, (_,i) => (
    <div key={`ph-${i}`} className="auction-card auction-card--placeholder" />
  ));

  const currentCount =
    subTab === 'myAuctions' ? myAuctions.length :
    subTab === 'bidding'    ? bidding.length    :
                              won.length;

  const isProfileFixed = activeNav === 'profile' && currentCount === 0;

  /* ────────────────────────── JSX ───────────────────────── */
  return (
    <div className="landing-container">
      {/* ── Top nav ─────────────────────────────────────── */}
      <header className="top-nav">
        <div className="top-nav-left"><img src={logo} className="nav-logo" /></div>
        <div className="top-nav-right">
          {jwt
            ? <span className="logged-as">Logged in as <b>{userName}</b></span>
            : (<>
                <Link to="/login"    className="top-nav-login">Log in</Link>{' or '}
                <Link to="/register" className="top-nav-signup">Sign Up</Link>
              </>)
          }
        </div>
      </header>

      {/* ── Hero ───────────────────────────────────────── */}
      <section className="hero-section">
        <h1 className="hero-title">E‑auctions made easy!</h1>
        <p className="hero-subtitle">
          Simple way for selling your unused products,<br />
          or getting a deal on a product you want!
        </p>
        <button className="cta-button">Start bidding</button>
      </section>

      {/* ── Thick frame ───────────────────────────────── */}
      <div className="auctions-container-wrapper">
        <div className={`auctions-container ${isProfileFixed ? 'auctions-container--fixed' : ''}`}>

          {/* -------- Frame top‑bar -------- */}
          <div className="frame-topbar">
            <div className="frame-topbar-left">
              <div className="logo-circle"><img src={logo} className="topbar-logo" /></div>
              <div className="left-pill-container">
                <button className={`nav-btn ${activeNav==='auctions' ? 'nav-btn-active' : ''}`}
                        onClick={() => setActiveNav('auctions')}>
                  <img src={houseIcon} /> <span>Auctions</span>
                </button>
                <button className={`nav-btn ${activeNav==='profile' ? 'nav-btn-active' : ''}`}
                        onClick={() => setActiveNav('profile')}>
                  <img src={profileIcon} /> <span>Profile</span>
                </button>
              </div>
            </div>

            <div className="frame-topbar-right">
              <div className="right-pill-container">
                <button className="icon-button bell-btn"><img src={bellIcon}/></button>
                <button className="icon-button plus-btn"><img src={plusIcon}/></button>

                {/* avatar + menu */}
                <div
                  className="icon-button user-btn"
                  ref={userMenuRef}
                  onClick={() => setMenuOpen(o => !o)}
                  onMouseEnter={() => setMenuOpen(true)}
                >
                  <img src={userPicIcon} alt="Your avatar" />
                  {menuOpen && (
                    <div className="user-menu">
                      <Link to="/profile" className="menu-link">
                        <img src={gearIcon} alt="" /> Profile settings
                      </Link>
                      <button className="logout-btn" onClick={logOut}>Log out</button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* -------- AUCTIONS TAB -------- */}
          {activeNav === 'auctions' && (
            <>
              <header className="auctions-header"><h2 className="auctions-title">Auctions</h2></header>

              {auctions.length ? (
                <div className="auction-grid">
                  {auctions.map(a => (
                    <div className="auction-card" key={a.auctionId}>
                      <div className="auction-card-header">
                        <span className={`auction-tag ${getStatusClass(a.auctionState)}`}>{getTagText(a.auctionState)}</span>
                        <span className={`time-tag ${getStatusClass(a.auctionState)}`}>
                          {getTimeText(a.auctionState)}
                          <img src={getClockIcon(a.endDateTime)} className="clock-icon" />
                        </span>
                      </div>
                      <div className="auction-card-info">
                        <div className="auction-title">{a.title}</div>
                        <div className="auction-price">{a.startingPrice} €</div>
                      </div>
                      <div className="auction-card-image-container">
                        <img src={imgUrl(a.mainImageUrl)} className="auction-card-image" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="empty-state">
                  <h3>Oh no, no auctions yet!</h3>
                  <p>Click “+” in the nav bar to create a new auction.</p>
                </div>
              )}
              {loading && hasMore && <div className="loading-more">Loading more…</div>}
            </>
          )}

          {/* -------- PROFILE TAB -------- */}
          {activeNav === 'profile' && (
            <div className="profile-view">
              <h2 className="profile-greeting">Hello {userName}!</h2>

              {/* sub‑tab pill */}
              <div className="profile-tabs">
                <button className={`profile-tab ${subTab==='myAuctions' ? 'profile-tab--active' : ''}`}
                        onClick={() => setSubTab('myAuctions')}>My auctions</button>
                <button className={`profile-tab ${subTab==='bidding' ? 'profile-tab--active' : ''}`}
                        onClick={() => setSubTab('bidding')}>Bidding</button>
                <button className={`profile-tab ${subTab==='won' ? 'profile-tab--active' : ''}`}
                        onClick={() => setSubTab('won')}>Won</button>
              </div>

              <div className="profile-content">
                {/* --- My auctions --- */}
                {subTab==='myAuctions' && (
                  myAuctions.length ? (
                    <div className="auction-grid">
                      {myAuctions.map(a => (
                        <div className="auction-card" key={a.auctionId}>
                          <div className="auction-card-header">
                            <span className={`auction-tag ${getStatusClass(a.auctionState)}`}>{getTagText(a.auctionState)}</span>
                            <span className={`time-tag ${getStatusClass(a.auctionState)}`}>
                              {getTimeText(a.auctionState)}
                              <img src={getClockIcon(a.endDateTime)} className="clock-icon" />
                            </span>
                          </div>
                          <div className="auction-card-info">
                            <div className="auction-title">{a.title}</div>
                            <div className="auction-price">{a.startingPrice} €</div>
                          </div>
                          <div className="auction-card-image-container">
                            <img src={imgUrl(a.mainImageUrl)} className="auction-card-image" />
                          </div>
                          {a.auctionState==='inProgress' && (
                            <div className="auction-card-actions">
                              <button className="action-button delete-button" onClick={() => handleDelete(a.auctionId)}>
                                <img src={trashIcon} alt="" />
                              </button>
                              <button className="action-button edit-button">Edit</button>
                            </div>
                          )}
                        </div>
                      ))}
                      {placeholders((6 - (myAuctions.length % 6)) % 6)}
                    </div>
                  ) : (
                    <>
                      <div className="auction-grid">{placeholders(6)}</div>
                      <div className="empty-state">
                        <h3>Oh no, no auctions added!</h3>
                        <p>Click “+” in the nav bar to add your first auction.</p>
                      </div>
                    </>
                  )
                )}

                {/* --- Bidding --- */}
                {subTab==='bidding' && (
                  bidding.length ? (
                    <div className="auction-grid">
                      {/* map your bidding rows here */}
                      {placeholders((6 - (bidding.length % 6)) % 6)}
                    </div>
                  ) : (
                    <>
                      <div className="auction-grid">{placeholders(6)}</div>
                      <div className="empty-state">
                        <h3>No bidding in progress!</h3>
                        <p>Start bidding by browsing auctions.</p>
                      </div>
                    </>
                  )
                )}

                {/* --- Won --- */}
                {subTab==='won' && (
                  won.length ? (
                    <div className="auction-grid">
                      {/* map won auctions here */}
                      {placeholders((6 - (won.length % 6)) % 6)}
                    </div>
                  ) : (
                    <>
                      <div className="auction-grid">{placeholders(6)}</div>
                      <div className="empty-state">
                        <h3>Nothing here yet?</h3>
                        <p>Your won items will appear here.</p>
                      </div>
                    </>
                  )
                )}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default LandingPage;
