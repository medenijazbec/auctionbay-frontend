// src/components/ControlPanelPage.tsx
import React from "react";

const ControlPanelPage: React.FC = () => {
  return (
    <div style={{ padding: "2rem" }}>
      <h1>Admin Control Panel</h1>
      <p>
        From here you can search users, edit profiles, and manage auctions.
      </p>
      {/* TODO: Wire up tabs/views for Users / Auctions */}
    </div>
  );
};

export default ControlPanelPage;
