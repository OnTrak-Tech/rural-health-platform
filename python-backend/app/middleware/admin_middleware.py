from fastapi import HTTPException, Depends
from sqlalchemy.orm import Session
from ..database_enhanced import get_db, User, Admin
from .auth_middleware import get_current_user

def get_current_admin(current_user: dict = Depends(get_current_user), db: Session = Depends(get_db)):
    """Verify current user has admin privileges"""
    
    # Check if user has admin role
    if current_user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    # Verify admin record exists
    admin = db.query(Admin).join(User).filter(User.id == current_user["id"]).first()
    if not admin:
        raise HTTPException(status_code=403, detail="Admin privileges not found")
    
    return current_user

def require_admin_permission(permission: str):
    """Decorator to require specific admin permission"""
    def permission_checker(current_admin: dict = Depends(get_current_admin), db: Session = Depends(get_db)):
        admin = db.query(Admin).join(User).filter(User.id == current_admin["id"]).first()
        
        if permission not in (admin.permissions or []):
            raise HTTPException(
                status_code=403, 
                detail=f"Permission '{permission}' required"
            )
        
        return current_admin
    
    return permission_checker