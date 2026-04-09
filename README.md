<div align="center">
  
# 🌱 Agro-Soil AI Innovation 🚀

**An Intelligent, Modern, Dual-Role Agricultural Platform for the Farmers of Bharat**

[![Python FastAPI](https://img.shields.io/badge/Backend-FastAPI-009688?style=for-the-badge&logo=fastapi)](https://fastapi.tiangolo.com/)
[![React Vite](https://img.shields.io/badge/Frontend-React%20Vite-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Styling-Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![MySQL DB](https://img.shields.io/badge/Database-MySQL-4479A1?style=for-the-badge&logo=mysql&logoColor=white)](https://www.mysql.com/)

</div>

<br />

## 📖 Overview

Agro-Soil AI is a full-stack, AI-driven platform designed to modernize agriculture and empower Indian farmers. It bridges the gap between agricultural technology and market access by offering Machine Learning-powered **Crop Recommendations**, Computer Vision-based **Disease Detection**, and a seamless integrated **Peer-to-Peer Marketplace** all wrapped in a beautifully animated, dark-mode glassmorphism UI.

---

## ✨ Core Features

* 🧑‍🌾 **Dual-Role Authenticaton**: Dedicated flows tailored for **Farmers** (analytical data, selling) and **Buyers** (browsing, purchasing).
* 🌾 **AI Crop Recommendation**: Input specific soil metrics (N, P, K, pH) and the ML model suggests the most optimal crops to maximize yield.
* 🌿 **Leaf Disease Detection**: Instantly diagnose plant health by uploading a leaf image. Receive species detection, sickness severity, and active treatments.
* 📈 **Live Mandi Prices**: Pulls realtime, localized wholesale agricultural commodity prices directly from the Indian Government's Open Data API (`data.gov.in`).
* 🛒 **P2P Marketplace**: Farmers can list directly from their dashboard. Buyers can browse, filter, and simulate secure purchases using the **Razorpay Payment Gateway**.
* 🚚 **Interactive Order Tracking & Analytics**: Farmers view monthly earnings securely charted with Recharts. Buyers can visually track dummy delivery statuses across an animated timeline.

---

## 🛠️ Tech Stack

#### **Frontend Layers**
- **Framework**: React.js 18 + Vite
- **Styling**: Tailwind CSS (Fully customized Dark-Mode UI + Glassmorphism)
- **Animations**: GSAP (ScrollTriggers) & Framer-Motion (Micro-interactions)
- **Data Visualization**: Recharts (for Dashboard earnings)

#### **Backend & ML Layers**
- **Server**: FastAPI (Python) running on Uvicorn
- **Database**: MySQL integrated with SQLAlchemy ORM
- **Machine Learning**: Custom algorithms & Scikit-learn (Random Forests) for crop analysis. Computer Vision integration for image parsing.

#### **External APIs**
- **Razorpay API**: Secure payment simulation.
- **Data.gov.in API**: Live Indian Mandi pricing.
- **OpenWeatherMap API**: Localized dashboard weather telemetry.

---

## 🏗️ System Architecture

```mermaid
graph TD;
    subgraph Frontend Client
        A[React / Vite UI] -->|REST API Calls| B[FastAPI Backend];
        A -->|Checkout Initialization| C{Razorpay Gateway};
    end

    subgraph Backend Server
        B -->|Read/Write User & Crop Data| D[(MySQL Database)];
        B -->|Send Leaf Image| E[ML Inference Engine];
        B -->|Fetch Soil Telemetry| E;
        B -->|Fetch Local Weather| F[OpenWeather API];
        B -->|Fetch Mandi Prices| G[Data.gov.in API];
        C -.->|Webhook Verification| B;
    end
    
    classDef client fill:#1D9E75,stroke:#fff,stroke-width:2px,color:#fff;
    classDef server fill:#113927,stroke:#3ace93,stroke-width:2px,color:#fff;
    classDef db fill:#3b82f6,stroke:#fff,stroke-width:2px,color:#fff;
    
    class A,C client;
    class B,E server;
    class D db;
```

---

## 🧭 Workflow Journey

```mermaid
sequenceDiagram
    actor Farmer
    participant Dashboard
    participant ML_Engine 
    participant Marketplace
    actor Buyer

    Farmer->>Dashboard: Logs in & views Local Weather / Mandi Prices
    Farmer->>ML_Engine: Submits NPK/pH soil values
    ML_Engine-->>Farmer: Recommends growing "Wheat"
    Farmer->>Marketplace: Lists Wheat for Sale (Qty, Price, Image)
    Buyer->>Marketplace: Browses listings & Clicks "Buy Wheat"
    Buyer->>Marketplace: Initiates Checkout via Razorpay
    Marketplace-->>Farmer: Payment Confirmed Notification 
    Buyer->>Dashboard: Tracks Order Delivery Status Flow
```

---

## 🚀 Getting Started

Follow these steps to set up the project locally for development.

### 1. Database Setup
1. Ensure you have **XAMPP** (or a local MySQL server) installed.
2. Start the **MySQL** module.
3. Open PhpMyAdmin or your SQL CLI and create an empty database named `agrosoilai`.

### 2. Backend Configuration
1. Open a terminal and navigate to the backend folder:
   ```bash
   cd backend
   ```
2. Create and activate a Virtual Environment (optional but recommended):
   ```bash
   python -m venv venv
   .\venv\Scripts\activate
   ```
3. Install Python dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Create a `.env` file in the `backend/` directory with the following variables:
   ```env
   DATABASE_URL=mysql+pymysql://root:@localhost:3306/agrosoilai
   SECRET_KEY=generate_a_random_32_character_string_here
   ALGORITHM=HS256
   ACCESS_TOKEN_EXPIRE_MINUTES=60
   REFRESH_TOKEN_EXPIRE_DAYS=7
   
   # API Keys
   OPENWEATHERMAP_API_KEY=your_openweathermap_key_here
   RAZORPAY_KEY_ID=rzp_test_yourkey
   RAZORPAY_KEY_SECRET=your_razorpay_secret
   DATA_GOV_API_KEY=your_gov_api_key
   ```
5. Start the FastAPI server (it will automatically seed the database):
   ```bash
   uvicorn main:app --reload --port 8000
   ```

### 3. Frontend Configuration
1. Open a **new** terminal and navigate to the frontend folder:
   ```bash
   cd frontend
   ```
2. Install standard Node dependencies:
   ```bash
   npm install
   ```
3. Ensure you have a `.env` file in the frontend root linking to the backend:
   ```env
   VITE_API_BASE_URL=http://127.0.0.1:8000/api
   ```
4. Start the Vite development server:
   ```bash
   npm run dev
   ```
5. Open your browser to `http://localhost:5173` to view the application!

---

> _"Empowering the hands that feed the world, one dataset at a time."_ 🚜🌾
