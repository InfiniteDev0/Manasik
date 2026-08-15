You are my product designer and senior SaaS engineer.

I am building Baraka Travels: a multi-tenant SaaS dashboard for Hajj and Umrah travel agencies.

The first target customer is a small-to-medium agency that needs simplicity. The product may become more advanced later, but the MVP must help an agency manage one complete Umrah or Hajj departure from booking to completion.

Do not design this as a generic travel dashboard. Design it as a pilgrim operations system.

PRODUCT VISION

Baraka Travels helps Hajj and Umrah agencies take a customer from inquiry to departure without losing track of:

- Pilgrim details
- Package selection
- Booking status
- Passport, visa, and other documents
- Deposit and installment payments
- Unpaid balances
- Departure group assignment
- Basic trip information

The central product workflow is:

Create Package
→ Add Pilgrim
→ Create Booking
→ Track Documents and Payments
→ Assign to Departure Group
→ Complete Trip

Every page must support this workflow. Nothing should feel disconnected.

CORE RULES

1. Every agency has its own workspace and cannot see another agency’s data.
2. A booking connects the pilgrim to the package they purchased.
3. Each booking creates one invoice.
4. Payments are individual records attached to an invoice.
5. Never let staff manually type a “remaining balance.”
6. Remaining balance is always calculated:

balance_due = invoice_total - sum(all recorded payments)

7. A pilgrim can have multiple bookings over time.
8. A group is one actual departure cohort, such as:
   “Ramadan Umrah — March 2027 — Group A”
9. A confirmed booking can be assigned to one group.
10. Documents belong primarily to the pilgrim, but their completion status must be visible from the booking and group pages.
11. Do not build logic yet unless specifically requested. First create a well-structured, high-fidelity frontend prototype with realistic mock data.

MVP SIDEBAR

Keep the MVP sidebar focused:

- Dashboard
- Pilgrims
- Packages
- Bookings
- Groups
- Payments
- Documents
- Settings

Hide these for now or display them as “Coming soon”:
- Hotels
- Transport
- Flights
- Calendar
- Staff
- Communication
- Reports
- Advanced integrations
- Platform admin panel

PAGE REQUIREMENTS

1. DASHBOARD

Purpose:
Answer one question: “What needs my attention today?”

Display:
- Total active pilgrims
- Upcoming departures
- Total outstanding balance
- Overdue payments
- Pending documents
- Confirmed bookings this month

Main dashboard sections:
- Upcoming departure groups with date, package, group name, guide, confirmed pilgrims, capacity, and readiness status
- Outstanding payments table showing pilgrim, package, total price, paid amount, balance due, due date, and payment status
- Pending documents table showing pilgrim, missing document, booking, group, and urgency
- Recent activity feed: booking created, payment recorded, passport uploaded, pilgrim assigned to group
- Quick actions:
  - Add pilgrim
  - Create package
  - Create booking
  - Record payment
  - Create group

Dashboard cards must link to the relevant filtered page.

2. PILGRIMS PAGE

Purpose:
The agency’s customer and traveler CRM.

List columns:
- Pilgrim name
- Phone number
- Nationality
- Current booking/package
- Document status
- Payment status
- Group
- Status
- Last updated

Filters:
- Has missing documents
- Has outstanding balance
- Assigned to group
- Not assigned to group
- Traveling soon
- Completed trip

Pilgrim profile tabs:
- Overview
- Bookings
- Documents
- Payments
- Notes
- Activity

Pilgrim profile information:
- Full name
- Photo
- Date of birth
- Gender
- Phone and email
- Nationality
- Passport number and expiry date
- Emergency contact
- Medical or accessibility notes
- Booking history
- Document checklist
- Payments summary
- Internal notes
- Activity timeline

3. PACKAGES PAGE

Purpose:
Create reusable Umrah and Hajj offers that staff can sell.

