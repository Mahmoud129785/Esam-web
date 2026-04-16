// script.js - منصة المستر عصام شويقة

// ========== بيانات الأدمن ==========
const ADMIN_EMAILS = ['admin@shweiqa.com', 'admin1@shweiqa.com', 'admin2@shweiqa.com'];

// ========== تهيئة localStorage ==========
function initializeData() {
    if (!localStorage.getItem('users')) {
        localStorage.setItem('users', JSON.stringify([]));
    }
    if (!localStorage.getItem('lessons')) {
        localStorage.setItem('lessons', JSON.stringify([]));
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

        // التحقق من المستخدمين العاديين
        const users = JSON.parse(localStorage.getItem('users')) || [];
        const user = users.find(u => u.email === email && u.password === password);

        if (user) {
            if (user.status === 'approved') {
                localStorage.setItem('currentUser', JSON.stringify({ ...user, isAdmin: false }));
                window.location.href = 'dashboard.html';
            } else {
                alert('❌ حسابك لم يتم تفعيله بعد. يرجى الانتظار حتى توافق الإدارة.');
            }
        } else {
            alert('❌ البريد الإلكتروني أو كلمة المرور غير صحيحة');
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
        
        // التحقق من عدم تكرار البريد
        if (users.some(u => u.email === email)) {
            alert('❌ هذا البريد مسجل بالفعل');
            return;
        }

        // التحقق من عدم تكرار رقم الطالب
        if (users.some(u => u.studentId === studentId)) {
            alert('❌ رقم الطالب مسجل بالفعل');
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
            status: 'pending'  // pending أو approved
        };

        users.push(newUser);
        localStorage.setItem('users', JSON.stringify(users));

        alert('✅ تم إنشاء حسابك بنجاح! سيتم مراجعته من قبل الإدارة وسيتم تفعيله قريباً.');
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

    if (currentUser.status !== 'approved') {
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
        if (lessons.length === 0) {
            grid.innerHTML = '<p style="text-align:center; grid-column:span 3;">⚠️ لا توجد محاضرات حالياً، سيتم إضافتها قريباً</p>';
        } else {
            grid.innerHTML = lessons.map(lesson => `
                <div class="lesson-card" onclick="playVideo('${lesson.url}')">
                    <i class="fas fa-video"></i>
                    <h3>${lesson.title}</h3>
                    <p>${lesson.description || 'محاضرة جديدة'}</p>
                </div>
            `).join('');
        }
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
    const tbody = document.getElementById('usersTable');
    if (tbody) {
        if (users.length === 0) {
            tbody.innerHTML = '<tr><td colspan="8" style="text-align:center">لا يوجد مستخدمين مسجلين</td></tr>';
            return;
        }
        tbody.innerHTML = users.map((user, index) => {
            const isApproved = user.status === 'approved';
            return `
                <tr>
                    <td>${index + 1}</td>
                    <td>${user.fullName}</td>
                    <td>${user.email}</td>
                    <td>${user.studentId}</td>
                    <td>${user.parentPhone}</td>
                    <td>${user.grade}</td>
                    <td class="${isApproved ? 'status-approved' : 'status-pending'}">${isApproved ? '✅ مفعل' : '⏳ قيد المراجعة'}</td>
                    <td>
                        ${!isApproved ? `<button onclick="approveUser('${user.email}')" class="approve-btn">✅ تفعيل</button>` : ''}
                        <button onclick="deleteUser('${user.email}')" class="delete-btn">🗑️ حذف</button>
                    </td>
                </tr>
            `;
        }).join('');
    }
}

function filterUsers(search) {
    const users = JSON.parse(localStorage.getItem('users')) || [];
    const filtered = users.filter(u => u.fullName.includes(search) || u.email.includes(search));
    const tbody = document.getElementById('usersTable');
    if (tbody) {
        if (filtered.length === 0) {
            tbody.innerHTML = '<tr><td colspan="8" style="text-align:center">لا توجد نتائج</td></tr>';
            return;
        }
        tbody.innerHTML = filtered.map((user, index) => {
            const isApproved = user.status === 'approved';
            return `
                <tr>
                    <td>${index + 1}</td>
                    <td>${user.fullName}</td>
                    <td>${user.email}</td>
                    <td>${user.studentId}</td>
                    <td>${user.parentPhone}</td>
                    <td>${user.grade}</td>
                    <td class="${isApproved ? 'status-approved' : 'status-pending'}">${isApproved ? '✅ مفعل' : '⏳ قيد المراجعة'}</td>
                    <td>
                        ${!isApproved ? `<button onclick="approveUser('${user.email}')" class="approve-btn">✅ تفعيل</button>` : ''}
                        <button onclick="deleteUser('${user.email}')" class="delete-btn">🗑️ حذف</button>
                    </td>
                </tr>
            `;
        }).join('');
    }
}

function approveUser(email) {
    const users = JSON.parse(localStorage.getItem('users')) || [];
    const userIndex = users.findIndex(u => u.email === email);
    
    if (userIndex !== -1 && users[userIndex].status !== 'approved') {
        users[userIndex].status = 'approved';
        localStorage.setItem('users', JSON.stringify(users));
        alert(`✅ تم تفعيل حساب ${users[userIndex].fullName}`);
        loadUsersTable();
    } else {
        alert('⚠️ هذا المستخدم مفعل بالفعل أو غير موجود');
    }
}

function deleteUser(email) {
    if (confirm('⚠️ هل أنت متأكد من حذف هذا المستخدم؟')) {
        let users = JSON.parse(localStorage.getItem('users')) || [];
        users = users.filter(u => u.email !== email);
        localStorage.setItem('users', JSON.stringify(users));
        alert('✅ تم حذف المستخدم');
        loadUsersTable();
    }
}

function loadAdminLessons() {
    const lessons = JSON.parse(localStorage.getItem('lessons')) || [];
    const container = document.getElementById('adminLessonsList');
    if (container) {
        if (lessons.length === 0) {
            container.innerHTML = '<p style="text-align:center">لا توجد محاضرات مضافة</p>';
            return;
        }
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
