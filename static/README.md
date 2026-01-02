# AuthzAuthn Demo - Testing UI

A comprehensive interactive web interface for testing all authorization/authentication workflows.

## 🚀 Quick Start

```bash
# Start the server
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# Open in browser
open http://localhost:8000
```

The UI will be available at `http://localhost:8000` (redirects to `/static/index.html`)

## 🎯 Features

### Role-Based Workspaces

#### 1. Operator Workspace (Blue Badge)
**Purpose**: Data entry and submission

**Capabilities**:
- ✅ Create new data entries
- ✅ View only own entries (field-level filtering)
- ✅ Edit unconfirmed (draft) entries
- ✅ Submit entries for review
- ✅ View entry history

**Workflow**:
1. Fill in entry form with title, data (JSON), and type
2. Click "Create Entry" to create a draft
3. Edit draft if needed (Update button)
4. Click "Submit" to send for supervisor review

**Permission Testing**:
- Operators CANNOT see other users' entries
- Operators CANNOT confirm or reject entries
- Operators CANNOT view supervisor/auditor fields

---

#### 2. Supervisor Workspace (Green Badge)
**Purpose**: Review, confirm, reject, and correct entries

**Capabilities**:
- ✅ View ALL entries (cross-operator visibility)
- ✅ Filter by status (Pending, Confirmed, Rejected, Corrected)
- ✅ Confirm submitted entries
- ✅ Reject submitted entries with reason
- ✅ Correct confirmed/rejected entries (preserves history)
- ✅ View complete event history

**Workflow**:
1. Click "Load All Entries" to see entries
2. Filter by status as needed
3. For **submitted** entries:
   - Click "Confirm" to approve (add optional note)
   - Click "Reject" to reject with reason
4. For **confirmed/rejected** entries:
   - Click "Correct" to modify (preserves original)
   - Add correction reason
   - Submit correction

**State Transitions**:
```
draft → submitted → confirmed
                    ↘ rejected
confirmed → corrected
rejected → corrected
```

**Permission Testing**:
- Supervisors CAN see all operators' entries
- Supervisors CANNOT create entries
- Field-level filtering shows workflow details

---

#### 3. Auditor Workspace (Orange Badge)
**Purpose**: Read-only audit and compliance

**Capabilities**:
- ✅ Read-only access to ALL data
- ✅ Complete event history for all entries
- ✅ Audit log search and filtering
- ✅ Export audit logs (JSON)
- ✅ View full field details (no filtering)

**Workflow**:
1. View statistics (total events, audit logs)
2. Search audit trail by keyword
3. Load audit trail to see all entries
4. Click "Full History" on any entry to see complete timeline
5. Export audit log for compliance reporting

**Permission Testing**:
- Auditors have READ-ONLY access (no write buttons)
- Auditors CAN see all fields including workflow details
- Auditors CAN see correction history and reasons

---

#### 4. Admin Dashboard (Red Badge)
**Purpose**: System administration and monitoring

**Capabilities**:
- ✅ System health check
- ✅ Database status monitoring
- ✅ System metrics and statistics
- ✅ View all system events
- ✅ Full access to all data

**Workflow**:
1. View real-time system health indicators
2. Click "Health Check" for detailed status
3. Click "Metrics" for system statistics
4. Click "System Events" for event log

**Permission Testing**:
- Admin bypasses all policy checks
- Full visibility into all system components

---

## 📋 Test Scenarios

### Happy Path (Complete Workflow)
```
1. Switch to OPERATOR
2. Create a new entry (draft)
3. Submit the entry
4. Switch to SUPERVISOR
5. Load all entries, filter by "submitted"
6. Confirm the entry
7. View event history to see both events
```

### Rejection Path
```
1. Switch to OPERATOR
2. Create and submit an entry
3. Switch to SUPERVISOR
4. Find the submitted entry
5. Reject with a reason
6. View event history - see rejection event
```

### Correction Workflow (Preserves History)
```
1. Switch to SUPERVISOR
2. Load all entries, find a confirmed entry
3. Click "Correct"
4. Modify data, add correction note
5. Submit correction
6. View event history - see:
   - Original data.created event
   - Original data.confirmed event
   - New data.corrected event with previous_data preserved
```

### Permission Boundary Testing
```
1. Switch to OPERATOR
2. Note: You only see YOUR entries
3. Switch to SUPERVISOR
4. Note: You see ALL entries from all operators
5. Switch to AUDITOR
6. Note: Read-only, no action buttons
7. View event history for any entry - full details visible
```

