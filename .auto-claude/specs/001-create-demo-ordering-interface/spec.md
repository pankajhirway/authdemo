# Specification: Create Demo Ordering Interface

## Overview

Build a realistic, customer-facing demo UI that simulates an actual ordering system for stakeholder presentations. The interface will demonstrate the Authz/Authn capabilities of the backend through a familiar restaurant/food ordering scenario, complete with product browsing, cart management, checkout flows, and order tracking. The UI must achieve high visual fidelity to convince customers of real-world production readiness.

## Workflow Type

**Type**: feature

**Rationale**: This is a greenfield development task adding entirely new frontend functionality to the existing backend API. It involves creating new UI components, pages, state management, and integration with existing authentication/authorization endpoints. No existing code is being modified or refactored.

## Task Scope

### Services Involved
- **main** (backend integration) - Provides REST API, Keycloak authentication, role-based authorization
- **frontend** (new service) - React SPA providing the ordering interface demo

### This Task Will:
- [ ] Create a new React + TypeScript frontend application
- [ ] Implement restaurant/food ordering UI with product catalog, cart, and checkout
- [ ] Integrate with existing Keycloak authentication for login/logout
- [ ] Build role-based views (Customer, Operator, Supervisor, Admin)
- [ ] Create realistic mock data (menu items, orders, users)
- [ ] Implement responsive design for professional demo appearance
- [ ] Add order history and order tracking features
- [ ] Connect to FastAPI backend endpoints (`/api/v1/*`)

### Out of Scope:
- Payment processing integration (mock only)
- Real email notifications
- Production deployment configuration
- Advanced order customization beyond basic options
- Real-time inventory management
- Multi-restaurant or multi-location support

## Service Context

### Main (Backend Service)

**Tech Stack:**
- Language: Python
- Framework: FastAPI
- ORM: SQLAlchemy
- Authentication: Keycloak (OAuth2/OIDC)
- Database: PostgreSQL

**Entry Point:** `app/main.py`

**How to Run:**
```bash
# Using docker-compose (recommended)
docker-compose up backend

# Or directly with uvicorn
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

**Port:** 8000

**API Documentation:** http://localhost:8000/docs (OpenAPI/Swagger)

**Key Routes:**
- `/health` - Health check endpoint
- `/api/v1/data` (POST) - Create data entries (Operator)
- `/api/v1/data/{entry_id}` (GET/PUT) - View/update entries (Operator)
- `/api/v1/data/{entry_id}/submit` (POST) - Submit for approval (Operator)
- `/api/v1/data/{entry_id}/confirm` (POST) - Approve entry (Supervisor)
- `/api/v1/data/{entry_id}/reject` (POST) - Reject entry (Supervisor)
- `/api/v1/data` (GET) - View all data (Auditor, Supervisor)
- `/api/v1/audit` (GET) - Audit logs (Auditor)
- `/admin/settings` (GET) - Admin settings
- `/metrics` (GET) - Application metrics

**Roles:**
- **Operator** - Creates and submits orders/entries
- **Supervisor** - Reviews and approves/rejects submissions
- **Auditor** - Read-only access to all data and audit logs
- **Admin** - System configuration and monitoring

### Frontend (New Service)

**Tech Stack:**
- Language: TypeScript
- Framework: React 18+ with Vite
- UI Library: shadcn/ui (modern, accessible components)
- Styling: Tailwind CSS
- State Management: Zustand (lightweight, performant)
- HTTP Client: Axios
- Authentication: Keycloak JS Adapter or react-keycloak

**Entry Point:** `frontend/src/main.tsx`

**How to Run:**
```bash
cd frontend
npm install
npm run dev
```

**Port:** 3001 (configured in CORS origins)

**Key Pages:**
- `/` - Home/Landing page
- `/login` - Login page (Keycloak redirect)
- `/menu` - Product catalog browsing
- `/cart` - Shopping cart
- `/checkout` - Checkout process
- `/orders` - Order history and tracking
- `/admin` - Admin dashboard (role-based)
- `/operator` - Operator dashboard (role-based)
- `/supervisor` - Supervisor dashboard (role-based)

## Files to Modify

| File | Service | What to Change |
|------|---------|---------------|
| *None* | *main* | No backend modifications required - existing API endpoints sufficient |
| `frontend/` (new) | *frontend* | Create entire new frontend application |

## Files to Reference

These files show patterns to follow:

| File | Pattern to Copy |
|------|----------------|
| `app/api/routes/operator.py` | Operator role endpoint patterns (create, submit orders) |
| `app/api/routes/supervisor.py` | Supervisor role endpoint patterns (approve, reject orders) |
| `app/api/routes/auditor.py` | Auditor role endpoint patterns (read-only data access) |
| `app/api/dependencies/auth.py` | Authentication/authorization patterns |
| `app/main.py` | CORS configuration, route registration |

## Patterns to Follow

### Backend API Integration Pattern

The frontend should follow REST API patterns established in `app/api/routes/`:

**Key Points:**
- Use `/api/v1` prefix for all API calls
- Include JWT token from Keycloak in Authorization header
- Handle role-based access control on frontend (redirect if unauthorized)
- Parse FastAPI error responses consistently
- Use async/await for all HTTP requests

**Example Integration:**
```typescript
// API client pattern
import axios from 'axios';

