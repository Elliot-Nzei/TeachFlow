# 📘 PeerPrep: Your Complete User Guide

## 1. Introduction

Welcome to PeerPrep! This guide provides a comprehensive overview of the entire platform, explaining how to use each feature to manage your school's administrative tasks efficiently. From initial setup to generating AI-powered reports, this document is your single source of truth.

---

## 2. Getting Started: Initial Setup

Before you dive in, it's crucial to configure your school's details. All reports, records, and generated documents will use this information.

**Go to [Settings](/settings)**

1.  **Profile Information**:
    *   Fill in your `Full Name`, `School Name`, `School Motto`, and `School Address`.
    *   Upload a `Profile Picture` for personalization.
    *   Your unique `User Code` is displayed here. You will need this to receive data from other PeerPrep users.

2.  **Academic Settings (Very Important!)**:
    *   **Current Term**: Select the academic term you are currently in (e.g., "First Term"). All new grades, attendance, and payments will be recorded for this term.
    *   **Current Session**: Enter the current academic session (e.g., "2024/2025"). This is crucial for record-keeping and promotions.

---

## 3. The Dashboard

**Go to [Dashboard](/dashboard)**

The dashboard is your central hub. After logging in, you'll see:

*   **Key Statistics**: At-a-glance cards showing your total number of students, classes, and subjects, plus total fees collected for the current term.
*   **Payment Summary**: A chart visualizing the payment status of students (Paid, Partially Paid, Owing) for the current term.
*   **Grade Distribution**: A bar chart summarizing the overall academic performance across all classes.
*   **Recent Activity**: A feed of recently added students and newly created classes.

---

## 4. Core Modules: Classes, Students & Subjects

This is the foundation of your school's structure. It's best to set these up in order.

### Step 1: Manage Subjects
**Go to [Academics](/academics)**

1.  **Create Master Subject List**: In the "Master Subject List" card, add every subject taught in your school (e.g., "Mathematics", "English Language", "Basic Science").
2.  **Assign Subjects to Classes**: Once subjects are created, they become available in the "Class Subject Management" card. Here, you can assign the relevant subjects to each class you've created.

### Step 2: Manage Classes
**Go to [Classes](/classes)**

1.  **Create a Class**: Click "Add New Class".
    *   **Name**: Give the class a name (e.g., "Primary 1A", "JSS 2B").
    *   **Level**: Assign an academic level. This is a number used for promotion logic.
        *   Primary 1 = Level 1
        *   Primary 2 = Level 2
        *   ...
        *   Primary 6 = Level 6
        *   JSS 1 = Level 7, and so on.
2.  **View Class Details**: Click on any class card to open a side panel showing its assigned students and subjects.

### Step 3: Manage Students
**Go to [Students](/students)**

1.  **Add a New Student**: Click "Add Student".
    *   A unique **Student ID** is automatically generated based on your school's acronym and a counter.
    *   Enter the student's `Full Name` and upload a `Photo`.
    *   You can optionally assign the student to a `Class` immediately. If you don't, they will be listed as "Unassigned".
2.  **View Student Profile**: Click on a student's card to view their complete profile, including their academic record, attendance history, and behavioral traits.

---

## 5. Daily & Termly Operations

Once your school structure is set up, you can perform daily and termly tasks.

### Attendance
**Go to [Attendance](/attendance)**

1.  Select a class from the list.
2.  Choose the date for which you want to mark attendance.
3.  For each student, select their status: **Present**, **Absent**, or **Late**.
4.  Click **Save Attendance**. The records are saved for the current term and session set in your settings.

### Gradebook
**Go to [Grades](/grades)**

1.  Select a class from the sidebar.
2.  Click **Add / Edit Grades**.
3.  In the dialog, choose a **Subject**. The list of students in that class will appear.
4.  Enter scores for **CA1 (20)**, **CA2 (20)**, and **Exam (60)**. The total and grade are calculated automatically.
5.  Click **Save Grades**.
6.  To see recorded grades, click **View Grades** and use the filters to select the desired term and session.

