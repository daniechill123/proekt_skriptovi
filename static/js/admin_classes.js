document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('role');

    if (!token || role !== 'Админ') {
        window.location.href = '/';
        return;
    }

    let allClasses = [];
    const editModal = document.getElementById('edit-modal');
    const addModal = document.getElementById('add-modal');

    async function loadClasses() {
        try {
            const response = await fetch('/classes', { headers: { 'Authorization': token } });
            allClasses = await response.json();
            renderTable(allClasses);
        } catch (error) {
            console.error(error);
        }
    }

    function renderTable(classesList) {
        const tbody = document.getElementById('classes-table-body');
        if (!tbody) return;
        tbody.innerHTML = '';

        classesList.forEach(cls => {
            const tr = document.createElement('tr');
            const grade = cls.grade !== undefined ? cls.grade : cls.class_number;
            const section = cls.section !== undefined ? cls.section : cls.letter;
            const count = cls.students_count !== undefined ? cls.students_count : (cls.student_count !== undefined ? cls.student_count : 0);

            tr.innerHTML = `
                <td>${grade} клас</td>
                <td>${section}</td>
                <td>${count}</td>
                <td>
                    <span class="edit-btn" style="cursor:pointer; margin-right:1rem; font-size:1.2rem;">✏️</span>
                    <span class="delete-btn" style="cursor:pointer; font-size:1.2rem;">🗑️</span>
                </td>
            `;

            tr.querySelector('.edit-btn').addEventListener('click', () => {
                document.getElementById('edit-class-id').value = cls.id;
                document.getElementById('edit-class-grade').value = grade;
                document.getElementById('edit-class-section').value = section;
                editModal.style.display = 'flex';
            });

            tr.querySelector('.delete-btn').addEventListener('click', () => {
                window.deleteClass(cls.id);
            });

            tbody.appendChild(tr);
        });
    }

    const searchInput = document.getElementById('search-input');
    if (searchInput) {
        searchInput.addEventListener('change', (e) => {
            const val = e.target.value;
            if (!val) {
                renderTable(allClasses);
            } else {
                const filtered = allClasses.filter(c => {
                    const grade = c.grade !== undefined ? c.grade : c.class_number;
                    return String(grade) === String(val);
                });
                renderTable(filtered);
            }
        });
    }

    document.getElementById('close-modal-btn')?.addEventListener('click', () => editModal.style.display = 'none');
    document.getElementById('open-add-modal-btn')?.addEventListener('click', () => addModal.style.display = 'flex');
    document.getElementById('close-add-modal-btn')?.addEventListener('click', () => addModal.style.display = 'none');

    window.deleteClass = async (id) => {
        if (!confirm("Сигурни ли сте, че искате да изтриете този клас?")) return;
        try {
            const res = await fetch(`/classes/${id}`, { method: 'DELETE', headers: { 'Authorization': token } });
            if (res.ok) loadClasses();
            else alert("Грешка при изтриването!");
        } catch (error) { console.error(error); }
    };

    document.getElementById('save-modal-btn')?.addEventListener('click', async () => {
            const id = document.getElementById('edit-class-id').value;
            const grade = document.getElementById('edit-class-grade').value;
            const section = document.getElementById('edit-class-section').value;

            const payload = {
                grade: parseInt(grade),
                letter: section 
            };

            try {
                const res = await fetch(`/classes/${id}`, {
                    method: 'PATCH',
                    headers: { 
                        'Content-Type': 'application/json', 
                        'Authorization': token 
                    },
                    body: JSON.stringify(payload)
                });
                if (res.ok) { 
                    editModal.style.display = 'none'; 
                    loadClasses(); 
                } else { 
                    const err = await res.json(); 
                    alert(err.error || "Грешка при редактиране."); 
                }
            } catch (e) { console.error(e); }
        });

    document.getElementById('add-class-form')?.addEventListener('submit', async (e) => {
            e.preventDefault();
            const grade = document.getElementById('add-class-grade').value;
            const section = document.getElementById('add-class-section').value;

            const payload = {
                grade: parseInt(grade),
                letter: section
            };

            try {
                const res = await fetch('/classes', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Authorization': token },
                    body: JSON.stringify(payload)
                });
                if (res.ok) {
                    document.getElementById('add-class-form').reset();
                    addModal.style.display = 'none';
                    loadClasses();
                } else { const err = await res.json(); alert(err.error || "Грешка при добавяне."); }
            } catch (error) { console.error(error); }
        });

    loadClasses();
});