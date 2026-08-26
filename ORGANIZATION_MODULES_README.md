# CIVOX Organization Modules & Functional Documentation

- Audit date: 2026-08-26
- Source of truth: the current repository working tree, including its uncommitted frontend and backend changes. Generated build artifacts under `dist/` and `target/` were not treated as independent implementations.

## 1. Purpose

This document is the functional reference for the CIVOX Organization tenant experience: the public Organization Front Office, authenticated member features, Organization Back Office, and the SaaS-controlled services that grant, bill, or provision Organization capabilities.

It records only behavior supported by source code. Catalog descriptions and visible labels are not treated as proof that the advertised feature exists. Where the repository contains only a catalog record, route, role name, empty state, or inert control, that limitation is stated explicitly.

### Status vocabulary

| Status | Meaning in this document |
|---|---|
| `Implemented` | The principal flow has connected frontend and backend support. |
| `Partially Implemented` | A usable slice exists, but visible claims, normal lifecycle operations, or connected surfaces are incomplete. |
| `Frontend Only` | A usable UI exists without matching persistence/API behavior. |
| `Backend Only` | APIs/domain behavior exist without an Organization-facing UI. |
| `Placeholder` | A route, catalog entry, label, or control exists, but the functional workflow does not. |
| `Disabled` | Code exists but is explicitly disabled. |
| `Not Reachable` | A page/component exists but normal navigation cannot reach it. |
| `Broken / Requires Fix` | The implemented path has a code-supported functional or security defect. |
| `Unknown` | The current implementation does not establish the state. |

## 2. Organization Area Overview

CIVOX resolves a tenant from the request host, for example `city-montreal.lvh.me`. The tenant shell loads public organization identity, settings, and visible modules. A signed-in user's JWT carries `organizationId`, `organizationSlug`, and role; backend tenant checks bind Organization APIs to both the host-resolved tenant and JWT tenant, except for the intentional `SUPER_ADMIN` bypass.

The current Organization product is composed of:

- a public tenant home and module directory;
- generic persisted participation content for Voting, Concertation, and Youth Space;
- a dedicated Surveys domain;
- a role-gated Back Office with dashboard/analytics, users, content/module visibility, surveys, branding, and module requests;
- backend-only subscription, billing, and module-purchase services;
- public onboarding, quote, payment, and automatic tenant provisioning;
- catalog-only Events, Complaints, and general News entries.

No Organization Opportunity, Application/Review, Outcome/Impact, Event registration, Invitation, Document/Media library, or real Moderation domain was found.

## 3. Module Inventory

| Module / functional area | Purpose | Frontend | Backend | Main functions | Status |
|---|---|---:|---:|---|---|
| Tenant Home & Public Organization Page | Present organization branding and public participation entry points | Yes | Yes | Hero, public KPIs, module spotlight, about CTA | Partially Implemented |
| Module Directory | Discover enabled public modules | Yes | Yes | Search, content-state filters, counts, open module | Implemented |
| Organization Dashboard | Back-office operational overview | Yes | Yes | Module/content counters, quick actions, embedded analytics | Partially Implemented |
| Voting (`VOTE`) | Publish polls and collect one answer per member | Yes | Yes | Draft/publish, schedule, respond/update, controlled results | Partially Implemented |
| Concertation (`CONFERENCE`) | Publish consultation briefs and collect attendance intent | Yes | Yes | Draft/publish, schedule, attend/not attend, controlled results | Partially Implemented |
| Youth Space / Youth News (`YOUTHSPACE`) | Publish youth updates and collect a reaction | Yes | Yes | Draft/publish, schedule, react/update | Partially Implemented |
| Surveys (`SURVEYS`) | Build structured questionnaires and analyze submissions | Yes | Yes | Eight question types, publish/archive, response update, results, CSV | Partially Implemented |
| Events (`EVENTS`) | Catalog promises event publishing/registration | Empty-state route only | No event domain | Open placeholder only | Placeholder |
| Complaints (`COMPLAINTS`) | Catalog promises issue routing/tracking | Empty-state route only | No complaint domain | Open placeholder only | Placeholder |
| General News (`NEWS`) | Catalog promises announcements/news feed | Empty-state route only | No general-news domain | Open placeholder only; route can resolve Youth Space | Broken / Requires Fix |
| Users & Team | Manage tenant accounts and roles | Yes | Yes | List/search/filter/export, direct-create, archive/restore | Partially Implemented |
| Branding & Settings | Configure tenant visual identity and copy | Yes | Yes | Colors, logo/banner URLs, home/welcome/footer copy, preview | Partially Implemented |
| Module Grants, Visibility & Content Management | Apply SaaS grants and tenant visibility | Yes | Yes | Filter modules, show/hide, create supported content, archive latest | Partially Implemented |
| Module Requests | Request additional SaaS modules | Yes | Yes | Catalog, submit request, status history, SaaS decision | Partially Implemented |
| Analytics (`ANALYTICS`) | Organization-scoped KPIs, charts, activity, insights | Embedded in dashboard | Yes | 15 KPIs, 8 backend chart series, timeline, rule-based insights | Partially Implemented |
| Subscription & Billing | Control tenant entitlement and paid module activation | No tenant page | Yes | Subscription state, billing overview, Stripe checkout/PaymentIntent | Backend Only |
| Authentication & My Profile | Tenant login and personal profile self-service | Yes | Yes | Login/logout, view profile, edit four personal fields | Implemented |
| Notifications | Notify organizations about onboarding/module decisions | Inert bell only | Email only | Onboarding, module grant/rejection, password reset emails | Partially Implemented |
| Moderation | Intended moderation/operator responsibility | Role/labels only | No moderation domain | No review/report workflow | Placeholder |
| Organization Onboarding & Provisioning | Create a paid tenant from a public request | Yes, outside tenant BO | Yes | Request, quote, payment, modules/settings/admin provisioning | Partially Implemented |

## 4. Organization Navigation

### Actual navigation and routes

```text
Public platform host (lvh.me / localhost)
├── /                              Platform home
├── /organizations                 Active organization directory
├── /request-organization          Organization access request
├── /payment/:token                Quote/payment page
├── /payment/:token/success        Legacy-token success/activation page
├── /payment/:token/cancel         Payment cancellation page
├── /stripe/success                Stripe success/synchronization page
└── /stripe/cancel                 Stripe cancellation page

Tenant host ({slug}.lvh.me)
├── /                              Organization home
├── /modules                       Visible module directory
├── /modules/surveys               Published survey list
├── /modules/surveys/:surveyId     Survey detail/response
├── /modules/:moduleSlug           Generic module list or honest empty state
├── /modules/:moduleSlug/:contentId Generic content detail/participation
├── /login                         Tenant login
├── /me                            My Info (authenticated)
├── /profile/edit                  Edit personal profile (authenticated)
└── /backoffice                    Dashboard (Admin/Manager/Moderator/Super Admin)
    ├── /backoffice/users          Users (Admin/Manager/Super Admin)
    ├── /backoffice/modules        Content Management (Admin/Super Admin)
    ├── /backoffice/surveys        Survey workspace (Admin/Manager/Super Admin)
    │   ├── /new                   Create survey
    │   ├── /:surveyId/edit        Edit survey
    │   └── /:surveyId/results     Results and CSV
    ├── /backoffice/design         Branding & Settings (Admin/Moderator/Super Admin)
    ├── /backoffice/module-requests Module Request Desk (Admin/Moderator/Super Admin)
    └── /backoffice/create/:contentType
        ├── vote
        ├── concertation
        └── youth-news
```

### Existing deep links not shown as distinct navigation entries

| Route | Actual component | Reachability/status |
|---|---|---|
| `/backoffice/content` | `OrganizationManageModulesPage` | Direct-route alias; sidebar links to `/backoffice/modules`. |
| `/backoffice/settings` | `OrganizationDesignPage` | Direct-route alias; sidebar links to `/backoffice/design`. |
| `/modules/vote`, `/modules/concertation`, `/modules/youth-news` | `OrganizationModulePage` | Reached from dynamic module cards, not fixed top navigation. |
| `/modules/events`, `/modules/complaints`, `/modules/news` | `OrganizationModulePage` | Reached when granted/visible; renders an empty “does not yet expose interactive content” state. |
| Analytics | Embedded in `/backoffice` | No dedicated `/backoffice/analytics` route. `/modules/analytics` is excluded from the public module list by its `BACK_OFFICE` scope. |

### Navigation placeholders and inconsistencies

- The Back Office search input has no state, handler, or search results.
- The Back Office notification bell has no click handler or panel.
- “Your Organizations” displays only the current organization and its button performs no switch.
- Footer Help Center, Contact Us, and Privacy Policy all point to the home page's `#about-organization` anchor.
- The Organization model supports only one `User.organization` foreign key, so the visible organization switcher is inconsistent with the data model.
- The public directory constructs tenant links with a hardcoded `http://{slug}.lvh.me:5173` development URL.

## 5. Tenant Home & Organization Public Page

### Purpose and entry points

- Route: `/` on a tenant host.
- Component: `OrganizationDetailsPage.jsx` inside `OrganizationLayout.jsx`.
- APIs: `GET /public/organization`, `/public/organization/settings`, `/public/organization/modules`, public content endpoints, and public surveys.

### Screen behavior

The page renders the configured banner, home title, welcome text, organization name/logo, “Explore Modules” and “Learn More” links, four public summary cards, up to the first three visible modules, and a final participation CTA. The About target is a CTA panel, not a full organization profile with address, contact, sectors, social links, or mission fields.

| KPI/card | Source | Trust assessment |
|---|---|---|
| Active Modules | Count of SaaS-granted, organization-enabled, globally active, front-office-scoped modules returned by `/public/organization/modules` | Real backend data. |
| Published Items | Sum of currently public generic content plus published surveys loaded by the layout | Real, but excludes scheduled generic content until opening and unsupported catalog modules. |
| Citizen Responses | Sum of response/submission counts returned with public items/surveys | Real persisted counts; includes authenticated responses only. |
| Tenant Visibility = `Live` | Literal frontend string | Hardcoded and potentially misleading; not derived from organization/subscription status. |
| Spotlight modules | First three visible modules in backend display order | Real grant/visibility data. Counts are zero for modules without supported content loaders. |

### Capabilities

| Capability | Available | Frontend | Backend | Notes |
|---|---:|---|---|---|
| View public identity | Yes | Tenant home/layout | Public branding/settings APIs | Name and description come from `Organization`; visual copy from `OrganizationSettings`. |
| View visible modules | Yes | Spotlight and `/modules` | `OrganizationModuleService` | Subscription, global active flag, grant, visibility, and scope apply. |
| View contact/address | No | Not rendered | Fields exist in `Organization` and public DTO | Model data is disconnected from the tenant page. |
| Edit organization core identity | No | Name is read-only in settings | Only SaaS organization update API | Tenant cannot edit name, email, phone, address, description, or slug. |
| View dedicated public profile/about page | No | About is an anchor | No tenant profile route | Public directory leads to tenant home only. |

## 6. Organization Dashboard

### Purpose and entry points

- Route/menu: `/backoffice` → Dashboard.
- Frontend guard: `SUPER_ADMIN`, `ADMIN`, `MANAGER`, `MODERATOR`.
- Module/summary API: `GET /org/{organizationId}/modules`.
- Analytics API: `GET /org/{organizationId}/analytics/dashboard` when the `ANALYTICS` grant is active and visible.

