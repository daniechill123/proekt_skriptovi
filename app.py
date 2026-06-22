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
    type = db.Column(db.String(50), nullable=False, default='текуща')



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
        return jsonify({'error': 'Нямате достъп'}), 401
    if current_user.role != 'Админ':
        return jsonify({'error': 'Нямате достъп'}), 403

    users = User.query.all()
    result = []
    for u in users:
        class_info = None
        if u.role == 'Ученик' and u.assigned_class:
            class_info = f"{u.assigned_class.grade}{u.assigned_class.letter}"

        subject_info = None
        subject_id = None
        if u.role == 'Учител':
            subj = Subject.query.filter_by(teacher_id=u.id).first()
            if subj:
                subject_info = subj.name
                subject_id = subj.id

        result.append({
            'id': u.id,
            'name': u.name,
            'email': u.email,
            'role': u.role,
            'class_id': u.class_id,
            'class_info': class_info,
            'subject_id': subject_id,
            'subject_info': subject_info
        })
    return jsonify(result), 200


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


@app.route('/users/<int:user_id>', methods=['PUT'])
def update_user(user_id):
    current_user = get_authenticated_user()
    if not current_user:
        return jsonify({'error': 'Нямате достъп'}), 401
    if current_user.role != 'Админ':
        return jsonify({'error': 'Нямате достъп'}), 403

    user = User.query.get(user_id)
    if not user:
        return jsonify({'error': 'Потребителят не е намерен'}), 404

    data = request.json
    user.name = data.get('name', user.name)
    user.email = data.get('email', user.email)

    if data.get('password'):
        user.password = data.get('password')

    if user.role == 'Ученик':
        class_id = data.get('class_id')
        user.class_id = class_id if class_id else None

    elif user.role == 'Учител':
        subject_id = data.get('subject_id')
        old_subjects = Subject.query.filter_by(teacher_id=user.id).all()
        for os in old_subjects:
            os.teacher_id = None

        if subject_id:
            subj = Subject.query.get(subject_id)
            if subj:
                subj.teacher_id = user.id

    db.session.commit()
    return jsonify({'message': 'Потребителят е обновен успешно'}), 200


@app.route('/users/<int:user_id>', methods=['DELETE'])
def delete_user(user_id):
    token = request.headers.get('Authorization')
    current_user = User.query.filter_by(token=token).first()
    if not current_user:
        return jsonify({"error": "Неоторизиран достъп!"}), 401
    if current_user.role != 'Админ':
        return jsonify({"error": "Нямате права за тази операция!"}), 403
    admin = current_user

    user_to_delete = User.query.get(user_id)
    if not user_to_delete:
        return jsonify({"error": "Потребителят не е намерен!"}), 404

    if admin.id == user_to_delete.id:
        return jsonify({"error": "Не можете да изтриете собствения си профил!"}), 400

    try:
        if user_to_delete.role == 'Учител':
            subjects = Subject.query.filter_by(teacher_id=user_to_delete.id).all()
            for sub in subjects:
                sub.teacher_id = None

        elif user_to_delete.role == 'Ученик':
            Grade.query.filter_by(student_id=user_to_delete.id).delete()

        db.session.delete(user_to_delete)
        db.session.commit()
        return jsonify({"message": "Потребителят беше изтрит успешно!"}), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({"error": f"Грешка при изтриване: {str(e)}"}), 500


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


@app.route('/classes/<int:class_id>', methods=['PUT', 'PATCH'])
def update_class(class_id):
    current_user = get_authenticated_user()
    if not current_user:
        return jsonify({'error': 'Нямате достъп'}), 401
    if current_user.role != 'Админ':
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
    if not current_user:
        return jsonify({"error": "Unauthorized"}), 401
    if current_user.role != 'Админ':
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
    if not current_user:
        return jsonify({"error": "Unauthorized"}), 401
    if current_user.role != 'Админ':
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
    if not current_user:
        return jsonify({"error": "Unauthorized"}), 401
    if current_user.role != 'Админ':
        return jsonify({"error": "Forbidden"}), 403
    sub = Subject.query.get(subject_id)
    if not sub:
        return jsonify({"error": "Not Found"}), 404

    Grade.query.filter_by(subject_id=sub.id).delete()

    db.session.delete(sub)
    db.session.commit()
    return "", 204


@app.route('/teacher/classes', methods=['GET'])
def get_teacher_classes():
    token = request.headers.get('Authorization')
    if not token:
        return jsonify({"error": "Missing token"}), 401

    teacher = User.query.filter_by(token=token, role='Учител').first()
    if not teacher:
        return jsonify({"error": "Unauthorized"}), 401

    classes = Class.query.all()
    result = []
    for cls in classes:
        result.append({
            "id": cls.id,
            "grade": cls.grade,
            "letter": cls.letter
        })
    return jsonify(result), 200


@app.route('/classes/<int:class_id>/students', methods=['GET'])
def get_class_students(class_id):
    token = request.headers.get('Authorization')
    current_user = User.query.filter_by(token=token).first()
    if not current_user:
        return jsonify({"error": "Missing token"}), 401
    if current_user.role != 'Учител':
        return jsonify({"error": "Forbidden"}), 403
    teacher = current_user

    students = User.query.filter_by(class_id=class_id, role='Ученик').all()
    subject = Subject.query.filter_by(teacher_id=teacher.id).first()
    if not subject:
        return jsonify({"error": "Teacher has no subject assigned"}), 404

    result = []
    for student in students:
        grades = Grade.query.filter_by(student_id=student.id, subject_id=subject.id).all()

        term1_current = [{"id": g.id, "value": g.value} for g in grades if g.term == 1 and g.type == 'текуща']
        term1_final = next(({"id": g.id, "value": g.value} for g in grades if g.term == 1 and g.type == 'срочна'), {"id": None, "value": "-"})

        term2_current = [{"id": g.id, "value": g.value} for g in grades if g.term == 2 and g.type == 'текуща']
        term2_final = next(({"id": g.id, "value": g.value} for g in grades if g.term == 2 and g.type == 'срочна'), {"id": None, "value": "-"})

        annual = next(({"id": g.id, "value": g.value} for g in grades if g.type == 'годишна'), {"id": None, "value": "-"})

        result.append({
            "id": student.id,
            "name": student.name,
            "term1_grades": term1_current,
            "term1_final": term1_final,
            "term2_grades": term2_current,
            "term2_final": term2_final,
            "annual_grade": annual
        })

    return jsonify(result), 200


