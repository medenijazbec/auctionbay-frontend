import React, {
  useState,
  useEffect,
  useRef,
  ChangeEvent,
  FormEvent
} from 'react';
import { Outlet, useParams, useNavigate, Link } from 'react-router-dom';
import styles from './AuctionsPage.module.css';



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
import profileWhiteIcon   from '../assets/profile_white.png';
import houseWhiteIcon     from '../assets/home_white.png';


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

const getTimeText = (end: string) => {
  const diffMs = new Date(end).getTime() - Date.now();
  if (diffMs <= 0) return '0h';
  const hrs = diffMs / 3_600_000;
  if (hrs < 24) return `${Math.ceil(hrs)}h`;
  const days = diffMs / 86_400_000;
  return `${Math.ceil(days)} days`;
};

const getStatusClass = (s:Auction['auctionState']) =>
  s === 'inProgress' ? 'editable'
  : s === 'winning'  ? 'winning'
  : s === 'done'     ? 'done'
  : 'outbid';

const getClockIcon = (end:string) => {
  const hrs = (new Date(end).getTime() - Date.now()) / 3.6e6;
  return hrs <= 15 ? clock15 : hrs <= 30 ? clock30 : clock45;
};

const imgUrl = (u?:string) =>
  u?.startsWith('http')
    ? u
    : `${BACKEND_BASE_URL}${u ?? ''}`;

