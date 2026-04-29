# Issues System

## Architecture Overview

Issues are property inspection problems (electrical, plumbing, roofing, etc.) that belong to a **Report** within a **Listing**. They are the core entity of the platform — clients create them, vendors bid on them through the **Marketplace**, and the work lifecycle is tracked through offers, assessments, payments, and disputes. Issues can be created manually or extracted by AI from uploaded PDF reports.

```
┌──────────────┐     ┌──────────────────┐     ┌───────────────┐     ┌──────────────┐
│   Client      │────▶│   Issues API     │────▶│  Marketplace   │────▶│   Vendor     │
│   Dashboard   │     │   /issues/       │     │  (browse/bid)  │     │  Dashboard   │
└──────────────┘     └──────────────────┘     └───────────────┘     └──────────────┘
       │                      │                       │                      │
  Create Issues          CRUD + Filter           View Open Issues       Submit Offers
  Review Offers          Image Upload            Filter by Type/City    Schedule Assessments
  Accept/Reject          Status Tracking         Group by Address       Mark Complete
  Pay via Stripe         Address Lookup                                 Handle Disputes
```

---

## 1. Entity Relationships

```
Listing (id)
  └── has many Reports (listing_id)
        └── has many Issues (report_id, listing_id)
              ├── has many IssueOffers (issue_id)
              │     └── has many IssueDisputes (issue_offer_id)
              │           ├── has many IssueDisputeMessages (issue_dispute_id)
              │           └── has many IssueDisputeAttachments (issue_dispute_id)
              ├── has many IssueAssessments (issue_id)
              ├── has many Comments (issue_id)
              ├── has many Attachments (issue_id)
              └── has one IssueAddress (issue_id)
```

---

## 2. Data Types

### IssueType

**File:** `src/types/index.tsx` (lines 207–223)

```typescript
IssueType {
  id: number;
  report_id: number;
  listing_id: number;
  type: string;                // "electrical", "plumbing", "roofing", etc.
  summary: string;
  description: string;
  severity: string;            // "low", "medium", "high"
  status: IssueStatus;         // "Status.OPEN", "Status.IN_PROGRESS", "Status.REVIEW", "Status.COMPLETED"
  vendor_id: number | null;    // NULL until vendor accepts offer
  image_urls: string[];        // Multiple images (array, JSON string, or CSV from backend)
  cost: string;                // Estimated repair cost (informational)
  active: boolean;             // Controls marketplace visibility
  created_at: string;
  updated_at: string;
  review_status: string;       // "not_reviewed", "in_review", "completed"
}
```

### IssueAddress

```typescript
IssueAddress {
  issue_id: number;
  address: string;
  city: string;
  state: string;
  country: string;
  postal_code: string;
}
```

### IssueOffer (Vendor Bid)

**File:** `src/types/index.tsx` (lines 225–235)

```typescript
IssueOffer {
  id: number;
  issue_id: number;
  vendor_id: number;
  price: number;               // Vendor's bid amount (actual transaction amount)
  status: IssueOfferStatus;    // "Bid_Status.RECEIVED" | "Bid_Status.ACCEPTED" | "Bid_Status.REJECTED"
  comment_vendor: string;
  comment_client: string;
  created_at: string;
  updated_at: string;
}
```

### IssueAssessment (Scheduling)

**File:** `src/types/index.tsx` (lines 271–284)

```typescript
IssueAssessment {
  id: string;
  issue_id: number;
  user_id: number;
  user_type: UserType;                // "vendor" or "client"
  interaction_id: string;             // Format: "{clientUserId}_{vendorId}_{issueId}"
  users_interaction_id: string;
  start_time: string;                 // ISO timestamp
  end_time: string;                   // ISO timestamp
  status: IssueAssessmentStatus;      // "Assessment_Status.RECEIVED" | "ACCEPTED" | "REJECTED"
  min_assessment_time: number | null; // Minimum duration in minutes
  created_at: string;
  updated_at: string;
}

// Extended for calendar display
interface CalendarReadyAssessment extends IssueAssessment {
  title: string;
  start: Date;
  end: Date;
  isNew?: boolean;
  isEdited?: boolean;
}
```

