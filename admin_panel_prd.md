# Product Requirement Document (PRD)
## TEDx Pune Community App - Admin Panel

| Metadata | Details |
| :--- | :--- |
| **Status** | Draft (Ready for Review) |
| **Author** | Antigravity AI |
| **Target Backend** | Fastify + Supabase (TEDxPune-BE) |
| **Target Audience** | TEDx Pune Organizers, Community Moderators, Super Admins |

---

## 1. Executive Summary & Goals

### 1.1 Context
The TEDx Pune Community App is an exclusive, invite-only social network for attendees, speakers, and organizers. To maintain the quality of discussion, establish community safety, and measure engagement, the TEDx Pune organizing team requires an **Admin Panel**.

### 1.2 Objective
Build a web-based, responsive, and premium Admin Panel that allows organizers to:
1. **Approve or Reject** new user sign-ups (since access is invite-verified and starts as `PENDING_APPROVAL`).
2. **Moderate Content** by deleting spam, inappropriate, or guideline-violating posts.
3. **Monitor Engagement** via real-time community statistics (users, posts, comments, likes).
4. **Scale to Multi-Tenancy** (supporting future TEDx chapters via the existing `tenant_id` DB architecture).

---

## 2. User Roles & Permissions (RBAC)

The Fastify backend defines three user roles: `USER`, `ADMIN`, and `SUPER_ADMIN`. The Admin Panel is restricted to the latter two.

| Role | Permissions | Panel View |
| :--- | :--- | :--- |
| **ADMIN** | • View dashboard metrics for their tenant.<br>• View, approve, block, or unblock users in their tenant.<br>• Delete posts within their tenant. | Tenant Dashboard, User Directory, Post Moderator |
| **SUPER_ADMIN** | • All ADMIN permissions.<br>• Switch between different tenants (e.g. TEDx Pune, TEDx Mumbai).<br>• Manage global system settings. | Global Dashboard, Tenant Selector, System Logs |

---

## 3. Functional Requirements

### 3.1 Authentication & Session Management
- **Security:** JWT-based authentication. The administrator logs in, and the application stores the access token securely (e.g., HTTP-only cookies or encrypted localStorage).
- **Profile Claims:** The panel must decode the JWT claims to determine user role and tenant ID (via the `jwt-decode` utility). If the role is `USER`, the panel must deny access with a "Forbidden" page.
- **Session Auto-Refresh:** Handle 401 Unauthorized API responses by automatically redirecting the administrator to the login page.

### 3.2 Dashboard & Community Metrics
- **Summary Cards:** Display aggregate counts:
  - **Total Registered Users**
  - **Active Members** (Status: `ACTIVE`)
  - **Pending Approvals** (Status: `PENDING_APPROVAL`)
  - **Suspended Accounts** (Status: `BLOCKED`)
  - **Total Posts** (Status: `ACTIVE`)
  - **Total Threaded Comments**
  - **Total Likes**
- **Data Visualizations:**
  - Weekly/Monthly growth graphs for users and posts (using Recharts or Chart.js).
  - Engagement ratio (average comments and likes per post).

### 3.3 User Management
- **Members Table:** A clean, paginated table displaying:
  - Avatar, Full Name, Email, Professional Headline, Linked Identity (LinkedIn, Google, Apple), Date Joined, and Status.
- **Filters & Search:**
  - Search by Name or Email.
  - Filter by Status: `PENDING_APPROVAL`, `ACTIVE`, `BLOCKED`.
  - Filter by Registration Provider (LinkedIn, Google, Apple).
- **Moderation Actions:**
  - **Approve:** Single-click action to transition user status from `PENDING_APPROVAL` to `ACTIVE`.
  - **Block/Suspend:** Immediate suspension changing status to `BLOCKED`.
  - **Reactivate:** Restore a blocked user back to `ACTIVE` status.

