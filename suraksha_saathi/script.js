// Wait for the DOM (all HTML) to load before running the script
document.addEventListener("DOMContentLoaded", () => {

    // --- Login Page Logic (UPDATED WITH DATABASE) ---
    const loginForm = document.getElementById("login-form");
    const forgotPasswordLink = document.getElementById("forgot-password-link");
    
    // Check if we are on the login page (index.html)
    if (loginForm) {
        // 1. Handle Login
        loginForm.addEventListener("submit", (event) => {
            // Prevent the form from actually submitting
            event.preventDefault();
            
            // Get values from input fields
            const guardId = document.getElementById("guard-id").value;
            const password = document.getElementById("password").value;

            // 1. Ask the backend for the guard with this specific ID
            fetch(`http://localhost:3000/guards?id=${guardId}`)
                .then(response => response.json())
                .then(data => {
                    // json-server returns a list (array) of matches.
                    
                    // 2. Check if we found a user
                    if (data.length > 0) {
                        const user = data[0]; // Get the first matching user
                        
                        // 3. Check if the password matches
                        if (user.password === password) {
                            console.log("Login successful!");
                            
                            // IMPORTANT: Save the user's details in the browser's "memory"
                            // This is how the Dashboard will know WHICH guard is logged in.
                            localStorage.setItem("loggedInGuard", JSON.stringify(user));
                            
                            // Redirect to dashboard
                            window.location.href = "dashboard.html";
                        } else {
                            alert("Incorrect password. Please try again.");
                        }
                    } else {
                        alert("Guard ID not found.");
                    }
                })
                .catch(error => {
                    console.error("Error:", error);
                    alert("Could not connect to the database. Make sure the black terminal window is open!");
                });
        });

        // 2. Handle "Forgot Password" Link
        if (forgotPasswordLink) {
            forgotPasswordLink.addEventListener("click", (event) => {
                event.preventDefault(); // Stop the link from jumping
                document.getElementById("forgot-password-modal").style.display = "block";
            });
        }
    }

    // --- Modal Logic (Real Database Implementation) ---
    const modal = document.getElementById("forgot-password-modal");
    const closeBtn = document.querySelector(".close-btn");

    // We need these variables to store data between the 3 steps
    let tempUserId = null;
    let generatedOtp = null;

    if (modal) {
        // 3. Close Modal with 'X' button
        closeBtn.addEventListener("click", () => {
            modal.style.display = "none";
        });

        // 4. Close Modal by clicking outside of it
        window.addEventListener("click", (event) => {
            if (event.target == modal) {
                modal.style.display = "none";
            }
        });

        // 5. Handle the multi-step "Forgot Password" form
        const step1 = document.getElementById("step1-details");
        const step2 = document.getElementById("step2-otp");
        const step3 = document.getElementById("step3-reset");

        // Step 1 -> Step 2 (Verify Identity)
        step1.addEventListener("submit", (e) => {
            e.preventDefault();
            
            const inputId = document.getElementById("modal-guard-id").value;
            const inputPhone = document.getElementById("modal-phone").value;

            // Check DB for a guard with THIS ID and THIS Phone
            fetch(`http://localhost:3000/guards?id=${inputId}&phone=${inputPhone}`)
                .then(res => res.json())
                .then(data => {
                    if (data.length > 0) {
                        // Found the user!
                        tempUserId = data[0].id; // Store ID for later
                        
                        // Generate a random 4-digit OTP
                        generatedOtp = Math.floor(1000 + Math.random() * 9000);
                        
                        // Simulate sending SMS
                        console.log("OTP Generated:", generatedOtp);
                        alert(`[SIMULATION] Your OTP is: ${generatedOtp}`);

                        // Move to Step 2
                        step1.style.display = "none";
                        step2.style.display = "block";
                    } else {
                        alert("Details not found. Please check your Guard ID and registered Phone Number.");
                    }
                })
                .catch(err => console.error("Error:", err));
        });

        // Step 2 -> Step 3 (Verify OTP)
        step2.addEventListener("submit", (e) => {
            e.preventDefault();
            const inputOtp = document.getElementById("modal-otp").value;

            // Compare input string with generated number
            if (inputOtp == generatedOtp) {
                // Move to Step 3
                step2.style.display = "none";
                step3.style.display = "block";
            } else {
                alert("Invalid OTP. Please try again.");
            }
        });
        
        // Step 3 -> Done (Update Password in DB)
        step3.addEventListener("submit", (e) => {
            e.preventDefault();
            
            const newPass = document.getElementById("modal-new-password").value;
            const confirmPass = document.getElementById("modal-confirm-password").value;

            if (newPass !== confirmPass) {
                alert("Passwords do not match!");
                return;
            }

            // Send 'PATCH' request to update ONLY the password
            fetch(`http://localhost:3000/guards/${tempUserId}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    password: newPass
                })
            })
                .then(res => {
                    if (res.ok) {
                        alert("Password reset successfully! Please login with your new password.");
                        modal.style.display = "none";
                    
                        // Reset the modal forms for next time
                        step1.reset(); step2.reset(); step3.reset();
                        step1.style.display = "block";
                        step2.style.display = "none";
                        step3.style.display = "none";
                    } else {
                        alert("Error updating password.");
                    }
                })
                .catch(err => console.error("Error:", err));
        });
    }

    // --- Dashboard Page Logic ---
    const emergencyBtn = document.getElementById("emergency-btn");
    const welcomeMsg = document.getElementById("welcome-msg");
    const logoutBtn = document.getElementById("logout-btn");

    // 1. CHECK AUTHENTICATION (Protect the page)
    // We check if the code is running on the dashboard page
    if (window.location.pathname.includes("dashboard.html")) {
        const storedUser = localStorage.getItem("loggedInGuard");

        if (!storedUser) {
            // If no user is found in memory, kick them back to login
            alert("You must log in first.");
            window.location.href = "index.html";
        } else {
            // 2. PERSONALIZE THE PAGE
            const user = JSON.parse(storedUser);
            if (welcomeMsg) {
                welcomeMsg.textContent = `Welcome, ${user.name}`;
            }
        }
    }

    // 3. LOGOUT LOGIC
    if (logoutBtn) {
        logoutBtn.addEventListener("click", () => {
            const isSure = confirm("Are you sure you want to logout?");
            if (isSure) {
                // Clear the memory
                localStorage.removeItem("loggedInGuard");
                // Go back to login
                window.location.href = "index.html";
            }
        });
    }

    // 4. EMERGENCY LOGIC (Existing)
    if (emergencyBtn) {
        emergencyBtn.addEventListener("click", () => {
            // Confirm with the user before sending
            const isSure = confirm("Are you sure you want to send an EMERGENCY alert?");
            if (isSure) {
                // Get current user details
                const storedUser = localStorage.getItem("loggedInGuard");
                const user = storedUser ? JSON.parse(storedUser) : { id: "UNKNOWN", name: "Unknown" };

                // Send alert to Database
                fetch("http://localhost:3000/alerts", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        guardId: user.id,
                        name: user.name,
                        dateTime: new Date().toLocaleString(),
                        status: "Pending"
                    })
                })
                    .then(res => {
                        if (res.ok) alert("EMERGENCY SIGNAL SENT!\nReinforcements are being notified.");
                    })
                    .catch(err => console.error("Error sending alert:", err));
            }
        });
    }

    // --- Profile Page Logic (UPDATED WITH DATABASE) ---
    const editBtn = document.getElementById("edit-btn");
    const saveBtn = document.getElementById("save-btn");
    const cancelBtn = document.getElementById("cancel-btn");

    // Input fields
    const phoneInput = document.getElementById("phone");
    const editSection = document.getElementById("edit-section");
    const passwordError = document.getElementById("password-error");
    const oldPassword = document.getElementById("old-password");
    const newPassword = document.getElementById("new-password");
    const confirmPassword = document.getElementById("confirm-password");

    // Text fields (Spans)
    const displayId = document.querySelector(".info-item:nth-child(1) .info-value");
    const displayName = document.querySelector(".info-item:nth-child(2) .info-value");
    const displayDob = document.querySelector(".info-item:nth-child(3) .info-value");
    const displayGender = document.querySelector(".info-item:nth-child(4) .info-value");

    let originalPhoneValue = "";

    // 1. LOAD DATA ON STARTUP
    // Check if we are on the profile page by looking for a unique element
    if (displayId) {
        const storedUser = localStorage.getItem("loggedInGuard");
        if (storedUser) {
            const user = JSON.parse(storedUser);
            
            // Fill in the HTML with real data
            displayId.textContent = user.id;
            displayName.textContent = user.name;
            displayDob.textContent = user.dob;
            displayGender.textContent = user.gender;
            phoneInput.value = user.phone;
            
            originalPhoneValue = user.phone;
        } else {
            // If no user is logged in, go back to login
            window.location.href = "index.html";
        }
    }

    // 2. EDIT / CANCEL LOGIC (Same as before)
    if (editBtn) {
        editBtn.addEventListener("click", () => {
            originalPhoneValue = phoneInput.value;
            editBtn.classList.add("hidden");
            saveBtn.classList.remove("hidden");
            cancelBtn.classList.remove("hidden");
            phoneInput.readOnly = false;
            editSection.classList.remove("hidden");
        });

        cancelBtn.addEventListener("click", () => {
            editBtn.classList.remove("hidden");
            saveBtn.classList.add("hidden");
            cancelBtn.classList.add("hidden");
            phoneInput.readOnly = true;
            phoneInput.value = originalPhoneValue;
            editSection.classList.add("hidden");
            passwordError.classList.add("hidden");
            oldPassword.value = "";
            newPassword.value = "";
            confirmPassword.value = "";
        });

        // 3. SAVE LOGIC (Updated to use Backend)
        saveBtn.addEventListener("click", () => {
            passwordError.classList.add("hidden");
            
            const newPass = newPassword.value;
            const confirmPass = confirmPassword.value;
            const oldPass = oldPassword.value;
            
            // Prepare the data we want to update
            const storedUser = JSON.parse(localStorage.getItem("loggedInGuard"));
            let updates = { phone: phoneInput.value };

            // Validation: Password Change
            if (newPass || confirmPass || oldPass) {
                // In a real app, you'd check oldPass against the server here.
                // For this demo, we'll trust the user or check against local storage
                if (oldPass !== storedUser.password) {
                    alert("Old password is incorrect.");
                    return;
                }
                if (newPass !== confirmPass) {
                    passwordError.classList.remove("hidden");
                    return;
                }
                // If valid, add password to updates
                updates.password = newPass;
            }

            // SEND UPDATE TO SERVER
            fetch(`http://localhost:3000/guards/${storedUser.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(updates)
            })
                .then(res => {
                    if (res.ok) {
                        alert("Profile updated successfully!");
                    
                        // IMPORTANT: Update the localStorage so the new phone/pass works immediately
                        const updatedUser = { ...storedUser, ...updates };
                        localStorage.setItem("loggedInGuard", JSON.stringify(updatedUser));
                    
                        // Reset UI
                        originalPhoneValue = phoneInput.value;
                        cancelBtn.click(); // Helper to reset buttons
                    } else {
                        alert("Failed to update profile.");
                    }
                })
                .catch(err => console.error("Error:", err));
        });
    }

    // --- Leave Application Logic (CONNECTED TO DB) ---
    const leaveForm = document.getElementById("leave-form");
    const leaveTableBody = document.getElementById("leave-table-body");

    // Helper: Load Leave History
    function loadLeaveHistory() {
        const storedUser = localStorage.getItem("loggedInGuard");
        if (!storedUser) return;
        const user = JSON.parse(storedUser);

        fetch(`http://localhost:3000/leaves?guardId=${user.id}`)
            .then(res => res.json())
            .then(data => {
                // Clear existing rows
                leaveTableBody.innerHTML = "";
                
                if (data.length === 0) {
                    leaveTableBody.innerHTML = "<tr><td colspan='4' style='text-align:center; padding:10px;'>No leave records found.</td></tr>";
                    return;
                }

                // Show newest first
                data.reverse().forEach(leave => {
                    // Determine the class based on status to match your CSS
                    let statusClass = "status status-pending";
                    
                    if (leave.status === "Approved") {
                        statusClass = "status status-approved";
                    } else if (leave.status === "Denied") {
                        statusClass = "status status-denied";
                    }

                    const row = document.createElement("tr");
                    
                    // Using the exact HTML structure you requested
                    row.innerHTML = `
                        <td>${leave.startDate}</td>
                        <td>${leave.endDate}</td>
                        <td>${leave.reason}</td>
                        <td><span class="${statusClass}">${leave.status}</span></td>
                    `;
                    leaveTableBody.appendChild(row);
                });
            })
            .catch(err => console.error("Error loading leaves:", err));
    }

    if (leaveForm) {
        // 1. Load history on page load
        loadLeaveHistory();

        // 2. Handle Form Submit
        leaveForm.addEventListener("submit", (e) => {
            e.preventDefault();
            
            const storedUser = localStorage.getItem("loggedInGuard");
            if (!storedUser) {
                window.location.href = "index.html";
                return;
            }
            const user = JSON.parse(storedUser);

            const startDate = document.getElementById("start-date").value;
            const endDate = document.getElementById("end-date").value;
            const reason = document.getElementById("leave-reason").value;

            // Send to Database
            fetch("http://localhost:3000/leaves", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    guardId: user.id,
                    name: user.name,
                    startDate: startDate,
                    endDate: endDate,
                    reason: reason,
                    status: "Pending" // New requests are always Pending
                })
            })
                .then(res => {
                    if (res.ok) {
                        alert("Leave application submitted successfully!");
                        leaveForm.reset(); // Clear the form
                        loadLeaveHistory(); // Refresh table immediately
                    } else {
                        alert("Error submitting application.");
                    }
                })
                .catch(err => console.error("Error:", err));
        });
    }

    // ==========================================
    // SCHEDULE PAGE LOGIC (UPDATED FOR NEW DB STRUCTURE)
    // ==========================================
    const scheduleTableBody = document.getElementById("schedule-table-body");
    
    // Modal Elements
    const requestChangeBtn = document.getElementById("request-change-btn");
    const requestModal = document.getElementById("request-change-modal");
    const requestProblemSelect = document.getElementById("request-problem");
    const changeRequestForm = document.getElementById("change-request-form");
    
    // Dynamic Input Groups
    const targetShiftGroup = document.getElementById("target-shift-group");
    const targetLocationGroup = document.getElementById("target-location-group");
    const otherReasonGroup = document.getElementById("other-reason-group");
    const targetShiftInput = document.getElementById("target-shift");
    const targetLocationInput = document.getElementById("target-location");
    const otherReasonInput = document.getElementById("other-reason");

    // 1. LOAD SCHEDULE FROM DB
    if (scheduleTableBody) {
        const storedUser = localStorage.getItem("loggedInGuard");
        if (storedUser) {
            const user = JSON.parse(storedUser);

            fetch(`http://localhost:3000/schedules?guardId=${user.id}`)
                .then(res => res.json())
                .then(data => {
                    scheduleTableBody.innerHTML = "";

                    if (data.length === 0) {
                        scheduleTableBody.innerHTML = "<tr><td colspan='4' style='text-align:center; padding:15px;'>No schedule assigned yet.</td></tr>";
                        return;
                    }

                    const schedule = data[0];
                    
                    // Helper: Get Shift Time Text
                    const getShiftTimeText = (shiftType) => {
                        if (shiftType === "morning") return "A (6 AM - 2 PM)";
                        if (shiftType === "evening") return "B (2 PM - 10 PM)";
                        if (shiftType === "night") return "C (10 PM - 6 AM)";
                        return "OFF";
                    };

                    const days = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];
                    const dayNames = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

                    // Date Logic
                    const today = new Date();
                    const dayOfWeek = today.getDay(); 
                    const diffToMon = today.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
                    const mondayDate = new Date(today.setDate(diffToMon));

                    days.forEach((dayKey, index) => {
                        const rawData = schedule[dayKey];
                        let shiftCode = "off";
                        let locationName = "-";

                        // Handle Object vs String data
                        if (typeof rawData === 'object' && rawData !== null) {
                            shiftCode = rawData.shift || "off";
                            locationName = rawData.loc || "-";
                        } else if (typeof rawData === 'string') {
                            shiftCode = rawData;
                            if(shiftCode === "morning") locationName = "Main Gate";
                            else if(shiftCode === "evening") locationName = "Admin Building";
                            else if(shiftCode === "night") locationName = "Hostel";
                        }

                        // --- FIX: If Shift is OFF, Force Location to "-" ---
                        if (shiftCode === "off") {
                            locationName = "-";
                        }
                        // --------------------------------------------------

                        // Calculate date
                        const rowDate = new Date(mondayDate);
                        rowDate.setDate(mondayDate.getDate() + index);
                        const dateString = rowDate.toLocaleDateString('en-GB', { month: 'short', day: 'numeric' });

                        const row = document.createElement("tr");
                        row.innerHTML = `
                            <td style="font-weight:500;">${dayNames[index]}</td>
                            <td>${dateString}</td>
                            <td style="${shiftCode === 'off' ? 'color:red; font-weight:bold;' : ''}">${getShiftTimeText(shiftCode)}</td>
                            <td>${locationName}</td>
                        `;
                        scheduleTableBody.appendChild(row);
                    });
                })
                .catch(err => console.error("Error loading schedule:", err));
        } else {
            window.location.href = "index.html";
        }
    }

    // 2. MODAL LOGIC (Existing logic remains same)
    if (requestChangeBtn) {
        requestChangeBtn.addEventListener("click", () => {
            requestModal.style.display = "block";
        });

        requestProblemSelect.addEventListener("change", () => {
            targetShiftGroup.classList.add("hidden");
            targetLocationGroup.classList.add("hidden");
            otherReasonGroup.classList.add("hidden");
            
            targetShiftInput.required = false;
            targetLocationInput.required = false;
            otherReasonInput.required = false;

            const val = requestProblemSelect.value;
            if (val === "shift") {
                targetShiftGroup.classList.remove("hidden");
                targetShiftInput.required = true;
            } else if (val === "location") {
                targetLocationGroup.classList.remove("hidden");
                targetLocationInput.required = true;
            } else if (val === "others") {
                otherReasonGroup.classList.remove("hidden");
                otherReasonInput.required = true;
            }
        });

        changeRequestForm.addEventListener("submit", (event) => {
            event.preventDefault();
            
            const user = JSON.parse(localStorage.getItem("loggedInGuard"));
            const date = document.getElementById("request-date").value;
            const type = requestProblemSelect.value;
            
            let description = "";
            if (type === "shift") description = `Request Shift Change to: ${targetShiftInput.value}`;
            else if (type === "location") description = `Request Location Change to: ${targetLocationInput.value}`;
            else if (type === "others") description = `Issue: ${otherReasonInput.value}`;

            fetch("http://localhost:3000/complaints", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    guardId: user.id,
                    date: new Date().toLocaleDateString('en-GB'),
                    type: "Schedule Request", 
                    description: `${description} (For Date: ${date})`,
                    status: "pending",
                    photo: "" 
                })
            })
            .then(res => {
                if (res.ok) {
                    alert("Request submitted successfully!");
                    requestModal.style.display = "none";
                    changeRequestForm.reset();
                    targetShiftGroup.classList.add("hidden");
                    targetLocationGroup.classList.add("hidden");
                    otherReasonGroup.classList.add("hidden");
                }
            });
        });
        
        const closeModalBtn = requestModal.querySelector(".close-btn");
        if (closeModalBtn) closeModalBtn.addEventListener("click", () => requestModal.style.display = "none");
        window.addEventListener("click", (e) => { if (e.target == requestModal) requestModal.style.display = "none"; });
    }

    // --- Complaint Page Logic (CONNECTED TO DB) ---
    const complaintForm = document.getElementById("complaint-form");
    const complaintPhotoInput = document.getElementById("complaint-photo");
    const fileNameDisplay = document.getElementById("file-name-display");
    const complaintTableBody = document.getElementById("complaint-table-body");

    // Helper: Load Complaint History
    function loadComplaintHistory() {
        const storedUser = localStorage.getItem("loggedInGuard");
        if (!storedUser) return;
        const user = JSON.parse(storedUser);

        fetch(`http://localhost:3000/complaints?guardId=${user.id}`)
            .then(res => res.json())
            .then(data => {
                complaintTableBody.innerHTML = "";
                
                if (data.length === 0) {
                    complaintTableBody.innerHTML = "<tr><td colspan='3' style='text-align:center; padding:10px;'>No complaints found.</td></tr>";
                    return;
                }

                data.reverse().forEach(complaint => {
                    // Color coding for status
                    let statusClass = "status status-pending";
                    let statusText = "Pending";
                    
                    if (complaint.status === "review") {
                        statusClass = "status status-review";
                        statusText = "In Review";
                    } else if (complaint.status === "resolved") {
                        statusClass = "status status-resolved";
                        statusText = "Resolved";
                    }

                    const row = document.createElement("tr");
                    row.innerHTML = `
                        <td>${complaint.date}</td>
                        <td>${complaint.type}</td>
                        <td><span class="${statusClass}">${statusText}</span></td>
                    `;
                    complaintTableBody.appendChild(row);
                });
            })
            .catch(err => console.error("Error loading complaints:", err));
    }

    if (complaintForm) {
        loadComplaintHistory();

        // 1. File Input Change (Show name)
        complaintPhotoInput.addEventListener("change", () => {
            if (complaintPhotoInput.files.length > 0) {
                fileNameDisplay.textContent = complaintPhotoInput.files[0].name;
            } else {
                fileNameDisplay.textContent = "Upload Photo Proof";
            }
        });

        // 2. Submit Logic
        complaintForm.addEventListener("submit", (event) => {
            event.preventDefault();
            
            const storedUser = localStorage.getItem("loggedInGuard");
            if (!storedUser) {
                window.location.href = "index.html";
                return;
            }
            const user = JSON.parse(storedUser);

            const type = document.getElementById("complaint-type").value;
            const desc = document.getElementById("complaint-description").value;
            const file = complaintPhotoInput.files[0];
            
            // Function to send data (we call this after handling the image)
            const sendComplaint = (photoData) => {
                const now = new Date();
                const dateStr = now.toLocaleDateString('en-GB');

                fetch("http://localhost:3000/complaints", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        guardId: user.id,
                        date: dateStr,
                        type: type,
                        description: desc,
                        status: "pending",
                        photo: photoData || "" // Send Base64 string or empty if no photo
                    })
                })
                    .then(res => {
                        if (res.ok) {
                            alert("Complaint submitted successfully!");
                            complaintForm.reset();
                            fileNameDisplay.textContent = "Upload Photo Proof";
                            loadComplaintHistory();
                        } else {
                            alert("Error submitting complaint.");
                        }
                    })
                    .catch(err => console.error("Error:", err));
            };

            // Handle Image Conversion
            if (file) {
                const reader = new FileReader();
                reader.onloadend = function () {
                    // This 'result' is the long text string of the image
                    sendComplaint(reader.result);
                }
                reader.readAsDataURL(file);
            } else {
                // If no file selected, just send text data
                sendComplaint(null);
            }
        });
    }

    // --- Attendance Page Logic (CONNECTED TO DB) ---
    const markAttendanceBtn = document.getElementById("mark-attendance-btn");
    const step1 = document.getElementById("step-1-start");
    const step2 = document.getElementById("step-2-capture");
    const step3 = document.getElementById("step-3-preview");

    const videoFeed = document.getElementById("video-feed");
    const captureBtn = document.getElementById("capture-btn");
    const photoCanvas = document.getElementById("photo-canvas");
    const retakePhotoBtn = document.getElementById("retake-photo-btn");
    const submitPhotoBtn = document.getElementById("submit-photo-btn");
    const attendanceTableBody = document.getElementById("attendance-table-body");

    let stream = null;

    // Helper: Load History from Database
    function loadAttendanceHistory() {
        const storedUser = localStorage.getItem("loggedInGuard");
        if (!storedUser) return;
        
        const user = JSON.parse(storedUser);

        fetch(`http://localhost:3000/attendance?guardId=${user.id}`)
            .then(res => res.json())
            .then(data => {
                attendanceTableBody.innerHTML = ""; // Clear loading text
                
                if (data.length === 0) {
                    attendanceTableBody.innerHTML = "<tr><td colspan='3' style='text-align:center; padding:10px;'>No attendance records found.</td></tr>";
                    return;
                }

                // Sort data so newest is first
                data.reverse().forEach(record => {
                    
                    // --- DYNAMIC COLOR LOGIC ---
                    let badgeClass = "status status-approved"; // Default Green (Present)
                    
                    if (record.status === "Late") {
                        badgeClass = "status status-late"; // Orange
                    } else if (record.status === "Absent") {
                        badgeClass = "status status-denied"; // Red
                    }
                    // ---------------------------

                    const row = document.createElement("tr");
                    row.innerHTML = `
                        <td>${record.date}</td>
                        <td>${record.timeIn}</td>
                        <td><span class="${badgeClass}">${record.status}</span></td>
                    `;
                    attendanceTableBody.appendChild(row);
                });
            })
            .catch(err => console.error("Error loading history:", err));
    }

    // 1. INITIALIZE PAGE
    if (markAttendanceBtn && attendanceTableBody) {
        // Load history as soon as page loads
        loadAttendanceHistory();

        // START CAMERA
        markAttendanceBtn.addEventListener("click", async () => {
            try {
                stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
                videoFeed.srcObject = stream;
                step1.classList.add("hidden");
                step3.classList.add("hidden");
                step2.classList.remove("hidden");
            } catch (err) {
                console.error("Error accessing camera:", err);
                alert("Could not access camera. Please check permissions.");
            }
        });

        // CAPTURE PHOTO
        captureBtn.addEventListener("click", () => {
            const context = photoCanvas.getContext("2d");
            photoCanvas.width = videoFeed.videoWidth;
            photoCanvas.height = videoFeed.videoHeight;
            context.drawImage(videoFeed, 0, 0, photoCanvas.width, photoCanvas.height);
            
            // Stop camera to save battery/processing
            if (stream) stream.getTracks().forEach(track => track.stop());
            
            step2.classList.add("hidden");
            step3.classList.remove("hidden");
        });

        // RETAKE PHOTO
        retakePhotoBtn.addEventListener("click", () => {
            markAttendanceBtn.click(); // Just re-trigger the start logic
        });

        // SUBMIT ATTENDANCE (Updated with LATE Logic)
        submitPhotoBtn.addEventListener("click", () => {
            const storedUser = localStorage.getItem("loggedInGuard");
            if (!storedUser) {
                alert("Session expired. Please login again.");
                window.location.href = "index.html";
                return;
            }
            const user = JSON.parse(storedUser);

            // 1. Get current Time & Date
            const now = new Date();
            const dateStr = now.toLocaleDateString('en-GB'); // DD/MM/YYYY
            const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

            // --- NEW LOGIC: Determine Status (Present vs Late) ---
            let calculatedStatus = "Present";
            const currentHour = now.getHours(); // 0 to 23
            const currentMin = now.getMinutes();

            // Define Grace Period (e.g., 15 minutes after shift start)
            const graceLimit = 15;

            // Logic for Standard Shifts:
            // Morning: 06:00 - 14:00
            // Evening: 14:00 - 22:00
            // Night:   22:00 - 06:00

            if (currentHour >= 6 && currentHour < 14) {
                // Morning Shift
                // If it is past 6:15 AM, mark as Late
                if (currentHour > 6 || (currentHour === 6 && currentMin > graceLimit)) {
                    calculatedStatus = "Late";
                }
            } else if (currentHour >= 14 && currentHour < 22) {
                // Evening Shift
                // If it is past 2:15 PM (14:15), mark as Late
                if (currentHour > 14 || (currentHour === 14 && currentMin > graceLimit)) {
                    calculatedStatus = "Late";
                }
            } else {
                // Night Shift (22:00 to 06:00)
                // If it is past 10:15 PM (22:15) OR it is early morning (00:00 - 06:00), mark as Late
                // (Assuming shift starts at 22:00)
                if (currentHour > 22 || (currentHour === 22 && currentMin > graceLimit) || currentHour < 6) {
                    calculatedStatus = "Late";
                }
            }
            // -----------------------------------------------------

            // 2. Convert Photo to Text String (Base64)
            const photoData = photoCanvas.toDataURL("image/jpeg");

            // 3. Send to Database
            fetch("http://localhost:3000/attendance", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    guardId: user.id,
                    name: user.name,
                    date: dateStr,
                    timeIn: timeStr,
                    status: calculatedStatus, // Use the calculated status!
                    photo: photoData 
                })
            })
            .then(res => {
                if (res.ok) {
                    alert(`Attendance marked successfully!\nStatus: ${calculatedStatus}`);
                    step3.classList.add("hidden");
                    step1.classList.remove("hidden");
                    loadAttendanceHistory();
                } else {
                    alert("Failed to mark attendance.");
                }
            })
            .catch(err => console.error("Error submitting:", err));
        });
    }

    // --- Payment Page Logic (CONNECTED TO DB) ---
    const paymentTableBody = document.getElementById("payment-table-body");

    if (paymentTableBody) {
        const storedUser = localStorage.getItem("loggedInGuard");
        if (storedUser) {
            const user = JSON.parse(storedUser);

            fetch(`http://localhost:3000/payments?guardId=${user.id}`)
                .then(res => res.json())
                .then(data => {
                    paymentTableBody.innerHTML = "";

                    if (data.length === 0) {
                        paymentTableBody.innerHTML = "<tr><td colspan='4' style='text-align:center; padding:10px;'>No payment records found.</td></tr>";
                        return;
                    }

                    // Display newest first
                    data.reverse().forEach(payment => {
                        const row = document.createElement("tr");
                        // Make sure these variables match what the Admin saves!
                        row.innerHTML = `
                            <td>${payment.date}</td>
                            <td>${payment.title}</td>
                            <td>${payment.transactionId}</td>
                            <td style="text-align: right;">₹ ${payment.amount}</td>
                        `;
                        paymentTableBody.appendChild(row);
                    });
                })
                .catch(err => console.error("Error loading payments:", err));
        } else {
            window.location.href = "index.html";
        }
    }
    
});