### IssueDispute

**File:** `src/types/index.tsx` (lines 312–357)

```typescript
IssueDispute {
  id: number;
  issue_offer_id: number;
  status: DisputeStatus;
  status_message?: string | null;
  created_at: string;
  updated_at: string;
}

IssueDisputeMessage {
  id: number;
  issue_dispute_id: number;
  message: string;
  user_type: string;           // "client" or "vendor"
  created_at: string;
}

IssueDisputeAttachment {
  id: number;
  issue_dispute_id: number;
  attachment_url: string;
  user_type: string;
  created_at: string;
}
```

### Comment

**File:** `src/types/index.tsx` (lines 294–300)

```typescript
Comment {
  id: number;
  issue_id: number;
  user_id: string;
  comment: string;
  created_at: string;
}
```

### Attachment

**File:** `src/types/index.tsx` (lines 302–310)

```typescript
Attachment {
  id: number;
  issue_id: number;
  name: string;
  type: string;
  url: string;
  user_id: string;
  created_at: string;
}
```

---

## 3. All API Endpoints

### Issues API

**File:** `src/features/api/issuesApi.ts`

| Method | Endpoint | Purpose | RTK Query Hook |
|--------|----------|---------|----------------|
| `GET` | `/issues/` | Fetch all issues | `useGetIssuesQuery()` |
| `GET` | `/issues/filter?page&size&search&type&city&state&vendor_assigned` | Paginated + filtered issues | `useGetPaginatedIssuesQuery()` |
| `GET` | `/issues/{id}` | Fetch issue by ID | `useGetIssueByIdQuery(id)` |
| `GET` | `/issues/address/{id}` | Get address for an issue | `useGetIssueAddressQuery(id)` |
| `GET` | `/issues/addresses/all` | Get all issue addresses | `useGetAllIssueAddressesQuery()` |
| `POST` | `/issues/addresses/issue_ids` | Batch get addresses by issue IDs | `useGetIssueAddressesByIssueIdsMutation()` |
| `POST` | `/issues/` | Create issue | `useCreateIssueMutation()` |
| `PUT` | `/issues/{id}` | Update issue (full object) | `useUpdateIssueMutation()` |
| `DELETE` | `/issues/{id}` | Delete issue | `useDeleteIssueMutation()` |

### Issue Offers API

**File:** `src/features/api/issueOffersApi.ts`

| Method | Endpoint | Purpose | RTK Query Hook |
|--------|----------|---------|----------------|
| `GET` | `/issue_offers/issue/{issueId}` | Get offers for an issue | `useGetOffersByIssueIdQuery(issueId)` |
| `GET` | `/issue_offers/vendor/{vendorId}` | Get offers by vendor | `useGetOffersByVendorIdQuery(vendorId)` |
| `POST` | `/issue_offers/` | Submit offer (bid) | `useCreateOfferMutation()` |
| `PUT` | `/issue_offers/{id}` | Update offer (accept/reject) | `useUpdateOfferMutation()` |
| `DELETE` | `/issue_offers/{id}` | Withdraw offer | `useDeleteOfferMutation()` |

### Issue Assessments API

**File:** `src/features/api/issueAssessmentsApi.ts`

