document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('login-form');

    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();

            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;

            try {
                const response = await fetch('/sign-in', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, password })
                });

                const data = await response.json();

                if (response.ok) {
                    localStorage.setItem('token', data.token);
                    localStorage.setItem('role', data.role);

                    if (data.role === 'Админ') window.location.href = '/admin/users';
                        else if (data.role === 'Учител') window.location.href = '/teacher';
                        else if (data.role === 'Ученик') window.location.href = '/student';
                } else {
                    alert("Грешка: " + data.error);
                }
            } catch (error) {
                console.error(error);
                alert("Няма връзка със сървъра.");
            }
        });
    }
});
