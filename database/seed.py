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

            CREATE TABLE IF NOT EXISTS lab_results (
                lab_id INTEGER PRIMARY KEY AUTOINCREMENT,
                patient_id INTEGER REFERENCES patients(patient_id),
                test_name TEXT NOT NULL,
                test_value TEXT NOT NULL,
                test_unit TEXT NOT NULL,
                reference_range TEXT,
                test_date TIMESTAMP NOT NULL,
                is_abnormal BOOLEAN
            );

            CREATE TABLE IF NOT EXISTS medications (
                medication_id INTEGER PRIMARY KEY AUTOINCREMENT,
                patient_id INTEGER REFERENCES patients(patient_id),
                drug_name TEXT NOT NULL,
                dosage TEXT NOT NULL,
                frequency TEXT NOT NULL,
                start_date TIMESTAMP NOT NULL,
                end_date TIMESTAMP,
                status TEXT NOT NULL
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
            
            # Generate Lab Results for this admission
            num_labs = random.randint(1, 5)
            lab_tests = [
                ('Hemoglobin', lambda: round(random.uniform(9.0, 16.0), 1), 'g/dL', '12.0-16.0'),
                ('White Blood Cell Count', lambda: round(random.uniform(3.0, 15.0), 1), '10^9/L', '4.5-11.0'),
                ('Potassium', lambda: round(random.uniform(3.0, 5.5), 1), 'mmol/L', '3.5-5.1'),
                ('Creatinine', lambda: round(random.uniform(0.5, 2.0), 2), 'mg/dL', '0.6-1.2'),
                ('Glucose', lambda: random.randint(70, 200), 'mg/dL', '70-99')
            ]
            for _ in range(num_labs):
                test_name, val_func, unit, ref_range = random.choice(lab_tests)
                test_val = val_func()
                
                is_abnormal = False
                if test_name == 'Hemoglobin' and (test_val < 12.0 or test_val > 16.0):
                    is_abnormal = True
                elif test_name == 'White Blood Cell Count' and (test_val < 4.5 or test_val > 11.0):
                    is_abnormal = True
                elif test_name == 'Potassium' and (test_val < 3.5 or test_val > 5.1):
                    is_abnormal = True
                elif test_name == 'Creatinine' and test_val > 1.2:
                    is_abnormal = True
                elif test_name == 'Glucose' and test_val > 99:
                    is_abnormal = True

                cur.execute('''
                    INSERT INTO lab_results (patient_id, test_name, test_value, test_unit, reference_range, test_date, is_abnormal)
                    VALUES (?, ?, ?, ?, ?, ?, ?)
                ''', (
                    patient_id, test_name, str(test_val), unit, ref_range,
                    (admit_date + timedelta(hours=random.randint(1, 48))).strftime('%Y-%m-%d %H:%M:%S'), is_abnormal
                ))

            # Generate Medications
            num_meds = random.randint(1, 4)
            drug_options = [
                ('Lisinopril', '10mg', 'Daily'),
                ('Metformin', '500mg', 'Twice a day'),
                ('Amlodipine', '5mg', 'Daily'),
                ('Atorvastatin', '20mg', 'Daily at bedtime'),
                ('Omeprazole', '40mg', 'Daily before meal'),
                ('Amoxicillin', '500mg', 'Every 8 hours'),
                ('Ibuprofen', '400mg', 'Every 6 hours as needed')
            ]
            for _ in range(num_meds):
                drug_name, dosage, freq = random.choice(drug_options)
                status = 'Active' if discharge_date is None else 'Discontinued'
                end_date_str = discharge_date.strftime('%Y-%m-%d %H:%M:%S') if discharge_date else None
                cur.execute('''
                    INSERT INTO medications (patient_id, drug_name, dosage, frequency, start_date, end_date, status)
                    VALUES (?, ?, ?, ?, ?, ?, ?)
                ''', (
                    patient_id, drug_name, dosage, freq, admit_date.strftime('%Y-%m-%d %H:%M:%S'), end_date_str, status
                ))
        
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
