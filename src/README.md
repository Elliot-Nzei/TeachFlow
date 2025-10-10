
# PeerPrep: Nigerian School Management System

Welcome to PeerPrep! This is a modern, web-based school management system designed specifically for the Nigerian educational landscape. It empowers educators with a powerful and intuitive suite of tools to manage classes, students, grades, and academic records efficiently. The system leverages AI to streamline administrative tasks like generating comprehensive report cards and detailed lesson notes, allowing teachers to dedicate more time to what they do best: education.

This guide will walk you through everything PeerPrep has to offer and how you can make the most of it.

## How to Use PeerPrep: A Step-by-Step Guide

Getting started with PeerPrep is simple. Here’s a typical workflow for a new user:

1.  **Register Your Account**: Head to the [Register](/register) page to create your account with your email and password. Upon registration, you are assigned a unique, non-editable **User Code** (e.g., `NSMS-XXXXX`). This code is your identifier for securely sharing data with other PeerPrep users.

2.  **Set Up Your Profile**: After your first login, go to the [Settings](/settings) page. Here you can:
    *   Update your school's name, motto, and address.
    *   Set the **Current Term** and **Current Session** (e.g., "First Term", "2024/2025"). This is crucial as all new records like grades and attendance will use these values.

3.  **Manage Your Subjects**: Go to the [Academics](/academics) page. This is a two-part process:
    *   **Master Subject List**: First, create a master list of every subject taught at your school (e.g., Mathematics, English, Basic Science).
    *   **Assign to Classes**: Once you have classes, you can assign subjects from your master list to them.

4.  **Create Your Classes**: Navigate to the [Classes](/classes) page and click "Add New Class" to create your classrooms (e.g., "Primary 3B", "JSS 1A").

5.  **Enroll Your Students**: On the [Students](/students) page, add your students one by one. A unique Student ID is automatically generated. You can optionally assign them to a class during creation or add them to a class later from the Class Details view.

6.  **Take Daily Attendance**: Use the [Attendance](/attendance) page to mark daily attendance. Select a class and a date, then mark each student as 'Present', 'Absent', or 'Late'.

7.  **Enter Grades**: On the [Grades](/grades) page, select a class and a subject to enter scores for Continuous Assessments (CAs) and Exams. The system automatically calculates the total and assigns a grade based on a standard Nigerian grading scale.

8.  **Leverage AI Tools**:
    *   **AI Lesson Note Generator**: Go to the [Lesson Generator](/lesson-generator) to create detailed, NERDC-compliant lesson notes for any subject and class. Simply provide the topic, and the AI handles the rest.
    *   **AI Report Card Generator**: On the [Reports](/reports) page, select a class or a single student to generate comprehensive report cards, complete with AI-generated, personalized comments for both the form teacher and the principal.

9.  **Share Your Data**: Use the [Data Transfer](/transfer) page to securely send a class roster (including student profiles, attendance, and traits) to another registered user. Simply enter their User Code and choose the data you wish to send.

## Core Features

- **Authentication**: Secure user registration and login using Firebase Authentication.
- **Dashboard**: A central hub providing an at-a-glance overview of key school statistics, including total student count, number of classes, and a summary of grade distributions.
- **Class & Student Management**: Easily create classes, add students with auto-generated IDs, and manage their profiles and class assignments.
- **Academics & Subjects**: Maintain a master list of all subjects and assign them to specific classes.
- **Gradebook**: A detailed grade management system for inputting scores for two continuous assessments (CAs) and an exam. The system auto-calculates totals and assigns grades.
- **Attendance**: A simple interface for marking daily student attendance (Present, Absent, Late).
- **AI Report Card Generator**: An intelligent tool that generates comprehensive report cards, including AI-driven, personalized comments for teachers and principals based on performance, attendance, and behavioral traits.
- **AI Lesson Note Generator**: An assistant that creates multi-week, NERDC-compliant lesson notes for any subject and class level, complete with objectives, activities, and evaluations.
- **Secure Data Transfer**: A unique feature allowing users to securely transfer class data—including student rosters, attendance history, and trait assessments—to another registered user using a system-generated transfer code.
- **Settings & Profile Management**: A dedicated page for users to manage their personal/school profile and set the application-wide current academic term and session.

## Tech Stack

- **Framework**: Next.js (with App Router)
- **Language**: TypeScript
- **Backend & Database**: Firebase (Authentication, Firestore)
- **Styling**: Tailwind CSS & shadcn/ui for components
- **Generative AI**: Google's Gemini models via Genkit
- **State Management**: React Context & Hooks
- **Deployment**: Firebase App Hosting

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
