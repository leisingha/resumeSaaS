# Actionable Plan: AI Resume Generator (UI-First, Single-Page, Specific Flow)

**Guiding Principles:**
*   **UI First:** Build interactive UI components on a single main page, using mock data initially.
*   **Single Page Application (SPA):** All core user interactions occur within one primary Wasp page (`AppPage.tsx`).
*   **User Flow Focus:** Prioritize the described flow: Accordion for Profile/Upload -> Main Resume Customization -> Generate -> View with Actions (Copy/Edit/Download).
*   **Iterative Backend:** Wire up Wasp actions, queries, and database models after UI components are drafted.
*   **Styling:** Leverage `app/src/admin/elements/` and provided screenshots for UI inspiration.
*   **Mock AI:** Defer actual AI integration.

---

**Phase 1: Core UI Shell & Top Accordion (Profile & Upload - Mocked Data)**

**Goal:** Create the main application page (`AppPage.tsx`) with a top accordion section for persistent user profile information and resume upload. All interactions use mock data initially.

**Step 1.1: Define Main Application Page (`app/main.wasp` & `AppPage.tsx`)**
    *   **Wasp:** Declare `AppPage` and route `/app`. **Crucially, mark this page as requiring authentication.**
        *   `route MainAppRoute { path: "/app", to: AppPage }`
        *   `page AppPage { component: import { AppPage } from "@src/AppPage.tsx", authRequired: true }` // Ensures user must be logged in.
    *   **React (`app/src/AppPage.tsx`):** Create the main page component.
        *   Layout: Top section (for accordion), Main content section (for resume customization and display).
    *   **Action:** Create `AppPage.tsx` with basic layout. Define Wasp page/route.
    *   **Verification:** Main page renders with two distinct placeholder sections.

**Step 1.2: Top Accordion UI Component (`app/src/features/topsection/AccordionLayout.tsx`)**
    *   **React:** Create an `AccordionLayout` component (or use a pre-built one from a library if available and simple, otherwise custom). It will contain two items: "My Profile" and "Upload Existing Resume".
        *   State: Manage which accordion item is open.
        *   Styling: Ensure it can be placed at the top and expand/collapse without disrupting the main content area significantly.
    *   **Action:** Develop `AccordionLayout.tsx`.
    *   **Verification:** Accordion component renders with two headers, allows toggling visibility of content sections.

**Step 1.3: User Profile Form UI (`app/src/features/profile/ProfileForm.tsx`)**
    *   **React:** Create `ProfileForm` (similar to image: Full Name, Phone, Email, Username, BIO).
        *   State: Manage form data using `useState`.
        *   Actions: Placeholder "Save Profile" button (logs to console).
        *   Integration: Embed `ProfileForm` within the "My Profile" section of `AccordionLayout.tsx` in `AppPage.tsx`.
    *   **Action:** Develop `ProfileForm.tsx` and integrate into accordion.
    *   **Verification:** Profile form is usable within the accordion.

**Step 1.4: Resume Upload UI (`app/src/features/upload/UploadSection.tsx`)**
    *   **React:** Create `UploadSection` (similar to image: drag & drop or click to upload area).
        *   State: Manage selected file info locally.
        *   Actions: Placeholder "Upload" button/logic (logs file info to console).
        *   Integration: Embed `UploadSection` within the "Upload Existing Resume" section of `AccordionLayout.tsx` in `AppPage.tsx`.
    *   **Action:** Develop `UploadSection.tsx` and integrate into accordion.
    *   **Verification:** Upload section is usable within the accordion.

---

**Phase 2: Main Resume Customization & Generation UI (Mocked AI)**

**Goal:** Build the main section for resume-specific inputs, generation trigger, and display of the (mock) generated resume with action buttons.

**Step 2.1: Resume Customization Inputs UI (`app/src/features/resume/ResumeCustomizer.tsx`)**
    *   **React:** Create `ResumeCustomizer` component.
        *   Inputs: Fields for resume-specific details (e.g., target job title, company, key skills to highlight - using tags/text inputs), sliders for tone (e.g., formal/casual), template choice (radio buttons: Modern, Classic, etc.).
        *   State: Manage customization options using `useState`.
        *   Integration: Embed `ResumeCustomizer` in the main content section of `AppPage.tsx`.
    *   **Action:** Develop `ResumeCustomizer.tsx` and integrate.
    *   **Verification:** Customization inputs are available and update local state.