| Method | Endpoint | Purpose | RTK Query Hook |
|--------|----------|---------|----------------|
| `GET` | `/issue_assessments/issue/{issueId}` | Get assessments for issue | `useGetAssessmentsByIssueIdQuery()` |
| `GET` | `/issue_assessments/user_id/{userId}` | Get assessments for user | `useGetAssessmentsByUserIdQuery()` |
| `GET` | `/issue_assessments/users_interaction/{interactionId}` | Get by interaction ID | `useGetAssessmentsByUsersInteractionIdQuery()` |
| `GET` | `/issue_assessments/client_id_users_interaction_id/{clientId}` | Get by client interaction | `useGetAssessmentsByClientIdUsersInteractionIdQuery()` |
| `GET` | `/issue_assessments/vendor_id_users_interaction_id/{vendorId}` | Get by vendor interaction | `useGetAssessmentsByVendorIdUsersInteractionIdQuery()` |
| `POST` | `/issue_assessments/` | Create assessment | `useCreateAssessmentMutation()` |
| `PUT` | `/issue_assessments/{id}` | Update assessment | `useUpdateAssessmentMutation()` |
| `DELETE` | `/issue_assessments/{id}` | Delete assessment | `useDeleteAssessmentMutation()` |

### Issue Disputes API

**File:** `src/features/api/issueDisputesApi.ts`

| Method | Endpoint | Purpose | RTK Query Hook |
|--------|----------|---------|----------------|
| `GET` | `/issue_disputes/issue_offer/{offerId}` | Get disputes for offer | `useGetDisputesByIssueOfferIdQuery()` |
| `GET` | `/issue_disputes/issue_offer/{offerId}/open` | Get open disputes | `useGetOpenDisputesByIssueOfferIdQuery()` |
| `GET` | `/issue_disputes/issue_offer/{offerId}/details` | Get dispute details (messages + attachments) | `useGetDisputeDetailsByIssueOfferIdQuery()` |
| `POST` | `/issue_disputes/` | Create dispute | `useCreateDisputeMutation()` |
| `POST` | `/issue_dispute_messages/?issue_dispute_id={id}` | Add message to dispute | `useCreateDisputeMessageMutation()` |
| `POST` | `/issue_dispute_attachments/?issue_dispute_id={id}` | Add attachment to dispute | `useCreateDisputeAttachmentMutation()` |

### Comments API

**File:** `src/features/api/commentsApi.ts`

| Method | Endpoint | Purpose | RTK Query Hook |
|--------|----------|---------|----------------|
| `GET` | `/comments/` | Get all comments | `useGetCommentsQuery()` |
| `POST` | `/comments/` | Create comment | `useCreateCommentMutation()` |

### Stripe Payments API

**File:** `src/features/api/stripePaymentsApi.ts`

| Method | Endpoint | Purpose | RTK Query Hook |
|--------|----------|---------|----------------|
| `POST` | `/stripe/checkout/create-session` | Create Stripe checkout session | `useCreateCheckoutSessionMutation()` |

---

## 4. Issue Status Lifecycle

### Status Values

```
Status.OPEN  →  Status.IN_PROGRESS  →  Status.REVIEW  →  Status.COMPLETED
```

| Backend Value | Display Label | Meaning |
|---------------|---------------|---------|
| `Status.OPEN` / `"open"` | Open | Posted, awaiting vendor offers |
| `Status.IN_PROGRESS` / `"in_progress"` | In-progress | Offer accepted, vendor working |
| `Status.REVIEW` / `"review"` | Review | Vendor marked complete, client reviewing |
| `Status.COMPLETED` / `"completed"` | Completed | Client approved, issue resolved |

**Status mapping** (`src/types/index.tsx`, lines 184–196):
```javascript
statusMapping: {
  "Status.OPEN": "open",
  "Status.IN_PROGRESS": "in_progress",
  "Status.REVIEW": "review",
  "Status.COMPLETED": "completed",
}
```

### Review Status (separate from issue status)

Used during report review workflow:

```
not_reviewed  →  in_review  →  completed
```

---

## 5. Issue Types & Categories

**Defined in:** `src/pages/ReportReviewPage.tsx` (lines 29–44)

```
GENERAL, STRUCTURAL, ELECTRICIAN, PLUMBER, PAINTER, CLEANER,
HVAC, ROOFING, INSULATION, DRYWALL, PLASTER, CARPENTRY,
LANDSCAPING, OTHER
```

