# Harbor Frontend Deployment Guide

Harbor is a Next.js application that can be deployed to Vercel (recommended) or self-hosted in any Node.js environment.

---

## Deployment Option 1: Vercel (Easiest Path)

Vercel is the recommended hosting platform for Next.js applications, offering automatic builds, serverless function routing, and global CDN caching out-of-the-box.

### Step 1: Connect GitHub Repository
1. Log into your [Vercel Dashboard](https://vercel.com).
2. Click **Add New** > **Project**.
3. Import your fork of the `harbor-frontend` repository.

### Step 2: Configure Environment Variables
In the **Environment Variables** section of the Vercel project configuration, add all required `NEXT_PUBLIC_HARBOR_*` variables (see the [Reference Table](#environment-variables-reference-table) below).

### Step 3: Deploy
Click **Deploy**. Vercel will automatically build the production bundle and serve the app on a public URL.

---

## Deployment Option 2: Self-Hosting

To self-host the application in a private server or VPS (e.g. EC2, DigitalOcean Droplet):

### Step 1: Clone and Install
```bash
git clone https://github.com/Harbor-hq/harbor-frontend.git
cd harbor-frontend
npm install
```

### Step 2: Configure Environment Variables
Create a production `.env.local` file:
```bash
cp .env.local.example .env.local
```
Edit `.env.local` to fill in your production parameters.

### Step 3: Build and Start
Compile the Next.js production build and boot the server:
```bash
npm run build
npm start
```
By default, the server runs on port `3000`. You can front it with a reverse proxy like Nginx and configure SSL.

---

## Environment Variables Reference Table

Configure these environment variables at build-time or in your deployment hosting settings:

| Variable Name | Required | Default Value | Purpose / Description | Example Value |
| --- | --- | --- | --- | --- |
| `NEXT_PUBLIC_HARBOR_CONTRACT_ID` | Optional | `CD4U2T3X5K7G2J6L4A8B9Z1Y0W_MOCK_CONTRACT_ID` | Deployed address of the `hedgepay_batch` contract. Defaults to mock. | `CDQMLR7BUWEGNRVVMVYQYBTANAG3JXLDRR4V4RZYPOOG53XDKGC3PJYQ` |
| `NEXT_PUBLIC_HARBOR_RPC_URL` | Optional | `https://soroban-testnet.stellar.org` | Soroban RPC node endpoint. | `https://soroban-testnet.stellar.org` |
| `NEXT_PUBLIC_HARBOR_NETWORK_PASSPHRASE` | Optional | `Test SDF Network ; September 2015` | Passphrase indicating the Stellar network to build transactions against. | `Public Global Stellar Network ; October 2015` |
| `NEXT_PUBLIC_HARBOR_TOKEN_DECIMALS` | Optional | `6` | Decimal places of the base token (USDC uses 6). | `6` |
| `NEXT_PUBLIC_HARBOR_EVENTS_URL` | Optional | `undefined` | URL of the HTTP endpoint exposed by the off-chain payout listener API. | `http://localhost:8787/payouts` |

---

## Runtime Overrides (Settings Page)

To support rapid testing and multi-network configurations, the Harbor frontend has a **Runtime Override** mechanism:

1. Navigate to the **Settings** page in the dashboard interface.
2. In the **Network Configuration** section, you can input a custom Contract ID, RPC URL, and Network Passphrase.
3. These values are saved to the browser's `localStorage` and will **take precedence** over the build-time environment variables.
4. Clicking **Reset Defaults** clears the overrides and falls back to your configured environment variables.
