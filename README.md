
# AuctionBay Frontend

![logo_banner](https://github.com/user-attachments/assets/cb423cfe-c515-4244-bbe0-ac94a183206c)

**AuctionBay Frontend** is a responsive React-based client application for interacting with the AuctionBay Web API. It provides user registration/login, auction browsing, bidding UI, profile management, notifications, and image uploads.

---


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

