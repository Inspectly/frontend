# Reports System

## Architecture Overview

Reports (also called **Issue Collections**) are containers for property inspection issues within a listing. They can be created manually or by uploading a PDF that the backend AI extracts issues from. Reports go through a **review workflow** before issues are published to the marketplace. State is managed via **RTK Query** with tag-based cache invalidation, plus a separate **Tasks API** for tracking extraction status via polling.

```
┌─────────────┐     ┌──────────────────────┐     ┌──────────────────┐
│  Frontend    │────▶│  Backend API          │────▶│  AI Extraction   │
│  (React)     │     │  (Railway)            │     │  Pipeline        │
└─────────────┘     └──────────────────────┘     └──────────────────┘
       │                      │                          │
  RTK Query Cache       POST /reports/              Creates Issues
  Tag: "Reports"        POST /reports/extract/      Creates Tasks
  Polls /tasks/         PUT  /reports/{id}          Status tracking
  every 3s              GET  /reports/...
```

---

## 1. Entity Relationships

```
Listing (id)
  └── has many Reports (listing_id)
        ├── has many Issues (report_id)
        │     ├── has many IssueOffers (issue_id)
        │     ├── has many IssueAssessments
        │     └── has many Comments
        └── has many Tasks (report_id)   ← tracks extraction status
```

---

## 2. Data Types

**File:** `src/types/index.tsx` (lines 148–168)

### ReportType

```typescript
export type ReportType = {
  id: number;
  user_id: number;
  listing_id: number;
  aws_link: string;       // S3 link to uploaded PDF
  name: string;           // Report name (filename or custom)
  created_at: string;
  updated_at: string;
  review_status: string;  // "not_reviewed" | "in_review" | "completed"
};
```

### UpdateReportPutPayload

```typescript
export type UpdateReportPutPayload = {
  id: number;
  user_id: number;
  listing_id: number;
  aws_link: string;
  name: string;
  review_status: string;
};
```

### Status Enums

```typescript
export type ReviewStatus = "not_reviewed" | "in_review" | "completed";
export type ExtractionStatus = "NONE" | "IN_PROGRESS" | "FAILED" | "COMPLETED" | "PENDING";
export type ReportCardMode = "REVIEW" | "CONTINUE_REVIEW" | "VIEW" | "NONE" | "PENDING" | "FAILED" | "EXTRACTING";
```

### Task (for extraction tracking)

**File:** `src/features/api/taskApi.ts` (lines 3–21)

```typescript
export type TaskStatus = "Status.PENDING" | "Status.IN_PROGRESS" | "Status.FAILED" | "Status.COMPLETED";
export type TaskType = "Task_Type.EXTRACT_ISSUES" | "Task_Type.EXTRACT_IMAGES";

export interface Task {
  id: number;
  report_id: number;
  task_type: TaskType;
  status: TaskStatus;
  created_at: string;
  updated_at: string;
}
```

---

## 3. All API Endpoints

### Reports API

**File:** `src/features/api/reportsApi.ts`

| Method | Endpoint | Purpose | RTK Query Hook |
|--------|----------|---------|----------------|
| `GET` | `/reports/` | Fetch all reports | `useGetReportsQuery()` |
| `GET` | `/reports/{id}` | Fetch report by ID | `useGetReportByIdQuery(id)` |
| `GET` | `/reports/user/{userId}` | Fetch reports by user ID | `useGetReportsByUserIdQuery(userId)` |
| `POST` | `/reports/` | Create report (manual) | `useCreateReportMutation()` |
| `POST` | `/reports/extract/issues` | Upload PDF for AI extraction | `useUploadReportFileMutation()` |
| `PUT` | `/reports/{id}` | Update report (review_status, name, etc.) | `useUpdateReportMutation()` |

### Tasks API (extraction tracking)

**File:** `src/features/api/taskApi.ts`

| Method | Endpoint | Purpose | RTK Query Hook |
|--------|----------|---------|----------------|
| `GET` | `/tasks/` | Fetch all tasks | `useGetTasksQuery()` |
| `GET` | `/tasks/{id}` | Fetch task by ID | `useGetTaskByIdQuery(id)` |
| `GET` | `/tasks/report/{reportId}` | Fetch tasks for a report | `useGetTasksByReportIdQuery(reportId)` |
| `POST` | `/tasks/` | Create new task | `useCreateTaskMutation()` |
| `PUT` | `/tasks/{id}` | Update task | `useUpdateTaskMutation()` |

---

## 4. Creating a Report

There are **two creation modes:**

### Mode 1: Upload AI (PDF Extraction)

**Component:** `src/components/CreateIssueCollectionModal.tsx` (lines 105–135)

1. User selects a PDF or image file
2. Auto-names from filename (or user enters custom name)
3. Submits as `FormData` to `POST /reports/extract/issues`:

```
FormData {
  "user_id": string,
  "listing_id": string,
  "name": string,
  "property_report": File   // PDF or image
}
```

4. Backend creates a `Report` record + a `Task` with status `"Status.PENDING"`
5. Backend queues the PDF for AI processing
6. Frontend polls `/tasks/report/{reportId}` every 3 seconds via `ReportCardWithStatus`
7. When task status reaches `"Status.COMPLETED"`, issues have been created in the backend
8. User can then review the extracted issues

