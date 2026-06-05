# System Prompt: Generate TEDx Pune Community App Admin Panel

Copy and paste the prompt below into your AI builder/code generation tool (such as v0.dev, Cursor, or another instance of Gemini/Claude) to scaffold the complete admin panel.

---

```text
You are an expert full-stack engineer specializing in premium, responsive Admin Dashboards. Your task is to build a web-based Admin Panel for the "TEDx Pune Community App" that interfaces with our existing Fastify + Supabase backend.

### Technical Stack Guidelines
- Frontend Framework: Next.js (App Router) or React (Vite)
- Language: TypeScript
- Styling: Tailwind CSS (Custom color configurations)
- Component Library: Radix UI primitives or Shadcn/ui (Tables, Modals, Toasts, Badges, Tabs)
- Charts: Recharts (Clean, modern graphs)
- Icons: Lucide React (Sleek minimalist icons)
- Auth Helper: jwt-decode (For parsing roles and tenant ID from the token)

### Visual Design Guidelines (TEDx Brand Theme)
- Esthetics: Editorial, premium, high contrast, clean micro-interactions.
- Color Palette:
  - Base Background: Pure Black (#000000) or Charcoal (#0B0B0B)
  - Card Backgrounds: Sleek Dark Grey (#121212) with subtle 1px border (#242424)
  - Primary Accent: TED Red (#EB0028)
  - Secondary/Texts: Soft Chalk (#E5E5E5) for body, Muted Silver (#999999) for subtext, White (#FFFFFF) for headers
  - Badges/Status Colors:
    - ACTIVE: Soft green background (#065F46) and text (#34D399)
    - PENDING_APPROVAL: Muted Amber background (#78350F) and text (#FBBF24)
    - BLOCKED: Dark red background (#991B1B) and text (#F87171)
- Typography: Inter/Outfit (Sans-serif) for system elements, Lora/Merriweather (Serif) for numbers and main titles to achieve an editorial feel.

### Data Model & Fields
The database schema has the following structure:
1. tenants (id: UUID, name: Text, slug: Text, is_active: Boolean)
2. users (id: UUID, tenant_id: UUID, supabase_uid: UUID, email: Text, full_name: Text, avatar_url: Text, headline: Text, role: 'USER' | 'ADMIN' | 'SUPER_ADMIN', status: 'PENDING_APPROVAL' | 'ACTIVE' | 'BLOCKED', created_at: Timestamp, linkedin_id: Text, google_id: Text, apple_id: Text)
3. posts (id: UUID, tenant_id: UUID, author_id: UUID, body: Text (max 3000 chars), status: 'ACTIVE' | 'DELETED', created_at: Timestamp)

### API Routes Architecture
All backend endpoints are prefixed with `/api/v1` and require an HTTP Authorization Header:
`Authorization: Bearer <admin_token>`

The actual implemented backend endpoints are:
1. GET /api/v1/admin/metrics
   - Response: { totalUsers: number, activeUsers: number, totalPosts: number, totalComments: number, totalLikes: number }
2. GET /api/v1/admin/users?status=<status>&page=<page>&limit=<limit>
   - Query params: status (optional: 'PENDING_APPROVAL' | 'ACTIVE' | 'BLOCKED'), page (default 1), limit (default 20, max 100)
   - Response: { items: User[], total: number, page: number, limit: number }
3. PATCH /api/v1/admin/users/:id/status
   - Body: { status: 'PENDING_APPROVAL' | 'ACTIVE' | 'BLOCKED' }
   - Response: Updated User object
4. DELETE /api/v1/admin/posts/:id
   - URL Param: post_id
   - Action: Hard deletes the post from the DB (returns 204 No Content)

### Core Features to Build
Implement the following views and flows:

1. LOGIN SCREEN
   - Clean credentials input or token input form.
   - Decodes the JWT claims (e.g., using jwt-decode). 
   - Restricts access: if the claim's `role` is NOT 'ADMIN' or 'SUPER_ADMIN', show an error toast: "Access Denied: Admin privileges required." and prevent login.
   - Extracts the `tenantId` from the token claims and stores it in the Auth State.

2. DASHBOARD PAGE
   - Sidebar navigation: Dashboard, Users, Posts, Settings, Sign Out.
   - Header with current user profile, active tenant slug, and tenant switching dropdown (if role is 'SUPER_ADMIN').
   - Four stat cards powered by `GET /admin/metrics`:
     - Active Members (with green dot)
     - Pending Approvals (with blinking warning dot if count > 0)
     - Total Feed Posts
     - Total Comments & Likes combined (Engagement)
   - A quick actions widget displaying the 3 most recent user signups needing approval.

3. USER DIRECTORY
   - Interactive table with columns: User (avatar + name), Email, Social Sync (LinkedIn/Google/Apple badge), Status (colored tag), Joined Date, Actions.
   - Search bar (client-side or query-based filtering).
   - Status tabs: "All", "Pending Approval", "Active", "Blocked" (clicking them queries the API with respective `status` query parameter).
   - Actions inline:
     - If status is PENDING_APPROVAL: "Approve" (green button) / "Block" (red outline button)
     - If status is ACTIVE: "Block" (red outline button)
     - If status is BLOCKED: "Unblock / Reactivate" (green outline button)
   - Triggers `PATCH /admin/users/:id/status` on action click, refreshes table, and shows a success/error Toast notification.

4. POST MODERATION FEED
   - Layout: Grid of post cards.
   - Each card displays:
     - Author (avatar, name, headline)
     - Time since creation (e.g., "3 hours ago")
     - Post Body text
     - Stats footer (Likes count, comments count)
     - Danger Zone action button: "Delete Post" (with a confirmation modal)
   - Confirming deletion triggers `DELETE /admin/posts/:id`, animates the card vanishing from the layout, and pops up a confirmation toast.

### Delivery Scope
Please provide:
1. `types.ts` containing the User, Post, Tenant, and Metrics types matching the database schema.
2. `api.ts` exposing an Axios or fetch-based client wrapper with helper functions matching the API routes. Ensure it includes automatic Authorization header insertion and interceptors to log out on 401.
3. The main Layout components (Sidebar, SidebarItem, Header).
4. The dashboard page, user directory page (with full table implementation), and the post moderation page.
```
