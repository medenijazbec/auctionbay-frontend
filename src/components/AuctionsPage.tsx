import React, {
  useState,
  useEffect,
  useRef,
  ChangeEvent,
  FormEvent,
  useCallback} from 'react';
import { Outlet, useParams, useNavigate, Link, useLocation} from 'react-router-dom';
import styles from './AuctionsPage.module.css';
import Cropper, { Area } from 'react-easy-crop'
import getCroppedImg from '../utils/getCroppedImg'

/* ───── Assets ───────────────────────────────────────────── */
import logo        from '../assets/logo.png';
import houseIcon   from '../assets/home.png';
import profileIcon from '../assets/profile.png';
import bellIcon    from '../assets/bell.png';
import plusIcon    from '../assets/plus.png';
import userPicIcon from '../assets/userpic.png';
import gearIcon    from '../assets/gear.png';
import trashIcon   from '../assets/trash.png';
import clock0   from '../assets/0clock.png';
import clock7   from '../assets/7clock.png';
import clock15  from '../assets/15clock.png';
import clock25  from '../assets/25clock.png';
import clock30  from '../assets/30clock.png';
import clock37  from '../assets/37clock.png';
import clock45  from '../assets/45clock.png';
import clock53  from '../assets/53clock.png';
import clock60  from '../assets/60clock.png';
import profileWhiteIcon   from '../assets/profile_white.png';
import houseWhiteIcon     from '../assets/home_white.png';
import { formatTimeLeft } from './timeHelpers';

const CLOCKS = [
  clock0, clock7, clock15, clock25,
  clock30, clock37, clock45, clock53, clock60
];


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
  thumbnailUrl?:  string;
  userHasBid?:  boolean;
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
const getTagText = (s: Auction['auctionState']) =>
  s === 'inProgress' ? 'In Progress'
  : s === 'winning'    ? 'Winning'
  : s === 'done'       ? 'Done'
  :                      'Outbid'

  interface StatusTagProps {
    state: Auction['auctionState']
    mine?: boolean
    size?: 'default' | 'small'
  }


  const StatusTag: React.FC<StatusTagProps> = ({
    state, mine = false, size = 'default'
  }) => {
    const cls = [
      styles['status-tag'],
      styles[getStatusClass(state, mine)],
      size === 'small' ? styles['status-tag--small'] : ''
    ].join(' ')
    return <span className={cls}>{getTagText(state)}</span>
  }





    const getTimeText = (end:string) => {
      const h = hoursLeft(end)
      if (h <= 0) return '0h'
      if (h < 24) return `${Math.ceil(h)}h`
      return `${Math.ceil(h/24)} days`
    }
    

/*const getStatusClass = (s:Auction['auctionState']) =>
  s === 'inProgress' ? 'editable'
  : s === 'winning'  ? 'winning'
  : s === 'done'     ? 'done'
  : 'outbid';*/

  const getStatusClass = (
    s: Auction['auctionState'],
    mine = false
  ): TagClass =>
    mine && s === 'inProgress' ? 'editable' : s
  

    function getClockIcon(start: string, end: string): string {
      const now = Date.now();
      const s   = new Date(start).getTime();
      const e   = new Date(end).getTime();
      const pct = Math.min(Math.max((now - s) / (e - s), 0), 1);
      const idx = Math.round(pct * (CLOCKS.length - 1));
      return CLOCKS[idx];
    }

const imgUrl = (u?:string) =>
  u?.startsWith('http')
    ? u
    : `${BACKEND_BASE_URL}${u ?? ''}`;

const hoursLeft = (end:string) =>
      Math.max(0, (new Date(end).getTime() - Date.now()) / 3_600_000)

// colour the time-pill only when ≤1 h left; else use a “neutral” transparent style
const getTimeTagClass = (end: string): string => {
  return hoursLeft(end) <= 1
    ? `${styles['time-tag']} ${styles['urgent']}`
    : `${styles['time-tag']} ${styles['neutral']}`;
};
    
    
    // ensure we always map back to one of our 4 states