### Field-Level Filtering Test
```
1. Switch to OPERATOR
2. Create an entry
3. Submit the entry
4. Switch to SUPERVISOR
5. Confirm the entry
6. Switch back to OPERATOR
7. View the entry's history
8. Note: You CANNOT see the confirmation details (hidden by field filtering)
9. Switch to AUDITOR
10. View the same entry's history
11. Note: You CAN see all details including confirmation
```

### Immutability Verification
```
1. Create any entry
2. Submit/confirm/correct it
3. View the event timeline
4. Notice: Each action creates a NEW event
5. Corrections preserve previous_data in payload
6. No events are ever modified or deleted
```

### Concurrency Test
```
1. Switch to OPERATOR
2. Create multiple entries rapidly
3. Submit them all
4. Switch to SUPERVISOR
5. Load all entries - all should be visible
6. Verify each has unique event IDs and timestamps
```

## 🧪 Testing Checklist

### Operator Tests
- [ ] Create entry with valid JSON data
- [ ] Create entry with invalid JSON (should show error)
- [ ] Update draft entry
- [ ] Submit entry (status changes to submitted)
- [ ] Try to update submitted entry (button should be hidden)
- [ ] Try to view other operators' entries (should not be visible)
- [ ] View own entry event history

### Supervisor Tests
- [ ] Load all entries (should see cross-operator data)
- [ ] Filter by status (submitted, confirmed, rejected, corrected)
- [ ] Confirm submitted entry (status → confirmed)
- [ ] Reject submitted entry with reason (status → rejected)
- [ ] Correct confirmed entry (preserves previous data)
- [ ] View complete event history
- [ ] Verify field-level filtering shows workflow details

### Auditor Tests
- [ ] Load audit trail
- [ ] Search audit logs by keyword
- [ ] Export audit log (JSON file download)
- [ ] View all entries (read-only)
- [ ] View full event history for any entry
- [ ] Verify no write buttons available
- [ ] Verify all fields visible (no filtering)

### Admin Tests
- [ ] View system health
- [ ] Check database status
- [ ] Load system metrics
- [ ] View system events timeline
- [ ] Verify admin bypass working (can see everything)

### Cross-Role Tests
- [ ] Operator creates → Supervisor confirms
- [ ] Operator creates → Supervisor rejects
- [ ] Supervisor corrects → History shows both versions
- [ ] Auditor sees all details that Operator cannot
- [ ] Multiple operators work simultaneously

## 🎨 UI Features

### Visual Indicators
- **Status Badges**: Color-coded by state (draft=blue, submitted=yellow, confirmed=green, rejected=red, corrected=purple)
- **Role Badges**: Color-coded dots for each role
- **Event Timeline**: Visual timeline showing event history
- **Response Box**: Real-time API response logging

### Data Display
- **Entry Cards**: Show entry ID, status, data preview, timestamps
- **Event Items**: Show event type, actor, timestamp, and payload
- **Statistics**: Dashboard-style stat cards for key metrics
- **API Response**: Developer-style console output

### User Experience
- **Single Page Application**: Fast, no page reloads
- **Role Switching**: One-click role changes
- **Mock Data**: Pre-populated with sample data for immediate testing
- **Responsive Design**: Works on desktop and tablets

## 🔧 Technical Details

### Architecture
- **Frontend**: Vanilla JavaScript, HTML, CSS (no framework dependencies)
- **State Management**: In-memory mock data (resets on refresh)
- **API Integration**: Ready to connect to real backend API
- **Styling**: Custom CSS with gradients and modern design

### File Structure
```
static/
└── index.html          # Main UI (self-contained)

app/
└── main.py            # Updated to serve static files
```

### Extension Points
To connect to real API:
1. Replace mock data functions with actual fetch() calls
2. Add JWT authentication headers
3. Handle real API responses and errors
4. Store auth token in localStorage

## 📊 Mock Data

The UI includes pre-populated mock data:
- 3 sample entries (submitted, confirmed, rejected)
- 10+ sample events
- 2 sample audit logs

This allows immediate testing without backend setup.

## 🚨 Known Limitations (Mock Mode)

- **No persistence**: Data resets on page refresh
- **No real API**: All data is client-side mock data
- **No authentication**: Role switching is simulated
- **Single user**: All actions appear to come from one user per role

To test with real backend, the UI can be easily extended to make actual API calls.

## 🎓 Educational Value

This UI demonstrates:
1. **Event Sourcing**: Every action creates immutable events
2. **CQRS**: Separate read/write models
3. **Field-Level Security**: Different data visible by role
4. **State Machines**: Clear state transitions
5. **Audit Trail**: Complete history of all actions
6. **Role-Based Access**: Four distinct permission levels

Perfect for learning about authorization systems and event-driven architectures!
