# AniWay

**AniWay** is an intelligent travel planning platform for anime fans. It helps you plan trips to real-world locations featured in your favorite anime series—combining AI-powered recommendations, interactive maps, and seamless itinerary management.

## ✈️ What is AniWay?

AniWay transforms anime-inspired travel into reality by offering features tailored for otaku travelers:

- Real-world locations from anime scenes.
- AI-personalized trip itineraries.
- Interactive maps & scene comparisons.
- Simple Google sign-in & profile management.

---

## 🌟 Features

- **🎌 AI-Powered Itinerary Generation** — Smart travel plans from your favorite anime using OpenAI & Anitabi APIs.
- **🗺️ Interactive Map Visualizations** — Explore real locations linked to anime series via Google Maps API.
- **📍 Location Info on Click** — See images, contact info, ratings, hours & more.
- **🔍 Scene Search by Anime/Episode** — Find exact places where your anime scenes happen.
- **🌏 Popular Destinations & Recommendations** — Discover trending spots for anime fans.
- **🔑 Google One-Click Login** — Simple, secure login & profile management.
- **👤 Itinerary Save & View** — Easy access your plans history

---

## 🛠️ Tech Stack

### Frontend:

- **React 19**, **React Router v7**
- **Vite** for development & builds
- **TailwindCSS v4** & **Flowbite-React** for UI components
- **Google Maps API** via @react-google-maps/api
- **Day.js** for date handling
- **React Icons**, **use-debounce**
- **ESLint**, **Vitest**, **Testing Library**

### Backend:

- **Node.js** & **Express 5**
- **MongoDB** with **Mongoose**
- **OpenAI API** & **Anitabi API** integrations
- **Authentication**: Passport with Google OAuth 2.0
- **Session Management**: express-session
- **Environment config**: dotenv
- **Testing**: Jest, Supertest
- **Development tools**: Nodemon, Babel

---

## 🚀 Getting Started

### Prerequisites:

- Node.js & npm
- Google Cloud API key (Maps, Places API)
- OpenAI API key
- Anitabi API key
- MongoDB URI

### Installation:

```bash
git clone https://github.com/your-org/aniway.git

# Frontend setup
cd frontend
npm install

# Backend setup
cd ../backend
npm install
```

### Development:

```bash
# Frontend
cd frontend
npm run dev

# Backend
cd ../backend
npm run dev
```

### Testing:

```bash
# Frontend
cd frontend
npx vitest

# Backend
cd ../backend
npm test
```

### Environment Variables (.env example):

📦 Frontend Environment Variables
Please create a .env file in the /frontend directory.<br />
**Important** <br />
If you downloaded the key from canvas, there is a .env called "frontend.env". Please put that file in the frontend folder and modify its file name as ".env"
<br />
Example: /frontend/.env.example

```bash
# Google Maps API Key for frontend
VITE_GOOGLE_MAPS_API_KEY=your_google_maps_api_key

# Backend API base URL
VITE_BACKEND_API=http://127.0.0.1:5050/
```

🖥️ Backend Environment Variables
Please create a .env file in the /backend directory.
<br/>
**Important** <br />
If you downloaded the key from canvas, there is a .env called "backend.env". Please put that file in the frontend folder and modify its file name as ".env"
<br />
Example: /backend/.env.example

```bash
# Database Configuration
MONGO_URI=mongodb://username:password@host:port/aniway?authSource=admin
PORT=5050

# Google API Configuration
GOOGLE_API_HOST=https://maps.googleapis.com/maps/api
GOOGLE_API_KEY=your_google_api_key
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# OpenAI / Gemini API
OPENAI_API_KEY=your_openai_api_key

# Session Management
SESSION_SECRET=your_session_secret

# Environment
NODE_ENV=development

# Frontend URL
FRONTEND_URL=http://localhost:5173/
```

---

## 🌐 Live Demo (Deployment)

You can access the live version of Aniway here:

👉 [https://aniway.tty0.top/](https://aniway.tty0.top/)

> ✅ This is the deployed frontend application.
> The backend API is also connected and functional.

---

## 🌐 Links

- [Wiki](https://github.com/UOA-CS732-S1-2025/group-project-team-rocket-webmasters/wiki)

---

## 🗺️ Screenshots

### Homepage

![Homepage](./images/homepage.png)

### Itinerary Planner with Interactive Map View

![Itinerary Planner & Map](./images/trip-planner-map-1.png)
![Itinerary Planner & Map](./images/trip-planner-map-2.png)

### Anime Location Detail Page

![Anime Location Detail](./images/anime-location-detail.png)

---

## 🙌 Contributors

### Rocky Shi ([sban351@aucklanduni.ac.nz](mailto:sban351@aucklanduni.ac.nz)) [@sban351](https://github.com/sban351)

**Fullstack Developer & Project Lead**  


---

### Yan Wa Ho ([yho777@aucklanduni.ac.nz](mailto:yho777@aucklanduni.ac.nz)) [@tiff777](https://github.com/tiff777)

**Fullstack Developer & Project Coordinator**  

---

### Zephyr Chen ([bche942@aucklanduni.ac.nz](mailto:bche942@aucklanduni.ac.nz)) [@zephyr942](https://github.com/zephyr942)

**Fullstack Developer (Trip Planner Features)**  

---

### Tun-Yu Hsieh ([thsi160@aucklanduni.ac.nz](mailto:thsi160@aucklanduni.ac.nz)) [@Claire1234Claire](https://github.com/Claire1234Claire)

**Fullstack Developer (Google Features & Authentication)**  

---

### Hong Ying Xie ([hxie943@aucklanduni.ac.nz](mailto:hxie943@aucklanduni.ac.nz)) [@xhy0518](https://github.com/xhy0518)

**Frontend Developer**  

---

### Nicholas Travis ([nkaw981@aucklanduni.ac.nz](mailto:nkaw981@aucklanduni.ac.nz)) [@nkaw981](https://github.com/nkaw981)

**Backend Developer**  


---
