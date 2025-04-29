// LandingPage.tsx
import React, {
  useState,
  useEffect,
  useRef,
  ChangeEvent,
  FormEvent,
  useMemo,
} from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import "./LandingPage.css";

/* ───── Assets ───────────────────────────────────────────── */
import logo from "../assets/logo.png";
import houseIcon from "../assets/home.png";
import profileIcon from "../assets/profile.png";
import bellIcon from "../assets/bell.png";
import plusIcon from "../assets/plus.png";
import userPicIcon from "../assets/userpic.png";
import gearIcon from "../assets/gear.png";
import trashIcon from "../assets/trash.png";
import clock0 from "../assets/0clock.png";
import clock7 from "../assets/7clock.png";
import clock15 from "../assets/15clock.png";
import clock25 from "../assets/25clock.png";
import clock30 from "../assets/30clock.png";
import clock37 from "../assets/37clock.png";
import clock45 from "../assets/45clock.png";
import clock53 from "../assets/53clock.png";
import clock60 from "../assets/60clock.png";
import profileWhiteIcon from "../assets/profile_white.png";
import houseWhiteIcon from "../assets/home_white.png";
import { getTimeTagClass } from "./timeHelpers";

const CLOCKS = [
  clock0,
  clock7,
  clock15,
  clock25,
  clock30,
  clock37,
  clock45,
  clock53,
  clock60,
];

/* ───── Types & constants ────────────────────────────────── */
interface Auction {
  auctionId: number;
  title: string;
  description: string;
  startingPrice: number;
  startDateTime: string;
  endDateTime: string;
  auctionState: "outbid" | "inProgress" | "winning" | "done";
  createdBy: string;
  mainImageUrl?: string;
  thumbnailUrl?: string;
}

interface ProfileMeDto {
  firstName?: string;
  lastName?: string;
  email: string;
  id: string;
  profilePictureUrl?: string;
}

const BACKEND_BASE_URL = "https://localhost:7056";

/* ───── Helpers ──────────────────────────────────────────── */
const getTagText = (s: Auction["auctionState"]) =>
  s === "inProgress"
    ? "In progress"
    : s === "winning"
    ? "Winning"
    : s === "done"
    ? "Done"
    : "Outbid";
/**
 * @param endISO   endDateTime as ISO string
 * @param nowMs    optional override of Date.now(), useful for testing
 */
function formatTimeLeft(endISO: string, nowMs = Date.now()): string {
  const endMs = new Date(endISO).getTime();
  let diff = Math.max(endMs - nowMs, 0);
  const totalMinutes = Math.ceil(diff / 60_000);

  if (totalMinutes === 0) return "0m";
  if (totalMinutes < 60) {
    return `${totalMinutes}m`;
  }

  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours < 12) {
    return `${hours}h ${minutes}m`;
  }

  if (hours < 24) {
    // round up if any leftover minutes, to match your old behavior
    return `${hours + (minutes > 0 ? 1 : 0)}h`;
  }

  // 24+ hours → days
  const days = Math.ceil(hours / 24);
  return `${days} days`;
}

const getStatusClass = (s: Auction["auctionState"]) =>
  s === "inProgress"
    ? "editable"
    : s === "winning"
    ? "winning"
    : s === "done"
    ? "done"
    : "";

function getClockIcon(start: string, end: string): string {
  const now = Date.now();
  const s = new Date(start).getTime();
  const e = new Date(end).getTime();
  const pct = Math.min(Math.max((now - s) / (e - s), 0), 1);
  const idx = Math.round(pct * (CLOCKS.length - 1));
  return CLOCKS[idx];
}
const imgUrl = (u?: string) =>
  u?.startsWith("http") ? u : `${BACKEND_BASE_URL}${u ?? ""}`;

