# Backend Request: Support for Grouped Offers

## Problem
Vendors can now submit a single offer for multiple issues at the same address (e.g., a company that does electrical, plumbing, and HVAC can bid on all three at once).

**Current workaround**: Frontend creates multiple separate offer records (one per issue) with the same price and comments.

**What we need**: Backend support to treat this as ONE offer linked to multiple issues.

---

## What We're Doing Now (Workaround)

When a vendor selects 3 issues and submits one offer for $500, we send:

```javascript
POST /issue_offers/ { issue_id: 123, vendor_id: 456, price: 500, ... }
POST /issue_offers/ { issue_id: 124, vendor_id: 456, price: 500, ... }
POST /issue_offers/ { issue_id: 125, vendor_id: 456, price: 500, ... }
```

**Result**: 3 separate database records

---

## What We Want

Send ONE request:

```javascript
POST /issue_offers/ { 
  issue_ids: [123, 124, 125],  // Multiple issues
  vendor_id: 456, 
  price: 500,
  status: "received",
  comment_vendor: "I can handle all three",
  comment_client: ""
}
```

**Expected Response**:
```json
{
  "id": 789,
  "issue_ids": [123, 124, 125],
  "vendor_id": 456,
  "price": 500.00,
  "status": "received",
  "comment_vendor": "I can handle all three",
  "comment_client": "",
  "created_at": "2026-01-11T...",
  "updated_at": "2026-01-11T..."
}
```

---

## How This Works for Both Vendors and Clients

### Vendor Side
1. Vendor browses marketplace and sees multiple issues at the same address
2. Vendor selects multiple issues (e.g., electrical, plumbing, HVAC)
3. Vendor submits ONE offer with one price for all selected issues
4. System creates ONE offer record linked to multiple issues

### Client Side
1. Client views offers on any of their issues (e.g., issue 124)
2. Client sees the grouped offer showing all issues it covers: `issue_ids: [123, 124, 125]`
3. Client can:
   - **Accept** → All issues in the group get assigned to the vendor
   - **Reject** → All issues in the group remain open
   - **Counter** → Creates new grouped offer with different price for same issues
4. Client sees ONE offer instead of duplicate offers from the same vendor

**Example**: If vendor bids $500 on issues 123, 124, 125, the client viewing ANY of those issues will see the single $500 grouped offer, not three separate $500 offers.

---

## GET Endpoints Need to Return Groups

### GET /issue_offers/vendor/:vendor_id
**Current Response** (3 separate offers):
```json
[
  { "id": 1, "issue_id": 123, "vendor_id": 456, "price": 500, ... },
  { "id": 2, "issue_id": 124, "vendor_id": 456, "price": 500, ... },
  { "id": 3, "issue_id": 125, "vendor_id": 456, "price": 500, ... }
]
```

**Desired Response** (1 grouped offer):
```json
[
  { 
    "id": 1, 
    "issue_ids": [123, 124, 125],
    "vendor_id": 456, 
    "price": 500, 
    ... 
  }
]
```

### GET /issue_offers/issue/:issue_id
Should return offers that include this issue (whether single or grouped).

For example, `GET /issue_offers/issue/124` should return the offer with `issue_ids: [123, 124, 125]`.

---

## Update/Delete Should Affect All Issues in Group

- **PUT /issue_offers/:id** → Update should apply to all issues in the group
- **DELETE /issue_offers/:id** → Should remove the offer for all issues in the group
- **Status changes** (accept/reject) → Should affect all issues in the group atomically

---

## Requirements

1. **Accept `issue_ids` array** in POST /issue_offers/
2. **Return `issue_ids` array** in all GET responses
3. **Group integrity**: When offer status changes, all issues in group are affected
4. **Validation**: Recommended but up to you:
   - All issues should be at the same address
   - All issues should be unassigned/open

---

## Frontend Will Update

Once backend supports this, we'll simplify the frontend to:
- Send single POST request instead of multiple
- Handle `issue_ids` in responses
- Estimated work: ~2-4 hours

---

## Implementation

We leave the database design and implementation details up to you. Common approaches:
- Junction table linking offers to issues
- Array field in the offers table
- Whatever works best for your architecture

Let us know your approach and timeline!