### Operational summary

The first four cards use the tenant's module list and the public module insights already loaded by the layout.

| Card | Calculation | Assessment |
|---|---|---|
| Granted modules | Number of active, granted, back-office-scoped rows returned by backend | Real, but an inactive subscription makes the service return an empty list. |
| Visible modules | Granted rows where `enabledByOrganization` is true | Real. |
| Published content | Publicly visible generic content/surveys summed for enabled modules | Real public count; not a count of all management records. |
| Responses | Public item response/submission totals | Real persisted data. |
| Quick Actions | First creatable enabled module; Users; Module Visibility; Branding | Role- and grant-derived links. Only the first eligible create action is shown. |
| Enabled Modules | First five enabled back-office modules | Real grant data; no pagination or “all” unless the user has module-visibility permission. |
| Operational Snapshot | Enabled/hidden modules, public items, responses | Derived from the same real data. |

### Analytics dashboard

Analytics is embedded rather than a separate page. Frontend and backend both require `ADMIN`, `MANAGER`, or `SUPER_ADMIN`; the backend additionally checks active subscription, global module activity, SaaS grant, organization visibility, and back-office scope.

#### KPIs

| KPI | Backend calculation | Trust / limitation |
|---|---|---|
| Total citizens/users | All `User` rows for organization | Real. Includes archived/disabled accounts. |
| Enabled member accounts | `enabled=true` and not archived | Real account-state count; not behavioral activity. |
| New users this month | User creation timestamp from current month start | Real. |
| Total consultations | Count of all `CONCERTATION` content items | Real item count, including drafts/archived records. |
| Vote/poll items | Count of all `VOTE` content items | Real item count, not number of votes. |
| Module access requests | All module request rows | Real. |
| Youth news items | All `YOUTH_NEWS` content items | Real item count. |
| Total events | Literal backend `0` | Placeholder; no Event domain. |
| Participation rate | Unique users with a generic response or survey submission ÷ enabled users (or total users if none enabled) | Calculated from real data; lifetime numerator versus current account denominator. |
| Vote/consultation engagement | Vote + consultation responses ÷ ((vote items + consultation items) × enabled users) | Calculated; includes draft items in the denominator because content counts are unfiltered. |
| Recorded content responses | Generic responses + survey submissions | Real total, but label understates that surveys are included. |
| Surveys | All survey rows | Real; includes drafts/archived. |
| Survey responses | Survey submissions | Real. |
| Pending module requests | Module requests with `PENDING` | Real, although internal key remains `pending_moderation`. |
| Recent activity (30 days) | User creations + content creations + responses + module requests + survey submissions | Real event count; draft creation is included. |

#### Charts and feeds

| Backend series | Rendered? | Contents / caveat |
|---|---:|---|
| Engagement evolution | Yes | Six fixed recent months; votes, attending consultations, reactions, module requests, survey submissions; `comments` is hardcoded 0. Module requests are staff/commercial actions but are presented as engagement. |
| User growth by month | Yes | New accounts plus cumulative values only within the six-month window; “cumulative users” is not lifetime total. “Enabled users” is cumulative enabled accounts created in that window. |
| Activity by module | Yes | Interactions for enabled modules; unsupported modules remain zero. |
| Participation by content type | Yes | Response/submission count divided by current enabled-user count; may exceed 100% because members can answer multiple items. |
| Requests status distribution | Yes | Pending/approved/rejected module requests. |
| Top content by interactions | Yes | Top five generic content items; surveys are not included. |
| Content created by month | No | Returned by backend but unused by current dashboard. |
| Users by role | No | Returned by backend but unused by current dashboard. |
| Recent activity timeline | Yes | Latest 12 user/content/response/request/survey events; all content creation is titled “Content published,” even for drafts. |
| Smart insights | Yes | Deterministic rules, not AI: month-over-month engagement, most active module, low participation, pending requests, new registrations. |

### Dashboard capability matrix

| Capability | Available | Notes |
|---|---:|---|
| View organization-scoped KPIs | Yes | Requires Analytics entitlement and role. |
| Filter by date/module | No | Windows are fixed in backend; no UI filters. |
| Export dashboard | No | No endpoint or button. |
| Drill into chart data | No | Tooltips only; no detail routes. |
| Refresh manually | No | Data loads on mount. |
| View disabled/forbidden/error states | Yes | Explicit UI states. |

## 7. Generic Participation Content Foundation

Voting, Concertation, and Youth Space share `OrganizationContentItem`, `OrganizationContentResponse`, `OrganizationContentController`, `OrganizationContentService`, the generic module list/detail page, and the content composer.

### Shared lifecycle and rules

- Status is stored as `published` and computed as `DRAFT`, `SCHEDULED`, `OPEN`, or `CLOSED`.
- A future `openingAt` hides generic content completely from public/member listings until opening.
- `closingAt` stops responses but keeps published content readable.
- One response row per organization/content/user is enforced; submitting again updates the existing response.
- Results can be `AFTER_RESPONSE`, `AFTER_CLOSE`, or `PRIVATE`. Admin/Manager/Super Admin reads force result visibility; Moderator does not.
- `featured` is persisted but generic public lists neither sort nor visually feature it.
- Creation and management require the module to be globally active, SaaS-granted, organization-enabled, and covered by an active subscription.

### Shared APIs

| Method | Endpoint | Controller / service | Purpose | Access |
|---|---|---|---|---|
| GET | `/public/organization/content/{type}` | `PublicOrganizationController` → `OrganizationContentService.getCurrentOrganizationPublicContent` | Public opened/published content | Public tenant host; module/subscription checks |
| GET | `/org/{organizationId}/content/{type}` | `OrganizationContentController.listContent` | Visible member content | Any tenant role; tenant match |
| GET | `/org/{organizationId}/content/{type}?management=true` | Same | Include drafts/scheduled content | Admin/Manager/Super Admin |
| POST | `/org/{organizationId}/content/{type}` | `createContent` | Create draft or published item | Admin/Manager/Super Admin |
| POST | `/org/{organizationId}/content/{type}/{contentId}/response` | `saveContentResponse` | Create/update current user's response | Any tenant role; open item |
| PATCH | `/org/{organizationId}/content/{type}/{contentId}/published?published=…` | `updatePublicationStatus` | Archive/restore by publication flag | Admin/Manager/Super Admin |

### Shared capability matrix

| Capability | Available | Frontend | Backend | Notes |
|---|---:|---|---|---|
| Create | Yes | `/backoffice/create/:contentType` | POST content | Title/body required; vote has choices. |
| Read list/detail | Yes | Stable list and `:contentId` routes | Public/authenticated GET | No search, sorting control, or pagination. |
| Update content fields | No | No edit screen | No PUT/PATCH fields endpoint | Only response and publication state are mutable. |
| Delete | No | No action | No DELETE endpoint | Not implemented. |
| Archive/restore | Partial | Only latest item on each module card | Publication PATCH supports any ID | Backend capability is broader than UI. |
| Draft | Yes | “Publish immediately” checkbox | `published=false` | Management API can read drafts. |
| Schedule/open/close | Yes | Opening/closing datetime fields | Service-enforced | No explicit reopen action; change of dates is impossible because content edit is missing. |
| Feature | Stored only | Checkbox | `featured` field | No generic featured rendering/sorting. |
| Preview | Partial | Latest item modal | Reads public endpoint | Draft/scheduled/archived items cannot be previewed. |
| Share | Yes | Copies current detail URL | None | Clipboard-only client action. |
| View results | Yes | Detail response bars/counts | Policy-controlled DTO | No dedicated operator results/export page for generic content. |

## 8. Voting (`VOTE`)

### Purpose and entry points

- Public/member routes: `/modules/vote`, `/modules/vote/:contentId` (alias matching also accepts `votes`).
- Create route: `/backoffice/create/vote`.
- Content API type: `vote`; backend enum: `OrganizationContentType.VOTE`.

### Pages and actions

The composer accepts question/title, context/body, newline-separated choices, publish/draft, opening/closing times, result policy, and featured flag. The module page lists all currently public polls, opens stable details, lets a signed-in tenant member choose one published option, submit it, and update it while open. Result bars appear according to policy.

| Capability | Available | Requirements/result |
|---|---:|---|
| Create poll | Yes | Admin/Manager/Super Admin; active `VOTE` entitlement; creates `OrganizationContentItem`. |
| Vote/update vote | Yes | Authenticated tenant user; open item; upserts one `OrganizationContentResponse`. |
| Validate choice | Yes | Backend requires answer to match a published option (case-insensitive). |
| Publish/archive | Partial | Create can publish; Content Management toggles only the latest item. |
| Edit choices/question | No | No content update API; closing/reopening dates cannot be changed later. |
| Eligibility/audience/visibility groups | No | Not confirmed from current implementation. |
| Export/results administration | No | Aggregate detail display only. |

## 9. Concertation (`CONFERENCE`)

### Purpose and entry points

- Public/member routes: `/modules/concertation`, `/modules/concertation/:contentId`; aliases include `conference` and `concertations`.
- Create route: `/backoffice/create/concertation`.
- Content API type: `concertation`; backend enum: `OrganizationContentType.CONCERTATION`.

The composer publishes a topic and participation brief. A signed-in user records `Participate` or `Not participate`; the backend stores a Boolean and returns participating/not-participating aggregates. All shared generic lifecycle and result policies apply.

| Capability | Available | Notes |
|---|---:|---|
| Create/publish consultation | Yes | Admin/Manager/Super Admin. |
| Attendance-intent response/update | Yes | Any authenticated tenant role while open. |
| Discussion threads/comments | No | Catalog description mentions them, but no entity, endpoint, or UI exists. |
| Moderation | No | No report/review state or action exists. |
| Attendee management/capacity | No | Not confirmed from current implementation. |

## 10. Youth Space / Youth News (`YOUTHSPACE`)

### Purpose and entry points

- Public/member routes: `/modules/youth-news`, `/modules/youth-news/:contentId`.
- Create route: `/backoffice/create/youth-news`.
- Content API type: `youth-news`; backend enum: `OrganizationContentType.YOUTH_NEWS`.

The composer publishes a headline/body with the shared lifecycle controls. A signed-in user can save the single `React` action; the stored response is updated in place.

| Capability | Available | Notes |
|---|---:|---|
| Create/publish youth update | Yes | Admin/Manager/Super Admin. |
| React/update reaction | Yes | Frontend submits `REACTED`; backend accepts any nonblank reaction string. |
| Categories/images/media | No | No fields, upload service, or editor. |
| General news editorial workflow | No | This implementation is only `YOUTHSPACE`; the separate `NEWS` module is a placeholder. |
| Featured rendering | No | Flag persists but does not affect generic listing. |

## 11. Surveys (`SURVEYS`)

### Purpose and entry points

- Front Office: `/modules/surveys`, `/modules/surveys/:surveyId`.
- Back Office: `/backoffice/surveys`, `/backoffice/surveys/new`, `/backoffice/surveys/:surveyId/edit`, `/backoffice/surveys/:surveyId/results`.
- Sidebar entry appears only for Admin/Manager/Super Admin when the visible `SURVEYS` module is present.

### Pages/screens

