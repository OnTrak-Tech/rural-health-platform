# PostgreSQL Setup for Healthcare Platform

## 1. Install PostgreSQL

### Ubuntu/Debian:
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

### macOS:
```bash
brew install postgresql
brew services start postgresql
```

### Docker (Easiest):
```bash
docker run --name healthcare-postgres -e POSTGRES_PASSWORD=password -e POSTGRES_DB=healthcare -p 5432:5432 -d postgres:15
```

## 2. Create Database and User

```bash
# Connect to PostgreSQL
sudo -u postgres psql

# Create database and user
CREATE DATABASE healthcare;
CREATE USER healthcare_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE healthcare TO healthcare_user;
\q
```

## 3. Update Environment Variables

Edit `python-backend/.env`:
```
DATABASE_URL=postgresql://healthcare_user:your_password@localhost:5432/healthcare
```

## 4. Install Dependencies and Start

```bash
cd python-backend
pip install -r requirements.txt
python main.py
```

## 5. Test Database Connection

The app will automatically:
- Create all tables on startup
- Handle user registration
- Store real patient data
- Persist consultations

## Database Schema

**Tables Created:**
- `users` - Patient and doctor accounts
- `patients` - Patient medical profiles
- `consultations` - Video consultation records
- `medical_files` - Uploaded medical documents

## Quick Docker Setup (Recommended)

```bash
# Start PostgreSQL
docker run --name healthcare-postgres -e POSTGRES_PASSWORD=password -e POSTGRES_DB=healthcare -p 5432:5432 -d postgres:15

# Update .env
DATABASE_URL=postgresql://postgres:password@localhost:5432/healthcare

# Start backend
cd python-backend
pip install -r requirements.txt
python main.py
```

Now your healthcare platform uses real PostgreSQL database instead of mock data!