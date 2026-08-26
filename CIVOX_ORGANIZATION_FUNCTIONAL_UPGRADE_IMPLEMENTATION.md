# CIVOX Organization Functional Upgrade — Implementation Report

Date: 2026-08-24

## Scope delivered

This implementation deliberately preserves the current organization Front Office and Back Office visual system. It extends the existing React/Spring Boot product, tenant routing, module catalog, role model, subscription checks, and dynamic organization branding. The SaaS platform administration surface was not redesigned or functionally expanded.

The completed scope is:

1. organization content foundation corrections;
2. a complete Surveys vertical slice;
3. survey-aware organization analytics;
4. database deployment SQL and automated coverage for the new domain.

Events, general News, Ideas, Complaints, Outcomes, and Notifications remain deferred so the delivered Surveys module is complete rather than several modules being partial shells.

## Foundation changes

### Content discovery and stable routes

- Generic Vote, Consultation, and Youth News modules now show every published item instead of rendering only the newest record.
- Every generic content item has a stable route: `/modules/:moduleSlug/:contentId`.
- Module routes such as `/modules/vote` now act as archive/list pages.
- Missing, unpublished, or cross-tenant item IDs resolve to an unavailable state instead of falling back to unrelated content.

### Lifecycle and participation rules

Generic content now persists and returns:

- draft/published state;
- opening and closing timestamps;
- computed lifecycle: `DRAFT`, `SCHEDULED`, `OPEN`, or `CLOSED`;
- featured state;
- result visibility: `AFTER_RESPONSE`, `AFTER_CLOSE`, or `PRIVATE`;
- whether the item is currently accepting responses.

The backend enforces publication and opening/closing windows. A member can update their existing response while the item remains open. The composer now exposes draft publishing, schedule, featured state, and result policy controls.

The non-functional Youth News “Follow” action was removed. Youth News retains its real persisted reaction action.

### Management visibility

The generic content API now distinguishes participant reads from management reads with `?management=true`. Public/member screens receive currently visible content; authorized content managers can retrieve drafts and scheduled items. The existing organization/module/subscription checks still gate both paths.

## Surveys module

### Front Office

- Published survey archive at `/modules/surveys`.
- Stable survey detail at `/modules/surveys/:surveyId`.
- Featured, scheduled, open, and closed states.
- Question rendering for:
  - single choice;
  - multiple choice;
  - short text;
  - long text;
  - 1–5 rating;
  - yes/no;
  - number;
  - date.
- Required-answer validation in the browser and on the server.
- One submission per member, updated in place while the survey is open.
- Result visibility after submission, after close, or operators only.
- Public aggregate results never expose free-text answers.
- Sign-in and closed-window states are explicit and do not present fake actions.

### Back Office

- Survey workspace at `/backoffice/surveys`.
- Create at `/backoffice/surveys/new`.
- Edit at `/backoffice/surveys/:surveyId/edit`.
- Results at `/backoffice/surveys/:surveyId/results`.
- Draft, publish, schedule, archive, and featured controls.
- Reorder-safe question persistence through explicit positions.
- Question structure becomes immutable after the first response, preventing historical answers from being detached or reinterpreted. Metadata, schedule, visibility, and status can still be updated.
- Aggregate charts, operator-only free-text review, and CSV response export.

### Persistence model

- `Survey`
- `SurveyQuestion`
- `SurveySubmission`
- `SurveyAnswer`
- `SurveyStatus`
- `SurveyQuestionType`
- `SurveyResultVisibility`

Tenant ownership is stored on surveys and submissions. Repository lookups always include the organization ID. Unique constraints enforce one submission per survey/member and one answer per submission/question.

### APIs

Public:

- `GET /public/organization/surveys`
- `GET /public/organization/surveys/{surveyId}`

Authenticated tenant:

- `GET /org/{organizationId}/surveys`
- `GET /org/{organizationId}/surveys/{surveyId}`
- `POST /org/{organizationId}/surveys`
- `PUT /org/{organizationId}/surveys/{surveyId}`
- `POST /org/{organizationId}/surveys/{surveyId}/submissions`
- `GET /org/{organizationId}/surveys/{surveyId}/results`
- `GET /org/{organizationId}/surveys/{surveyId}/results.csv`