**Marketplace filter options** (`src/pages/Marketplace.tsx`, lines 524–534):

```
Electrical, Plumbing, HVAC, Roofing, Flooring, Painting,
Landscaping, Structural, Dry Wall, Carpentry, Other
```

**Type normalization** (`src/utils/typeNormalizer.ts`):

The frontend normalizes vendor-style names to issue-style names for matching:
- `"electrician"` → `"electrical"`
- `"plumber"` → `"plumbing"`
- `"painter"` → `"painting"`
- `"cleaner"` → `"cleaning"`

---

## 6. Creating Issues

### Method 1: Manual Creation

**Component:** `src/components/CreateIssueModal.tsx`

1. Client selects report/listing
2. Fills in: **type**, **summary**, **description**, **severity**
3. Uploads multiple images (stored temporarily, then uploaded to S3)
4. Submits `POST /issues/`:

```json
{
  "report_id": 5,
  "listing_id": 7,
  "type": "plumbing",
  "summary": "Leaking pipe in basement",
  "description": "Water dripping from copper joint...",
  "severity": "high",
  "status": "open",
  "active": true,
  "vendor_id": null,
  "image_urls": ["https://s3.../img1.jpg", "https://s3.../img2.jpg"]
}
```

### Method 2: AI Extraction from PDF

**Component:** `src/pages/ReportReviewPage.tsx`

1. User uploads PDF report → `POST /reports/extract/issues`
2. Backend AI extracts issues with type, summary, description
3. Issues created with `review_status: "not_reviewed"`
4. Client reviews each extracted issue in the Review page
5. Can edit severity, summary, description, active, images
6. Saves with `review_status: "completed"`

### Method 3: During Report Review

**Component:** `src/pages/ReportReviewPage.tsx` (lines 581–769)

- "Add Issue" button in the review sidebar
- Opens modal within review page
- Creates issue directly attached to the current report

---

## 7. Marketplace

**File:** `src/pages/Marketplace.tsx` (~1,686 lines)

### What It Shows

The marketplace displays **open, unassigned, active issues** for vendors to browse and bid on.

Filter criteria: `vendor_id: null, status: "open", active: true`

### Filtering

| Filter | Source | Description |
|--------|--------|-------------|
| **Type** | Dropdown | electrical, plumbing, HVAC, roofing, flooring, painting, landscaping, structural, drywall, carpentry, other |
| **City** | Dropdown | Populated from issue addresses |
| **State** | Dropdown | Populated from issue addresses |
| **Search** | Text input | Matches against summary/description |
| **Group by Address** | Checkbox | Clusters issues by property address |

**Smart type matching:** Filters handle variations — searching "electrical" also matches "electrician", "wiring", etc.

**Fallback filtering:** If `type + city` returns 0 results, tries `type` only, then `city` only.

### Display Modes

1. **Card grid** (default) — individual issue cards with image carousel
2. **Grouped by address** — clusters issues using `AddressGroupCard` + `GroupedIssuesModal`

### Pagination

- 12 items per page (configurable by screen width)
- Client-side pagination for filtered results

### Vendor Interaction

1. Click issue card → opens `IssueDetails` modal
2. View details, images, severity, description
3. Submit offer (bid) from within the modal

**Route:** `/marketplace` — main marketplace page
**Route:** `/marketplace/:issueId` — direct link to issue detail from marketplace

---

## 8. Offers (Bidding) Flow

### Step 1: Vendor Submits Offer

**Component:** `src/components/OffersTabVendor.tsx`

```json
POST /issue_offers/
{
  "issue_id": 42,
  "vendor_id": 15,
  "price": 500,
  "status": "Bid_Status.RECEIVED",
  "comment_vendor": "I can fix this next week",
  "comment_client": ""
}
```

### Step 2: Client Reviews Offers

**Component:** `src/components/OffersTabClient.tsx`

