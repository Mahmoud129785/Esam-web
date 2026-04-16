// ===== إعدادات النظام =====
const ADMIN_EMAILS = ['admin@platform.com', 'master@platform.com', 'manager@platform.com'];
const ADMIN_PASSWORD = 'Admin@123';
const WHATSAPP_NUMBER = '201064519768';

// ===== إدارة البيانات =====
function getUsers() { return JSON.parse(localStorage.getItem('platform_users') || '[]'); }
function saveUsers(users) { localStorage.setItem('platform_users', JSON.stringify(users)); }
function getLectures() { return JSON.parse(localStorage.getItem('platform_lectures') || '[]'); }
function saveLectures(lectures) { localStorage.setItem('platform_lectures', JSON.stringify(lectures)); }
function getCurrentUser() { return JSON.parse(sessionStorage.getItem('current_user') || 'null'); }
function setCurrentUser(user) { sessionStorage.setItem('current_user', JSON.stringify(user)); }
function isAdmin(email) { return ADMIN_EMAILS.includes(email); }

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
        setTimeout(() => el.className = 'message', 4000);
    }
}

function generateId() { return Date.now().toString(36) + Math.random().toString(36).substr(2); }
function formatDate(dateStr) {
    return new Date(dateStr).toLocaleDateString('ar-EG', { year: 'numeric', month: 'short', day: 'numeric' });
}

// ===== التسجيل =====
function handleRegister(data) {
    if (data.password !== data.confirmPassword) return showMessage('registerMessage', 'كلمتا المرور غير متطابقتين', 'error');
    const users = getUsers();
    if (users.find(u => u.email === data.email)) return showMessage('registerMessage', 'هذا البريد الإلكتروني مسجل بالفعل', 'error');

    const newUser = {
        id: generateId(), email: data.email, firstName: data.firstName, secondName: data.secondName,
        thirdName: data.thirdName, fullName: `${data.firstName} ${data.secondName} ${data.thirdName}`,
        studentNumber: data.studentNumber, parentNumber: data.parentNumber, nationalId: data.nationalId,
        grade: data.grade, password: data.password, paid: false, isAdmin: false,
        createdAt: new Date().toISOString(), lastLogin: null, watchedLectures: []
    };
    users.push(newUser); saveUsers(users);
    showMessage('registerMessage', '✅ تم إنشاء الحساب بنجاح! جاري التحويل...', 'success');
    document.getElementById('registerForm').reset();
    setTimeout(() => window.location.href = 'index.html', 1500);
}

// ===== تسجيل الدخول (بالإيميل) =====
function handleLogin(email, password) {
    email = email.trim().toLowerCase();
    if (ADMIN_EMAILS.includes(email)) {
        if (password === ADMIN_PASSWORD) {
            sessionStorage.setItem('admin_session', JSON.stringify({ email, isAdmin: true, loginTime: new Date().toISOString() }));
            window.location.href = 'admin.html';
        } else {
            showMessage('loginMessage', 'كلمة المرور غير صحيحة', 'error');
        }
        return;
    }

    const users = getUsers();
    const user = users.find(u => u.email.toLowerCase() === email && u.password === password);
    if (!user) return showMessage('loginMessage', 'البريد الإلكتروني أو كلمة المرور غير صحيحة', 'error');

    user.lastLogin = new Date().toISOString(); saveUsers(users);
    setCurrentUser(user); window.location.href = 'dashboard.html';
}

function logout() { sessionStorage.removeItem('current_user'); sessionStorage.removeItem('admin_session'); window.location.href = 'index.html'; }

