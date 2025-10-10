# PeerPrep: Nigerian School Management System

PeerPrep is a modern, web-based school management system designed specifically for the Nigerian educational landscape. It empowers educators with a suite of tools to manage classes, students, grades, and academic records efficiently. The system leverages AI to streamline administrative tasks like generating report cards and lesson notes, allowing teachers to focus more on education.

## Core Features

- **Authentication**: Secure user registration and login using Firebase Authentication.
- **Dashboard**: A central hub providing an at-a-glance overview of key school statistics, including total student count, number of classes, and a summary of grade distributions.
- **Class Management**: Easily create and manage classes. View class details, including the list of enrolled students and assigned subjects.
- **Student Management**: Add, view, and manage student profiles. Each profile includes personal details, an auto-generated unique ID, and their academic records.
- **Academics & Subjects**: Maintain a master list of all subjects offered by the school and assign them to specific classes.
- **Gradebook**: A detailed grade management system for inputting and editing scores for continuous assessments (CAs) and exams.
- **Attendance**: A simple interface for marking daily student attendance (Present, Absent, Late) for any class on any given day.
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
| **Landing Page**    | `/`                        | The public-facing homepage that describes the app's features and provides links to log in or register.                                   |
| **Login**           | `/login`                   | Allows existing users to sign in to their accounts.                                                                                      |
| **Register**        | `/register`                | Allows new users to create an account. A user profile and a unique user code are generated upon registration.                            |
| **Dashboard**       | `/dashboard`               | The main landing page after login. Displays key stats like student/class counts and a grade distribution chart.                        |
| **Classes**         | `/classes`                 | Shows a grid of all created classes. Users can add new classes or click on one to open a detailed view of its students and subjects.     |
| **Students**        | `/students`                | Displays a gallery of all students in the school. Users can add new students or view an individual student's detailed profile page.      |
| **Academics**       | `/academics`               | Allows for the management of a master subject list and the assignment of those subjects to different classes.                            |
| **Attendance**      | `/attendance`              | A two-step page where a user first selects a class, then marks attendance for the students in that class for a selected date.            |
| **Grades**          | `/grades`                  | Users select a class and a subject to enter or view grades (CA1, CA2, Exam) for all students in that class.                              |
| **Report Cards**    | `/reports`                 | The interface for the AI Report Card Generator. Users can select a class or student to generate and view printable report cards.         |
| **Lesson Generator**| `/lesson-generator`        | The interface for the AI Lesson Note Generator. Users provide a topic and other details to generate multi-week lesson plans.             |
| **Data Transfer**   | `/transfer`                | Facilitates the secure transfer of data between users. Shows a history of incoming and outgoing transfer requests.                     |
| **Settings**        | `/settings`                | Users can update their profile, school information, and set the application-wide current academic term and session.                      |

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
