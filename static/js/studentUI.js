document.addEventListener('DOMContentLoaded', async () => {
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('role');

    if (!token || role !== 'Ученик') {
        window.location.href = '/';
        return;
    }

    document.getElementById('logout-button')?.addEventListener('click', () => {
        localStorage.clear();
        window.location.href = '/';
    });

    const tbody = document.getElementById('grades-table-body');

    function createGradesContainer(gradesArray) {
        const container = document.createElement('div');
        container.className = 'grades-container';
        if (!gradesArray || gradesArray.length === 0) {
            container.innerHTML = ``;
        } else {
            gradesArray.forEach(val => {
                const box = document.createElement('span');
                box.className = `grade-box grade-${val}`;
                box.textContent = val;
                container.appendChild(box);
            });
        }
        return container;
    }

    function createSingleGrade(val) {
        const td = document.createElement('td');
        td.style.textAlign = 'center';
        if (val && val !== "-") {
            const box = document.createElement('span');
            box.className = `grade-box grade-${val}`;
            box.textContent = val;
            box.style.margin = '0 auto';
            td.appendChild(box);
        } else {
            td.textContent = "-";
        }
        return td;
    }

    try {
        const response = await fetch('/student/grades', {
            method: 'GET',
            headers: { 'Authorization': token }
        });

        if (!response.ok) {
            tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; color:red;">Грешка при зареждане на данните.</td></tr>`;
            return;
        }

        const data = await response.json();
        tbody.innerHTML = '';

        if (data.length === 0) {
            tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;">Няма въведени предмети или оценки.</td></tr>`;
            return;
        }

        data.forEach(item => {
            const tr = document.createElement('tr');

            const infoTd = document.createElement('td');
            infoTd.innerHTML = `
                <div class="subject-info">${item.subject_name}</div>
                <div class="teacher-info">${item.teacher_name}</div>
            `;
            tr.appendChild(infoTd);

            const t1GradesTd = document.createElement('td');
            t1GradesTd.appendChild(createGradesContainer(item.term1_grades));
            tr.appendChild(t1GradesTd);

            tr.appendChild(createSingleGrade(item.term1_final));

            const t2GradesTd = document.createElement('td');
            t2GradesTd.appendChild(createGradesContainer(item.term2_grades));
            tr.appendChild(t2GradesTd);

            tr.appendChild(createSingleGrade(item.term2_final));

            tr.appendChild(createSingleGrade(item.annual_grade));

            tbody.appendChild(tr);
        });

    } catch (error) {
        console.error("Грешка:", error);
        tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; color:red;">Сървърна грешка. Връзката беше прекъсната.</td></tr>`;
    }
});