document.addEventListener('DOMContentLoaded', async () => {
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('role');

    if (!token || role !== 'Ученик') {
        alert("ГРЕШКА: Няма валиден токен или не сте логнат като Ученик!");
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
        if (gradesArray && gradesArray.length > 0) {
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

    async function fetchAndRenderGrades() {
        try {
            const response = await fetch('/grades', {
                method: 'GET',
                headers: { 'Authorization': token }
            });

            if (!response.ok) return;

            const data = await response.json();
            tbody.innerHTML = '';

            if (!Array.isArray(data) || data.length === 0) {
                tbody.innerHTML = `
                    <tr>
                        <td colspan="6" style="text-align:center; padding: 25px; color: #555;">
                            Няма въведени оценки или предмети.
                        </td>
                    </tr>`;
                return;
            }

            data.forEach(item => {
                if (!item.subject_name) return;

                const tr = document.createElement('tr');

                const infoTd = document.createElement('td');
                infoTd.innerHTML = `
                    <div class="subject-info">${item.subject_name}</div>
                    <div class="teacher-info">${item.teacher_name || 'Няма назначен учител'}</div>
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
            tbody.innerHTML = `
                <tr>
                    <td colspan="6" style="text-align:center; padding: 20px; color: #721c24;">
                        Грешка при зареждане на данните.
                    </td>
                </tr>`;
        }
    }

    await fetchAndRenderGrades();
});