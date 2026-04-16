// script.js - منصة المستر عصام شويقة

// ========== بيانات الأدمن ==========
const ADMIN_EMAILS = [
    'admin@shweiqa.com',
    'admin1@shweiqa.com',
    'admin2@shweiqa.com'
];

// ========== تهيئة localStorage ==========
function initializeData() {
    if (!localStorage.getItem('users')) {
        localStorage.setItem('users', JSON.stringify([]));
    }
    if (!localStorage.getItem('lessons')) {
        localStorage.setItem('lessons', JSON.stringify([]));
    }
    if (!localStorage.getItem('pendingUsers')) {
        localStorage.setItem('pendingUsers', JSON.stringify([]));
    }
    if (!localStorage.getItem('approvedUsers')) {
        localStorage.setItem('approvedUsers', JSON.stringify([]));
    }
}

initializeData();

// ========== تسجيل الدخول ==========
if (document.getElementById('loginForm')) {
    document.getElementById('loginForm').addEventListener('submit', (e) => {
        e.preventDefault();
        const email = document.getElementById('loginEmail').value;
        const password = document.getElementById('loginPassword').value;

        // التحقق من الأدمن
        if (ADMIN_EMAILS.includes(email) && password === 'admin123') {
            localStorage.setItem('currentUser', JSON.stringify({ email, isAdmin: true, name: 'أدمن' }));
            window.location.href = 'admin.html';
            return;
        }

        // التحقق من المستخدمين المapproved
        const approvedUsers = JSON.parse(localStorage.getItem('approvedUsers')) || [];
        const user = approvedUsers.find(u => u.email === email && u.password === password);

        if (user) {
            localStorage.setItem('currentUser', JSON.stringify({ ...user, isAdmin: false, approved: true }));
            window.location.href = 'dashboard.html';
        } else {
            alert('❌ البريد الإلكتروني أو كلمة المرور غير صحيحة، أو حسابك لم يتم تفعيله بعد');
        }
    });
}

// ========== إنشاء حساب ==========
if (document.getElementById('signupForm')) {
    document.getElementById('signupForm').addEventListener('submit', (e) => {
        e.preventDefault();

        const firstName = document.getElementById('firstName').value;
        const secondName = document.getElementById('secondName').value;
        const thirdName = document.getElementById('thirdName').value;
        const studentId = document.getElementById('studentId').value;
        const parentPhone = document.getElementById('parentPhone').value;
        const nationalId = document.getElementById('nationalId').value;
        const email = document.getElementById('signupEmail').value;
        const grade = document.getElementById('grade').value;
        const password = document.getElementById('signupPassword').value;
        const confirm = document.getElementById('confirmPassword').value;

        if (password !== confirm) {
            alert('❌ كلمة المرور غير متطابقة');
            return;
        }

        const fullName = `${firstName} ${secondName} ${thirdName}`;

        const users = JSON.parse(localStorage.getItem('users')) || [];
        if (users.some(u => u.email === email)) {
            alert('❌ هذا البريد مسجل بالفعل');
            return;
        }

        const newUser = {
            id: Date.now(),
            fullName,
            firstName,
            secondName,
            thirdName,
            studentId,
            parentPhone,
            nationalId,
            email,
            grade,
            password,
            createdAt: new Date().toISOString(),
            status: 'pending'
        };

        users.push(newUser);
        localStorage.setItem('users', JSON.stringify(users));

        const pendingUsers = JSON.parse(localStorage.getItem('pendingUsers')) || [];
        pendingUsers.push(newUser);
        localStorage.setItem('pendingUsers', JSON.stringify(pendingUsers));

        alert('✅ تم إنشاء حسابك بنجاح! سيتم مراجعته من قبل الإدارة وسيتم إعلامك عند التفعيل.');
        window.location.href = 'index.html';
    });
}

// ========== عرض بيانات المستخدم في Dashboard ==========
if (window.location.pathname.includes('dashboard.html')) {
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    if (!currentUser) {
        window.location.href = 'index.html';
    }

    document.getElementById('userNameDisplay').innerText = currentUser.fullName || currentUser.name;

    if (!currentUser.approved) {
        document.getElementById('pendingMessage').style.display = 'block';
        document.getElementById('courseContent').style.display = 'none';
    } else {
        document.getElementById('pendingMessage').style.display = 'none';
        document.getElementById('courseContent').style.display = 'block';
        loadLessonsForUser();
    }
}