### 3.4 Content Moderation (Posts & Comments Feed)
- **Moderation Queue:** A card-based chronological feed of all posts.
- **Post Details:** Shows Author profile details, Post body (max 3000 chars), timestamps, like count, comment count.
- **Mod Actions:**
  - **Hard Delete:** Permanently delete a post from the database using the admin endpoint.
  - **Flagged Filter:** (Future) Highlight posts reported by community members.

---

## 4. UI/UX Design & Brand Strategy

To align with the TEDx brand identity, the Admin Panel must feel premium, modern, and editorial. 

### 4.1 Visual System
- **Color Palette:**
  - **Primary:** TED Red (`#EB0028`)
  - **Backgrounds:** Pure Black (`#000000`), Charcoal Gray (`#111111`), Dark Gray (`#1A1A1A`)
  - **Accents:** Crisp White (`#FFFFFF`), Soft Borders (`#2E2E2E`), Status Greens/Reds (harmonized).
- **Typography:**
  - Sans-serif typography (e.g. *Inter* or *Outfit* via Google Fonts).
  - Serif headings for a magazine/editorial feel (e.g. *Playfair Display* or *Lora*).
- **Aesthetics:** Glassmorphism overlay panels (`backdrop-filter: blur()`), subtle border glows, and smooth transitions on buttons/actions.

### 4.2 Core Screens Layout
```
+--------------------------------------------------------------------------+
|  TEDx Pune Community Admin                      [Switch Tenant]  [Admin] |
+--------------------------------------------------------------------------+
|  [D] Dashboard        |  Community Metrics                               |
|  [U] User Directory  |  +---------------+ +---------------+ +----------+  |
|  [P] Post Moderation  |  | Total Users:  | | Pending Appr: | | Posts:   |  |
|  [S] Settings        |  | 250           | | 15 (Action!)  | | 1,250    |  |
|                      |  +---------------+ +---------------+ +----------+  |
|  [->] Log Out        |                                                   |
|                      |  Pending Approvals Queue                          |
|                      |  1. Saurabh S. (LinkedIn) ------> [Approve] [Block]|
|                      |  2. Jane Doe (Google)   ------> [Approve] [Block]|
+----------------------+---------------------------------------------------+
```

---

## 5. System Architecture & API Integration

The admin panel integrates directly with the Fastify REST endpoints. All requests must carry the admin JWT in the `Authorization: Bearer <token>` header.

### 5.1 Route Mapping
| Feature | Endpoint | HTTP Method | Body/Query Params | Response |
| :--- | :--- | :--- | :--- | :--- |
| **Fetch Metrics** | `/api/v1/admin/metrics` | `GET` | None | `{ totalUsers: number, activeUsers: number, totalPosts: number, totalComments: number, totalLikes: number }` |
| **List Users** | `/api/v1/admin/users` | `GET` | Query: `status`, `page`, `limit` | `{ items: User[], total: number, page: number, limit: number }` |
| **Update Status** | `/api/v1/admin/users/:id/status` | `PATCH` | Body: `{ status: 'ACTIVE' \| 'BLOCKED' \| 'PENDING_APPROVAL' }` | `{ id: string, email: string, full_name: string, status: string, ... }` |
| **Moderator Delete Post** | `/api/v1/admin/posts/:id` | `DELETE` | Path parameter: Post UUID | `204 No Content` |

### 5.2 Error Mapping
- **401 Unauthorized:** Invalid token. Redirect to login.
- **403 Forbidden:** User is not an ADMIN/SUPER_ADMIN. Display access denied.
- **404 Not Found:** User or Post does not exist. Show toast notification.
- **429 Rate Limited:** Backoff requests and display a warning.

---

## 6. Non-Functional Requirements
- **Performance:** First Contentful Paint (FCP) under 1.2 seconds. Paging must feel instantaneous.
- **Responsive Layout:** Must support Desktop, Tablet, and Mobile viewport sizes (allowing organizers to approve users on their phones).
- **Audit Logging:** (Future) Store logs of which admin approved/blocked which user.
