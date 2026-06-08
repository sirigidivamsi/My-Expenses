# My Expenses

A beautiful, modern, offline-first personal finance tracking application built with **React Native**, **Expo SDK 56**, and **Supabase**. It helps users track transactions, budgets, credit cards, saving goals, and subscriptions with interactive analytics and automated daily push notifications.

---

## 🛠️ Technologies Used

### Frontend & Core
*   **React Native** & **React 19**: Native mobile runtime and UI framework.
*   **Expo (SDK 56)**: Ecosystem for building, running, and deploying React Native apps.
*   **Expo Router**: File-system based router for native navigation.
*   **TypeScript**: Static typing for clean, maintainable code.

### State & Data Management
*   **Zustand**: Fast and lightweight state management for local-first interactions.
*   **React Query (TanStack Query v5)**: Remote state synchronization and server caching.
*   **AsyncStorage**: Persistent client-side local storage.
*   **Expo SecureStore**: Encrypted local storage for sensitive security credentials.

### Backend & Database
*   **Supabase**: PostgreSQL database, user authentication, and real-time syncing.

### Styling & Animation
*   **Lucide React Native**: Crisp, lightweight vector iconography.
*   **React Native Reanimated**: High-performance fluid animations and transition effects.
*   **Custom Design System**: Harmonic palettes, dark mode aesthetics, and micro-interactions built with vanilla React Native StyleSheets.

### Utility & Helpers
*   **React Hook Form & Zod**: Schema-based form validation and run-time validation.
*   **Expo Notifications**: Scheduled push alerts for daily expense reminders.

---

## 🚀 Getting Started

### Prerequisites
Make sure you have the following installed on your machine:
*   [Node.js](https://nodejs.org/) (v18 or newer recommended)
*   [npm](https://www.npmjs.com/) (bundled with Node.js)
*   [Expo Go app](https://expo.dev/client) installed on your iOS/Android device (or an emulator set up)
*   [Android SDK](https://developer.android.com/studio) / [Xcode](https://developer.apple.com/xcode/) (if you want to build or run native emulators locally)

---

## 📥 Installation

1.  **Clone the repository:**
    ```bash
    git clone <repository-url>
    cd my-expenses
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Set up Environment Variables:**
    Create a file named `.env` in the root of the project and add your Supabase credentials:
    ```env
    EXPO_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
    EXPO_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
    ```

---

## 🏃 Running the Application

Start the Expo bundler:
```bash
npm run start
```
*(or `npx expo start`)*

Once the Metro bundler is running in your terminal, choose how you want to open the app:
*   Press **`a`** to open in an **Android Emulator**.
*   Press **`i`** to open in an **iOS Simulator**.
*   Press **`w`** to run in a **Web Browser**.
*   Scan the **QR code** in your terminal using the **Expo Go** app on your physical iOS or Android device.

---

## 📦 Building the Application Locally

For detailed native Android compilation instructions, see the [Local APK Build Guide](file:///C:/Users/Vamsi/.gemini/antigravity-ide/brain/792a32e4-cb82-43dd-b67c-11d8bcaa7da9/apk_build_guide.md).

### Quick Local APK generation:
1.  **Generate native android directories:**
    ```bash
    npx expo prebuild --platform android
    ```
2.  **Compile the APK:**
    ```bash
    cd android
    # For Windows:
    .\gradlew assembleDebug
    # For macOS/Linux:
    ./gradlew assembleDebug
    ```
3.  **Retrieve your APK:**
    Find the file at `android/app/build/outputs/apk/debug/app-debug.apk`.
