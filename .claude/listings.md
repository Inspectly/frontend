# Listings System

## Architecture Overview

Listings represent **properties** in Inspectly. They are the top-level entity that groups reports, issues, and vendor work. A listing is owned by a user (typically a client) and contains an address. State is managed entirely through **RTK Query** (no dedicated Redux slice) with tag-based cache invalidation.

```
┌─────────────┐     ┌──────────────────────┐     ┌──────────────────┐
│  Frontend    │────▶│  Backend API          │────▶│  Database        │
│  (React)     │     │  (Railway)            │     │                  │
└─────────────┘     └──────────────────────┘     └──────────────────┘
       │                      │
  RTK Query Cache       POST /listings/
  Tag: "Listings"       GET  /listings/
  1hr retention         GET  /listings/{id}
                        GET  /listings/user/{userId}
```

---

## 1. Entity Relationships

```
User (id)
  └── has many Listings (user_id)
        └── has many Reports (listing_id)
              └── has many Issues (report_id, listing_id)
                    ├── has many IssueOffers (issue_id)
                    ├── has many IssueAssessments
                    └── has many Comments
```

Listings serve as the **anchor point** for all property-related data. Reports belong to listings, issues belong to reports (and reference the listing), and vendors interact with issues through offers and assessments.

---

## 2. Data Type

**File:** `src/types/index.tsx` (lines 131–142)

```typescript
export interface Listing {
  id: number;
  user_id: number;
  address: string;
  city: string;
  state: string;
  country: string;
  postal_code: string;
  image_url: string;
  created_at: string;
  updated_at: string;
}
```

---

## 3. All API Endpoints

**Base URL:** `${VITE_BE_BASE_URL}/api/`

**API File:** `src/features/api/listingsApi.ts`

| Method | Endpoint | Purpose | RTK Query Hook |
|--------|----------|---------|----------------|
| `GET` | `/listings/` | Fetch all listings | `useGetListingsQuery()` |
| `GET` | `/listings/{id}` | Fetch listing by ID | `useGetListingByIdQuery(id)` |
| `GET` | `/listings/user/{userId}` | Fetch listings by user ID | `useGetListingByUserIdQuery(userId)` |
| `POST` | `/listings/` | Create a new listing | `useCreateListingMutation()` |

### Cache Strategy

- **Tag:** `"Listings"`
- All GET queries provide the `"Listings"` tag
- `createListing` mutation invalidates the `"Listings"` tag (triggers refetch)
- `keepUnusedDataFor: 3600` (1-hour cache retention, from `apiSlice.ts`)

### No Update or Delete

There are currently **no PUT/PATCH/DELETE** endpoints for listings. Once created, listings are immutable from the frontend.

---

## 4. Creating a Listing

There are **two ways** to create a listing:

### Method 1: Create Listing Only

**Component:** `src/components/AddListingOnlyModal.tsx`

**Form Fields:**

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `address` | string | Yes | e.g., "123 Main St" |
| `city` | string | Yes | |
| `state` | string | Yes | Dropdown from `COUNTRY_STATES` constant |
| `country` | string | Yes | Defaults to "Canada" |
| `postal_code` | string | Yes | Auto-formatted for Canada (A1A 1A1) |

**Validation:**
- Canadian postal code regex: `/^[A-Za-z]\d[A-Za-z][ -]?\d[A-Za-z]\d$/`
- All fields required

**Flow:**

1. User clicks **"Add New Listing"** on `/listings` page
2. `AddListingOnlyModal` opens
3. User fills form, submits
4. `POST /listings/` with payload:
   ```json
   {
     "address": "123 Main St",
     "city": "Toronto",
     "state": "ON",
     "country": "Canada",
     "postal_code": "M1A 1A1",
     "user_id": 42
   }
   ```
5. On success → navigates to `/listings/{newListingId}` with state `{ openCreateCollection: true }`
6. Reports page reads that state and auto-opens the `CreateIssueCollectionModal`

### Method 2: Create Listing with Report Upload

**Component:** `src/components/AddListingByReportModal.tsx`
**Handler:** `src/utils/reportUtil.ts` → `handleAddListingWithReport()`

**Additional Field:**

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `report_file` | File | No | PDF property inspection report |

**Flow:**

1. User clicks **"Add New Listing"** and selects the "with report" option
2. `AddListingByReportModal` opens
3. User fills address fields + attaches a PDF report
4. **Step 1:** `POST /listings/` — creates the listing (same payload as Method 1)
5. **Step 2:** If report file provided, `POST /reports/extract/issues` with `FormData`:
   ```
   FormData {
     user_id: string        // user ID as string
     listing_id: string     // new listing ID as string
     name: string           // report file name
     property_report: File  // the PDF file
   }
   ```
6. Backend AI extracts issues from the uploaded report automatically
7. Toast notification on success/failure
8. Refetches reports and closes modal

---

## 5. Viewing Listings

### Listings Page

**File:** `src/pages/Listings.tsx`

**Route:** `/listings`

- Fetches listings for the current user via `useGetListingByUserIdQuery(user?.id)`
- **Search:** Filters by address (case-insensitive)
- **Pagination:** 3 rows per page (12, 18, or 24 items depending on screen width)
- **Grid Layout:** Responsive — 1 col (sm) → 2 cols (md) → 3 cols (2xl) → 4 cols (full)

