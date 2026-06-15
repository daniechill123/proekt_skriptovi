document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('role');

    if (!token || role !== 'Админ') {
        window.location.href = '/';
        return;
    }

    let allUsers = [];
    const editModal = document.getElementById('edit-modal');
    const addModal = document.getElementById('add-modal');
    const addRoleSelect = document.getElementById('add-user-role');

    async function populateDropdowns(token) {
        try {
            const resClasses = await fetch('/classes', { headers: { 'Authorization': token } });
            if (resClasses.ok) {
                const classes = await resClasses.json();
                const addCls = document.getElementById('add-user-class');
                const editCls = document.getElementById('edit-user-class');
                const buildOptions = (el) => {
                    if (!el) return;
                    el.innerHTML = '<option value="">-- Избери клас --</option>';
                    classes.forEach(c => {
                        const grade = c.grade !== undefined ? c.grade : c.class_number;
                        const letter = c.letter !== undefined ? c.letter : c.section;
                        el.innerHTML += `<option value="${c.id}">${grade}${letter} клас</option>`;
                    });
                };
                buildOptions(addCls); buildOptions(editCls);
            }

            const resSubjects = await fetch('/subjects', { headers: { 'Authorization': token } });
            if (resSubjects.ok) {
                const subjects = await resSubjects.json();
                const addSub = document.getElementById('add-user-subject');
                const editSub = document.getElementById('edit-user-subject');
                const buildOptions = (el) => {
                    if (!el) return;
                    el.innerHTML = '<option value="">-- Избери предмет --</option>';
                    subjects.forEach(s => {
                        el.innerHTML += `<option value="${s.id}">${s.name}</option>`;
                    });
                };
                buildOptions(addSub); buildOptions(editSub);
            }
        } catch (e) {
            console.error(e);
        }
    }

    async function loadUsers() {
        try {
            const response = await fetch('/users', { headers: { 'Authorization': token } });
            allUsers = await response.json();
            renderTable(allUsers);
        } catch (error) {
            console.error(error);
        }
    }

    function renderTable(usersList) {
        const tbody = document.getElementById('users-table-body');
        if (!tbody) return;
        tbody.innerHTML = '';

        usersList.forEach(user => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${user.name}</td>
                <td>${user.email}</td>
                <td>${user.role}</td>
                <td>${user.details || '-'}</td>
                <td>
                    <span class="edit-btn" style="cursor:pointer; margin-right:1rem; font-size:1.2rem;">✏️</span>
                    <span class="delete-btn" style="cursor:pointer; font-size:1.2rem;">🗑️</span>
                </td>
            `;

            tr.querySelector('.edit-btn').addEventListener('click', () => {
                window.openEditModal(user.id, user.name, user.email, user.role, user.class_id, user.subject_id);
            });

            tr.querySelector('.delete-btn').addEventListener('click', () => {
                window.deleteUser(user.id);
            });

            tbody.appendChild(tr);
        });
    }

    window.openEditModal = function(id, currentName, currentEmail, currentRole, currentClassId, currentSubjectId) {
        if (!editModal) return;
        
        document.getElementById('edit-user-id').value = id;
        document.getElementById('edit-user-name').value = currentName;
        document.getElementById('edit-user-email').value = currentEmail;
        document.getElementById('edit-user-password').value = '';
        
        const classGroup = document.getElementById('edit-class-group');
        const subjectGroup = document.getElementById('edit-subject-group');
        
        if (currentRole === 'Ученик') {
            if (classGroup) classGroup.style.display = 'block';
            if (subjectGroup) subjectGroup.style.display = 'none';
            if (document.getElementById('edit-user-class')) document.getElementById('edit-user-class').value = currentClassId || '';
        } else if (currentRole === 'Учител') {
            if (classGroup) classGroup.style.display = 'none';
            if (subjectGroup) subjectGroup.style.display = 'block';
            if (document.getElementById('edit-user-subject')) document.getElementById('edit-user-subject').value = currentSubjectId || '';
        } else {
            if (classGroup) classGroup.style.display = 'none';
            if (subjectGroup) subjectGroup.style.display = 'none';
        }
        
        editModal.style.display = 'flex';
    };

    if (addRoleSelect) {
        addRoleSelect.addEventListener('change', (e) => {
            const addClassGroup = document.getElementById('add-class-group');
            const addSubjectGroup = document.getElementById('add-subject-group');
            if (e.target.value === 'Ученик') {
                if (addClassGroup) addClassGroup.style.display = 'block';
                if (addSubjectGroup) addSubjectGroup.style.display = 'none';
            } else if (e.target.value === 'Учител') {
                if (addClassGroup) addClassGroup.style.display = 'none';
                if (addSubjectGroup) addSubjectGroup.style.display = 'block';
            } else {
                if (addClassGroup) addClassGroup.style.display = 'none';
                if (addSubjectGroup) addSubjectGroup.style.display = 'none';
            }
        });
    }

    document.getElementById('close-modal-btn')?.addEventListener('click', () => editModal.style.display = 'none');
    document.getElementById('open-add-modal-btn')?.addEventListener('click', () => addModal.style.display = 'flex');
    document.getElementById('close-add-modal-btn')?.addEventListener('click', () => addModal.style.display = 'none');

    const searchInput = document.getElementById('search-input');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            const searchTerm = e.target.value.toLowerCase();
            const filtered = allUsers.filter(u => 
                u.name.toLowerCase().includes(searchTerm) || u.email.toLowerCase().includes(searchTerm)
            );
            renderTable(filtered);
        });
    }

    window.deleteUser = async (id) => {
        if (!confirm("Сигурни ли сте, че искате да изтриете този потребител?")) return;
        try {
            const res = await fetch(`/users/${id}`, { method: 'DELETE', headers: { 'Authorization': token } });
            if (res.ok) loadUsers();
            else alert("Грешка при изтриването!");
        } catch (error) { console.error(error); }
    };

    document.getElementById('save-modal-btn')?.addEventListener('click', async () => {
        const id = document.getElementById('edit-user-id').value;
        const name = document.getElementById('edit-user-name').value;
        const email = document.getElementById('edit-user-email').value;
        const password = document.getElementById('edit-user-password').value;
        const classId = document.getElementById('edit-user-class')?.value;
        const subjectId = document.getElementById('edit-user-subject')?.value;

        const updateData = { 
            name, email,
            class_id: classId ? parseInt(classId) : null,
            subject_id: subjectId ? parseInt(subjectId) : null
        };
        if (password && password.trim() !== '') updateData.password = password.trim();

        try {
            const res = await fetch(`/users/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json', 'Authorization': token },
                body: JSON.stringify(updateData)
            });
            if (res.ok) { editModal.style.display = 'none'; loadUsers(); }
            else { const err = await res.json(); alert(err.error || "Грешка."); }
        } catch (e) { console.error(e); }
    });

    document.getElementById('add-user-form')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const name = document.getElementById('add-user-name').value;
        const email = document.getElementById('add-user-email').value;
        const password = document.getElementById('add-user-password').value;
        const role = document.getElementById('add-user-role').value;
        const classId = document.getElementById('add-user-class')?.value;
        const subjectId = document.getElementById('add-user-subject')?.value;

        const payload = {
            name, email, password, role,
            class_id: classId ? parseInt(classId) : null,
            subject_id: subjectId ? parseInt(subjectId) : null
        };

        try {
            const res = await fetch('/users', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': token },
                body: JSON.stringify(payload)
            });
            if (res.ok) {
                document.getElementById('add-user-form').reset();
                addModal.style.display = 'none';
                loadUsers();
            } else { const err = await res.json(); alert(err.error || "Грешка."); }
        } catch (error) { console.error(error); }
    });

    populateDropdowns(token);
    loadUsers();
});