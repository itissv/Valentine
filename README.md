# ❤️ Valentine's Day Special App

A real-time, animated, and romantic web application designed for couples. This app has been migrated to a serverless-friendly stack (Pusher + Neon PostgreSQL) and is ready for Vercel deployment.

## 🚀 How to Run Locally

### 1. Prerequisites
- **Node.js**: v18+
- **Pusher Account**: Create a free account at [pusher.com](https://pusher.com/).
- **Neon Account**: Create a free account at [neon.tech](https://neon.tech/).

### 2. Setup Environment Variables
Create a `.env` file in the root directory and add the following:

```env
# Neon PostgreSQL
DATABASE_URL="your_neon_postgresql_url"

# Pusher (Server-side)
PUSHER_APP_ID="your_app_id"
PUSHER_SECRET="your_secret"

# Pusher (Public/Client-side)
NEXT_PUBLIC_PUSHER_APP_KEY="your_public_key"
NEXT_PUBLIC_PUSHER_CLUSTER="your_cluster_id"
```

### 3. Install & Run
```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the app!

## ☁️ Deployment (Vercel)

1. **Push to GitHub**: Connect your local repo to GitHub.
2. **Import to Vercel**: Connect your GitHub repo to a new Vercel project.
3. **Environment Variables**: Add all the variables from your `.env` to the Vercel project settings.
4. **Deploy**: Build and deploy!

## 🛠️ Tech Stack
- **Framework**: Next.js (App Router)
- **Real-time**: Pusher
- **Database**: Neon (PostgreSQL) + Prisma
- **Animations**: Framer Motion
- **Icons**: Lucide React
