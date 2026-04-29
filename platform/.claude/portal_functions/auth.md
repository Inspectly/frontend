# Authentication System

## Architecture Overview

The auth system uses **Firebase Authentication** as the identity provider and a **custom backend** (`https://inspectlyai.up.railway.app/api/v0/`) to store user profiles, login records, and sessions. State is managed via **Redux** with `redux-persist`.

```
┌─────────────┐     ┌──────────────┐     ┌─────────────────┐
│  Frontend   │────▶│   Firebase   │────▶│  Backend API    │
│  (React)    │     │   Auth       │     │  (Railway)      │
└─────────────┘     └──────────────┘     └─────────────────┘
       │                    │                      │
  Redux Store         ID Token (JWT)         POST /users/
  localStorage        Google OAuth           POST /clients/
  PrivateRoute        Email/Password         POST /vendors/
                      Email Verify           POST /user_logins/
                                             POST /user_sessions/
```

---

## 1. Sign Up (Email/Password)

**File:** `src/pages/signup.tsx`

### Flow

1. **User fills form** — supports 3 user types: `client`, `vendor`, `realtor`
   - Vendors get a multi-step form (3 steps) including service type selection
   - Fields: `firstName`, `lastName`, `email`, `phone`, `address`, `city`, `state`, `country`, `postalCode`, `password`, `confirmPassword`, `acceptedTerms`

2. **Firebase user created** — `createUserWithEmailAndPassword(auth, email, password)`
   - Gets Firebase ID token via `getIdToken(user)`
   - Sends email verification via `sendEmailVerification(firebaseUser)`
   - Stores form data + vendor types in `localStorage`
   - Redirects to `/verify-email`

3. **Email verification** — `src/pages/VerifyEmail.tsx`
   - Polls `auth.currentUser?.emailVerified` every 3 seconds
   - Once verified, creates the backend user

4. **Backend user creation sequence** (4 API calls):

   | Step | Endpoint | Method | Payload |
   |------|----------|--------|---------|
   | Create base user | `/users/` | POST | `{ firebase_id, user_type: { user_type }, email, first_name, last_name }` |
   | Create role-specific profile | `/clients/` or `/vendors/` or `/realtors/` | POST | Profile fields (name, address, phone, etc.) |
   | Create login record | `/user_logins/` | POST | `{ user_id, email_login: true, email, phone_login: false, gmail_login: false, ... }` |
   | Create session | `/user_sessions/` | POST | `{ user_id, login: "email", login_time, authentication_code: <firebase_token> }` |

5. **Finalize** — dispatches Redux `login(user)`, stores token in `localStorage`, redirects to `/dashboard`

---

## 2. Login (Email/Password)

**File:** `src/pages/Login.tsx`

### Flow

1. **User submits** `email`, `password`, `agreeToTerms`
2. **Firebase auth** — `signInWithEmailAndPassword(auth, email, password)` → `getIdToken(user)` → stores in `localStorage("authToken")`
3. **Backend lookup** — `GET /users/firebase/{firebase_id}` to get the backend user
4. **Create login record** — `POST /user_logins/` with `email_login: true` (handles 409 conflict for duplicates)
5. **Create session** — `POST /user_sessions/` with `login: "email"` and the Firebase token as `authentication_code`
6. **Redux dispatch** — `login(backendUser)` → redirect to `/dashboard`

### Password Reset

