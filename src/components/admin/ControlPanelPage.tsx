import React from "react";
import styles from "./ControlPanelPage.module.css";
import { NavLink, Outlet } from "react-router-dom";

const ControlPanelPage: React.FC = () => (
  <div className={styles.container}>
    <nav className={styles.nav}>
      <NavLink
        to="/admin/users"
        className={({ isActive }) =>
          isActive ? `${styles.link} ${styles.active}` : styles.link
        }
      >
        Users
      </NavLink>
      <NavLink
        to="/admin/auctions"
        className={({ isActive }) =>
          isActive ? `${styles.link} ${styles.active}` : styles.link
        }
      >
        Auctions
      </NavLink>
    </nav>
    <main className={styles.main}>
      <Outlet />
    </main>
  </div>
);

export default ControlPanelPage;