const statusFromDto = (raw: string): Auction['auctionState'] =>
  raw === 'winning'    ? 'winning'
  : raw === 'outbid'     ? 'outbid'
  : raw === 'done'       ? 'done'
  :                        'inProgress';

  type TagClass = keyof typeof styles















    
/* ─────────────────────────────────────────────────────────── */
const AuctionsPage:React.FC = () => {

  const cropperRef = useRef<HTMLDivElement>(null);

  const [zoom,    setZoom]    = useState(1);  // current zoom
  const [minZoom, setMinZoom] = useState(1);  // “fit-to-screen” lower bound

// handle the “fit to screen” logic
const handleMediaLoaded = useCallback((media: { naturalWidth:number; naturalHeight:number }) => {
  const { width: vpW, height: vpH } = cropperRef.current!.getBoundingClientRect();
  const fit = Math.min(vpW / media.naturalWidth, vpH / media.naturalHeight);
  setMinZoom(fit);
  setZoom(fit);
}, []);

  const nav  = useNavigate();
  const jwt  = localStorage.getItem('token');
  const location = useLocation();      //current URL is now in scope




  

  // ── recognise when we are on /auctions/:id ──────────────────
  const { id }  = useParams();        // undefined on the list, string on details
  const navigate = useNavigate();     // for the back button


  /* ─── greeting state ─────────────────────────────── */
  const [userName, setUserName] = useState<string>('there');
  const [avatar,   setAvatar]   = useState<string>(userPicIcon);
  const [editAuction, setEditAuction] = useState<Auction|null>(null);

/* ─── helper to open modal pre-filled ───────────────────────── */
const openEdit = (a:Auction) => {
  setPreview(imgUrl(a.mainImageUrl));  // existing picture
  setFile(null);                       // nothing new yet
  setTitle(a.title);
  setDesc(a.description);
  setPrice(String(a.startingPrice));
  setEndDate(a.endDateTime.slice(0,16));   // YYYY-MM-DDTHH:mm
  setEditAuction(a);
  setAddOpen(true);                     // reuse the same modal
};

  // for cropping
const [originalFile, setOriginalFile] = useState<File|null>(null)
const [croppedFile,  setCroppedFile]  = useState<File|null>(null)
const [crop,         setCrop]         = useState<{ x: number; y: number }>({ x:0, y:0 })

const [croppedPixels, setCroppedPixels] = useState<Area|null>(null)
const [showCropper,  setShowCropper]  = useState<boolean>(false)
const [submitting, setSubmitting] = useState(false);
const onCropComplete = (_: Area, croppedAreaPixels: Area) => {
  setCroppedPixels(croppedAreaPixels)
}

// Only when they click “Crop” do we turn that region into our preview + thumbnail:
// ── 1a. “Crop” button ─────────────────────────────────────────
const handleCrop = async () => {
  if (!imageSrc || !croppedPixels) return;          // imageSrc!
  const { blob, file } = await getCroppedImg(imageSrc, croppedPixels);
  setPreview(URL.createObjectURL(blob));            // show true crop
  setCroppedFile(file);                             // save thumb
  setShowCropper(false);
};




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


// utils – merge while keeping ids unique
const mergeUnique = (oldRows: Auction[], newRows: Auction[]) => {
  const seen = new Set<number>();
  const result: Auction[] = [];

  // first keep the existing order
  for (const a of oldRows) {
    if (!seen.has(a.auctionId)) {
      seen.add(a.auctionId);
      result.push(a);
    }
  }
  // then add any truly new rows
  for (const a of newRows) {
    if (!seen.has(a.auctionId)) {
      seen.add(a.auctionId);
      result.push(a);
    }
  }
  return result;
};

  /* Public auctions */

  useEffect(() => {
    //  only when in the auctions tab
    //  AND when we’re on the *list* view (no :id param)
    if (activeNav !== 'auctions' || id) return;
  
    setLoading(true);
    fetch(`${BACKEND_BASE_URL}/api/Auctions?page=${page}&pageSize=9`, {
      headers: jwt ? { Authorization: `Bearer ${jwt}` } : undefined
    })
      .then(r => r.json() as Promise<Auction[]>)
      .then(rows => {
        const mapped = rows.map(a => ({
          ...a,
          auctionState: statusFromDto(a.auctionState),
          thumbnailUrl: a.thumbnailUrl
        }));
        setAuctions(prev => mergeUnique(prev, mapped));//Fix: de-duplicate as you merge
        if (rows.length < 9) setHasMore(false);
      })
      .finally(() => setLoading(false));
  }, [page, activeNav, id, jwt]);
  
  
// whenever we switch *into* the Auctions tab, clear out the old list
useEffect(() => {
  if (activeNav === 'auctions') {
    setAuctions([]);
    setPage(1);
    setHasMore(true);
  }
}, [activeNav]);


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
  }, [activeNav]);

