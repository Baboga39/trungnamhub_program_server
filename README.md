# Trung Nam Hub - Program Backend Service (`trungnamhub_program_server`)

Standalone, domain-driven microservice for managing **Quarterly Activity Programs** (**CHƯƠNG TRÌNH SINH HOẠT**) for Trung Nam Hub.

---

## 🏛️ System Architecture

- **Core Backend (`trungnamhub_server`)**: Source of truth for `User`, `Member`, `Branch`, `Session`, and `Attendance`.
- **Program Backend (`trungnamhub_program_server`)**: Source of truth for `QuarterProgram`, `ProgramLesson`, `ProgramLeader`, `ProgramFile`, and `ProgramEvaluation`.

No database foreign keys exist between the two services. `trungnamhub_program_server` stores logical references (`userId`, `branchId`, `coreSessionId`) and communicates with `trungnamhub_server` via clean REST APIs in `src/integrations/core/`.

---

## 🚀 Tech Stack

- **Runtime & Server**: Node.js, Express.js
- **Database & ORM**: PostgreSQL, Prisma ORM
- **Authentication**: JWT Authorization (shared JWT secret)
- **File Upload**: Cloudinary API + Multer
- **Middlewares**: `cors`, `helmet`, `morgan`, `express-rate-limit`, `dotenv`

---

## 📁 Project Structure

```
trungnamhub_program_server/
├── src/
│   ├── config/
│   │   ├── env.js
│   │   ├── cloudinary.js
│   │   └── coreApi.js
│   ├── controllers/
│   │   ├── programController.js
│   │   ├── lessonController.js
│   │   ├── leaderController.js
│   │   ├── fileController.js
│   │   ├── attendanceController.js
│   │   └── masterDataController.js
│   ├── services/
│   │   ├── programService.js
│   │   ├── lessonService.js
│   │   ├── leaderService.js
│   │   ├── fileService.js
│   │   ├── attendanceService.js
│   │   └── masterDataService.js
│   ├── routes/
│   │   ├── programRoutes.js
│   │   ├── lessonRoutes.js
│   │   ├── leaderRoutes.js
│   │   ├── fileRoutes.js
│   │   ├── attendanceRoutes.js
│   │   └── masterDataRoutes.js
│   ├── middlewares/
│   │   ├── authMiddleware.js
│   │   ├── branchScopeMiddleware.js
│   │   ├── errorMiddleware.js
│   │   └── uploadMiddleware.js
│   ├── integrations/
│   │   └── core/
│   │       ├── coreApiClient.js
│   │       ├── userService.js
│   │       ├── branchService.js
│   │       ├── sessionService.js
│   │       └── attendanceService.js
│   ├── validators/
│   │   ├── programValidator.js
│   │   ├── lessonValidator.js
│   │   └── fileValidator.js
│   ├── utils/
│   │   ├── quarterUtils.js
│   │   ├── pagination.js
│   │   └── response.js
│   ├── routes.js
│   ├── app.js
│   └── server.js
├── prisma/
│   └── schema.prisma
├── .env.example
├── README.md
└── package.json
```

---

## 🔒 Authorization & Scoping Rules

1. **ADMIN (`role === "admin"`)**:
   - Access to view and manage programs, lessons, and attendance across all branches.
2. **USER / HUỲNH TRƯỞNG (`role === "user"`)**:
   - Strictly restricted to their assigned branch (`user.branch` / `user.branchId`).
   - Querying or specifying a different `branchId` returns **HTTP 403 Forbidden**.

---

## 📡 REST API Specifications (`/api/v1`)

### 1. Master Data
- `GET /api/v1/common-programs`: List of common program categories (`NGHI_LE`, `GIAO_SU`, `SINH_HOAT_CHUNG`, `TRO_CHOI`, `KHAC`).
- `GET /api/v1/locations`: List of activity location categories (`TRAI_DUONG`, `BAO_AN_DUONG`, `VAN_PHONG_BHD`, `HOI_TRUONG`, `SAN`, `KHAC`).

### 2. Quarter Programs
- `GET /api/v1/programs?year=2026&quarter=3&branchId=2`
- `GET /api/v1/programs/:id` (Returns full frontend-friendly payload with lessons, populated leaders, files, etc.)
- `POST /api/v1/programs` Body: `{ "year": 2026, "quarter": 3, "branchId": "2" }`
- `PATCH /api/v1/programs/:id`
- `DELETE /api/v1/programs/:id`

### 3. Program Lessons
- `GET /api/v1/programs/:programId/lessons`
- `GET /api/v1/lessons/:id`
- `POST /api/v1/programs/:programId/lessons` Body: `{ "date": "2026-08-15", "lessonText": "...", "prepared": true, ... }`
- `PATCH /api/v1/lessons/:id`
- `DELETE /api/v1/lessons/:id`

### 4. Leaders & Branch Users
- `GET /api/v1/users?branchId=2`: Proxy endpoint to fetch Users belonging to specified branch from Core Backend.
- `GET /api/v1/program-lessons/:lessonId/leaders`
- `POST /api/v1/program-lessons/:lessonId/leaders` Body: `{ "userId": 123, "role": "MAIN" }`
- `DELETE /api/v1/program-lessons/:lessonId/leaders/:userId`

### 5. File Uploads (Cloudinary)
- `POST /api/v1/program-lessons/:id/files`: Upload multipart form file (`file`).
- `GET /api/v1/program-lessons/:id/files`
- `DELETE /api/v1/program-lessons/:id/files/:fileId`

### 6. Attendance Integration
- `GET /api/v1/program-lessons/:id/attendance`: Fetches detailed attendance breakdown from Core Backend.
- `POST /api/v1/program-lessons/:id/sync-attendance`: Recalculates and updates `actualParticipantCount` (`PRESENT + LATE`).
- `POST /api/v1/program-lessons/:id/ensure-session`: Ensures a Core Session exists for the lesson date & branch.

---

## 🛠️ Setup & Running

```bash
# 1. Navigate to service folder
cd trungnamhub_program_server

# 2. Install dependencies
npm install

# 3. Setup environment variables
cp .env.example .env

# 4. Generate Prisma Client
npx prisma generate

# 5. Run database migrations
npx prisma migrate dev --name init

# 6. Start development server
npm run dev
```
