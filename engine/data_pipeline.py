import sqlite3
import random
import datetime
import os

DB_PATH = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'database', 'medorch.db'))

def create_tables(cursor):
    # Drop existing to ensure fresh schema
    cursor.execute('DROP TABLE IF EXISTS lab_results')
    cursor.execute('DROP TABLE IF EXISTS medications')
    cursor.execute('DROP TABLE IF EXISTS admissions')
    cursor.execute('DROP TABLE IF EXISTS patients')
    cursor.execute('DROP TABLE IF EXISTS staff')

    cursor.execute('''
        CREATE TABLE patients (
            patient_id INTEGER PRIMARY KEY AUTOINCREMENT,
            first_name TEXT NOT NULL,
            last_name TEXT NOT NULL,
            date_of_birth DATE NOT NULL,
            gender TEXT,
            insurance_provider TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')

    cursor.execute('''
        CREATE TABLE admissions (
            admission_id INTEGER PRIMARY KEY AUTOINCREMENT,
            patient_id INTEGER,
            admission_date TIMESTAMP NOT NULL,
            discharge_date TIMESTAMP,
            department TEXT NOT NULL,
            diagnosis TEXT,
            readmission_risk_score REAL,
            cost REAL,
            FOREIGN KEY(patient_id) REFERENCES patients(patient_id)
        )
    ''')

    cursor.execute('''
        CREATE TABLE lab_results (
            lab_id INTEGER PRIMARY KEY AUTOINCREMENT,
            patient_id INTEGER,
            test_name TEXT,
            test_value REAL,
            test_unit TEXT,
            reference_range TEXT,
            is_abnormal BOOLEAN,
            test_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(patient_id) REFERENCES patients(patient_id)
        )
    ''')

    cursor.execute('''
        CREATE TABLE medications (
            medication_id INTEGER PRIMARY KEY AUTOINCREMENT,
            patient_id INTEGER,
            drug_name TEXT,
            dosage TEXT,
            frequency TEXT,
            status TEXT,
            prescribed_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(patient_id) REFERENCES patients(patient_id)
        )
    ''')

    cursor.execute('''
        CREATE TABLE staff (
            staff_id INTEGER PRIMARY KEY AUTOINCREMENT,
            first_name TEXT,
            last_name TEXT,
            role TEXT,
            department TEXT,
            shift_start TEXT,
            shift_end TEXT
        )
    ''')

def populate_data(conn):
    cursor = conn.cursor()
    
    # Clear existing data
    cursor.execute('DELETE FROM lab_results')
    cursor.execute('DELETE FROM medications')
    cursor.execute('DELETE FROM admissions')
    cursor.execute('DELETE FROM patients')
    cursor.execute('DELETE FROM staff')

    first_names = ['James', 'Mary', 'John', 'Patricia', 'Robert', 'Jennifer', 'Michael', 'Linda', 'William', 'Elizabeth']
    last_names = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez']
    insurances = ['Medicare', 'Medicaid', 'Blue Cross', 'Aetna', 'Cigna', 'UnitedHealthcare']
    departments = ['ICU', 'ER', 'Surgery', 'Pediatrics', 'Oncology', 'Cardiology', 'Neurology']
    diagnoses = ['Sepsis', 'Cardiac Arrest', 'Appendicitis', 'Pneumonia', 'Stroke', 'Fracture', 'Diabetes Type 2']
    drugs = ['Lisinopril', 'Levothyroxine', 'Atorvastatin', 'Metformin', 'Amlodipine', 'Metoprolol', 'Albuterol', 'Omeprazole']
    tests = [
        ('Hemoglobin', 'g/dL', '13.8-17.2'), 
        ('WBC Count', 'K/uL', '4.5-11.0'), 
        ('Platelets', 'K/uL', '150-450'), 
        ('Creatinine', 'mg/dL', '0.7-1.3')
    ]

    # Generate 500 Patients
    print("Generating patients...")
    for i in range(500):
        fn = random.choice(first_names)
        ln = random.choice(last_names)
        # Random DOB between 1940 and 2005
        year = random.randint(1940, 2005)
        month = random.randint(1, 12)
        day = random.randint(1, 28)
        dob = f"{year}-{month:02d}-{day:02d}"
        gender = random.choice(['Male', 'Female'])
        insurance = random.choice(insurances)
        
        cursor.execute(
            'INSERT INTO patients (first_name, last_name, date_of_birth, gender, insurance_provider) VALUES (?, ?, ?, ?, ?)',
            (fn, ln, dob, gender, insurance)
        )
        patient_id = cursor.lastrowid

        # Generate Admissions for patient
        num_admissions = random.randint(1, 3)
        for _ in range(num_admissions):
            admit_date = datetime.datetime.now() - datetime.timedelta(days=random.randint(1, 365))
            # 20% currently admitted (no discharge date)
            if random.random() < 0.2:
                discharge_date = None
            else:
                discharge_date = admit_date + datetime.timedelta(days=random.randint(1, 14))
                
            dept = random.choice(departments)
            diag = random.choice(diagnoses)
            risk = round(random.uniform(5.0, 95.0), 2)
            cost = round(random.uniform(1000.0, 50000.0), 2)
            
            cursor.execute(
                'INSERT INTO admissions (patient_id, admission_date, discharge_date, department, diagnosis, readmission_risk_score, cost) VALUES (?, ?, ?, ?, ?, ?, ?)',
                (patient_id, admit_date.strftime("%Y-%m-%d %H:%M:%S"), discharge_date.strftime("%Y-%m-%d %H:%M:%S") if discharge_date else None, dept, diag, risk, cost)
            )

        # Generate Labs
        for _ in range(random.randint(2, 5)):
            test = random.choice(tests)
            test_name, unit, ref_range = test
            # Generate random value, ~30% chance of being abnormal
            is_abnormal = random.random() < 0.3
            if test_name == 'Hemoglobin':
                val = round(random.uniform(8.0, 12.0) if is_abnormal else random.uniform(13.8, 17.2), 1)
            elif test_name == 'WBC Count':
                val = round(random.uniform(12.0, 20.0) if is_abnormal else random.uniform(4.5, 11.0), 1)
            else:
                val = round(random.uniform(10.0, 100.0), 1)
                
            cursor.execute(
                'INSERT INTO lab_results (patient_id, test_name, test_value, test_unit, reference_range, is_abnormal) VALUES (?, ?, ?, ?, ?, ?)',
                (patient_id, test_name, val, unit, ref_range, is_abnormal)
            )

        # Generate Medications
        for _ in range(random.randint(1, 4)):
            drug = random.choice(drugs)
            status = 'Active' if random.random() < 0.7 else 'Discontinued'
            cursor.execute(
                'INSERT INTO medications (patient_id, drug_name, dosage, frequency, status) VALUES (?, ?, ?, ?, ?)',
                (patient_id, drug, '10mg', 'Once daily', status)
            )

    conn.commit()
    print("Database generation complete! Added 500 patients with corresponding admissions, labs, and medications.")

if __name__ == '__main__':
    os.makedirs(os.path.dirname(DB_PATH), exist_ok=True)
    conn = sqlite3.connect(DB_PATH)
    create_tables(conn.cursor())
    populate_data(conn)
    conn.close()
