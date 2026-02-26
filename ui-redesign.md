# KasirGo UI Redesign & Onboarding

> **Type:** MOBILE (React Native + Expo)  
> **Primary Agent:** `mobile-developer`  
> **Status:** 🔴 AWAITING APPROVAL

---

## Overview

Complete UI redesign of the KasirGo POS application to transform from a plain, AI-generated look to a sleek, modern POS interface with dark/light mode support. Additionally, add onboarding screens for first-time users.

### Current Pain Points
- Monotonous light gray (`#F3F4F6`) + white cards on all screens
- Generic styling that looks "AI-generated"
- No dark mode support
- No onboarding experience for new users
- Repetitive styling patterns across all 8 screens

### Goals
1. **Premium Modern POS UI** - Sleek, professional appearance
2. **Dark/Light Mode Toggle** - User preference with system support
3. **Onboarding Experience** - 3-4 screen introduction for first-time users
4. **Consistent Design System** - Reusable components and theme tokens

---

## User Review Required

> [!IMPORTANT]
> **Color Palette Choice:** The plan uses an emerald/teal accent color scheme. If you prefer a different primary color (e.g., blue, orange), please specify.

> [!IMPORTANT]
> **Onboarding Content:** Please confirm the 3 onboarding slides:
> 1. Welcome to KasirGo - "Your offline-first POS solution"
> 2. Easy Product Management - Barcode scanner & inventory
> 3. Track Your Sales - Reports & transaction history

---

## Proposed Changes

### Component 1: Design System Foundation

Create a centralized theme system with design tokens, reusable components, and dark/light mode support.

---

#### [NEW] [theme.ts](file:///c:/Users/Administrator/Documents/Android%20Projects/kasirgo/src/theme/theme.ts)

Core theme file with design tokens:
- Color palette (light & dark variants)
- Typography scale
- Spacing tokens
- Border radius tokens
- Shadow definitions

```typescript
// Color scheme preview:
// Light Mode: 
//   - Background: #F8FAFC (subtle gray)
//   - Surface: #FFFFFF
//   - Primary: #10B981 (emerald green - POS feel)
//   - Accent: #0EA5E9 (sky blue for accents)
//   - Text: #0F172A

// Dark Mode:
//   - Background: #0F172A (rich dark navy)
//   - Surface: #1E293B
//   - Primary: #34D399 (lighter emerald)
//   - Accent: #38BDF8 (lighter sky blue)
//   - Text: #F1F5F9
```

---

#### [NEW] [ThemeContext.tsx](file:///c:/Users/Administrator/Documents/Android%20Projects/kasirgo/src/theme/ThemeContext.tsx)

React Context for theme management:
- Dark/Light mode state
- System preference detection
- Persist preference to AsyncStorage
- `useTheme()` custom hook

---

#### [NEW] [useTheme.ts](file:///c:/Users/Administrator/Documents/Android%20Projects/kasirgo/src/hooks/useTheme.ts)

Hook for accessing theme in components.

---

### Component 2: Reusable UI Components

Create shared components with themed styling for consistent look.

---

#### [NEW] [Card.tsx](file:///c:/Users/Administrator/Documents/Android%20Projects/kasirgo/src/components/Card.tsx)

Themed card component with subtle gradients and better shadows.

---

#### [NEW] [Button.tsx](file:///c:/Users/Administrator/Documents/Android%20Projects/kasirgo/src/components/Button.tsx)

Primary, secondary, and destructive button variants with press animations.

---

#### [NEW] [Input.tsx](file:///c:/Users/Administrator/Documents/Android%20Projects/kasirgo/src/components/Input.tsx)

Themed text input with focus states and icons support.

---

#### [NEW] [Header.tsx](file:///c:/Users/Administrator/Documents/Android%20Projects/kasirgo/src/components/Header.tsx)

Custom header with theme toggle button.

---

### Component 3: Onboarding Screens

Add onboarding experience for first-time users.

---

#### [NEW] [OnboardingScreen.tsx](file:///c:/Users/Administrator/Documents/Android%20Projects/kasirgo/src/screens/OnboardingScreen.tsx)

3-slide onboarding with:
- Illustrations (Ionicons based, animated)
- Title & description
- Progress dots
- Skip & Continue buttons
- Persist completion to storage

---

#### [NEW] [onboarding.tsx](file:///c:/Users/Administrator/Documents/Android%20Projects/kasirgo/app/onboarding.tsx)

