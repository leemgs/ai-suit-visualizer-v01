
from fastapi import FastAPI
import pymysql

app = FastAPI()

def get_conn():
    return pymysql.connect(
        host="mariadb",
        user="root",
        password="password",
        database="ai_lawsuits",
        cursorclass=pymysql.cursors.DictCursor
    )

@app.get("/api/cases")
def get_cases():
    conn = get_conn()
    cur = conn.cursor()
    cur.execute("SELECT * FROM lawsuits ORDER BY file_date DESC")
    data = cur.fetchall()
    conn.close()
    return data
