# IronVault

Repository for the **IronVault** crypto wallet.

## Stack

- **Next.js (App Router) + React + TypeScript** for the web app and API routes
- **Node.js runtime** through Next.js route handlers
- **MongoDB + Prisma** for non-sensitive application data
- **Tailwind CSS** for styling
- Optional later: `viem` or `ethers` for real blockchain integrations on **testnets only**

## Why this stack

The reports already leans toward a browser-based React front end, a Node.js backend, and MongoDB for non-sensitive data. We explicitly say sensitive information like private keys and recovery phrases should **not** be stored on the backend in plaintext, and that the prototype should keep complexity small and focus on core features first.

## Current state

- Landing page
- Dashboard
- Send / receive screens
- Transaction history screen
- Settings and admin placeholders
- API routes for:
  - register
  - create wallet
  - transaction pre-submit validation
  - prices
  - networks
  - transactions
- Prisma schema for users, wallets, addresses, transactions
- Seed script
- Basic AES-GCM encryption helper for recovery phrase demo flows

## Important security note

This is a **prototype starter**, not a production wallet. We are not using this code to hold real assets. This Build and demo is only used against **testnets**.

## Quick start

```bash
npm install
cp .env.example .env
npm run prisma:generate
npm run prisma:push
npm run seed
npm run dev
```

MongoDB Atlas `DATABASE_URL` must include a database name after `.net/`, for example:

```bash
DATABASE_URL="mongodb+srv://<username>:<password>@cluster-name.mongodb.net/ironvault?retryWrites=true&w=majority"
```

Using the cluster root URL without `/ironvault` or another database name will cause Prisma to throw `P1013` saying the database string is invalid.

## Suggested team split

1. **Frontend team**: dashboard, send/receive, onboarding, transaction history
2. **Backend team**: API routes, Prisma models, validation, audit logging
3. **Wallet/security team**: encryption, backup/export, auto-lock, address validation
4. **Integration team**: testnet RPC, live pricing, transaction polling, CI/CD

## Features that we need to add

1. ~~Register~~/~~login~~
2. ~~Create~~/import wallet
3. Receive funds
4. Send funds with validation + confirmation
5. Transaction history
6. Portfolio + live prices
7. Optional AI warnings and alerts after core flows are stable
