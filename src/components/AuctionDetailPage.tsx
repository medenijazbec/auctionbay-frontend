import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import grid from './AuctionDetailPage.module.css';

import clock15 from '../assets/15clock.png';
import clock30 from '../assets/30clock.png';
import clock45 from '../assets/45clock.png';

export interface Bid {
  amount: number;
  createdDateTime?: string;
  userName?: string;
}

export interface Auction {
  auctionId: number;
  title: string;
  description: string;
  mainImageUrl: string;
  auctionState: 'outbid' | 'inProgress' | 'winning' | 'done';
  endDateTime: string;
  currentHighestBid: number;
  startingPrice?: number;
  bids: Bid[];
}

const getStateClass = (s: Auction['auctionState']) =>
  s === 'inProgress' ? 'editable'
    : s === 'winning' ? 'winning'
      : s === 'done' ? 'done'
        : 'outbid';

const AuctionDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [auction, setAuction] = useState<Auction | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [myBid, setMyBid] = useState(0);

  const fetchAuction = useCallback(async () => {
    if (!id) { setError('Invalid auction ID'); setLoading(false); return; }
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/Auctions/${id}`);
      if (!res.ok) throw new Error(`Status ${res.status}`);
      const data: Auction = await res.json();
      setAuction(data);
      setMyBid(data.currentHighestBid + 1);
    } catch {
      setError('Could not load auction. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { fetchAuction(); }, [fetchAuction]);

  const timeLeft = () => {
    if (!auction) return '';
    const ms = new Date(auction.endDateTime).getTime() - Date.now();
    if (ms <= 0) return '0h';
    const hrs = ms / 3_600_000;
    return hrs <= 72 ? `${Math.ceil(hrs)}h` : `${Math.ceil(hrs / 24)} days`;
  };

  const pickClock = () => {
    if (!auction) return clock45;
    const hrs = (new Date(auction.endDateTime).getTime() - Date.now()) / 3.6e6;
    return hrs <= 15 ? clock15 : hrs <= 30 ? clock30 : clock45;
  };

  const submitBid = async () => {
    if (!auction) return;
    try {
      const res = await fetch(`/api/Auctions/${auction.auctionId}/bid`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: myBid }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => null);
        throw new Error(err?.error || `Status ${res.status}`);
      }
      await fetchAuction();
    } catch (e: any) {
      alert(e.message || 'Bid failed.');
    }
  };

  if (loading) return <p className={grid.message}>Loading auction…</p>;
  if (error) return <p className={grid.message}>{error}</p>;
  if (!auction) return <p className={grid.message}>No auction found.</p>;

  const stateCls = getStateClass(auction.auctionState);
  //ensure first letter capitalized
  const displayTitle = auction.title.charAt(0).toUpperCase() + auction.title.slice(1);

  return (
    <div className={grid.container}>
      <div className={grid.imageContainer}>
        <img src={auction.mainImageUrl} alt={displayTitle} />
      </div>

      <div className={grid.infoContainer}>
        <div className={grid.topSection}>
          <div className={grid.statusTime}>
            <span className={`${grid.tag} ${grid[stateCls]}`}>
              {auction.auctionState}
            </span>
            <span className={`${grid.tag} ${grid[stateCls]}`}>
              {timeLeft()}
              <img src={pickClock()} className={grid.clockIcon} alt="" />
            </span>
          </div>

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
          <h2>Bidding history&nbsp;({auction.bids.length})</h2>
          {auction.bids.map((b, i) => (
            <div className={grid.bidEntry} key={i}>
              <img
                src={`https://i.pravatar.cc/40?u=${b.userName ?? i}`}
                alt={b.userName ?? 'Bidder'}
              />
              <div className={grid.bidInfo}>
                <strong>{b.userName ?? 'Anonymous'}</strong>
                {b.createdDateTime && (
                  <span>
                    {new Date(b.createdDateTime).toLocaleString(undefined, {
                      hour:   '2-digit',
                      minute: '2-digit',
                      day:    'numeric',
                      month:  'numeric',
                      year:   'numeric',
                    })}
                  </span>
                )}
              </div>
              <div className={grid.amount}>{b.amount.toFixed(0)} €</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AuctionDetailPage;
