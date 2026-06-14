# Security Specification & Test Plan (Khidmaty / خدماتي)

This document defines the security specification for the application, mapping data invariants and defining the "Dirty Dozen" threat-model payloads to protect database integrity.

## 1. Data Invariants

- **User Accounts (`/users/{userId}`)**:
  - Users can read any user profile (needed for discovering providers, seeing customer names on orders).
  - A user can only write/update their own profile (`request.auth.uid == userId`).
  - To prevent self-assigned privileges/identity spoofing, a regular user **cannot** elevate their `role` or toggle their verification status `isVerified` or edit backend credentials. Only system integrations or authentic admins can write/approve provider verifications.
  - Emails must be valid, and ratings can only be numbers.

- **Booking Requests (`/requests/{requestId}`)**:
  - Create: A customer can only create a service request where the `customerId` equals the authenticated user ID (`request.auth.uid`), and `status == 'pending'`.
  - Read: Authenticated users can read booking requests only if they are the `customerId`, the `providerId`, or an `admin`.
  - Update: 
    - Customers can cancel requests: transition status to `cancelled` (only from `pending` or `accepted`).
    - Providers can accept or reject requests: transition status to `accepted` or `rejected` (only from `pending`).
    - Providers can complete requests: transition status to `completed` (only from `accepted`).
    - Terminal states like `completed`, `cancelled`, and `rejected` cannot be changed after completion.
  - Rating: A customer can update `rating` and `reviewText` on the request, but ONLY if the status is `completed` and `request.auth.uid == customerId`.

- **Chat Threads (`/chats/{chatId}`)**:
  - Read / Write: Allowed only if the authenticated user's ID is the `customerId` or `providerId` inside the chat document.
  - Master Gate Constraint: Users can only write messages into `/chats/{chatId}/messages/{msgId}` if they have read/write access to the parent `/chats/{chatId}` document.

- **Complaints (`/complaints/{complaintId}`)**:
  - Read: Only accessible by admins for platform resolution.
  - Create: Any signed-in user can file a complaint with their own certified `userId`.
  - Update: Only an admin can resolve complaints (`status` transition to `resolved`).

- **Ads / Promotional Banners (`/ads/{adId}`)**:
  - Read: Anyone (including unauthenticated/guests) can read ads to see active promotions.
  - Write: Only authenticated admins can create, update, or delete ads.

- **Notifications (`/notifications/{notifId}`)**:
  - Read: A user can read notifications where `resource.data.userId == request.auth.uid`.
  - Write: Users can create notifications for others during actions (e.g., chat messages, new request alerts) or update their own notification status (marking as read).

---

## 2. The "Dirty Dozen" (Threat Matrix & Malicious Payloads)

Here are the 12 malicious payloads designed to bypass and compromise the platform, all of which will be strictly rejected by our Firestore rules.

### Threat 1: Self-Role Escalation (Identity Spoofing)
*Payload targeting `/users/hunted_hacker_uid`:*
```json
{
  "id": "hunted_hacker_uid",
  "name": "Attacker",
  "email": "attacker@gmail.com",
  "phone": "44443333",
  "role": "admin",
  "isVerified": true
}
```
- **Vulnerability**: Attacker attempts to sign up directly as an `admin` or mark themselves as a `verified` provider to steal money.
- **Expected Outcome**: `PERMISSION_DENIED` (role elevation is blocked).

### Threat 2: Profile Hijacking (Writing other user profiles)
*Payload targeting `/users/innocent_citizen_uid`:*
```json
{
  "id": "innocent_citizen_uid",
  "name": "Tampered Name",
  "email": "hijacked@gmail.com"
}
```
- **Vulnerability**: Authenticated attacker (`auth.uid != innocent_citizen_uid`) attempts to overwrite another client or provider's pricing, avatar, or role details.
- **Expected Outcome**: `PERMISSION_DENIED`.

### Threat 3: Orphaned Order Creation (Customer Spoofing)
*Payload targeting `/requests/rogue_req_1`:*
```json
{
  "id": "rogue_req_1",
  "customerId": "innocent_victim_uid",
  "customerName": "Victim",
  "providerId": "provider_p1",
  "price": 25000,
  "status": "pending"
}
```
- **Vulnerability**: Attacker creates a request using another user's `customerId` to charge their account or spam a provider.
- **Expected Outcome**: `PERMISSION_DENIED` (auth UID must match `customerId`).

