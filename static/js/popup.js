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
                    el.innerHTML += `<option value="${c.id}">${c.grade || c.class_number}${c.letter || c.section} клас</option>`;
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
        console.error("Грешка при зареждане на падащите менюта:", e);
    }
}

window.openEditModal = function(id, currentName, currentEmail, currentRole, currentClassId, currentSubjectId) {
    const modal = document.getElementById('edit-modal');
    if (!modal) return;
    
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
    
    modal.style.display = 'flex';
};

document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('token');
    populateDropdowns(token);

    const editModal = document.getElementById('edit-modal');
    const addModal = document.getElementById('add-modal');
    const addRoleSelect = document.getElementById('add-user-role');

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

    document.getElementById('save-modal-btn')?.addEventListener('click', async () => {
        const id = document.getElementById('edit-user-id').value;
        const name = document.getElementById('edit-user-name').value;
        const email = document.getElementById('edit-user-email').value;
        const password = document.getElementById('edit-user-password').value;
        const classId = document.getElementById('edit-user-class')?.value;
        const subjectId = document.getElementById('edit-user-subject')?.value;

        const updateData = { 
            name, 
            email,
            class_id: classId ? parseInt(classId) : null,
            subject_id: subjectId ? parseInt(subjectId) : null
        };
        if (password && password.trim() !== '') updateData.password = password.trim();

        try {
            const response = await fetch(`/users/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'Authorization': token },
                body: JSON.stringify(updateData)
            });
            if (response.ok) {
                editModal.style.display = 'none';
                window.loadUsers ? window.loadUsers() : window.location.reload();
            } else {
                const err = await response.json(); alert(err.error || "Грешка.");
            }
        } catch (error) { console.error(error); }
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
            const response = await fetch('/users', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': token },
                body: JSON.stringify(payload)
            });
            if (response.ok) {
                document.getElementById('add-user-form').reset();
                addModal.style.display = 'none';
                window.loadUsers ? window.loadUsers() : window.location.reload();
            } else {
                const err = await response.json(); alert(err.error || "Грешка.");
            }
        } catch (error) { console.error(error); }
    });
});