| Page | Information/actions |
|---|---|
| Survey list | Published surveys, featured marker, lifecycle, question/response counts, closing date; no search/filter/pagination. |
| Survey detail | All questions, saved answers, submission/update action, lifecycle, counts, deadline, policy-controlled aggregate results. |
| Survey workspace | All surveys for operators, lifecycle/status, question count, deadline, response count; Edit, Results, Publish Draft, Archive Published. |
| Survey editor | Title, description, status, featured, opening/closing, results policy, add/remove questions/options, required flag, eight answer types. |
| Survey results | Per-question aggregate bars, free-text answers for operators, CSV export. |

### Question types

`SINGLE_CHOICE`, `MULTIPLE_CHOICE`, `SHORT_TEXT`, `LONG_TEXT`, `RATING` (1–5), `YES_NO`, `NUMBER`, and `DATE` are rendered and validated by both UI and service. Choice questions require at least two nonblank options when saved. A published survey requires at least one question.

### Ownership, submission, and result rules

- `Survey` and `SurveySubmission` both carry organization ownership; repository detail lookups include organization ID.
- A unique constraint permits one submission per survey/user. Resubmission updates it while the survey is open.
- Anonymous visitors can read published surveys but cannot submit.
- Non-operator users see aggregate results after their submission, after close, or never, according to policy.
- Public visitors can see aggregate results only for `AFTER_CLOSE`; free-text results are never returned publicly.
- Admin/Manager/Super Admin can use the results endpoints and see free-text answers.
- Questions become structurally immutable after the first response. Metadata, dates, status, and visibility remain editable.

### Survey API

| Method | Endpoint | Controller / service | Purpose | Access |
|---|---|---|---|---|
| GET | `/public/organization/surveys` | `PublicOrganizationController` → `SurveyService.listPublic` | Published list | Public tenant host; entitlement checks |
| GET | `/public/organization/surveys/{surveyId}` | Same → `getPublic` | Published detail | Public tenant host |
| GET | `/org/{organizationId}/surveys` | `OrganizationSurveyController.list` | Participant or operator list | Any tenant role; operators also receive drafts/archived |
| GET | `/org/{organizationId}/surveys/{surveyId}` | `get` | Participant/operator detail | Tenant role; non-operators restricted to published |
| POST | `/org/{organizationId}/surveys` | `create` | Create survey | Admin/Manager/Super Admin |
| PUT | `/org/{organizationId}/surveys/{surveyId}` | `update` | Update metadata/questions/status | Admin/Manager/Super Admin |
| POST | `/org/{organizationId}/surveys/{surveyId}/submissions` | `submit` | Create/update own submission | Any tenant role; open survey |
| GET | `/org/{organizationId}/surveys/{surveyId}/results` | `results` | Full operator results | Admin/Manager/Super Admin |
| GET | `/org/{organizationId}/surveys/{surveyId}/results.csv` | `export` | CSV with timestamp, user ID/email, answers | Admin/Manager/Super Admin |

### Survey capability matrix

| Capability | Available | Notes |
|---|---:|---|
| Create/read/update | Yes | Connected UI/API. |
| Delete | No | No endpoint/action. |
| Draft/publish/archive | Yes | No separate restore button, but editor can change status. |
| Schedule/close | Yes | Derived from opening/closing timestamps. |
| Reopen | Yes, indirectly | Edit closing/status while permitted. |
| Duplicate | No | Not implemented. |
| Anonymous response | No | Authentication required. |
| Branching logic | No | Catalog description advertises branching, but model/editor/service contain no branching rules. |
| Reorder questions | Partial | Array position is persisted, but the editor has no move/drag controls. |
| View aggregate results | Yes | Policy-controlled participant view and unrestricted operator view. |
| View free-text results | Yes | Operator results endpoint/page only. |
| CSV export | Yes | Full submissions include user identity; no audit log is generated. |

### Persistence

`Survey` → ordered `SurveyQuestion` rows; `SurveySubmission` belongs to organization, survey, and user; `SurveyAnswer` joins a submission to a question. The reviewed SQL exists under `db/manual-migrations`, but the project has no Flyway/Liquibase runner and currently relies on `spring.jpa.hibernate.ddl-auto=update`.

## 12. Events (`EVENTS`)

### Evidence and current behavior

- Catalog initializer and frontend metadata define `EVENTS`, route `/modules/events`, `BOTH` scope, icon/category, prices, and a description promising publishing, registration, attendance, and reminders.
- If granted and enabled, it appears in public and management module cards.
- Opening `/modules/events` renders the generic “enabled but does not yet expose interactive content” empty state.
- No Event entity, DTO, repository, controller, service, API client, create route, registration, capacity, attendee, attendance, reminder, or analytics source exists.
- Dashboard “Total events” is hardcoded to `0`.

| Capability | Available | Status |
|---|---:|---|
| Open module | Yes | Placeholder empty state |
| Create/edit/publish event | No | Not implemented |
| Registration/capacity/attendees | No | Not implemented |
| Attendance/reminders/analytics | No | Not implemented |

## 13. Complaints (`COMPLAINTS`)

`COMPLAINTS` exists in the global catalog and frontend metadata at `/modules/complaints`. It can be granted, shown/hidden, and requested, but it has no content type, domain entity, API, creation screen, routing/assignment, status history, SLA, attachment, public tracking, or analytics implementation. The route displays the generic empty state. Status: `Placeholder`.

## 14. General News (`NEWS`)

`NEWS` exists as a separate catalog module at `/modules/news`, but it has no content type or backend news domain. It must not be confused with the implemented `YOUTHSPACE` → `YOUTH_NEWS` content type.

There is also a route-resolution defect: `OrganizationModulePage.moduleSlugMatches` accepts `news` as an alias for `YOUTHSPACE`. If both `YOUTHSPACE` and `NEWS` are visible and Youth Space appears first, `/modules/news` can resolve to Youth Space instead of the separate News module. General News remains a `Placeholder` with a potentially colliding route.

## 15. Organization User Management

### Purpose, routes, and screens

- Back Office route: `/backoffice/users`.
- Access: Super Admin, Admin, and Manager. Moderator and Citizen are rejected by route guards and backend RBAC.
- The page displays total, active, archived, and "pending" summaries; a searchable/filterable table; direct user creation; CSV export; `mailto:` contact; and archive/restore actions.

| Action | UI | Backend behavior | Important limitation |
|---|---|---|---|
| List/search/filter | Yes | `GET /org/{organizationId}/users` returns tenant users | Filtering is client-side; no pagination |
| Create user | Yes | `POST /org/{organizationId}/users` creates an account directly | The dialog says "Invite", but there is no invitation token, acceptance flow, or email |
| Assign initial role | Yes | Admin/Super Admin may assign Admin, Manager, Moderator, or Citizen; Manager may assign only Citizen | Backend also defines `OBSERVER`, but tenant UI/policy do not expose it |
| Archive/restore | Yes | `PATCH .../{userId}/archive` toggles archival state under tenant/RBAC rules | No hard delete |
| Edit profile/role | No | No tenant-management update endpoint | Users can only edit their own limited profile |
| Export | Yes | Browser-generated CSV from loaded users | Not a server report or audit export |
| Email | Partial | Opens the operator's client with `mailto:` | No in-product message or log |

Data and display gaps:

- `User` belongs to one `Organization`; there is no membership entity for multi-organization access. Email is globally unique.
- The UI expects `lastActive` and vote/activity values absent from the DTO, so those cells display `-`.
- Backend statuses map to active, inactive, or archived. No invitation/pending status is returned, so Pending is normally zero.
- No bulk import/archive, resend invite, operator password reset, user detail, access history, audit history, group, or per-module permission exists.

## 16. Profile, Organization Settings, and Branding

### Member profile

| Route | Information/actions | Status |
|---|---|---|
| `/me` | Email, phone, names, birth date, role, account status, organization | Working |
| `/profile/edit` | Update names, phone, and birth date through `PUT /auth/me` | Working |

Email, role, organization, account status, avatar, password, notification preferences, and memberships cannot be changed there. The organization switcher repeats only the current organization and performs no switch.

### Tenant design/settings

- Routes: `/backoffice/design` and alias `/backoffice/settings`.
- Access: Super Admin, Admin, and Moderator; Manager is excluded in frontend and backend policy.
- Fields: home title, welcome text, footer text, logo URL, banner URL, primary/secondary/accent colors, and presets.
- Save, discard, and live preview are connected. Organization name is read-only.
- One `OrganizationSettings` row is read/written through `GET/PUT /org/{organizationId}/settings`.

Branding limitations:

- Upload-looking logo/banner boxes are placeholders: no file input, upload handler, storage, cropper, or delete action exists. Operators paste URLs, without asset validation.
- Core organization name, description, email, phone, address, and slug are SaaS-managed, not tenant-editable.
- `Organization.OrganizationLogoUrl` and `OrganizationSettings.logoUrl` are separate. Provisioning writes the former; tenant/public layout reads the latter, disconnecting the provisioned logo.
- No website, social, mission, sector, office hours, legal documents, or custom navigation fields exist.

## 17. Module Catalog, Grants, Visibility, and Entitlements

`Module` is the global SaaS catalog. `OrganizationModule` links an organization to a module and stores `granted`, `enabled`, and `displayOrder`. Implemented content additionally requires an active organization subscription, active global module, and compatible module scope.

| Layer | Owner/action | Effect |
|---|---|---|
| Global catalog | SaaS Super Admin | Create/update metadata, scope, prices, active state |
| Tenant grant | SaaS Super Admin or approved request/purchase | Create/enable `OrganizationModule` |
| Tenant visibility | Tenant Admin/Super Admin | Toggle an existing grant's `enabled` flag |
| Runtime entitlement | Backend policy | Require subscription plus active/granted/enabled module |

### Tenant module management

- Route `/backoffice/modules`; alias `/backoffice/content`; access Super Admin/Admin.
- Tabs: All, Enabled, Hidden, Unsupported. Cards show metadata and counts, offer show/hide, and link to supported composers.
- Generic cards show the latest record and can publish/archive it by toggling its publication flag.

Inconsistencies and limitations:

- "Published items" counts all management records, including drafts, scheduled, and archived items.
- Only the latest generic item is directly surfaced; no full content table, editor, deletion, or bulk workflow exists.
- Preview reads the public endpoint, so drafts, scheduled items, and archived items cannot be previewed.
- A hidden grant can show Create based on role, but the destination rejects creation because entitlement requires `enabled=true`.
- Surveys use a separate workspace and are absent from generic `contentByModule` counts.
- Hiding blocks runtime use without removing data/grant. Grant deletion is SaaS-only.

## 18. Module Requests

- Route `/backoffice/module-requests`; access Super Admin, Admin, and Moderator; Manager excluded.
- The page loads grants, requestable catalog, and history; excludes granted modules; accepts a module and optional comment.
- `POST /org/{organizationId}/module-requests/{moduleCode}` creates `PENDING`; history shows `PENDING`, `APPROVED`, or `REJECTED`.
- SaaS Super Admin approves/rejects. Approval grants/enables the module; both outcomes send after-commit organization email.

Gaps:

- Pending modules are not excluded client-side, so duplicates can be selected and then rejected by backend validation.
- Tenant UI exposes no approval, rejection, price, cycle, payment, terms, or revocation.
- No cancellation, resubmission, conversation, attachment, SLA, assignee, audit trail, or in-app notification exists.
- The analytics "pending moderation" concept is actually pending module requests.
- The controller accepts a comment, but purchase/payment construction does not preserve it in that flow.

## 19. Subscription, Billing, Purchases, and Payments

