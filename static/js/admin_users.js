document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('role');

    if (!token || role !== 'Админ') {
        window.location.href = '/';
        return;
    }

    async function loadUsers() {
        try {
            const response = await fetch('/users', {
                headers: { 'Authorization': token }
            });
            const users = await response.json();
            
            const tbody = document.getElementById('users-table-body');
            if (!tbody) return;
            tbody.innerHTML = '';

            users.forEach(user => {
                tbody.innerHTML += `
                    <tr>
                        <td>${user.id}</td>
                        <td>${user.name}</td>
                        <td>${user.email}</td>
                        <td>${user.role}</td>
                        <td>${user.details}</td>
                        <td>
                            <button onclick="deleteUser(${user.id})" class="btn-delete">Изтрий</button>
                        </td>
                    </tr>
                `;
            });
        } catch (error) {
            console.error("Грешка при зареждане:", error);
        }
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
            }
        } catch (error) {
            console.error(error);
        }
    };

    const addForm = document.getElementById('add-user-form');
    if (addForm) {
        addForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const name = document.getElementById('user-name').value;
            const email = document.getElementById('user-email').value;
            const password = document.getElementById('user-password').value;
            const roleSelect = document.getElementById('user-role').value;

            try {
                const response = await fetch('/users', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': token
                    },
                    body: JSON.stringify({ name, email, password, role: roleSelect })
                });

                if (response.ok) {
                    addForm.reset();
                    loadUsers();
                } else {
                    const err = await response.json();
                    alert(err.error);
                }
            } catch (error) {
                console.error(error);
            }
        });
    }

    loadUsers();
});
