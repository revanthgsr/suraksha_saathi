// ==========================================
// SURAKSHA SAATHI - ADMIN PORTAL LOGIC
// ==========================================

document.addEventListener("DOMContentLoaded", () => {

    // --- GLOBAL VARIABLES ---
    const apiUrl = "http://localhost:3000";
    
    // --- 1. ADMIN LOGIN LOGIC ---
    const loginForm = document.getElementById("admin-login-form");

    if (loginForm) {
        loginForm.addEventListener("submit", (event) => {
            event.preventDefault();
            
            const usernameInput = document.getElementById("username").value;
            const passwordInput = document.getElementById("password").value;

            // Fetch admin details from DB
            fetch(`${apiUrl}/admin?username=${usernameInput}`)
                .then(res => res.json())
                .then(data => {
                    if (data.length > 0) {
                        const admin = data[0];
                        
                        // Check password
                        if (admin.password === passwordInput) {
                            console.log("Admin Login Success");
                            
                            // Save session
                            localStorage.setItem("loggedInAdmin", JSON.stringify(admin));
                            
                            // Redirect
                            window.location.href = "dashboard.html";
                        } else {
                            alert("Incorrect password.");
                        }
                    } else {
                        alert("Admin username not found.");
                    }
                })
                .catch(err => console.error("Login Error:", err));
        });
    }

    // --- 2. DASHBOARD LOGIC ---
    // This runs on every page EXCEPT the login page
    if (!loginForm) {
        checkAdminAuth(); // Protect the pages
        setupLogout();    // Enable logout button
    }

    // --- 3. DASHBOARD STATUS BAR (Active/Leave Counts) ---
    const statusActiveBadge = document.querySelector(".status-active");
    const statusLeaveBadge = document.querySelector(".status-leave");

    // We only run this if we see the badges on the screen
    if (statusActiveBadge && statusLeaveBadge) {
        fetch(`${apiUrl}/guards`)
            .then(res => res.json())
            .then(guards => {
                // Count Guards based on their status
                // Note: In db.json, make sure guards have "status": "Active" or "On Leave"
                let activeCount = 0;
                let leaveCount = 0;

                guards.forEach(guard => {
                    if (guard.status === "Active") {
                        activeCount++;
                    } else if (guard.status === "On Leave") {
                        leaveCount++;
                    }
                });

                // Update the HTML text
                statusActiveBadge.textContent = `Active: ${activeCount}`;
                statusLeaveBadge.textContent = `On Leave: ${leaveCount}`;
            })
            .catch(err => console.error("Error counting guards:", err));
    }

    // --- HELPER FUNCTIONS ---

    function checkAdminAuth() {
        const adminSession = localStorage.getItem("loggedInAdmin");
        if (!adminSession) {
            // If not logged in, kick back to index.html
            window.location.href = "index.html";
        }
    }

    function setupLogout() {
        const logoutBtn = document.getElementById("logout-btn");
        if (logoutBtn) {
            logoutBtn.addEventListener("click", (e) => {
                e.preventDefault(); // In case it's a link
                if (confirm("Are you sure you want to log out?")) {
                    localStorage.removeItem("loggedInAdmin");
                    window.location.href = "index.html";
                }
            });
        }
    }

    // ==========================================
    // 4. MANAGE GUARDS PAGE LOGIC (Fixed & Improved)
    // ==========================================
    const guardsTableBody = document.getElementById("guards-table-body");
    const guardForm = document.getElementById("guard-form");
    const guardModal = document.getElementById("guard-modal");
    const addNewGuardBtn = document.getElementById("add-new-guard-btn");
    const modalTitle = document.getElementById("modal-title");
    const closeModalBtn = document.querySelector(".close-btn");

    // This variable tracks if we are editing (holds the ID) or adding (null)
    let isEditingGuardId = null;

    // --- Helper: Load Guards ---
    function loadGuards() {
        if (!guardsTableBody) return; 

        fetch(`${apiUrl}/guards`)
            .then(res => res.json())
            .then(data => {
                guardsTableBody.innerHTML = "";
                
                data.forEach(guard => {
                    let badgeClass = "status-active";
                    if (guard.status === "On Leave") badgeClass = "status-leave";
                    if (guard.status === "Inactive") badgeClass = "btn-secondary"; 

                    const row = document.createElement("tr");
                    row.innerHTML = `
                        <td>${guard.id}</td>
                        <td>${guard.name}</td>
                        <td>${guard.phone}</td>
                        <td><span class="status-badge ${badgeClass}">${guard.status}</span></td>
                        <td>
                            <button class="btn btn-sm edit-btn" data-id="${guard.id}">Edit</button>
                            <button class="btn btn-sm btn-danger deactivate-btn" data-id="${guard.id}">
                                ${guard.status === 'Inactive' ? 'Activate' : 'Deactivate'}
                            </button>
                        </td>
                    `;
                    guardsTableBody.appendChild(row);
                });
            })
            .catch(err => console.error("Error loading guards:", err));
    }

    // Run on load
    loadGuards();

    // --- 1. OPEN MODAL (ADD MODE) ---
    if (addNewGuardBtn) {
        addNewGuardBtn.addEventListener("click", () => {
            isEditingGuardId = null; // We are adding, not editing
            modalTitle.textContent = "Add New Guard";
            guardForm.reset(); // Clear previous data
            guardModal.style.display = "block";
        });
    }

    // --- 2. OPEN MODAL (EDIT MODE) ---
    if (guardsTableBody) {
        guardsTableBody.addEventListener("click", (e) => {
            // Handle "Edit" Click
            if (e.target.classList.contains("edit-btn")) {
                const id = e.target.getAttribute("data-id");
                isEditingGuardId = id; // Remember who we are editing
                modalTitle.textContent = "Edit Guard Details";

                // Fetch current data to fill the form
                fetch(`${apiUrl}/guards/${id}`)
                    .then(res => res.json())
                    .then(guard => {
                        // Fill the inputs
                        document.getElementById("guard-name").value = guard.name;
                        document.getElementById("guard-phone").value = guard.phone;
                        document.getElementById("guard-dob").value = guard.dob;
                        document.getElementById("guard-gender").value = guard.gender;
                        document.getElementById("guard-password").value = guard.password;
                        
                        guardModal.style.display = "block";
                    });
            }

            // Handle "Deactivate" Click (Existing Logic)
            if (e.target.classList.contains("deactivate-btn")) {
                const id = e.target.getAttribute("data-id");
                const currentText = e.target.innerText;
                const newStatus = currentText === "Deactivate" ? "Inactive" : "Active";

                if (confirm(`Are you sure you want to set ${id} to ${newStatus}?`)) {
                    fetch(`${apiUrl}/guards/${id}`, {
                        method: "PATCH",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ status: newStatus })
                    }).then(res => { if(res.ok) loadGuards(); });
                }
            }
        });
    }

    // --- 3. HANDLE FORM SUBMIT (Add OR Edit) ---
    if (guardForm) {
        guardForm.addEventListener("submit", (e) => {
            e.preventDefault();

            // Collect Form Data
            const formData = {
                name: document.getElementById("guard-name").value,
                phone: document.getElementById("guard-phone").value,
                dob: document.getElementById("guard-dob").value,
                gender: document.getElementById("guard-gender").value,
                password: document.getElementById("guard-password").value,
                status: "Active" // Default for new, but we might want to keep existing status on edit
            };

            if (isEditingGuardId) {
                // === EDIT MODE (PATCH) ===
                // We don't want to overwrite status to "Active" blindly if they are "On Leave"
                // So delete status from formData for edits
                delete formData.status; 

                fetch(`${apiUrl}/guards/${isEditingGuardId}`, {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(formData)
                })
                .then(res => {
                    if (res.ok) {
                        alert("Guard details updated!");
                        closeModal();
                    }
                });

            } else {
                // === ADD MODE (POST) ===
                // Generate ID
                const newId = "G-" + Math.floor(10000 + Math.random() * 90000);
                formData.id = newId;

                fetch(`${apiUrl}/guards`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(formData)
                })
                .then(res => {
                    if (res.ok) {
                        alert(`New Guard Added: ${newId}`);
                        closeModal();
                    }
                });
            }
        });
    }

    // --- Helper: Close Modal ---
    function closeModal() {
        guardModal.style.display = "none";
        guardForm.reset();
        loadGuards(); // Refresh table
    }

    // Close button logic
    if (closeModalBtn) {
        closeModalBtn.addEventListener("click", closeModal);
    }
    window.addEventListener("click", (e) => {
        if (e.target == guardModal) closeModal();
    });

    // ==========================================
    // 5. LEAVE REQUESTS PAGE LOGIC
    // ==========================================
    const leaveRequestsBody = document.getElementById("leave-table-body");

    // --- Helper: Load Leaves ---
    function loadLeaveRequests() {
        if (!leaveRequestsBody) return;

        fetch(`${apiUrl}/leaves`)
            .then(res => res.json())
            .then(data => {
                leaveRequestsBody.innerHTML = "";

                if (data.length === 0) {
                    leaveRequestsBody.innerHTML = "<tr><td colspan='6' style='text-align:center'>No leave requests found.</td></tr>";
                    return;
                }

                // Sort: Pending first, then by ID (newest)
                data.sort((a, b) => (a.status === 'Pending' ? -1 : 1));

                data.forEach(leave => {
                    // Color Badge
                    let badgeClass = "status-pending";
                    if (leave.status === "Approved") badgeClass = "status-active"; // Reuse active green
                    if (leave.status === "Denied") badgeClass = "status-leave";    // Reuse leave red

                    // Action Buttons (Only show if Pending)
                    let actionButtons = `
                        <button class="btn btn-sm btn-success approve-btn" data-id="${leave.id}">Approve</button>
                        <button class="btn btn-sm btn-danger deny-btn" data-id="${leave.id}">Deny</button>
                    `;
                    
                    if (leave.status !== "Pending") {
                        actionButtons = '<span style="color:#777; font-size:14px;">Action Taken</span>';
                    }

                    const row = document.createElement("tr");
                    row.innerHTML = `
                        <td>${leave.guardId}</td>
                        <td>${leave.name}</td>
                        <td>${leave.startDate} to ${leave.endDate}</td>
                        <td>${leave.reason}</td>
                        <td><span class="status-badge ${badgeClass}">${leave.status}</span></td>
                        <td class="action-cell">${actionButtons}</td>
                    `;
                    leaveRequestsBody.appendChild(row);
                });
            })
            .catch(err => console.error("Error loading leaves:", err));
    }

    // Run on load
    loadLeaveRequests();

    // --- Handle Approve/Deny Clicks ---
    if (leaveRequestsBody) {
        leaveRequestsBody.addEventListener("click", (e) => {
            const isApprove = e.target.classList.contains("approve-btn");
            const isDeny = e.target.classList.contains("deny-btn");

            if (isApprove || isDeny) {
                const id = e.target.getAttribute("data-id");
                const newStatus = isApprove ? "Approved" : "Denied";
                const confirmMsg = isApprove ? "Approve this leave?" : "Deny this leave?";

                if (confirm(confirmMsg)) {
                    // Update DB
                    fetch(`${apiUrl}/leaves/${id}`, {
                        method: "PATCH",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ status: newStatus })
                    })
                    .then(res => {
                        if (res.ok) {
                            loadLeaveRequests(); // Refresh table
                            
                            // Also update dashboard counts if needed
                            if (typeof updateDashboardCounts === "function") updateDashboardCounts();
                        }
                    });
                }
            }
        });
    }

    // ==========================================
    // 6. COMPLAINTS PAGE LOGIC
    // ==========================================
    const complaintTableBody = document.getElementById("complaint-table-body");
    const photoModal = document.getElementById("photo-modal");
    const complaintImage = document.getElementById("complaint-image");
    const photoModalClose = document.getElementById("photo-modal-close");

    // --- Helper: Load Complaints ---
    function loadComplaints() {
        if (!complaintTableBody) return;

        fetch(`${apiUrl}/complaints`)
            .then(res => res.json())
            .then(data => {
                complaintTableBody.innerHTML = "";

                if (data.length === 0) {
                    complaintTableBody.innerHTML = "<tr><td colspan='7' style='text-align:center'>No complaints found.</td></tr>";
                    return;
                }

                // Sort: Pending first
                data.sort((a, b) => {
                    const statusOrder = { "pending": 1, "review": 2, "resolved": 3 };
                    return statusOrder[a.status] - statusOrder[b.status];
                });

                data.forEach(complaint => {
                    // Status Colors
                    let badgeClass = "status-pending";
                    let badgeText = "Pending";
                    if (complaint.status === "review") { badgeClass = "status-review"; badgeText = "In Review"; }
                    if (complaint.status === "resolved") { badgeClass = "status-active"; badgeText = "Resolved"; }

                    // Disable dropdown if resolved
                    const isDisabled = complaint.status === "resolved" ? "disabled" : "";
                    
                    // Check if photo exists
                    const photoBtn = complaint.photo 
                        ? `<button class="btn btn-sm view-photo-btn" data-img="${complaint.photo}">View</button>`
                        : `<span style="color:#999; font-size:13px;">No Photo</span>`;

                    const row = document.createElement("tr");
                    row.innerHTML = `
                        <td>${complaint.guardId}</td>
                        <td>${complaint.date}</td>
                        <td>${complaint.type}</td>
                        <td>${complaint.description}</td>
                        <td>${photoBtn}</td>
                        <td><span class="status-badge ${badgeClass}">${badgeText}</span></td>
                        <td class="action-cell">
                            <select class="status-select" data-id="${complaint.id}" ${isDisabled}>
                                <option value="pending" ${complaint.status === 'pending' ? 'selected' : ''}>Pending</option>
                                <option value="review" ${complaint.status === 'review' ? 'selected' : ''}>In Review</option>
                                <option value="resolved" ${complaint.status === 'resolved' ? 'selected' : ''}>Resolved</option>
                            </select>
                        </td>
                    `;
                    complaintTableBody.appendChild(row);
                });
            })
            .catch(err => console.error("Error loading complaints:", err));
    }

    // Run on load
    loadComplaints();

    // --- Handle Table Clicks & Changes ---
    if (complaintTableBody) {
        
        // 1. View Photo Logic
        complaintTableBody.addEventListener("click", (e) => {
            if (e.target.classList.contains("view-photo-btn")) {
                const imgSrc = e.target.getAttribute("data-img");
                complaintImage.src = imgSrc; // Set the Base64 string as image source
                photoModal.style.display = "block";
            }
        });

        // 2. Status Change Logic
        complaintTableBody.addEventListener("change", (e) => {
            if (e.target.classList.contains("status-select")) {
                const id = e.target.getAttribute("data-id");
                const newStatus = e.target.value;
                
                if (confirm(`Change status to ${newStatus}?`)) {
                    fetch(`${apiUrl}/complaints/${id}`, {
                        method: "PATCH",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ status: newStatus })
                    })
                    .then(res => {
                        if (res.ok) {
                            loadComplaints(); // Refresh to update badge colors
                        }
                    });
                } else {
                    // If they cancel, reload to reset the dropdown
                    loadComplaints(); 
                }
            }
        });
    }

    // --- Close Photo Modal ---
    if (photoModalClose) {
        photoModalClose.addEventListener("click", () => {
            photoModal.style.display = "none";
        });
    }
    window.addEventListener("click", (e) => {
        if (e.target == photoModal) photoModal.style.display = "none";
    });

    // ==========================================
    // 7. ATTENDANCE RECORDS PAGE LOGIC
    // ==========================================
    const attendanceRecordsBody = document.getElementById("attendance-table-body");

    // --- Helper: Load Attendance ---
    function loadAttendanceRecords() {
        if (!attendanceRecordsBody) return;

        fetch(`${apiUrl}/attendance`)
            .then(res => res.json())
            .then(data => {
                attendanceRecordsBody.innerHTML = "";

                if (data.length === 0) {
                    attendanceRecordsBody.innerHTML = "<tr><td colspan='6' style='text-align:center'>No attendance records found.</td></tr>";
                    return;
                }

                // Sort: Newest first
                data.reverse();

                data.forEach(record => {
                    // Status Colors
                    let badgeClass = "status-active"; // Default Green for Present
                    if (record.status === "Late") badgeClass = "status-late"; // Orange
                    if (record.status === "Absent") badgeClass = "status-leave"; // Red

                    // Check for Photo
                    // We use the same modal logic as complaints
                    const photoBtn = record.photo 
                        ? `<button class="btn btn-sm view-photo-btn" data-img="${record.photo}">View</button>`
                        : `<span style="color:#999">No Photo</span>`;

                    const row = document.createElement("tr");
                    row.innerHTML = `
                        <td>${record.guardId}</td>
                        <td>${record.name}</td>
                        <td>${record.date}</td>
                        <td>${record.timeIn}</td>
                        <td>${photoBtn}</td>
                        <td><span class="status-badge ${badgeClass}">${record.status}</span></td>
                    `;
                    attendanceRecordsBody.appendChild(row);
                });
            })
            .catch(err => console.error("Error loading attendance:", err));
    }

    // Run on load
    loadAttendanceRecords();

    // --- Handle Photo Click (Reusing Modal Logic) ---
    if (attendanceRecordsBody) {
        attendanceRecordsBody.addEventListener("click", (e) => {
            if (e.target.classList.contains("view-photo-btn")) {
                const imgSrc = e.target.getAttribute("data-img");
                
                // We reuse the elements from the Complaints section if they exist
                // If not, we re-select them here just to be safe
                const modal = document.getElementById("photo-modal");
                const img = document.getElementById("complaint-image"); // Note: In your HTML it might still be named 'complaint-image'
                
                if (modal && img) {
                    img.src = imgSrc;
                    modal.style.display = "block";
                }
            }
        });
    }

    // ==========================================
    // 8. MANAGE SCHEDULES PAGE LOGIC (UPDATED)
    // ==========================================
    const scheduleTableBody = document.getElementById("schedule-table-body");
    const saveScheduleBtn = document.getElementById("save-schedule-btn");
    const weekTitle = document.getElementById("week-title");
    const headerRow = document.getElementById("schedule-header-row");

    // --- Helper: Colorize Select Box ---
    function updateSelectColor(selectElement) {
        selectElement.classList.remove("shift-morning", "shift-evening", "shift-night", "shift-off");
        const val = selectElement.value;
        if (val === "morning") selectElement.classList.add("shift-morning");
        else if (val === "evening") selectElement.classList.add("shift-evening");
        else if (val === "night") selectElement.classList.add("shift-night");
        else selectElement.classList.add("shift-off");
    }

    // --- Helper: Get Current Week Dates ---
    function setupWeekHeader() {
        if (!weekTitle || !headerRow) return;

        const today = new Date();
        const dayOfWeek = today.getDay(); // 0 (Sun) - 6 (Sat)
        const diffToMon = today.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
        const monday = new Date(today.setDate(diffToMon));
        const sunday = new Date(new Date(monday).setDate(monday.getDate() + 6));

        // 1. Set Title
        const options = { month: 'long', day: 'numeric', year: 'numeric' };
        weekTitle.textContent = `Week of: ${monday.toLocaleDateString('en-US', options)} - ${sunday.toLocaleDateString('en-US', options)}`;

        // 2. Set Table Headers
        let headerHTML = `<th>Guard Name</th>`;
        const dayNames = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
        
        for(let i=0; i<7; i++) {
            const d = new Date(monday);
            d.setDate(monday.getDate() + i);
            const dateStr = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            headerHTML += `<th>${dayNames[i]}, ${dateStr}</th>`;
        }
        headerRow.innerHTML = headerHTML;
    }

    // --- Helper: Load Grid ---
    function loadManageSchedules() {
        if (!scheduleTableBody) return;
        
        setupWeekHeader(); // Initialize dates

        Promise.all([
            fetch(`${apiUrl}/guards`).then(res => res.json()),
            fetch(`${apiUrl}/schedules`).then(res => res.json())
        ]).then(([guards, schedules]) => {
            
            scheduleTableBody.innerHTML = "";
            const days = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];

            guards.forEach(guard => {
                // Find existing schedule
                let userSchedule = schedules.find(s => s.guardId === guard.id) || { guardId: guard.id };

                const row = document.createElement("tr");
                
                // 1. Guard Name
                let html = `<td style="font-weight:bold; vertical-align: top; padding-top: 15px;">${guard.name} <br> <span style="font-size:12px; color:#777;">${guard.id}</span></td>`;

                // 2. Shift & Location Columns
                days.forEach(day => {
                    // Handle DB data: It might be a String "morning" (Old) or Object {shift:"morning", loc:"Gate A"} (New)
                    let shiftVal = "off";
                    let locVal = "";

                    const dayData = userSchedule[day];
                    if (typeof dayData === 'object' && dayData !== null) {
                        shiftVal = dayData.shift || "off";
                        locVal = dayData.loc || "";
                    } else if (typeof dayData === 'string') {
                        shiftVal = dayData; // Backwards compatibility
                    }

                    html += `
                        <td>
                            <select class="schedule-select shift-dropdown" data-guard="${guard.id}" data-day="${day}">
                                <option value="off" ${shiftVal === 'off' ? 'selected' : ''}>Off</option>
                                <option value="morning" ${shiftVal === 'morning' ? 'selected' : ''}>Morning (A)</option>
                                <option value="evening" ${shiftVal === 'evening' ? 'selected' : ''}>Evening (B)</option>
                                <option value="night" ${shiftVal === 'night' ? 'selected' : ''}>Night (C)</option>
                            </select>
                            
                            <select class="loc-select" style="margin-top: 5px; font-size: 12px; padding: 4px;" data-guard="${guard.id}" data-day="${day}">
                                <option value="" ${locVal === '' ? 'selected' : ''}>-- Loc --</option>
                                <option value="Main Gate" ${locVal === 'Main Gate' ? 'selected' : ''}>Main Gate</option>
                                <option value="Admin Building" ${locVal === 'Admin Building' ? 'selected' : ''}>Admin Building</option>
                                <option value="Hostel Block 5" ${locVal === 'Hostel Block 5' ? 'selected' : ''}>Hostel Block 5</option>
                                <option value="Library" ${locVal === 'Library' ? 'selected' : ''}>Library</option>
                                <option value="Parking Lot" ${locVal === 'Parking Lot' ? 'selected' : ''}>Parking Lot</option>
                            </select>
                        </td>
                    `;
                });

                row.innerHTML = html;
                scheduleTableBody.appendChild(row);
            });

            // Colorize dropdowns
            document.querySelectorAll(".shift-dropdown").forEach(select => updateSelectColor(select));

        }).catch(err => console.error("Error loading data:", err));
    }

    loadManageSchedules();

    // --- Event Listeners ---
    if (scheduleTableBody) {
        // Handle Color Change
        scheduleTableBody.addEventListener("change", (e) => {
            if (e.target.classList.contains("shift-dropdown")) {
                updateSelectColor(e.target);
            }
        });

        // Save Changes
        if (saveScheduleBtn) {
            saveScheduleBtn.addEventListener("click", () => {
                if (!confirm("Publish this schedule?")) return;

                const rows = scheduleTableBody.querySelectorAll("tr");
                const days = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];
                
                // We need all existing schedules to know IDs
                fetch(`${apiUrl}/schedules`)
                    .then(res => res.json())
                    .then(existingSchedules => {
                        
                        const updates = [];

                        rows.forEach(row => {
                            // Find the first dropdown to get the Guard ID
                            const firstSelect = row.querySelector(".shift-dropdown");
                            if (!firstSelect) return;
                            const guardId = firstSelect.getAttribute("data-guard");

                            // Build Data Object
                            const scheduleData = { guardId: guardId };
                            
                            days.forEach(day => {
                                // Find the Shift and Location inputs for this specific day
                                const shiftInput = row.querySelector(`.shift-dropdown[data-day="${day}"]`);
                                const locInput = row.querySelector(`.loc-select[data-day="${day}"]`);
                                
                                // SAVE AS OBJECT: { shift: "morning", loc: "Main Gate" }
                                scheduleData[day] = {
                                    shift: shiftInput.value,
                                    loc: locInput.value
                                };
                            });

                            // Check for existing record
                            const existingRecord = existingSchedules.find(s => s.guardId === guardId);

                            if (existingRecord) {
                                updates.push(
                                    fetch(`${apiUrl}/schedules/${existingRecord.id}`, {
                                        method: "PATCH",
                                        headers: { "Content-Type": "application/json" },
                                        body: JSON.stringify(scheduleData)
                                    })
                                );
                            } else {
                                updates.push(
                                    fetch(`${apiUrl}/schedules`, {
                                        method: "POST",
                                        headers: { "Content-Type": "application/json" },
                                        body: JSON.stringify(scheduleData)
                                    })
                                );
                            }
                        });

                        Promise.all(updates).then(() => {
                            alert("Schedule saved successfully!");
                        });
                    });
            });
        }
    }

    // ==========================================
    // 9. EMERGENCY ALERTS PAGE LOGIC
    // ==========================================
    const alertTableBody = document.getElementById("alert-table-body");

    // --- Helper: Load Alerts ---
    function loadAlerts() {
        if (!alertTableBody) return;

        fetch(`${apiUrl}/alerts`)
            .then(res => res.json())
            .then(data => {
                alertTableBody.innerHTML = "";

                if (data.length === 0) {
                    alertTableBody.innerHTML = "<tr><td colspan='5' style='text-align:center'>No alerts found.</td></tr>";
                    return;
                }

                // Sort: Pending first, then by Date (Newest first)
                // Note: Since date is a string in this demo, we rely on ID or status sorting
                data.reverse(); 
                data.sort((a, b) => (a.status === 'Pending' ? -1 : 1));

                data.forEach(alertItem => {
                    // Status Styling
                    let badgeClass = "status-review"; // Blue for Acknowledged
                    let actionBtn = `<span style="color:#777; font-size:13px;">Action Taken</span>`;

                    if (alertItem.status === "Pending") {
                        badgeClass = "status-pending"; // Orange for Pending
                        // Show Acknowledge Button
                        actionBtn = `<button class="btn btn-sm btn-success ack-btn" data-id="${alertItem.id}">Acknowledge</button>`;
                    }

                    const row = document.createElement("tr");
                    row.innerHTML = `
                        <td>${alertItem.dateTime}</td>
                        <td>${alertItem.guardId}</td>
                        <td>${alertItem.name}</td>
                        <td><span class="status-badge ${badgeClass}">${alertItem.status}</span></td>
                        <td class="action-cell">${actionBtn}</td>
                    `;
                    alertTableBody.appendChild(row);
                });
            })
            .catch(err => console.error("Error loading alerts:", err));
    }

    // Run on load
    loadAlerts();

    // --- Handle Acknowledge Click ---
    if (alertTableBody) {
        alertTableBody.addEventListener("click", (e) => {
            if (e.target.classList.contains("ack-btn")) {
                const id = e.target.getAttribute("data-id");
                
                if (confirm("Acknowledge this emergency?")) {
                    fetch(`${apiUrl}/alerts/${id}`, {
                        method: "PATCH",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ status: "Acknowledged" })
                    })
                    .then(res => {
                        if (res.ok) {
                            loadAlerts(); // Refresh table
                        }
                    });
                }
            }
        });
    }

    // ==========================================
    // 10. MANAGE PAYMENTS PAGE LOGIC
    // ==========================================
    const paymentTableBodyAdmin = document.getElementById("payment-table-body");
    const guardSelect = document.getElementById("guard-select");
    const addPaymentBtn = document.getElementById("add-payment-btn");
    const paymentModal = document.getElementById("payment-modal");
    const paymentForm = document.getElementById("payment-form");
    
    // Inputs in the modal
    const payGuardName = document.getElementById("pay-guard-name");
    const payGuardId = document.getElementById("pay-guard-id");

    // --- Helper: Load Payment History for a Guard ---
    function loadAdminPayments(guardId) {
        if (!paymentTableBodyAdmin) return;

        fetch(`${apiUrl}/payments?guardId=${guardId}`)
            .then(res => res.json())
            .then(data => {
                paymentTableBodyAdmin.innerHTML = "";

                if (data.length === 0) {
                    paymentTableBodyAdmin.innerHTML = "<tr><td colspan='4' style='text-align:center; padding:15px;'>No payment records found for this guard.</td></tr>";
                    return;
                }

                // Sort by date (assuming DD/MM/YYYY format, simple reverse for now)
                data.reverse();

                data.forEach(pay => {
                    const row = document.createElement("tr");
                    row.innerHTML = `
                        <td>${pay.date}</td>
                        <td>${pay.title}</td>
                        <td>${pay.transactionId}</td>
                        <td style="text-align: right;">₹ ${pay.amount}</td>
                    `;
                    paymentTableBodyAdmin.appendChild(row);
                });
            })
            .catch(err => console.error("Error loading payments:", err));
    }

    // --- Helper: Initialize Dropdown ---
    if (guardSelect) {
        // 1. Fetch all guards
        fetch(`${apiUrl}/guards`)
            .then(res => res.json())
            .then(guards => {
                guardSelect.innerHTML = '<option value="">-- Select a Guard --</option>';
                
                guards.forEach(guard => {
                    const option = document.createElement("option");
                    option.value = guard.id;
                    option.textContent = `${guard.name} (${guard.id})`;
                    guardSelect.appendChild(option);
                });
            });

        // 2. Listen for changes
        guardSelect.addEventListener("change", () => {
            const selectedId = guardSelect.value;
            if (selectedId) {
                loadAdminPayments(selectedId);
            } else {
                paymentTableBodyAdmin.innerHTML = "<tr><td colspan='4' style='text-align:center;'>Please select a guard to view history.</td></tr>";
            }
        });
    }

    // --- Modal Logic ---
    if (addPaymentBtn) {
        addPaymentBtn.addEventListener("click", () => {
            const selectedId = guardSelect.value;
            
            if (!selectedId) {
                alert("Please select a guard from the dropdown first.");
                return;
            }

            // Pre-fill the modal with the selected guard's info
            const selectedText = guardSelect.options[guardSelect.selectedIndex].text;
            payGuardName.value = selectedText;
            payGuardId.value = selectedId;
            
            paymentModal.style.display = "block";
        });

        // Handle Form Submit
        paymentForm.addEventListener("submit", (e) => {
            e.preventDefault();

            // Format Date to DD/MM/YYYY to match Guard side expectation
            const rawDate = document.getElementById("pay-date").value; // YYYY-MM-DD
            const dateObj = new Date(rawDate);
            const formattedDate = dateObj.toLocaleDateString('en-GB'); // DD/MM/YYYY

            const newPayment = {
                guardId: payGuardId.value,
                date: formattedDate,
                title: document.getElementById("pay-title").value,
                transactionId: document.getElementById("pay-txn").value,
                amount: document.getElementById("pay-amount").value
            };

            fetch(`${apiUrl}/payments`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(newPayment)
            })
            .then(res => {
                if (res.ok) {
                    alert("Payment record added successfully!");
                    paymentModal.style.display = "none";
                    paymentForm.reset();
                    loadAdminPayments(payGuardId.value); // Refresh table
                }
            });
        });

        // Close button logic
        const closeBtn = paymentModal.querySelector(".close-btn");
        if (closeBtn) closeBtn.addEventListener("click", () => paymentModal.style.display = "none");
        window.addEventListener("click", (e) => { if(e.target == paymentModal) paymentModal.style.display = "none"; });
    }

});
