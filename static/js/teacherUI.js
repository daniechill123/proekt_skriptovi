document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('role');

    if (!token || role !== 'Учител') {
        window.location.href = '/';
        return;
    }

    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', async () => {
            await fetch('/logout', {
                method: 'POST',
                headers: { 'Authorization': token }
            });
            localStorage.clear();
            window.location.href = '/';
        });
    }
});