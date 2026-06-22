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
                await fetch('/logout', { method: 'POST', headers: { 'Authorization': token } });
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
            const response = await fetch('/classes', { method: 'GET', headers: { 'Authorization': token } });
            if (!response.ok) return;
            const classes = await response.json();
            
            classSidebarList.innerHTML = '';
            classes.forEach(cls => {
                const btn = document.createElement('button');
                btn.className = 'class-btn';
                btn.textContent = `${cls.grade} ${cls.letter} клас`;
                btn.addEventListener('click', () => {
                    document.querySelectorAll('.class-btn').forEach(b => b.classList.remove('active'));
                    btn.classList.add('active');
                    selectedClassId = cls.id;
                    currentClassTitle.textContent = `Клас: ${cls.grade} "${cls.letter}"`;
                    fetchAndRenderStudents();
                });
                classSidebarList.appendChild(btn);
            });
        } catch (error) { console.error("Грешка при зареждане на класове:", error); }
    }

    function createGradeSpan(grade) {
        if (!grade || grade.value === "-" || grade.value === null) {
            const empty = document.createElement('span');
            empty.className = 'no-grades';
            empty.textContent = '-';
            return empty;
        }
        const span = document.createElement('span');
        span.className = `grade-box grade-${grade.value}`;
        span.innerHTML = `${grade.value}<button class="delete-grade-badge" onclick="deleteGrade(${grade.id})">&times;</button>`;
        return span;
    }

    function createGradeButtonsGroup(studentId, term, type) {
        const container = document.createElement('div');
        container.className = 'grade-buttons-group';
        [2, 3, 4, 5, 6].forEach(num => {
            const btn = document.createElement('button');
            btn.className = `btn-add-grade grade-${num}`;
            btn.textContent = num;
            btn.type = "button"; 
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                addGrade(studentId, num, term, type);
            });
            container.appendChild(btn);
        });
        return container;
    }


   async function fetchAndRenderStudents() {
        if (!selectedClassId) return;
        try {
            tbody.innerHTML = `<tr><td colspan="9" style="text-align:center; padding:20px;">Зареждане на списъка...</td></tr>`;
            const response = await fetch(`/classes/${selectedClassId}/students`, {
                method: 'GET', headers: { 'Authorization': token }
            });
            if (!response.ok) throw new Error();
            const data = await response.json();

            tbody.innerHTML = '';
            if (data.length === 0) {
                tbody.innerHTML = `<tr><td colspan="9" style="text-align:center; padding:20px;">Няма намерени ученици в този клас.</td></tr>`;
                return;
            }

            data.forEach(student => {
                const tr = document.createElement('tr');

                const tdName = document.createElement('td');
                tdName.className = 'student-name-cell';
                tdName.textContent = student.name;
                tr.appendChild(tdName);

                const tdT1Current = document.createElement('td');
                const divT1 = document.createElement('div');
                divT1.className = 'grades-flex-container';
                if (student.term1_grades && student.term1_grades.length > 0) {
                    student.term1_grades.forEach(g => divT1.appendChild(createGradeSpan(g)));
                } else { 
                    divT1.appendChild(createGradeSpan(null)); 
                }
                tdT1Current.appendChild(divT1);
                tr.appendChild(tdT1Current);

                const tdT1Final = document.createElement('td');
                tdT1Final.style.textAlign = 'center';
                tdT1Final.appendChild(createGradeSpan(student.term1_final));
                tr.appendChild(tdT1Final);

                const tdT1Action = document.createElement('td');
                const divT1Act = document.createElement('div');
                divT1Act.className = 'action-cell-wrapper';
                
                const lblT1Curr = document.createElement('div');
                lblT1Curr.className = 'mini-label';
                lblT1Curr.textContent = 'Текуща:';
                divT1Act.appendChild(lblT1Curr);
                divT1Act.appendChild(createGradeButtonsGroup(student.id, 1, 'текуща'));

                const lblT1Fin = document.createElement('div');
                lblT1Fin.className = 'mini-label';
                lblT1Fin.textContent = 'Срочна:';
                divT1Act.appendChild(lblT1Fin);
                divT1Act.appendChild(createGradeButtonsGroup(student.id, 1, 'срочна'));
                
                tdT1Action.appendChild(divT1Act);
                tr.appendChild(tdT1Action);

                const tdT2Current = document.createElement('td');
                const divT2 = document.createElement('div');
                divT2.className = 'grades-flex-container';
                if (student.term2_grades && student.term2_grades.length > 0) {
                    student.term2_grades.forEach(g => divT2.appendChild(createGradeSpan(g)));
                } else { 
                    divT2.appendChild(createGradeSpan(null)); 
                }
                tdT2Current.appendChild(divT2);
                tr.appendChild(tdT2Current);

                const tdT2Final = document.createElement('td');
                tdT2Final.style.textAlign = 'center';
                tdT2Final.appendChild(createGradeSpan(student.term2_final));
                tr.appendChild(tdT2Final);

                const tdT2Action = document.createElement('td');
                const divT2Act = document.createElement('div');
                divT2Act.className = 'action-cell-wrapper';
                
                const lblT2Curr = document.createElement('div');
                lblT2Curr.className = 'mini-label';
                lblT2Curr.textContent = 'Текуща:';
                divT2Act.appendChild(lblT2Curr);
                divT2Act.appendChild(createGradeButtonsGroup(student.id, 2, 'текуща'));

                const lblT2Fin = document.createElement('div');
                lblT2Fin.className = 'mini-label';
                lblT2Fin.textContent = 'Срочна:';
                divT2Act.appendChild(lblT2Fin);
                divT2Act.appendChild(createGradeButtonsGroup(student.id, 2, 'срочна'));
                
                tdT2Action.appendChild(divT2Act);
                tr.appendChild(tdT2Action);

                const tdAnnual = document.createElement('td');
                tdAnnual.style.textAlign = 'center';
                tdAnnual.appendChild(createGradeSpan(student.annual_grade));
                tr.appendChild(tdAnnual);

                const tdAnnualAction = document.createElement('td');
                const divAnnAct = document.createElement('div');
                divAnnAct.className = 'action-cell-wrapper';
                
                const lblAnn = document.createElement('div');
                lblAnn.className = 'mini-label';
                lblAnn.textContent = 'Годишна:';
                divAnnAct.appendChild(lblAnn);
                divAnnAct.appendChild(createGradeButtonsGroup(student.id, 0, 'годишна'));
                
                tdAnnualAction.appendChild(divAnnAct);
                tr.appendChild(tdAnnualAction);

                tbody.appendChild(tr);
            });
        } catch (error) {
            tbody.innerHTML = `<tr><td colspan="9" style="text-align:center; color:red; padding:20px;">Възникна грешка при зареждане.</td></tr>`;
        }
    }

    async function addGrade(studentId, gradeValue, term, gradeType) {
        try {
            const response = await fetch('/grades', {
                method: 'POST',
                headers: { 
                    'Authorization': token, 
                    'Content-Type': 'application/json' 
                },
                body: JSON.stringify({ 
                    student_id: studentId, 
                    grade: gradeValue, 
                    term: term, 
                    type: gradeType 
                })
            });
            if (response.ok) {
                fetchAndRenderStudents();
            } else {
                const errData = await response.json();
                alert("Грешка от сървъра: " + (errData.error || "Неуспешно добавяне"));
            }
        } catch (error) { 
            console.error("Мрежова грешка:", error); 
        }
    }

    window.deleteGrade = async function(gradeId) {
        if (!confirm('Сигурни ли сте, че искате да изтриете тази оценка?')) return;
        try {
            const response = await fetch(`/grades/${gradeId}`, { 
                method: 'DELETE', 
                headers: { 'Authorization': token } 
            });
            if (response.ok) {
                fetchAndRenderStudents();
            } else {
                alert("Грешка при изтриване на оценката.");
            }
        } catch (error) { console.error(error); }
    };

    loadClasses();
});