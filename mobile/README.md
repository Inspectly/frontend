# Inspectly Mobile

Monorepo for the Inspectly mobile apps (Homeowner + Vendor), built with Expo + React Native.

## Structure

```
mobile/
├── apps/
│   ├── homeowner/     # Inspectly (homeowner-facing app)
│   └── vendor/        # Inspectly Pro (vendor-facing app)
├── packages/
│   └── shared/        # @inspectly/shared — types, API slices, auth, utils
├── turbo.json
└── package.json
```

## Getting Started

```bash
# Install dependencies
npm install

# Start the homeowner app
npm run dev:homeowner

# Start the vendor app
npm run dev:vendor
```

## Shared Package

The `@inspectly/shared` package contains all code shared between both mobile apps and (optionally) the web app:

- **types/** — TypeScript interfaces and enums (User, Listing, Issue, Offer, Assessment, etc.)
- **api/** — RTK Query slices (~85 endpoints across 19 domain files)
- **store/** — Redux store configuration and auth slice
- **utils/** — Utility functions (bidStatus, dateUtils, typeNormalizer)
- **firebase/** — Firebase configuration and auth helpers

## Tech Stack

| Layer | Choice |
|-------|--------|
| Framework | Expo SDK 52 (managed workflow) |
| Navigation | React Navigation 7 |
| State | Redux Toolkit + RTK Query |
| Auth | @react-native-firebase/auth |
| Styling | NativeWind (Tailwind for RN) |
| Push | Expo Notifications + FCM |
| Storage | AsyncStorage + redux-persist |
| Payments | Stripe React Native SDK (homeowner only) |
