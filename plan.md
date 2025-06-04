# Actionable Plan: AI Resume Generator (UI-First, Single-Page, Specific Flow)

**Guiding Principles:**
*   **UI First:** Build interactive UI components on a single main page, using mock data initially.
*   **Single Page Application (SPA):** All core user interactions occur within one primary Wasp page (`AppPage.tsx`).
*   **User Flow Focus:** Prioritize the described flow: Accordion for Profile/Upload -> Main Document Customization -> Generate -> View with Actions (Copy/Edit/Download).
*   **Iterative Backend:** Wire up Wasp actions, queries, and database models after UI components are drafted.
*   **Styling:** Leverage `app/src/admin/elements/` and provided screenshots for UI inspiration.
*   **Mock AI:** Defer actual AI integration.

---

**Phase 1: Core UI Shell & Top Accordion (Profile & Upload - Mocked Data)** ✅ **DONE**

**Goal:** Create the main application page (`AppPage.tsx`) with a top accordion section for persistent user profile information and resume upload. All interactions use mock data initially.

**Step 1.1: Define Main Application Page (`app/main.wasp` & `AppPage.tsx`)** ✅ **DONE**
    *   **Wasp:** Declare `AppPage` and route `/app`. **Crucially, mark this page as requiring authentication.**
        *   `route MainAppRoute { path: "/app", to: AppPage }`
        *   `page AppPage { component: import { AppPage } from "@src/AppPage.tsx", authRequired: true }` // Ensures user must be logged in.
    *   **React (`app/src/AppPage.tsx`):** Create the main page component.
        *   Layout: Top section (for accordion), Main content section (for document customization and display).
    *   **Action:** Create `AppPage.tsx` with basic layout. Define Wasp page/route.
    *   **Verification:** Main page renders with two distinct placeholder sections.

**Step 1.2: Top Accordion UI Component (`app/src/features/topsection/AccordionLayout.tsx`)** ✅ **DONE**
    *   **React:** Create an `AccordionLayout` component (or use a pre-built one from a library if available and simple, otherwise custom). It will contain one main item: "My Profile" (which internally handles profile form and resume upload).
        *   State: Manage which accordion item is open.
        *   Styling: Ensure it can be placed at the top and expand/collapse without disrupting the main content area significantly.
    *   **Action:** Develop `AccordionLayout.tsx`.
    *   **Verification:** Accordion component renders with its header, allows toggling visibility of content sections.

**Step 1.3: User Profile Form UI (`app/src/features/profile/ProfileForm.tsx`)** ✅ **DONE**
    *   **React:** Create `ProfileForm` (Full Name, Phone, Email, Professional Summary, Education array, Experience array).
        *   State: Manage form data using `useState`.
        *   Actions: Placeholder "Save Profile" button (logs to console).
        *   Integration: Embed `ProfileForm` within the "My Profile" section of `AccordionLayout.tsx` in `AppPage.tsx`.
    *   **Action:** Develop `ProfileForm.tsx` and integrate into accordion.
    *   **Verification:** Profile form is usable within the accordion, including adding/removing education/experience.

**Step 1.4: Resume Upload UI (`app/src/features/upload/UploadSection.tsx`)** ✅ **DONE**
    *   **React:** Create `UploadSection` (drag & drop or click to upload area).
        *   State: Manage selected file info locally.
        *   Actions: Placeholder "Upload" button/logic (logs file info to console).
        *   Integration: Embed `UploadSection` within the "My Profile" section of `AccordionLayout.tsx` in `AppPage.tsx`.
    *   **Action:** Develop `UploadSection.tsx` and integrate into accordion.
    *   **Verification:** Upload section is usable within the accordion.

---

**Phase 2: Main Document Customization & Generation UI (Mocked AI)** ✅ **DONE**

**Goal:** Build the main section for document-specific inputs (resume/cover letter), generation trigger, and display of the (mock) generated document with action buttons.

**Step 2.1: Document Customization Inputs UI (`app/src/features/customizer/ResumeCustomizer.tsx`)** ✅ **DONE**
    *   **React:** Create `ResumeCustomizer` component.
        *   Inputs: Fields for document-specific details (e.g., target job title, company, key skills to highlight - using tags/text inputs), sliders for tone (e.g., formal/casual), template choice (dropdowns: Modern, Classic, etc.), Document Type Toggle (Resume/Cover Letter).
        *   State: Manage customization options (passed from `AppPage.tsx`).
        *   Integration: Embed `ResumeCustomizer` in the main content section of `AppPage.tsx` (likely split into parts for layout).
    *   **Action:** Develop `ResumeCustomizer.tsx` and integrate.
    *   **Verification:** Customization inputs are available and update shared state in `AppPage.tsx`. Document type can be toggled.

