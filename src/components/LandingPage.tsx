import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './LandingPage.css';

// Images / icons
import logo from '../assets/logo.png';
import houseIcon from '../assets/home.png';
import profileIcon from '../assets/profile.png';
import bellIcon from '../assets/bell.png';
import plusIcon from '../assets/plus.png';
import userPicIcon from '../assets/userpic.png';

// Icons for card updates
import trashIcon from '../assets/trash.png';

// Clock icons based on time remaining
import clock15 from '../assets/15clock.png';
import clock30 from '../assets/30clock.png';
import clock45 from '../assets/45clock.png';

interface Auction {
  auctionId: number;
  title: string;
  description: string;
  startingPrice: number;
  startDateTime: string;
  endDateTime: string;
  auctionState: string; // e.g., "outbid", "inProgress", "winning", "done"
  createdAt: string;
  mainImageUrl?: string;
}

const BACKEND_BASE_URL = 'https://localhost:7056';

// Helper: choose tag text based on auctionState
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

// Helper: choose time text based on auctionState
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

// Helper: choose extra class based on auctionState
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

// Helper: choose clock icon based on remaining time until auction closes
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

const LandingPage: React.FC = () => {
  const [auctions, setAuctions] = useState<Auction[]>([]);
  const [page, setPage] = useState<number>(1);
  const [hasMore, setHasMore] = useState<boolean>(true);
  const [loading, setLoading] = useState<boolean>(false);
  const [activeNav, setActiveNav] = useState<'auctions' | 'profile'>('auctions');

  // Fetch auctions with pagination
  const fetchAuctions = async (pageNum: number) => {
    setLoading(true);
    try {
      const response = await fetch(
        `${BACKEND_BASE_URL}/api/Auctions?page=${pageNum}&pageSize=9`,
        {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' }
        }
      );
      if (!response.ok) {
        throw new Error('Failed to fetch auctions');
      }
      const data = await response.json();
      if (data.length < 9) {
        setHasMore(false);
      }
      setAuctions(prev => [...prev, ...data]);
    } catch (error) {
      console.error('Error fetching auctions:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAuctions(page);
  }, [page]);

  // Infinite scroll
  const handleScroll = () => {
    if (!hasMore || loading) return;
    const scrollTop = document.documentElement.scrollTop || document.body.scrollTop;
    const scrollHeight = document.documentElement.scrollHeight || document.body.scrollHeight;
    const clientHeight = document.documentElement.clientHeight || window.innerHeight;
    if (scrollHeight - scrollTop - clientHeight < 200) {
      setPage(prev => prev + 1);
    }
  };

  useEffect(() => {
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [hasMore, loading]);

  // Helper to build full image URL
  const buildImageUrl = (url?: string) => {
    if (url && url.trim() !== '') {
      if (url.startsWith('http')) {
        return url;
      }
      return `${BACKEND_BASE_URL}${url}`;
    }
    return `${BACKEND_BASE_URL}/placeholder.png`;
  };

  const handleNavClick = (nav: 'auctions' | 'profile') => {
    setActiveNav(nav);
  };

  return (
    <div className="landing-container">
      {/* TOP NAV */}
      <div className="top-nav">
        <div className="top-nav-left">
          <img src={logo} alt="Main Logo (Top Nav)" className="nav-logo" />
        </div>
        <div className="top-nav-right">
          <Link to="/login" className="top-nav-login">Log in</Link>or
          <Link to="/register" className="top-nav-signup">Sign Up</Link>
        </div>
      </div>


      {/* HERO SECTION */}
      <section className="hero-section">
        <h1 className="hero-title">E‑auctions made easy!</h1>
        <p className="hero-subtitle">
          Simple way for selling your unused products, or <br />
          getting a deal on a product you want!
        </p>
        <button className="cta-button">Start bidding</button>
      </section>

      {/* MAIN FRAME */}
      <div className="auctions-container-wrapper">
        <div className="auctions-container">
          {/* FRAME TOP BAR */}
          <div className="frame-topbar">
            <div className="frame-topbar-left">
              <div className="logo-circle">
                <img src={logo} alt="Main Logo (Frame)" className="topbar-logo" />
              </div>
              <div className="left-pill-container">
                <button
                  className={`nav-btn ${activeNav === 'auctions' ? 'nav-btn-active' : ''}`}
                  onClick={() => handleNavClick('auctions')}
                >
                  <img src={houseIcon} alt="Auctions" />
                  <span>Auctions</span>
                </button>
                <button
                  className={`nav-btn ${activeNav === 'profile' ? 'nav-btn-active' : ''}`}
                  onClick={() => handleNavClick('profile')}
                >
                  <img src={profileIcon} alt="Profile" />
                  <span>Profile</span>
                </button>
              </div>
            </div>
            <div className="frame-topbar-right">
              <div className="right-pill-container">
                <button className="icon-button bell-btn">
                  <img src={bellIcon} alt="Notifications" />
                </button>
                <button className="icon-button plus-btn">
                  <img src={plusIcon} alt="Add Auction" />
                </button>
                <button className="icon-button user-btn">
                  <img src={userPicIcon} alt="User" />
                </button>
              </div>
            </div>
          </div>

          {/* AUCTIONS HEADER */}
          <div className="auctions-header">
            <h2 className="auctions-title">Auctions</h2>
          </div>

          {/* AUCTION CARDS GRID */}
          <div className="auction-grid">
            {auctions.map((auction) => {
              const isEditable = auction.auctionState === 'inProgress';
              const tagText = getTagText(auction.auctionState);
              const timeText = getTimeText(auction.auctionState);
              const colorClass = getStatusClass(auction.auctionState);
              const clockImg = getClockIcon(auction.endDateTime);

              return (
                <div className="auction-card" key={auction.auctionId}>
                  <div className="auction-card-header">
                    <span className={`auction-tag ${colorClass}`}>
                      {tagText}
                    </span>
                    <span className={`time-tag ${colorClass}`}>
                      {timeText}
                      <img src={clockImg} alt="Clock Icon" className="clock-icon" />
                    </span>
                  </div>
                  <div className="auction-card-info">
                    <div className="auction-title">{auction.title}</div>
                    <div className="auction-price">{auction.startingPrice} €</div>
                  </div>
                  <div className="auction-card-image-container">
                    <img
                      className="auction-card-image"
                      src={buildImageUrl(auction.mainImageUrl)}
                      alt={auction.title}
                    />
                  </div>
                  {isEditable && (
                    <div className="auction-card-actions">
                      <button className="action-button delete-button">
                        <img src={trashIcon} alt="Delete" />
                      </button>
                      <button className="action-button edit-button">Edit</button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {loading && hasMore && (
            <div className="loading-more">Loading more auctions...</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LandingPage;
