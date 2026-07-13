import sqlite3
import random
from datetime import datetime, timedelta
import os

def seed_db():
    db_path = os.path.join(os.path.dirname(__file__), 'medorch.db')
    print(f"Creating SQLite database at {db_path}...")
    
    try:
        conn = sqlite3.connect(db_path)
        cur = conn.cursor()

        # Create tables
        cur.executescript('''
            CREATE TABLE IF NOT EXISTS patients (
                patient_id INTEGER PRIMARY KEY AUTOINCREMENT,
                first_name TEXT NOT NULL,
                last_name TEXT NOT NULL,
                date_of_birth DATE NOT NULL,
                gender TEXT,
                insurance_provider TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS admissions (
                admission_id INTEGER PRIMARY KEY AUTOINCREMENT,
                patient_id INTEGER REFERENCES patients(patient_id),
                admission_date TIMESTAMP NOT NULL,
                discharge_date TIMESTAMP,
                department TEXT NOT NULL,
                diagnosis TEXT,
                readmission_risk_score REAL,
                cost REAL
            );

            CREATE TABLE IF NOT EXISTS staff (
                staff_id INTEGER PRIMARY KEY AUTOINCREMENT,
                first_name TEXT,
                last_name TEXT,
                role TEXT,
                department TEXT,
                shift_start TEXT,
                shift_end TEXT
            );

            CREATE TABLE IF NOT EXISTS compliance_logs (
                log_id INTEGER PRIMARY KEY AUTOINCREMENT,
                action TEXT,
                user_role TEXT,
                timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                status TEXT
            );
        ''')

        # Clear existing data if re-running
        cur.executescript('''
            DELETE FROM admissions;
            DELETE FROM patients;
            DELETE FROM staff;
            DELETE FROM compliance_logs;
        ''')

        print("Seeding Patients...")
        first_names = ["John", "Jane", "Robert", "Mary", "William", "Patricia", "David", "Jennifer", "Richard", "Linda"]
        last_names = ["Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller", "Davis", "Rodriguez", "Martinez"]
        departments = ["ICU", "ER", "Surgery", "Pediatrics", "Oncology", "Cardiology"]
        
        for _ in range(100):
            cur.execute(
                "INSERT INTO patients (first_name, last_name, date_of_birth, gender, insurance_provider) VALUES (?, ?, ?, ?, ?)",
                (random.choice(first_names), random.choice(last_names), 
                 (datetime.now() - timedelta(days=random.randint(10000, 30000))).strftime('%Y-%m-%d'),
                 random.choice(["Male", "Female"]),
                 random.choice(["BlueCross", "Aetna", "Medicare", "UnitedHealthcare"]))
            )
        
        print("Seeding Admissions...")
        for patient_id in range(1, 101):
            admit_date = datetime.now() - timedelta(days=random.randint(1, 30))
            discharge_date = admit_date + timedelta(days=random.randint(1, 10)) if random.random() > 0.3 else None
            cur.execute(
                "INSERT INTO admissions (patient_id, admission_date, discharge_date, department, diagnosis, readmission_risk_score, cost) VALUES (?, ?, ?, ?, ?, ?, ?)",
                (patient_id, admit_date.strftime('%Y-%m-%d %H:%M:%S'), 
                 discharge_date.strftime('%Y-%m-%d %H:%M:%S') if discharge_date else None,
                 random.choice(departments),
                 random.choice(["Cardiac Arrest", "Pneumonia", "Appendicitis", "Sepsis", "Fracture"]),
                 round(random.uniform(5.0, 95.0), 2),
                 round(random.uniform(1000.0, 50000.0), 2))
            )
        
        print("Seeding Staff...")
        roles = ["Attending", "Resident", "RN", "Specialist"]
        for _ in range(50):
            cur.execute(
                "INSERT INTO staff (first_name, last_name, role, department, shift_start, shift_end) VALUES (?, ?, ?, ?, ?, ?)",
                (random.choice(first_names), random.choice(last_names), random.choice(roles), random.choice(departments), "08:00:00", "20:00:00")
            )
        
        print("Seeding Compliance...")
        for _ in range(30):
            cur.execute(
                "INSERT INTO compliance_logs (action, user_role, status) VALUES (?, ?, ?)",
                (random.choice(["PHI Access", "Data Export", "System Login"]),
                 random.choice(["Admin", "Physician", "Nurse"]),
                 random.choice(["Success", "Denied"]))
            )
            
        conn.commit()
        cur.close()
        conn.close()
        print("Seeding Complete!")
        
    except Exception as e:
        print(f"Error connecting to database: {e}")

if __name__ == "__main__":
    seed_db()