All authenticated endpoints use the existing JWT tenant assertion. Public endpoints resolve the organization from the tenant host. Every operation also checks the active subscription, the SaaS grant, module activity, and organization visibility for `SURVEYS`.

## Role behavior

| Capability | Public | Citizen | Moderator | Manager | Admin | Super Admin |
|---|---:|---:|---:|---:|---:|---:|
| Read published surveys | Yes | Yes | Yes | Yes | Yes | Yes |
| Submit/update own response | No | Yes | Yes | Yes | Yes | Yes |
| Read drafts/scheduled surveys | No | No | No | Yes | Yes | Yes |
| Create/edit/publish/archive | No | No | No | Yes | Yes | Yes |
| Results and CSV export | No* | No* | No* | Yes | Yes | Yes |

`*` Aggregate results can be visible on the survey itself according to its configured result policy. Operator results endpoints remain limited to the existing analytics roles.

The frontend route guards mirror these server rules. Server authorization remains authoritative.

## Branding and navigation

- All new screens reuse `organizationUi.css`, organization components, and the current page/container/card/button patterns.
- Primary and secondary accents continue to resolve through `--org-primary` and `--org-secondary` from organization settings.
- Existing logo, banner, welcome copy, and footer behavior are unchanged.
- Surveys appears in the Front Office module catalog only when the granted module is visible.
- An authorized Surveys entry appears in Back Office navigation only when the module is enabled.
- Homepage published-item and response totals now include public surveys.

## Analytics corrections

- Added Survey and Survey Response KPIs.
- Survey submissions contribute to total interactions, unique participation, recent activity, module activity, engagement trends, and participation by content type.
- `Active users` was relabeled to `Enabled member accounts`, matching the actual calculation.
- `Total votes/polls` was relabeled to `Vote/poll items` because it counts content records.
- `Total petitions/requests` was relabeled to `Module access requests`.
- `Pending moderation items` was relabeled to `Pending module requests`.
- `Comments/interactions` was relabeled to `Recorded content responses`.
- Module-request comments are no longer presented as citizen comment engagement.
- The frontend engagement chart and tooltip now match these corrected series.

## Database migration

The entity mappings are compatible with the repository's current Hibernate `ddl-auto=update` setup. A reviewed MySQL deployment migration is also provided at:

`CiviAgoraBackEnd/CiviAgora-Backend/src/main/resources/db/manual-migrations/V20260824__organization_surveys_and_content_lifecycle.sql`

The project has no automated Flyway/Liquibase runner today, so this SQL remains a deployment-run migration. Its README records that constraint. Production should apply it through the deployment migration runner before changing Hibernate away from `update`.

## Verification completed

- Frontend ESLint: pass, zero warnings.
- Frontend Vite production build: pass.
- Backend compile: pass.
- New `SurveyServiceTest`: 3 tests pass, covering tenant scoping, closed-window rejection, validation, and persistence.
- Affected analytics/content regression suite: 12 tests pass.
- Full backend suite: 34 tests pass, 0 failures, 0 errors, 0 skipped.
- `git diff --check`: pass.

## Known repository/test-environment issues

- The production frontend bundle reports the existing large-chunk warning (`~592 kB` JavaScript before gzip). This does not fail the build; route-level code splitting is a later performance improvement.
- The Spring context test uses the configured MySQL instance rather than an isolated test database. With Hibernate `ddl-auto=update`, that test applied the new schema successfully to the configured development database.
- The existing test context initializes mail infrastructure and attempts an SMTP connection. Existing notification tests deliberately tolerate SMTP failure, and the full suite still passes. Test profiles should replace external MySQL/SMTP with isolated fixtures.
- Automated browser/E2E coverage is not present in the repository; verification is lint, build, Spring context, controller tests, and service tests.

## Explicitly deferred

- Events and RSVP/waitlist/calendar export.
- General News editorial workflow and categories.
- Idea proposals, comments, support, and moderation workflow.
- Complaint/service-request workflow, assignment, SLA, history, and attachments.
- Outcomes/decision records linked to participation processes.
- In-app/email notification center, preferences, read state, and notification audit.
- Cross-module search, richer homepage feeds, recurring content, audit trail, and granular content-level permission policies.
- Platform-wide automated migration runner and isolated integration-test infrastructure.

These items are deferred rather than represented by placeholder interactions. Existing entitled but unimplemented modules continue to use the current honest empty-state behavior.