**Step 2.2: Generation Button & Display Area (`AppPage.tsx` & `app/src/features/resume/ResumeDisplay.tsx`)**
    *   **React (`AppPage.tsx`):** Add a "Generate Resume" button below `ResumeCustomizer`.
    *   **React (`ResumeDisplay.tsx`):** Create `ResumeDisplay` component.
        *   Props: `generatedContent: string`, `isEditing: boolean`.
        *   Display Logic: If `isEditing` is true, show content in a `<textarea>`. Otherwise, display as formatted text (e.g., in a `<div>` with `white-space: pre-wrap`).
        *   Action Buttons: "Copy", "Edit"/"Save Edit", "Download" (initially log to console).
        *   Integration: Embed `ResumeDisplay` in `AppPage.tsx` below the generate button.
    *   **State (`AppPage.tsx`):** Manage `generatedResumeContent` (string), `isEditingResume` (boolean).
    *   **Mock Logic (`AppPage.tsx`):**
        *   "Generate Resume" button: Takes data from `ProfileForm` state (from accordion) and `ResumeCustomizer` state. Creates a mock resume string. Updates `generatedResumeContent` state. Sets `isEditingResume` to `false`.
        *   "Edit" button: Sets `isEditingResume` to `true`.
        *   "Save Edit" button: Updates `generatedResumeContent` from textarea, sets `isEditingResume` to `false`.
        *   "Copy"/"Download": Log action to console.
    *   **Action:** Develop `ResumeDisplay.tsx`. Add button, state, and mock logic to `AppPage.tsx`.
    *   **Verification:** Can generate mock resume, view it, toggle edit mode, and see console logs for actions.

---

**Phase 3: Backend - Data Persistence (Profile, Uploads, Generated Resumes)**

**Goal:** Implement Prisma models and Wasp operations to save/retrieve profile, uploaded files metadata, and generated resumes.

**Step 3.1: Define Prisma Models (`app/schema.prisma`)**
    *   `UserProfile`: For persistent user info (name, contact, bio, etc., related to Wasp `User`).
    *   `UploadedResume`: Metadata for uploaded files (`originalFilename`, `storagePath`, `userAuthId`).
    *   `GeneratedResume`: `content`, `customizationParams` (JSON or string for options from `ResumeCustomizer`), `templateName`, `userProfileId`.
    *   **Action:** Define models. Run `wasp db migrate-dev`.
    *   **Verification:** Schema migration successful.

**Step 3.2: Implement Wasp Operations**
    *   **Profile (`app/src/features/profile/actions.ts`, `queries.ts`):**
        *   Action `saveUserProfile`: Upserts `UserProfile`.
        *   Query `getUserProfile`: Fetches `UserProfile`.
    *   **Upload (`app/src/features/upload/api.ts` for file handling, `actions.ts` for metadata):**
        *   API Route `/api/resume-upload`: Handles file stream (e.g., `multer`), saves file, creates `UploadedResume` metadata record.
    *   **Resume Generation/Management (`app/src/features/resume/actions.ts`, `queries.ts`):**
        *   Action `generateResume`: Takes profile data, customization params. (Mock AI). Creates `GeneratedResume`.
        *   Action `updateGeneratedResume`: Updates content/params of an existing `GeneratedResume`.
        *   Query `getLatestGeneratedResume`: Fetches the most recent `GeneratedResume` for the user.
    *   **Action:** Declare in `main.wasp`. Implement functions.
    *   **Verification:** Operations type-correct. Basic logic functional (mock AI).

**Step 3.3: Wire UI to Backend (`AppPage.tsx` and child components)**
    *   **Profile:** `ProfileForm` loads data with `getUserProfile`, saves with `saveUserProfile`.
    *   **Upload:** `UploadSection` uses `/api/resume-upload`.
    *   **Resume:** `AppPage.tsx` loads latest resume with `getLatestGeneratedResume`. "Generate Resume" calls `generateResume`. "Save Edit" calls `updateGeneratedResume`. Mock copy/download for now.
    *   **Action:** Refactor UI to use Wasp operations.
    *   **Verification:** All interactions persist data. Profile is loaded on app start if exists.

---

**Phase 4: Advanced Functionality & Polish**

**Goal:** Implement actual AI, enhance profile, refine UI/UX.

**Step 4.1: Implement Real Copy & Download**
    *   **Copy:** Use `navigator.clipboard.writeText()`.
    *   **Download:** Create a blob from resume content and trigger download via an `<a>` tag.
    *   **Action:** Implement client-side copy/download in `ResumeDisplay.tsx`.
    *   **Verification:** Buttons work as expected.

**Step 4.2: Advanced Profile (Multiple Education/Experience within Accordion)**
    *   **UI:** Update `ProfileForm.tsx` to manage lists of education/experience items (add/edit/delete).
    *   **Prisma:** Add `EducationEntry`, `ExperienceEntry` models related to `UserProfile`.
    *   **Backend:** Update `saveUserProfile` and `getUserProfile` to handle these relations.
    *   **Action:** Implement changes.
    *   **Verification:** Can manage structured education/experience.

**Step 4.3: Real AI Integration**
    *   Replace mock AI logic in `generateResume` action with actual calls to an AI service.
    *   Securely manage API keys.

**Step 4.4: UI/UX Refinement**
    *   Thoroughly style all components based on `app/src/admin/elements/` and screenshots.
    *   Improve loading states, error messages, and overall flow.

---

Next Step: **Step 1.1: Define Main Application Page (`app/main.wasp` & `AppPage.tsx`)**
