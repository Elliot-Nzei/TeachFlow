
'use client';

import React from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';

type HelpGuideProps = {
  pathname: string;
};

const guideContent: Record<string, React.ReactNode> = {
  '/dashboard': (
    <div>
      <h3 className="font-bold text-lg mb-2">Dashboard Guide</h3>
      <p className="mb-4">The dashboard is your central hub for a quick overview of your school's activities.</p>
      <ul className="list-disc pl-5 space-y-2 text-sm">
        <li><strong>Statistic Cards:</strong> At the top, you'll find key numbers like total students, classes, subjects, and fees collected for the current term.</li>
        <li><strong>Payment Summary:</strong> This chart visualizes the fee payment status of all students (Paid, Partially Paid, Owing).</li>
        <li><strong>Grade Distribution:</strong> A bar chart showing the overall academic performance across all your classes.</li>
        <li><strong>Recent Activity:</strong> A quick feed of the latest students and classes you've added to the system.</li>
      </ul>
    </div>
  ),
  '/classes': (
    <div>
      <h3 className="font-bold text-lg mb-2">Classes Page Guide</h3>
      <p className="mb-4">This page is where you manage all your classes.</p>
      <ul className="list-disc pl-5 space-y-2 text-sm">
        <li><strong>Add New Class:</strong> Click the "Add New Class" button to create a new class. You'll need to provide a name (e.g., "Primary 1A"), a category (e.g., "Primary"), and a level (a number for promotion logic, e.g., Primary 1 is level 1, JSS 1 is level 7).</li>
        <li><strong>View Classes:</strong> Classes are organized into tabs by category (Primary, Secondary, etc.). Each card shows the number of students and subjects.</li>
        <li><strong>View Details:</strong> Click on any class card to open a side panel with more details, including a list of assigned students, subjects, and advanced options like promotion and deletion.</li>
        <li><strong>Class Limit:</strong> Your current plan may have a limit on the number of classes you can create. This limit is shown at the top of the page.</li>
      </ul>
    </div>
  ),
   '/students': (
    <div>
      <h3 className="font-bold text-lg mb-2">Students Page Guide</h3>
      <p className="mb-4">This page is for managing all the students in your school.</p>
      <ul className="list-disc pl-5 space-y-2 text-sm">
        <li><strong>Add a Student:</strong> Click "Add Student" to open a form. A unique Student ID is automatically generated. Fill in the student's name, upload a photo, and optionally assign them to a class.</li>
        <li><strong>View Students:</strong> Students are displayed in a gallery. You can use the search bar to quickly find a student by name, ID, or class.</li>
        <li><strong>View Profile:</strong> Click on any student's card to open their detailed profile in a side sheet. The profile contains their academic record, attendance history, behavioral traits, and more.</li>
        <li><strong>Student Limit:</strong> Your plan has a limit on the total number of students you can add. This is displayed at the top right.</li>
      </ul>
    </div>
  ),
  '/academics': (
    <div>
      <h3 className="font-bold text-lg mb-2">Academics Page Guide</h3>
      <p className="mb-4">This page is a two-step process for managing subjects.</p>
      <ul className="list-disc pl-5 space-y-2 text-sm">
        <li><strong>Step 1: Master Subject List:</strong> In the left card, create a master list of ALL subjects taught in your school (e.g., "Mathematics", "English Language", "Basic Science").</li>
        <li><strong>Step 2: Class Subject Management:</strong> In the right card, assign subjects from your master list to each specific class. Click "Add/Remove Subjects" for a class to open a checklist of all available master subjects.</li>
        <li><strong>Removing Subjects:</strong> You can remove a subject from the master list using the trash icon. You can also remove a subject from a specific class by clicking the 'x' on its badge.</li>
      </ul>
    </div>
  ),
  '/attendance': (
    <div>
      <h3 className="font-bold text-lg mb-2">Attendance Guide</h3>
      <p className="mb-4">This module allows you to take daily attendance for any class.</p>
      <ul className="list-disc pl-5 space-y-2 text-sm">
        <li><strong>Select a Class:</strong> First, choose the class you want to take attendance for.</li>
        <li><strong>Choose a Date:</strong> The current date is selected by default. Click the date picker to choose a different date.</li>
        <li><strong>Mark Status:</strong> For each student, select their status: <strong>Present</strong>, <strong>Absent</strong>, or <strong>Late</strong>. You can use the "All Present" or "All Absent" buttons for faster marking.</li>
        <li><strong>Save:</strong> Click the "Save Attendance" button. The records are saved for the current term and session set in your main settings.</li>
      </ul>
    </div>
  ),
  '/timetable': (
    <div>
      <h3 className="font-bold text-lg mb-2">Timetable Guide</h3>
      <p className="mb-4">Here you can create and manage weekly schedules for each class.</p>
      <ul className="list-disc pl-5 space-y-2 text-sm">
        <li><strong>Select a Class:</strong> Choose a class from the left sidebar to view its timetable.</li>
        <li><strong>View Schedule:</strong> The main grid shows the weekly schedule. You can view it as a grid (desktop) or a collapsible list (mobile).</li>
        <li><strong>Edit Schedule:</strong> Click the "Edit Schedule" button to open a side panel where you can manage the timetable.</li>
        <li><strong>Add/Edit Periods:</strong> In the edit panel, you can add new periods for any day, specifying the start time, end time, and subject. You can also edit or delete existing periods.</li>
        <li><strong>Save Changes:</strong> Once you are done editing, click "Save Changes" to update the timetable for that class.</li>
      </ul>
    </div>
  ),
  '/grades': (
    <div>
      <h3 className="font-bold text-lg mb-2">Grades (Gradebook) Guide</h3>
      <p className="mb-4">This is where you enter and view student scores.</p>
      <ul className="list-disc pl-5 space-y-2 text-sm">
        <li><strong>Select Class:</strong> First, choose a class from the sidebar on the left.</li>
        <li><strong>Add/Edit Grades:</strong> Click the "Add / Edit Grades" button. A dialog will appear.</li>
        <li><strong>Choose Subject:</strong> In the dialog, select the subject you want to enter scores for. A list of all students in the class will appear.</li>
        <li><strong>Enter Scores:</strong> For each student, input their scores for CA1 (Continuous Assessment 1), CA2, and the Exam. The total and grade are calculated automatically based on the Nigerian grading scale.</li>
        <li><strong>View Grades:</strong> Click the "View Grades" button to see all recorded grades for the selected class. You can use the filters to view records from different terms and sessions.</li>
      </ul>
    </div>
  ),
  '/payments': (
    <div>
      <h3 className="font-bold text-lg mb-2">Payments Guide</h3>
      <p className="mb-4">This page helps you track school fee payments for the current term.</p>
      <ul className="list-disc pl-5 space-y-2 text-sm">
        <li><strong>Select Class:</strong> First, choose a class from the dropdown to see its payment records.</li>
        <li><strong>Set Class Fee:</strong> Enter the termly fee amount for the selected class in the "Class Fee (₦)" input field and click "Save Fee". This amount becomes the `Amount Due` for every student in that class.</li>
        <li><strong>Record a Payment:</strong> Click on any student's row in the table to open the payment dialog.</li>
        <li><strong>Enter Amount Paid:</strong> In the dialog, enter the total amount the student has paid for the current term and click "Save Payment".</li>
        <li><strong>Track Status:</strong> The system automatically calculates the balance and updates the student's status to "Paid in Full", "Partially Paid", or "Owing".</li>
      </ul>
    </div>
  ),
  '/reports': (
    <div>
      <h3 className="font-bold text-lg mb-2">AI Report Card Generator Guide</h3>
      <p className="mb-4">Generate comprehensive, print-ready report cards powered by AI.</p>
      <ul className="list-disc pl-5 space-y-2 text-sm">
        <li><strong>Select Target:</strong> Choose whether to generate reports for an entire **Class** or a single **Student**.</li>
        <li><strong>Generate:</strong> Click the "Generate Reports" button.</li>
        <li><strong>AI Processing:</strong> The system gathers all academic results, attendance records, and behavioral traits for the selected students for the current term. The AI then writes personalized, constructive comments for both the form teacher and the principal.</li>
        <li><strong>Preview & Download:</strong> The generated report cards appear in a print-friendly preview. You can review them, print them directly, or download them all as a single, multi-page PDF document.</li>
      </ul>
    </div>
  ),
  '/lesson-generator': (
    <div>
      <h3 className="font-bold text-lg mb-2">AI Lesson Note Generator Guide</h3>
      <p className="mb-4">Create detailed, curriculum-compliant lesson notes automatically.</p>
      <ul className="list-disc pl-5 space-y-2 text-sm">
        <li><strong>Fill Details:</strong> Select the Class, Subject, and the number of weeks you want the note to cover. Provide a clear Topic or scheme of work.</li>
        <li><strong>Generate:</strong> Click "Generate Lesson Note". The AI will create a detailed, week-by-week lesson plan that follows the NERDC curriculum structure.</li>
        <li><strong>Review and Export:</strong> The generated note appears in the preview area. You can copy the text, print it, or download it as a PDF.</li>
        <li><strong>History:</strong> Your last 20 generated notes are saved automatically. Click the "History" button to access and reload previous notes.</li>
      </ul>
    </div>
  ),
  '/exam-question-generator': (
     <div>
      <h3 className="font-bold text-lg mb-2">AI Exam Question Generator Guide</h3>
      <p className="mb-4">Instantly generate exam papers in a clean, printable A4 format.</p>
      <ul className="list-disc pl-5 space-y-2 text-sm">
        <li><strong>Set Parameters:</strong> Select the Class and Subject for the exam.</li>
        <li><strong>Enter Topics:</strong> List the topics the exam should cover, separated by commas.</li>
        <li><strong>Choose Format:</strong> Select the question type (Objective, Essay, or Both) and the total number of questions you need.</li>
        <li><strong>Generate:</strong> Click "Generate Questions". The AI will create the exam based on your specifications.</li>
        <li><strong>Preview & Export:</strong> The questions appear in the A4 preview area. You can then download the exam as a PDF. For objective questions, you can also download a version with an answer key.</li>
      </ul>
    </div>
  ),
  '/marketplace': (
    <div>
      <h3 className="font-bold text-lg mb-2">Marketplace Guide</h3>
      <p className="mb-4">Discover and purchase educational resources from the community.</p>
      <ul className="list-disc pl-5 space-y-2 text-sm">
        <li><strong>Browse Products:</strong> Scroll through the list of available items.</li>
        <li><strong>Filter & Search:</strong> Use the search bar to find items by name, or use the filter options to narrow down by category and location.</li>
        <li><strong>View Details:</strong> Click on any product card to open a detailed view with more information, including a full description and availability.</li>
        <li><strong>Purchase History:</strong> Click the "My Purchases" button to view a list of all the items you have bought.</li>
        <li><strong>Buy Now:</strong> In the product details view, click "Buy Now" to proceed to the secure checkout page and complete your purchase.</li>
      </ul>
    </div>
  ),
  '/transfer': (
     <div>
      <h3 className="font-bold text-lg mb-2">Data Management Guide</h3>
      <p className="mb-4">Securely transfer data, or create backups of your school's information.</p>
      <ul className="list-disc pl-5 space-y-2 text-sm">
        <li><strong>Your Transfer Code:</strong> At the top, you'll see your unique code. Share this with other TeachFlow users who want to send data to you.</li>
        <li><strong>New Transfer:</strong> To send data, enter the recipient's user code, select the type of data (e.g., "Full Class Data"), choose the specific item, and click "Send".</li>
        <li><strong>History:</strong> This tab shows a log of your sent and received transfers. For incoming transfers that are "pending", you can choose to "Accept" or "Reject" them.</li>
        <li><strong>Accepting Data:</strong> When you accept a transfer, you can selectively choose which parts of the data to import (e.g., only import student info but not their grades).</li>
        <li><strong>Backup & Restore:</strong> In the bottom section, you can export a full backup of all your school data to a JSON file, or restore your account from a previously saved backup file.</li>
      </ul>
    </div>
  ),
   '/billing': (
     <div>
      <h3 className="font-bold text-lg mb-2">Billing Page Guide</h3>
      <p className="mb-4">Manage your TeachFlow subscription plan.</p>
      <ul className="list-disc pl-5 space-y-2 text-sm">
        <li><strong>Choose Your Plan:</strong> This page displays the available subscription plans: Free Trial, Basic, and Prime. Each card details the features included.</li>
        <li><strong>Billing Cycle:</strong> Use the toggle to switch between Monthly and Annually billing. Choosing annually gives you a discount.</li>
        <li><strong>Upgrade/Renew:</strong>
            <ul>
                <li>If your subscription is expired, the button for your previous plan will show "Renew Plan".</li>
                <li>For other plans, the button will say "Upgrade to [Plan Name]".</li>
                <li>If you are on an active plan, its button will be disabled and read "Your Current Plan".</li>
            </ul>
        </li>
        <li><strong>Subscription Status:</strong> If you have an active subscription, a card at the top will show your current plan and the time remaining.</li>
      </ul>
    </div>
  ),
  '/settings': (
    <div>
      <h3 className="font-bold text-lg mb-2">Settings Guide</h3>
      <p className="mb-4">Manage your profile, school information, and application preferences.</p>
      <ul className="list-disc pl-5 space-y-2 text-sm">
        <li><strong>Profile & School Info:</strong> Update your name, school name, motto, and address. Your unique user code (for data transfers) is also displayed here and can be copied.</li>
        <li><strong>Academic Settings:</strong> This is very important. Set the **Current Term** and **Current Session** here. All new records you create (grades, attendance, etc.) will be automatically tagged with these values.</li>
        <li><strong>Saving:</strong> Click the "Save" buttons in each section to apply your changes.</li>
        <li><strong>Danger Zone:</strong> Be very careful with this section. The "Clear All School Data" option will permanently delete all your students, classes, grades, and records. This action is irreversible.</li>
      </ul>
    </div>
  ),
  '/admin': (
    <div>
      <h3 className="font-bold text-lg mb-2">Admin Dashboard Guide</h3>
      <p className="mb-4">This is the central control panel for managing the entire TeachFlow application.</p>
      <ul className="list-disc pl-5 space-y-2 text-sm">
        <li><strong>Statistics:</strong> View key metrics like total users, total marketplace products, and user activity over the last week.</li>
        <li><strong>Quick Actions:</strong> Jump directly to User Management or Marketplace Management.</li>
        <li><strong>Recently Joined:</strong> See a list of the newest users who have registered on the platform.</li>
        <li><strong>Sidebar Navigation:</strong> Use the links on the left to access all admin-specific pages.</li>
      </ul>
    </div>
  ),
  '/admin/users': (
     <div>
      <h3 className="font-bold text-lg mb-2">Admin: User Management Guide</h3>
      <p className="mb-4">Manage all the user accounts on the TeachFlow platform.</p>
      <ul className="list-disc pl-5 space-y-2 text-sm">
        <li><strong>View Users:</strong> The main table displays all registered users (except your own admin account).</li>
        <li><strong>Search:</strong> Use the search bar to find users by name, email, or school name.</li>
        <li><strong>Actions Menu:</strong> Click the three-dots icon on any user's row to open the actions menu.</li>
        <li><strong>Change Role:</strong> Promote a 'teacher' to an 'admin' or vice-versa.</li>
        <li><strong>Change Plan:</strong> Manually upgrade or downgrade a user's subscription plan.</li>
        <li><strong>Delete User:</strong> Permanently delete a user and all their associated data. This action is irreversible.</li>
      </ul>
    </div>
  ),
  '/admin/marketplace': (
     <div>
      <h3 className="font-bold text-lg mb-2">Admin: Marketplace Management Guide</h3>
      <p className="mb-4">Add, edit, and manage all products available for sale in the marketplace.</p>
      <ul className="list-disc pl-5 space-y-2 text-sm">
        <li><strong>Add Product:</strong> Click the "Add Product" button to open a form and create a new product listing.</li>
        <li><strong>Edit Product:</strong> Click the three-dots icon on any product and select "Edit" to modify its details.</li>
        <li><strong>Archive/Activate:</strong> You can "Archive" a product to temporarily hide it from the marketplace without deleting it. You can "Activate" it again later.</li>
        <li><strong>Delete Product:</strong> Permanently remove a product listing.</li>
        <li><strong>Statistics:</strong> The cards at the top show an overview of your marketplace, including total products and inventory value.</li>
      </ul>
    </div>
  ),
  '/admin/notifications': (
     <div>
      <h3 className="font-bold text-lg mb-2">Admin: Notifications Guide</h3>
      <p className="mb-4">View a complete history of all system notifications.</p>
      <ul className="list-disc pl-5 space-y-2 text-sm">
        <li><strong>Notification History:</strong> This page shows a list of all notifications generated by the system, such as new product sales or processing errors.</li>
        <li><strong>Delete Notification:</strong> Click the 'X' button on a notification to remove it from the list.</li>
        <li><strong>Clear All:</strong> Use the "Clear All" button to permanently delete all notifications.</li>
      </ul>
    </div>
  ),
  '/admin/system': (
     <div>
      <h3 className="font-bold text-lg mb-2">Admin: System Management Guide</h3>
      <p className="mb-4">This page contains critical, system-wide actions. Please use with extreme caution.</p>
      <ul className="list-disc pl-5 space-y-2 text-sm">
        <li><strong>Reset Application:</strong> This is a highly destructive action that will wipe the entire database clean.</li>
        <li><strong>What it does:</strong> It deletes all user accounts (except your own), all school data, all marketplace products, and everything else.</li>
        <li><strong>Confirmation:</strong> To prevent accidental use, you must type the phrase "DELETE ALL DATA" into a confirmation box before the action can proceed.</li>
        <li><strong>Use Case:</strong> This is primarily for resetting the application to a clean slate for a new deployment or for development purposes.</li>
      </ul>
    </div>
  ),
};

const DefaultGuide = () => (
    <div>
      <h3 className="font-bold text-lg mb-2">No Guide Available</h3>
      <p>We don't have a specific guide for this page yet. Please check back later!</p>
    </div>
);


export default function HelpGuide({ pathname }: HelpGuideProps) {
    const pageKey = pathname.startsWith('/students/') ? '/students' : pathname;
    const content = guideContent[pageKey] || <DefaultGuide />;

    return (
        <ScrollArea className="max-h-[60vh] pr-6 -mr-6">
            <div className="prose prose-sm dark:prose-invert max-w-none">
                {content}
            </div>
        </ScrollArea>
    );
}
