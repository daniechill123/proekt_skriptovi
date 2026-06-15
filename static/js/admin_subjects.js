document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('token');
    if (!token || localStorage.getItem('role') !== 'Админ') {
        window.location.href = '/';
        return;
    }

    let allTeachers = [];

    const addModal = document.getElementById('add-modal');
    const editModal = document.getElementById('edit-modal');

    document.getElementById('open-add-modal-btn').addEventListener('click', () => addModal.style.display = 'flex');
    document.getElementById('close-add-modal-btn').addEventListener('click', () => addModal.style.display = 'none');
    document.getElementById('close-edit-modal-btn').addEventListener('click', () => editModal.style.display = 'none');

    async function loadTeachers() {
        try {
            const res = await fetch('/users', { headers: { 'Authorization': token } });
            if (!res.ok) return;
            const users = await res.json();
            allTeachers = users.filter(u => u.role === 'Учител');
            
            const addSelect = document.getElementById('add-subject-teacher');
            const editSelect = document.getElementById('edit-subject-teacher');
            
            let options = '<option value="">Без преподавател</option>';
            allTeachers.forEach(t => {
                options += `<option value="${t.id}">${t.name}</option>`;
            });
            
            addSelect.innerHTML = options;
            editSelect.innerHTML = options;
        } catch (e) { console.error(e); }
    }

    async function loadSubjects() {
        try {
            const res = await fetch('/subjects', { headers: { 'Authorization': token } });
            const subjects = await res.json();
            const tbody = document.getElementById('subjects-table-body');
            tbody.innerHTML = '';

            subjects.forEach(sub => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td>${sub.name}</td>
                    <td>${sub.teacher_name}</td>
                    <td>
                        <span class="edit-btn" style="cursor:pointer; margin-right:15px; font-size:1.2rem;">✏️</span>
                        <span class="delete-btn" style="cursor:pointer; font-size:1.2rem;">🗑️</span>
                    </td>
                `;

                tr.querySelector('.edit-btn').addEventListener('click', () => {
                    document.getElementById('edit-subject-id').value = sub.id;
                    document.getElementById('edit-subject-name').value = sub.name;
                    document.getElementById('edit-subject-teacher').value = sub.teacher_id || '';
                    editModal.style.display = 'flex';
                });

                tr.querySelector('.delete-btn').addEventListener('click', async () => {
                    if(!confirm(`Сигурни ли сте, че искате да изтриете предмета "${sub.name}"?`)) return;
                    await fetch(`/subjects/${sub.id}`, { method: 'DELETE', headers: { 'Authorization': token } });
                    loadSubjects();
                });

                tbody.appendChild(tr);
            });
        } catch (e) { console.error(e); }
    }

    document.getElementById('add-subject-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const payload = {
            name: document.getElementById('add-subject-name').value,
            teacher_id: document.getElementById('add-subject-teacher').value || null
        };

        const res = await fetch('/subjects', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': token },
            body: JSON.stringify(payload)
        });

        if (res.ok) {
            addModal.style.display = 'none';
            document.getElementById('add-subject-form').reset();
            loadSubjects();
        }
    });

    document.getElementById('save-edit-btn').addEventListener('click', async () => {
        const id = document.getElementById('edit-subject-id').value;
        const payload = {
            name: document.getElementById('edit-subject-name').value,
            teacher_id: document.getElementById('edit-subject-teacher').value || null
        };

        const res = await fetch(`/subjects/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json', 'Authorization': token },
            body: JSON.stringify(payload)
        });

        if (res.ok) {
            editModal.style.display = 'none';
            loadSubjects();
        }
    });

    loadTeachers().then(loadSubjects);
});