- Views all offers for an issue
- Sees vendor price, comments, profile
- Can **accept**, **reject**, or **counter**

### Step 3: Accept Offer → Payment

**Component:** `src/pages/Offers.tsx`

1. Client clicks accept
2. Triggers Stripe checkout: `POST /stripe/checkout/create-session`
   ```json
   {
     "client_id": 5,
     "vendor_id": 15,
     "offer_id": 23,
     "success_url": "https://app.inspectly.com/offers?success=true&offer_id=23",
     "cancel_url": "https://app.inspectly.com/offers?cancelled=true"
   }
   ```
3. Redirects to Stripe checkout page
4. On success, returns to app:
   - `updateOffer({ status: "Bid_Status.ACCEPTED" })`
   - `updateIssue({ status: "in_progress", vendor_id: vendorId, active: false })`

### Step 4: Offer Status Values

| Status | Meaning |
|--------|---------|
| `Bid_Status.RECEIVED` | Pending — vendor submitted, awaiting client response |
| `Bid_Status.ACCEPTED` | Client accepted and paid |
| `Bid_Status.REJECTED` | Client rejected |

### Vendor Actions on Offers

- **Withdraw:** `DELETE /issue_offers/{id}` — removes pending offer
- **Edit:** Update price/comment on pending offer

---

## 9. Assessments (Scheduling) Flow

### Step 1: Vendor Proposes Times

**Component:** `src/components/CalendarSelector.tsx`

After offer is accepted, vendor proposes assessment/appointment times:

1. Drag-and-drop on calendar to select time slots
2. Set minimum assessment duration

```json
POST /issue_assessments/
{
  "issue_id": 42,
  "user_id": 15,
  "user_type": "vendor",
  "interaction_id": "5_15_42",
  "users_interaction_id": "5_15",
  "start_time": "2026-03-25T10:00:00Z",
  "end_time": "2026-03-25T12:00:00Z",
  "status": "Assessment_Status.RECEIVED",
  "min_assessment_time": 60
}
```

**Interaction ID format:** `{clientUserId}_{vendorId}_{issueId}`

### Step 2: Client Reviews Times

**Component:** `src/components/AssessmentReviewTab.tsx`

- Calendar display of proposed times
- **Accept** one slot → `PUT /issue_assessments/{id}` with `status: "Assessment_Status.ACCEPTED"`
- **Reject** others → `DELETE /issue_assessments/{id}`
- **Propose new times** → create additional assessments

### Step 3: Assessment Confirmed

- Both parties see confirmed time on calendar
- Calendar link generation (Google/Outlook) via `src/utils/calendarUtils.ts`

### Assessment Status Values

| Status | Meaning |
|--------|---------|
| `Assessment_Status.RECEIVED` | Proposed, awaiting response |
| `Assessment_Status.ACCEPTED` | Confirmed appointment |
| `Assessment_Status.REJECTED` | Declined |

---

## 10. Work Completion & Approval

**Component:** `src/components/IssueDetails.tsx` (lines 294–298)

### Vendor Marks Complete

```javascript
updateIssue({ status: "review" })
```

Issue moves to `Status.REVIEW` — client gets notified.

### Client Reviews Work

- **Approve:** `updateIssue({ status: "completed" })` — issue is resolved
- **Request changes:** Add comment or open dispute

---

## 11. Disputes

**Component:** `src/components/DisputeTab.tsx`

### Opening a Dispute

```json
POST /issue_disputes/
{
  "issue_offer_id": 23,
  "status": "open",
  "status_message": "Work not completed as agreed"
}
```

### Dispute Messaging

```json
POST /issue_dispute_messages/?issue_dispute_id=5
{
  "message": "The repair is leaking again",
  "user_type": "client"
}
```

### Dispute Attachments (file upload)

```json
POST /issue_dispute_attachments/?issue_dispute_id=5
{
  "attachment_url": "https://s3.../evidence.jpg",
  "user_type": "client"
}
```

