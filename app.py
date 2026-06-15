from flask import Flask, request, jsonify
from flask_sqlalchemy import SQLAlchemy
import secrets

app = Flask(__name__)

app.config['SQLALCHEMY_DATABASE_URI'] = 'mysql+pymysql://root:root123456789@localhost/school_diary'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db = SQLAlchemy(app)

class Class(db.Model):
    __tablename__ = 'classes'
    id = db.Column(db.Integer, primary_key=True)
    grade = db.Column(db.Integer, nullable=False)
    letter = db.Column(db.String(10), nullable=False)
    users = db.relationship('User', backref='assigned_class', lazy=True)

class User(db.Model):
    __tablename__ = 'users'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(255), nullable=False)
    email = db.Column(db.String(255), unique=True, nullable=False)
    password = db.Column(db.String(255), nullable=False)
    role = db.Column(db.String(50), nullable=False)
    class_id = db.Column(db.Integer, db.ForeignKey('classes.id'), nullable=True)
    token = db.Column(db.String(255), nullable=True)

class Subject(db.Model):
    __tablename__ = 'subjects'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(255), unique=True, nullable=False)
    teacher_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    teacher = db.relationship('User', foreign_keys=[teacher_id], backref='taught_subjects')

class Grade(db.Model):
    __tablename__ = 'grades'
    id = db.Column(db.Integer, primary_key=True)
    value = db.Column(db.Integer, nullable=False)
    student_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    subject_id = db.Column(db.Integer, db.ForeignKey('subjects.id'), nullable=False)
    teacher_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    term = db.Column(db.Integer, nullable=False)

def get_authenticated_user():
    auth_token = request.headers.get('Authorization')
    if not auth_token:
        return None
    return User.query.filter_by(token=auth_token).first()

@app.route('/')
def login_page():
    return app.send_static_file('html/login.html')

@app.route('/admin/users')
def admin_users_panel():
    return app.send_static_file('html/admin_users.html')

@app.route('/admin/classes')
def admin_classes_panel():
    return app.send_static_file('html/admin_classes.html')

@app.route('/admin/subjects')
def admin_subjects_panel():
    return app.send_static_file('html/admin_subjects.html')

@app.route('/student')
def student_panel():
    return app.send_static_file('html/studentUI.html')

@app.route('/teacher')
def teacher_panel():
    return app.send_static_file('html/teacherUI.html')

@app.route('/sign-in', methods=['POST'])
def sign_in():
    data = request.get_json()
    if not data or 'email' not in data or 'password' not in data:
        return jsonify({"error": "Invalid input"}), 400

    user = User.query.filter_by(email=data['email'], password=data['password']).first()
    if not user:
        return jsonify({"error": "Unauthorized"}), 401

    user.token = secrets.token_hex(16)
    db.session.commit()
    return jsonify({"token": user.token, "role": user.role}), 200

@app.route('/logout', methods=['POST'])
def logout():
    auth_token = request.headers.get('Authorization')
    if auth_token:
        user = User.query.filter_by(token=auth_token).first()
        if user:
            user.token = None
            db.session.commit()
    return "", 204

@app.route('/users', methods=['GET'])
def get_users():
    current_user = get_authenticated_user()
    if not current_user:
        return jsonify({"error": "Unauthorized"}), 401
    if current_user.role != 'Админ':
        return jsonify({"error": "Forbidden"}), 403
        
    users = User.query.all()
    result = []
    for u in users:
        details = "-"
        subject_id = None
        if u.role == "Ученик" and u.assigned_class:
            details = f"{u.assigned_class.grade}{u.assigned_class.letter} клас"
        elif u.role == "Учител":
            if u.taught_subjects:
                details = ", ".join([s.name for s in u.taught_subjects])
                subject_id = u.taught_subjects[0].id
            else:
                details = "Няма предмет"
            
        result.append({
            "id": u.id,
            "name": u.name,
            "email": u.email,
            "role": u.role,
            "details": details,
            "class_id": u.class_id,
            "subject_id": subject_id
        })
    return jsonify(result), 200

