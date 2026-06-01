from flask import Flask, request, jsonify

app = Flask(__name__)

@app.route('/sign-up', methods=['POST'])
def sign_up():
    data = request.get_json()
    if not data or 'email' not in data or 'password' not in data or 'role' not in data:
        return jsonify({"error": "Missing parameters"}), 400
    
    return jsonify({"message": "User registered successfully"}), 201

@app.route('/sign-in', methods=['POST'])
def sign_in():
    data = request.get_json()
    if not data or 'email' not in data or 'password' not in data:
        return jsonify({"error": "Invalid input"}), 400
    
    if data['email'] == "student@school.bg" and data['password'] == "123456":
        return jsonify({"token": "student-token-xyz", "role": "student"}), 200
    elif data['email'] == "teacher@school.bg" and data['password'] == "123456":
        return jsonify({"token": "teacher-token-xyz", "role": "teacher"}), 200
        
    return jsonify({"error": "Unauthorized"}), 401

@app.route('/logout', methods=['POST'])
def logout():
    return "", 204

@app.route('/grades', methods=['GET'])
def get_grades():
    auth_header = request.headers.get('Authorization')
    if not auth_header:
        return jsonify({"error": "Unauthorized"}), 401
        
    mock_grades = [
        {"id": 1, "subject": "Английски език", "term_1_current": [6, 5], "term_1_final": 5, "term_2_current": [6], "term_2_final": None}
    ]
    return jsonify(mock_grades), 200

@app.route('/grades', methods=['POST'])
def create_grade():
    auth_header = request.headers.get('Authorization')
    if not auth_header:
        return jsonify({"error": "Unauthorized"}), 401
    if "teacher" not in auth_header:
        return jsonify({"error": "Forbidden"}), 403
        
    data = request.get_json()
    if not data or 'subject_id' not in data or 'value' not in data:
        return jsonify({"error": "Bad Request"}), 400
        
    new_grade = {"id": 100, "subject_id": data['subject_id'], "value": data['value']}
    return jsonify(new_grade), 201

@app.route('/grades/<int:grade_id>', methods=['PUT'])
def update_grade(grade_id):
    data = request.get_json()
    if not data or 'value' not in data:
        return jsonify({"error": "Bad Request"}), 400
    return jsonify({"id": grade_id, "value": data['value']}), 200

@app.route('/grades/<int:grade_id>', methods=['DELETE'])
def delete_grade(grade_id):
    return "", 204

if __name__ == '__main__':
    app.run(debug=True, port=5000)