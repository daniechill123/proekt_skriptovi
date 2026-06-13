document.addEventListener('DOMContentLoaded', () => {

    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const email = document.getElementById('login-email').value;
            const password = document.getElementById('login-password').value;

            try {
                const response = await fetch('/sign-in', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ email, password })
                });

                if (response.status === 200) {
                    const data = await response.json();
а
                    localStorage.setItem('authToken', data.token);
                    localStorage.setItem('userRole', data.role);

                    if (data.role === 'student') {
                        window.location.href = '/static/html/studentUI.html';
                    } else if (data.role === 'teacher') {
                        window.location.href = '/static/html/teacherUI.html'; 
                    }
                } else {
                    const errorData = await response.json();
                    alert('Грешка при вход: ' + (errorData.error || 'Невалидни данни'));
                }
            } catch (error) {
                console.error('Грешка:', error);
                alert('Проблем със сървъра. Опитайте отново по-късно.');
            }
        });
    }

    const registerForm = document.getElementById('register-form');
    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const name = document.getElementById('register-name').value;
            const email = document.getElementById('register-email').value;
            const password = document.getElementById('register-password').value;
            const role = document.getElementById('register-role').value;

            try {
                const response = await fetch('/sign-up', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ name, email, password, role })
                });

                if (response.status === 201) {
                    alert('Профилът е активиран успешно! Моля, влезте в системата.');
                    window.location.href = '/static/html/login.html';
                } else {
                    const errorData = await response.json();
                    alert('Грешка при регистрация: ' + (errorData.error || 'Невалидни данни'));
                }
            } catch (error) {
                console.error('Грешка:', error);
                alert('Проблем със сървъра. Опитайте отново по-късно.');
            }
        });
    }
});if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if if 