const apiClient = axios.create({
  baseURL: 'http://localhost:8000/api/v1',
  headers: {
    'Authorization': `Bearer ${getKeycloakToken()}`
  }
});

// Create order (Operator role)
const createOrder = async (orderData: OrderRequest) => {
  const response = await apiClient.post('/data', orderData);
  return response.data;
};

// Submit order for approval (Operator role)
const submitOrder = async (entryId: string) => {
  const response = await apiClient.post(`/data/${entryId}/submit`);
  return response.data;
};

// Approve order (Supervisor role)
const approveOrder = async (entryId: string) => {
  const response = await apiClient.post(`/data/${entryId}/confirm`);
  return response.data;
};
```

### Role-Based Access Control Pattern

From `app/api/dependencies/auth.py`:

**Key Points:**
- Keycloak roles determine UI access
- Frontend should check user role before showing protected pages
- Redirect unauthorized users to appropriate page
- Show role-appropriate navigation and actions

**Example Frontend Role Check:**
```typescript
// Get user roles from Keycloak token
const getUserRoles = (): string[] => {
  const token = getKeycloakToken();
  const decoded = jwtDecode(token);
  return decoded.realm_access.roles || [];
};

// Protect routes based on role
const requireRole = (allowedRoles: string[]) => {
  const userRoles = getUserRoles();
  return allowedRoles.some(role => userRoles.includes(role));
};
```

### Error Handling Pattern

FastAPI returns standardized error responses:

**Key Points:**
- Handle 401 Unauthorized (redirect to login)
- Handle 403 Forbidden (show access denied)
- Handle 422 Validation Error (show form errors)
- Handle 500 Server Error (show friendly message)

## Requirements

### Functional Requirements

1. **Authentication and Authorization**
   - Description: Users must log in via Keycloak SSO to access the ordering system
   - Acceptance: Login page redirects to Keycloak, successful auth shows appropriate dashboard based on role

2. **Product Catalog (Menu)**
   - Description: Browse available items with images, descriptions, prices
   - Description: Filter by category (appetizers, entrees, drinks, desserts)
   - Description: Search functionality by name or description
   - Acceptance: Catalog displays 10-15 realistic items with proper categorization and search

3. **Shopping Cart**
   - Description: Add items to cart, adjust quantities, remove items
   - Description: View cart total and item summary
   - Acceptance: Cart persists across page navigation, updates reflect immediately

4. **Checkout Flow**
   - Description: Multi-step checkout (review → confirmation → submission)
   - Description: Order confirmation page with order details
   - Acceptance: Checkout completes successfully, order appears in history

5. **Order History**
   - Description: View past orders with status (pending, approved, rejected, completed)
   - Description: Filter and search orders by date or status
   - Acceptance: History accurately reflects submitted orders and their workflow status

6. **Role-Based Dashboards**
   - Description: **Operator** - Create orders, view own orders, submit for approval
   - Description: **Supervisor** - View pending approvals, approve/reject orders
   - Description: **Auditor** - Read-only view of all orders and audit trail
   - Description: **Admin** - System metrics and configuration
   - Acceptance: Each role sees appropriate UI and has correct permissions

7. **Responsive Design**
   - Description: Professional appearance on desktop, tablet, and mobile
   - Acceptance: Demo looks polished on common screen sizes (1920px, 1366px, 768px)

### Non-Functional Requirements

1. **Visual Fidelity**
   - Description: Interface must look like a production ordering system
   - Acceptance: Clean design, consistent styling, smooth transitions, no placeholder text

2. **Performance**
   - Description: Page loads within 2 seconds on typical connection
   - Acceptance: Lighthouse score >80 for performance

3. **Mock Data Quality**
   - Description: Realistic menu items, prices, and order data
   - Acceptance: Demo feels authentic to stakeholders

### Edge Cases

1. **Session Expiry** - User's Keycloak token expires during session → Auto-logout with message prompting re-login
2. **Unauthorized Access** - User attempts to access role-restricted page → Redirect to appropriate dashboard or show access denied
3. **Empty Cart** - User attempts checkout with empty cart → Show error message, prevent checkout
4. **Network Error** - Backend unavailable during order submission → Show friendly error, offer retry
5. **Order Already Approved** - Supervisor attempts to approve already-approved order → Show current status, disable action button
6. **Concurrent Modification** - Two users modify same order simultaneously → Last write wins or show optimistic locking error

## Implementation Notes

### DO
- Start with authentication flow (Keycloak integration)
- Build core ordering flow first (browse → cart → checkout)
- Add role-based dashboards after core flow works
- Use shadcn/ui components for consistent, professional appearance
- Implement proper error boundaries and loading states
- Add comprehensive mock data for realistic demo
- Test all role-based access patterns
- Ensure mobile responsiveness throughout development

### DON'T
- Don't build custom authentication - use existing Keycloak setup
- Don't create overly complex order customization - keep demo focused
- Don't skip loading states - demo must feel polished
- Don't use placeholder Lorem Ipsum text - use realistic content
- Don't ignore CORS issues - verify backend allows frontend origin
- Don't hardcode credentials - use environment variables
- Don't build payment processing - mock the payment step

### Tech Stack Recommendations

**Frontend Framework**: React 18+ with Vite
- Fast development server, excellent TypeScript support
- Large ecosystem, easy to find demo-quality components

**UI Library**: shadcn/ui
- Modern, accessible components built on Radix UI
- Highly customizable with Tailwind CSS
- Professional appearance suitable for customer demos

**State Management**: Zustand
- Lightweight, simple API
- Good TypeScript support
- Sufficient for demo-scale application

**Alternative**: Material-UI (MUI)
- More opinionated, complete component library
- Excellent documentation and examples
- Enterprise-ready appearance

**Styling**: Tailwind CSS (comes with shadcn/ui)

**Authentication**: react-keycloak-wrapper or keycloak-js
- Integrates with existing Keycloak setup
- Handles token refresh and session management

### Mock Data Structure

```typescript
// Menu items
interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category: 'appetizers' | 'entrees' | 'drinks' | 'desserts';
  image: string;
  available: boolean;
}

