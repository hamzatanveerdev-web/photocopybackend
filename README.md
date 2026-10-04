# Stationery & Photocopy Management System

A complete digital management system for university stationery shops and photocopy services.  
This system connects **Students, Teachers, and Shopkeepers** on a single platform where users can buy stationery items, request printing services, manage notes, and handle orders through a wallet-based payment system.

## 📌 Project Overview

The Stationery & Photocopy Management System is designed to replace manual stationery and photocopy processes in educational institutions.

The system provides:
- Online stationery purchasing
- Digital print request management
- Wallet-based payments
- Course-wise notes sharing
- Student and teacher communication through notifications
- Shopkeeper inventory and order management

---

# 👥 User Roles

## 1. Shopkeeper Module

The shopkeeper manages all stationery and printing operations.

### Features:
- Add new stationery products
- Edit/update product information
- Manage stock availability
- View stationery orders
- View print requests
- Accept or reject orders
- Manage order status:
  - Pending
  - Accepted
  - Completed
  - Delivered

### Order Handling:
- Orders are processed using First Come First Serve (FCFS) logic.
- Shopkeeper prepares the order and updates status.
- Student/Teacher collects the order and status changes to delivered.

---

# 2. Student Module

Students can purchase products, request printing, and access academic notes.

### Features:
- View stationery items
- Purchase stationery
- Print notes/documents
- Select printing settings:
  - Number of copies
  - Color printing
  - Black & white
  - Single side
  - Double side

### Wallet System:
- Every student has a personal wallet.
- Payment is automatically deducted before placing an order.
- Amount is transferred to shopkeeper wallet.

### Order Management:
Students can:
- View order status
- Cancel orders (according to conditions)
- Track previous orders

### Academic Features:
- View semester-wise enrolled courses
- View course teachers
- Access course notes
- Receive notifications when new notes are uploaded

### Notes Sharing:
- Students approved as "Brilliant Students" can upload notes.
- Teacher approval is required before sharing notes with other students.
- Students can upload personal handwritten notes for printing.

---

# 3. Teacher Module

Teachers manage courses, notes, and student approvals.

### Features:
- View assigned courses
- Upload course notes
- Manage course materials
- View students enrolled in courses
- Approve/reject student uploaded notes

### Brilliant Student System:
- Teacher can approve students as brilliant/top students.
- Approved students can share helpful notes.
- Uploaded notes remain pending until teacher approval.

### Printing & Shopping:
Teachers can:
- Buy stationery
- Request printing services
- Pay through wallet
- Track order status

---

# 💰 Wallet System

The system includes a digital wallet for students and teachers.

### Wallet Features:
- View wallet balance
- Automatic payment deduction
- Transaction tracking
- Shopkeeper receives payments from completed orders

---

# 🔔 Notification System

Users receive notifications for:

- Order accepted
- Order completed
- Order delivered
- Notes uploaded
- Notes approved/rejected
- Teacher updates

---

# 🔄 System Workflow

1. User logs in according to role.
2. Student/Teacher selects stationery or print service.
3. Payment is deducted from wallet.
4. Order reaches shopkeeper.
5. Shopkeeper processes order.
6. User receives notifications about order status.
7. User collects order.

---

# 🛠️ Technologies Used

(Add your actual technologies)

Example:

Frontend:
- React / Flutter / Android / HTML CSS JS

Backend:
- Node.js / Laravel / Django / Spring Boot

Database:
- MySQL / MongoDB / Firebase

---

# 📂 Main Modules
