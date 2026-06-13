from flask import Flask, request, jsonify
from flask_sqlalchemy import SQLAlchemy
import secrets

app = Flask(__name__)

app.config['SQLALCHEMY_DATABASE_URI'] = 'mysql+pymysql://root:TVOIATA_PAROLA@localhost/school_diary'
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

@app.route('/')
def index():
    return app.send_static_file('html/login.html')

@app.route('/sign-up', methods=['POST'])
def sign_up():
    data = request.get_json()
    if not data or not all(k in data for k in ('name', 'email', 'password', 'role')):
        return jsonify({"error": "Missing data"}), 400
    
    if User.query.filter_by(email=data['email']).first():
        return jsonify({"error": "Email already exists"}), 400

    new_user = User(
        name=data['name'],
        email=data['email'],
        password=data['password'],
        role=data['role']
    )
    db.session.add(new_user)
    db.session.commit()
    return jsonify({"message": "User registered successfully"}), 201

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

if __name__ == '__main__':
    app.run(debug=True, port=5000)