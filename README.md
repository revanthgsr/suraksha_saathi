# Suraksha Saathi - Campus Guard Management System

**Suraksha Saathi** is a comprehensive digital platform designed to streamline the management, operations, and safety of campus security guards. It replaces traditional paper logs with a transparent, efficient, and real-time digital system.

The project consists of two distinct portals:
1. **Guard Portal:** For security personnel to mark attendance, apply for leave, and report issues.
2. **Admin Portal:** For management to assign schedules, process payroll, and monitor guard activities.

---

## 🚀 Key Features

### 🛡️ Guard Portal (`suraksha_saathi`)
* **Photo-Based Attendance:** Guards mark attendance by taking a real-time selfie. The system automatically records the timestamp and determines if they are "Present" or "Late".
* **Weekly Schedule:** View assigned shifts (Morning/Evening/Night) and specific duty locations (e.g., Main Gate).
* **Leave Management:** Apply for leave and track the status (Pending/Approved/Denied).
* **Complaint Reporting:** Report campus issues (Safety/Maintenance) with photo proof.
* **Payment History:** View monthly salary slips and transaction details.
* **SOS Emergency:** One-click emergency button to alert the administration immediately.
* **Profile:** Manage personal details and change passwords.

### 💼 Admin Portal (`suraksha_saathi_admin`)
* **Dashboard:** Real-time overview of active guards and those on leave.
* **Manage Guards:** Add new guards, edit profiles, and deactivate accounts.
* **Schedule Management:** Assign weekly shifts and specific locations to guards via an interactive grid.
* **Attendance Logs:** Review daily attendance records and view captured photos.
* **Leave Processing:** Approve or deny leave requests submitted by guards.
* **Complaint Resolution:** View reported issues and update their status (In Review/Resolved).
* **Payroll Management:** Record salary payments for specific guards.
* **Emergency Logs:** Receive and acknowledge emergency alerts.

---

## 🛠️ Tech Stack

* **Frontend:** HTML5, CSS3, Vanilla JavaScript (ES6+).
* **Backend / Database:** JSON Server (Mock REST API).
* **Environment:** Node.js (Required to run the database).

---

## 📂 Project Structure

```bash
/Project-Root
│
├── /suraksha_saathi          # GUARD PORTAL (Frontend)
│   ├── index.html            # Login Page
│   ├── dashboard.html        # Main Dashboard
│   ├── attendance.html       # Camera-based Attendance
│   ├── schedule.html         # Weekly Roster
│   ├── leave.html            # Leave Application
│   ├── complaint.html        # Issue Reporting
│   ├── payment.html          # Salary History
│   ├── profile.html          # User Profile
│   ├── style.css             # Guard Stylesheet
│   └── script.js             # Guard Logic
│
├── /suraksha_saathi_admin    # ADMIN PORTAL (Frontend)
│   ├── index.html            # Admin Login
│   ├── dashboard.html        # Admin Dashboard
│   ├── manage-guards.html    # Add/Edit Guards
│   ├── manage-schedules.html # Assign Shifts
│   ├── manage-payments.html  # Process Payroll
│   ├── emergency-alerts.html # SOS Logs
│   ├── leave-requests.html   # Approve Leaves
│   ├── complaints.html       # View Issues
│   ├── attendance-records.html # View Logs
│   ├── style.css             # Admin Stylesheet
│   └── script.js             # Admin Logic
│
└── /backend                  # DATABASE
    └── db.json               # JSON Database File
```

---

## ⚙️ Installation & Setup

Follow these steps to run the project locally.

---

### 1. Prerequisites

Ensure you have **Node.js** installed on your computer.  
Download here: https://nodejs.org

Verify installation:

```bash
node -v
```

---

### 2. Install Database Tool

Run the following command in your terminal:

```bash
npm install -g json-server
```

---

### 3. Start the Backend Server

Navigate to the backend folder:

```bash
cd path/to/your/project/backend
```

Start the JSON server:

```bash
json-server --watch db.json --port 3000
```

> **Note:** Keep this terminal window **open**. Closing it will stop the database.

---

### 4. Run the Websites

You can open the HTML files directly in the browser:

- **Guard Portal:** `suraksha_saathi/index.html`  
- **Admin Portal:** `suraksha_saathi_admin/index.html`

#### ⚠️ Camera Feature Note
For the Attendance Camera feature to work, the site must usually be served via **HTTP (localhost)**, not opened as a file.

Use one of these:
- VS Code **Live Server** extension  
- Python’s built-in server:

```bash
python3 -m http.server
```

---

## 🔑 Login Credentials (Demo Data)

### 👮 Guard Login
- **Guard ID:** `G-1001`  
- **Password:** `password123`

### 👨‍💼 Admin Login
- **Username:** `admin`  
- **Password:** `adminpassword`

---

## 📸 Usage Highlights

### **Marking Attendance**
1. Log in as Guard  
2. Open **Attendance**  
3. Allow camera permissions  
4. Capture photo → Submit  
5. System records **Present** / **Late** based on time

### **Assigning Schedules**
1. Log in as Admin  
2. Go to **Manage Schedules**  
3. Use dropdowns to assign:
   - Shift (Morning / Evening / Night)
   - Location (Gate / Block)

### **Emergency Alerts**
- Guard: Press **EMERGENCY** button  
- Admin: View and acknowledge it under **Emergency Alerts**

---

## 🔮 Future Improvements

- **Real Database:** Migrate from `db.json` to MongoDB/SQL  
- **Authentication:** Add JWT-based secure login  
- **SMS Integration:** Use Twilio or similar for real OTPs  
- **Geolocation:** Restrict attendance to specific campus coordinates  

---