### Payments
**Go to [Payments](/payments)**

This page helps you track school fee payments.

1.  **Set Class Fee**: Select a class and enter the termly fee amount in the "Class Fee (₦)" input, then click **Save Fee**.
2.  **Record a Payment**: The table shows all students in the selected class. Click on a student's row to open the payment dialog.
3.  Enter the **total amount paid** by the student for the current term. The system will calculate the balance.
4.  Click **Save Payment**. The student's status (Paid, Partially Paid, Owing) will update automatically.

---

## 6. AI-Powered Tools

Leverage generative AI to automate complex tasks.

### AI Report Card Generator
**Go to [Reports](/reports)**

1.  **Select Target**: Choose to generate reports for an entire **Class** or a single **Student**.
2.  **Generate**: Click the **Generate Reports** button.
3.  **Process**: The AI gathers all academic, attendance, and trait data for the current term and session. It then writes personalized, constructive comments for both the form teacher and the principal.
4.  **Preview & Download**: The generated report cards appear in a print-friendly preview. You can **Print** them directly or **Download** them as a single, multi-page PDF.

### AI Lesson Note Generator
**Go to [Lesson Generator](/lesson-generator)**

1.  **Fill Details**: Select the `Class Level`, `Subject`, `Topic`, and the `Number of Weeks` you want the note to cover.
2.  **Generate**: Click **Generate Lesson Note**. The AI will create a detailed, week-by-week lesson plan that is compliant with the NERDC curriculum.
3.  **Review and Export**: The generated note appears in the preview area. You can **Copy**, **Print**, or **Download** it as a PDF.
4.  **History**: Your last 20 generated notes are saved. Click the **History** button to access and reload them.

### AI Exam Question Generator
**Go to [Exam Generator](/exam-question-generator)**

1.  **Set Parameters**: Select the `Class` and `Subject`. Enter the `Topics` the exam should cover (separated by commas).
2.  **Choose Format**: Select the `Question Type` (Objective, Essay, or Both) and the `Question Count`.
3.  **Generate**: Click **Generate Questions**.
4.  **Preview & Export**: The questions appear in a clean A4 preview. You can then download the exam as a PDF, with an optional answer key for objective questions.

---

## 7. Advanced Features

### End-of-Session Promotion
**Go to the [Classes](/classes) page and select a class.**

Promotions are a critical year-end task.

*   **When**: Promotions can only be run during the **Third Term**. The "Run Promotions" button will be disabled during other terms.
*   **How it Works**: The system checks the `Third Term` grades for all students in the selected class. Students with an average score of **50% or higher** are automatically promoted.
*   **The Process**:
    1.  The student is moved to the class with the next `level` (e.g., from a Level 1 class to a Level 2 class).
    2.  Their `classId` and `className` are updated.
    3.  A permanent record is added to their `promotionHistory`.
    4.  The student is removed from the old class's roster and added to the new one.

### Data Transfer
**Go to [Data Transfer](/transfer)**

This feature allows you to securely share data with another teacher or administrator using PeerPrep.

1.  **Initiate Transfer**:
    *   Enter the recipient's unique `User Code`.
    *   Select the `Data Type` you want to send (e.g., "Full Class Data").
    *   Choose the specific `Item` (e.g., "JSS 2B").
    *   Click **Send Transfer Request**.
2.  **Manage Transfers**:
    *   **History**: This tab shows a log of your sent and received transfers.
    *   **Accepting**: When you receive a transfer, you can **Accept** it to merge the data into your own account. If a class with the same name already exists, the incoming students will be added to your existing class.
    *   **Rejecting**: You can also **Reject** incoming transfers.

---

## 8. Danger Zone: Clearing Data

**Go to [Settings](/settings)**

Under the "Danger Zone" section, there is an option to **Clear All School Data**.

*   **WARNING**: This action is **permanent and irreversible**.
*   It will delete all your created data: classes, students, subjects, grades, attendance, traits, and payment records.
*   To confirm, you must type the word **DELETE** into the confirmation box. Use this with extreme caution.