@app.route('/subjects', methods=['GET'])
def get_subjects():
    current_user = get_authenticated_user()
    if not current_user:
        return jsonify({"error": "Unauthorized"}), 401
    subjects = Subject.query.all()
    result = []
    for s in subjects:
        teacher_name = s.teacher.name if s.teacher else "Няма назначен"
        result.append({
            "id": s.id, 
            "name": s.name, 
            "teacher_id": s.teacher_id,
            "teacher_name": teacher_name
        })
    return jsonify(result), 200

@app.route('/subjects', methods=['POST'])
def create_subject():
    current_user = get_authenticated_user()
    if not current_user or current_user.role != 'Админ':
        return jsonify({"error": "Forbidden"}), 403
    data = request.get_json()
    if not data or 'name' not in data:
        return jsonify({"error": "Bad Request"}), 400
    
    new_sub = Subject(name=data['name'], teacher_id=data.get('teacher_id'))
    db.session.add(new_sub)
    db.session.commit()
    return jsonify({"id": new_sub.id, "name": new_sub.name}), 201

@app.route('/subjects/<int:subject_id>', methods=['PUT', 'PATCH'])
def update_subject(subject_id):
    current_user = get_authenticated_user()
    if not current_user or current_user.role != 'Админ':
        return jsonify({"error": "Forbidden"}), 403
    data = request.get_json()
    sub = Subject.query.get(subject_id)
    if not sub:
        return jsonify({"error": "Not Found"}), 404
        
    if 'name' in data:
        sub.name = data['name']
    if 'teacher_id' in data:
        sub.teacher_id = data['teacher_id'] if data['teacher_id'] else None
        
    db.session.commit()
    return jsonify({"message": "Subject updated successfully"}), 200

@app.route('/subjects/<int:subject_id>', methods=['DELETE'])
def delete_subject(subject_id):
    current_user = get_authenticated_user()
    if not current_user or current_user.role != 'Админ':
        return jsonify({"error": "Forbidden"}), 403
    sub = Subject.query.get(subject_id)
    if not sub:
        return jsonify({"error": "Not Found"}), 404

    Grade.query.filter_by(subject_id=sub.id).delete()
    
    db.session.delete(sub)
    db.session.commit()
    return "", 204

@app.route('/users/<int:user_id>', methods=['GET'])
def get_user(user_id):
    current_user = get_authenticated_user()
    if not current_user:
        return jsonify({"error": "Unauthorized"}), 401
        
    u = User.query.get(user_id)
    if not u:
        return jsonify({"error": "Not Found"}), 404
    
    subject_id = u.taught_subjects[0].id if u.taught_subjects else None
    return jsonify({
        "id": u.id,
        "name": u.name,
        "email": u.email,
        "role": u.role,
        "class_id": u.class_id,
        "subject_id": subject_id
    }), 200

@app.route('/users', methods=['POST'])
def create_user():
    current_user = get_authenticated_user()
    if not current_user:
        return jsonify({"error": "Unauthorized"}), 401
    if current_user.role != 'Админ':
        return jsonify({"error": "Forbidden"}), 403
        
    data = request.get_json()
    if not data or not all(k in data for k in ('name', 'email', 'password', 'role')):
        return jsonify({"error": "Bad Request"}), 400
        
    if User.query.filter_by(email=data['email']).first():
        return jsonify({"error": "Email already exists"}), 400
        
    new_user = User(
        name=data['name'],
        email=data['email'],
        password=data['password'],
        role=data['role'],
        class_id=data.get('class_id') if data['role'] == 'Ученик' else None
    )
    db.session.add(new_user)
    db.session.commit()

    if data['role'] == 'Учител' and data.get('subject_id'):
        sub = Subject.query.get(data['subject_id'])
        if sub:
            sub.teacher_id = new_user.id
            db.session.commit()

    return jsonify({"id": new_user.id, "name": new_user.name, "email": new_user.email}), 201

