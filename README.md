# TeachFlow: Nigerian School Management System

TeachFlow is a modern, web-based school management system designed specifically for the Nigerian educational landscape. It empowers educators with a suite of tools to manage classes, students, grades, and academic records efficiently. The system leverages AI to streamline administrative tasks like generating report cards and lesson notes, allowing teachers to focus more on education.

## Core Features

- **Authentication**: Secure user registration and login using Firebase Authentication.
- **Dashboard**: A central hub providing an at-a-glance overview of key school statistics, including total student count, number of classes, and a summary of grade distributions.
- **Class Management**: Easily create and manage classes. View class details, including the list of enrolled students and assigned subjects.
- **Student Management**: Add, view, and manage student profiles. Each profile includes personal details, an auto-generated unique ID, and their academic records.
- **Academics & Subjects**: Maintain a master list of all subjects offered by the school and assign them to specific classes.
- **Gradebook**: A detailed grade management system for inputting and editing scores for continuous assessments (CAs) and exams.
- **Attendance**: A simple interface for marking daily student attendance (Present, Absent, Late) for any class on any given day.
- **Timetable**: An interactive tool for creating and managing weekly class schedules visually.
- **AI Report Card Generator**: An intelligent tool that generates comprehensive report cards for individual students or entire classes. It includes AI-driven, personalized comments for teachers and principals.
- **AI Lesson Note Generator**: A powerful assistant that creates detailed, NERDC-compliant lesson notes for any subject and class level, complete with objectives, activities, and evaluations.
- **Secure Data Transfer**: A unique feature allowing users to securely transfer class data (including student rosters) to another registered user using a system-generated transfer code.
- **Settings**: A dedicated page for users to manage their personal and school profile information, including school name, motto, and current academic term/session.

## Tech Stack

- **Framework**: Next.js (with App Router)
- **Language**: TypeScript
- **Backend & Database**: Firebase (Authentication, Firestore)
- **Styling**: Tailwind CSS & shadcn/ui for components
- **Generative AI**: Google's Gemini models via Genkit
- **State Management**: React Context & Hooks
- **Deployment**: Firebase App Hosting

## Pages & Functionality

