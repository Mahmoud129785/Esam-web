// ===== DATABASE SIMULATION =====
const ADMIN_EMAILS = [
    'admin@platform.com',
    'master@platform.com',
    'manager@platform.com'
];

const ADMIN_PASSWORD = 'Admin@123';

const WHATSAPP_NUMBER = '201064519768';

// Initialize localStorage data
function initData() {
    if (!localStorage.getItem('platform_users')) {
        localStorage.setItem('platform_users', JSON.stringify([]));
    }
    if (!localStorage.getItem('platform_lectures')) {
        localStorage.setItem('platform_lectures', JSON.stringify([]));
    }
    if (!localStorage.getItem('platform_admin_sessions')) {
        localStorage.setItem('platform_admin_sessions', JSON.stringify([]));
    }
}

initData();

// ===== HELPER FUNCTIONS =====
function getUsers() {
    return JSON.parse(localStorage.getItem('platform_users') || '[]');
}

function saveUsers(users) {
    localStorage.setItem('platform_users', JSON.stringify(users));
}

function getLectures() {
    return JSON.parse(localStorage.getItem('platform_lectures') || '[]');
}

function saveLectures(lectures) {
    localStorage.setItem('platform_lectures', JSON.stringify(lectures));
}

function getCurrentUser() {
    return JSON.parse(sessionStorage.getItem('current_user') || 'null');
}

function setCurrentUser(user) {
    sessionStorage.setItem('current_user', JSON.stringify(user));
}
function isAdmin(email) {
    return ADMIN_EMAILS.includes(email);
}

function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}

function showMessage(elementId, message, type) {
    const el = document.getElementById(elementId);
    if (el) {
        el.textContent = message;
        el.className = `message ${type}`;
        setTimeout(() => {
            el.className = 'message';
        }, 5000);
    }
}

function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// ===== REGISTRATION =====
function handleRegister(data) {
    if (data.password !== data.confirmPassword) {
        showMessage('registerMessage', 'كلمتا المرور غير متطابقتين', 'error');
        return;
    }

    const users = getUsers();

    // Check if national ID already exists
    if (users.find(u => u.nationalId === data.nationalId)) {
        showMessage('registerMessage', 'هذا الرقم القومي مسجل بالفعل', 'error');
        return;
    }

    const newUser = {
        id: generateId(),
        firstName: data.firstName,
        secondName: data.secondName,
        thirdName: data.thirdName,
        fullName: `${data.firstName} ${data.secondName} ${data.thirdName}`,
        studentNumber: data.studentNumber,        parentNumber: data.parentNumber,
        nationalId: data.nationalId,
        grade: data.grade,
        password: data.password,
        paid: false,
        isAdmin: false,
        createdAt: new Date().toISOString(),
        lastLogin: null,
        watchedLectures: []
    };

    users.push(newUser);
    saveUsers(users);

    showMessage('registerMessage', '✅ تم إنشاء الحساب بنجاح! يمكنك تسجيل الدخول الآن', 'success');

    // Clear form
    document.getElementById('registerForm').reset();

    setTimeout(() => {
        window.location.href = 'index.html';
    }, 2000);
}

// ===== LOGIN =====
function handleLogin(nationalId, password) {
    const users = getUsers();

    // Check admin login
    if (ADMIN_EMAILS.includes(nationalId)) {
        if (password === ADMIN_PASSWORD) {
            const adminSession = {
                email: nationalId,
                isAdmin: true,
                loginTime: new Date().toISOString()
            };
            sessionStorage.setItem('admin_session', JSON.stringify(adminSession));
            window.location.href = 'admin.html';
            return;
        } else {
            showMessage('loginMessage', 'كلمة المرور غير صحيحة', 'error');
            return;
        }
    }

    const user = users.find(u => u.nationalId === nationalId && u.password === password);

    if (!user) {
        showMessage('loginMessage', 'الرقم القومي أو كلمة المرور غير صحيحة', 'error');
        return;    }

    // Update last login
    user.lastLogin = new Date().toISOString();
    saveUsers(users);

    setCurrentUser(user);
    window.location.href = 'dashboard.html';
}