Expo Router entry for onboarding.

---

#### [MODIFY] [_layout.tsx](file:///c:/Users/Administrator/Documents/Android%20Projects/kasirgo/app/_layout.tsx)

- Add ThemeProvider wrapper
- Add onboarding check on app launch
- Redirect to onboarding if first launch

---

### Component 4: Screen Redesigns

Apply new design system to all 8 screens.

---

#### [MODIFY] [HomeScreen.tsx](file:///c:/Users/Administrator/Documents/Android%20Projects/kasirgo/src/screens/HomeScreen.tsx)

**Changes:**
- Use `useTheme()` for colors
- Redesigned dashboard card with gradient background
- Modern menu buttons with subtle animation
- Add theme toggle in header
- Better visual hierarchy

---

#### [MODIFY] [CashierScreen.tsx](file:///c:/Users/Administrator/Documents/Android%20Projects/kasirgo/src/screens/CashierScreen.tsx)

**Changes:**
- Themed product cards with bottom sheet feel
- Improved cart bar with glassmorphism effect
- Better search input styling
- Grid card improvements

---

#### [MODIFY] [CartScreen.tsx](file:///c:/Users/Administrator/Documents/Android%20Projects/kasirgo/src/screens/CartScreen.tsx)

**Changes:**
- Themed item cards
- Improved footer with better visual weight
- Quick money buttons with better contrast
- Themed pay button

---

#### [MODIFY] [ProductScreen.tsx](file:///c:/Users/Administrator/Documents/Android%20Projects/kasirgo/src/screens/ProductScreen.tsx)

**Changes:**
- Themed form modal
- Better FAB positioning and animation
- Improved selection mode styling
- Scanner overlay with theme colors

---

#### [MODIFY] [HistoryScreen.tsx](file:///c:/Users/Administrator/Documents/Android%20Projects/kasirgo/src/screens/HistoryScreen.tsx)

**Changes:**
- Themed transaction cards with status indicators
- Improved detail modal
- Better date formatting display

---

#### [MODIFY] [ReportScreen.tsx](file:///c:/Users/Administrator/Documents/Android%20Projects/kasirgo/src/screens/ReportScreen.tsx)

**Changes:**
- Themed report cards
- Better export buttons
- Chart area improvements (if any)

---

#### [MODIFY] [ScannerScreen.tsx](file:///c:/Users/Administrator/Documents/Android%20Projects/kasirgo/src/screens/ScannerScreen.tsx)

**Changes:**
- Themed scanner overlay
- Corner indicators with theme accent color

---

#### [MODIFY] [SettingsScreen.tsx](file:///c:/Users/Administrator/Documents/Android%20Projects/kasirgo/src/screens/SettingsScreen.tsx)

**Changes:**
- Add Theme toggle section with switch
- Improved form styling
- About card with app icon/logo
- Better visual separation between sections

---

## Task Breakdown

### Phase 1: Foundation (Design System)
- [ ] Create `src/theme/` directory
- [ ] Implement `theme.ts` with color tokens
- [ ] Implement `ThemeContext.tsx` with provider
- [ ] Implement `useTheme.ts` hook
- [ ] Add AsyncStorage for theme persistence

### Phase 2: Reusable Components
- [ ] Create `src/components/` directory structure
- [ ] Implement `Card.tsx` component
- [ ] Implement `Button.tsx` component
- [ ] Implement `Input.tsx` component
- [ ] Implement `Header.tsx` component

### Phase 3: Onboarding
- [ ] Create `OnboardingScreen.tsx`
- [ ] Create `app/onboarding.tsx` route
- [ ] Modify `_layout.tsx` for onboarding flow
- [ ] Add onboarding completion persistence

### Phase 4: Screen Redesigns
- [ ] Redesign `HomeScreen.tsx`
- [ ] Redesign `CashierScreen.tsx`
- [ ] Redesign `CartScreen.tsx`
- [ ] Redesign `ProductScreen.tsx`
- [ ] Redesign `HistoryScreen.tsx`
- [ ] Redesign `ReportScreen.tsx`
- [ ] Redesign `ScannerScreen.tsx`
- [ ] Redesign `SettingsScreen.tsx` (with theme toggle)