// Order
interface Order {
  id: string;
  items: OrderItem[];
  total: number;
  status: 'pending' | 'submitted' | 'approved' | 'rejected' | 'completed';
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  notes?: string;
}

interface OrderItem {
  menuItem: MenuItem;
  quantity: number;
}

// Users (for demo)
interface DemoUser {
  username: string;
  role: 'operator' | 'supervisor' | 'auditor' | 'admin';
  name: string;
}
```

## Development Environment

### Start Services

```bash
# Terminal 1: Start backend (if not running)
docker-compose up backend postgres keycloak

# Terminal 2: Start frontend
cd frontend
npm install
npm run dev

# Frontend will be available at http://localhost:3001
```

### Service URLs
- **Backend API**: http://localhost:8000
- **API Documentation**: http://localhost:8000/docs
- **Frontend**: http://localhost:3001
- **Keycloak**: http://localhost:8080 (if using local Keycloak)

### Required Environment Variables

**Backend** (already configured in project):
- `DATABASE_URL` - PostgreSQL connection string
- `KEYCLOAK_URL` - Keycloak server URL
- `KEYCLOAK_REALM` - Keycloak realm name
- `KEYCLOAK_CLIENT_ID` - OAuth2 client ID
- `CORS_ORIGINS` - Must include `http://localhost:3001`

**Frontend** (create new `.env` in frontend directory):
```bash
VITE_API_BASE_URL=http://localhost:8000/api/v1
VITE_KEYCLOAK_URL=http://localhost:8080
VITE_KEYCLOAK_REALM=demo-realm
VITE_KEYCLOAK_CLIENT_ID=demo-frontend
```

## Success Criteria

The task is complete when:

