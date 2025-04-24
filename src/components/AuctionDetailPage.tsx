import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import grid from './AuctionDetailPage.module.css';

// clock icons 
import clock15 from '../assets/15clock.png';
import clock30 from '../assets/30clock.png';
import clock45 from '../assets/45clock.png';

export interface Bid {
  amount: number;
  createdDateTime?: string;
  userName?: string;
}

export interface Auction {
  auctionId:         number;
  title:             string;
  description:       string;
  mainImageUrl:      string;
  auctionState:      string;
  endDateTime:       string;
  currentHighestBid: number;
  startingPrice?:    number;
  bids:              Bid[];
}

const AuctionDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [auction, setAuction] = useState<Auction | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);
  const [myBid, setMyBid]     = useState<number>(0);

  const fetchAuction = useCallback(async () => {
    if (!id) {
      setError('Invalid auction ID');
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/Auctions/${id}`);
      if (!res.ok) throw new Error(`Status ${res.status}`);
      const data: Auction = await res.json();
      setAuction(data);
      setMyBid(data.currentHighestBid + 1);
    } catch (e) {
      console.error(e);
      setError('Could not load auction. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchAuction();
  }, [fetchAuction]);

  /** returns "42h" if ≤72h left, else "3 days" */
  const timeLeft = () => {
    if (!auction) return '';
    const ms = new Date(auction.endDateTime).getTime() - Date.now();
    if (ms <= 0) return '0h';
    const hrs = ms / 3_600_000;
    return hrs <= 72
      ? `${Math.ceil(hrs)}h`
      : `${Math.ceil(hrs / 24)} days`;
  };

  /** choose same 15/30/45 icon logic as on the list page */
  const getClockIcon = () => {
    if (!auction) return '';
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

  if (loading)  return <p className={grid.message}>Loading auction…</p>;
  if (error)    return <p className={grid.message}>{error}</p>;
  if (!auction) return <p className={grid.message}>No auction found.</p>;

  return (
    <section className={grid.wrapper}>
      {/* LEFT – image */}
      <div className={grid.imageCol}>
        <img
          src={auction.mainImageUrl}
          alt={auction.title}
          className={grid.image}
        />
      </div>

      {/* RIGHT – two stacked “cards” */}
      <div className={grid.infoCol}>
        {/* DETAILS CARD */}
        <div className={grid.detailsCard}>
          <div className={grid.tagsBar}>
            <span className={grid.statusTag}>
              {auction.auctionState}
            </span>
            <span className={grid.timeTag}>
              {timeLeft()}
              <img
                src={getClockIcon()}
                alt="time left"
                className={grid.clockIcon}
              />
            </span>
          </div>
          <h1 className={grid.title}>{auction.title}</h1>
          <p className={grid.desc}>{auction.description}</p>
          <div className={grid.bidForm}>
            <label htmlFor="myBid">Bid:</label>
            <input
              id="myBid"
              type="number"
              min={auction.currentHighestBid + 1}
              value={myBid}
              onChange={e => setMyBid(+e.target.value)}
            />
            <button onClick={submitBid}>Place bid</button>
          </div>
        </div>

        {/* HISTORY CARD */}
        <div className={grid.historyCard}>
          <h2>Bidding history&nbsp;({auction.bids.length})</h2>
          <ul className={grid.historyList}>
            {auction.bids.map((b, i) => (
              <li key={i}>
                <span className={grid.bidUser}>
                  {b.userName ?? `Bidder #${i+1}`}
                </span>
                <span className={grid.bidTime}>
                  {b.createdDateTime
                    ? new Date(b.createdDateTime).toLocaleString()
                    : ''}
                </span>
                <span className={grid.bidAmount}>{b.amount} €</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
};

export default AuctionDetailPage;
