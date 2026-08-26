# CarHub - Certified Cars Buying, Selling & Renting Platform

**CarHub** is an end-to-end full-stack web application designed for buying, selling, and renting pre-owned cars. Built with React (Vite), Node.js, Express, and MongoDB, CarHub operates on a trusted business model where sellers post vehicles, CarHub Admin inspects and purchases the cars using company funds, and then publishes them to the Buyer marketplace, Rental fleet, or both.

---

## 🌟 Business & Platform Workflow

```
[Seller Posts Vehicle] ➔ (Hidden from Public) ➔ [Admin Inspects & Buys Car] ➔ [Admin Publishes to Buyer/Rental] ➔ [Buyer/Renter Enquires & Chats Admin]
```

1. **No Direct Buyer-Seller Link**: Sellers and Buyers do NOT communicate directly. All transactions flow through CarHub Admin.
2. **No Direct Payment Gateway**: Traditional "Buy Now" is replaced with **"Enquire & Chat Admin"**, opening a live WhatsApp-style chat interface with built-in simulated Voice & Video Call capabilities.
3. **Admin Direct Buyout**: Sellers receive instant payment from CarHub upon doorstep physical inspection.

---

## 🚀 Complete Feature Breakdown

### 1. Homepage & General Navigation
- **Hero Image Carousel**: High-impact sliding banner highlighting 140+ point inspection, 7-day money-back guarantee, and certified rental fleet.
- **3 Role Feature Cards**:
  - *Buy a Car*: "Browse certified used cars from our verified inventory."
  - *Sell Your Car*: "Get your car inspected and receive a fair offer."
  - *Rent a Car*: "Choose from our fleet of inspected rental cars."
  - Each card has a **"Get Started"** button opening the unified Auth modal preset to that role.
- **Universal Back Button**: Present in top navigation across every view.
- **Dark / Light Mode**: Instant theme switching powered by CSS custom properties and React context.
- **Live Notification Bell**: Toast alerts for wishlist price drops, booking updates, and chat messages.

### 2. Unified Authentication & Access Control
- **Single Auth Form**: Unified login & signup modal featuring role selection tabs (`Buyer`, `Seller`, `Renter`, `Admin`).
- **Role Sentences**: Under each tab, a dedicated descriptive sentence explains buying, selling, renting, and admin rules.
- **Admin Security Key**: Admin role requires authorization passcode `admin123`.

### 3. Seller Portal (`Seller`)
- **Seller Dashboard**: Overview of submitted cars, inspection status tracking, and estimated buyout values.
- **Post Vehicle Form**: Submit Brand, Model, Year, Expected Price, KM Driven, Fuel, Transmission, Color, License Plate, VIN, and Image URL.
- **Privacy Assurance**: Seller submissions are invisible to buyers/renters until CarHub inspects and purchases the car.

### 4. Admin Command Center (`Admin`)
- **Pending Inspections Queue**: List of cars awaiting Admin verification.
- **AI Inspection Suite**:
  - *AI Damage Detection*: Canvas bounding box scanning for scratches/dents.
  - *Blur Detection*: Image quality & clarity test.
  - *License Plate OCR*: Registration number extraction.
  - *Color Detection*: Color shade verification.
- **Buyout & Publishing Engine**: Enter purchase price paid to seller, edit selling/rental prices, and choose destination (`Buyer Marketplace`, `Rental Fleet`, or `Both`).
- **User Management & Analytics Reports**: Track total capital invested, inventory valuation, and user accounts.

### 5. Buyer Portal (`Buyer`)
- **5+ Multi-Parameter Filters**:
  1. Nearby Distance (10km, 20km, 50km, 100km)
  2. Price Range Slider
  3. Brand / Manufacturer
  4. Vehicle Color
  5. Manufacturing Year & Fuel Type
- **360° AR/VR Virtual Viewer**: Drag/rotate car wireframe in 3D perspective using HTML5 Canvas.
- **QR Code Generator**: Generates downloadable QR code card for every vehicle.
- **Price Trend Visualizer**: Graph comparing current CarHub price vs historical regional average.
- **Loan EMI Calculator**: Enter Down Payment, Interest Rate, Loan Tenure (1-7 years) to calculate Monthly EMI, Total Interest, and Total Payable.
- **Compare Cars Tool**: Select 2 to 3 cars to compare specs side-by-side.
- **Wishlist & Price Drop Alerts**: Save favorite cars with automatic notification when Admin reduces price.

### 6. Renter Portal (`Renter`)
- **Rental Fleet Catalog**: View inspected self-drive cars available for daily/weekly rent.
- **Rental Rate Filters**: Filter by daily rate, brand, color, fuel type.
- **Booking Manager**: Date picker (Start & End dates) with real-time total cost calculation and booking submission.

### 7. AI & Interactive Features
- **CarHub AI Floating Chatbot**: Responds intelligently to queries like *"I need an SUV below ₹10 Lakhs"*, returning matching cars (Creta, Sonet, Innova), EMI details, and rental rules.
- **WhatsApp-Style Admin Chat & Call Center**: Direct messaging with CarHub Admin + simulated **Audio Call** and **Video Call** modal screens with live call timer, mute, and video toggle.

---

## 💻 HP Laptop & VS Code Setup Guide

Your HP Laptop (Windows 10/11) is fully supported! The codebase requires standard Node.js and includes a built-in **in-memory fallback state engine**, so it works **100% out of the box in VS Code** even before installing MongoDB!

### Step 1: Install Software Prerequisites
1. **Node.js**:
   - Download Node.js (LTS version) from [https://nodejs.org/](https://nodejs.org/)
   - Run the `.msi` installer and click **Next** through all default options.
   - Verify installation in Windows Command Prompt:
     ```cmd
     node -v
     npm -v
     ```
2. **VS Code (Visual Studio Code)**:
   - Download from [https://code.visualstudio.com/](https://code.visualstudio.com/) and install.

3. **Recommended VS Code Extensions**:
   - Open VS Code, press `Ctrl + Shift + X` (Extensions tab), and install:
     - **ES7+ React/Redux/React-Native snippets** (by dsznajder)
     - **Prettier - Code formatter** (by Prettier)
     - **Auto Rename Tag** (by Jun Han)
     - **Path Intellisense** (by Christian Kohler)

---

## 🛠️ Launch Instructions (How to Run in VS Code)

### 1. Open Project in VS Code
1. Launch VS Code.
2. Click **File ➔ Open Folder** and select `C:\Users\subas\.gemini\antigravity\scratch\carhub-app`.

### 2. Start Backend Server
1. Open a terminal in VS Code (`Ctrl + ~` or `Terminal ➔ New Terminal`).
2. Run the following commands:
   ```bash
   cd backend
   npm install
   npm start
   ```
   *You will see:* `🚀 CarHub Backend Server running on http://localhost:5001`

### 3. Start Frontend App
1. Open a second terminal split in VS Code (`+` icon in terminal window).
2. Run the following commands:
   ```bash
   cd frontend
   npm install
   npm run dev
   ```
3. Open your browser and navigate to: **`http://localhost:3000`**

---

## 🔑 Demo Account Credentials

| Role | Email | Password | Special Key |
| :--- | :--- | :--- | :--- |
| **Admin** | `admin@carhub.com` | `password123` | `admin123` |
| **Buyer** | `buyer@gmail.com` | `password123` | N/A |
| **Seller** | `seller@gmail.com` | `password123` | N/A |
| **Renter** | `renter@gmail.com` | `password123` | N/A |
