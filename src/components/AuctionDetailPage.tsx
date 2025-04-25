import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import grid from './AuctionDetailPage.module.css';

import clock0   from '../assets/0clock.png';
import clock7   from '../assets/7clock.png';
import clock15  from '../assets/15clock.png';
import clock25  from '../assets/25clock.png';
import clock30  from '../assets/30clock.png';
import clock37  from '../assets/37clock.png';
import clock45  from '../assets/45clock.png';
import clock53  from '../assets/53clock.png';
import clock60  from '../assets/60clock.png';
import { formatTimeLeft } from './timeHelpers';

const CLOCKS = [
  clock0, clock7, clock15, clock25,
  clock30, clock37, clock45, clock53, clock60
];

function getClockIcon(start: string, end: string): string {
  const now = Date.now();
  const s   = new Date(start).getTime();
  const e   = new Date(end).getTime();
  const pct = Math.min(Math.max((now - s) / (e - s), 0), 1);
  const idx = Math.round(pct * (CLOCKS.length - 1));
  return CLOCKS[idx];
}

export interface Bid {
  amount: number;
  createdDateTime: string;
  userName: string;
  profilePictureUrl?: string;
}

export interface Auction {
  auctionId: number;
  title: string;
  description: string;
  mainImageUrl: string;
  auctionState: 'outbid' | 'inProgress' | 'winning' | 'done';
  startDateTime: string;
  endDateTime: string;
  currentHighestBid: number;
  startingPrice?: number;
  bids: Bid[];
}

const getTagText = (s: Auction['auctionState']) =>
  s === 'inProgress' ? 'In Progress'
  : s === 'winning'    ? 'Winning'
  : s === 'done'       ? 'Done'
  :                      'Outbid';

const getTimeTagClass = (end: string): string => {
  const hrs = (new Date(end).getTime() - Date.now()) / 3_600_000;
  return hrs <= 1
    ? grid.time
    : grid.neutral;
};

const getStateClass = (s: Auction['auctionState']) =>
  s === 'inProgress' ? 'editable'
    : s === 'winning' ? 'winning'
      : s === 'done' ? 'done'
        : 'outbid';

const AuctionDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const jwt = localStorage.getItem('token');
  const BACKEND_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

  const [auction, setAuction] = useState<Auction | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);
  const [myBid, setMyBid]     = useState(0);
  const [profileName, setProfileName] = useState('there');

  // fetch current user’s name
  useEffect(() => {
    if (!jwt) return;
    fetch('/api/Profile/me', {
      headers: { Authorization: `Bearer ${jwt}` }
    })
      .then(res => {
        if (res.status === 401) {
          navigate('/login', { replace: true });
          throw new Error('Unauthorized');
        }
        return res.json();
      })
      .then((p: { firstName?: string; lastName?: string; email: string }) => {
        const name = `${p.firstName ?? ''} ${p.lastName ?? ''}`.trim()
          || p.email.split('@')[0];
        setProfileName(name);
      })
      .catch(() => {
        /* leave default */
      });
  }, [jwt, navigate]);

  // fetch auction details
  const fetchAuction = useCallback(async () => {
    if (!id) {
      setError('Invalid auction ID');
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/Auctions/${id}`, {
        headers: jwt ? { Authorization: `Bearer ${jwt}` } : undefined
      });
      if (res.status === 401) {
        navigate('/login', { replace: true });
        return;
      }
      if (!res.ok) throw new Error(`Status ${res.status}`);
      const data: Auction = await res.json();
      setAuction(data);
      setMyBid(data.currentHighestBid + 1);
    } catch {
      setError('Could not load auction. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [id, jwt, navigate]);

  useEffect(() => {
    fetchAuction();
  }, [fetchAuction]);

  const submitBid = async () => {
    if (!auction) return;
    try {
      const res = await fetch(
        `/api/Auctions/${auction.auctionId}/bid`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(jwt ? { Authorization: `Bearer ${jwt}` } : {})
          },
          body: JSON.stringify({ amount: myBid }),
        }
      );
      if (res.status === 401) {
        navigate('/login', { replace: true });
        return;
      }
      if (!res.ok) {
        const err = await res.json().catch(() => null);
        throw new Error(err?.error || `Status ${res.status}`);
      }
      await fetchAuction();
    } catch (e: any) {
      alert(e.message || 'Bid failed.');
    }
  };

  if (loading)   return <p className={grid.message}>Loading auction…</p>;
  if (error)     return <p className={grid.message}>{error}</p>;
  if (!auction)  return <p className={grid.message}>No auction found.</p>;

  // compute done vs inProgress
  const nowMs  = Date.now();
  const endMs  = new Date(auction.endDateTime).getTime();
  const isDone = endMs <= nowMs;
  const displayState: Auction['auctionState'] = isDone
    ? 'done'
    : auction.auctionState;

  const displayTitle =
    auction.title.charAt(0).toUpperCase() + auction.title.slice(1);

  return (
    <div className={grid.container}>
      <div className={grid.imageContainer}>
        <img src={auction.mainImageUrl} alt={displayTitle} />
      </div>

      <div className={grid.infoContainer}>
        <div className={grid.topSection}>

          {/* ── STATUS & TIME ROW ─────────────────────────────── */}
          <div className={grid.statusTime}>
            <span
              className={`${grid.tag} ${grid[getStateClass(displayState)]}`}
            >
              {getTagText(displayState)}
            </span>
            {!isDone && (
              <span
                className={`${grid['time-tag']} ${
                  grid[getTimeTagClass(auction.endDateTime)]
                }`}
              >
                {formatTimeLeft(auction.endDateTime)}
                <img
                  src={getClockIcon(
                    auction.startDateTime,
                    auction.endDateTime
                  )}
                  className={grid.clockIcon}
                  alt=""
                />
              </span>
            )}
          </div>
          {/* ─────────────────────────────────────────────────── */}

          <h1 className={grid.title}>{displayTitle}</h1>
          <p className={grid.description}>{auction.description}</p>

          <div className={grid.bidAction}>
            <label htmlFor="bid">Bid:</label>
            <input
              id="bid"
              type="number"
              min={auction.currentHighestBid + 1}
              value={myBid}
              onChange={e => setMyBid(Number(e.target.value))}
            />
            <button onClick={submitBid}>Place bid</button>
          </div>
        </div>

        <div className={grid.biddingHistory}>
          <h2>Bidding history ({auction.bids.length})</h2>

          {auction.bids.length === 0 ? (
            <div className={grid.emptyState}>
              <h3>No bids yet!</h3>
              <p>Place your bid to have a chance to get this item.</p>
            </div>
          ) : (
            auction.bids.map((b, i) => (
              <div className={grid.bidEntry} key={i}>
                <img
                  className={grid.bidAvatar}
                  src={
                    b.profilePictureUrl
                      ? `${BACKEND_BASE_URL}${b.profilePictureUrl}`
                      : `https://i.pravatar.cc/40?u=${b.userName}`
                  }
                  alt={b.userName}
                />
                <div className={grid.bidInfo}>{b.userName}</div>
                <div className={grid.timestamp}>
                  {new Date(b.createdDateTime).toLocaleString(undefined, {
                    hour:   '2-digit',
                    minute: '2-digit',
                    day:    'numeric',
                    month:  'numeric',
                    year:   'numeric',
                  })}
                </div>
                <div className={grid.amount}>{b.amount.toFixed(0)} €</div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default AuctionDetailPage;
