
import pymysql

conn = pymysql.connect(
    host="mariadb",
    user="root",
    password="password",
    database="ai_lawsuits"
)

def insert_cases(cases):
    cur = conn.cursor()
    for c in cases:
        cur.execute("""
        INSERT IGNORE INTO lawsuits
        (case_name,company,court,state,file_date,case_type,url)
        VALUES (%s,%s,%s,%s,%s,%s,%s)
        """,(
            c["case_name"],c["company"],c["court"],c["state"],
            c["file_date"],c["case_type"],c["url"]
        ))
    conn.commit()