function loadLessonsForUser() {
    const lessons = JSON.parse(localStorage.getItem('lessons')) || [];
    const grid = document.getElementById('lessonsGrid');
    if (grid) {
        grid.innerHTML = lessons.map(lesson => `
            <div class="lesson-card" onclick="playVideo('${lesson.url}')">
                <i class="fas fa-video"></i>
                <h3>${lesson.title}</h3>
                <p>${lesson.description || 'محاضرة جديدة'}</p>
            </div>
        `).join('');
    }
}

function playVideo(url) {
    window.open(url, '_blank');
}

// ========== لوحة الأدمن ==========
if (window.location.pathname.includes('admin.html')) {
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    if (!currentUser || !ADMIN_EMAILS.includes(currentUser.email)) {
        window.location.href = 'index.html';
    }

    loadUsersTable();
    loadPendingUsers();
    loadAdminLessons();

    // تبويبات
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
            btn.classList.add('active');
            document.getElementById(`${btn.dataset.tab}Tab`).classList.add('active');
        });
    });

    // بحث
    document.getElementById('searchUser')?.addEventListener('input', (e) => {
        filterUsers(e.target.value);
    });

    // إضافة محاضرة
    document.getElementById('addLessonBtn')?.addEventListener('click', () => {
        const title = document.getElementById('lessonTitle').value;
        const url = document.getElementById('lessonUrl').value;
        if (!title || !url) {
            alert('❌ الرجاء ملء جميع الحقول');
            return;
        }
        const lessons = JSON.parse(localStorage.getItem('lessons')) || [];
        lessons.push({ id: Date.now(), title, url, description: 'محاضرة جديدة' });
        localStorage.setItem('lessons', JSON.stringify(lessons));
        alert('✅ تم إضافة المحاضرة بنجاح');
        document.getElementById('lessonTitle').value = '';
        document.getElementById('lessonUrl').value = '';
        loadAdminLessons();
        loadLessonsForUser();
    });
}

function loadUsersTable() {
    const users = JSON.parse(localStorage.getItem('users')) || [];
    const approvedUsers = JSON.parse(localStorage.getItem('approvedUsers')) || [];
    const tbody = document.getElementById('usersTable');
    if (tbody) {
        tbody.innerHTML = users.map((user, index) => {
            const isApproved = approvedUsers.some(u => u.email === user.email);
            return `
                <tr>
                    <td>${index + 1}</td>
                    <td>${user.fullName}</td>
                    <td>${user.email}</td>
                    <td>${user.studentId}</td>
                    <td>${user.parentPhone}</td>
                    <td>${user.grade}</td>
                    <td class="${isApproved ? 'status-approved' : 'status-pending'}">${isApproved ? 'مفعل' : 'قيد المراجعة'}</td>
                    <td>${new Date(user.createdAt).toLocaleDateString()}</td>
                </tr>
            `;
        }).join('');
    }
}

function filterUsers(search) {
    const users = JSON.parse(localStorage.getItem('users')) || [];
    const approvedUsers = JSON.parse(localStorage.getItem('approvedUsers')) || [];
    const filtered = users.filter(u => u.fullName.includes(search) || u.email.includes(search));
    const tbody = document.getElementById('usersTable');
    if (tbody) {
        tbody.innerHTML = filtered.map((user, index) => {
            const isApproved = approvedUsers.some(u => u.email === user.email);
            return `
                <tr>
                    <td>${index + 1}</td>
                    <td>${user.fullName}</td>
                    <td>${user.email}</td>
                    <td>${user.studentId}</td>
                    <td>${user.parentPhone}</td>
                    <td>${user.grade}</td>
                    <td class="${isApproved ? 'status-approved' : 'status-pending'}">${isApproved ? 'مفعل' : 'قيد المراجعة'}</td>
                    <td>${new Date(user.createdAt).toLocaleDateString()}</td>
                </tr>
            `;
        }).join('');
    }
}

