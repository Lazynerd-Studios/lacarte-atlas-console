# Frontend Changes — Web (Admin Dashboard)
## Spec: `postpaid-exit-settlement`

Exit settlement for postpaid subscriptions: cancelling (or suspending) a postpaid subscription now bills any unbilled accrued usage instead of letting it vanish. No new admin endpoints — existing endpoints gained side effects, status codes, and activity-feed actions.

Error response shape is unchanged: `{ "message": "..." }`. All money values are GHS **major units**.

---

## 1. Behavior changes

### 1.1 Admin cancel now settles postpaid exit debt

`POST /api/subscription/admin/subscriptions/:id/cancel` on a **postpaid** subscription additionally:

1. Folds all unbilled deferred charges (over-quota pickups, emergency fees accrued during the cycle) into the subscription's `outstandingBalance`
2. Creates a **final invoice** (status `pending`) + pending settlement payment
3. Sends a MoMo collection prompt to the customer
4. Sends the customer a `subscription_debt_due` push notification

The subscription still ends `cancelled` — but it now carries the debt until paid or waived. For prepaid subscriptions and postpaid subs with nothing accrued, behavior is unchanged (no invoice, no prompt).

### 1.2 Customer suspension cascade does the same

Suspending a customer (`POST /api/customer/.../suspend`) settles postpaid exit debt for each cancelled subscription as part of the cascade — same final-invoice + prompt behavior as admin cancel.

### 1.3 Exit debt blocks re-subscribing

Customers with an outstanding balance on a cancelled subscription get **402** when subscribing again (plan or calculated). To unblock them: use **waive-balance**, or have the customer pay via `POST /api/subscription/me/pay-balance`.

---

## 2. UI updates

- **Subscriber list** (`GET /api/subscription/admin/subscriptions`): cancelled rows can now show `outstandingBalance > 0` (exit debt). Render it — e.g. a "Debt: GHS X" badge. No response shape change.
- **Detail view** (`GET .../:id`): the settlement appears in `payments[]` as a pending postpaid payment; the linked invoice is visible in the invoice module (`type: "subscription"`, `status: "pending"`).
- **State-machine table** — one change:

  | Status | Show |
  |---|---|
  | `cancelled` / `expired` | **Waive (if balance > 0)** — previously "none" |

- **Waive-balance** (`POST .../:id/waive-balance`) also clears exit debt and unblocks re-subscribing. No shape change.

---

## 3. Activity feed: new actions

| Action | Meaning |
|---|---|
| `subscription.exit_billed` | Postpaid subscription cancelled with unbilled usage settled. `after` contains `billedAmount` (GHS), `deferredCount`, `paymentId`, `status: "cancelled"` |
| `subscription.debt_settled` | Outstanding balance on a cancelled/expired subscription was paid off (webhook, payment-sync, or cash). `after` contains `settledAmount` (GHS), `paymentId`, `outstandingBalance: 0` |

Related nuance for the "late settlements" handling: money arriving for a cancelled subscription **with** an outstanding balance now clears the debt (`subscription.debt_settled`) instead of being flagged for refund review; money for a cancelled subscription with no debt still goes to refund review.

---

## 4. No changes required

- Subscriber-management endpoint paths, request/response shapes, and permissions — unchanged.
- Invoice endpoints — shapes unchanged (exit invoices are ordinary `type: "subscription"` invoices).
- All other admin surfaces — unchanged.