/* ─── “Bidding” & “Won” lists ───────────────────────────── */
useEffect(() => {
  if (activeNav !== 'profile') return;

  const headers = { Authorization: `Bearer ${jwt}` };

  if (subTab === 'bidding') {
    fetch(`${BACKEND_BASE_URL}/api/Profile/bidding`, { headers })
      .then(r => r.json())
      .then((rows: Auction[]) =>
        setBidding(rows.map(a => ({
          ...a,
          auctionState: statusFromDto(a.auctionState)   // normalise
        })))
      )
      .catch(() => setBidding([]));
  }

  if (subTab === 'won') {
    fetch(`${BACKEND_BASE_URL}/api/Profile/won`, { headers })
      .then(r => r.json())
      .then((rows: Auction[]) =>
        setWon(rows.map(a => ({
          ...a,
          auctionState: statusFromDto(a.auctionState)
        })))
      )
      .catch(() => setWon([]));
  }
}, [activeNav, subTab, jwt]);


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
  const [imageSrc, setImageSrc]   = useState<string|null>(null);  // full image
  const [preview,  setPreview]    = useState<string|null>(null);  // cropped thumbnail
  const [addOpen, setAddOpen] = useState(false);
  const [file, setFile] = useState<File|null>(null);
  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [price, setPrice] = useState('');
  const [endDate, setEndDate] = useState('');

// when the user selects a file
const onAddSelect = (e: ChangeEvent<HTMLInputElement>) => {
  const f = e.target.files?.[0];
  if (!f) return;

  setOriginalFile(f);                //keep the file
  const url = URL.createObjectURL(f);
  setImageSrc(url);                  //full image Cropper
  setPreview(null);                  //clear old crop
  setShowCropper(true);
};

  const removeImage = () => { setFile(null); setPreview(null); };

  
  const submitAuction = async (e: FormEvent) => {
    e.preventDefault();
    if (submitting) return;            // guard
    setSubmitting(true);

    try {
      // build FormData
      const fd = new FormData();
      let thumb = croppedFile;
      if (!thumb && imageSrc && croppedPixels) {
        const { file } = await getCroppedImg(imageSrc, croppedPixels);
        thumb = file;
      }
      if (originalFile)    fd.append("Image", originalFile);
      if (thumb)           fd.append("Thumbnail", thumb);
      fd.append("title", title);
      fd.append("description", desc);
      fd.append("startingPrice", price);
      fd.append(
        "startDateTime",
        editAuction ? editAuction.startDateTime : new Date().toISOString()
      );
      fd.append("endDateTime", endDate);
      fd.append("existingImageUrl", editAuction?.mainImageUrl ?? "");

      const url    = editAuction
                       ? `${BACKEND_BASE_URL}/api/Profile/auction/${editAuction.auctionId}`
                       : `${BACKEND_BASE_URL}/api/Auctions`;
      const method = editAuction ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { Authorization: `Bearer ${jwt}` },
        body: fd,
      });

      if (!res.ok) {
        alert("Operation failed.");
        return;
      }

      // close modal & reset form
      setAddOpen(false);
      setEditAuction(null);
      setOriginalFile(null);
      setCroppedFile(null);
      setPreview(null);
      setTitle("");
      setDesc("");
      setPrice("");
      setEndDate("");

      // ─── if we’re on the public list, re-fetch page 1 ───
      if (activeNav === "auctions") {
        const pageSize = 9;
        const r2 = await fetch(
          `${BACKEND_BASE_URL}/api/Auctions?page=1&pageSize=${pageSize}`,
          { headers: jwt ? { Authorization: `Bearer ${jwt}` } : undefined }
        );
        const rows: Auction[] = await r2.json();
        const mapped = rows.map(a => ({
          ...a,
          auctionState: statusFromDto(a.auctionState),
          thumbnailUrl: a.thumbnailUrl
        }));
        setAuctions(mapped);
        setPage(1);
        setHasMore(rows.length === pageSize);
      }
      // ─── otherwise (profile tab), just refresh “myAuctions” ───
      else {
        const r3 = await fetch(`${BACKEND_BASE_URL}/api/Profile/auctions`, {
          headers: { Authorization: `Bearer ${jwt}` },
        });
        const mine: Auction[] = await r3.json();
        setMyAuctions(mine);
      }
    }
    catch (err) {
      console.error(err);
      alert("Unexpected error");
    }
    finally {
      setSubmitting(false);
    }
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
















