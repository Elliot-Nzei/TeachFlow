# **App Name**: PeerPrep

## Core Features:

- User Registration: Allow users to register using Firebase Authentication and generate a unique code.
- Data Transfer: Enable secure data transfer between users using their unique system generated codes and Firebase Cloud Functions.
- Dashboard Statistics: Show personalized stats to the user based on information pulled from Firestore.
- Class Management: Allow the creation, editing, and viewing of user specific classes, all stored in Firestore.
- Grades Management: Facilitate inputting grades for students in each class and session following the provided Nigerian grading scale.
- Report Card Generation: Automatic computation of total score, average, and remarks to generate report cards, which can then be converted and exported to Excel, using Cloud Functions tool to use ExcelJS to generate excel
- Data Export: Permit full data download (classes, students, grades) as an Excel sheet.

## Style Guidelines:

- Primary color: Green (#388E3C), reminiscent of the color of school uniforms and other academic material, evoking learning, growth, and knowledge
- Background color: Very light green (#F1F8E9), nearly white
- Accent color: Blue (#1976D2) for interactive elements and important actions. Blue complements green and suggests trust, authority, and collaboration
- Font: 'PT Sans', a sans-serif font for body text and headings
- Use flat design icons, mostly monochrome, with the blue (#1976D2) accent color applied to call-to-action icons and the main action in each panel
- Maintain a clean and organized layout with clear sections for classes, grades, and reports. Employ card-based designs for each item.
- Use subtle animations (e.g., fade-in, slide-in) when loading data or transitioning between sections to provide a smooth user experience.