// ===== LOGOUT =====
function logout() {
    sessionStorage.removeItem('current_user');
    sessionStorage.removeItem('admin_session');
    window.location.href = 'index.html';
}

// ===== DASHBOARD INITIALIZATION =====
function initDashboard() {
    const user = getCurrentUser();
    if (!user) {
        window.location.href = 'index.html';
        return;
    }

    // Set user info
    const initials = user.firstName.charAt(0) + user.secondName.charAt(0);
    document.getElementById('userDisplayName').textContent = `مرحباً، ${user.firstName}`;
    document.getElementById('userAvatar').textContent = initials;

    // Profile section
    document.getElementById('profileName').textContent = user.fullName;
    document.getElementById('profileGrade').textContent = user.grade;
    document.getElementById('profileAvatar').textContent = initials;
    document.getElementById('profileFullName').textContent = user.fullName;
    document.getElementById('profileStudentNum').textContent = user.studentNumber;
    document.getElementById('profileParentNum').textContent = user.parentNumber;
    document.getElementById('profileNationalId').textContent = user.nationalId;

    const paymentStatus = document.getElementById('profilePaymentStatus');
    if (user.paid) {
        paymentStatus.textContent = '✅ مفعل';
        paymentStatus.className = 'status-badge paid';
    } else {
        paymentStatus.textContent = '❌ غير مفعل';
        paymentStatus.className = 'status-badge unpaid';
    }

    // Stats
    const lectures = getLectures();    const userLectures = lectures.filter(l =>
        l.grade === user.grade || l.grade === 'كل الصفوف'
    );
    document.getElementById('lecturesCount').textContent = userLectures.length;
    document.getElementById('watchedCount').textContent = user.watchedLectures ? user.watchedLectures.length : 0;
    document.getElementById('userGrade').textContent = user.grade;

    // Course section
    loadUserLectures(user);
}

function loadUserLectures(user) {
    const lectures = getLectures();
    const userLectures = lectures.filter(l =>
        l.grade === user.grade || l.grade === 'كل الصفوف'
    );

    const lecturesList = document.getElementById('lecturesList');
    const paymentRequired = document.getElementById('paymentRequired');

    if (!user.paid) {
        paymentRequired.style.display = 'block';
        lecturesList.innerHTML = '';
        return;
    }

    paymentRequired.style.display = 'none';

    if (userLectures.length === 0) {
        lecturesList.innerHTML = `
            <div style="grid-column: 1/-1; text-align: center; padding: 40px; color: var(--text-muted);">
                <i class="fas fa-video" style="font-size: 40px; margin-bottom: 15px; display: block;"></i>
                <p>لا توجد محاضرات متاحة حالياً</p>
                <p style="font-size: 13px; margin-top: 5px;">سيتم إضافة محاضرات قريباً</p>
            </div>
        `;
        return;
    }

    lecturesList.innerHTML = userLectures.map((lecture, index) => `
        <div class="lecture-card" onclick="openLecture('${lecture.id}')">
            <div class="lecture-thumbnail">
                <i class="fas fa-play-circle"></i>
                <div class="play-overlay">
                    <i class="fas fa-play"></i>
                </div>
            </div>
            <div class="lecture-info">
                <span class="lecture-category">${lecture.category}</span>
                <h3>${lecture.title}</h3>                <p><i class="fas fa-clock"></i> ${formatDate(lecture.createdAt)}</p>
            </div>
        </div>
    `).join('');
}

