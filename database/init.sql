CREATE TABLE patients (
    patient_id SERIAL PRIMARY KEY,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    date_of_birth DATE NOT NULL,
    gender VARCHAR(10),
    insurance_provider VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE admissions (
    admission_id SERIAL PRIMARY KEY,
    patient_id INT REFERENCES patients(patient_id),
    admission_date TIMESTAMP NOT NULL,
    discharge_date TIMESTAMP,
    department VARCHAR(50) NOT NULL,
    diagnosis TEXT,
    readmission_risk_score DECIMAL(5, 2),
    cost DECIMAL(10, 2)
);

CREATE TABLE staff (
    staff_id SERIAL PRIMARY KEY,
    first_name VARCHAR(50),
    last_name VARCHAR(50),
    role VARCHAR(50),
    department VARCHAR(50),
    shift_start TIME,
    shift_end TIME
);

CREATE TABLE compliance_logs (
    log_id SERIAL PRIMARY KEY,
    action VARCHAR(255),
    user_role VARCHAR(50),
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(20)
);
