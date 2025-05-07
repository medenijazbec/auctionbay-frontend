![logo_banner](https://github.com/user-attachments/assets/cb423cfe-c515-4244-bbe0-ac94a183206c)# AuctionBay Frontend

**AuctionBay Frontend** is a responsive React-based client application for interacting with the AuctionBay Web API. It provides user registration/login, auction browsing, bidding UI, profile management, notifications, and image uploads.

---


![Uploading <svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" preserveAspectRatio="xMidYMid" width="1274" height="256" viewBox="0 0 1274 256">
  <defs>
    <style>
      .cls-1, .cls-2 {
        font-size: 200px;
      }

      .cls-2, .cls-4 {
        font-family: "TwCenMT-BoldItalic";
        font-weight: bold;
        font-style: italic;
      }

      .cls-3, .cls-4 {
        font-size: 35px;
      }
    </style>
  </defs>
  <image xlink:href="data:img/png;base64,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" x="1" y="1" width="254" height="254"/>
  <image xlink:href="data:img/png;base64,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" x="225" y="31" width="1036" height="211"/>
  <text x="305" y="187" class="cls-1"><tspan class="cls-2">Auctionbay</tspan></text>
  <text x="295" y="224" class="cls-3"><tspan class="cls-4">Auctions made simple</tspan></text>
</svg>
logo_banner.svg…]()


## Table of Contents

1. **Features**  
2. **Tech Stack**  
3. **Getting Started**  
   - **Prerequisites**  
   - **Installation**  
   - **Environment Variables**  
   - **Running Locally**  
4. **Project Structure**  
5. **Available Scripts**  
6. **Deployment**  


---

## Features

- **User Authentication & Authorization**  
  - Register, login, logout flows with JWT  
  - Protected routes for authenticated users  
- **Auction Browsing**  
  - Paginated list of active auctions  
  - Detailed view with bid history and status  
- **Bidding Interface**  
  - Place bids directly from auction pages  
  - Visual feedback on current highest bid  
- **User Profile**  
  - View & update personal information  
  - Change password  
  - Manage created auctions  
  - View bidding history and wins  
- **Notifications**  
  - Real-time notification center  
  - Mark individual/all notifications as read  
- **Image Upload**  
  - Multipart form support for auction images  
  - Preview before upload  
- **Responsive Design**  
  - Mobile-first layouts  
  - Accessible UI components  

---

## Tech Stack

- **Framework:** [Next.js](https://nextjs.org/) (React)  
- **Language:** TypeScript  
- **Styling:** [Tailwind CSS](https://tailwindcss.com/)  
- **UI Components:** shadcn/ui & lucide-react icons  
- **State Management:** React Context & Hooks  
- **Data Fetching:** `fetch` / SWR (stale-while-revalidate)  
- **Form Handling & Validation:** React Hook Form & Zod  
- **Routing:** Next.js Dynamic Routes  
- **Notifications:** custom context & WebSocket fallback  
- **Deployment:** Vercel / Netlify / Docker  

---

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) v16+  
- [npm](https://www.npmjs.com/) or [Yarn](https://yarnpkg.com/)  

### Installation

1. **Clone the repo**  
   ```bash
   git clone https://github.com/your-org/auctionbay-frontend.git
   cd auctionbay-frontend
   ```

2. **Install dependencies**  
   ```bash
   npm install
   # or
   yarn install
   ```

### Environment Variables

Create a `.env.local` file in the root directory:

```env
NEXT_PUBLIC_API_BASE_URL=https://localhost:5001
NEXT_PUBLIC_JWT_STORAGE_KEY=auctionbay_token
```

- `NEXT_PUBLIC_API_BASE_URL`: URL of the AuctionBay backend API  
- `NEXT_PUBLIC_JWT_STORAGE_KEY`: Key for storing JWT in localStorage  

### Running Locally

```bash
npm run dev
# or
yarn dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Project Structure

```
/
├─ public/               # Static assets and images
├─ src/
│  ├─ components/        # Reusable UI components (Cards, Modals, Forms)
│  ├─ context/           # React Context providers (Auth, Notifications)
│  ├─ hooks/             # Custom React hooks
│  ├─ pages/             # Next.js pages & API routes
│  ├─ services/          # API client wrappers
│  ├─ styles/            # Global CSS & Tailwind config
│  └─ utils/             # Helpers and validation schemas
├─ .env.local            # Local environment variables
├─ next.config.js        # Next.js configuration
├─ tailwind.config.js    # Tailwind CSS configuration
├─ tsconfig.json         # TypeScript configuration
└─ package.json
```

---

## Available Scripts

- `dev`  
  Runs the app in development mode.  
- `build`  
  Builds the app for production.  
- `start`  
  Starts the production server.  
- `lint`  
  Runs ESLint checks.  
- `format`  
  Formats code with Prettier.

---

## Deployment

- **Vercel**: Push to `main` branch; environment variables set in dashboard  
- **Netlify**: Configure build command `npm run build` and publish `out/` directory  
- **Docker**:  
  ```dockerfile
  FROM node:16-alpine
  WORKDIR /app
  COPY . .
  RUN npm install && npm run build
  CMD ["npm","start"]
  ```
---

