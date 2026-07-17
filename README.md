# School Management System (Academic + CBT)

A web based school management platform that unifies academics, student affairs, finance, counseling, attendance, LMS, and Computer Based Testing into one system. Each school runs its own self hosted deployment with a dedicated database, so data stays fully isolated at the instance level. CBT mobile apps connect to the chosen school backend through a central school directory.

Every business process is scoped by **grade level** and **major**, so grading, student affairs, attendance, finance, and LMS data always carry the class and major context of each student.

## Status

Draft. Requirements and design are defined; implementation follows the backend to API to frontend order described in the PRD.

## Highlights

* Self hosted, one deployment and one database per school (single tenant per instance)
* Role based access control across 15 distinct roles
* Data always scoped by grade level and major
* Real time CBT monitoring for proctors and supervisors
* White label branding per school, driven by database configuration
* API first architecture with a type safe backend and a React SPA frontend

## Technology Stack

| Layer | Technology |
|-------|------------|
| Frontend | React with Vite (SPA), React Router |
| Styling | Tailwind CSS |
| Backend Language | Go (Golang) |
| API Framework | Gin (REST router and middleware) |
| Database | PostgreSQL |
| ORM | GORM |
| API Docs | Swagger/OpenAPI via swaggo |
| Server | Ubuntu Linux |
| Email | SMTP (password reset and system email) |
| Integrations | WhatsApp Gateway, RFID Reader, SMTP |

The architecture is API first. The React SPA talks to the Go backend over a REST API. There is no SSR because every page sits behind authentication and needs no SEO. PostgreSQL access goes through GORM, request routing and middleware run on Gin, input validation uses Go struct validation, and API documentation is generated with swaggo.

## Roles

| No | Role | Primary Responsibility |
|----|------|------------------------|
| 1 | Administrator | Manage the whole system, users, roles and permissions, configuration |
| 2 | Principal | Monitoring, approvals, access to all reports |
| 3 | Curriculum Deputy | Curriculum structure, class schedules, academic calendar |
| 4 | Student Affairs Deputy | Admissions, guidance, and student activities |
| 5 | Treasurer | Payment types, invoices, and financial reports |
| 6 | Administrative Staff | Student and teacher records, correspondence |
| 7 | Counseling (BK) | Violations, counseling, follow up, achievements, alumni |
| 8 | Job Placement (BKK) | Internships, internship placements, job vacancies |
| 9 | Program Head | Manage the program or major they lead |
| 10 | Teacher | Materials, grading, assignments, quizzes, class attendance |
| 11 | Homeroom Teacher | Guardianship, e-report, monitoring of their class |
| 12 | Student | Materials, assignments, quizzes, attendance, invoices, report card |
| 13 | Parent | Monitor their child's grades, attendance, invoices, and announcements |
| 14 | CBT Proctor | Exam operations: manage sessions, tokens, open/close and reset participants |
| 15 | CBT Supervisor | Watch exam progress and participant compliance (assigned from teacher data) |

Every role has configurable permissions managed through the **User Management, Role and Permission Reference** module.

## Modules

### Master Data
Grade levels, classes, majors, teacher records, non teaching staff records, and student records.

### Curriculum
Curriculum structure, class mapping, lesson schedules, academic calendar, and curriculum reports.

### Grading
Material content entry, summative scoring, report card scoring, ledger reports, e-report, and grading reports. Grading data is scoped by grade level and major.

### Student Affairs
New student admissions (PPDB), student guidance, talent and interest development, other student activities, and student affairs reports. Scoped by grade level and major.

### Counseling (BK)
Violation types, counseling agenda, student book, violation records, follow up, counseling sessions, home visits, student achievements, alumni data, and counseling reports. Scoped by grade level and major.

### Attendance
Manual teacher attendance, manual student attendance, RFID attendance for entry and exit, and attendance reports. Student attendance is scoped by grade level and major.

### Duty Teacher
Duty schedules, duty log, guest log, daily violations, tardiness, exit permits, and duty reports.

