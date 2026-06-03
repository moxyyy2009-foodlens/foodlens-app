# FoodLens - Food Transparency & Health Analysis App

🔍 **See Through Your Food** - Know what you're eating with real ingredient data and transparent health scores.

## ✨ Features

✅ Search 500+ food products  
✅ Real nutritional data from verified sources  
✅ Transparent health scoring (0-100)  
✅ Ingredient analysis with concerns flagged  
✅ Healthier brand alternatives suggested  
✅ Mobile-friendly web app  
✅ Works on phone browser (no app download needed)  

## 🚀 Quick Start

### Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
Open http://localhost:5173 on your phone or browser

### Backend Setup
```bash
cd backend
pip install -r requirements.txt
python app.py
```
API runs on http://localhost:5000

## 🛠 Technology Stack

**Frontend:** React + Vite + DM Sans fonts  
**Backend:** Python Flask + PostgreSQL  
**Data:** Open Food Facts API + Custom Database  
**Deployment:** Vercel (frontend) + Railway (backend)  

## 📁 Project Structure

```
foodlens-app/
├── frontend/              # React app
│   ├── src/
│   │   ├── App.jsx       # Main FoodLens component
│   │   └── main.jsx      # Entry point
│   ├── package.json
│   └── vite.config.js
├── backend/               # Flask API
│   ├── app.py            # Main Flask server
│   ├── database.py       # PostgreSQL connection
│   ├── routes.py         # API endpoints
│   ├── products_seed.py  # Load 500+ products
│   └── requirements.txt
├── README.md
├── .gitignore
└── docker-compose.yml
```

## ⭐ Health Score System

- **0-30**: Very Unhealthy ❌
- **31-50**: Unhealthy ⚠️
- **51-70**: Moderate 🟡
- **71-85**: Good ✅
- **86-100**: Excellent 🌟

Based on **WHO, AHA & ICMR guidelines**.

## ⚖️ Legal Note

FoodLens provides **factual nutritional information only**. Never defames brands. Always cites data sources.

## 📱 Deployment

**Live at:** (Coming Soon - Deploy instructions below)

### Deploy Frontend to Vercel
```bash
cd frontend
npm install -g vercel
vercel
```

### Deploy Backend to Railway
1. Go to https://railway.app
2. Connect your GitHub repo
3. Select `backend/` folder
4. Deploy

## 👨‍💻 Author

Built by @moxyyy2009 - First step towards building a conglomerate of health-focused companies.

---

**Made with ❤️ to help you see through your food.**
