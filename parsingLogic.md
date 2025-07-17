# Detailed Resume Parsing Implementation Plan

This document provides a detailed, step-by-step guide for implementing the automatic resume parsing feature. The instructions are designed to be simple and clear to minimize implementation errors.

---

### **Phase 1: Backend Setup**

This phase focuses on creating the server-side logic required to read and parse the resume file.

#### **Step 1.1: Install the PDF Parsing Library** (Completed)

*   **Action:** Run the following commands in your project's terminal to add the necessary `pdf-parse` library.
    ```bash
    npm install pdf-parse
    npm install @types/pdf-parse --save-dev
    ```

#### **Step 1.2: Create an S3 File Downloader** (Completed)

*   **Goal:** To create a function that can fetch the uploaded PDF from your S3 bucket so the server can process it.
*   **File to Modify:** `app/src/file-upload/s3Utils.ts`
*   **Action:** Add a new exported function named `downloadFileFromS3`.
    *   This function will accept one argument: the S3 `key` (a string).
    *   It will use the AWS SDK's `GetObjectCommand` to fetch the file from S3.
    *   It will convert the file's content into a `Buffer`, which is the format needed by `pdf-parse`, and return it.

---
### **Revised and Safer Plan for Steps 1.3 & 1.4**

**Important Note:** Previous attempts at the following steps caused application instability. This revised plan is more incremental and includes robust error handling to prevent crashes. We will build the feature in small, testable pieces.

#### **Step 1.3: Build the Core "AI Resume Parser" Action (Incrementally)**

*   **Goal:** To create the main backend action in a safe, step-by-step manner, ensuring the server remains stable.
*   **File to Modify:** `app/src/features/profile/operations.ts`

*   **Action (Part A) - Create a Placeholder Action:**
    1.  First, I will create an empty shell for the `parseResumeAndPopulateProfile` action.
    2.  This placeholder will accept the `{ key: string }` argument, check for a logged-in user, and simply `console.log` the key and a success message. It will **not** contain any file processing or database logic yet.
    3.  This step allows us to register the action and restart the server (Step 1.4) to confirm that the basic wiring is correct without risking a crash.

*   **Action (Part B) - Add File Parsing with Error Handling:**
    1.  After confirming the placeholder works, I will add the logic to download the file from S3 and parse it with `pdf-parse`.
    2.  **Crucially**, this entire block of code will be wrapped in a `try...catch` block. If fetching or parsing fails for any reason (e.g., corrupted file, S3 issue), the error will be caught and logged, and the action will stop gracefully instead of crashing the server.

*   **Action (Part C) - Add OpenAI Call with Error Handling:**
    1.  Next, I will add the call to the OpenAI API.
    2.  This logic will also be placed inside its own `try...catch` block to handle potential API errors (e.g., invalid API key, network issues, malformed response). The action will log the AI's response for debugging.

*   **Action (Part D) - Add Database Updates within a Transaction:**
    1.  This is the final and most critical part of the action's logic.
    2.  All database modifications will be wrapped in a Prisma Transaction (`context.entities.$transaction(...)`).
    3.  This guarantees that all database operations—deleting old entries, updating the user profile, and creating new entries—either **all succeed together or all fail together**. This prevents the database from being left in a partially updated, inconsistent state, which could cause data loading issues.
    4.  This transaction will also be inside a `try...catch` block to handle any potential database errors gracefully.

#### **Step 1.4: Register the New Action in Wasp**

*   **Goal:** To make the new backend action available to the application **after** its placeholder shell is confirmed to be safe.
*   **File to Modify:** `main.wasp`
*   **Action:**
    *   After completing "Action (Part A)" from Step 1.3, I will add the action declaration to the `//#region Profile` section.
        ```wasp
        action parseResumeAndPopulateProfile {
          fn: import { parseResumeAndPopulateProfile } from "@src/features/profile/operations",
          entities: [UserProfile, EducationEntry, ExperienceEntry, User]
        }
        ```
    *   We will then restart the Wasp server to ensure it compiles successfully before proceeding with the more complex logic.

---

### **Phase 2: Connecting the Frontend** 
_(This phase remains the same but will only be implemented after the backend is fully built and confirmed to be stable.)_

#### **Step 2.1: Modify the `createFile` Action to Return the S3 Key**

*   **Goal:** To get the unique S3 file key on the frontend so it can be passed to the parsing action.
*   **File to Modify:** `app/src/file-upload/operations.ts`
*   **Action:**
    *   Locate the `createFile` action.
    *   Modify its return object to include the `key`.

#### **Step 2.2: Trigger the Parsing Action Automatically After Upload**

*   **Goal:** To automatically start the parsing process as soon as the file upload is complete.
*   **File to Modify:** `app/src/features/upload/UploadSection.tsx`
*   **Action:**
    *   Locate the `handleUploadClick` function. After the S3 upload is successful, call the new `parseResumeAndPopulateProfile` action with the `key`.
    *   This requires importing the action and initializing it with `useAction`.
