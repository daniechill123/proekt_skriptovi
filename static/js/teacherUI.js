document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('role');

    if (!token || role !== 'Учител') {
        window.location.href = '/';
        return;
    }

    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', async () => {
            try {
                await fetch('/logout', {
                    method: 'POST',
                    headers: { 'Authorization': token }
                });
            } catch (err) {}
            localStorage.clear();
            window.location.href = '/';
        });
    }

    const tbody = document.getElementById('teacher-table-body');
    const currentClassTitle = document.getElementById('current-class-title');
    const classSidebarList = document.getElementById('class-sidebar-list');
    let selectedClassId = null;

    async function loadClasses() {
        try {
            const response = await fetch('/teacher/classes', {
                method: 'GET',
                headers: { 'Authorization': token }
            });
            if (!response.ok) return;
            
            const classes = await response.json();
            if (!Array.isArray(classes)) return;
            
            classSidebarList.innerHTML = '';
            
            classes.forEach(cls => {
                const btn = document.createElement('button');
                btn.className = 'class-sidebar-btn';
                btn.textContent = cls.name;
                btn.addEventListener('click', () => {
                    document.querySelectorAll('.class-sidebar-btn').forEach(b => b.classList.remove('active'));
                    btn.classList.add('active');
                    selectedClassId = cls.id;
                    if (currentClassTitle) {
                        currentClassTitle.textContent = cls.name;
                    }
                    fetchAndRenderStudents();
                });
                classSidebarList.appendChild(btn);
            });
        } catch (error) {
            console.error(error);
        }
    }

    function createGradeButtons(studentId, term) {
        const btnWrapper = document.createElement('div');
        btnWrapper.className = 'circle-buttons-group';

        const gradeConfig = [
            { val: 6, class: 'g-6' },
            { val: 5, class: 'g-5' },
            { val: 4, class: 'g-4' },
            { val: 3, class: 'g-3' },
            { val: 2, class: 'g-2' }
        ];

        gradeConfig.forEach(cfg => {
            const gradeBtn = document.createElement('button');
            gradeBtn.className = `circle-grade-btn ${cfg.class}`;
            gradeBtn.textContent = cfg.val;
            gradeBtn.addEventListener('click', () => addGrade(studentId, cfg.val, term));
            btnWrapper.appendChild(gradeBtn);
        });

        return btnWrapper;
    }

    async function fetchAndRenderStudents() {
        if (!selectedClassId) return;

        try {
            tbody.innerHTML = `<tr><td colspan="5" style="text-align:center;">Зареждане...</td></tr>`;

            const response = await fetch(`/teacher/students?class_id=${selectedClassId}`, {
                method: 'GET',
                headers: { 'Authorization': token }
            });

            if (!response.ok) {
                let errorMsg = "Грешка при сървъра.";
                try {
                    const errData = await response.json();
                    if (errData.error === "No subject assigned") {
                        errorMsg = "На този учител няма назначен предмет! Моля, назначете му предмет от Админ панела.";
                    } else if (errData.error) {
                        errorMsg = errData.error;
                    }
                } catch (e) {}
                
                tbody.innerHTML = `<tr><td colspan="5" style="text-align:center; color:red; padding: 20px;">${errorMsg}</td></tr>`;
                return;
            }

            const students = await response.json();
            tbody.innerHTML = '';

            if (!Array.isArray(students) || students.length === 0) {
                tbody.innerHTML = `<tr><td colspan="5" style="text-align:center; padding: 20px;">Няма ученици в този клас.</td></tr>`;
                return;
            }

            students.forEach(student => {
                const tr = document.createElement('tr');

                const nameTd = document.createElement('td');
                nameTd.className = 'cell-student-name';
                nameTd.textContent = student.name || '';
                tr.appendChild(nameTd);

                const t1Grades = student.grades_term1 || [];
                const t1GradesTd = document.createElement('td');
                t1GradesTd.className = 'cell-grades';
                t1GradesTd.innerHTML = `
                    <div class="grade-label">Текущи оценки:</div>
                    <div class="grade-values-list">${t1Grades.length > 0 ? t1Grades.join(', ') : '-'}</div>
                `;
                tr.appendChild(t1GradesTd);

                const t1ActionTd = document.createElement('td');
                t1ActionTd.className = 'cell-actions';
                t1ActionTd.innerHTML = `<div class="action-label">Нова оценка:</div>`;
                t1ActionTd.appendChild(createGradeButtons(student.id, 1));
                tr.appendChild(t1ActionTd);

                const t2Grades = student.grades_term2 || [];
                const t2GradesTd = document.createElement('td');
                t2GradesTd.className = 'cell-grades';
                t2GradesTd.innerHTML = `
                    <div class="grade-label">Текущи оценки:</div>
                    <div class="grade-values-list">${t2Grades.length > 0 ? t2Grades.join(', ') : '-'}</div>
                `;
                tr.appendChild(t2GradesTd);

                const t2ActionTd = document.createElement('td');
                t2ActionTd.className = 'cell-actions';
                t2ActionTd.innerHTML = `<div class="action-label">Нова оценка:</div>`;
                t2ActionTd.appendChild(createGradeButtons(student.id, 2));
                tr.appendChild(t2ActionTd);

                tbody.appendChild(tr);
            });

        } catch (error) {
            tbody.innerHTML = `<tr><td colspan="5" style="text-align:center; color:red; padding: 20px;">Мрежова грешка при връзка със сървъра.</td></tr>`;
        }
    }

    async function addGrade(studentId, gradeValue, term) {
        try {
            const response = await fetch('/teacher/grades/add', {
                method: 'POST',
                headers: {
                    'Authorization': token,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    student_id: studentId,
                    grade: gradeValue,
                    term: term
                })
            });

            if (response.ok) {
                fetchAndRenderStudents();
            } else {
                alert("Неуспешно добавяне на оценка.");
            }
        } catch (error) {
            alert("Грешка при връзката със сървъра.");
        }
    }

    loadClasses();
});