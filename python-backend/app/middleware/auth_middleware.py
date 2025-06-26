from fastapi import HTTPException, status, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import JWTError, jwt
import os
import pyotp
from datetime import datetime

security = HTTPBearer()

def verify_token(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        payload = jwt.decode(credentials.credentials, os.getenv("JWT_SECRET"), algorithms=["HS256"])
        return payload
    except JWTError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")

def get_current_user(token_data: dict = Depends(verify_token)):
    return token_data

def verify_mfa(token: str, secret: str) -> bool:
    totp = pyotp.TOTP(secret)
    return totp.verify(token)

def generate_mfa_secret():
    return pyotp.random_base32()

def audit_log(action: str, user_id: int, details: dict = None):
    log_entry = {
        "timestamp": datetime.utcnow().isoformat(),
        "action": action,
        "user_id": user_id,
        "details": details or {}
    }
    print(f"AUDIT: {log_entry}")
    return log_entry