**Listing Card Display:**
- Property image (fallback: `/images/property_card_holder.jpg`)
- Address overlay at bottom of card
- Hover scale animation
- Click → navigates to `/listings/{listing.id}`

### Listing Detail (Reports View)

**Route:** `/listings/:listingId`
**Component:** `src/pages/Reports.tsx`

When a user clicks a listing card, they see all **reports** associated with that listing. From there they can drill into individual reports and issues.

---

## 6. Routing Structure

**Defined in:** `src/App.tsx` (lines 285–319)

All routes are wrapped in `<PrivateRoute>` (auth required).

| Route | Component | Purpose |
|-------|-----------|---------|
| `/listings` | `<Listings />` | Browse user's listings |
| `/listings/:listingId` | `<Reports />` | Reports for a specific listing |
| `/listings/:listingId/reports/:reportId` | `<Report />` | Specific report — shows issues |
| `/listings/:listingId/reports/:reportId/issues/:issueId` | `<Issue />` | Specific issue details |
| `/listings/:listingId/reports/:reportId/review` | `<ReportReviewPage />` | Review report before publishing |

**Navigation Flow:**
```
/listings
  → click card → /listings/{listingId}              (Reports page)
    → click report → /listings/{listingId}/reports/{reportId}   (Report page with issues)
      → click issue → /listings/{...}/issues/{issueId}          (Issue detail)
      → click review → /listings/{...}/review                   (Report review)
```

---

## 7. How Other Features Use Listings

### Client Dashboard

**File:** `src/pages/ClientDashboard.tsx`

- Queries listings via `useGetListingByUserIdQuery(user?.id)`
- Uses listings to look up property addresses for issues and reports displayed on the dashboard
- Can create listings with reports directly from dashboard

### Vendor Dashboard

**File:** `src/pages/VendorDashboard.tsx`

- Fetches **all** listings via `useGetListingsQuery()`
- Builds a `listingsMap[listing.id]` for fast lookup
- Maps issues → listings to show property addresses on vendor job cards
- Vendors don't create listings — they interact with them through issue offers

### Marketplace

**File:** `src/pages/Marketplace.tsx`

- Fetches all listings to extract available **cities/states** for location-based filtering
- Vendors filter job opportunities by city using listing address data

### Landing Page

**File:** `src/components/landing/LandingListings.tsx`

- Uses **mock data** (not real API calls) to showcase listings on the public landing page

---

## 8. Complete Data Flow: Listing → Issue → Vendor Bid

```
1. Client creates listing
   POST /listings/ → { id: 1, address: "123 Main St", ... }

2. Client uploads report (or creates issues manually)
   POST /reports/extract/issues → AI extracts issues from PDF
   — OR —
   POST /issues/ → manual issue creation

3. Issues appear under the listing's reports
   GET /listings/{listingId} → view reports
   GET /reports/listing/{listingId} → list reports
   GET /issues/report/{reportId} → list issues

4. Vendors see issues in marketplace
   GET /listings/ → all listings (for address lookup)
   GET /issues/ → all available issues

5. Vendor bids on an issue
   POST /issue_offers/ → { issue_id, vendor_id, amount, ... }

6. Client reviews vendor offer on the issue detail page
   /listings/{listingId}/reports/{reportId}/issues/{issueId}
```

---

## 9. Key Files

| File | Purpose |
|------|---------|
| `src/features/api/listingsApi.ts` | API endpoint definitions (RTK Query) |
| `src/features/api/apiSlice.ts` | RTK Query base config (base URL, cache settings) |
| `src/types/index.tsx` | Listing interface (lines 131–142) |
| `src/pages/Listings.tsx` | Main listings browse page |
| `src/pages/Reports.tsx` | Reports view for a specific listing |
| `src/pages/Report.tsx` | Single report with issues |
| `src/pages/Issue.tsx` | Single issue detail |
| `src/pages/ReportReviewPage.tsx` | Report review before publishing |
| `src/components/AddListingOnlyModal.tsx` | Modal — create listing (no report) |
| `src/components/AddListingByReportModal.tsx` | Modal — create listing with report upload |
| `src/utils/reportUtil.ts` | Helper for creating listing + uploading report |
| `src/pages/ClientDashboard.tsx` | Client dashboard (uses listings for address lookup) |
| `src/pages/VendorDashboard.tsx` | Vendor dashboard (maps listings to jobs) |
| `src/pages/Marketplace.tsx` | Marketplace (uses listings for location filtering) |
| `src/components/landing/LandingListings.tsx` | Landing page listing showcase (mock data) |
| `src/App.tsx` | Route definitions (lines 285–319) |

---

## 10. Current Limitations

1. **No Update Endpoint** — Cannot edit listing details (address, city, etc.) after creation
2. **No Delete Endpoint** — Cannot delete listings
3. **No Image Upload** — `image_url` field exists in the type but is not populated during creation
4. **Country locked to Canada** — State dropdown and postal code validation assume Canadian addresses
5. **No Listing Grouping** — Cannot group listings into projects or portfolios
