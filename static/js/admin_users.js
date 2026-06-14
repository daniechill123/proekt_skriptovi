document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('role');

    if (!token || role !== 'Админ') {
        window.location.href = '/';
        return;
    }

    let allUsers = [];

    async function loadUsers() {
        try {
            const response = await fetch('/users', {
                headers: { 'Authorization': token }
            });
            allUsers = await response.json();
            renderTable(allUsers);
        } catch (error) {
            console.error("Грешка при зареждане:", error);
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

            const editBtn = tr.querySelector('.edit-btn');
            const deleteBtn = tr.querySelector('.delete-btn');

            editBtn.addEventListener('click', () => {
                if (typeof window.openEditModal === 'function') {
                    window.openEditModal(user.id, user.name, user.email);
                } else {
                    const modal = document.getElementById('edit-modal');
                    if (modal) {
                        document.getElementById('edit-user-id').value = user.id;
                        document.getElementById('edit-user-name').value = user.name;
                        document.getElementById('edit-user-email').value = user.email;
                        document.getElementById('edit-user-password').value = '';
                        modal.style.display = 'flex';
                    }
                }
            });

            deleteBtn.addEventListener('click', () => {
                window.deleteUser(user.id);
            });

            tbody.appendChild(tr);
        });
    }

    const searchInput = document.querySelector('input[type="text"]:not([id*="user"])') || document.querySelector('.main-content input');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            const searchTerm = e.target.value.toLowerCase();
            const filteredUsers = allUsers.filter(user => 
                user.name.toLowerCase().includes(searchTerm) || 
                user.email.toLowerCase().includes(searchTerm)
            );
            renderTable(filteredUsers);
        });
    }

    window.deleteUser = async (id) => {
        if (!confirm("Сигурни ли сте, че искате да изтриете този потребител?")) return;
        
        try {
            const response = await fetch(`/users/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': token }
            });
            if (response.ok) {
                loadUsers();
            } else {
                alert("Грешка при изтриването!");
            }
        } catch (error) {
            console.error(error);
        }
    };

    window.editUser = async (id) => {
        const user = allUsers.find(u => u.id === id);
        if (!user) return;

        const newName = prompt("Въведете ново име на потребителя:", user.name);
        if (newName === null || newName.trim() === "") return;

        try {
            const response = await fetch(`/users/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': token
                },
                body: JSON.stringify({ name: newName })
            });

            if (response.ok) {
                loadUsers();
            } else {
                alert("Неуспешно редактиране.");
            }
        } catch (error) {
            console.error(error);
        }
    };

    window.loadUsers = loadUsers;

    const addProfileBtn = document.querySelector('button, .btn, a');

    loadUsers();
});