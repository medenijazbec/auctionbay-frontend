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

interface Auction {
  auctionId: number;
  title: string;
  description: string;
  startingPrice: number;
  startDateTime: string;
  endDateTime: string;
  auctionState: string;
  createdAt: string;
  mainImageUrl?: string;
}

const BACKEND_BASE_URL = "https://localhost:7056"; 

const LandingPage: React.FC = () => {
  const [auctions, setAuctions] = useState<Auction[]>([]);
  const [page, setPage] = useState<number>(1);
  const [hasMore, setHasMore] = useState<boolean>(true);
  const [loading, setLoading] = useState<boolean>(false);

  // Track which main nav is active
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
  }, [handleScroll]);

  // Auction status badge helper
  const getAuctionStatusLabel = (auction: Auction) => {
    const now = new Date();
    const end = new Date(auction.endDateTime);
    if (end < now) {
      return 'Expired';
    }
    const timeDiff = end.getTime() - now.getTime();
    const oneDay = 24 * 60 * 60 * 1000;
    if (timeDiff < oneDay) {
      return 'Expiring soon';
    }
    return 'Active';
  };

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
      
      {/* TOP NAV (outside the thick frame) */}
      <div className="top-nav">
        {/* Left side: Logo */}
        <div className="top-nav-left">
          <img src={logo} alt="Main Logo (Top Nav)" className="nav-logo" />
        </div>

        {/* Right side: Log in / Sign Up */}
        <div className="top-nav-right">
          <Link to="/login" className="top-nav-login">Log in</Link>
          <Link to="/signup" className="top-nav-signup">Sign Up</Link>
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

      {/* MAIN FRAME with Thick Border */}
      <div className="auctions-container">

        {/* ========== FRAME TOP BAR ========== */}
        <div className="frame-topbar">
          
          {/* LEFT side: A second logo + White pill containing Auctions & Profile */}
          <div className="frame-topbar-left">

            {/* Second logo (inside the frame). 
            */}
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

          {/* RIGHT side: White pill containing Bell, Plus, User icons */}
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

        {/* Auctions Header */}
        <div className="auctions-header">
          <h2 className="auctions-title">Auctions</h2>
          
        </div>

        {/* Auction Cards Grid */}
        <div className="auction-grid">
          {auctions.map((auction) => (
            <div className="auction-card" key={auction.auctionId}>
              <div className="auction-card-status">
                {getAuctionStatusLabel(auction)}
              </div>
              <img
                className="auction-card-image"
                src={buildImageUrl(auction.mainImageUrl)}
                alt={auction.title}
              />
              <p className="auction-card-title">{auction.title}</p>
              <p className="auction-card-price">
                Starting at {auction.startingPrice} €
              </p>
            </div>
          ))}
        </div>

        {loading && hasMore && (
          <div className="loading-more">Loading more auctions...</div>
        )}
      </div>
    </div>
  );
};

export default LandingPage;