The organization controller exposes subscription/billing summaries, extension/suspension/cancellation, module-purchase checkout/payment-intent creation, and payment-intent synchronization. SaaS controllers expose organization billing status and onboarding payment flows. Organization and purchase/request/payment records hold state.

There is no tenant billing route, invoice list, payment-method page, purchase history, or renewal/cancellation UI. A frontend Stripe service defines tenant module-payment-intent and sync calls, but no page imports them. Tenant billing is therefore `Backend-only`/`Disconnected`.

Security and integrity findings:

- Subscription read and extend/suspend/cancel actions use broad Back Office access, including Manager and Moderator; this appears wider than intended for financial administration.
- Tenant payment synchronization receives an organization path ID but looks up the payment by payment-intent ID without binding it to that organization.
- Public subscription checkout preparation accepts an organization ID and warrants an explicit ownership review.
- Legacy `POST /public/payment/{token}/success` provisions/marks paid from a token without Stripe-session verification; `PaymentSuccess` still calls it when no session ID exists.
- No invoice document, refund, credit note, tax, proration, dunning, receipt UI, or payment audit screen exists.

## 20. Authentication, Tenant Resolution, and Session Access

- Login, refresh, logout, current-user read/update, password-reset request/completion, SaaS login, and registration endpoints exist.
- `TenantResolutionFilter` maps host to organization. `JwtAuthenticationFilter` enforces tenant context and JWT organization match for normal users; Super Admin bypasses the match.
- `ProtectedRoute` provides client-side token/role navigation protection; backend tenant and RBAC checks remain authoritative.
- The profile menu exposes Login, My information, Edit profile, Back Office when allowed, and Logout.

Limitations:

- The public directory builds hardcoded `http://{slug}.lvh.me:5173` URLs, which are development-only.
- One user has one organization; there is no working organization switch or multi-tenant membership.
- No MFA, tenant SSO configuration, device/session view, revoke-other-sessions, or consent log exists.
- Provisioning emails an initial password and the reviewed code does not force first-login password change.

## 21. Notifications and Communications

Working email side effects cover organization-request receipt, quote/payment/welcome/decline, module grant/rejection, and password reset. Module-decision email is scheduled after transaction commit. A payment server-sent-event stream communicates onboarding payment state, but is not a durable inbox.

The tenant notification center is a `UI-only placeholder`:

- Header bell has no handler, badge source, page, or API.
- No notification entity, recipient/read state, preferences, template administration, in-app inbox, push/SMS, or digest exists.
- Direct tenant user creation sends no invitation/welcome email in the reviewed flow.
- Content publication, survey deadlines, events, complaints, and moderation do not trigger tenant notifications.

## 22. Moderation and Governance

`MODERATOR` is a real role. It grants Back Office entry, settings editing, and module-request submission. It does not grant users, content creation/publication, surveys/results, analytics, or module visibility.

No moderation domain exists: no report/flag, queue, review state, assignee, reason, sanction, hiding workflow, escalation, appeal, audit history, endpoint, or page. "Pending moderation" metrics are module-request data. Status: `Missing` beyond the role.

## 23. Organization Directory and Onboarding

### Public directory

- The main-host page lists active organizations from `GET /public/organizations` with client-side search.
- Cards link to hardcoded `lvh.me:5173` tenant hosts.
- `publicVisibilityRequested` is stored during onboarding but ignored by the directory query; all active organizations may be returned.

### Request-to-provisioning flow

The request form collects organization/contact/admin details, expected users, desired modules, colors, branding/additional notes, and requested visibility. The frontend requires a module selection. SaaS operators can list/inspect requests, quote, approve, decline/reject, mark paid, resend email, and run Stripe checkout/payment flows. Provisioning creates organization, settings, selected grants, and initial Admin, then sends lifecycle emails.

Gaps and discrepancies:

- Request DTO supports `logoUrl`, but the current frontend form has no logo field.
- Branding/additional notes are stored but not applied to tenant settings.
- Provisioned logo uses the disconnected core organization logo field.
- Visibility preference is ignored by public directory selection.
- If API input omits modules, provisioning can grant all active modules; frontend prevents this, but service fallback remains and is not clearly front-office scope filtered.
- Initial password delivery has no forced-change step.
- No tenant onboarding checklist, progress dashboard, document exchange, or terms-acceptance record exists.

## 24. Access and Permission Matrix

This reflects effective backend policy; Super Admin generally bypasses role checks but still relies on routing/context behavior.

| Capability | Super Admin | Admin | Manager | Moderator | Citizen | Public |
|---|---:|---:|---:|---:|---:|---:|
| Open Back Office | Yes | Yes | Yes | Yes | No | No |
| Read public organization/modules/content | Yes | Yes | Yes | Yes | Yes | Yes |
| Interact with generic content | Yes | Yes | Yes | Yes | Yes | No |
| Submit/update survey | Yes | Yes | Yes | Yes | Yes | No |
| Create/publish generic content | Yes | Yes | Yes | No | No | No |
| Manage surveys/results/export | Yes | Yes | Yes | No | No | No |
| Manage tenant users | Yes | Yes | Yes | No | No | No |
| Assign Admin/Manager/Moderator | Yes | Yes | No | No | No | No |
| Create Citizen as Manager | Yes | Yes | Yes | No | No | No |
| Toggle module visibility | Yes | Yes | No | No | No | No |
| Edit settings/branding | Yes | Yes | No | Yes | No | No |
| Submit/view module requests | Yes | Yes | No | Yes | No | No |
| View organization analytics | Yes | Yes | Yes | No | No | No |
| Read/mutate subscription actions | Yes | Yes | Yes | Yes | No | No |
| Manage catalog/grants/organizations | Yes | No | No | No | No | No |

Important boundaries:

- Frontend guards/sidebar visibility match most backend policies; backend remains authoritative.
- Module entitlement gates content, surveys, and analytics, but not all tenant functions. Login, users, settings, and requests are not uniformly subscription-gated.
- Backend `OBSERVER` is not a supported tenant-facing role.
- No custom roles, permission sets, user-level module grants, teams, or resource ownership policy exists.

### Module and feature enforcement matrix

| Area/module | Grant/entitlement | Required tenant role | Frontend enforcement | Backend enforcement |
|---|---|---|---|---|
| Tenant Back Office shell | None specific | Admin, Manager, Moderator | `ProtectedRoute` + sidebar | `requireTenantBackOfficeAccess` per operation |
| User management | None specific | Admin or Manager | Route/sidebar role list | Tenant access + `requireTenantUserManagementAccess` |
| Module visibility | Existing tenant grant | Admin | Route/page/action checks | Tenant access + `requireTenantModuleVisibilityAccess` |
| Branding/settings | None specific | Admin or Moderator | Route/sidebar role list | Tenant access + `requireTenantDesignAccess` |
| Module requests | Catalog module not already granted | Admin or Moderator | Route/sidebar and request form | Tenant access + `requireTenantModuleRequestAccess` |
| Vote content | Active subscription + active/granted/enabled `VOTE` | Read/respond: any tenant role; create/publish: Admin/Manager | Module discovery + content grants | Tenant access, content RBAC, entitlement policy |
| Concertation content | Same for `CONFERENCE` | Same as Vote | Same shared generic UI | Same shared generic service/policy |
| Youth News content | Same for `YOUTHSPACE` | Same as Vote | Same shared generic UI | Same shared generic service/policy |
| Surveys | Active subscription + active/granted/enabled `SURVEYS` | Respond: any; manage/results: Admin/Manager | Module-aware sidebar/routes/actions | Tenant access, survey RBAC, entitlement policy |
| Analytics | Active subscription + active/granted/enabled `ANALYTICS`, `BACK_OFFICE` scope | Admin or Manager | Role and module state | Tenant access + analytics RBAC + entitlement/scope |
| Subscription mutation | No module grant | Any Back Office role currently | No tenant UI | Broad Back Office RBAC (security gap) |
| SaaS organization/catalog/grants | SaaS context | Super Admin | SaaS route guards | `/saas/**` requires `SUPER_ADMIN` |

`SUPER_ADMIN` is treated as a platform bypass in the RBAC service. Normal users must pass organization-ID and resolved-host/JWT tenant matching; changing a path organization ID alone should fail those tenant checks. The payment-sync exception described in Section 19 is a separate record-ownership concern after controller access is granted.

## 25. Organization Data Model

| Entity/aggregate | Ownership and relationships | Main state |
|---|---|---|
| `Organization` | Tenant root; users and grants | Status/contact, counters, subscription state/dates |
| `OrganizationSettings` | One-to-one organization | Home/footer text, asset URLs, colors |
| `User` | Many-to-one organization | Identity, role, enabled/archived/account state |
| `Module` | Global catalog | Code, scope, billing/prices, active |
| `OrganizationModule` | Organization-module unique pair | Granted, enabled, display order |
| `ModuleRequest` | Organization/module/requester context | Pending/approved/rejected, comment/timestamps |
| `ModulePurchase` | Organization/module | Provider/payment/subscription purchase state |
| `OrganizationContentItem` | Organization and creator | Type/body/options, publication, schedule, policy, featured |
| `ContentResponse` | Organization/item/user; unique user-item | Answer, participation, reaction |
| `Survey` | Organization and creator | Metadata, status, schedule, policy, featured |
| `SurveyQuestion` | Survey child | Type, prompt, required, options/order |
| `SurveySubmission` | Organization/survey/user; unique user-survey | Submitted/updated state |
| `SurveyAnswer` | Submission and question | Answer payload |
| Request/payment records | Pre-provisioning lifecycle | Request, quote, payment, approval/provisioning |

Integrity observations:

- Detail repositories/services include organization ownership for generic content and surveys.
- Unique constraints enforce one mutable generic response or survey submission per user.
- User membership is single-organization.
- Survey SQL is under manual migrations; no Flyway/Liquibase runner was found, and runtime uses Hibernate `ddl-auto=update`.
- Stored organization counters coexist with live repository counts and can drift if every write path does not update them.
- Generic `featured` is stored but not used for listing; surveys use featured ordering.

## 26. Functional Relationships and Shared Dependencies

```text
Global Module catalog
  -> OrganizationModule grant + enabled visibility
      -> active Organization subscription
          -> public module discovery
          -> generic content (Vote / Concertation / Youth News)
          -> Surveys
          -> Analytics (BACK_OFFICE scope)

Organization
  -> OrganizationSettings -> tenant branding/home/footer
  -> Users -> authentication + RBAC
  -> Content items -> one mutable ContentResponse per user
  -> Surveys -> Questions -> one mutable Submission per user -> Answers
  -> ModuleRequests -> SaaS approval -> OrganizationModule grant
  -> ModulePurchases/payment -> subscription or module activation
```

- Tenant host resolution and JWT organization identity are shared prerequisites for authenticated organization APIs.
- Dashboard summary uses public module/content/survey calls; analytics uses repository-derived server calculations.
- Vote, Concertation, and Youth News share one model/service/controller/composer/list-detail/response policy; foundation defects affect all three.
- Surveys use a separate richer aggregate and operator workspace.
- Grant, visibility, catalog activity, scope, and subscription jointly determine module operation.
- SaaS approval/provisioning creates organizations, grants, administrators, and subscription state; tenant Back Office cannot replace it.

## 27. Organization API Inventory

Endpoints below are the organization-relevant mappings found in the current controllers. Access combines Spring Security, tenant resolution, and service-level RBAC/entitlement checks.

### Controller and service ownership map