### Dispute Detail View

`GET /issue_disputes/issue_offer/{offerId}/details` returns:

```typescript
DisputeDetails {
  status: string;
  status_message: string;
  items: (IssueDisputeMessage | IssueDisputeAttachment)[];  // chronological
}
```

---

## 12. Image Management

### Upload Flow

**Component:** `src/components/IssueImageManager.tsx`

1. User selects images during issue creation
2. Files uploaded to S3 via `src/utils/imageUpload.ts`
3. URLs stored in `issue.image_urls` field

### Image URL Handling

**File:** `src/utils/issueImageUtils.ts`

The backend may return `image_urls` in multiple formats — the frontend normalizes:

```javascript
getIssueImageUrls(imageUrls)        // Parse any format → string[]
getIssueImageUrlsFromIssue(issue)   // Extract from issue object
getFirstIssueImageUrl(issue)        // First image or fallback
serializeImageUrlsForBackend(urls)  // Format for PUT request
```

Possible backend formats: array, single string, JSON string, CSV string.

### IndexedDB Persistence (Stripe redirect survival)

**File:** `src/utils/issueImageStore.ts`

Before Stripe redirect, images are saved to IndexedDB so they aren't lost:

```javascript
saveIssueImages(issueId, urls)   // Save to IndexedDB
getIssueImages(issueId)          // Restore after payment
```

- Database: `inspectly_images`
- Store: `pending_images`

---

## 13. Comments

**Component:** `src/components/Comments.tsx`

```json
POST /comments/
{
  "issue_id": 42,
  "user_id": "15",
  "comment": "When can you start?"
}
```

- `GET /comments/` fetches all comments, filtered client-side by `issue_id`
- Displayed as a thread within the issue detail view

---

## 14. IssueDetails Component (Main Detail View)

**File:** `src/components/IssueDetails.tsx` (~800+ lines)

This is the primary issue detail component used across the app. It has multiple tabs:

| Tab | Content |
|-----|---------|
| **Details** | Type, severity, summary, description, images, status, address |
| **Offers** | `OffersTabClient` or `OffersTabVendor` depending on user type |
| **Assessments** | `CalendarSelector` / `AssessmentReviewTab` for scheduling |
| **Dispute** | `DisputeTab` for dispute messaging |

Used in:
- Marketplace modal (click issue card)
- Client dashboard
- Report detail page
- Direct issue routes

---

## 15. Routing Structure

**Defined in:** `src/App.tsx`

| Route | Component | Purpose |
|-------|-----------|---------|
| `/marketplace` | `<Marketplace />` | Browse open issues |
| `/marketplace/:issueId` | `<MarketplaceIssue />` | Issue detail from marketplace |
| `/listings/:listingId/reports/:reportId/issues/:issueId` | `<Issue />` | Issue detail from report context |
| `/dashboard` | `<ClientDashboard />` | Client's issues overview |
| `/vendor/jobs` | `<VendorDashboard />` | Vendor's available jobs and bids |
| `/offers` | `<Offers />` | Offer management + payment |

---

## 16. Dashboard Integration

### Client Dashboard

**File:** `src/pages/ClientDashboard.tsx`

- Fetches user's issues via `useGetIssuesQuery()`, filtered by listings owned by user
- Lists issues by status
- Can create new issues
- Links to offer management

### Vendor Dashboard

**File:** `src/pages/VendorDashboard.tsx`

**Available Jobs Tab:**
- `useGetIssuesQuery()` → filter: `status === "Status.OPEN" && !vendor_id && active`
- Shows priority / new / bidding issues
- Click to bid or view details

**Bidding Tab:**
- `useGetOffersByVendorIdQuery()` for vendor's bids
- Filter by offer status (pending, accepted, rejected)
- Can withdraw or edit pending offers