Package list columns:
- Package name
- Type: Umrah or Hajj
- Duration
- Departure date
- Return date
- Selling price
- Capacity
- Booked seats
- Available seats
- Status: draft, active, sold out, completed

Create/edit package fields:
- Package name
- Type
- Destination or route
- Departure and return dates
- Duration
- Price per pilgrim
- Capacity
- Deposit requirement
- Payment due date
- Description
- What is included
- What is not included
- Basic itinerary
- Status

For MVP, do not build complex hotel, flight, or transport inventory. Allow these as simple text sections within the package or group.

Package detail page:
- Overview
- Bookings
- Groups
- Capacity
- Payment summary
- Notes

4. BOOKINGS PAGE

Purpose:
This is the commercial record of a pilgrim purchasing a package.

Booking creation flow:
- Select existing pilgrim or create a new one
- Select package
- Confirm price
- Apply optional discount
- Select deposit requirement
- Set payment due date
- Create booking
- Automatically create invoice

Booking list columns:
- Booking reference
- Pilgrim
- Package
- Booking date
- Total amount
- Amount paid
- Balance due
- Payment status
- Booking status
- Group assignment

Booking status:
- Draft
- Pending
- Confirmed
- Cancelled
- Completed

Booking detail page:
- Booking overview
- Pilgrim summary
- Package summary
- Payment card
- Documents checklist
- Group assignment
- Internal notes
- Activity history

The payment card must clearly show:
- Package price
- Discount
- Final invoice total
- Total received
- Balance due
- Due date
- Status
- Payment history
- “Record payment” button

5. PAYMENTS PAGE

Purpose:
Give the finance user one reliable place to follow all money owed and received.

Use an invoice and payment model.

Invoice fields:
- Invoice number
- Booking
- Pilgrim
- Invoice total
- Total received
- Balance due
- Due date
- Status

Payment fields:
- Payment reference
- Invoice
- Amount
- Payment date
- Method: Cash, M-Pesa, Bank Transfer, Card
- External reference, such as an M-Pesa transaction code
- Optional receipt attachment
- Recorded by

Automatic status rules:

If total_paid equals 0:
status = Unpaid

If total_paid is greater than 0 and less than invoice_total:
status = Partially paid

If total_paid equals invoice_total:
status = Paid

If balance_due is greater than 0 and the due date has passed:
status = Overdue

Payments overview cards:
- Total invoiced
- Total collected
- Outstanding balance
- Overdue balance
- Payments received this month

Payments list columns:
- Invoice number
- Pilgrim
- Package
- Group
- Invoice total
- Paid
- Balance
- Due date
- Status

Filters:
- Unpaid
- Partially paid
- Paid
- Overdue
- Payment method
- Group
- Package

Record payment modal:
- Amount received
- Payment date
- Payment method
- Payment reference
- Receipt upload
- Internal note

Do not allow a payment amount higher than the remaining balance in the MVP prototype unless an explicit “overpayment/credit” feature is designed later.

6. DOCUMENTS PAGE

Purpose:
Ensure every pilgrim is ready before departure.

Document types for MVP:
- Passport
- Passport photo
- Visa
- Vaccination certificate
- Travel insurance
- Contract / booking agreement

Document list columns:
- Pilgrim
- Document type
- Status
- Expiry date
- Booking
- Group
- Uploaded date
- Reviewed by

Document statuses:
- Missing
- Uploaded
- Under review
- Approved
- Rejected
- Expired

Important:
- Passport expiry should be prominent.
- Missing or rejected documents must appear on the dashboard.
- A pilgrim’s document readiness should be visible on their profile, booking, and group.

7. GROUPS PAGE

Purpose:
Manage the actual people departing together.

Example group:
Ramadan Umrah — March 2027 — Group A

Group fields:
- Group name
- Linked package
- Departure date
- Return date
- Capacity
- Confirmed pilgrims
- Assigned guide
- Group status
- Meeting point
- Basic itinerary
- Hotel notes
- Transport notes
- Flight notes
- Internal notes

