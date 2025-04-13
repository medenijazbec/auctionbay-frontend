// src/components/AuctionList.tsx
import React, { useEffect, useState } from 'react';

// Define a type representing the AuctionResponseDto from your backend.
interface Auction {
  auctionId: number;
  title: string;
  description: string;
  startingPrice: number;
  startDateTime: string;
  endDateTime: string;
  auctionState: string;
  createdBy: string;
  createdAt: string;
  mainImageUrl: string;
  // If you need to display more details from bids, you can expand this interface.
  currentHighestBid: number;
  timeLeft: string; // This can be calculated as a string, or you may recast to number and format it.
  bids: Array<{ amount: number }>;
}

const AuctionList: React.FC = () => {
  const [auctions, setAuctions] = useState<Auction[]>([]);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    // Fetch the active auctions from your backend API.
    fetch('https://localhost:7056/api/Auctions')
      .then(res => {
        if (!res.ok) {
          throw new Error('Error fetching auctions');
        }
        return res.json();
      })
      .then((data: Auction[]) => {
        setAuctions(data);
      })
      .catch(err => {
        console.error(err);
        setError('Failed to load auctions.');
      });
  }, []);

  if (error) {
    return <div className="error-msg">{error}</div>;
  }

  return (
    <div className="auction-list">
      <h2 className="actions-title">Active Auctions</h2>
      <div className="auction-grid">
        {auctions.map(auction => (
          <div key={auction.auctionId} className="auction-card">
            <img
              src={auction.mainImageUrl}
              alt={auction.title}
              className="auction-card-image"
            />
            <p className="auction-card-title">{auction.title}</p>
            <p className="auction-card-price">Starting at {auction.startingPrice} €</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AuctionList;