// ===== لوحة المستخدم =====
function initDashboard() {
    const user = getCurrentUser();
    if (!user) return window.location.href = 'index.html';

    const initials = user.firstName.charAt(0) + user.secondName.charAt(0);
    document.getElementById('userDisplayName').textContent = `مرحباً، ${user.firstName}`;
    document.getElementById('userAvatar').textContent = initials;
    document.getElementById('profileName').textContent = user.fullName;
    document.getElementById('profileGrade').textContent = user.grade;
    document.getElementById('profileAvatar').textContent = initials;
    document.getElementById('profileFullName').textContent = user.fullName;
    document.getElementById('profileStudentNum').textContent = user.studentNumber;
    document.getElementById('profileParentNum').textContent = user.parentNumber;
    document.getElementById('profileNationalId').textContent = user.nationalId;
    
    const ps = document.getElementById('profilePaymentStatus');
    ps.textContent = user.paid ? '✅ مفعل' : '❌ غير مفعل';
    ps.className = `status-badge ${user.paid ? 'paid' : 'unpaid'}`;

    const lectures = getLectures().filter(l => l.grade === user.grade || l.grade === 'كل الصفوف');    document.getElementById('lecturesCount').textContent = lectures.length;
    document.getElementById('watchedCount').textContent = (user.watchedLectures || []).length;
    document.getElementById('userGrade').textContent = user.grade;

    loadUserLectures(user);
}

function loadUserLectures(user) {
    const lectures = getLectures().filter(l => l.grade === user.grade || l.grade === 'كل الصفوف');
    const paymentRequired = document.getElementById('paymentRequired');
    const lecturesList = document.getElementById('lecturesList');

    if (!user.paid) { paymentRequired.style.display = 'block'; lecturesList.innerHTML = ''; return; }
    paymentRequired.style.display = 'none';

    if (lectures.length === 0) {
        lecturesList.innerHTML = `<div style="grid-column:1/-1;text-align:center;padding:40px;color:var(--text-muted);"><i class="fas fa-video" style="font-size:40px;margin-bottom:15px;display:block;"></i><p>لا توجد محاضرات متاحة حالياً</p></div>`;
        return;
    }

    lecturesList.innerHTML = lectures.map(l => `
        <div class="lecture-card" onclick="openLecture('${l.id}')">
            <div class="lecture-thumbnail"><i class="fas fa-play-circle"></i><div class="play-overlay"><i class="fas fa-play"></i></div></div>
            <div class="lecture-info">
                <span class="lecture-category">${l.category}</span>
                <h3>${l.title}</h3>
                <p><i class="fas fa-clock"></i> ${formatDate(l.createdAt)}</p>
            </div>
        </div>
    `).join('');
}

function openLecture(lectureId) {
    const lecture = getLectures().find(l => l.id === lectureId);
    if (!lecture) return;
    document.getElementById('modalLectureTitle').textContent = lecture.title;
    document.getElementById('modalLectureDesc').textContent = lecture.category;
    const video = document.getElementById('lectureVideo'); video.src = lecture.videoUrl;
    document.getElementById('lectureModal').classList.add('active');

    const user = getCurrentUser();
    if (user) {
        if (!user.watchedLectures) user.watchedLectures = [];
        if (!user.watchedLectures.includes(lectureId)) {
            user.watchedLectures.push(lectureId);
            const users = getUsers(); const idx = users.findIndex(u => u.id === user.id);
            if (idx !== -1) { users[idx] = user; saveUsers(users); setCurrentUser(user); }
        }
    }
}
function closeLectureModal() {
    document.getElementById('lectureModal').classList.remove('active');
    const video = document.getElementById('lectureVideo'); video.pause(); video.src = '';
}

// ===== لوحة الإدارة =====
function initAdmin() {
    const session = JSON.parse(sessionStorage.getItem('admin_session') || 'null');
    if (!session || !session.isAdmin) return window.location.href = 'index.html';
    updateAdminStats();
}

function updateAdminStats() {
    const users = getUsers(); const lectures = getLectures();
    document.getElementById('totalUsers').textContent = users.length;
    document.getElementById('paidUsers').textContent = users.filter(u => u.paid).length;
    document.getElementById('totalLectures').textContent = lectures.length;
    document.getElementById('pendingUsers').textContent = users.filter(u => !u.paid).length;
}

function handleLectureUpload(title, category, grade, videoUrl) {
    const lectures = getLectures();
    lectures.push({ id: generateId(), title, category, grade, videoUrl, createdAt: new Date().toISOString() });
    saveLectures(lectures);
    showMessage('uploadMessage', '✅ تم رفع المحاضرة بنجاح!', 'success');
    document.getElementById('uploadForm').reset();
}