/* ─────────────────────────────────────────────────────────── */
const AuctionsPage:React.FC = () => {
  const nav  = useNavigate();
  const jwt  = localStorage.getItem('token');

  // ── recognise when we are on /auctions/:id ──────────────────
  const { id }  = useParams();        // undefined on the list, string on details
  const navigate = useNavigate();     // for the back button


  /* ─── greeting state ─────────────────────────────── */
  const [userName, setUserName] = useState<string>('there');
  const [avatar,   setAvatar]   = useState<string>(userPicIcon);

  /* ─── fetch logged-in user once ────────────────────── */
  useEffect(() => {
    if (!jwt) return;
    fetch(`${BACKEND_BASE_URL}/api/Profile/me`, {
      headers: { Authorization: `Bearer ${jwt}` }
    })
      .then(async r => {
        if (!r.ok) throw new Error('unauthorised');
        const p: ProfileMeDto = await r.json();
        setUserName(
          `${p.firstName ?? ''} ${p.lastName ?? ''}`.trim() ||
          p.email.split('@')[0] ||
          'there'
        );
        setAvatar(
          p.profilePictureUrl ? imgUrl(p.profilePictureUrl) : userPicIcon
        );
      })
      .catch(() => {
        localStorage.removeItem('token');
        setUserName('there');
        setAvatar(userPicIcon);
      });
  }, [jwt]);

  /* ─── dropdown ───────────────────────────────────── */
  const [menuOpen, setMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const logOut = () => {
    localStorage.removeItem('token');
    nav('/login', { replace:true });
  };
  useEffect(() => {
    const onBodyClick = (e: MouseEvent) => {
      if (
        userMenuRef.current &&
        !userMenuRef.current.contains(e.target as Node)
      ) {
        setMenuOpen(false);
      }
    };
    if (menuOpen) document.addEventListener('click', onBodyClick);
    return () =>
      document.removeEventListener('click', onBodyClick);
  }, [menuOpen]);

  /* ─── auctions data ──────────────────────────────── */
  const [auctions,   setAuctions]   = useState<Auction[]>([]);
  const [page,       setPage]       = useState(1);
  const [hasMore,    setHasMore]    = useState(true);
  const [loading,    setLoading]    = useState(false);
  const [activeNav,  setActiveNav]  = useState<'auctions'|'profile'>('auctions');
  const [subTab,     setSubTab]     = useState<'myAuctions'|'bidding'|'won'>('myAuctions');
  const [myAuctions, setMyAuctions] = useState<Auction[]>([]);
  const [bidding,    setBidding]    = useState<Auction[]>([]);
  const [won,        setWon]        = useState<Auction[]>([]);

  /* Public auctions */
  useEffect(() => {
    if (activeNav !== 'auctions') return;
    setLoading(true);
    fetch(
      `${BACKEND_BASE_URL}/api/Auctions?page=${page}&pageSize=9`
    )
      .then(r => r.json())
      .then((rows:Auction[]) => {
        setAuctions(prev => [...prev, ...rows]);
        if (rows.length < 9) setHasMore(false);
      })
      .finally(() => setLoading(false));
  }, [page, activeNav]);

  useEffect(() => {
    const onScroll = () => {
      if (loading || !hasMore || activeNav !== 'auctions')
        return;
      if (
        window.innerHeight + window.scrollY + 200 >=
        document.body.scrollHeight
      ) {
        setPage(p => p + 1);
      }
    };
    window.addEventListener('scroll', onScroll);
    return () =>
      window.removeEventListener('scroll', onScroll);
  }, [loading, hasMore, activeNav]);

  /* “My auctions” */
  useEffect(() => {
    if (activeNav !== 'profile') return;
    fetch(`${BACKEND_BASE_URL}/api/Profile/auctions`, {
      headers: { Authorization: `Bearer ${jwt}` }
    })
      .then(r => r.json())
      .then((rows:Auction[]) => setMyAuctions(rows));
    /* TODO: fetch bidding & won when those tabs are active */
  }, [activeNav]);

  const handleDelete = (id:number) => {
    if (!confirm('Delete this auction?')) return;
    fetch(`${BACKEND_BASE_URL}/api/Profile/auction/${id}`, {
      method:'DELETE',
      headers:{ Authorization:`Bearer ${jwt}` }
    }).then(r => {
      if (r.ok)
        setMyAuctions(prev => prev.filter(a => a.auctionId !== id));
    });
  };

  const placeholders = (n:number) =>
    Array.from({ length:n }, (_,i) => (
      <div
        key={`ph-${i}`}
        className={`${styles['auction-card']} ${styles['auction-card--placeholder']}`}
      />
    ));

  const currentCount =
    subTab === 'myAuctions'
      ? myAuctions.length
      : subTab === 'bidding'
        ? bidding.length
        : won.length;

  const isProfileFixed =
    activeNav === 'profile' && currentCount === 0;

  /* ─── ADD AUCTION POPUP STATE ─────────────────────── */
  const [addOpen, setAddOpen] = useState(false);
  const [file, setFile] = useState<File|null>(null);
  const [preview, setPreview] = useState<string|null>(null);
  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [price, setPrice] = useState('');
  const [endDate, setEndDate] = useState('');

  const onAddSelect = (e: ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    setPreview(URL.createObjectURL(f));
  };
  const removeImage = () => { setFile(null); setPreview(null); };

  const submitAuction = async (e: FormEvent) => {
    e.preventDefault();
    const fd = new FormData();
    if (file) fd.append("image", file);
    fd.append("title",         title);
    fd.append("description",   desc);
    fd.append("startingPrice", price);
    fd.append("endDateTime",   endDate);

    const res = await fetch(`${BACKEND_BASE_URL}/api/Auctions`, {
      method : "POST",
      headers: { Authorization: `Bearer ${jwt}` },
      body   : fd
    });
    if (!res.ok) { alert("Failed to add auction."); return; }

    /* reset + refresh */
    setAuctions([]); setPage(1); setHasMore(true);
    setAddOpen(false);
    setFile(null); setPreview(null);
    setTitle(''); setDesc(''); setPrice(''); setEndDate('');
  };

  return (
    <div className={styles['landing-container']}>
      <header className={styles['top-nav']}>
        <div className={styles['top-nav-left']}>
          <div className={styles['frame-topbar-left']}>
            <div className={styles['logo-circle']}>
              <img src={logo} className={styles['topbar-logo']} />
            </div>
            <div className={styles['left-pill-container']}>
              <button
                className={`${styles['nav-btn']} ${
                  activeNav === 'auctions'
                    ? styles['nav-btn-active']
                    : ''
                }`}
                onClick={() => setActiveNav('auctions')}
              >
                <img src={activeNav === 'auctions'? houseWhiteIcon: houseIcon}alt="Auctions"/> <span>Auctions</span>
              </button>
              <button
                className={`${styles['nav-btn']} ${
                  activeNav === 'profile'
                    ? styles['nav-btn-active']
                    : ''
                }`}
                onClick={() => setActiveNav('profile')}
              >
                <img src={activeNav === 'profile'?profileWhiteIcon: profileIcon}alt="Profile"/>{" "}
                <span>Profile</span>
              </button>
            </div>
          </div>
        </div>
        <div className={styles['top-nav-right']}>
          <div className={styles['right-pill-container']}>
            <button className={`${styles['icon-button']} ${styles['bell-btn']}`}>
              <img src={bellIcon} alt="" />
            </button>
            <button
              className={`${styles['icon-button']} ${styles['plus-btn']}`}
              onClick={() => setAddOpen(true)}
            >
              <img src={plusIcon} alt="" />
            </button>
            <div
              className={`${styles['icon-button']} ${styles['user-btn']}`}
              ref={userMenuRef}
              onClick={() => setMenuOpen(o => !o)}
              onMouseEnter={() => setMenuOpen(true)}
            >
              <img
                src={avatar}
                alt="Your avatar"
                className={styles['user-avatar']}
              />
              {menuOpen && (
                <div className={styles['user-menu']}>
                  <Link to="/profile" className={styles['menu-link']}>
                    <img
                      src={gearIcon}
                      alt=""
                      className={styles['menu-gear-icon']}
                    />
                    Profile settings
                  </Link>
                  <button
                    className={styles['logout-btn']}
                    onClick={logOut}
                  >
                    Log out
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* ─── SINGLE DETAILED AUCTION ─────────────────────────────────── */}
















      {/* ─── PUBLIC AUCTIONS ─────────────────────────────────── */}
      {activeNav === 'auctions' && (
        <>
          {/* ① LIST — shown when there is **no** :id in the URL */}     
          {!id && (
            <div className={styles['auctions-container-wrapper']}>
              <h2 className={styles['auctions-title']}>Auctions</h2>

              <div className={styles['auctions-container']}>
                <div className={styles['auction-grid']}>
                  {auctions.map(a => {
                    const status = getStatusClass(a.auctionState);
                    return (
                      <Link                      /* path is still /auctions/:id */
                        to={`/auctions/${a.auctionId}`}
                        key={a.auctionId}
                        className={styles['auction-card']}
                        style={{ textDecoration: 'none', color: 'inherit' }}
                      >
                        {/* 🔹 ORIGINAL CARD MARK-UP – UNCHANGED 🔹 */}
                        <div className={styles['auction-card-header']}>
                          <span
                            className={`${styles['auction-tag']} ${styles[status]}`}
                          >
                            {getTagText(a.auctionState)}
                          </span>
                          <span
                            className={`${styles['time-tag']} ${styles[status]}`}
                          >
                            {getTimeText(a.endDateTime)}
                            <img
                              src={clock15}
                              className={styles['clock-icon']}
                              alt="time left"
                            />
                          </span>
                        </div>
                        <div className={styles['auction-card-info']}>
                          <div className={styles['auction-title']}>{a.title}</div>
                          <div className={styles['auction-price']}>
                            {a.startingPrice} €
                          </div>
                        </div>
                        <div className={styles['auction-card-image-container']}>
                          <img
                            src={imgUrl(a.mainImageUrl)}
                            className={styles['auction-card-image']}
                            alt={a.title}
                          />
                        </div>
                      </Link>
                    );
                  })}

                  {!loading && auctions.length === 0 && (
                    <p
                      style={{
                        gridColumn: '1 / -1',
                        textAlign: 'center',
                        color: '#777'
                      }}
                    >
                      No active auctions found.
                    </p>
                  )}
                </div>

                {loading && (
                  <div className={styles['loading-more']}>Loading more auctions…</div>
                )}
              </div>
            </div>
          )}

          {/* ② DETAILS — shown when :id is present */}       
          {id && (
            <div className={styles['detail-wrapper']}>
              <button
                className={styles['back-btn']}
                onClick={() => navigate('/auctions')}
              >
                ← Back to list
              </button>

              {/* <AuctionDetailPage /> is rendered here by React-Router */}
              <Outlet />
            </div>
          )}
        </>
      )}












      {/* ─── PROFILE VIEW ─────────────────────────────────────── */}
      {activeNav === 'profile' && (
        <div className={styles['profile-view']}>
          <h2 className={styles['profile-greeting']}>
            Hello {userName}!
          </h2>
          <div className={styles['profile-tabs']}>
            {(['myAuctions', 'bidding', 'won'] as const).map(tab => (
              <button
                key={tab}
                className={`${styles['profile-tab']} ${
                  subTab === tab
                    ? styles['profile-tab--active']
                    : ''
                }`}
                onClick={() => setSubTab(tab)}
              >
                {tab === 'myAuctions'
                  ? 'My auctions'
                  : tab === 'bidding'
                  ? 'Bidding'
                  : 'Won'}
              </button>
            ))}
          </div>

          <div className={styles['profile-content']}>
            {subTab === 'myAuctions' && (
              myAuctions.length ? (
                <div className={styles['auction-grid-wrapper']}>
                  <div className={styles['auction-grid']}>
                    {myAuctions.map(a => {
                      const status = getStatusClass(a.auctionState);
                      return (
                        <Link
                          to={`/auctions/${a.auctionId}`}
                          key={a.auctionId}
                          className={styles['auction-card']}
                          style={{
                            textDecoration: 'none',
                            color: 'inherit'
                          }}
                        >
                          <div className={styles['auction-card-header']}>
                            <span
                              className={`${styles['auction-tag']} ${styles[status]}`}
                            >
                              {getTagText(a.auctionState)}
                            </span>
                            <span
                              className={`${styles['time-tag']} ${styles[status]}`}
                            >
                              {getTimeText(a.endDateTime)}
                              <img
                                src={getClockIcon(a.endDateTime)}
                                className={styles['clock-icon']}
                                alt=""
                              />
                            </span>
                          </div>
                          <div
                            className={styles['auction-card-info']}
                          >
                            <div
                              className={styles['auction-title']}
                            >
                              {a.title}
                            </div>
                            <div
                              className={styles['auction-price']}
                            >
                              {a.startingPrice} €
                            </div>
                          </div>
                          <div
                            className={
                              styles[
                                'auction-card-image-container'
                              ]
                            }
                          >
                            <img
                              src={imgUrl(a.mainImageUrl)}
                              className={
                                styles['auction-card-image']
                              }
                              alt={a.title}
                            />
                          </div>
                          {a.auctionState === 'inProgress' && (
                            <div
                              className={
                                styles['auction-card-actions']
                              }
                            >
                              <button
                                className={`${styles['action-button']} ${styles['delete-button']}`}
                                onClick={e => {
                                  e.preventDefault();
                                  handleDelete(a.auctionId);
                                }}
                              >
                                <img
                                  src={trashIcon}
                                  alt="Delete"
                                />
                              </button>
                              <button
                                className={`${styles['action-button']} ${styles['edit-button']}`}
                              >
                                Edit
                              </button>
                            </div>
                          )}
                        </Link>
                      );
                    })}
                    {placeholders(
                      (6 - (myAuctions.length % 6)) % 6
                    )}
                  </div>
                </div>
              ) : (
                <>
                  <div className={styles['auction-grid']}>
                    {placeholders(6)}
                  </div>
                  <div className={styles['empty-state']}>
                    <h3>Oh no, no auctions added!</h3>
                    <p>
                      Click “+” in the nav bar to add your first
                      auction.
                    </p>
                  </div>
                </>
              )
            )}

            {subTab === 'bidding' && (
              bidding.length ? (
                <div className={styles['auction-grid']}>
                  {bidding.map(a => {
                    const status = getStatusClass(a.auctionState);
                    return (
                      <Link
                        to={`/auctions/${a.auctionId}`}
                        key={a.auctionId}
                        className={styles['auction-card']}
                        style={{
                          textDecoration: 'none',
                          color: 'inherit'
                        }}
                      >
                        <div className={styles['auction-card-header']}>
                          <span
                            className={`${styles['auction-tag']} ${styles[status]}`}
                          >
                            {getTagText(a.auctionState)}
                          </span>
                          <span
                            className={`${styles['time-tag']} ${styles[status]}`}
                          >
                            {getTimeText(a.endDateTime)}
                            <img
                              src={getClockIcon(a.endDateTime)}
                              className={styles['clock-icon']}
                              alt=""
                            />
                          </span>
                        </div>
                        <div
                          className={styles['auction-card-info']}
                        >
                          <div
                            className={styles['auction-title']}
                          >
                            {a.title}
                          </div>
                          <div
                            className={styles['auction-price']}
                          >
                            {a.startingPrice} €
                          </div>
                        </div>
                        <div
                          className={
                            styles['auction-card-image-container']
                          }
                        >
                          <img
                            src={imgUrl(a.mainImageUrl)}
                            className={
                              styles['auction-card-image']
                            }
                            alt={a.title}
                          />
                        </div>
                      </Link>
                    );
                  })}
                  {placeholders((6 - (bidding.length % 6)) % 6)}
                </div>
              ) : (
                <>
                  <div className={styles['auction-grid']}>
                    {placeholders(6)}
                  </div>
                  <div className={styles['empty-state']}>
                    <h3>No bidding in progress!</h3>
                    <p>Start bidding by browsing auctions.</p>
                  </div>
                </>
              )
            )}

            {subTab === 'won' && (
              won.length ? (
                <div className={styles['auction-grid']}>
                  {won.map(a => {
                    const status = getStatusClass(a.auctionState);
                    return (
                      <Link
                        to={`/auctions/${a.auctionId}`}
                        key={a.auctionId}
                        className={styles['auction-card']}
                        style={{
                          textDecoration: 'none',
                          color: 'inherit'
                        }}
                      >
                        <div className={styles['auction-card-header']}>
                          <span
                            className={`${styles['auction-tag']} ${styles[status]}`}
                          >
                            {getTagText(a.auctionState)}
                          </span>
                          <span
                            className={`${styles['time-tag']} ${styles[status]}`}
                          >
                            {getTimeText(a.endDateTime)}
                            <img
                              src={getClockIcon(a.endDateTime)}
                              className={styles['clock-icon']}
                              alt=""
                            />
                          </span>
                        </div>
                        <div
                          className={styles['auction-card-info']}
                        >
                          <div
                            className={styles['auction-title']}
                          >
                            {a.title}
                          </div>
                          <div
                            className={styles['auction-price']}
                          >
                            {a.startingPrice} €
                          </div>
                        </div>
                        <div
                          className={
                            styles['auction-card-image-container']
                          }
                        >
                          <img
                            src={imgUrl(a.mainImageUrl)}
                            className={
                              styles['auction-card-image']
                            }
                            alt={a.title}
                          />
                        </div>
                      </Link>
                    );
                  })}
                  {placeholders((6 - (won.length % 6)) % 6)}
                </div>
              ) : (
                <>
                  <div className={styles['auction-grid']}>
                    {placeholders(6)}
                  </div>
                  <div className={styles['empty-state']}>
                    <h3>Nothing here yet?</h3>
                    <p>Your won items will appear here.</p>
                  </div>
                </>
              )
            )}
          </div>
        </div>
      )}

      {addOpen && (
        <div
          className={styles['add-modal-overlay']}
          onClick={() => setAddOpen(false)}
        >
          <div
            className={styles['add-modal-body']}
            onClick={e => e.stopPropagation()}
          >
            <h2>Add auction</h2>
            <form
              className={styles['add-form']}
              onSubmit={submitAuction}
            >
              <div className={styles['add-image-area']}>
                {preview ? (
                  <>
                    <img src={preview} alt="preview" />
                    <button
                      type="button"
                      className={styles['trash-btn']}
                      onClick={removeImage}
                    >
                      <img src={trashIcon} alt="remove" />
                    </button>
                  </>
                ) : (
                  <>
                    <input
                      id="addFile"
                      type="file"
                      accept="image/*"
                      hidden
                      onChange={onAddSelect}
                    />
                    <label
                      htmlFor="addFile"
                      className={styles['add-image-btn']}
                    >
                      Add image
                    </label>
                  </>
                )}
              </div>
              <label>Title</label>
              <input
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="Write item name here"
                required
              />
              <label>Description</label>
              <textarea
                value={desc}
                onChange={e => setDesc(e.target.value)}
                placeholder="Write description here..."
                required
              />
              <div className={styles['add-row']}>
                <div className={styles['add-col']}>
                  <label>Starting price</label>
                  <div className={styles['price-input']}>
                    <input
                      type="number"
                      step="0.01"
                      value={price}
                      onChange={e => setPrice(e.target.value)}
                      placeholder="Price"
                      required
                    />
                    <span>€</span>
                  </div>
                </div>
                <div className={styles['add-col']}>
                  <label>End date</label>
                  <input
                    type="datetime-local"
                    value={endDate}
                    onChange={e => setEndDate(e.target.value)}
                    required
                  />
                </div>
              </div>
              <div className={styles['add-footer']}>
                <button
                  type="button"
                  onClick={() => setAddOpen(false)}
                >
                  Cancel
                </button>
                <button type="submit">Start auction</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AuctionsPage;