| Endpoint family | Controller | Principal service(s) |
|---|---|---|
| `/public/organizations`, `/public/organization-requests`, `/public/modules`, legacy payment-token completion | `PublicController` | `OrganizationService`, `OrganizationRequestService`, provisioning/payment services |
| `/public/organization/**` | `PublicOrganizationController` | `OrganizationService`, `OrganizationSettingsService`, `OrganizationModuleService`, `OrganizationContentService`, `SurveyService` |
| `/public/stripe/**` | `StripeCheckoutController` | `StripeCheckoutService`, `StripePaymentIntentService` |
| `/auth/**` | `AuthenticationController` | Authentication/user/token/email services |
| `/modules/me` | `ModuleController` | `ModuleService` |
| `/org/{organizationId}` modules/settings/requests/subscription/billing/payment | `OrganizationBackOfficeController` | `OrganizationModuleService`, `OrganizationSettingsService`, `ModuleRequestService`, `OrganizationBillingService`, Stripe services |
| `/org/{organizationId}/content/**` | `OrganizationContentController` | `OrganizationContentService` |
| `/org/{organizationId}/surveys/**` | `OrganizationSurveyController` | `SurveyService` |
| `/org/{organizationId}/analytics/**` | `OrganizationAnalyticsController` | `OrganizationAnalyticsService` |
| `/org/{organizationId}/users/**` | `TenantUserManagementController` | Tenant user-management service and `RbacService` |
| `/saas/organizations/**` | `OrganizationController`, `SaasOrganizationModuleController`, `SaasOrganizationBillingController` | `OrganizationService`, `OrganizationModuleService`, `OrganizationBillingService` |
| `/saas/modules/**`, `/saas/module-requests/**` | `SaasModuleCatalogController`, `ModuleRequestController` | Catalog/module and `ModuleRequestService` |
| `/saas/organization-requests/**` | `OrganizationRequestController`, `OrganizationRequestEventsController` | `OrganizationRequestService`, realtime/email/provisioning services |
| `/saas/stripe/**` | `SaasStripeCheckoutController` | `StripeCheckoutService`, `StripePaymentIntentService` |

### Public and tenant-host read APIs

| Method | Endpoint | Purpose | Consumer/status |
|---|---|---|---|
| GET | `/public/organizations` | Active organization directory | Main-host organization page; working, ignores visibility request |
| GET | `/public/organizations/{slug}` | Organization lookup by slug | Public organization service |
| GET | `/public/modules` | Active public request/catalog options | Onboarding form |
| POST | `/public/organization-requests` | Submit organization onboarding request | Onboarding form |
| GET | `/public/organization-requests/payment/{token}` | Payment/request summary | Payment flow |
| POST | `/public/organization-requests/payment/{token}/success` | Legacy token completion | Connected fallback; unsafe trust boundary |
| GET | `/public/organization-requests/{token}/events` | Request/payment SSE | Realtime onboarding state |
| GET | `/public/organization` | Resolved tenant profile/contact | Tenant layout/home |
| GET | `/public/organization/settings` | Tenant appearance/content settings | Tenant layout/home |
| GET | `/public/organization/modules` | Visible front-office modules | Tenant navigation/modules |
| GET | `/public/organization/content/{type}` | Published/open generic content | Generic module list/detail/summary |
| GET | `/public/organization/surveys` | Published surveys | Survey list/dashboard summary |
| GET | `/public/organization/surveys/{surveyId}` | Published survey detail/results policy | Survey detail |

### Authentication/profile APIs

| Method | Endpoint | Purpose | Notes |
|---|---|---|---|
| POST | `/auth/register` | Public account registration | General authentication capability |
| POST | `/auth/login` | Tenant/user login | JWT plus tenant context |
| POST | `/auth/saas-login` | SaaS operator login | Super Admin path |
| POST | `/auth/refresh-token` | Refresh access token | Session continuation |
| GET | `/auth/verifyMail/{email}` | Email verification action | Tokenless path allowed by security config |
| GET | `/auth/forgot-password/{email}` | Start password reset | Sends reset communication |
| POST | `/auth/reset-password` | Complete reset | Connected authentication flow |
| GET | `/auth/me` | Current profile | Tenant layout and profile |
| PUT | `/auth/me` | Update limited own profile | Names/phone/birth date |

No server-side logout mapping was found; frontend logout clears client session state.

### Authenticated organization APIs

| Method | Endpoint | Purpose | Effective access |
|---|---|---|---|
| GET | `/modules/me` | Modules available to current identity | Authenticated; used by module service |
| GET | `/org/{organizationId}/modules` | Granted Back Office modules | Back Office roles |
| PATCH | `/org/{organizationId}/modules/{moduleCode}/visibility` | Show/hide granted module | Admin/Super Admin |
| GET | `/org/{organizationId}/settings` | Read tenant settings | Settings access policy |
| PUT | `/org/{organizationId}/settings` | Update tenant settings | Admin/Moderator/Super Admin |
| POST | `/org/{organizationId}/module-requests/{moduleCode}` | Request a module | Admin/Moderator/Super Admin |
| GET | `/org/{organizationId}/module-requests` | Request history | Admin/Moderator/Super Admin |
| GET | `/org/{organizationId}/module-catalog` | Requestable global modules | Admin/Moderator/Super Admin |
| GET | `/org/{organizationId}/subscription` | Subscription summary | Back Office roles |
| GET | `/org/{organizationId}/billing` | Billing summary | Back Office roles |
| POST | `/org/{organizationId}/subscription/extend` | Extend subscription | Back Office roles; over-broad |
| POST | `/org/{organizationId}/subscription/suspend` | Suspend subscription | Back Office roles; over-broad |
| POST | `/org/{organizationId}/subscription/cancel` | Cancel subscription | Back Office roles; over-broad |
| POST | `/org/{organizationId}/module-purchases/{moduleCode}/checkout` | Module checkout session | Module-request access policy |
| POST | `/org/{organizationId}/module-purchases/{moduleCode}/payment-intents` | Module payment intent | Module-request access policy |
| POST | `/org/{organizationId}/stripe/payment-intents/{paymentIntentId}/sync` | Synchronize payment state | Back Office roles; tenant binding gap |
| GET | `/org/{organizationId}/analytics/dashboard` | KPIs/charts/activity/insights | Admin/Manager/Super Admin plus Analytics entitlement |
| GET | `/org/{organizationId}/content/{type}` | Generic management/participant list | Operators see all; others public records |
| POST | `/org/{organizationId}/content/{type}` | Create generic item | Admin/Manager/Super Admin |
| POST | `/org/{organizationId}/content/{type}/{contentId}/response` | Create/update own response | Any tenant role while open |
| PATCH | `/org/{organizationId}/content/{type}/{contentId}/published` | Publish/archive flag | Admin/Manager/Super Admin |
| GET | `/org/{organizationId}/surveys` | Survey participant/operator list | Any tenant role, scope varies |
| GET | `/org/{organizationId}/surveys/{surveyId}` | Survey detail and own answers/results policy | Any tenant role, scope varies |
| POST | `/org/{organizationId}/surveys` | Create survey | Admin/Manager/Super Admin |
| PUT | `/org/{organizationId}/surveys/{surveyId}` | Update survey/questions/status | Admin/Manager/Super Admin |
| POST | `/org/{organizationId}/surveys/{surveyId}/submissions` | Create/update own submission | Any tenant role while open |
| GET | `/org/{organizationId}/surveys/{surveyId}/results` | Full operator results | Admin/Manager/Super Admin |
| GET | `/org/{organizationId}/surveys/{surveyId}/results.csv` | Results CSV | Admin/Manager/Super Admin |
| GET | `/org/{organizationId}/users` | Tenant user list | Admin/Manager/Super Admin |
| POST | `/org/{organizationId}/users` | Directly create tenant user | Admin/Manager/Super Admin with assignment limits |
| PATCH | `/org/{organizationId}/users/{userId}/archive` | Archive/restore user | Admin/Manager/Super Admin with target rules |

### SaaS organization administration APIs

All `/saas/**` mappings require `SUPER_ADMIN` in `SecurityConfiguration`.

| Method | Endpoint | Purpose |
|---|---|---|
| GET/POST | `/saas/organizations` | List/create organizations |
| GET/PUT/DELETE | `/saas/organizations/{id}` | Read/update/delete an organization |
| PATCH | `/saas/organizations/{id}/toggle-status` | Activate/deactivate organization |
| POST | `/saas/organizations/{orgId}/users/{userId}` | Attach a user to organization |
| GET | `/saas/organizations/{orgId}/users` | List organization users |
| GET | `/saas/organizations/{organizationId}/modules` | List grants |
| POST/DELETE | `/saas/organizations/{organizationId}/modules/{moduleReference}` | Grant/revoke module |
| GET/POST | `/saas/modules` | List/create global catalog modules |
| PUT | `/saas/modules/{id}` | Update module metadata/pricing/scope |
| PATCH | `/saas/modules/{id}/active` | Activate/deactivate catalog module |
| GET | `/saas/module-requests` | List tenant module requests |
| POST | `/saas/module-requests/{requestId}/approve` | Approve and grant |
| POST | `/saas/module-requests/{requestId}/reject` | Reject request |
| GET | `/saas/organizations/{organizationId}/subscription` | SaaS subscription summary |
| GET | `/saas/organizations/{organizationId}/billing` | SaaS billing summary |
| PATCH | `/saas/organizations/{organizationId}/subscription/status` | Set subscription status |
| PATCH | `/saas/organizations/{organizationId}/subscription/extend` | Extend subscription |
| GET | `/saas/organization-requests` | List onboarding requests |
| GET | `/saas/organization-requests/{id}` | Request detail |
| POST | `/saas/organization-requests/{id}/quote` | Issue quote/payment link |
| POST | `/saas/organization-requests/{id}/approve` | Approve request |
| POST | `/saas/organization-requests/{id}/decline` | Decline request |
| POST | `/saas/organization-requests/{id}/reject` | Reject request variant |
| POST | `/saas/organization-requests/{id}/mark-paid` | Mark paid/provision |
| POST | `/saas/organization-requests/{id}/resend-email` | Resend request lifecycle email |
| GET | `/saas/organization-requests/events` | SaaS request SSE stream |
| POST | `/saas/stripe/checkout-sessions` | SaaS-created checkout session |
| POST | `/saas/stripe/payment-intents` | SaaS-created payment intent |
| POST | `/saas/stripe/payment-intents/{paymentIntentId}/sync` | SaaS payment synchronization |

### Public Stripe APIs

| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/public/stripe/checkout-sessions` | Create public checkout session |
| POST | `/public/stripe/payment-intents` | Create public payment intent |
| POST | `/public/stripe/payment-intents/{paymentIntentId}/sync` | Sync public payment intent |
| GET | `/public/stripe/checkout-sessions/{sessionId}` | Read checkout status |
| POST | `/public/stripe/checkout-sessions/{sessionId}/refresh` | Refresh checkout state |
| POST | `/public/stripe/webhook` | Stripe webhook |

No organization endpoints were found for Events, Complaints, General News, Opportunities, Applications, Outcomes, media/documents, moderation, audit logs, invitations, or an in-app notification inbox.

## 28. Complete Function Inventory

This inventory assigns a stable audit ID to every meaningful organization capability exposed, implied, or materially connected in the reviewed code. `Working` means an end-to-end path exists; `Partial` has a material limitation; `Backend-only`, `Disconnected`, `Placeholder`, and `Missing` have their literal meanings.

### Discovery, tenancy, home, and navigation

| ID | Function | Surface/backend | Status |
|---|---|---|---|
| ORG-001 | Browse active organization directory | `/organizations` + public API | Working |
| ORG-002 | Search organization directory | Client-side page filter | Working |
| ORG-003 | Honor requested public visibility | Stored request flag vs directory query | Disconnected |
| ORG-004 | Open tenant by slug/host | Host resolver + public tenant APIs | Working |
| ORG-005 | Generate production-safe tenant links | Directory URL builder | Placeholder (hardcoded dev host) |
| ORG-006 | Load organization profile/contact | Public controller/layout | Working |
| ORG-007 | Render organization contact/address | Returned DTO vs pages | Disconnected |
| ORG-008 | Load tenant appearance settings | Public settings API/layout | Working |
| ORG-009 | Render tenant home hero | Home page/settings | Working |
| ORG-010 | Show tenant public summary metrics | Public module/content/survey aggregation | Working with silent-zero errors |
| ORG-011 | Browse/search/filter visible modules | `/modules` page | Working |
| ORG-012 | Open About/help/contact/privacy content | Nav/footer | Placeholder (shared anchor/no dedicated content) |
| ORG-013 | Global organization search | Header input | UI-only placeholder |
| ORG-014 | Switch organization | Header dropdown | Missing (single organization model) |

### Dashboard and analytics

| ID | Function | Surface/backend | Status |
|---|---|---|---|
| ORG-015 | Back Office operational summary | `/backoffice` public/management aggregation | Working |
| ORG-016 | Gate analytics by catalog grant/scope/subscription | UI + analytics service | Working |
| ORG-017 | User/content/request/survey KPIs | Analytics service | Working with noted count semantics |
| ORG-018 | Engagement evolution chart | Six-month aggregation | Working |
| ORG-019 | User growth chart | Six-month aggregation | Partial (cumulative is window-only) |
| ORG-020 | Activity-by-module chart | Analytics aggregation | Working |
| ORG-021 | Participation-by-type chart | Responses / enabled users | Partial (can exceed 100%) |
| ORG-022 | Request-status and top-content charts | Analytics aggregation/UI | Working |
| ORG-023 | Content-created and users-by-role charts | Backend payload | Backend-only (not rendered) |
| ORG-024 | Recent activity feed | Analytics service/UI | Partial (draft creation labeled published) |
| ORG-025 | Smart insights | Deterministic server rules/UI | Working; rules-based, not AI |
| ORG-026 | Event analytics | Hardcoded zero | Placeholder |
| ORG-027 | Comment/moderation analytics | Hardcoded/repurposed values | Placeholder/misleading |

### Module entitlement and management

| ID | Function | Surface/backend | Status |
|---|---|---|---|
| ORG-028 | List global module catalog | Public/SaaS/tenant catalog APIs | Working |
| ORG-029 | Create/update/activate catalog module | SaaS API/UI domain | Working |
| ORG-030 | Grant/revoke tenant module | SaaS organization-module API | Working |
| ORG-031 | List tenant Back Office grants | Back Office modules page/API | Working |
| ORG-032 | Show/hide a grant | Module page + visibility API | Working |
| ORG-033 | Enforce subscription/catalog/grant/visibility | Content/survey/analytics policies | Working |
| ORG-034 | Sort modules by display order | Grant data/list services | Working/limited UI control |
| ORG-035 | Edit module display order | Tenant UI/API | Missing |
| ORG-036 | Filter management modules by state/support | Back Office tabs | Working |
| ORG-037 | Count published items accurately | Module cards | Partial (counts all records) |
| ORG-038 | Preview unpublished content | Management action/public API | Disconnected |
| ORG-039 | Manage all generic items in a table | Back Office | Missing |
| ORG-040 | Edit/delete/duplicate generic item | UI/API | Missing |

### Voting, concertation, and youth content

| ID | Function | Surface/backend | Status |
|---|---|---|---|
| ORG-041 | Create vote | Composer + generic POST | Working |
| ORG-042 | Configure vote options | Composer/model validation | Working |
| ORG-043 | Vote/update own vote | Detail + response API | Working |
| ORG-044 | Enforce voter eligibility rules | Catalog promise vs model | Missing beyond authentication/tenant access |
| ORG-045 | Create consultation | Composer + generic POST | Working |
| ORG-046 | Attend/withdraw attendance intent | Boolean response update | Working |
| ORG-047 | Consultation discussion/comments | Catalog promise | Missing |
| ORG-048 | Consultation moderation | Catalog promise | Missing |
| ORG-049 | Create youth news item | Composer + generic POST | Working |
| ORG-050 | React/update reaction | Detail + response API | Working |
| ORG-051 | Youth categories/media | UI/model/API | Missing |
| ORG-052 | Set draft/published generic state | Composer/publication patch | Working |
| ORG-053 | Schedule opening/closing | Shared model/service | Working |
| ORG-054 | Display lifecycle | List/detail/service | Working |
| ORG-055 | Apply result visibility policy | Shared service/detail | Working |
| ORG-056 | Mark generic item featured | Composer/model | Partial (not used by list) |
| ORG-057 | Share content URL | Browser clipboard action | Working |
| ORG-058 | Archive/restore latest generic item | Module management flag toggle | Partial (latest item only) |
| ORG-059 | Browse Events module | Generic empty state | Placeholder |
| ORG-060 | Event publishing/registration/attendance/reminders | No domain | Missing |
| ORG-061 | Browse Complaints module | Generic empty state | Placeholder |
| ORG-062 | Complaint submission/routing/status/SLA | No domain | Missing |
| ORG-063 | Browse General News | Colliding generic route | Placeholder/defective |
| ORG-064 | General News editorial publishing | No domain | Missing |

### Surveys

| ID | Function | Surface/backend | Status |
|---|---|---|---|
| ORG-065 | Browse published surveys | Public/member page/API | Working |
| ORG-066 | Read survey detail | Public/member page/API | Working |
| ORG-067 | Create survey | Editor + POST | Working |
| ORG-068 | Edit survey metadata/status/schedule | Editor + PUT | Working |
| ORG-069 | Add/remove questions and choice options | Editor/service | Working before responses |
| ORG-070 | Support eight question types | UI/validation/model | Working |
| ORG-071 | Mark questions required | Editor/validation | Working |
| ORG-072 | Reorder questions | Stored array order only | Partial (no move/drag UI) |
| ORG-073 | Branch/skip questions | Catalog promise | Missing |
| ORG-074 | Submit/update one response | Survey detail/service | Working |
| ORG-075 | Anonymous response | No submission path | Missing |
| ORG-076 | Enforce schedule/status | Survey service | Working |
| ORG-077 | Enforce result-visibility policy | Public/member/operator DTOs | Working |
| ORG-078 | View aggregate results | Detail/results pages | Working |
| ORG-079 | View operator free-text answers | Results page/API | Working |
| ORG-080 | Export survey CSV | Results page/server CSV | Working |
| ORG-081 | Publish/archive survey | Workspace/editor | Working |
| ORG-082 | Delete/duplicate survey | UI/API | Missing |
| ORG-083 | Reopen survey | Editor metadata/status update | Working indirectly |

### Users, roles, profile, and branding

| ID | Function | Surface/backend | Status |
|---|---|---|---|
| ORG-084 | List/search/filter tenant users | User management | Working, client-side filter |
| ORG-085 | Create tenant user directly | Create dialog/API | Working |
| ORG-086 | Invite/accept tenant membership | Dialog wording only | Missing |
| ORG-087 | Assign role during creation | UI/RBAC service | Working with role hierarchy |
| ORG-088 | Edit existing user/role | UI/API | Missing |
| ORG-089 | Archive/restore user | Management page/API | Working |
| ORG-090 | Export loaded users CSV | Browser action | Working |
| ORG-091 | Track pending invitations | Summary card/no data | Disconnected |
| ORG-092 | Track last active/activity totals | Table fields/no DTO | Disconnected |
| ORG-093 | Multi-organization membership | User model | Missing |
| ORG-094 | View own information | `/me` | Working |
| ORG-095 | Edit own names/phone/birth date | `/profile/edit` + API | Working |
| ORG-096 | Change own email/password/avatar/preferences | Profile UI/API | Missing from organization profile flow |
| ORG-097 | Edit tenant home/footer/colors/asset URLs | Settings page/API | Working |
| ORG-098 | Upload/crop/delete branding assets | Upload-styled UI | UI-only placeholder |
| ORG-099 | Edit core organization profile/contact | Tenant Back Office | Missing; SaaS-only update |
| ORG-100 | Reuse provisioned logo in settings | Two logo fields | Disconnected |

### Requests, billing, onboarding, and communication

| ID | Function | Surface/backend | Status |
|---|---|---|---|
| ORG-101 | Submit/list module requests | Tenant page/API | Working |
| ORG-102 | Prevent duplicate pending request in UI | Request selector | Partial (backend rejects) |
| ORG-103 | Approve/reject and grant request | SaaS API | Working |
| ORG-104 | Cancel/discuss/attach to request | No model/UI/API | Missing |
| ORG-105 | Read tenant subscription/billing summary | API only | Backend-only |
| ORG-106 | Extend/suspend/cancel subscription | API only | Backend-only; RBAC too broad |
| ORG-107 | Start tenant module checkout/payment intent | API + unused JS functions | Disconnected |
| ORG-108 | Sync tenant module payment | API + unused JS function | Disconnected; ownership gap |
| ORG-109 | View invoices/payment methods/purchases | Tenant UI/domain | Missing |
| ORG-110 | Submit organization request | Public form/API | Working |
| ORG-111 | Review/quote/approve/decline request | SaaS workflow | Working |
| ORG-112 | Stripe onboarding checkout/webhook/state | Public/SaaS Stripe controllers | Working path present |
| ORG-113 | Legacy token-only payment success | Public API/frontend fallback | Working but unsafe |
| ORG-114 | Provision organization/settings/grants/admin | Provisioning service | Working with mapping gaps |
| ORG-115 | Apply requested branding/visibility | Provisioning/directory | Disconnected/partial |
| ORG-116 | Send onboarding/module/password emails | Mail services/events | Working for wired events |
| ORG-117 | Invite-created user by email | User creation flow | Missing |
| ORG-118 | Display in-app notifications | Header bell | UI-only placeholder |
| ORG-119 | Notification inbox/read/preferences | No domain | Missing |
| ORG-120 | Moderate reported content/users | Role only, no domain | Missing |
| ORG-121 | Audit operator changes | No audit domain/UI | Missing |
| ORG-122 | WebSocket tenant realtime updates | Commented configuration | Disconnected |

## 29. Incomplete / Missing / Disconnected Organization Functionality

These are audit findings, not fixes. Suggested next steps describe the smallest product/engineering decision needed to close or formally accept each gap.

| Area | Issue | Evidence | Impact | Suggested next step |
|---|---|---|---|---|
| Tenant navigation | Search box has no behavior | `OrganizationLayout.jsx` renders input without state/action | Implies unavailable global search | Remove affordance or define/index searchable resources |
| Tenant navigation | Organization switcher cannot switch | Dropdown contains current organization only; single-org `User` | Misleading affordance | Hide it or introduce membership/switch model end to end |
| Footer/help | Help, Contact, Privacy are not separate destinations | Layout links all to About anchor | Legal/support navigation incomplete | Add verified pages/routes or correct labels |
| Public directory | Tenant URLs are development-only | `OrganizationsPage.jsx` builds `lvh.me:5173` | Broken production navigation | Derive tenant URL from deployment configuration |
| Public directory | Visibility request ignored | Request stores flag; public query selects active organizations | Organization may be listed against request | Add approved/public visibility state to query policy |
| Public profile | Contact/address returned but not rendered | Public DTO/service vs home/about pages | Available identity data is hidden | Define the public profile fields and render them safely |
| Branding | Logo/banner upload panels do nothing | Design page has no file input/handler/service | Users expect upload that cannot occur | Replace with URL-only UI or implement secured media storage |
| Branding | Provisioned logo is disconnected | Provisioning writes core logo; layout reads settings logo | New tenant logo may not appear | Consolidate fields or map provisioning into settings |
| Branding | Request notes/colors not fully applied | Request/provisioning mapping | Requested identity requires manual correction | Explicitly map supported onboarding fields |
| Generic content | No edit/delete/duplicate | Only create/list/respond/publication endpoints | Operators cannot correct or remove records cleanly | Define lifecycle-safe update/delete APIs and UI |
| Generic content | Management exposes latest record only | Module card selects latest | Older drafts/items are effectively unmanaged | Add organization-scoped content index/detail management |
| Generic content | Preview cannot show draft | Preview calls public endpoint | Operator preview fails for nonpublic item | Add authorized preview DTO/route |
| Generic content | "Published" count includes all records | Management list length used | Operational counter is misleading | Count by publication/lifecycle explicitly |
| Generic content | Hidden module still advertises Create | Role-based button vs entitlement at destination | Avoidable forbidden/error experience | Include enabled entitlement in affordance rule |
| Generic content | `featured` has no generic list effect | Field saved; list not ordered/rendered by it | Feature action has no public outcome | Apply it or remove it from composer |
| Voting | Eligibility rules absent | Catalog description vs generic response policy | Cannot target eligible voter populations | Model and enforce eligibility, or correct catalog promise |
| Concertation | Discussion/moderation absent | Catalog description; no entity/API/UI | Module is narrower than advertised | Align catalog language or build the missing domain |
| Youth content | Categories/media absent | Generic item fields/composer | News presentation is text-only | Define content taxonomy/media requirements |
| Events | Entire operational domain absent | Catalog/route only; total events hardcoded 0 | Advertised module is nonfunctional | Keep disabled/placeholder or implement entity-to-UI workflow |
| Complaints | Entire operational domain absent | Catalog/route only | No complaint intake/tracking | Keep disabled/placeholder or define workflow |
| General News | No domain and route collision | NEWS catalog plus Youth alias `news` | Wrong module can resolve | Remove alias conflict and implement/retire NEWS |
| Surveys | Branching advertised but absent | Catalog description vs editor/model/service | Product promise is inaccurate | Correct catalog or implement branching rules |
| Surveys | No delete/duplicate | Controller/UI actions absent | Lifecycle management incomplete | Add if required, with response-retention policy |
| Surveys | No question reorder controls | Position persists array order only | Author cannot deliberately reorganize | Add accessible move/drag controls |
| Surveys | No list search/filter/pagination | Survey pages render full lists | Poor scale for large tenants | Add query and UI controls if scale requires |
| Users | "Invite" creates account immediately | User dialog + POST service | No acceptance/ownership proof | Rename to Create or build invitation lifecycle |
| Users | Pending count has no backing state | DTO/status mapper lacks pending | Always-zero/misleading KPI | Remove or add invitation state |
| Users | Last active/activity columns lack data | Frontend expects absent DTO properties | Table shows `-` | Add audited activity fields or remove columns |
| Users | No role/profile edit after creation | Only create/list/archive mappings | Administrators cannot maintain access | Add guarded update flow with audit trail |
| Users | No multi-organization membership | Direct `User.organization`, unique email | Switcher and cross-tenant staffing impossible | Introduce membership entity only if product requires it |
| Module requests | Pending duplicates selectable | UI excludes grants, not pending requests | Backend error after form completion | Exclude/disable pending module codes |
| Module requests | No cancel/thread/attachments/audit | Model/controller/UI surface | Review collaboration is limited | Define request lifecycle requirements |
| Billing | No tenant billing interface | Controller/services exist; no route/page | Operators cannot use backend capabilities | Add restricted UI or remove tenant endpoints |
| Billing/RBAC | Manager/Moderator can mutate subscription | Broad `requireTenantBackOfficeAccess` | Financial control is over-broad | Restrict to explicit billing administrators |
| Payment isolation | Tenant sync is not organization-bound | Lookup by payment intent ID despite org path | Cross-tenant integrity risk | Query/validate organization ownership before sync |
| Payment | Legacy token success trusts callback token | Public success endpoint + frontend fallback | Payment could provision without provider verification | Retire fallback; require verified webhook/session state |
| Payment | Public org-ID flow needs ownership review | Public Stripe request preparation | Caller-controlled association risk | Bind payment to signed request/token/server state |
| Entitlement | Subscription checks are inconsistent by area | Content/surveys/analytics gated; users/settings/requests not | Expired tenant capabilities are ambiguous | Document and centralize intended entitlement policy |
| Analytics | Total events is hardcoded zero | Analytics service KPI | Looks real but is placeholder | Omit until domain exists or mark unsupported in UI |
| Analytics | "Pending moderation" is module requests | Analytics aggregation/labels | Misrepresents operational workload | Rename consistently; create real moderation metric only with domain |
| Analytics | User cumulative is six-month-window cumulative | User growth builder | Not lifetime total | Seed pre-window baseline or relabel |
| Analytics | Participation percentage can exceed 100 | Responses divided by enabled users | Chart can be mathematically misleading | Use unique participants or label response rate |
| Analytics | Draft creation called publication | Recent activity label | Audit timeline is inaccurate | Derive label from publication/lifecycle |
| Analytics | Two charts returned but not displayed | Service payload vs dashboard components | Backend work is unreachable | Render intentionally or remove from contract |
| Dashboard | Public insight errors become zeros | Layout catch behavior | Outage looks like no activity | Surface degraded-data state |
| Notifications | Bell/inbox/preferences absent | Header and no notification domain | No in-app awareness | Hide bell or implement notification aggregate |
| Moderation | Role exists without workflow | RBAC plus no moderation code | Moderator role has unexpected narrow duties | Rename/redefine role or implement governed queue |
| Realtime | WebSocket configuration is commented out | `WebSocketConfig.java` | No tenant realtime content updates | Remove dead configuration or complete secured design |
| Database evolution | Surveys rely on manual SQL/`ddl-auto=update` | Manual migrations and application config | Schema changes are difficult to reproduce safely | Adopt versioned migrations before production rollout |
| Configuration security | Secrets/default credentials and debug settings are present in source config | Reviewed application properties | Credential exposure and unsafe deployment defaults | Rotate secrets and move them to environment/secret storage |
| Auditability | No operator audit log | No audit entity/API/page for tenant mutations | Changes lack traceability | Define immutable audit events for sensitive actions |
| Opportunities/applications/outcomes | No domain or module found | Repository-wide entity/controller/service/route search | These workflows do not exist | Do not advertise; create only from approved product scope |
| Documents/media | No organization media/document library | No entity/service/page/upload client | Asset reuse and document workflows unavailable | Define secured storage/ownership before adding UI |

## 30. Current Implementation Status

### Existing and working

- Host-resolved public tenant identity, settings, visible module discovery, tenant home, and module directory.
- JWT tenant isolation and backend RBAC for the principal organization operations.
- Global catalog, SaaS grants/revocation, tenant show/hide, and runtime entitlement for content/surveys/analytics.
- Generic Vote, Concertation attendance intent, and Youth News text/react flows: create, publish state, schedule/close, policy-controlled results, and one mutable response per user.
- Surveys: eight question types, creation/update, schedule/status, one mutable authenticated submission, aggregate/operator results, free-text review, and CSV export.
- Tenant user listing/direct creation/role hierarchy/archive/restore and client CSV export.
- Tenant appearance text/colors/URL settings, own profile view/edit, module request submission/history, and SaaS approval/rejection.
- Real database-backed dashboard analytics for users, generic content, responses, requests, surveys, and submissions, subject to the calculation caveats documented above.
- Public organization request, SaaS review/quote/payment/provisioning, selected lifecycle email, and Stripe-based payment infrastructure.

### Existing but incomplete

- Generic content management lacks edit/delete/full inventory and has misleading latest/count/preview/featured behavior.
- Surveys lack delete, duplicate, branching, and reorder UI; no anonymous submissions.
- Users are created rather than invited and cannot be edited; activity/pending fields are incomplete.
- Branding accepts URLs but not uploads and does not cover the core public organization profile.
- Analytics includes incomplete or misleading calculations/labels and unused chart payloads.
- Module request collaboration and billing records are minimal.
- Navigation/profile/support experience includes nonfunctional or shallow affordances.

### Existing but disconnected

- Tenant billing, subscription mutation, module checkout/payment-intent, and sync backend capabilities have no tenant page; frontend payment helpers are unused.
- Provisioned/requested logo, branding notes, and public visibility do not connect cleanly to the tenant/public experience.
- Backend-only analytics charts are not rendered.
- Commented WebSocket infrastructure has no active tenant flow.
- Public contact data and some user DTO expectations are not presented/populated.

### Placeholders

- Events, Complaints, and General News module pages.
- Notification bell, global tenant search, logo/banner upload surfaces, support/footer destinations, and organization switcher.
- Event KPI and comment/moderation analytics inputs.

### Missing

- Opportunities, applications/submissions workflow, applicant review/decision, outcomes/impact domain, event operations, complaint processing, General News editorial domain, organization document/media library, invitations/memberships, in-app notifications, moderation queue, and audit log.
- Custom roles/permissions, per-user module grants, teams, multi-organization memberships, and organization-side core profile administration.

### Broken or requires fix

- `/modules/news` can resolve to Youth Space instead of NEWS.
- Production tenant links are hardcoded to a local development host.
- Payment authorization/verification findings, source-managed secrets, and over-broad subscription RBAC require security remediation before relying on those flows in production.
- Public visibility preference is not enforced.

## 31. Requested Domains Confirmed Absent

These names were searched because they are common organization functions or were specifically requested for verification. They are not CIVOX organization modules in the reviewed implementation and are not presented as planned functionality.

| Domain | Repository finding |
|---|---|
| Opportunities | No organization module code, route, page, entity, repository, service, controller, DTO, or API was found |
| Applications/submissions for opportunities | No application aggregate, applicant list, review, scoring, shortlist, decision, or export workflow was found; survey submissions are unrelated and documented separately |
| Outcomes/impact/success stories | No outcome entity/module/workflow exists; survey/content results and analytics are not an Outcomes module |
| Event operations | Only catalog metadata/placeholder route exists; no event domain. Internal Spring/payment events are technical events, not civic Events-module data |
| Complaints operations | Only catalog metadata/placeholder route exists |
| General News operations | Only catalog metadata/placeholder route exists; Youth News is a different implemented content type |
| Invitations/memberships | No invitation or membership aggregate; direct user creation and a single organization foreign key are used |
| Documents/media library | No organization document/media aggregate or upload/storage workflow was found |
| In-app notifications | No notification aggregate; only selected email services and process SSE exist |
| Moderation | Role/labels only; no moderation aggregate or queue |

Where this document says `Missing`, it means absence confirmed from the current repository, not a commitment that the feature will be built.

## 32. Technical References

Paths are relative to the repository root.

### Frontend routing, layout, policy, and catalog

- `civox-test-front/src/routes/AppRouter.jsx`
- `civox-test-front/src/layouts/OrganizationLayout.jsx`
- `civox-test-front/src/components/ProtectedRoute.jsx`
- `civox-test-front/src/utils/rbac.js`
- `civox-test-front/src/utils/moduleCatalog.js`
- `civox-test-front/src/components/organization/OrganizationUi.jsx`

### Frontend organization pages

- `civox-test-front/src/pages/OrganizationDetailsPage.jsx`
- `civox-test-front/src/pages/OrganizationModulesPage.jsx`
- `civox-test-front/src/pages/OrganizationModulePage.jsx`
- `civox-test-front/src/pages/OrganizationBackOfficePage.jsx`
- `civox-test-front/src/pages/OrganizationManageModulesPage.jsx`
- `civox-test-front/src/pages/OrganizationContentCreatePage.jsx`
- `civox-test-front/src/pages/OrganizationSurveyPage.jsx`
- `civox-test-front/src/pages/OrganizationSurveyAdminPage.jsx`
- `civox-test-front/src/pages/OrganizationSurveyEditorPage.jsx`
- `civox-test-front/src/pages/OrganizationSurveyResultsPage.jsx`
- `civox-test-front/src/pages/OrganizationUserManagementPage.jsx`
- `civox-test-front/src/pages/OrganizationDesignPage.jsx`
- `civox-test-front/src/pages/OrganizationModuleRequestPage.jsx`
- `civox-test-front/src/pages/OrganizationsPage.jsx`
- `civox-test-front/src/pages/OrganizationRequestPage.jsx`
- `civox-test-front/src/pages/PaymentSuccessPage.jsx`

### Frontend API clients

- `civox-test-front/src/services/organizationService.js`
- `civox-test-front/src/services/organizationDynamicService.js`
- `civox-test-front/src/services/orgBackOfficeService.js`
- `civox-test-front/src/services/surveyService.js`
- `civox-test-front/src/services/moduleService.js`
- `civox-test-front/src/services/authService.js`
- `civox-test-front/src/services/organizationRequestService.js`
- `civox-test-front/src/services/organizationRequestRealtimeService.js`
- `civox-test-front/src/services/stripeService.js`

### Backend controllers

- `.../controller/publicControllers/PublicController.java`
- `.../controller/publicControllers/PublicOrganizationController.java`
- `.../controller/publicControllers/StripeCheckoutController.java`
- `.../controller/publicControllers/PublicOrganizationRequestEventsController.java`
- `.../controller/back_office/OrganizationBackOfficeController.java`
- `.../controller/back_office/OrganizationAnalyticsController.java`
- `.../controller/back_office/OrganizationContentController.java`
- `.../controller/back_office/OrganizationSurveyController.java`
- `.../controller/back_office/TenantUserManagementController.java`
- `.../controller/saas/OrganizationController.java`
- `.../controller/saas/SaasOrganizationModuleController.java`
- `.../controller/saas/SaasModuleCatalogController.java`
- `.../controller/saas/ModuleRequestController.java`
- `.../controller/saas/SaasOrganizationBillingController.java`
- `.../controller/saas/OrganizationRequestController.java`
- `.../controller/saas/SaasStripeCheckoutController.java`
- `.../auth/AuthenticationController.java`

The backend prefix represented by `...` is `CiviAgoraBackEnd/CiviAgora-Backend/src/main/java/tn/esprit/tic/civiAgora`.

### Backend services and policy

- `OrganizationContentService.java`, `SurveyService.java`, `OrganizationAnalyticsService.java`
- `OrganizationModuleService.java`, `ModuleAccessService.java`, `ModuleRequestService.java`
- `OrganizationBillingService.java`, `OrganizationSubscriptionAccessPolicy.java`, `BillingPricingService.java`
- `OrganizationService.java`, `OrganizationSettingsService.java`, `OrganizationProvisioningService.java`, `OrganizationRequestService.java`
- `TenantAccessService.java`, `RbacService.java`
- `StripeCheckoutService.java`, `StripePaymentIntentService.java`
- `OrganizationOnboardingEmailService.java`, `ModuleNotificationEmailService.java`

### Backend entities, repositories, enums, and security

- Entities: `Organization`, `OrganizationSettings`, `User`, `Module`, `OrganizationModule`, `ModuleRequest`, `ModulePurchase`, `OrganizationContentItem`, `OrganizationContentResponse`, `Survey`, `SurveyQuestion`, `SurveySubmission`, `SurveyAnswer`, and onboarding/payment records under `dao/entity`.
- Repositories: corresponding organization/module/content/survey/request/payment repositories under `dao/repository`.
- Enums: `OrganizationStatus`, `OrganizationContentType`, `OrganizationContentResultVisibility`, `SurveyStatus`, `SurveyQuestionType`, `SurveyResultVisibility`, `ModuleScope`, `ModuleRequestStatus`, `ModulePurchaseStatus`, and subscription/payment enums.
- Security: `SecurityConfiguration.java`, `TenantResolutionFilter.java`, `JwtAuthenticationFilter.java`, and `TenantContext.java`.
- Catalog seed: `DataInitializer/ModuleDataInitializer.java`.
- Schema/config: `src/main/resources/db/manual-migrations/V20260824__organization_surveys_and_content_lifecycle.sql`, its README, and `src/main/resources/application.properties`.

## 33. Audit and Verification Method

Audit date: 2026-08-26.

The audit covered the complete current frontend and backend source trees, not only navigation. The review included routes, layouts, pages/components, actions/forms/tables, services/API clients, route guards/RBAC, controllers, service methods, repositories, entities, DTOs/mappers, enums, tenant resolution, module grants, entitlement/subscription/payment logic, analytics calculations, emails/realtime configuration, initializer metadata, application configuration, and manual migrations.

Repository-wide searches were repeated for `Organization`/`Organisation`, `Survey`, `Content`, `Opportunity`, `Event`, `Application`, `Member`, `Invitation`, `Analytics`, `Notification`, `Moderation`, `Outcome`, `Subscription`, `Billing`, `Module`, `Permission`, and `Grant`, plus route/controller/service/entity/API/sidebar patterns. Findings were cross-checked in four places: module inventory, detailed module sections, function inventory, and current-status summary.

Validation results:

| Check | Result |
|---|---|
| Documentation structure/module coverage | Passed: 34 main sections, all eight catalog module codes covered, 122 unique sequential function IDs, no duplicates/gaps |
| Markdown whitespace/encoding validation | Passed: UTF-8 document and no trailing whitespace after final normalization |
| Frontend lint | Passed: `npm run lint` (exit 0) |
| Frontend production build | Passed: `npm run build` (exit 0); Vite reported only a chunk-size advisory |
| Backend tests | Passed after Copilot implementation: `mvnw.cmd test`; 42 tests, 0 failures, 0 errors, 0 skipped |
| Application source files changed by the Copilot implementation | Chat service/tool security, scoped read/write tools, focused tests, router-level floating assistant, chat API client/styles. Unrelated working-tree changes were preserved. |

This is a static code audit. It does not claim production data, external Stripe/email delivery, DNS/tenant-host routing, or deployment secrets were exercised end to end.

## 34. Summary

CIVOX currently has a real organization tenant shell with public identity/branding, module grants, role-controlled Back Office, three shared participation content types, a substantially richer Surveys module, user administration, analytics, module requests, and SaaS-led onboarding/billing foundations. The strongest end-to-end organization workflows are Vote, Concertation attendance intent, Youth News reactions, Surveys, module visibility, user creation/archive, appearance settings, and module-request approval.

The product surface is broader than the implemented domains. Events, Complaints, and General News are catalog placeholders; Opportunities, Applications, Outcomes, document/media management, invitations, in-app notifications, moderation, and audit history are absent. Generic content administration and user management remain limited, branding/onboarding contain disconnected fields, and tenant billing is backend-only/disconnected. The payment, secret-management, subscription-RBAC, public-visibility, route-collision, and production-host findings should be treated as the highest-risk gaps recorded by this audit.

## CIVOX Assistant and Authenticated Copilot

`POST /api/chat` remains the single endpoint for both modes.

### Anonymous Assistant

The anonymous assistant receives no application tools. It can explain CIVOX and general civic-participation concepts, but its prompt explicitly rejects personal profiles, personal participation, tenant user data, private analytics/results, settings, and management information. A personal question is answered with a sign-in requirement. A resolved public tenant contributes only its organization name; no private dataset is preloaded.

### Authenticated CIVOX Copilot

Authenticated chat requires a resolved tenant that strictly matches the JWT tenant. The model receives only compact identity context: user name, role, organization name/slug, and currently accessible front-office module names. It does not receive user lists, surveys, submissions, content, results, or analytics in the prompt.

The current read-only tool groups are:

| Tool | Capabilities | Enforcement source |
|---|---|---|
| `personal_context` | Own profile and effective permission explanation | Authenticated principal, `RbacService`, `ModuleAccessService` |
| `surveys` | Open/unanswered/answered surveys, detail, policy-controlled results | `SurveyService`, Surveys entitlement, survey result policy |
| `participation_discovery` | Ranked open content, search, own participation, Vote/Concertation/Youth News discovery | `OrganizationContentService`, `SurveyService` |
| `organization_analytics` | Dashboard, organization summary, KPIs, module activity, recent activity | `RbacService.requireTenantAnalyticsAccess`, `OrganizationAnalyticsService` |
| `organization_users` | User counts, role summaries, bounded search and recent users | `RbacService.requireTenantUserManagementAccess`, `UserService` |
| `organization_modules` | Enabled/granted module state, requestable modules and requests, implementation status | Organization module/grant/subscription services and relevant RBAC policy |
| `navigation_help` | Allow-listed internal routes filtered by role and module state | Existing RBAC checks and organization module state |
| `organization_actions` | Confirmed content publication, module visibility/request, user archive/restore, survey submission/update, and Vote/Concertation/Youth News response | Two-turn server-held confirmation plus the same RBAC/domain services as normal UI |

Tool arguments cannot select an organization or user. `ToolExecutor` creates a trusted execution context from the Spring Security principal and `TenantAccessService` for every call, rejects tenant mismatches before domain access, and returns sanitized error codes instead of Java exception text. Domain services remain responsible for entitlement, lifecycle, ownership, and result-visibility rules.

Supported writes use a server-held, two-turn confirmation transaction. Preparation validates the target in the trusted tenant, stores the exact action and parameters under the authenticated organization/user for ten minutes, and returns a human-readable summary. No mutation occurs until a later request whose raw user message is an explicit confirmation; a model tool call by itself cannot confirm. Successful execution clears the pending action. A confirmation message cannot prepare and replace a different action in the same turn.

Only writes backed by existing domain services are exposed: generic content publication, module visibility, module requests, tenant user archive/restore, authenticated survey submission/update, and Vote/Concertation/Youth News responses. Survey publication/archive is not exposed because the current survey domain has no dedicated lifecycle command with an exact confirmation-safe parameter contract. Placeholder Events/Complaints and incomplete general News actions are not advertised.

The frontend mounts one persistent floating assistant at router level. It is available on public, tenant, authenticated, and back-office routes, changes its title and starter suggestions by authentication/role, retains the current page, supports keyboard submission and Escape-to-close, prevents duplicate requests, and provides responsive loading/error/scroll behavior.
