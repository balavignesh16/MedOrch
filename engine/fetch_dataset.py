import pandas as pd
import os
import urllib.request
import zipfile

def main():
    print("Fetching 'Diabetes 130-US hospitals for years 1999-2008' dataset from UCI ML Repository...")
    zip_url = "https://archive.ics.uci.edu/ml/machine-learning-databases/00296/dataset_diabetes.zip"
    
    current_dir = os.path.dirname(__file__)
    zip_path = os.path.join(current_dir, "dataset_diabetes.zip")
    extract_dir = os.path.join(current_dir, "diabetes_data")
    
    print(f"Downloading from {zip_url}...")
    urllib.request.urlretrieve(zip_url, zip_path)
    
    print("Extracting dataset...")
    with zipfile.ZipFile(zip_path, 'r') as zip_ref:
        zip_ref.extractall(extract_dir)
    
    csv_path = os.path.join(extract_dir, "dataset_diabetes", "diabetic_data.csv")
    if not os.path.exists(csv_path):
        # Try another common path structure in the zip
        csv_path = os.path.join(extract_dir, "diabetic_data.csv")
        
    print("Loading dataset into pandas...")
    full_df = pd.read_csv(csv_path)
    print(f"Total dataset shape: {full_df.shape}")
    
    print("Performing initial data cleaning...")
    full_df.replace('?', pd.NA, inplace=True)
    
    full_df.columns = [
        col.replace('-', '_').replace(' ', '_').lower() 
        for col in full_df.columns
    ]
    
    output_path = os.path.abspath(os.path.join(current_dir, '..', 'hospital_readmissions.csv'))
    full_df.to_csv(output_path, index=False)
    
    print(f"\nSUCCESS! Dataset saved to: {output_path}")
    print("\n--- First 5 Rows Preview ---")
    print(full_df.head())

if __name__ == "__main__":
    main()

