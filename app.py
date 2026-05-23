from flask import Flask, render_template
from config import get_db_connection

app = Flask(__name__)

@app.route('/admin/users')
def admin_users():
    db = get_db_connection()
    cursor = db.cursor(dictionary= True)
    cursor.execute("select id,name, email, role from users")
    all_users = cursor.fetchall()
    cursor.close()
    db.close()
    return render_template('admin_users.html', users=all_users)
if __name__ == '__main__':
    app.run(debug=True)