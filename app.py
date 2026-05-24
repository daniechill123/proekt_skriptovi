from flask import Flask, render_template, request, redirect, url_for
from config import get_db_connection

app = Flask(__name__)

@app.route('/admin/users')
def admin_users():
    db = get_db_connection()
    cursor = db.cursor(dictionary= True)
    cursor.execute("select id,name, email, role from users")
    
    if request.method == 'POST':
        name = request.form['name']
        email = request.form['email']
        password = request.form['password']
        role = request.form['role']

    all_users = cursor.fetchall()
    cursor.close()
    db.close()
    return render_template('admin_users.html', users=all_users)

@app.route('/login', methods=['GET'])
def login_page():
    return render_template('login.html')

@app.route('/register', methods=['GET'])
def register_page():
    return render_template('register.html')

if __name__ == '__main__':
    app.run(debug=True)