function openLecture(lectureId) {
    const lectures = getLectures();
    const lecture = lectures.find(l => l.id === lectureId);
    if (!lecture) return;

    document.getElementById('modalLectureTitle').textContent = lecture.title;
    document.getElementById('modalLectureDesc').textContent = lecture.category;

    const video = document.getElementById('lectureVideo');
    video.src = lecture.videoUrl;

    document.getElementById('lectureModal').classList.add('active');

    // Mark as watched
    const user = getCurrentUser();
    if (user) {
        if (!user.watchedLectures) user.watchedLectures = [];
        if (!user.watchedLectures.includes(lectureId)) {
            user.watchedLectures.push(lectureId);
            const users = getUsers();
            const userIndex = users.findIndex(u => u.id === user.id);
            if (userIndex !== -1) {
                users[userIndex] = user;
                saveUsers(users);
                setCurrentUser(user);
            }
        }
    }
}

function closeLectureModal() {
    document.getElementById('lectureModal').classList.remove('active');
    const video = document.getElementById('lectureVideo');
    video.pause();
    video.src = '';
}

function formatDate(dateStr) {
    const date = new Date(dateStr);
    return date.toLocaleDateString('ar-EG', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });}

// ===== ADMIN FUNCTIONS =====
function initAdmin() {
    const session = JSON.parse(sessionStorage.getItem('admin_session') || 'null');
    if (!session || !session.isAdmin) {
        window.location.href = 'index.html';
        return;
    }

    updateAdminStats();
}

function updateAdminStats() {
    const users = getUsers();
    const lectures = getLectures();

    document.getElementById('totalUsers').textContent = users.length;
    document.getElementById('paidUsers').textContent = users.filter(u => u.paid).length;
    document.getElementById('totalLectures').textContent = lectures.length;
    document.getElementById('pendingUsers').textContent = users.filter(u => !u.paid).length;
}

// ===== LECTURE UPLOAD =====
function handleLectureUpload(title, category, grade, videoUrl) {
    const lectures = getLectures();

    const newLecture = {
        id: generateId(),
        title: title,
        category: category,
        grade: grade,
        videoUrl: videoUrl,
        createdAt: new Date().toISOString()
    };

    lectures.push(newLecture);
    saveLectures(lectures);

    showMessage('uploadMessage', '✅ تم رفع المحاضرة بنجاح!', 'success');
    document.getElementById('uploadForm').reset();
}