### Mode 2: Manual

**Component:** `src/components/CreateIssueCollectionModal.tsx` (lines 71–102)

1. User enters a report name only
2. `POST /reports/` with payload:

```json
{
  "user_id": 42,
  "listing_id": 7,
  "name": "My Report"
}
```

3. No extraction — user adds issues manually afterward

### Creating via Listing + Report (shortcut)

**Handler:** `src/utils/reportUtil.ts` → `handleAddListingWithReport()` (lines 4–55)

1. Creates the listing first: `POST /listings/`
2. Then uploads the report PDF: `POST /reports/extract/issues` with FormData
3. Used by `AddListingByReportModal` component

---

## 5. Viewing Reports

### Reports Grid (per listing)

**Route:** `/listings/:listingId`
**Component:** `src/pages/Reports.tsx`

- Fetches all reports via `useGetReportsQuery()`, filters by `listing_id`
- **Search:** Filter by report name (case-insensitive)
- **Pagination:** 3 rows per page (responsive column count)
- **Grid:** Responsive layout with `ReportCardWithStatus` cards
- Each card shows extraction status badge and action button

### Report Detail (issues table)

**Route:** `/listings/:listingId/reports/:reportId`
**Component:** `src/pages/Report.tsx`

- Shows all issues in a table format
- **Search** by issue summary/type
- **Filters:** severity (low/medium/high), status, visibility (active/inactive)
- **Pagination** support
- **Cost calculation** from accepted vendor offers
- **Issue creation** modal for manually adding issues

---

## 6. Report Card Modes

**Component:** `src/components/ReportCardWithStatus.tsx` (lines 37–82)

The card mode is determined by combining `review_status` and `extraction_status`:

```
Mode Priority:
1. review_status === "completed"     → "VIEW" mode
2. review_status === "in_review"     → "CONTINUE_REVIEW" mode
3. review_status === "not_reviewed":
   ├── extraction === "COMPLETED"    → "REVIEW" mode
   ├── extraction === "PENDING"      → "PENDING" mode
   ├── extraction === "FAILED"       → "FAILED" mode
   ├── extraction === "IN_PROGRESS"  → "EXTRACTING" mode
   └── extraction === "NONE"         → "VIEW" mode (manual report)
```

**Button States (ReportCard.tsx):**

| Mode | Button | Color | Action |
|------|--------|-------|--------|
| REVIEW | "Review" | Blue | Start review |
| CONTINUE_REVIEW | "Continue Review" | Indigo | Resume review |
| VIEW | "View" | Dark | View completed report |
| PENDING | "Queued" | Disabled | Waiting |
| FAILED | "Failed" | Red | Retry available |
| EXTRACTING | "Extracting..." | Disabled | Processing |

---

## 7. Extraction Status Polling

**Component:** `src/components/ReportCardWithStatus.tsx` (lines 31–35)

- Polls `GET /tasks/report/{reportId}` every **3000ms**
- Stops polling when extraction reaches `"COMPLETED"` or `"FAILED"`
- Maps backend task status to frontend extraction status:

| Backend `task.status` | Frontend `ExtractionStatus` |
|---|---|
| `"Status.PENDING"` | `"PENDING"` |
| `"Status.IN_PROGRESS"` | `"IN_PROGRESS"` |
| `"Status.COMPLETED"` | `"COMPLETED"` |
| `"Status.FAILED"` | `"FAILED"` |
| No task found | `"NONE"` |

---

## 8. Report Review Workflow

### Status Transitions

**Report:**
```
not_reviewed  →  in_review  →  completed
```

**Issues (within report):**
```
not_reviewed  →  in_review  →  completed
```

### Step-by-Step Flow

**1. Start Review**

- User clicks "Review" on a report card (`Reports.tsx`, line 144)
- Report `review_status` updated from `"not_reviewed"` → `"in_review"`
- Navigates to `/listings/{listingId}/reports/{reportId}/review`

**2. Review Page Opens**

**Component:** `src/pages/ReportReviewPage.tsx`

- Layout: **sidebar** (issue list) + **editor** (issue details)
- Auto-updates report status to `"in_review"` if still `"not_reviewed"` (lines 250–259)
- Shows all issues for the report

**3. Select an Issue**

- Clicking an issue in the sidebar loads it in the editor
- Auto-updates issue `review_status` from `"not_reviewed"` → `"in_review"` (lines 358–379)

**4. Edit Issue**

**Component:** `src/components/ReviewIssueEditor.tsx`

Editable fields during review:
- **Severity** — dropdown: low / medium / high
- **Summary** — text input
- **Description** — textarea
- **Active** — toggle (controls marketplace visibility)
- **Images** — attach / remove / reorder

Saving sets issue `review_status: "completed"` (lines 135–149)

**5. Accept Individual Issues**

- Click accept button on sidebar → issue `review_status: "completed"`

**6. Accept All Issues**

- Modal confirmation (lines 512–551)
- Loops through all pending issues, marks each as `"completed"`

