# DreamsLab Link Launcher Cloud Vault Backend

Zero-Knowledge Authenticated Synchronization Service for **DreamsLab Link Launcher**.

---

## 🔒 Zero-Knowledge Security Model
- **No Passwords Stored**: The server never sees or receives user master passwords.
- **Client-Side Encryption**: Vault data (links, categories, profiles) is encrypted locally on the user's device with AES-GCM 256-bit keys before reaching the network.
- **Pure Blind Storage**: The backend acts solely as an authenticated blind storage vault for encrypted blobs.

---

## 🚀 Instant Local Run
```bash
cd server
npm install
npm start
```
The API will start at `http://localhost:3000`.

---

## ☁️ 1-Click Cloud Deployment (Free Tiers)

### Option 1: Render.com (Recommended)
1. Fork or push this repository to GitHub.
2. Log into [Render.com](https://render.com) and click **New + Web Service**.
3. Connect your repository and select root directory: `server`.
4. Set Build Command: `npm install`
5. Set Start Command: `node server.js`
6. Add Environment Variables:
   - `JWT_SECRET`: (Enter a random 32-character string)
   - `ALLOWED_ORIGINS`: `https://abdullahinayat24-lang.github.io,http://localhost:3000`
7. Click **Deploy**. Copy your Render URL (e.g., `https://dreamslab-vault.onrender.com`).
8. In Link Launcher, open **Cloud Settings** and paste your URL.

### Option 2: Railway.app / Fly.io
Deploy the `server` directory directly using standard Node.js runtime.

---

## 📡 API Reference
- `GET  /api/health` - Health check
- `POST /api/auth/register` - Register new zero-knowledge vault account
- `POST /api/auth/login` - Authenticate and fetch encrypted vault
- `GET  /api/vault` - Fetch encrypted vault (Bearer token auth)
- `POST /api/vault` - Update encrypted vault (Bearer token auth)