function loadLecturesTable() {
    const lectures = getLectures();
    document.getElementById('lecturesTableBody').innerHTML = lectures.length === 0 ? 
        `<tr><td colspan="6" style="text-align:center;padding:30px;color:var(--text-muted);">لا توجد محاضرات</td></tr>` :
        lectures.map((l, i) => `
            <tr><td>${i+1}</td><td>${l.title}</td><td><span class="lecture-category">${l.category}</span></td><td>${l.grade}</td><td>${formatDate(l.createdAt)}</td>
            <td><div class="table-actions"><button class="btn-action btn-delete" onclick="deleteLecture('${l.id}')"><i class="fas fa-trash"></i> حذف</button></div></td></tr>
        `).join('');
}

function deleteLecture(id) {
    if (!confirm('حذف المحاضرة؟')) return;
    saveLectures(getLectures().filter(l => l.id !== id)); loadLecturesTable(); updateAdminStats(); showToast('تم الحذف', 'success');
}

function loadUsersTable() {
    const users = getUsers();
    document.getElementById('usersTableBody').innerHTML = users.length === 0 ?
        `<tr><td colspan="9" style="text-align:center;padding:30px;color:var(--text-muted);">لا يوجد مستخدمين</td></tr>` :
        users.map((u, i) => `
            <tr>                <td>${i+1}</td><td>${u.fullName}</td><td>${u.email}</td><td>${u.nationalId}</td><td>${u.studentNumber}</td><td>${u.parentNumber}</td><td>${u.grade}</td>
                <td><span class="status-badge ${u.paid ? 'paid' : 'unpaid'}">${u.paid ? '✅' : '❌'}</span></td>
                <td><div class="table-actions">
                    ${!u.paid ? `<button class="btn-action btn-activate" onclick="activateUser('${u.id}')">تفعيل</button>` : `<button class="btn-action" style="background:rgba(255,214,0,.15);color:var(--rgb-yellow);border:1px solid rgba(255,214,0,.3)" onclick="deactivateUser('${u.id}')">إلغاء</button>`}
                    <button class="btn-action btn-delete" onclick="deleteUser('${u.id}')">حذف</button>
                </div></td>
            </tr>
        `).join('');
}

function activateUser(id) { togglePayStatus(id, true); }
function deactivateUser(id) { togglePayStatus(id, false); }
function togglePayStatus(id, status) {
    const users = getUsers(); const user = users.find(u => u.id === id);
    if (user) { user.paid = status; saveUsers(users); loadUsersTable(); updateAdminStats(); showToast(`تم ${status ? 'تفعيل' : 'إلغاء'} حساب ${user.fullName}`, status ? 'success' : 'error'); }
}

function deleteUser(id) {
    if (!confirm('حذف المستخدم؟')) return;
    saveUsers(getUsers().filter(u => u.id !== id)); loadUsersTable(); updateAdminStats(); showToast('تم الحذف', 'success');
}

function handleAdminCreateUser(data) {
    const users = getUsers();
    if (users.find(u => u.email.toLowerCase() === data.email.toLowerCase())) return showMessage('createUserMessage', 'البريد الإلكتروني مسجل بالفعل', 'error');
    
    users.push({
        id: generateId(), email: data.email, firstName: data.firstName, secondName: data.secondName,
        thirdName: data.thirdName, fullName: `${data.firstName} ${data.secondName} ${data.thirdName}`,
        studentNumber: data.studentNumber, parentNumber: data.parentNumber, nationalId: data.nationalId,
        grade: data.grade, password: data.password, paid: data.paid || false, isAdmin: false,
        createdAt: new Date().toISOString(), lastLogin: null, watchedLectures: []
    });
    saveUsers(users);
    showMessage('createUserMessage', `✅ تم إنشاء الحساب بنجاح! ${data.paid ? '(مفعل)' : '(غير مفعل)'}`, 'success');
    document.getElementById('createUserForm').reset();
}

// تهيئة البيانات الأساسية
function initData() {
    if (!localStorage.getItem('platform_users')) localStorage.setItem('platform_users', JSON.stringify([]));
    if (!localStorage.getItem('platform_lectures')) localStorage.setItem('platform_lectures', JSON.stringify([]));
}
initData();