1. [ ] Frontend application builds and runs without errors
2. [ ] User can log in via Keycloak and is directed to role-appropriate dashboard
3. [ ] Product catalog displays 10+ realistic menu items with filtering and search
4. [ ] User can add items to cart, adjust quantities, and proceed to checkout
5. [ ] Checkout flow completes and order appears in order history with correct status
6. [ ] Supervisor can view pending orders and approve/reject them
7. [ ] Auditor can view all orders and audit logs (read-only)
8. [ ] Admin can view system metrics and basic configuration
9. [ ] UI is responsive and professional-looking on desktop and mobile
10. [ ] No console errors during typical user flows
11. [ ] CORS properly configured between frontend and backend
12. [ ] Demo runs smoothly with realistic data for customer presentation

## QA Acceptance Criteria

**CRITICAL**: These criteria must be verified by the QA Agent before sign-off.

### Unit Tests
| Test | File | What to Verify |
|------|------|----------------|
| API Client | `frontend/src/lib/api.test.ts` | HTTP requests include auth headers, handle errors correctly |
| Cart State | `frontend/src/store/cart.test.ts` | Add/remove items, calculate totals, persist state |
| Role Check | `frontend/src/lib/auth.test.ts` | Role detection works from Keycloak token |
| Format Currency | `frontend/src/lib/format.test.ts` | Currency formatting consistent across app |

### Integration Tests
| Test | Services | What to Verify |
|------|----------|----------------|
| Authentication Flow | frontend ↔ Keycloak | Login redirects correctly, token stored, logout works |
| Create Order | frontend → backend API | Order creation POST succeeds, returns valid order ID |
| Submit Order | frontend → backend API | Submit endpoint updates order status to submitted |
| Approve Order | frontend → backend API | Supervisor can approve, status updates correctly |
| CORS Headers | frontend ↔ backend | Preflight OPTIONS requests succeed |

### End-to-End Tests
| Flow | Steps | Expected Outcome |
|------|-------|------------------|
| Operator Ordering | 1. Login as operator<br>2. Browse menu<br>3. Add items to cart<br>4. Checkout<br>5. View order history | Order created with status "submitted", visible in history |
| Supervisor Approval | 1. Login as supervisor<br>2. View pending orders<br>3. Approve order<br>4. Verify status change | Order status changes to "approved", operator can see update |
| Auditor View | 1. Login as auditor<br>2. View all orders<br>3. Check audit logs | All orders visible read-only, audit trail accessible |
| Unauthorized Access | 1. Login as operator<br>2. Attempt to access `/supervisor` | Redirected to operator dashboard or shown access denied |
| Session Expiry | 1. Login<br>2. Wait for token expiry<br>3. Navigate to protected page | Redirected to login with session expiry message |

### Browser Verification
| Page/Component | URL | Checks |
|----------------|-----|--------|
| Login | `http://localhost:3001/login` | Keycloak redirect works, login form displays |
| Menu/Catalog | `http://localhost:3001/menu` | Items display, categories filter, search works |
| Cart | `http://localhost:3001/cart` | Items listed, quantities editable, total correct |
| Checkout | `http://localhost:3001/checkout` | Order summary displays, submit button works |
| Order History | `http://localhost:3001/orders` | Past orders shown, status badges correct |
| Operator Dashboard | `http://localhost:3001/operator` | Create order button, my orders list |
| Supervisor Dashboard | `http://localhost:3001/supervisor` | Pending approvals list, action buttons |
| Auditor Dashboard | `http://localhost:3001/auditor` | All orders view, audit log access |

### Database Verification
| Check | Query/Command | Expected |
|-------|---------------|----------|
| Orders Created | `SELECT * FROM data_entries;` | New entries exist when orders submitted |
| Audit Trail | `SELECT * FROM audit_logs ORDER BY created_at DESC;` | Audit logs record all state changes |

### QA Sign-off Requirements
- [ ] All unit tests pass
- [ ] All integration tests pass
- [ ] All E2E tests pass
- [ ] Browser verification complete for all user roles
- [ ] Database state verified (orders persist correctly)
- [ ] No regressions in existing backend functionality
- [ ] Code follows established patterns (API integration, auth flow)
- [ ] No security vulnerabilities (auth tokens secured, no exposed credentials)
- [ ] Demo quality verified (looks professional for customer presentation)
- [ ] Performance acceptable (pages load <2s)
