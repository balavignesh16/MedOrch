import os
import psycopg2
from psycopg2.extras import RealDictCursor
from typing import List, Dict, Any

# Database connection parameters (can be overridden by env vars)
DB_PARAMS = {
    "dbname": os.environ.get("DB_NAME", "healthcare_analytics"),
    "user": os.environ.get("DB_USER", "admin"),
    "password": os.environ.get("DB_PASSWORD", "password"),
    "host": os.environ.get("DB_HOST", "localhost"),
    "port": os.environ.get("DB_PORT", "5432")
}

def execute_sql(query: str) -> List[Dict[str, Any]]:
    """
    Executes a SELECT query on the PostgreSQL database and returns the results.
    Strictly restricted to SELECT queries for safety.
    """
    if not query.strip().upper().startswith("SELECT"):
        return [{"error": "Only SELECT queries are allowed."}]
        
    try:
        with psycopg2.connect(**DB_PARAMS) as conn:
            with conn.cursor(cursor_factory=RealDictCursor) as cursor:
                cursor.execute(query)
                results = cursor.fetchall()
                # Convert RealDictRow to standard dict for JSON serialization
                return [dict(row) for row in results]
    except Exception as e:
        return [{"error": f"Database error: {str(e)}"}]

def get_database_schema() -> str:
    """Returns the schema of the database to help the LLM construct valid SQL."""
    return """
Table: patients
- id (INT)
- first_name (VARCHAR)
- last_name (VARCHAR)
- age (INT)
- gender (VARCHAR)
- baseline_risk_score (FLOAT)
- synthetic_ssn (VARCHAR)

Table: admissions
- id (INT)
- patient_id (INT)
- admit_date (DATE)
- discharge_date (DATE)
- department (VARCHAR)
- primary_diagnosis (VARCHAR)
- readmission_status (BOOLEAN)

Table: resources
- id (INT)
- department (VARCHAR)
- total_beds (INT)
- occupied_beds (INT)
- staff_available (INT)

Table: financials
- id (INT)
- admission_id (INT)
- base_cost (NUMERIC)
- complication_multiplier (FLOAT)
"""