### Job Placement (BKK)
Internship registration, internship data, internship placement data, job vacancies, and placement reports.

### LMS
Learning materials, assignments, quizzes, discussion forums, and LMS reports. Scoped by grade level and major.

### Finance
Payment types, invoices with installment support, invoice details, invoice messaging and payment confirmation over WhatsApp, and financial reports. Scoped by grade level and major.

### CBT (Computer Based Test)
Question bank, exam package assembly, scheduling, participant allocation, supervisor assignment, automatic and manual grading, item analysis, and grade integration into the Grading module. Question bank and reports are scoped by grade level and major.

Participants take exams **only through the mobile app** in kiosk mode. The web CBT surface is **for proctors and supervisors only**, covering monitoring, session control, and exam administration. The web is not used by participants because it cannot lock the device.

### System
School profile, white label branding, attendance time settings, user management with RBAC, WhatsApp gateway, SMTP email settings, password change, password reset, announcements, notifications, and the report center.

## CBT Platform Split

| Surface | Users | Purpose |
|---------|-------|---------|
| Web | Proctors, supervisors | Monitoring, session control, exam administration |
| Mobile (Android/iOS) | Participants | Taking exams in secure kiosk mode |

Real time monitoring covers participant status (not started, in progress, done, disconnected, flagged), progress, and remaining time. Proctor controls include releasing tokens, resetting participant login, opening or closing access, extending time, and pausing or resuming a specific participant.

### Secure Exam Mode

Secure exam mode runs **only on the mobile app**, modeled after Safe Exam Browser and government CBT systems (UNBK/ANBK/TKA):

* Device kiosk and lockdown for the full exam
* Blocks app switching and multitasking, with exit attempts logged as violations
* Blocks screenshots, screen recording, and screen mirroring
* Disables notifications, split screen, copy paste, and share during the exam
* Exam token and password released per session by the proctor
* Single session login, one active device per participant
* Semi online mode, questions cached locally with periodic answer sync and resume on reconnect
* Violation detection and logging
* Randomized question and answer order per participant
* Full timestamps and audit trail
* Auto submit on time out or when the proctor closes the session

Android uses Lock Task Mode and Screen Pinning; iOS uses Guided Access and Automatic Assessment Configuration. Full detail lives in PRD-android.md and PRD-ios.md.

## Deployment Model

**Web, one per school.** Each school runs a separate self hosted instance with its own database, so one school's data is fully isolated at the instance level. Isolation, security, and RBAC are single tenant per instance, with no cross school `tenant_id` or row level security needed.

**Mobile apps for CBT participants.** A central school directory holds each school and its backend baseURL. A participant opens the app, selects a school, the app pulls that school's baseURL from the directory, and all CBT traffic (login, fetching questions, submitting answers, syncing) routes to that school's backend. One mobile app serves many schools with no central exam backend; the directory is the only shared component.

## Development Order

Development follows a backend to REST API to frontend approach. For each module the order is:

1. Business rules, define the process and the rules
2. Database schema, design tables, relations, and indexes with GORM models, then run the migration
3. Validation, server side input rules using Go struct validation
4. Endpoints, implement the REST API with Gin
5. JSON response, a consistent response format
6. Error handling, standard error and status codes
7. Frontend, the React interface that consumes the API

## Design System

The visual language targets institutional trust: a single blue action color over a neutral slate canvas, clean Inter typography, and moderate rounded corners. It is a dense daily work application, not a marketing site. Numbers use a monospace font so digit columns line up. The full token set, components, and usage rules live in DESIGN.md.

## Non Functional Requirements

* Per school isolation, one deployment and one database per school
* Security, authentication, RBAC, password encryption, and protection against SQL injection, XSS, and CSRF
* Audit trail for important activity
* Consistent API response and error handling
* Scalability across many schools and users
* Availability through regular backups and a recovery strategy
* Responsive interface for desktop and mobile

## Out of Scope

Dapodik integration, native mobile app for staff, and online payment gateway are possible later additions and are not part of the current scope.


