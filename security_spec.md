# Task Genie Firestore Security Specification (Phase 0 TDD)

## 1. Data Invariants
1. **Strict Ownership**: Every document under `/users/{userId}` and its subcollections (`private`, `tasks`, `dailyGoals`, `dailyFocus`, `alerts`) is owned exclusively by `userId == request.auth.uid`, and `email_verified == true` is required for writes.
2. **PII Isolation**: User email is stored solely in `/users/{userId}/private/info` and never exposed on `/users/{userId}`.
3. **Path Variable Hardening**: Every document ID (`userId`, `taskId`, `goalId`, `dateId`, `alertId`, `docId`) matches `^[a-zA-Z0-9_\\-]+$` and length `<= 128`.
4. **Immutable Ownership & Creation Time**: `uid` / `ownerUid` and `createdAt` cannot be modified after creation. `createdAt == request.time` on create; `updatedAt == request.time` on update.
5. **Bounded Arrays & Strings**: All strings carry strict `.size()` limits; `subtasks <= 50`, `attachments <= 20`, `comments <= 100`.
6. **Terminal State Locking**: Once a task reaches `status == 'archived'`, no further client updates are permitted.

## 2. Adversarial Test Vectors ("Dirty Dozen")
1. **Unauthenticated Read/Write**: `request.auth == null` -> `PERMISSION_DENIED`.
2. **Cross-User Read**: User A reads `/users/userB/tasks/t1` -> `PERMISSION_DENIED`.
3. **Cross-User List**: User A lists `/users/userB/tasks` -> `PERMISSION_DENIED`.
4. **Cross-User Write**: User A creates `/users/userB/tasks/t1` with `ownerUid: userA` -> `PERMISSION_DENIED`.
5. **Identity Spoofing on Create**: User A writes `/users/userA/tasks/t1` with `ownerUid: userB` -> `PERMISSION_DENIED`.
6. **Ghost / Shadow Field Injection**: Write includes `{ extraAdminFlag: true }` not in allowlist -> `PERMISSION_DENIED`.
7. **Unverified Email Write**: `request.auth.token.email_verified == false` -> `PERMISSION_DENIED`.
8. **Immutable Field Mutation**: Update modifies `ownerUid` or `createdAt` -> `PERMISSION_DENIED`.
9. **Client Timestamp Forgery**: `createdAt` or `updatedAt` set to past/future string instead of `request.time` -> `PERMISSION_DENIED`.
10. **ID Poisoning**: Document ID contains `/`, `.`, or >128 chars -> `PERMISSION_DENIED`.
11. **Array / Payload Exhaustion**: `title.size() > 200` or `subtasks.size() > 50` -> `PERMISSION_DENIED`.
12. **Terminal State Bypass**: Updating a task whose `resource.data.status == 'archived'` -> `PERMISSION_DENIED`.