### Threat 4: Status Jump (Pre-Completing Service without Paying)
*Payload targeting `/requests/rogue_req_2`:*
```json
{
  "id": "rogue_req_2",
  "customerId": "attacker_uid",
  "providerId": "provider_p1",
  "price": 30000,
  "status": "completed",
  "commission": 3000
}
```
- **Vulnerability**: Client creates the booking but sets the initial status directly to `completed`, skipping approval, execution, and commission checks.
- **Expected Outcome**: `PERMISSION_DENIED` (creates must always start as `pending`).

### Threat 5: Price Poisoning (Zero-Cost Exploits)
*Payload updating `/requests/valid_req_1`:*
```json
{
  "price": 1,
  "status": "pending"
}
```
- **Vulnerability**: After booking is accepted, the customer updates the price of the service request to 1 MRU instead of 10,000 MRU to avoid paying the provider.
- **Expected Outcome**: `PERMISSION_DENIED` (essential transaction fields are immutable once created).

### Threat 6: Unauthorized Booking Hijacking
*Payload updating `/requests/valid_req_1`:*
```cpp
// Sent by malicious_provider_3
{"status": "accepted"}
```
- **Vulnerability**: Spammer faked status changes on a booking assigned to another provider (`provider_p1` vs `malicious_provider_3`).
- **Expected Outcome**: `PERMISSION_DENIED`.

### Threat 7: Post-Terminal State Tampering
*Payload updating completed `/requests/valid_req_completed`:*
```json
{
  "status": "pending"
}
```
- **Vulnerability**: After a service is completed, the customer attempts to roll the status back to `pending` or `rejected` to trigger refunds or claim services weren't performed.
- **Expected Outcome**: `PERMISSION_DENIED`.

### Threat 8: Blind Chat Eavesdropping (Data Leakage)
*Attempt to read `/chats/customer_david_provider_sarah` from `attacker_uid`:*
- **Vulnerability**: Attacker queries the live database for lists of chats containing sensitive negotiate logs of other users.
- **Expected Outcome**: `PERMISSION_DENIED`.

### Threat 9: Sub-collection Message Orphan Injecting
*Payload targeting `/chats/david_sarah/messages/msg_999`:*
```json
{
  "id": "msg_999",
  "senderId": "attacker_uid",
  "text": "Phishing Link"
}
```
- **Vulnerability**: Attacker injects a message into an ongoing chat thread between David and Sarah.
- **Expected Outcome**: `PERMISSION_DENIED` (attacker is not a member of the thread).

### Threat 10: Ad Banner Overwrite (Spam Injection)
*Payload targeting `/ads/promo_1` from a non-admin:*
```json
{
  "id": "promo_1",
  "title": "Malicious Phishing Ad",
  "imageUrl": "https://attacker.com/ad.jpg"
}
```
- **Vulnerability**: Regular customer injects high-impact spam ads directly onto the home slider of all app clients.
- **Expected Outcome**: `PERMISSION_DENIED`.

### Threat 11: Fake Complaint Spoofing
*Payload targeting `/complaints/comp_fake` from a customer claiming to be someone else:*
```json
{
  "id": "comp_fake",
  "userId": "other_victim_uid",
  "title": "Rude user",
  "description": "Please ban them"
}
```
- **Vulnerability**: Attacker files complaints under another user's identity to frame them.
- **Expected Outcome**: `PERMISSION_DENIED`.

### Threat 12: Silent Account Takeover via Custom Claims
*Bypassing rules using custom claims or admin checks:*
- **Vulnerability**: Relying on unverified claims or open reads for sensitive database sections.
- **Expected Outcome**: `PERMISSION_DENIED`.

---

## 3. Test Runner Design (`firestore.rules.test.ts`)

To verify safety, we define standard testing conditions confirming that all write/read actions breaching the laws specified above fail gracefully.
Our security rules in `firestore.rules` will implement:
- Hardened identifiers checking `isValidId()` ensuring string safety.
- Strict key size verification (`data.keys().hasAll()` AND `data.keys().size() == N`).
- Action-oriented `allow update:` checks with `diff().affectedKeys().hasOnly()`.
- Immutable temporal validation requiring `incoming().createdAt == request.time`.