function loadPendingUsers() {
    const pendingUsers = JSON.parse(localStorage.getItem('pendingUsers')) || [];
    const container = document.getElementById('pendingUsersList');
    if (container) {
        if (pendingUsers.length === 0) {
            container.innerHTML = '<p style="text-align:center">لا توجد طلبات انتظار</p>';
            return;
        }
        container.innerHTML = pendingUsers.map(user => `
            <div class="glass-card" style="padding:20px; margin-bottom:15px;">
                <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap;">
                    <div>
                        <h4>${user.fullName}</h4>
                        <p>📧 ${user.email}</p>
                        <p>📱 ${user.parentPhone}</p>
                        <p>📚 ${user.grade}</p>
                    </div>
                    <div>
                        <button onclick="approveUser('${user.email}')" class="approve-btn">✅ تفعيل الحساب</button>
                        <button onclick="deleteUser('${user.email}')" class="delete-btn">🗑️ حذف</button>
                    </div>
                </div>
            </div>
        `).join('');
    }
}

function approveUser(email) {
    const users = JSON.parse(localStorage.getItem('users')) || [];
    const pendingUsers = JSON.parse(localStorage.getItem('pendingUsers')) || [];
    const approvedUsers = JSON.parse(localStorage.getItem('approvedUsers')) || [];

    const user = users.find(u => u.email === email);
    if (user && !approvedUsers.some(u => u.email === email)) {
        approvedUsers.push({ ...user, approved: true });
        localStorage.setItem('approvedUsers', JSON.stringify(approvedUsers));

        const newPending = pendingUsers.filter(u => u.email !== email);
        localStorage.setItem('pendingUsers', JSON.stringify(newPending));

        alert(`✅ تم تفعيل حساب ${user.fullName}`);
        loadPendingUsers();
        loadUsersTable();
    }
}

function deleteUser(email) {
    if (confirm('⚠️ هل أنت متأكد من حذف هذا المستخدم؟')) {
        let users = JSON.parse(localStorage.getItem('users')) || [];
        let pendingUsers = JSON.parse(localStorage.getItem('pendingUsers')) || [];
        let approvedUsers = JSON.parse(localStorage.getItem('approvedUsers')) || [];

        users = users.filter(u => u.email !== email);
        pendingUsers = pendingUsers.filter(u => u.email !== email);
        approvedUsers = approvedUsers.filter(u => u.email !== email);

        localStorage.setItem('users', JSON.stringify(users));
        localStorage.setItem('pendingUsers', JSON.stringify(pendingUsers));
        localStorage.setItem('approvedUsers', JSON.stringify(approvedUsers));

        alert('✅ تم حذف المستخدم');
        loadPendingUsers();
        loadUsersTable();
    }
}

function loadAdminLessons() {
    const lessons = JSON.parse(localStorage.getItem('lessons')) || [];
    const container = document.getElementById('adminLessonsList');
    if (container) {
        container.innerHTML = lessons.map(lesson => `
            <div class="lesson-item">
                <div class="lesson-item-info">
                    <h4>${lesson.title}</h4>
                    <p>${lesson.url}</p>
                </div>
                <div class="lesson-item-actions">
                    <button onclick="deleteLesson(${lesson.id})" class="delete-btn"><i class="fas fa-trash"></i> حذف</button>
                </div>
            </div>
        `).join('');
    }
}

function deleteLesson(id) {
    if (confirm('⚠️ هل أنت متأكد من حذف هذه المحاضرة؟')) {
        let lessons = JSON.parse(localStorage.getItem('lessons')) || [];
        lessons = lessons.filter(l => l.id !== id);
        localStorage.setItem('lessons', JSON.stringify(lessons));
        loadAdminLessons();
        loadLessonsForUser();
        alert('✅ تم حذف المحاضرة');
    }
}

function copyNumber() {
    navigator.clipboard.writeText('201064519768');
    alert('✅ تم نسخ الرقم');
}

function logout() {
    localStorage.removeItem('currentUser');
    window.location.href = 'index.html';
}