@app.route('/users/<int:user_id>', methods=['DELETE'])
def delete_user(user_id):
    current_user = get_authenticated_user()
    if not current_user:
        return jsonify({"error": "Unauthorized"}), 401
    if current_user.role != 'Админ':
        return jsonify({"error": "Forbidden"}), 403
        
    u = User.query.get(user_id)
    if not u:
        return jsonify({"error": "Not Found"}), 404

    Subject.query.filter_by(teacher_id=u.id).update({Subject.teacher_id: None})
    
    db.session.delete(u)
    db.session.commit()
    return "", 204

@app.route('/classes', methods=['GET'])
def get_classes():
    current_user = get_authenticated_user()
    if not current_user:
        return jsonify({"error": "Unauthorized"}), 401
        
    classes = Class.query.all()
    result = []
    for c in classes:
        student_count = User.query.filter_by(class_id=c.id, role="Ученик").count()
        result.append({
            "id": c.id,
            "grade": c.grade,
            "letter": c.letter,
            "student_count": student_count
        })
    return jsonify(result), 200

@app.route('/classes', methods=['POST'])
def create_class():
    current_user = get_authenticated_user()
    if not current_user:
        return jsonify({"error": "Unauthorized"}), 401
    if current_user.role != 'Админ':
        return jsonify({"error": "Forbidden"}), 403
        
    data = request.get_json()
    if not data or 'grade' not in data or 'letter' not in data:
        return jsonify({"error": "Bad Request"}), 400
        
    new_class = Class(grade=data['grade'], letter=data['letter'])
    db.session.add(new_class)
    db.session.commit()
    return jsonify({"id": new_class.id, "grade": new_class.grade, "letter": new_class.letter}), 201

@app.route('/classes/<int:class_id>', methods=['DELETE'])
def delete_class(class_id):
    current_user = get_authenticated_user()
    if not current_user:
        return jsonify({"error": "Unauthorized"}), 401
    if current_user.role != 'Админ':
        return jsonify({"error": "Forbidden"}), 403
        
    cls = Class.query.get(class_id)
    if not cls:
        return jsonify({"error": "Not Found"}), 404

    User.query.filter_by(class_id=cls.id).update({User.class_id: None})
    
    db.session.delete(cls)
    db.session.commit()
    return "", 204

@app.route('/classes/<int:class_id>', methods=['PUT', 'PATCH'])
def update_class(class_id):
    current_user = get_authenticated_user()
    if not current_user or current_user.role != 'Админ':
        return jsonify({"error": "Forbidden"}), 403
        
    data = request.get_json()
    cls = Class.query.get(class_id)
    if not cls:
        return jsonify({"error": "Not Found"}), 404
    
    if 'grade' in data:
        cls.grade = int(data['grade'])
    if 'letter' in data:
        cls.letter = str(data['letter']).strip()
        
    db.session.commit()
    return jsonify({"message": "Class updated successfully"}), 200

@app.route('/users/<int:user_id>', methods=['PATCH','PUT'])
def update_user(user_id):
    current_user = get_authenticated_user()
    if not current_user or current_user.role != 'Админ':
        return jsonify({"error": "Forbidden"}), 403
        
    data = request.get_json()
    u = User.query.get(user_id)
    if not u:
        return jsonify({"error": "Not Found"}), 404
        
    if 'name' in data: 
        u.name = data['name']
    if 'email' in data: 
        u.email = data['email']
    if 'password' in data and str(data['password']).strip() != '': 
        u.password = str(data['password']).strip()
        
    if 'class_id' in data:
        u.class_id = data['class_id'] if u.role == 'Ученик' else None

    if 'subject_id' in data:
        Subject.query.filter_by(teacher_id=u.id).update({Subject.teacher_id: None})
        if data['subject_id']:
            sub = Subject.query.get(data['subject_id'])
            if sub:
                sub.teacher_id = u.id
        
    db.session.commit()
    return jsonify({"message": "User updated successfully"}), 200

@app.route('/teacher/classes', methods=['GET'])
def get_teacher_classes():
    current_user = get_authenticated_user()
    if not current_user or current_user.role != 'Учител':
        return jsonify({"error": "Unauthorized"}), 401
    
    classes = Class.query.all()
    result = [{"id": c.id, "name": f"{c.grade}{c.letter} клас"} for c in classes]
    return jsonify(result), 200