// ===== LECTURES TABLE =====
function loadLecturesTable() {
    const lectures = getLectures();
    const tbody = document.getElementById('lecturesTableBody');

    if (lectures.length === 0) {
        tbody.innerHTML = `            <tr>
                <td colspan="6" style="text-align: center; padding: 30px; color: var(--text-muted);">
                    لا توجد محاضرات مرفوعة
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = lectures.map((lecture, index) => `
        <tr>
            <td>${index + 1}</td>
            <td>${lecture.title}</td>
            <td><span class="lecture-category">${lecture.category}</span></td>
            <td>${lecture.grade}</td>
            <td>${formatDate(lecture.createdAt)}</td>
            <td>
                <div class="table-actions">
                    <button class="btn-action btn-delete" onclick="deleteLecture('${lecture.id}')">
                        <i class="fas fa-trash"></i> حذف
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
}

function deleteLecture(lectureId) {
    if (!confirm('هل أنت متأكد من حذف هذه المحاضرة؟')) return;

    let lectures = getLectures();
    lectures = lectures.filter(l => l.id !== lectureId);
    saveLectures(lectures);
    loadLecturesTable();
    updateAdminStats();
    showToast('تم حذف المحاضرة', 'success');
}

// ===== USERS TABLE =====
function loadUsersTable() {
    const users = getUsers();
    const tbody = document.getElementById('usersTableBody');

    if (users.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="9" style="text-align: center; padding: 30px; color: var(--text-muted);">
                    لا يوجد مستخدمين مسجلين
                </td>
            </tr>        `;
        return;
    }

    tbody.innerHTML = users.map((user, index) => `
        <tr>
            <td>${index + 1}</td>
            <td>${user.fullName}</td>
            <td>${user.nationalId}</td>
            <td>${user.studentNumber}</td>
            <td>${user.parentNumber}</td>
            <td>${user.grade}</td>
            <td>
                <span class="status-badge ${user.paid ? 'paid' : 'unpaid'}">
                    ${user.paid ? '✅ مفعل' : '❌ غير مفعل'}
                </span>
            </td>
            <td>${formatDate(user.createdAt)}</td>
            <td>
                <div class="table-actions">
                    ${!user.paid ? `
                        <button class="btn-action btn-activate" onclick="activateUser('${user.id}')">
                            <i class="fas fa-check"></i> تفعيل
                        </button>
                    ` : `
                        <button class="btn-action" style="background: rgba(255,214,0,0.15); color: var(--rgb-yellow); border: 1px solid rgba(255,214,0,0.3);" onclick="deactivateUser('${user.id}')">
                            <i class="fas fa-times"></i> إلغاء
                        </button>
                    `}
                    <button class="btn-action btn-delete" onclick="deleteUser('${user.id}')">
                        <i class="fas fa-trash"></i> حذف
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
}

function activateUser(userId) {
    const users = getUsers();
    const user = users.find(u => u.id === userId);
    if (user) {
        user.paid = true;
        saveUsers(users);
        loadUsersTable();
        updateAdminStats();
        showToast(`تم تفعيل حساب ${user.fullName}`, 'success');
    }
}
function deactivateUser(userId) {
    const users = getUsers();
    const user = users.find(u => u.id === userId);
    if (user) {
        user.paid = false;
        saveUsers(users);
        loadUsersTable();
        updateAdminStats();
        showToast(`تم إلغاء تفعيل حساب ${user.fullName}`, 'error');
    }
}

function deleteUser(userId) {
    if (!confirm('هل أنت متأكد من حذف هذا المستخدم؟')) return;

    let users = getUsers();
    users = users.filter(u => u.id !== userId);
    saveUsers(users);
    loadUsersTable();
    updateAdminStats();
    showToast('تم حذف المستخدم', 'success');
}

// ===== ADMIN CREATE USER =====
function handleAdminCreateUser(data) {
    const users = getUsers();

    if (users.find(u => u.nationalId === data.nationalId)) {
        showMessage('createUserMessage', 'هذا الرقم القومي مسجل بالفعل', 'error');
        return;
    }

    const newUser = {
        id: generateId(),
        firstName: data.firstName,
        secondName: data.secondName,
        thirdName: data.thirdName,
        fullName: `${data.firstName} ${data.secondName} ${data.thirdName}`,
        studentNumber: data.studentNumber,
        parentNumber: data.parentNumber,
        nationalId: data.nationalId,
        grade: data.grade,
        password: data.password,
        paid: data.paid || false,
        isAdmin: false,
        createdAt: new Date().toISOString(),
        lastLogin: null,
        watchedLectures: []
    };
    users.push(newUser);
    saveUsers(users);

    showMessage('createUserMessage', `✅ تم إنشاء الحساب بنجاح! ${data.paid ? '(مفعل الدفع)' : '(غير مفعل الدفع)'}`, 'success');
    document.getElementById('createUserForm').reset();
}

// ===== SEED ADMIN ACCOUNTS =====
function seedAdminAccounts() {
    const users = getUsers();

    ADMIN_EMAILS.forEach(email => {
        if (!users.find(u => u.nationalId === email)) {
            users.push({
                id: generateId(),
                firstName: 'أدمن',
                secondName: 'المنصة',
                thirdName: '',
                fullName: `أدمن ${email.split('@')[0]}`,
                studentNumber: 'ADMIN',
                parentNumber: '0000000000',
                nationalId: email,
                grade: 'كل الصفوف',
                password: ADMIN_PASSWORD,
                paid: true,
                isAdmin: true,
                createdAt: new Date().toISOString(),
                lastLogin: null,
                watchedLectures: []
            });
        }
    });

    saveUsers(users);
}

seedAdminAccounts();