**Step 2.2: Generation Button & Display Area (`AppPage.tsx` & `app/src/features/display/ResumeDisplay.tsx`)** ✅ **DONE**
    *   **React (`AppPage.tsx`):** Add a "Generate" button below `ResumeCustomizer`.
    *   **React (`ResumeDisplay.tsx`):** Create `ResumeDisplay` component.
        *   Props: `generatedContent: string`, `isEditing: boolean` (or similar).
        *   Display Logic: If `isEditing` is true, show content in a `<textarea>`. Otherwise, display as formatted text.
        *   Action Buttons: "Copy", "Edit"/"Save Edit", "Download" (initially log to console).
        *   Integration: Embed `ResumeDisplay` in `AppPage.tsx` below the generate button.
    *   **State (`AppPage.tsx`):** Manage `generatedDocumentContent` (string), `isEditingDocument` (boolean), `documentType` (string: "resume" or "coverLetter").
    *   **Mock Logic (`AppPage.tsx`):**
        *   "Generate" button: Takes data from `ProfileForm` state, `ResumeCustomizer` state, and `documentType`. Creates a mock document string (specific to resume or cover letter). Updates `generatedDocumentContent` state. Sets `isEditingDocument` to `false`.
        *   "Edit" button: Sets `isEditingDocument` to `true`.
        *   "Save Edit" button: Updates `generatedDocumentContent` from textarea, sets `isEditingDocument` to `false`.
        *   "Copy"/"Download": Log action to console.
    *   **Action:** Develop `ResumeDisplay.tsx`. Add button, state, and mock logic to `AppPage.tsx`.
    *   **Verification:** Can generate mock documents (resume/cover letter), view them, toggle edit mode, and see console logs for actions.

---

**Phase 3: Backend - Data Persistence (Profile, Uploads, Generated Documents)** ⏳ **NEXT UP**

**Goal:** Implement Prisma models and Wasp operations to save/retrieve profile, uploaded files metadata, and generated documents (resumes/cover letters).

**Step 3.1: Define Prisma Models (`app/schema.prisma`)** ⏳ **TODO**
    *   `UserProfile`: For persistent user info (name, contact, professional summary, etc., related to Wasp `User`). Initially simple; structured education/experience will be fully integrated in Phase 4.2.
    *   `UploadedResume`: Metadata for uploaded files (`originalFilename`, `storagePath`, `userAuthId`).
    *   `GeneratedDocument`:
        *   `documentType: String` (e.g., "RESUME", "COVER_LETTER")
        *   `content: String`
        *   `customizationParams: Json` (or String)
        *   `templateName: String`
        *   `userProfileId: Int` (or `userId: Int` if directly related to Wasp User)
    *   **Action:** Define models. Run `wasp db migrate-dev`.
    *   **Verification:** Schema migration successful.

**Step 3.2: Implement Wasp Operations**
    *   **Profile (`app/src/features/profile/actions.ts`, `queries.ts`):**
        *   Action `saveUserProfile`: Upserts `UserProfile` (initially simple fields).
        *   Query `getUserProfile`: Fetches `UserProfile` (initially simple fields).
    *   **Upload (`app/src/features/upload/api.ts` for file handling, `actions.ts` for metadata):**
        *   API Route `/api/resume-upload`: Handles file stream, saves file, creates `UploadedResume` metadata record.
    *   **Document Generation/Management (`app/src/features/resume/actions.ts` - consider renaming folder to `document` or `generation`, `queries.ts`):**
        *   Action `generateDocument`: Takes profile data, customization params, and `documentType`. (Mock AI). Creates `GeneratedDocument`.
        *   Action `updateGeneratedDocument`: Updates content/params of an existing `GeneratedDocument`.
        *   Query `getLatestGeneratedDocument`: Fetches the most recent `GeneratedDocument` for the user (perhaps filterable by type, or fetch latest overall).
    *   **Action:** Declare in `main.wasp`. Implement functions.
    *   **Verification:** Operations type-correct. Basic logic functional (mock AI).

**Step 3.3: Wire UI to Backend (`AppPage.tsx` and child components)**
    *   **Profile:** `ProfileForm` loads data with `getUserProfile`, saves with `saveUserProfile`.
    *   **Upload:** `UploadSection` uses `/api/resume-upload`.
    *   **Document:** `AppPage.tsx` loads latest document with `getLatestGeneratedDocument`. "Generate" button calls `generateDocument` (passing `documentType`). "Save Edit" calls `updateGeneratedDocument`. Mock copy/download for now.
    *   **Action:** Refactor UI to use Wasp operations.
    *   **Verification:** All interactions persist data. Profile is loaded on app start if exists. Documents are saved and loaded.

---

**Phase 4: Advanced Functionality & Polish**

**Goal:** Implement actual AI, enhance profile persistence, refine UI/UX.

**Step 4.1: Implement Real Copy & Download**
    *   **Copy:** Use `navigator.clipboard.writeText()`.
    *   **Download:** Create a blob from document content and trigger download via an `<a>` tag (filename should reflect document type).
    *   **Action:** Implement client-side copy/download in `ResumeDisplay.tsx`.
    *   **Verification:** Buttons work as expected.

**Step 4.2: Advanced Profile Backend (Multiple Education/Experience)**
    *   **UI:** `ProfileForm.tsx` already supports multiple education/experience entries.
    *   **Prisma:** Define `EducationEntry`, `ExperienceEntry` models related to `UserProfile`.
    *   **Backend:** Update `saveUserProfile` and `getUserProfile` to handle these relations (create, update, delete nested entries).
    *   **Action:** Implement Prisma model changes and update backend operations.
    *   **Verification:** Can save and retrieve structured education/experience data.

**Step 4.3: Real AI Integration**
    *   Replace mock AI logic in `generateDocument` action with actual calls to an AI service.
    *   The AI logic must be able to handle requests for "RESUME" and "COVER_LETTER" `documentType`, potentially using different prompts or processing.
    *   Securely manage API keys.

**Step 4.4: UI/UX Refinement**
    *   Thoroughly style all components based on `app/src/admin/elements/` and screenshots.
    *   Improve loading states, error messages, and overall flow, including clear feedback for document type selection and generation.

---

Next Step: **Step 3.1: Define Prisma Models (`app/schema.prisma`)**
