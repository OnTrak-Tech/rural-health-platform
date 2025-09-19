#!/usr/bin/env python3
"""
Database migration script to add missing columns to medical_files table
Run this script to update the database schema for the medical history feature
"""

import os
import sys
from sqlalchemy import create_engine, text
from dotenv import load_dotenv

load_dotenv()

def migrate_database():
    DATABASE_URL = os.getenv("DATABASE_URL")
    if not DATABASE_URL:
        print("ERROR: DATABASE_URL environment variable is not set")
        sys.exit(1)
    
    engine = create_engine(DATABASE_URL)
    
    try:
        with engine.connect() as conn:
            # Check if columns already exist
            result = conn.execute(text("""
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_name = 'medical_files' 
                AND column_name IN ('consultation_id', 'description', 'category')
            """))
            existing_columns = [row[0] for row in result]
            
            # Add missing columns
            if 'consultation_id' not in existing_columns:
                print("Adding consultation_id column...")
                conn.execute(text("""
                    ALTER TABLE medical_files 
                    ADD COLUMN consultation_id INTEGER REFERENCES consultations(id)
                """))
                conn.commit()
                print("✓ consultation_id column added")
            
            if 'description' not in existing_columns:
                print("Adding description column...")
                conn.execute(text("""
                    ALTER TABLE medical_files 
                    ADD COLUMN description TEXT
                """))
                conn.commit()
                print("✓ description column added")
            
            if 'category' not in existing_columns:
                print("Adding category column...")
                conn.execute(text("""
                    ALTER TABLE medical_files 
                    ADD COLUMN category VARCHAR(50)
                """))
                conn.commit()
                print("✓ category column added")
            
            # Create medical_file_access table if it doesn't exist
            conn.execute(text("""
                CREATE TABLE IF NOT EXISTS medical_file_access (
                    id SERIAL PRIMARY KEY,
                    medical_file_id INTEGER REFERENCES medical_files(id),
                    doctor_id INTEGER REFERENCES users(id),
                    consultation_id INTEGER REFERENCES consultations(id),
                    access_type VARCHAR(20),
                    ip_address VARCHAR(45),
                    accessed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            """))
            conn.commit()
            print("✓ medical_file_access table created/verified")
            
            print("\n🎉 Database migration completed successfully!")
            print("You can now restart the backend server.")
            
    except Exception as e:
        print(f"❌ Migration failed: {str(e)}")
        sys.exit(1)

if __name__ == "__main__":
    migrate_database()