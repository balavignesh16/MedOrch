import pandas as pd
import sqlite3
import os

def main():
    print("Starting ETL pipeline for MedOrch Database...")
    
    # Paths
    current_dir = os.path.dirname(__file__)
    csv_path = os.path.abspath(os.path.join(current_dir, '..', 'hospital_readmissions.csv'))
    db_path = os.path.abspath(os.path.join(current_dir, '..', 'database', 'medorch.db'))
    
    # Ensure database directory exists
    os.makedirs(os.path.dirname(db_path), exist_ok=True)
    
    print(f"Loading raw data from: {csv_path}")
    df = pd.read_csv(csv_path)
    
    print("Cleaning and structuring data for SQL...")
    
    # 1. Structural Cleaning
    # Drop columns that have too many missing values or are irrelevant for our analytics
    columns_to_drop = ['weight', 'payer_code', 'medical_specialty']
    df.drop(columns=[col for col in columns_to_drop if col in df.columns], inplace=True)
    
    # 2. Schema normalization
    # We will create a single flattened table for now to enable fast read-only analytics queries.
    # In a full normalized system, we'd split patients and admissions.
    table_name = "hospital_readmissions"
    
    print(f"Connecting to SQLite database at: {db_path}")
    conn = sqlite3.connect(db_path)
    
    # 3. Load into SQLite
    print("Writing 100,000+ rows to SQLite (this may take a moment)...")
    df.to_sql(table_name, conn, if_exists='replace', index=False)
    
    # 4. Create Indexes for fast querying
    print("Creating database indexes for lightning-fast analytics...")
    cursor = conn.cursor()
    cursor.execute(f"CREATE INDEX IF NOT EXISTS idx_age ON {table_name}(age);")
    cursor.execute(f"CREATE INDEX IF NOT EXISTS idx_readmitted ON {table_name}(readmitted);")
    cursor.execute(f"CREATE INDEX IF NOT EXISTS idx_diabetesmed ON {table_name}(diabetesmed);")
    conn.commit()
    
    # Verification
    cursor.execute(f"SELECT COUNT(*) FROM {table_name}")
    count = cursor.fetchone()[0]
    print(f"\nSUCCESS! ETL Pipeline completed. Inserted {count} rows into '{table_name}' table.")
    
    conn.close()

if __name__ == "__main__":
    main()
