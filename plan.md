# Actionable Plan: AI Resume Generator (Core Logic Focus)

**Guiding Principles:**
*   **Core Logic First:** Prioritize implementing the main features: AI-powered document generation, rich-text editing, and PDF downloads.
*   **Iterative Backend:** Wire up Wasp actions and queries to support the core logic.
*   **Single Page Application (SPA):** All core user interactions occur within one primary Wasp page (`AppPage.tsx`).

---

**Phase 1 & 2: UI Foundation (Complete)** ✅

**Goal:** All foundational UI components for the accordion, profile form, and customization inputs are in place and functioning with mock data.
*   **Status:** ✅ DONE.

---

**Phase 3: Backend - Profile Data Persistence (Complete)** ✅

**Goal:** The user's core profile data (name, contact, summary) and structured entries (Education, Experience) are saved to the database and persist across reloads.
*   **Step 3.1: Define Prisma Models:** ✅ DONE. `UserProfile`, `EducationEntry`, and `ExperienceEntry` models are created.
*   **Step 3.2: Implement Wasp Operations:** ✅ DONE. `saveUserProfile` and `getUserProfile` actions and queries are implemented and handle all profile data.
*   **Step 3.3: Wire UI to Backend:** ✅ DONE. The `ProfileForm` is fully connected to the backend.

---

**Phase 4: Core Logic - AI Generation & Document Handling** ⏳ **NEXT UP**

**Goal:** Implement the primary business logic: generating documents with AI, allowing users to edit the output in a rich-text editor, and downloading the final document as a PDF.

**Step 4.1: Implement Real AI-Powered Generation** ⏳ **TODO**
    *   **Wasp Action:** Create a new Wasp `action` named `generateDocument` in a new `app/src/features/generation/operations.ts` file.
    *   **OpenAI Integration:** This action will call the OpenAI API, similar to the `generateGptResponse` in the `@/demo-ai-app`. It will construct a detailed prompt using data from:
        1.  The user's complete profile (`UserProfile`, `EducationEntry`, `ExperienceEntry`).
        2.  The customization options from `ResumeCustomizer` (target job, company, tone, etc.).
        3.  The selected `documentType` (Resume or Cover Letter).
        4.  (Future) The text content of an uploaded resume.
    *   **Data Persistence:** The generated content from OpenAI will be saved to the `GeneratedDocument` model in the database.
    *   **UI Wiring:** The "Generate" button in `AppPage.tsx` will be wired to call this new `generateDocument` action. The loading state should be handled gracefully.
    *   **Action:**
        1. Create `app/src/features/generation/operations.ts`.
        2. Implement the `generateDocument` action with OpenAI API calls.
        3. Declare the action in `main.wasp`.
        4. Update `AppPage.tsx` to use the action.
    *   **Verification:** Clicking "Generate" successfully creates and saves a new document based on user inputs.

**Step 4.2: Implement Rich Text Editing with Quill** ⏳ **TODO**
    *   **Integration:** Add the `react-quill` library to the project.
    *   **Modal Editor:** The "Edit" button in the `ResumeDisplay` component will open a modal dialog.
    *   **Quill Component:** Inside the modal, a Quill rich-text editor will be displayed, initialized with the `content` of the `GeneratedDocument`.
    *   **Save Action:** A "Save" button within the modal will call a new Wasp `action` named `updateGeneratedDocument`, which will take the document ID and the updated Quill editor content (as HTML) and persist it to the database.
    *   **Action:**
        1. Add `react-quill`.
        2. Modify `ResumeDisplay.tsx` to include the modal and Quill editor.
        3. Create and implement the `updateGeneratedDocument` action.
        4. Wire the "Save" button to the action.
    *   **Verification:** Users can edit the generated resume in a rich-text editor and save their changes.

**Step 4.3: Implement PDF Download** ⏳ **TODO**
    *   **Integration:** Add client-side libraries such as `jspdf` and `html2canvas` to handle PDF creation.
    *   **Client-Side Logic:** The "Download" button in `ResumeDisplay.tsx` will trigger a function that:
        1.  Takes the HTML content of the resume display area.
        2.  Uses `html2canvas` to create a canvas image of the content.
        3.  Uses `jspdf` to insert the image into a PDF document.
        4.  Triggers a browser download of the generated PDF.
    *   **Action:** Implement the download logic within the `ResumeDisplay.tsx` component.
    *   **Verification:** Clicking "Download" generates and downloads a professional-looking PDF of the resume.

---

**Phase 5: Future Integrations (User-Managed)**

**Goal:** These are features that will be implemented separately and are not part of the immediate core logic implementation.
*   **File Upload & Parsing:**
    *   Implement file upload functionality using a service like AWS S3.
    *   Create a backend process to parse uploaded resumes (PDF, DOCX) to extract text content, which can then be fed into the AI for regeneration tasks.
*   **Advanced Auth Methods:** Integrate social login providers (Google, GitHub).
*   **Payments:** Implement subscription/payment logic with Stripe.
*   **Email Sending:** Configure a production email provider like SendGrid.
*   **Analytics:** Integrate analytics services like Google Analytics.