@app.route('/teacher/students', methods=['GET'])
def get_teacher_students():
    current_user = get_authenticated_user()
    if not current_user or current_user.role != 'Учител':
        return jsonify({"error": "Unauthorized"}), 401

    class_id = request.args.get('class_id')
    if not class_id:
        return jsonify({"error": "Class ID required"}), 400

    subject = Subject.query.filter_by(teacher_id=current_user.id).first()
    if not subject:
        return jsonify({"error": "No subject assigned"}), 400

    students = User.query.filter_by(role='Ученик', class_id=class_id).all()
    result = []

    for student in students:
        grades_t1 = Grade.query.filter_by(student_id=student.id, subject_id=subject.id, term=1).all()
        grades_t2 = Grade.query.filter_by(student_id=student.id, subject_id=subject.id, term=2).all()
        result.append({
            "id": student.id,
            "name": student.name,
            "grades_term1": [g.value for g in grades_t1],
            "grades_term2": [g.value for g in grades_t2]
        })

    return jsonify(result), 200

@app.route('/teacher/grades/add', methods=['POST'])
def add_grade():
    current_user = get_authenticated_user()
    if not current_user or current_user.role != 'Учител':
        return jsonify({"error": "Unauthorized"}), 401

    data = request.json
    student_id = data.get('student_id')
    grade_value = data.get('grade')
    term = data.get('term')

    subject = Subject.query.filter_by(teacher_id=current_user.id).first()
    if not subject:
        return jsonify({"error": "No subject assigned"}), 400

    new_grade = Grade(
        student_id=student_id,
        subject_id=subject.id,
        teacher_id=current_user.id,
        value=grade_value,
        term=term
    )
    db.session.add(new_grade)
    db.session.commit()

    return jsonify({"message": "Grade added"}), 200

@app.route('/student/grades', methods=['GET'])
def get_student_grades():
    current_user = get_authenticated_user()
    if not current_user or current_user.role != 'Ученик':
        return jsonify({"error": "Unauthorized"}), 401

    subjects = Subject.query.all()
    result = []

    for subject in subjects:
        grades_t1 = Grade.query.filter_by(student_id=current_user.id, subject_id=subject.id, term=1).all()
        grades_t2 = Grade.query.filter_by(student_id=current_user.id, subject_id=subject.id, term=2).all()

        result.append({
            "subject_name": subject.name,
            "teacher_name": subject.teacher.name if subject.teacher else "Няма назначен учител",
            "term1_grades": [g.value for g in grades_t1],
            "term1_final": "-",
            "term2_grades": [g.value for g in grades_t2],
            "term2_final": "-",
            "annual_grade": "-"
        })

    return jsonify(result), 200

def seed_test_data():
    with app.app_context():
        db.create_all()

        if not User.query.filter_by(email='admin@school.com').first():
            db.session.add(User(name='Главен Админ', email='admin@school.com', password='admin123', role='Админ'))

        teacher = User.query.filter_by(email='teacher@school.com').first()
        if not teacher:
            teacher = User(name='Петър Петров', email='teacher@school.com', password='teacher123', role='Учител')
            db.session.add(teacher)
            db.session.commit()

        if not Subject.query.filter_by(name='Математика').first():
            db.session.add(Subject(name='Математика', teacher_id=teacher.id))

        test_class = Class.query.filter_by(grade=9, letter='а').first()
        if not test_class:
            test_class = Class(grade=9, letter='а')
            db.session.add(test_class)
            db.session.commit()

        if not User.query.filter_by(email='student@school.com').first():
            db.session.add(User(
                name='Иван Иванов', 
                email='student@school.com', 
                password='student123', 
                role='Ученик', 
                class_id=test_class.id
            ))

        db.session.commit()
        print("Базата данни е готова за работа!")


if __name__ == '__main__':
    seed_test_data()
    app.run(debug=True, port=5000)