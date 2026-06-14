window.openEditModal = function(id, currentName, currentEmail) {
    const modal = document.getElementById('edit-modal');
    if (!modal) return;
    document.getElementById('edit-user-id').value = id;
    document.getElementById('edit-user-name').value = currentName;
    document.getElementById('edit-user-email').value = currentEmail;
    document.getElementById('edit-user-password').value = '';
    modal.style.display = 'flex';
};

document.addEventListener('DOMContentLoaded', () => {
    const editModal = document.getElementById('edit-modal');
    const closeEditBtn = document.getElementById('close-modal-btn');
    const saveEditBtn = document.getElementById('save-modal-btn');
    
    const addModal = document.getElementById('add-modal');
    const openAddBtn = document.getElementById('open-add-modal-btn');
    const closeAddBtn = document.getElementById('close-add-modal-btn');
    const addForm = document.getElementById('add-user-form');
    
    const token = localStorage.getItem('token');

    if (closeEditBtn && editModal) {
        closeEditBtn.addEventListener('click', () => {
            editModal.style.display = 'none';
        });
    }

    if (openAddBtn && addModal) {
        openAddBtn.addEventListener('click', () => {
            addModal.style.display = 'flex';
        });
    }

    if (closeAddBtn && addModal) {
        closeAddBtn.addEventListener('click', () => {
            addModal.style.display = 'none';
        });
    }

    if (saveEditBtn && editModal) {
        saveEditBtn.addEventListener('click', async () => {
            const id = document.getElementById('edit-user-id').value;
            const name = document.getElementById('edit-user-name').value;
            const email = document.getElementById('edit-user-email').value;
            const password = document.getElementById('edit-user-password').value;

            const updateData = { name, email };
            if (password && password.trim() !== '') {
                updateData.password = password.trim();
            }

            try {
                const response = await fetch(`/users/${id}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': token
                    },
                    body: JSON.stringify(updateData)
                });

                if (response.ok) {
                    editModal.style.display = 'none';
                    if (typeof window.loadUsers === 'function') {
                        window.loadUsers();
                    } else {
                        window.location.reload();
                    }
                } else {
                    const err = await response.json();
                    alert(err.error || "Грешка при запис.");
                }
            } catch (error) {
                console.error(error);
            }
        });
    }

    if (addForm && addModal) {
        addForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const name = document.getElementById('add-user-name').value;
            const email = document.getElementById('add-user-email').value;
            const password = document.getElementById('add-user-password').value;
            const role = document.getElementById('add-user-role').value;

            try {
                const response = await fetch('/users', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': token
                    },
                    body: JSON.stringify({ name, email, password, role })
                });

                if (response.ok) {
                    addForm.reset();
                    addModal.style.display = 'none';
                    if (typeof window.loadUsers === 'function') {
                        window.loadUsers();
                    } else {
                        window.location.reload();
                    }
                } else {
                    const err = await response.json();
                    alert(err.error || "Грешка при създаване на профил.");
                }
            } catch (error) {
                console.error(error);
            }
        });
    }
});