/* ─────────────────────────────────────────────────────────── */
const LandingPage: React.FC = () => {
  const nav = useNavigate();
  const location = useLocation();
  const jwt = localStorage.getItem("token");

  /* ─── greeting state ─────────────────────────────── */
  const [userName, setUserName] = useState<string>("there");
  const [avatar, setAvatar] = useState<string>(userPicIcon);

  /* ─── fetch logged‑in user once ────────────────────── */
  useEffect(() => {
    if (!jwt) return;
    fetch(`${BACKEND_BASE_URL}/api/Profile/me`, {
      headers: { Authorization: `Bearer ${jwt}` },
    })
      .then(async (r) => {
        if (!r.ok) throw new Error("unauthorised");
        const p: ProfileMeDto = await r.json();
        setUserName(
          `${p.firstName ?? ""} ${p.lastName ?? ""}`.trim() ||
            p.email.split("@")[0] ||
            "there"
        );
        setAvatar(
          p.profilePictureUrl ? imgUrl(p.profilePictureUrl) : userPicIcon
        );
      })
      .catch(() => {
        localStorage.removeItem("token");
        setUserName("there");
        setAvatar(userPicIcon);
      });
  }, [jwt]);

  // if already authenticated, immediately send them to /auctions

  //WILL NEED TO CHANGE IF I DECIDE TO UP THE AUNTY AND LET THE USER VIEW THE LANDING PAGE,
  // GET A POPUP FOR AUCTIONS BUT WHEN THEY CLICK THE
  // BID BUTTON ->IF ONT LOGGED IN SEND TO LOGIN PAGE.
  // AND HAVE THE START BIDDING BUTTON TO ROUTE TO THE
  // AUCTIONS PAGE IF LOGGED IN AND TO LOGIN IF NOT
  useEffect(() => {
    if (localStorage.getItem("token")) {
      nav("/auctions");
    }
  }, [nav]);

  /* ─── dropdown ───────────────────────────────────── */
  const [menuOpen, setMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const logOut = () => {
    localStorage.removeItem("token");
    nav("/login", { replace: true });
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
    if (menuOpen) document.addEventListener("click", onBodyClick);
    return () => document.removeEventListener("click", onBodyClick);
  }, [menuOpen]);

  /* ─── auctions data ──────────────────────────────── */
  const [auctions, setAuctions] = useState<Auction[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [activeNav, setActiveNav] = useState<"auctions" | "profile">(
    "auctions"
  );
  const [subTab, setSubTab] = useState<"myAuctions" | "bidding" | "won">(
    "myAuctions"
  );
  const [myAuctions, setMyAuctions] = useState<Auction[]>([]);
  const [bidding] = useState<Auction[]>([]);
  const [won] = useState<Auction[]>([]);

  useEffect(() => {
    if (activeNav !== "auctions") return;
    setLoading(true);
    fetch(`${BACKEND_BASE_URL}/api/Auctions?page=${page}&pageSize=9`)
      .then((r) => r.json())
      .then((rows: Auction[]) => {
        setAuctions((prev) => [...prev, ...rows]);
        if (rows.length < 9) setHasMore(false);
      })
      .finally(() => setLoading(false));
  }, [page, activeNav]);

  useEffect(() => {
    const onScroll = () => {
      if (loading || !hasMore || activeNav !== "auctions") return;
      if (
        window.innerHeight + window.scrollY + 200 >=
        document.body.scrollHeight
      ) {
        setPage((p) => p + 1);
      }
    };
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, [loading, hasMore, activeNav]);

  const handleDelete = (id: number) => {
    if (!confirm("Delete this auction?")) return;
    fetch(`${BACKEND_BASE_URL}/api/Profile/auction/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${jwt}` },
    }).then((r) => {
      if (r.ok) setMyAuctions((prev) => prev.filter((a) => a.auctionId !== id));
    });
  };

  const placeholders = (n: number) =>
    Array.from({ length: n }, (_, i) => (
      <div key={`ph-${i}`} className="auction-card auction-card--placeholder" />
    ));
  const currentCount =
    subTab === "myAuctions"
      ? myAuctions.length
      : subTab === "bidding"
      ? bidding.length
      : won.length;
  const isProfileFixed = activeNav === "profile" && currentCount === 0;

  /* ─── ADD AUCTION POPUP STATE ─────────────────────── */
  const [addOpen, setAddOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [price, setPrice] = useState("");
  const [endDate, setEndDate] = useState("");
  const onAddSelect = (e: ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    setPreview(URL.createObjectURL(f));
  };
  const removeImage = () => {
    setFile(null);
    setPreview(null);
  };

  const submitAuction = async (e: FormEvent) => {
    e.preventDefault();

    const fd = new FormData();
    if (file) fd.append("image", file);
    fd.append("title", title);
    fd.append("description", desc);
    fd.append("startingPrice", price);
    fd.append("endDateTime", endDate);

    const res = await fetch(`${BACKEND_BASE_URL}/api/Auctions`, {
      method: "POST",
      headers: { Authorization: `Bearer ${jwt}` },
      body: fd,
    });
    if (!res.ok) {
      alert("Failed to add auction.");
      return;
    }

    /* refresh public list */
    setAuctions([]);
    setPage(1);
    setHasMore(true);

    /* refresh “My auctions” tab */
    fetch(`${BACKEND_BASE_URL}/api/Profile/auctions`, {
      headers: { Authorization: `Bearer ${jwt}` },
    })
      .then((r) => r.json())
      .then((rows: Auction[]) => setMyAuctions(rows));

    /* reset form */
    setAddOpen(false);
    setFile(null);
    setPreview(null);
    setTitle("");
    setDesc("");
    setPrice("");
    setEndDate("");
  };

  return (
    <div className="landing-container">
      <header className="top-nav">
        <div className="top-nav-left">
          <img src={logo} className="nav-logo" />
        </div>
        <div className="top-nav-right">
          {jwt ? (
            <>
              <span className="logged-as">
                Logged in as <b>{userName}</b>
              </span>
            </>
          ) : (
            <>
              <Link to="/login" className="top-nav-login">
                Log in
              </Link>
              {" or "}
              <Link to="/register" className="top-nav-signup">
                Sign Up
              </Link>
            </>
          )}
        </div>
      </header>

      <section className="hero-section">
        <h1 className="hero-title">E‑auctions made easy!</h1>
        <p className="hero-subtitle">
          Simple way for selling your unused products,
          <br />
          or getting a deal on a product you want!
        </p>
        <button
          className="cta-button"
          onClick={
            () =>
              jwt
                ? nav("/auctions") // logged in → go see auctions
                : nav("/login") // not yet → force login
          }
        >
          Start bidding
        </button>
      </section>

      <div className="auctions-container-wrapper">
        <div
          className={`auctions-container ${
            isProfileFixed ? "auctions-container--fixed" : ""
          }`}
        >
          <div className="frame-topbar">
            <div className="frame-topbar-left">
              <div className="logo-circle">
                <img src={logo} className="topbar-logo" />
              </div>
              <div className="left-pill-container">
                <button
                  className={`nav-btn ${
                    activeNav === "auctions" ? "nav-btn-active" : ""
                  }`}
                  onClick={() => setActiveNav("auctions")}
                >
                  <img
                    src={activeNav === "auctions" ? houseWhiteIcon : houseIcon}
                    alt="Auctions"
                  />{" "}
                  <span>Auctions</span>
                </button>
                <button
                  className={`nav-btn ${
                    activeNav === "profile" ? "nav-btn-active" : ""
                  }`}
                  onClick={() => setActiveNav("profile")}
                >
                  <img
                    src={
                      activeNav === "profile" ? profileWhiteIcon : profileIcon
                    }
                    alt="Profile"
                  />{" "}
                  <span>Profile</span>
                </button>
              </div>
            </div>
            <div className="frame-topbar-right">
              <div className="right-pill-container">
                {/* Notifications button */}
                <button
                  className="icon-button bell-btn"
                  onClick={() => {
                    if (!jwt) {
                      nav("/login", { replace: true });
                    } else {
                      // TODO: open your notification pane
                    }
                  }}
                >
                  <img src={bellIcon} alt="Notifications" />
                </button>

                {/* “Add auction” button */}
                <button
                  className="icon-button plus-btn"
                  onClick={() => {
                    if (!jwt) {
                      // not logged in → force login
                      nav("/login", { replace: true });
                      return;
                    }
                    // only if we *are* logged in do we actually open the modal
                    setAddOpen(true);
                  }}
                >
                  <img src={plusIcon} alt="Add auction" />
                </button>
                <div
                  className="icon-button user-btn"
                  ref={userMenuRef}
                  onClick={() => setMenuOpen((o) => !o)}
                  onMouseEnter={() => setMenuOpen(true)}
                >
                  <img src={avatar} alt="Your avatar" className="user-avatar" />
                  {menuOpen && (
                    <div className="user-menu">
                      <Link to="/profile" className="menu-link">
                        <img src={gearIcon} alt="" className="menu-gear-icon" />{" "}
                        Profile settings
                      </Link>
                      <button className="logout-btn" onClick={logOut}>
                        Log out
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {activeNav === "auctions" && (
            <>
              <header className="auctions-header">
                <h2 className="auctions-title">Auctions</h2>
              </header>

              {auctions.length ? (
                <div className="auction-grid">
                  {auctions.map((a) => (
                    <Link
                      key={a.auctionId}
                      to={`/auctions/${a.auctionId}`}
                      state={{ from: location }}
                      className="auction-card"
                    >
                      <div className="auction-card-header">
                        {/* status pill */}
                        <span
                          className={`auction-tag ${getStatusClass(
                            a.auctionState
                          )}`}
                        >
                          {getTagText(a.auctionState)}
                        </span>

                        {/* time-left pill */}
                        <span
                          className={`time-tag ${getTimeTagClass(
                            a.endDateTime
                          )}`}
                        >
                          {formatTimeLeft(a.endDateTime)}
                          <img
                            src={getClockIcon(a.startDateTime, a.endDateTime)}
                            className="clock-icon"
                            alt=""
                          />
                        </span>
                      </div>

                      <div className="auction-card-info">
                        <div className="auction-title">{a.title}</div>
                        <div className="auction-price">{a.startingPrice} €</div>
                      </div>

                      <div className="auction-card-image-container">
                        <img
                          src={imgUrl(a.thumbnailUrl || a.mainImageUrl)}
                          className="auction-card-image"
                          alt={a.title}
                        />
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="empty-state">
                  <h3>Oh no, no auctions yet!</h3>
                  <p>Click “+” in the nav bar to create a new auction.</p>
                </div>
              )}

              {loading && hasMore && (
                <div className="loading-more">Loading more…</div>
              )}
            </>
          )}

          {activeNav === "profile" && (
            <div className="profile-view">
              <h2 className="profile-greeting">Hello {userName}!</h2>
              <div className="profile-tabs">
                <button
                  className={`profile-tab ${
                    subTab === "myAuctions" ? "profile-tab--active" : ""
                  }`}
                  onClick={() => setSubTab("myAuctions")}
                >
                  My auctions
                </button>
                <button
                  className={`profile-tab ${
                    subTab === "bidding" ? "profile-tab--active" : ""
                  }`}
                  onClick={() => setSubTab("bidding")}
                >
                  Bidding
                </button>
                <button
                  className={`profile-tab ${
                    subTab === "won" ? "profile-tab--active" : ""
                  }`}
                  onClick={() => setSubTab("won")}
                >
                  Won
                </button>
              </div>
              <div className="profile-content">
                {subTab === "myAuctions" &&
                  (myAuctions.length ? (
                    <div className="auction-grid">
                      {myAuctions.map((a) => (
                        <div className="auction-card" key={a.auctionId}>
                          <div className="auction-card-header">
                            {/* status pill */}
                            <span
                              className={`auction-tag ${getStatusClass(
                                a.auctionState
                              )}`}
                            >
                              {getTagText(a.auctionState)}
                            </span>

                            {/* time-left pill */}
                            <span
                              className={`time-tag ${getTimeTagClass(
                                a.endDateTime
                              )}`}
                            >
                              {formatTimeLeft(a.endDateTime)}
                              <img
                                src={getClockIcon(
                                  a.startDateTime,
                                  a.endDateTime
                                )}
                                className="clock-icon"
                                alt=""
                              />
                            </span>
                          </div>

                          <div className="auction-card-info">
                            <div className="auction-title">{a.title}</div>
                            <div className="auction-price">
                              {a.startingPrice} €
                            </div>
                          </div>
                          <div className="auction-card-image-container">
                            <img
                              src={imgUrl(a.mainImageUrl)}
                              className="auction-card-image"
                            />
                          </div>
                          {a.auctionState === "inProgress" && (
                            <div className="auction-card-actions">
                              <button
                                className="action-button delete-button"
                                onClick={() => handleDelete(a.auctionId)}
                              >
                                <img src={trashIcon} alt="" />
                              </button>
                              <button className="action-button edit-button">
                                Edit
                              </button>
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
                        <p>
                          Click “+” in the nav bar to add your first auction.
                        </p>
                      </div>
                    </>
                  ))}
                {subTab === "bidding" &&
                  (bidding.length ? (
                    <div className="auction-grid">
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
                  ))}
                {subTab === "won" &&
                  (won.length ? (
                    <div className="auction-grid">
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
                  ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {jwt && addOpen && (
        <div className="add-modal-overlay" onClick={() => setAddOpen(false)}>
          <div className="add-modal-body" onClick={(e) => e.stopPropagation()}>
            <h2>Add auction</h2>
            <form className="add-form" onSubmit={submitAuction}>
              <div className="add-image-area">
                {preview ? (
                  <>
                    <img src={preview} alt="preview" />
                    <button
                      type="button"
                      className="trash-btn"
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
                    <label htmlFor="addFile" className="add-image-btn">
                      Add image
                    </label>
                  </>
                )}
              </div>
              <label>Title</label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Write item name here"
                required
              />
              <label>Description</label>
              <textarea
                value={desc}
                onChange={(e) => setDesc(e.target.value)}
                placeholder="Write description here..."
                required
              />
              <div className="add-row">
                <div className="add-col">
                  <label>Starting price</label>
                  <div className="price-input">
                    <input
                      type="number"
                      step="0.01"
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      placeholder="Price"
                      required
                    />
                    <span>€</span>
                  </div>
                </div>
                <div className="add-col">
                  <label>End date</label>
                  <input
                    type="datetime-local"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    required
                  />
                </div>
              </div>
              <div className="add-footer">
                <button type="button" onClick={() => setAddOpen(false)}>
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

export default LandingPage;
