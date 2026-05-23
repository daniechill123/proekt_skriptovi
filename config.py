import mysql.connector

def get_db_connection():
    connection = mysql.connector.connect(
        host='localhost',
        user='root',
        password='root123456789',
        database='school_diary'
    )
    return connection