Group statuses:
- Planning
- Open for assignment
- Ready for departure
- Traveling
- Completed

Group detail page tabs:
- Overview
- Pilgrims
- Documents readiness
- Payments readiness
- Itinerary
- Notes
- Activity

Show readiness checks:
- Confirmed pilgrims
- Pilgrims with unpaid balances
- Pilgrims with missing documents
- Unassigned guide
- Capacity remaining

A group should not show as “Ready for departure” if the agency still has missing documents or major unpaid balances. For the prototype, show warnings instead of enforcing hard blocks.

8. SETTINGS PAGE

Purpose:
Manage the agency workspace.

Settings sections:
- Agency profile: name, logo, phone, email, address
- Preferences: default currency, timezone, date format
- Branding: logo and brand color
- Team: placeholder team members and roles
- Roles and permissions: Owner, Operations, Finance, Guide
- Language: English, Arabic, French, Spanish
- Billing: coming soon
- Security: coming soon

ROLE VIEWS

Prepare the interface for role-based dashboards later:

Owner:
- Full access
- Business performance and operational overview

Operations:
- Pilgrims, bookings, documents, groups, tasks

Finance:
- Bookings, invoices, payments, unpaid balances

Guide:
- Only assigned groups, group schedule, pilgrim list, and readiness information

DESIGN SYSTEM

- Premium, calm, modern, trustworthy dashboard.
- Dark interface matching the existing visual direction.
- Near-black background, charcoal surfaces, subtle borders.
- Restrained emerald or teal accent color.
- Manrope for headings.
- Outfit for body text.
- Use shadcn/ui components, including the shared shadcn table component.
- Create responsive desktop, tablet, and mobile states.
- Tables must work on small screens through stacked cards, horizontal scrolling, or a deliberate mobile pattern.
- Use clear status badges with accessible contrast.
- Avoid generic empty dashboard cards. Use realistic mock data so the product workflow is obvious.
- Use a realistic Kenyan agency context in mock data:
  - Currency: KES
  - Payment methods: Cash, M-Pesa, Bank Transfer, Card
  - But make currency configurable in Settings.

INTERNATIONALIZATION

Prepare all visible interface strings for translations:
- English
- Arabic
- French
- Spanish

Only English must be fully written now.
Do not hardcode visible UI copy inside components.
Prepare RTL support in layouts for Arabic later.

TECHNICAL STRUCTURE

Use a monorepo structure that can grow:

apps/
  web/
packages/
  ui/
  config/
  types/
  i18n/

Suggested frontend entities/types:
- Agency
- User
- Pilgrim
- Package
- Booking
- Invoice
- Payment
- Document
- Group
- Guide
- Activity

Create realistic mock relational data:
- A pilgrim has bookings
- A booking belongs to a pilgrim and package
- An invoice belongs to a booking
- Payments belong to an invoice
- A booking can be assigned to a group
- Documents belong to a pilgrim and appear within relevant booking/group views

IMPORTANT DELIVERY ORDER

Phase 1:
- Set up monorepo
- Create design system and reusable layout
- Build the dashboard shell
- Implement the MVP navigation
- Build all pages with connected realistic mock data
- Make page navigation and detail views feel fully connected
- Do not build backend logic or authentication

Phase 2 later:
- Authentication
- Multi-tenant database
- Real CRUD
- File uploads
- Resend email
- M-Pesa/payment integrations
- Automated reminders
- Subscription billing
- WhatsApp
- Reports
- External hotel, flight, and transport integrations

When implementing, start with these screens in this order:
1. Packages
2. Pilgrims
3. Bookings
4. Payments
5. Groups
6. Documents
7. Dashboard
8. Settings

At the end, explain:
- What components and pages were created
- Where mock data lives
- How the data relationships work
- Which items are UI-only and will need backend implementation later 