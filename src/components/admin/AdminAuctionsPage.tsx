import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import styles from "./Admin.module.css";

interface Auction {
  auctionId: number;
  title: string;
  createdAt: string;
}

const BACKEND = "https://localhost:7056";

const AuctionsPage: React.FC = () => {
  const jwt = localStorage.getItem("token");
  const [search, setSearch] = useState("");
  const [auctions, setAuctions] = useState<Auction[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const loc = useLocation();

  useEffect(() => {
    fetch(
      `${BACKEND}/api/Admin/auctions?search=${encodeURIComponent(
        search
      )}&page=${page}&pageSize=20`,
      { headers: { Authorization: `Bearer ${jwt}` } }
    )
      .then((r) => r.json())
      .then((data: { total: number; items: Auction[] }) => {
        setTotal(data.total);
        setAuctions(data.items);
      });
  }, [search, page, jwt]);

  const deleteAuction = (id: number) => {
    if (!confirm("Delete this auction?")) return;
    fetch(`${BACKEND}/api/Admin/auctions/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${jwt}` },
    }).then((r) => {
      if (r.ok) setAuctions((a) => a.filter((x) => x.auctionId !== id));
    });
  };

  return (
    <div>
      <h1>Manage Auctions</h1>
      <div className={styles.toolbar}>
        <input
          placeholder="Search by title/description…"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
        />
      </div>

      <table className={styles.table}>
        <thead>
          <tr>
            <th>Title</th>
            <th>Created</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {auctions.map((a) => (
            <tr key={a.auctionId}>
              <td>{a.title}</td>
              <td>{new Date(a.createdAt).toLocaleString()}</td>
              <td>
                <Link to={`${a.auctionId}`} state={{ from: loc }}>
                  Edit
                </Link>{" "}
                <button onClick={() => deleteAuction(a.auctionId)}>
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className={styles.pagination}>
        Page {page} of {Math.ceil(total / 20)}
        <button onClick={() => setPage((p) => Math.max(1, p - 1))}>‹</button>
        <button onClick={() => setPage((p) => p + 1)}>›</button>
      </div>
    </div>
  );
};

export default AuctionsPage;
