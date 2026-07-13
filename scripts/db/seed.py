import psycopg2
# pyrefly: ignore [missing-import]
from faker import Faker
import random
from datetime import datetime, timedelta

fake = Faker()

# Database connection parameters
DB_PARAMS = {
    "dbname": "healthcare_analytics",
    "user": "admin",
    "password": "password",
    "host": "localhost",
    "port": "5432"
}

# Schema Definitions
SCHEMA_SQL = """
DROP TABLE IF EXISTS financials;
DROP TABLE IF EXISTS resources;
DROP TABLE IF EXISTS admissions;
DROP TABLE IF EXISTS patients;

CREATE TABLE patients (
    id SERIAL PRIMARY KEY,
    first_name VARCHAR(50),
    last_name VARCHAR(50),
    age INT,
    gender VARCHAR(20),
    baseline_risk_score FLOAT, -- 0.0 to 1.0
    synthetic_ssn VARCHAR(11) -- For GRC testing
);

CREATE TABLE admissions (
    id SERIAL PRIMARY KEY,
    patient_id INT REFERENCES patients(id),
    admit_date DATE,
    discharge_date DATE,
    department VARCHAR(50),
    primary_diagnosis VARCHAR(100),
    readmission_status BOOLEAN
);

CREATE TABLE resources (
    id SERIAL PRIMARY KEY,
    department VARCHAR(50) UNIQUE,
    total_beds INT,
    occupied_beds INT,
    staff_available INT
);

CREATE TABLE financials (
    id SERIAL PRIMARY KEY,
    admission_id INT REFERENCES admissions(id),
    base_cost NUMERIC(10, 2),
    complication_multiplier FLOAT
);
"""

def generate_patients(cursor, num_records=1000):
    print(f"Seeding {num_records} patients...")
    insert_sql = "INSERT INTO patients (first_name, last_name, age, gender, baseline_risk_score, synthetic_ssn) VALUES (%s, %s, %s, %s, %s, %s) RETURNING id;"
    patient_ids = []
    for _ in range(num_records):
        cursor.execute(insert_sql, (
            fake.first_name(),
            fake.last_name(),
            random.randint(18, 95),
            random.choice(['Male', 'Female', 'Other']),
            round(random.uniform(0.1, 0.9), 2),
            fake.ssn()
        ))
        patient_ids.append(cursor.fetchone()[0])
    return patient_ids

def generate_admissions(cursor, patient_ids, num_records=1500):
    print(f"Seeding {num_records} admissions...")
    departments = ['Cardiology', 'Neurology', 'Oncology', 'Emergency', 'Orthopedics']
    diagnoses = ['Heart Failure', 'Stroke', 'Pneumonia', 'Sepsis', 'Hip Fracture']
    
    insert_sql = "INSERT INTO admissions (patient_id, admit_date, discharge_date, department, primary_diagnosis, readmission_status) VALUES (%s, %s, %s, %s, %s, %s) RETURNING id;"
    admission_ids = []
    
    for _ in range(num_records):
        admit_date = fake.date_between(start_date='-2y', end_date='today')
        length_of_stay = timedelta(days=random.randint(1, 14))
        discharge_date = admit_date + length_of_stay
        
        cursor.execute(insert_sql, (
            random.choice(patient_ids),
            admit_date,
            discharge_date,
            random.choice(departments),
            random.choice(diagnoses),
            random.random() < 0.15 # 15% readmission rate
        ))
        admission_ids.append(cursor.fetchone()[0])
    return admission_ids

def generate_resources(cursor):
    print("Seeding resources...")
    departments = [
        ('Cardiology', 50, random.randint(30, 50), random.randint(10, 20)),
        ('Neurology', 40, random.randint(20, 40), random.randint(8, 15)),
        ('Oncology', 60, random.randint(40, 60), random.randint(15, 25)),
        ('Emergency', 30, random.randint(25, 30), random.randint(20, 30)),
        ('Orthopedics', 45, random.randint(20, 45), random.randint(10, 18))
    ]
    
    insert_sql = "INSERT INTO resources (department, total_beds, occupied_beds, staff_available) VALUES (%s, %s, %s, %s);"
    for dept in departments:
        cursor.execute(insert_sql, dept)

def generate_financials(cursor, admission_ids):
    print(f"Seeding {len(admission_ids)} financial records...")
    insert_sql = "INSERT INTO financials (admission_id, base_cost, complication_multiplier) VALUES (%s, %s, %s);"
    
    for adm_id in admission_ids:
        cursor.execute(insert_sql, (
            adm_id,
            round(random.uniform(5000.0, 50000.0), 2),
            round(random.uniform(1.0, 1.5), 2)
        ))

def seed_database():
    try:
        conn = psycopg2.connect(**DB_PARAMS)
        cursor = conn.cursor()
        
        # 1. Create Schema
        print("Creating schema...")
        cursor.execute(SCHEMA_SQL)
        
        # 2. Generate Data
        patient_ids = generate_patients(cursor, num_records=5000)
        admission_ids = generate_admissions(cursor, patient_ids, num_records=8000)
        generate_resources(cursor)
        generate_financials(cursor, admission_ids)
        
        conn.commit()
        print("Database seeded successfully!")
        
    except Exception as e:
        print(f"Error seeding database: {e}")
        if conn:
            conn.rollback()
    finally:
        if 'cursor' in locals() and cursor: cursor.close()
        if 'conn' in locals() and conn: conn.close()

if __name__ == "__main__":
    seed_database()