@app.route('/grades', methods=['POST'])
def add_grade():
    token = request.headers.get('Authorization')
    current_user = User.query.filter_by(token=token).first()
    if not current_user:
        return jsonify({"error": "Липсва токен за оторизация"}), 401
    if current_user.role != 'Учител':
        return jsonify({"error": "Нямате права за тази операция"}), 403
    teacher = current_user

    data = request.get_json()
    if not data:
        return jsonify({"error": "Липсва тяло на заявката (JSON)"}), 400

    student_id = data.get('student_id')
    grade_raw = data.get('grade')
    term_raw = data.get('term')
    grade_type = data.get('type', 'текуща')

    if student_id is None or grade_raw is None or term_raw is None:
        return jsonify({"error": "Полетата student_id, grade и term са задължителни"}), 400

    try:
        grade_value = int(grade_raw)
        term = int(term_raw)
    except (ValueError, TypeError):
        return jsonify({"error": "Невалиден формат на оценката или срока"}), 400

    subject = Subject.query.filter_by(teacher_id=teacher.id).first()
    if not subject:
        return jsonify({"error": "На този учител не е зачислен предмет"}), 404

    student = User.query.filter_by(id=student_id, role='Ученик').first()
    if not student:
        return jsonify({"error": "Ученикът не е намерен"}), 404

    if grade_type in ['срочна', 'годишна']:
        existing_grade = Grade.query.filter_by(
            student_id=student_id,
            subject_id=subject.id,
            term=term,
            type=grade_type
        ).first()
        if existing_grade:
            existing_grade.value = grade_value
            db.session.commit()
            return jsonify({"message": "Grade updated successfully"}), 200

    new_grade = Grade(
        value=grade_value,
        student_id=student_id,
        subject_id=subject.id,
        teacher_id=teacher.id,
        term=term,
        type=grade_type
    )

    db.session.add(new_grade)
    db.session.commit()
    return jsonify({"message": "Grade added successfully"}), 201


@app.route('/grades/<int:grade_id>', methods=['DELETE'])
def delete_grade(grade_id):
    current_user = get_authenticated_user()
    if not current_user:
        return jsonify({"error": "Unauthorized"}), 401
    if current_user.role != 'Учител':
        return jsonify({"error": "Forbidden"}), 403

    grade = Grade.query.get(grade_id)
    if not grade:
        return jsonify({"error": "Оценката не е намерена"}), 404

    if grade.teacher_id != current_user.id:
        return jsonify({"error": "Нямате права да триете тази оценка"}), 403

    db.session.delete(grade)
    db.session.commit()
    return jsonify({"message": "Оценката е изтрита успешно"}), 200


@app.route('/grades', methods=['GET'])
def get_student_grades():
    current_user = get_authenticated_user()
    if not current_user:
        return jsonify({"error": "Unauthorized"}), 401
    if current_user.role != 'Ученик':
        return jsonify({"error": "Forbidden"}), 403

    subjects = Subject.query.all()
    result = []

    for subject in subjects:
        grades = Grade.query.filter_by(student_id=current_user.id, subject_id=subject.id).all()

        t1_current = [g.value for g in grades if g.term == 1 and g.type == 'текуща']
        t1_final = next((g.value for g in grades if g.term == 1 and g.type == 'срочна'), "-")
        t2_current = [g.value for g in grades if g.term == 2 and g.type == 'текуща']
        t2_final = next((g.value for g in grades if g.term == 2 and g.type == 'срочна'), "-")
        annual = next((g.value for g in grades if g.type == 'годишна'), "-")

        result.append({
            "subject_name": subject.name,
            "teacher_name": subject.teacher.name if subject.teacher else "Няма назначен учител",
            "term1_grades": t1_current,
            "term1_final": t1_final,
            "term2_grades": t2_current,
            "term2_final": t2_final,
            "annual_grade": annual
        })

    return jsonify(result), 200


def seed_test_data():
    with app.app_context():
        db.create_all()

        if not User.query.filter_by(email='admin@school.com').first():
            db.session.add(User(name='Главен Админ', email='admin@school.com', password='123', role='Админ'))

        teacher = User.query.filter_by(email='teacher@school.com').first()
        if not teacher:
            teacher = User(name='Петър Петров', email='teacher@school.com', password='123', role='Учител')
            db.session.add(teacher)
            db.session.commit()

        test_class = Class.query.filter_by(grade=9, letter='а').first()
        if not test_class:
            test_class = Class(grade=9, letter='а')
            db.session.add(test_class)
            db.session.commit()

        if not User.query.filter_by(email='student@school.com').first():
            db.session.add(User(
                name='Иван Иванов',
                email='student@school.com',
                password='123',
                role='Ученик',
                class_id=test_class.id
            ))

        db.session.commit()
        print("Базата данни е готова за работа!")


if __name__ == '__main__':
    seed_test_data()
    app.run(debug=True, port=5000)