{/* ─────────────── DETAIL (opens from any tab) ─────────────── */}
{id && (
  <div className={styles['detail-wrapper']}>

    {/* left gutter that hosts the button */}
    <div className={styles['back-column']}>
      <button
        className={styles['back-btn']}
        onClick={() => navigate(-1)}   /* pop history */
      >
        ← Back
      </button>
    </div>

    {/* AuctionDetailPage */}
    <Outlet />
  </div>
)}


{/* ─────────── PUBLIC AUCTIONS LIST ──────────────────────────── */}
{ activeNav === 'auctions' && (
  <>
    {/* LIST — shown when there is **no** :id in the URL */}
    { !id && (
      <div className={styles['auctions-container-wrapper']}>
        <h2 className={styles['auctions-title']}>Auctions</h2>

        <div className={styles['auctions-container']}>
          <div className={styles['auction-grid']}>

            { auctions.map(a => {
              /* 1. is the auction done? */
              const isDone = new Date(a.endDateTime).getTime() <= Date.now();
              /* 2. status to show */
              const displayState = isDone ? 'done' : a.auctionState;
              const statusClass  = getStatusClass(displayState);

              return (
                <Link
                  key={a.auctionId}
                  to   ={`/auctions/${a.auctionId}`}
                  state={{ from: location }}         /* remember view */
                  className={styles['auction-card']}
                  style={{ textDecoration:'none', color:'inherit' }}
                >
                  <div className={styles['auction-card-header']}>
                    {/* status pill */}
                    <span
                      className={`${styles['auction-tag']} ${styles[statusClass]}`}
                    >
                      {getTagText(displayState)}
                    </span>

                    {/* time-left pill (hide when done) */}
                    {!isDone && (
                      <span
                        className={`${styles['time-tag']} ${
                          styles[getTimeTagClass(a.endDateTime)]
                        }`}
                      >
                        {formatTimeLeft(a.endDateTime)}
                        <img
                          src={getClockIcon(a.startDateTime, a.endDateTime)}
                          className={styles['clock-icon']}
                          alt=""
                        />
                      </span>
                    )}
                  </div>

                  <div className={styles['auction-card-info']}>
                    <div className={styles['auction-title']}>{a.title}</div>
                    <div className={styles['auction-price']}>
                      {a.startingPrice} €
                    </div>
                  </div>

                  <div className={styles['auction-card-image-container']}>
                    <img
                      src={imgUrl(a.thumbnailUrl || a.mainImageUrl)}
                      className={styles['auction-card-image']}
                      alt={a.title}
                    />
                  </div>
                </Link>
              );
            })}

          </div>

          {loading && (
            <div className={styles['loading-more']}>
              Loading more auctions…
            </div>
          )}
        </div>
      </div>
    )}
  </>
)}













      {/* ─── PROFILE VIEW MY AUCTIONS ─────────────────────────────────────── */}
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
   //GUARD: if not logged in, short-circuit with a prompt
   !jwt ? (
     <div className={styles.emptyState}>
       <h3>Please log in to see “My auctions.”</h3>
       <p><button onClick={() => nav('/login')}>Go to login →</button></p>
     </div>
   ) : myAuctions.length ? (
    <div className={styles['auction-grid-wrapper']}>
      <div className={styles['auction-grid']}>
        {myAuctions.map(a => {
          const nowMs  = Date.now();
          const endMs  = new Date(a.endDateTime).getTime();
          const isDone = endMs <= nowMs;
          const displayState: 'inProgress' | 'done' = isDone ? 'done' : 'inProgress';

          return (
            <Link
              to={`/auctions/${a.auctionId}`}
              state={{ from: location }} 
              key={a.auctionId}
              className={styles['auction-card']}
              style={{ textDecoration: 'none', color: 'inherit' }}
            >
              <div className={styles['auction-card-header']}>
                {/* Status pill */}
                <span className={`${styles['status-tag']} ${styles[displayState]}`}>
                  {getTagText(displayState)}
                </span>

                {/* Time-left pill (hidden when done) */}
                {!isDone && (
                  <span className={`${styles['time-tag']} ${styles[getTimeTagClass(a.endDateTime)]}`}>
                    {formatTimeLeft(a.endDateTime)}
                    <img
                      src={getClockIcon(a.startDateTime, a.endDateTime)}
                      className={styles['clock-icon']}
                      alt=""
                    />
                  </span>
                )}
              </div>

              <div className={styles['auction-card-info']}>
                <div className={styles['auction-title']}>{a.title}</div>
                <div className={styles['auction-price']}>{a.startingPrice} €</div>
              </div>

              <div className={styles['auction-card-image-container']}>
                <img
                  src={imgUrl(a.thumbnailUrl || a.mainImageUrl)}
                  className={styles['auction-card-image']}
                  alt={a.title}
                />
              </div>

              {displayState === 'inProgress' && (
        <div className={styles['auction-card-actions']}>
          <button
            className={`${styles['action-button']} ${styles['delete-button']}`}
            onClick={e => {
              e.preventDefault();
              handleDelete(a.auctionId);
            }}
          >
            <img src={trashIcon} alt="Delete" />
          </button>
          <button
            className={`${styles['action-button']} ${styles['edit-button']}`}
            onClick={e => {
              e.preventDefault();
              openEdit(a);
            }}
          >
            Edit
          </button>
        </div>
      )}
            </Link>
          );
        })}
        {placeholders((6 - (myAuctions.length % 6)) % 6)}
      </div>
    </div>
  ) : (
    <>
      <div className={styles['auction-grid']}>
        {placeholders(6)}
      </div>
      <div className={styles['empty-state']}>
        <h3>Oh no, no auctions added!</h3>
        <p>Click “+” in the nav bar to add your first auction.</p>
      </div>
    </>
  )
)}


 

            {subTab === 'bidding' && (
   !jwt ? (
       <div className={styles.emptyState}>
         <h3>Please log in to see auctions you’re bidding on.</h3>
         <p><button onClick={() => nav('/login')}>Go to login →</button></p>
       </div>
     ) : bidding.length ? (
                <div className={styles['auction-grid']}>
                  {bidding.map(a => {
                    const status = getStatusClass(a.auctionState);
                    return (
                      <Link
                        to={`/auctions/${a.auctionId}`}
                        state={{ from: location }} 
                        key={a.auctionId}
                        className={styles['auction-card']}
                        style={{
                          textDecoration: 'none',
                          color: 'inherit'
                        }}
                      >
<div className={styles['auction-card-header']}>
  {/* Status pill */}
  <span className={`${styles['auction-tag']} ${styles[status]}`}>
    {getTagText(a.auctionState)}
  </span>

  {/* Time-left pill */}
  <span
    className={`${styles['time-tag']} ${
      a.auctionState === 'done'
        ? styles.done
        : styles[getTimeTagClass(a.endDateTime)]
    }`}
  >
    {a.auctionState === 'done'
      ? '0h'
      : formatTimeLeft(a.endDateTime)
    }
    <img
      src={getClockIcon(a.startDateTime, a.endDateTime)}
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
                            src={imgUrl(a.thumbnailUrl || a.mainImageUrl)}
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
   !jwt ? (
       <div className={styles.emptyState}>
         <h3>Please log in to see auctions you’ve won.</h3>
         <p><button onClick={() => nav('/login')}>Go to login →</button></p>
       </div>
     ) : won.length ? (
                <div className={styles['auction-grid']}>
                  {won.map(a => {
                    const status = getStatusClass(a.auctionState);
                    return (
                      <Link
                        to={`/auctions/${a.auctionId}`}
                        state={{ from: location }} 
                        key={a.auctionId}
                        className={styles['auction-card']}
                        style={{
                          textDecoration: 'none',
                          color: 'inherit'
                        }}
                      >
<div className={styles['auction-card-header']}>
  {/* Status pill */}
  <span className={`${styles['auction-tag']} ${styles[status]}`}>
    {getTagText(a.auctionState)}
  </span>

  {/* Time-left pill */}
  <span
    className={`${styles['time-tag']} ${
      a.auctionState === 'done'
        ? styles.done
        : styles[getTimeTagClass(a.endDateTime)]
    }`}
  >
    {a.auctionState === 'done'
      ? '0h'
      : formatTimeLeft(a.endDateTime)
    }
    <img
      src={getClockIcon(a.startDateTime, a.endDateTime)}
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
                            src={imgUrl(a.thumbnailUrl || a.mainImageUrl)}
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
              {showCropper && imageSrc ? (         /* imageSrc, not preview */
                <>
            <div ref={cropperRef} className={styles['crop-container']}>
              <Cropper
                image={imageSrc}
                crop={crop}
                zoom={zoom}
                minZoom={minZoom}
                maxZoom={3}
                aspect={4 / 3}
                onMediaLoaded={(media) => {
                  const { width: vpW, height: vpH } = cropperRef.current!.getBoundingClientRect();
                  const fitWidth = vpW / media.naturalWidth;
                  const fitHeight = vpH / media.naturalHeight;

                  // Use the larger fit factor to ensure nothing is cut off initially
                  const fit = Math.max(fitWidth, fitHeight);

                  setMinZoom(fit);
                  setZoom(fit);
                  setCrop({ x: 0, y: 0 }); // center crop initially
                }}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={(_, px) => setCroppedPixels(px)}
                restrictPosition={false}
                zoomWithScroll={true}
                zoomSpeed={0.1}
                objectFit="contain"  /* Ensures full image visibility without cropping */
              />
            </div>

   
            </>
          ) : preview ? (
            /* thumbnail after cropping */
            <>
              <img src={preview} alt="preview" className={styles.previewImg} />
              <button type="button" className={styles['trash-btn']} onClick={removeImage}>
                <img src={trashIcon} alt="remove" />
              </button>
            </>
          ) : (
            /* initial “Add image” button */
            <>
              <input
                id="addFile"
                type="file"
                accept="image/*"
                hidden
                onChange={onAddSelect}
              />
              <label htmlFor="addFile" className={styles['add-image-btn']}>
                Add image
              </label>
            </>
          )}
        </div>


              <div className={styles['crop-controls']}>
                <button type="button" onClick={handleCrop}>Crop</button>
                <button type="button" onClick={() => setShowCropper(false)}>Cancel</button>
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
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button type="submit" disabled={submitting}>
                  {submitting ? "Starting…" : editAuction ? "Save changes" : "Start auction"}
                </button>
            </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AuctionsPage;