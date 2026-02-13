# 🌱 Seedling: Planting the Seeds of Financial Freedom

**Seedling** is a next-generation Fintech platform built on the **XRP Ledger (XRPL)**, designed to teach children financial discipline while building long-term generational wealth.

---

## 🚀 The Core Concept: The 70/30 Split
Seedling automates the habit of saving. Every time a child earns a reward for completing a chore, the app intelligently splits the assets:
- **70% Spend Seedling:** Available for immediate use, teaching kids budgeting and the value of labor.
- **30% Growth Seedling:** Automatically locked in a blockchain-backed escrow until the child turns 18.

---

## ✨ Key Features
- **Smart Escrow Rewards:** Parents can assign tasks and set rewards in XRP. Funds are secured via XRPL Smart Contracts.
- **Immutable Growth Fund:** The 30% portion is cryptographically locked, ensuring a dedicated fund for the child's future (Education/Business).
- **Gamified Experience:** A playful, kid-friendly UI that makes financial literacy fun and engaging.
- **Bank-Grade Security:** User data and seed phrases are protected using AES-256 encryption.

---

## 🛠 Tech Stack
- **Blockchain:** XRP Ledger (XRPL)
- **Backend:** Node.js, Express.js
- **Frontend:** EJS,Bootstrap5
- **Database:** MongoDB
- **Security:** AES-256-GCM Encryption

---

## 📂 Project Structure
app.js — Express app bootstrap
db.js — MongoDB connection
controllers/ — request handlers (auth, chores, kids, wallets, spending)
routes/ — Express routes
models/ — Mongoose schemas (User, Wallet, Chore, Transaction)
middleware/ — auth/role helpers
views/ — EJS templates (home, dashboard, login, register, kid‑login)
public/ — static assets (images like logo/hero)
utils/ — helpers (seed encryption, etc.)
.env, package.json, package-lock.json, node_modules/

---

## 📜 Compliance & Safety
Seedling is designed with global standards in mind:
- **Non-Custodial:** Parents retain control of their master keys.
- **Educational Framing:** Rewards are categorized as educational grants (Okozukai).
- **Security First:** Built-in protection against unauthorized access with a Kid-specific 4-digit PIN system.

---