**7. Complete Report Review**

- Modal confirmation (lines 564–577)
- Updates report `review_status: "completed"`
- Navigates back to reports grid

### Review Sidebar

**Component:** `src/components/ReviewSidebar.tsx`

- Issue list with type icons (electrical, plumbing, roofing, etc.)
- Status dots:
  - Green = completed
  - Gold = in_review
  - Gray = not_reviewed
- Individual accept button per issue
- "Accept All" button for batch completion
- "Complete" button for finalizing the report

---

## 9. Update Report Payload

**Used in:** `src/pages/Reports.tsx` (lines 129–139)

```typescript
const buildUpdatePayload = (report: ReportRow, review_status: string) => ({
  id: report.id,
  user_id: report.user_id,
  listing_id: report.listing_id,
  aws_link: report.aws_link ?? "",
  name: report.name ?? "",
  review_status,
});
```

Sent as `PUT /reports/{id}`.

---

## 10. Routing Structure

**Defined in:** `src/App.tsx` (lines 305–319)

All routes are wrapped in `<PrivateRoute>`.

| Route | Component | Purpose |
|-------|-----------|---------|
| `/listings/:listingId` | `<Reports />` | Reports grid for a listing |
| `/listings/:listingId/reports/:reportId` | `<Report />` | Issues table for a report |
| `/listings/:listingId/reports/:reportId/review` | `<ReportReviewPage />` | Review interface |
| `/listings/:listingId/reports/:reportId/issues/:issueId` | `<Issue />` | Issue detail page |

**Navigation Flow:**
```
/listings/{listingId}                          → Reports grid
  → click "Review"                             → /listings/{id}/reports/{rid}/review
  → click "View" or "Continue Review"          → /listings/{id}/reports/{rid}/review
  → click report card                          → /listings/{id}/reports/{rid}
    → click issue row                          → /listings/{id}/reports/{rid}/issues/{iid}
```

---

## 11. How Other Features Use Reports

### Client Dashboard (`src/pages/ClientDashboard.tsx`)
- Fetches reports by user ID to show recent reports
- Can create reports with PDF upload directly from dashboard

### Vendor Dashboard (`src/pages/VendorDashboard.tsx`)
- Views issues that belong to reports
- Does not interact with reports directly — works at the issue level

### Marketplace (`src/pages/Marketplace.tsx`)
- Issues from completed reports are visible to vendors
- Issue `active` flag (set during review) controls marketplace visibility

---

## 12. Complete Data Flow: PDF Upload → Reviewed Issues

```
1. User uploads PDF
   POST /reports/extract/issues (FormData with PDF)
   → Backend creates Report + Task(status: PENDING)

2. Frontend polls extraction status
   GET /tasks/report/{reportId} every 3s
   → PENDING → IN_PROGRESS → COMPLETED

3. Extraction completes
   Backend has created Issue records from PDF content
   Task status = "Status.COMPLETED"
   Report card shows "Review" button

4. User starts review
   PUT /reports/{id} { review_status: "in_review" }
   → Navigate to review page

5. User reviews each issue
   - Select issue → auto-mark "in_review"
   - Edit severity, summary, description, active
   - Save → mark issue "completed"

6. User completes review
   PUT /reports/{id} { review_status: "completed" }
   → Issues now visible in marketplace

7. Vendors see completed issues
   GET /issues/ → filter by active=true
   → Submit offers on issues
```

---

## 13. Key Files

| File | Purpose |
|------|---------|
| `src/features/api/reportsApi.ts` | Report API endpoints (RTK Query) |
| `src/features/api/taskApi.ts` | Task API for extraction tracking |
| `src/types/index.tsx` | ReportType, ReviewStatus, ExtractionStatus, Task types |
| `src/pages/Reports.tsx` | Reports grid page (per listing) |
| `src/pages/Report.tsx` | Report detail — issues table |
| `src/pages/ReportReviewPage.tsx` | Report review interface (sidebar + editor) |
| `src/components/ReportCard.tsx` | Visual report card with status badges |
| `src/components/ReportCardWithStatus.tsx` | Smart wrapper — extraction polling + mode logic |
| `src/components/CreateIssueCollectionModal.tsx` | Create report modal (upload or manual) |
| `src/components/ReviewIssueEditor.tsx` | Issue editor during review |
| `src/components/ReviewSidebar.tsx` | Issue list sidebar during review |
| `src/components/AddListingByReportModal.tsx` | Create listing + upload report |
| `src/utils/reportUtil.ts` | Helper for listing + report creation |
| `src/App.tsx` | Route definitions (lines 305–319) |

---

## 14. Current Limitations

1. **No Delete Endpoint** — Cannot delete reports from the frontend
2. **No Re-extraction** — Failed extractions have a retry button but the flow is limited
3. **No Bulk Report Upload** — Only one PDF per report creation
4. **No Report Editing** — Cannot rename or change report metadata after creation (only `review_status` is updated)
5. **Polling-based** — Uses 3s polling for extraction status instead of WebSockets
6. **Review is One-way** — Once a report is marked `"completed"`, there's no way to revert to `"in_review"`