### Phase 5: Polish & Testing
- [ ] Test dark/light mode switching on device
- [ ] Test onboarding flow
- [ ] Test all screens in both modes
- [ ] Verify touch targets (≥44px)
- [ ] Performance check (60fps)

---

## Verification Plan

### Manual Testing (Expo Go)

Since this is a React Native Expo project without automated tests, verification will be done manually:

**Pre-requisites:**
```bash
# Terminal 1 - Start Expo dev server
cd "c:\Users\Administrator\Documents\Android Projects\kasirgo"
npm start
# Scan QR code with Expo Go app on Android device
```

#### Test 1: Onboarding Flow
1. Clear app data or reinstall
2. Open app → Should see onboarding screen
3. Swipe through 3 slides
4. Tap "Mulai" (Start) on last slide
5. Should navigate to Home screen
6. Close and reopen app → Should skip onboarding (go directly to Home)

#### Test 2: Theme Toggle
1. Go to Settings screen
2. Find "Tema Aplikasi" (App Theme) section
3. Toggle Dark Mode switch
4. Verify all screens change to dark colors:
   - Background should be dark navy (#0F172A)
   - Cards should be dark gray (#1E293B)
   - Text should be light (#F1F5F9)
5. Toggle back to Light Mode
6. Verify original light colors restored
7. Close and reopen app → Theme preference should persist

#### Test 3: Screen Visual Check (Dark Mode)
For each screen, verify:
- [ ] **HomeScreen**: Dashboard card gradient visible, menu buttons styled correctly
- [ ] **CashierScreen**: Product grid cards, cart bar visible
- [ ] **CartScreen**: Item cards, footer styling
- [ ] **ProductScreen**: FAB button, modal form, scanner overlay
- [ ] **HistoryScreen**: Transaction cards, detail modal
- [ ] **ReportScreen**: Report cards, export buttons
- [ ] **ScannerScreen**: Camera overlay corners
- [ ] **SettingsScreen**: Theme toggle, about card

#### Test 4: Functional Regression
Ensure core functionality still works after redesign:
1. Add a product → Save → Product appears in list
2. Cashier → Add to cart → Checkout → Transaction saved
3. History → View transaction detail
4. Report → Check today's sales data
5. Scanner → Scan barcode → Product found/added

---

## File Structure After Changes

```
src/
├── components/           # [NEW] Shared components
│   ├── Button.tsx
│   ├── Card.tsx
│   ├── Header.tsx
│   └── Input.tsx
├── hooks/                # [NEW] Custom hooks
│   └── useTheme.ts
├── theme/                # [NEW] Theme system
│   ├── theme.ts
│   └── ThemeContext.tsx
├── screens/              # [MODIFY] All screens updated
│   ├── OnboardingScreen.tsx  # [NEW]
│   ├── HomeScreen.tsx
│   ├── CashierScreen.tsx
│   ├── CartScreen.tsx
│   ├── ProductScreen.tsx
│   ├── HistoryScreen.tsx
│   ├── ReportScreen.tsx
│   ├── ScannerScreen.tsx
│   └── SettingsScreen.tsx
├── database/
├── store/
└── utils/

app/
├── _layout.tsx           # [MODIFY] Add ThemeProvider + onboarding check
├── onboarding.tsx        # [NEW] Onboarding route
├── index.tsx
├── cashier.tsx
├── cart.tsx
├── products.tsx
├── history.tsx
├── report.tsx
├── scanner.tsx
└── settings.tsx
```

---

## Dependencies

No new dependencies required. Using existing:
- `@expo/vector-icons` (Ionicons)
- `zustand` (if needed for theme store)
- `expo-router`
- AsyncStorage (built into Expo)

---

## Risk Assessment

| Risk | Mitigation |
|------|------------|
| Dark mode contrast issues | Will follow WCAG AA contrast guidelines |
| Performance with theme context | Memoize theme values, minimal re-renders |
| Breaking existing functionality | Functional regression testing |
| Onboarding blocking main app | Clear skip/continue buttons, persistent state |

---

## Phase X: Final Verification Checklist

- [ ] Onboarding shows on first launch
- [ ] Dark mode toggle works and persists
- [ ] All 8 screens themed correctly (light mode)
- [ ] All 8 screens themed correctly (dark mode)
- [ ] No functional regressions (products, transactions, reports)
- [ ] Touch targets ≥ 44px
- [ ] No console errors/warnings
- [ ] Smooth 60fps scrolling in lists
