# 📘 New User Onboarding Guide for PeerPrep

## 1. Introduction

**Purpose**: Welcome to PeerPrep! This guide explains how PeerPrep simplifies school administration for Nigerian educational institutions. It is a modern, web-based system designed to help you manage classes, students, grades, and academic records efficiently, so you can focus more on teaching.

## 2. Getting Started

**Logging In**: To begin, [register](/register) an account with your email and password. Upon your first login, you’ll land on the main dashboard. We recommend visiting the [Settings](/settings) page first to set up your school’s profile.

**Dashboard Overview**: The [Dashboard](/dashboard) is your central hub. It provides an at-a-glance overview of key statistics, including total students, classes, and subjects, as well as a chart of recent grade distributions and a feed of recent activities.

## 3. Class Management

**Creating Classes**: Navigate to the [Classes](/classes) page to create your classrooms (e.g., "Primary 3B", "JSS 1A"). Each class must be assigned a level.

**Class Levels**: The level is a crucial number used for automatic promotions.
-   Primary 1 = Level 1
-   Primary 2 = Level 2
-   ...
-   Primary 6 = Level 6
-   JSS 1 = Level 7
-   And so on.

*Note*: If your school structure is different (e.g., your school doesn't have a Primary 6, and students move from Primary 5 to JSS 1), you should adjust the levels accordingly (e.g., Primary 5 = Level 5, JSS 1 = Level 6).

## 4. Student Management

**Adding Students**: Go to the [Students](/students) page to add new students. You can upload a photo, enter their name, and optionally assign them to a class right away. A unique Student ID is generated for you automatically.

**Auto-Level Assignment**: When you assign a student to a class, their academic level is automatically recorded based on the level you set for that class.

## 5. Academic Management

**Subject Assignment**: Go to the [Academics](/academics) page. First, create a "Master Subject List" of every subject taught in your school.

**Class-Subject Mapping**: After creating your subjects, you can assign them to specific classes. This ensures that when you enter grades, only the relevant subjects appear for each class.

## 6. Attendance Management

**Marking Attendance**: On the [Attendance](/attendance) page, select a class and a date. You can then mark each student as 'Present', 'Absent', or 'Late'.

**Viewing Attendance**: The attendance records for each student are visible on their individual profile page, accessible from the [Students](/students) page.

## 7. Grading Management

**Entering Grades**: On the [Grades](/grades) page, select a class and a subject to enter scores for two Continuous Assessments (CAs) and an Exam. The system automatically calculates the total and assigns a grade.

**Viewing and Filtering Grades**: After entering grades, you can click "View Grades" to see the full record. Use the filters to view grades from different terms and sessions.

## 8. Report Card Generation

**Generating Report Cards**: Navigate to the [Reports](/reports) page. Select a class or an individual student to generate a comprehensive, printable report card.

**Customization**: The report card automatically includes your school’s name, motto, and address from your profile settings. The AI uses grade, attendance, and trait data to write personalized comments.

## 9. Lesson Generator

**Creating Lesson Notes**: Use the [Lesson Generator](/lesson-generator) to create detailed, NERDC-compliant lesson notes. Select a class level, subject, and the number of weeks you want to generate.

**Customization and History**: You can provide additional context to guide the AI. Your last 20 generated notes are saved in the "History" panel for easy access.

## 10. Data Transfer

**Sending and Receiving Data**: The [Data Transfer](/transfer) page allows you to securely send a class roster (including student profiles and traits) to another registered user. Simply enter their unique User Code and select the data you wish to send.

**Transfer History**: A log of your incoming and outgoing transfers is available on this page. You can accept or reject incoming requests from here.

## 11. Settings and Notifications

**Managing Settings**:
-   **Profile**: On the [Settings](/settings) page, you can update your name, school name, motto, and profile picture.
-   **Academics**: Set the **Current Term** and **Current Session**. This is critical, as it determines the period for which new grades and attendance are recorded. All promotions and data resets are tied to these settings.

**Notifications**:
-   You will receive alerts in the notification bell for new incoming data transfers.

## 12. Promotion & Academic Session Management

This is the core of PeerPrep's yearly cycle, ensuring students transition smoothly.

**When Promotions Happen**:
-   Promotions are run from the **Class Details** page. This action is only available during the **Third Term**.
-   The system evaluates all students in the class based on their average score for the Third Term of the current session. Students who meet the pass mark (≥50% average) are promoted to the next class level.

**Data Retained After Promotion**:
-   Student's personal information (name, ID).
-   `promotionHistory`: A permanent log of their class progression.
-   Archived report cards, grades, and attendance from all past sessions.

**Data Reset for the New Session**:
-   The student's grade and attendance records are reset for the new academic session. They start the new class with a clean slate.

**Post-Promotion Actions**:
-   The promoted student will now appear in their new class.
-   They will no longer appear in the roster of their old class. The system does not create duplicates.
-   The dashboard statistics will update to reflect the new class counts.

## 13. AI Modules (Report Card & Lesson Generator)

**AI Report Card Generator**:
-   Before promotion, the AI uses the current session's data to generate the final 3rd-term report.
-   The AI is smart enough to include remarks like “Promoted to Primary 2” or “To Repeat Primary 1” based on the student's final average.
-   After promotion, the student’s data is ready for the new academic session.

**AI Lesson Note Generator**:
-   This tool generates lesson plans based on the class level, subject, and topic you provide. It is independent of the promotion cycle but is ready to help you plan for your newly promoted classes.
-   Old notes remain in your history for review.

## 14. Data Transfer (Post-Promotion Rules)

- **Before Promotions**: You can transfer class rosters or individual student data. If you transfer a class, all its students and their trait records are included.
- **After Promotions**: A promoted student is now part of their new class. Any new transfer of their old class will not include them. Data transfers always reflect the student's *current* class level.

## 15. Archived Data Access

**Purpose**: PeerPrep keeps all previous academic data safe and accessible without cluttering your current term's view.

**What’s Archived**:
-   Old grades, attendance records, and trait assessments for each student from previous terms and sessions.

**Access Points**:
-   On the **Grades** page, you can use the filter to select a past term or session to view historical grades.
-   On a student's individual profile page, their entire academic and attendance history is available for review.
-   Archived records are effectively read-only and do not interfere with new records you create for the current term.

## 16. Dashboard Updates After Promotion

Once promotions are complete, the **Dashboard** automatically refreshes to show:
-   Updated student counts for each class.
-   Recalculated statistics for the new academic session.

## 17. System-Wide Promotion Validation

To maintain data integrity, the system ensures the following after promotions:
-   **Students**: Each promoted student is correctly assigned to their new class ID.
-   **Classes**: Student rosters are updated to reflect who has left and who has joined.
-   **Grades & Attendance**: Old records are preserved under their original term/session, and new entries are correctly logged under the new term/session.
-   **Reports**: Old reports are preserved, and new reports are generated using the current session's data.

## 18. Administrative Safeguards

-   **Manual Overrides**: Currently, all promotions are based on the system's automated checks. Manual overrides are a planned future feature.
-   **Rollback Option**: The "Clear All School Data" option in the Settings page serves as a hard reset. A granular rollback feature is under consideration for future updates.
-   **Promotion Summary**: The system provides real-time feedback via toasts about how many students were successfully promoted. A formal summary report is a planned feature.

## 19. User Experience Enhancements

-   **Real-Time Sync**: The application uses real-time listeners, so data updates across your dashboard and class lists automatically.
-   **Progress Notifications**: The system provides clear feedback during data-intensive operations like generating reports or running promotions.
-   **Visual Indicators**: Badges and clear descriptions on pages like Data Transfer and student profiles help you understand the status of your data.

## 20. Testing & Quality Assurance Plan

Before new features are deployed, we ensure that:
-   Class lists correctly reflect student rosters after promotions and transfers.
-   No data duplication occurs during transfers or updates.
-   Report cards accurately match the final term results and promotion decisions.
-   Grade and attendance records correctly reset for the new session.
-   All historical (archived) data remains intact and accessible.
