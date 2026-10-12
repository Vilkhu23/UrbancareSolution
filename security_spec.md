# Security Specification & Test Payloads for UrbanCare Solution Firestore

## 1. Data Invariants
1. **Booking Identity & Boundary:** A service booking cannot exist without valid non-empty customer name, contact phone (max 20 chars), locality, doorstep address, and non-negative total.
2. **Review Integrity:** Customer reviews must have a rating between 1 and 5 and review text under 1000 characters.
3. **Project Inquiries:** Home project inquiries require valid contact details, locality, project type, and status.
4. **Complaint Logging:** Quality complaints must belong to a valid service request or verified customer contact.
5. **No Spoofed Mutations:** Critical fields such as `id` cannot be altered upon update.
6. **Default Deny:** Catch-all default deny on all undocumented paths.

---

## 2. The "Dirty Dozen" Malicious Payloads

1. **Payload 1 (ID Poisoning Attack):**
   ```json
   { "id": "../../malicious_path_injection", "customerName": "Attacker", "status": "NEW" }
   ```
2. **Payload 2 (Denial of Wallet - Bloated Text Attack):**
   ```json
   { "id": "req-1", "customerName": "A".repeat(50000), "address": "B".repeat(100000) }
   ```
3. **Payload 3 (Negative Price Manipulation):**
   ```json
   { "id": "req-2", "customerName": "Bad Actor", "total": -99999 }
   ```
4. **Payload 4 (Rating Boundary Overflow):**
   ```json
   { "id": "rev-1", "rating": 9999, "review": "Superb" }
   ```
5. **Payload 5 (Negative Rating Underflow):**
   ```json
   { "id": "rev-2", "rating": -5, "review": "Terrible" }
   ```
6. **Payload 6 (Shadow Key Injection):**
   ```json
   { "id": "req-3", "customerName": "Test", "isSuperAdmin": true, "unvettedEscalation": true }
   ```
7. **Payload 7 (Immutable ID Mutation on Update):**
   ```json
   { "id": "tampered-id-999", "customerName": "Changed Name" }
   ```
8. **Payload 8 (Invalid Enum Value for Booking Status):**
   ```json
   { "id": "req-4", "status": "HACKED_SYSTEM_STATUS" }
   ```
9. **Payload 9 (Junk ID with control characters):**
   ```json
   { "id": "req-bad\u0000\u001f\r\n", "customerName": "Malicious" }
   ```
10. **Payload 10 (Review Missing Mandatory Text):**
    ```json
    { "id": "rev-3", "rating": 5 }
    ```
11. **Payload 11 (Oversized Review Bloat Attack):**
    ```json
    { "id": "rev-4", "rating": 5, "review": "X".repeat(10000) }
    ```
12. **Payload 12 (Project Request Negative Square Footage):**
    ```json
    { "id": "proj-1", "approxAreaSqFt": -5000 }
    ```
