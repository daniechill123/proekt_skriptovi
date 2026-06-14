document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('token');
    if (!token) { window.location.href = '/'; return; }

    async function loadSubjects() {
        try {
            const response = await fetch('/subjects', {
                headers: { 'Authorization': token }
            });
            if (!response.ok) return;
            const subjects = await response.json();
            const tbody = document.getElementById('subjects-table-body');
            if (!tbody) return;
            tbody.innerHTML = '';

            subjects.forEach(s => {
                tbody.innerHTML += `
                    <tr>
                        <td>${s.id}</td>
                        <td>${s.name}</td>
                        <td>
                            <button onclick="deleteSubject(${s.id})">Изтрий</button>
                        </td>
                    </tr>
                `;
            });
        } catch (error) {
            console.log("Ендпоинтът /subjects все още не е активен в app.py");
        }
    }

    loadSubjects();
});