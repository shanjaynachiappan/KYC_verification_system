# Enterprise eKYC Verification Portal

A modern enterprise-grade eKYC Verification Portal built using React + Vite + TypeScript.

This repository contains **only the Frontend (UI Layer)**.

The application is intentionally designed so that every screen, component, and data layer can later be connected to backend APIs without major refactoring.

---

# Project Goal

The objective is to provide a scalable enterprise verification portal where verification officers can:

- Login securely
- View pending KYC requests
- Review applicant information
- Perform face verification
- Validate OCR extracted data
- Approve / Reject applications
- View verification results

Currently every module is UI-ready with mock services.

Backend integration is the next phase.

---

# Tech Stack

Frontend

- React 18
- Vite
- TypeScript
- React Router
- Tailwind CSS

Architecture

- Component Based
- Hooks Based
- Service Layer
- Mock API Layer
- Ready for REST Integration

---

# Project Structure

```
src/

components/
│
├── Logo.tsx
├── Spinner.tsx
├── StatusBadge.tsx
├── ThemeToggle.tsx
├── KpiCard.tsx

pages/

├── LandingPage.tsx
├── LoginPage.tsx
├── DashboardPage.tsx
├── WorkspacePage.tsx
├── FaceVerificationPage.tsx
└── ResultPage.tsx

hooks/

useDashboardData.ts

useVerificationQueue.ts

useApplicantDetails.ts

useVerificationAction.ts

useVerificationStatus.ts

useVerificationResult.ts

useFaceVerification.ts

services/

apiClient.ts

index.ts

mockData.ts

types/

index.ts

constants/

index.ts

context/

AuthContext.tsx

ThemeContext.tsx

layout/

AppLayout.tsx

App.tsx

main.tsx

```

---

# Application Flow

```
Landing Page

↓

Login

↓

Dashboard

↓

Select Applicant

↓

Workspace

↓

Face Verification

↓

Verification Result

↓

Approve / Reject

```

---

# Routing Flow

| Route | Description |
|---------|------------|
| / | Landing Page |
| /login | User Login |
| /dashboard | Dashboard |
| /workspace/:id | Verification Workspace |
| /face-verification/:id | Face Match Screen |
| /result/:id | Final Verification |

---

# Architecture

```
Page

↓

Hooks

↓

Service Layer

↓

API Client

↓

Backend API

```

During development

```
Page

↓

Hooks

↓

Mock Data

```

During integration

```
Page

↓

Hooks

↓

API Service

↓

Backend

```

No page level logic needs modification.

Only service functions should change.

---

# State Flow

```
Page

↓

Custom Hook

↓

Service

↓

Response

↓

Component

```

No component directly calls backend APIs.

---

# Current Mock Service

All APIs currently return mocked responses from

```
src/services/mockData.ts
```

During backend integration this file can be removed.

---

# Backend Integration

Only these files require modification.

```
services/

apiClient.ts

index.ts

```

Everything else remains unchanged.

---

# Expected Backend APIs

## Authentication

POST

```
/api/auth/login
```

Request

```json
{
    "email":"admin@email.com",
    "password":"******"
}
```

Response

```json
{
    "token":"",
    "user":{
        "id":"",
        "name":"",
        "role":""
    }
}
```

---

## Dashboard

GET

```
/api/dashboard
```

Returns

- Pending Count
- Approved Count
- Rejected Count
- Recent Activity
- Verification Queue

---

## Applicant Details

GET

```
/api/applicant/{id}
```

Returns

```json
{
    "name":"",
    "aadhaar":"",
    "pan":"",
    "documents":[],
    "ocrData":{}
}
```

---

## OCR Extraction

POST

```
/api/ocr
```

Multipart

```
Document Image
```

Returns

```json
{
    "aadhaar":"",
    "pan":"",
    "dob":"",
    "address":""
}
```

---

## Face Verification

POST

```
/api/face/verify
```

Request

```
Live Image

Reference Image
```

Returns

```json
{
    "matched":true,
    "score":98.2
}
```

---

## Liveness Detection

POST

```
/api/liveness
```

Returns

```json
{
    "live":true,
    "confidence":99.5
}
```

---

## Verification Result

POST

```
/api/verification/submit
```

Request

```json
{
    "status":"approved",
    "remarks":"Verified"
}
```

---

# Component Responsibility

## Landing

Application Entry

---

## Login

Authentication

---

## Dashboard

Queue

Statistics

Search

---

## Workspace

Applicant Details

OCR Data

Documents

Review

---

## Face Verification

Live Camera

Face Match

Confidence Score

---

## Result

Final Status

Approve

Reject

Remarks

---

# Service Layer

Every API call should remain inside

```
src/services
```

Pages must never directly call fetch() or axios().

---

# Folder Responsibilities

components/

Reusable UI Components

hooks/

Business Logic

pages/

Route Screens

services/

Backend APIs

context/

Global State

types/

Interfaces

constants/

Global Constants

layout/

Application Layout

---

# API Integration Checklist

Replace

```
mockData.ts
```

↓

Implement

```
fetch()

axios()

```

↓

Return same interface

↓

Hooks remain unchanged

↓

Pages remain unchanged

---

# Environment Variables

```
VITE_API_BASE_URL=
```

Future

```
VITE_FACE_API=

VITE_OCR_API=

VITE_SOCKET_URL=
```

---

# Error Handling

Expected

```
401 Unauthorized

403 Forbidden

404 Not Found

500 Internal Server Error
```

Service layer should normalize all errors.

---

# Loading States

Each request should support

Loading

Success

Error

Empty

---

# Authentication

Future

JWT Authentication

Refresh Token

Protected Routes

Role Based Access

---

# Coding Guidelines

Pages

Only UI Composition

Hooks

Business Logic

Services

Backend Communication

Components

Reusable UI Only

---

# Build

Install

```
npm install
```

Run

```
npm run dev
```

Build

```
npm run build
```

Preview

```
npm run preview
```

---

# Future Integrations

- OCR Engine
- Aadhaar Validation
- PAN Validation
- Face Recognition
- Liveness Detection
- Digital Signature
- Audit Logs
- Notification Service
- Analytics Dashboard
- Admin Management

---

# Contributors

Frontend

Deepak Raj D

Backend

(To be integrated)

OCR Team

(To be integrated)

Face Verification

(To be integrated)

DevOps

(To be integrated)

---

# Notes for Integration Team

This repository intentionally separates:

UI

Business Logic

API Layer

Backend developers should only modify:

```
src/services/
```

No page-level modifications should be required.

The UI has been built to remain stable regardless of backend implementation.