**Visits/Assessments Tab:**
- `useGetAssessmentsByUserIdQuery()` for scheduled assessments
- Calendar view of upcoming work

**Polling:** Dashboard queries poll every ~20 seconds for near real-time updates.

---

## 17. Complete Issue Lifecycle

```
1. CLIENT CREATES ISSUE
   ├── Manual: CreateIssueModal → POST /issues/
   └── AI: Upload PDF → extract → review → save

2. ISSUE APPEARS ON MARKETPLACE
   Filter: active=true, status="open", vendor_id=null
   Vendors browse, filter by type/city/state

3. VENDOR SUBMITS OFFER
   POST /issue_offers/ { price, comment_vendor }
   Status: Bid_Status.RECEIVED

4. CLIENT REVIEWS OFFERS
   ├── Accept → Stripe payment → POST /stripe/checkout/create-session
   │   → On success: offer.status="accepted", issue.status="in_progress",
   │     issue.vendor_id=vendorId, issue.active=false
   ├── Reject → offer.status="rejected"
   └── Counter → update issue, create new offer

5. VENDOR PROPOSES ASSESSMENT TIMES
   POST /issue_assessments/ { start_time, end_time }
   Calendar drag-and-drop

6. CLIENT ACCEPTS TIME SLOT
   PUT /issue_assessments/{id} { status: "accepted" }
   Calendar link generated (Google/Outlook)

7. VENDOR COMPLETES WORK
   PUT /issues/{id} { status: "review" }

8. CLIENT REVIEWS WORK
   ├── Approve → PUT /issues/{id} { status: "completed" }
   └── Dispute → POST /issue_disputes/
         ├── Exchange messages: POST /issue_dispute_messages/
         └── Attach evidence: POST /issue_dispute_attachments/
```

---

## 18. Cost & Pricing

| Field | Type | Purpose |
|-------|------|---------|
| `issue.cost` | string | Estimated repair cost (informational, not used for payment) |
| `offer.price` | number | Vendor's bid amount (actual transaction amount) |

**Cost calculation in report view** (`src/pages/Report.tsx`, lines 37–51):
- Sums accepted offer prices across issues in a report
- Displayed as total estimated cost

---

## 19. State Management

- **No dedicated Redux slice** — all issue state managed via RTK Query
- **Cache tags:** `"Issues"`, `"Offers"`, `"Assessments"`, `"Disputes"`, `"Comments"`
- **Invalidation:** Mutations automatically invalidate related tags
- **Optimistic updates:** Used for performance on status changes
- **Cache retention:** 1 hour (`keepUnusedDataFor: 3600` in `apiSlice.ts`)
- **Vendor dashboard polling:** ~20s interval for near real-time updates

---

## 20. Utility Helpers

| Utility | File | Purpose |
|---------|------|---------|
| `buildIssueUpdateBody()` | `src/utils/issueUpdateHelper.ts` | Build full PUT body with all required fields |
| `formatSeverity()` | `src/utils/issueUpdateHelper.ts` | Convert severity to backend format |
| `normalizeAndCapitalize()` | `src/utils/typeNormalizer.ts` | Format issue type for display |
| `getIssueTypeIcon()` | `src/utils/typeNormalizer.ts` | Get FontAwesome icon for issue type |
| `getIssueImageUrls()` | `src/utils/issueImageUtils.ts` | Parse image_urls field → string[] |
| `serializeImageUrlsForBackend()` | `src/utils/issueImageUtils.ts` | Format images for PUT request |
| `saveIssueImages()` / `getIssueImages()` | `src/utils/issueImageStore.ts` | IndexedDB persistence for Stripe redirects |
| `parseAsUTC()` | `src/utils/calendarUtils.ts` | Parse ISO timestamp as UTC |
| `generateCalendarLinks()` | `src/utils/calendarUtils.ts` | Generate Google/Outlook calendar links |

---

## 21. Key Files

### API Files