- Uses `sendPasswordResetEmail(auth, email)` from Firebase
- 60-second resend cooldown
- Generic response message (doesn't reveal if email exists)

---

## 3. Google Sign-Up

**File:** `src/pages/signup.tsx` (lines ~551-694)

### Flow

1. **Validation** — user type selected, terms accepted, vendors must pick service types
2. **Google popup** — `signInWithPopup(auth, new GoogleAuthProvider())`
3. **Check if user exists** — `GET /users/firebase/{firebase_uid}`
   - If **exists** → signs out, shows error: _"An account with this Google email already exists. Please log in instead."_
   - If **404 (new user)** → proceeds with creation
4. **Create backend user** — same 4-step sequence as email signup:
   - `POST /users/` → `POST /clients/` or `/vendors/` or `/realtors/` → `POST /user_logins/` (with `gmail_login: true`) → `POST /user_sessions/` (with `login: "gmail"`)
5. **Redirect** to `/dashboard`

---

## 4. Google Sign-In (Login)

**File:** `src/pages/Login.tsx`

### Flow

1. **Google popup** — `signInWithPopup(auth, new GoogleAuthProvider())`
2. **Backend lookup** — `GET /users/firebase/{firebase_id}`
3. **Create login record** — `POST /user_logins/` with `gmail_login: true, gmail: <email>`
4. **Create session** — `POST /user_sessions/` with `login: "gmail"`
5. **Redux dispatch** → redirect to `/dashboard`

---

## 5. All API Endpoints

**Base URL:** `https://inspectlyai.up.railway.app/api/v0/`

### Users

| Method | Endpoint | Purpose |
|--------|----------|---------|
| `GET` | `/users/firebase/{firebase_id}` | Lookup user by Firebase UID |
| `GET` | `/users/{id}` | Get user by ID |
| `POST` | `/users/` | Create user |

### User Sessions

| Method | Endpoint | Purpose |
|--------|----------|---------|
| `GET` | `/user_sessions/user/{user_id}` | Get session by user ID (used in auth state check) |
| `POST` | `/user_sessions/` | Create session on login |
| `PUT` | `/user_sessions/{id}` | Update session |

### User Logins

| Method | Endpoint | Purpose |
|--------|----------|---------|
| `GET` | `/user_logins/user/{user_id}` | Get login records by user |
| `POST` | `/user_logins/` | Create login record |

### Role-Specific

| Method | Endpoint | Purpose |
|--------|----------|---------|
| `POST` | `/clients/` | Create client profile |
| `POST` | `/vendors/` | Create vendor profile |
| `POST` | `/realtors/` | Create realtor profile |
| `GET` | `/vendor_types/` | Get vendor service type options |

---

## 6. Auth State Management

**File:** `src/features/authSlice.ts`

- **Redux slice** with state: `{ authenticated, user, loading }`
- **`checkAuthState`** async thunk (runs on app load):
  1. Listens to Firebase `onAuthStateChanged`
  2. If user exists → `GET /users/firebase/{uid}` + `GET /user_sessions/user/{user_id}`
  3. Dispatches `login()` or `logout()` accordingly
- **Persisted** to `localStorage` via `redux-persist` (whitelist: `["auth"]`)

---

## 7. Route Protection

**File:** `src/components/PrivateRoute.tsx`

Simple guard — checks `state.auth.authenticated`, redirects to `/login` if false. All dashboard routes are wrapped with this.

---

## 8. Token Handling

- **Token type:** Firebase ID Token (JWT, expires in 1 hour)
- **Stored in:** `localStorage` as `"authToken"`
- **Also stored in:** `user_sessions.authentication_code` in the backend
- **Cleared on logout:** `localStorage.removeItem("authToken")` + Firebase `signOut(auth)` + Redux `dispatch(logout())`

---

## 9. Logout

**File:** `src/App.tsx`

```
signOut(auth) → remove localStorage items → dispatch(logout()) → navigate("/login")
```

---

## 10. Data Types

### User

```typescript
{
  id: number;
  user_type: string;       // "client", "vendor", "realtor", "admin"
  firebase_id: string;
  created_at: string;
  updated_at: string;
}
```

### User Session

```typescript
{
  id: number;
  user_id: number;
  login_method: string;        // "email" or "gmail"
  login_time: string;
  authentication_code: string; // Firebase ID token
  logout_time: string;
}
```

### User Login

```typescript
{
  id: number;
  user_id: number;
  email_login: boolean;
  email: string;
  phone_login: boolean;
  phone: string;
  gmail_login: boolean;
  gmail: string;
  created_at: string;
  updated_at: string;
}
```

### Client

```typescript
{
  id: number;
  user_id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  country: string;
  postal_code: string;
  created_at: string;
  updated_at: string;
}
```

### Vendor

```typescript
{
  id: number;
  vendor_user_id: number;
  vendor_type: Vendor_Type;
  vendor_types: string;       // Comma-separated list
  code: string;               // Unique vendor code (e.g., "JOA123")
  license: string;
  verified: boolean;
  name: string;
  company_name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  country: string;
  postal_code: string;
  profile_image_url: string;
  rating: string;
  review: string;
  created_at: string;
  updated_at: string;
}
```

---

## 11. Key Files

| File | Purpose |
|------|---------|
| `src/pages/Login.tsx` | Login page — email/password login, Google sign-in, password reset |
| `src/pages/signup.tsx` | Sign up page — email registration, Google sign-up, multi-step vendor form |
| `src/pages/VerifyEmail.tsx` | Email verification — polls Firebase, creates backend user, session setup |
| `src/features/authSlice.ts` | Auth state (Redux) — checkAuthState, login, logout actions |
| `src/components/PrivateRoute.tsx` | Route guard — protected route wrapper |
| `src/features/api/usersApi.ts` | Users API — user CRUD operations |
| `src/features/api/userSessionsApi.ts` | Sessions API — session management |
| `src/features/api/userLoginsApi.ts` | Login tracking API — login method history |
| `src/features/api/clientsApi.ts` | Clients API — client profile management |
| `src/features/api/vendorsApi.ts` | Vendors API — vendor profile management |
| `firebase.ts` | Firebase config — Firebase initialization |
| `src/App.tsx` | App router — route definitions, auth state checking |
| `src/store/store.ts` | Redux store — store configuration, persistence |
