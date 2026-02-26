# KasirGo POS 🚀 

**KasirGo** is a modern, offline-first Point of Sale (POS) solution built with React Native and Expo. Designed for speed, reliability, and a premium user experience, it allows small to medium businesses to manage inventory, track sales, and process transactions entirely on-device.

---

## ✨ Key Features

- 💎 **Premium Modern UI**: Sleek, professional interface with glassmorphism effects and emerald/teal accents.
- 🌓 **Dark/Light Mode**: Full support for system-wide or manual theme toggling with persistence.
- 📱 **Onboarding Flow**: Guided 3-slide introduction for first-time users.
- 🛒 **Smart Cashier**:
    - Fast product selection with category filtering.
    - Integrated barcode scanner for quick item entry.
    - Dynamic cart management with change calculation.
- 📦 **Inventory Management**:
    - Full CRUD for products and categories.
    - Track stock levels, SKUs, and barcodes.
    - Supports cost price tracking for profit analysis.
- 📊 **Insightful Reports**:
    - Today's sales summary and transaction history.
    - Detailed breakdowns including taxes (PPN) and discounts.
- 💾 **Offline-First Storage**: Powered by SQLite for high performance without needing an internet connection.

---

## 🛠️ Technology Stack

- **Framework**: [Expo](https://expo.dev/) (React Native)
- **State Management**: [Zustand](https://github.com/pmndrs/zustand)
- **Database**: [SQLite](https://docs.expo.dev/versions/latest/sdk/sqlite/) (via `expo-sqlite`)
- **Routing**: [Expo Router](https://docs.expo.dev/router/introduction/) (File-based)
- **Styling**: Custom Design System (Themed)
- **Icons**: Ionicons (@expo/vector-icons)

---

## 🏗️ Project Structure

The project follows a modular architecture for better maintainability:

```bash
src/
├── components/     # Reusable UI components (Button, Card, Input, Header)
├── database/       # SQLite schema and initialization (db.ts)
├── hooks/          # Custom Reat hooks (useTheme, useCart)
├── screens/        # Screen implementations (Cashier, Product, History, etc.)
├── store/          # Zustand store for state management
├── theme/          # Design tokens and ThemeContext
└── utils/          # Helper functions and formatting utilities

app/                # Expo Router file-based pages
```

---

## 🚀 Getting Started

### Prerequisites

- Node.js (Latest LTS)
- npm or yarn
- Expo Go app on your mobile device (to test)

### Installation

1.  **Clone the repository**:
    ```bash
    git clone git@github.com:urmommine/KasirGo.git
    cd kasirgo
    ```

2.  **Install dependencies**:
    ```bash
    npm install
    ```

3.  **Start the development server**:
    ```bash
    npx expo start
    ```

4.  **Open the app**:
    Scan the QR code displayed in the terminal with your **Expo Go** app (Android) or **Camera app** (iOS).

---

## 💾 Database Schema

KasirGo uses a robust SQLite schema with automated migrations. Key tables include:
- `products`: Items with SKU, barcode, price, and stock info.
- `categories`: Product groupings.
- `transactions`: Core sales data.
- `transaction_items`: Line items for each sale.
- `settings`: Store profile and tax configurations.

---

## 📝 License

This project is private and intended for internal use.

---

*Built with ❤️ by the KasirGo Team.*