| File | Purpose |
|------|---------|
| `src/features/api/issuesApi.ts` | Issue CRUD + filter + addresses |
| `src/features/api/issueOffersApi.ts` | Offer management |
| `src/features/api/issueAssessmentsApi.ts` | Assessment scheduling |
| `src/features/api/issueDisputesApi.ts` | Dispute management |
| `src/features/api/commentsApi.ts` | Comments |
| `src/features/api/stripePaymentsApi.ts` | Stripe payment sessions |

### Pages

| File | Purpose |
|------|---------|
| `src/pages/Marketplace.tsx` | Marketplace — browse/bid on open issues |
| `src/pages/MarketplaceIssue.tsx` | Single issue detail from marketplace |
| `src/pages/Issue.tsx` | Issue detail from report context |
| `src/pages/Report.tsx` | Issues table for a report |
| `src/pages/ReportReviewPage.tsx` | Review extracted issues |
| `src/pages/Offers.tsx` | Offer management + payment |
| `src/pages/ClientDashboard.tsx` | Client dashboard |
| `src/pages/VendorDashboard.tsx` | Vendor dashboard |

### Components

| File | Purpose |
|------|---------|
| `src/components/IssueDetails.tsx` | Full issue detail view (tabbed) |
| `src/components/HomeownerIssueCard.tsx` | Client issue card |
| `src/components/IssueItem.tsx` | Marketplace issue card with carousel |
| `src/components/IssueImageManager.tsx` | Image upload/management |
| `src/components/CreateIssueModal.tsx` | Manual issue creation |
| `src/components/CreateIssueCollectionModal.tsx` | Batch issue creation |
| `src/components/ReviewIssueEditor.tsx` | Edit during report review |
| `src/components/OffersTabClient.tsx` | Client offer view |
| `src/components/OffersTabVendor.tsx` | Vendor offer view |
| `src/components/OfferTable.tsx` | Offer table display |
| `src/components/CalendarSelector.tsx` | Assessment scheduling calendar |
| `src/components/AssessmentReviewTab.tsx` | Client assessment review |
| `src/components/AssessmentReview.tsx` | Assessment detail |
| `src/components/DisputeTab.tsx` | Dispute messaging |
| `src/components/Comments.tsx` | Issue comments thread |
| `src/components/Attachments.tsx` | Issue attachments |
| `src/components/AddressGroupCard.tsx` | Address grouping on marketplace |
| `src/components/GroupedIssuesModal.tsx` | Grouped issues modal |

### Utilities

| File | Purpose |
|------|---------|
| `src/utils/issueUpdateHelper.ts` | Build PUT body helpers |
| `src/utils/issueImageUtils.ts` | Image URL parsing/normalization |
| `src/utils/issueImageStore.ts` | IndexedDB persistence for Stripe redirects |
| `src/utils/typeNormalizer.ts` | Type display formatting + icons |
| `src/utils/calendarUtils.ts` | Calendar/date utilities |
| `src/utils/imageUpload.ts` | S3 upload helpers |

---

## 22. Business Rules

1. **Marketplace visibility:** Only issues with `active: true`, `status: "open"`, `vendor_id: null`
2. **One accepted offer per issue:** Client cannot accept multiple offers
3. **Offer status progression:** `RECEIVED` → `ACCEPTED` or `REJECTED` (no reversal)
4. **Assessment status progression:** `RECEIVED` → `ACCEPTED` or rejected (deleted)
5. **Vendor assignment:** `issue.vendor_id` set only after offer acceptance + payment
6. **Active flag:** Set to `false` when offer accepted — removes from marketplace
7. **Status transitions are one-way:** OPEN → IN_PROGRESS → REVIEW → COMPLETED
8. **Image persistence:** IndexedDB used to survive Stripe redirect page navigation
9. **Type matching:** Frontend normalizes "electrician" to "electrical" for filtering
10. **Interaction ID format:** `{clientUserId}_{vendorId}_{issueId}` for assessment grouping
