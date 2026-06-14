document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('token');
    if (!token) { window.location.href = '/'; return; }

    async function loadClasses() {
        try {
            const response = await fetch('/classes', {
                headers: { 'Authorization': token }
            });
            const classes = await response.json();
            const tbody = document.getElementById('classes-table-body');
            if (!tbody) return;
            tbody.innerHTML = '';

            classes.forEach(c => {
                tbody.innerHTML += `
                    <tr>
                        <td>${c.id}</td>
                        <td>${c.grade} "${c.letter}"</td>
                        <td>${c.student_count} ученици</td>
                        <td>
                            <button onclick="deleteClass(${c.id})" class="btn-delete">Изтрий</button>
                        </td>
                    </tr>
                `;
            });
        } catch (error) {
            console.error(error);
        }
    }

    window.deleteClass = async (id) => {
        if (!confirm("Изтриването на класа ще премахне връзката на учениците с него! Желаете ли да продължите?")) return;
        const response = await fetch(`/classes/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': token }
        });
        if (response.ok) loadClasses();
    };

    const classForm = document.getElementById('add-class-form');
    if (classForm) {
        classForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const grade = parseInt(document.getElementById('class-grade').value);
            const letter = document.getElementById('class-letter').value;

            const response = await fetch('/classes', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': token
                },
                body: JSON.stringify({ grade, letter })
            });

            if (response.ok) {
                classForm.reset();
                loadClasses();
            }
        });
    }

    loadClasses();
});