| Page                | Path                       | Description                                                                                                                              |
| ------------------- | -------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| **Landing Page**    | `/`                        | **Public Homepage:** This is the app's front door. It describes features and benefits to attract new users. **Permissions:** Publicly accessible, no authentication required. |
| **Login**           | `/login`                   | **User Sign-In:** Allows existing users to access their accounts using email and password. Includes a link to the "Forgot Password" page. **Permissions:** Public, handles authentication flow. |
| **Register**        | `/register`                | **New User Signup:** Allows new teachers/admins to create an account. Upon registration, a user profile is created in Firestore with a unique, system-generated `userCode` for data transfer. **Permissions:** Public, creates a new user document in Firestore. |
| **Dashboard**       | `/dashboard`               | **Authenticated Homepage:** This is the main landing page after login. It displays key statistics (total students, classes, subjects) and a chart showing the overall grade distribution. **Permissions:** Requires authenticated user. Needs `read` access to `students`, `classes`, `subjects`, and `grades` subcollections. |
| **Classes**         | `/classes`                 | **Class Overview:** Shows a grid of all classes created by the user. Users can add new classes via a dialog. Clicking a class opens a side sheet with detailed information. **Permissions:** Requires authenticated user. Needs `read` and `write` access to the `classes` subcollection. |
| **Students**        | `/students`                | **Student Gallery:** Displays a gallery of all students. Users can add new students (with an auto-generated ID) and optionally assign them to a class. Clicking a student card opens their profile in a side sheet. **Permissions:** Requires authenticated user. Needs `read`/`write` on `students`, `read` on `classes`. |
| **Academics**       | `/academics`               | **Subject Management:** A two-part page. Users manage a master list of all subjects offered. They can then assign these subjects to specific classes from a multi-select dropdown. **Permissions:** Requires authenticated user. Needs `read`/`write` on `subjects` and `update` access on `classes` documents. |
| **Attendance**      | `/attendance`              | **Daily Roll Call:** A two-step process. The user first selects a class, then sees a list of students for that class. They can mark each student as 'Present', 'Absent', or 'Late' for a selected date and save the record. **Permissions:** Requires authenticated user. Needs `read` on `classes`/`students` and `write` access to the `attendance` subcollection. |
| **Timetable**       | `/timetable`               | **Weekly Schedule Manager:** Users can select a class to view its weekly timetable. An "Edit" mode allows them to add, modify, or remove periods for each day, assigning subjects to specific time slots. **Permissions:** Requires authenticated user. Needs `read` on `classes`/`subjects` and `read`/`write` on the `timetables` subcollection. |
| **Grades**          | `/grades`                  | **Grade Entry & Viewing:** Users select a class and subject to either enter or view grades. In the entry dialog, they can input scores for two Continuous Assessments (CAs) and an Exam. The system auto-calculates the total and assigns a grade. **Permissions:** Requires authenticated user. Needs `read` on `classes`/`students` and `read`/`write` on the `grades` subcollection. |
| **Report Cards**    | `/reports`                 | **AI Report Generation:** The interface for the AI Report Card Generator. Users select a class or a single student, and the system gathers all academic, attendance, and trait data to generate comprehensive, printable report cards with AI-driven comments. **Permissions:** Requires authenticated user. Needs `read` access across `students`, `classes`, `grades`, `attendance`, and `traits`. |
| **Lesson Generator**| `/lesson-generator`        | **AI Lesson Planning:** An assistant for creating detailed lesson notes. Users provide a topic, class level, subject, and number of weeks. The AI generates multi-week, NERDC-compliant lesson plans in Markdown, which can be downloaded as a PDF. **Permissions:** Requires authenticated user. |
| **Data Transfer**   | `/transfer`                | **Peer-to-Peer Sharing:** Facilitates the secure transfer of data (e.g., a full class with its student roster) between two registered users. The sender initiates a transfer using the recipient's unique user code. The recipient sees the incoming request and can choose to **accept** (copying the data to their account) or **reject** it. A history of all transfers is displayed. **Permissions:** Requires authenticated user. Needs `read` on `users` to find a user by code, `write` to their own `outgoingTransfers`, and `write` to the recipient's `incomingTransfers`. |
| **Settings**        | `/settings`                | **Profile & App Configuration:** Users can update their profile information (name, school details) and set the application-wide current academic term and session, which is used when creating new records like grades and attendance. **Permissions:** Requires authenticated user. Needs `read` and `write` access to their own user document. |

## Folder Structure

The project follows a standard Next.js App Router structure.

```
src
├── ai
│   ├── flows/          # Genkit AI flows (e.g., report card generation)
│   └── genkit.ts       # Genkit initialization
├── app
│   ├── (app)/          # Main authenticated app routes
│   │   ├── academics/
│   │   ├── attendance/
│   │   ├── classes/
│   │   ├── dashboard/
│   │   ├── grades/
│   │   ├── layout.tsx  # Main app layout with sidebar and header
│   │   ├── lesson-generator/
│   │   ├── reports/
│   │   ├── settings/
│   │   ├── students/
│   │   ├── timetable/  # Timetable management page
│   │   └── transfer/
│   ├── (auth)/         # Authentication routes (login, register)
│   ├── globals.css     # Global styles and Tailwind directives
│   └── layout.tsx      # Root layout
├── components
│   ├── ui/             # Reusable UI components from shadcn/ui
│   └── *.tsx           # Custom, larger components (e.g., class-details-content)
├── contexts/         # React Context providers (e.g., SettingsContext)
├── firebase/
│   ├── firestore/      # Custom hooks for Firestore (useCollection, useDoc)
│   └── *.ts            # Firebase initialization, providers, and config
├── hooks/            # Custom React hooks (e.g., use-toast)
├── lib/              # Utility functions, type definitions, and placeholder data
└── ...
```

## Getting Started

To get started with this project locally:

1.  **Install Dependencies**:
    ```bash
    npm install
    ```

2.  **Run the Development Server**:
    ```bash
    npm run dev
    ```

    This will start the Next.js application, typically on `http://localhost:9002`.
