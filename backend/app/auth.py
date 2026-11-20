import re
from datetime import datetime, timedelta, timezone
import bcrypt
import jwt
from fastapi import Depends, HTTPException, Request, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import joinedload
from .config import settings
from .db import SessionLocal, Role, Permission, RolePermission, User, AuditLog

security = HTTPBearer(auto_error=False)

ROLE_DEFINITIONS = [
    ("MANAGER", "Complete visibility across logistics, dispatch, costs, AI assistant, user management, and audit logs."),
    ("DISPATCH_WORKER", "Dispatch floor scope: assigned dispatch records, dispatch delay alerts, and staging priorities."),
    ("LOGISTICS_PERSONNEL", "Transportation scope: vehicle TAT optimization, corridor delays, carrier performance, and logistics reports."),
]

PERMISSION_DEFINITIONS = [
    ("executive_dashboard", "Executive Dashboard", "Executive"),
    ("dispatch_dashboard", "Dispatch Dashboard & Records", "Dispatch"),
    ("logistics_dashboard", "Logistics & Transportation Dashboard", "Logistics"),
    ("delay_risk", "Predictive Vehicle Delay Alerts", "Delay Risk"),
    ("tat_optimization", "Vehicle TAT Optimization", "TAT"),
    ("dock_allocation", "Smart Dock & Staging Allocation", "Dock"),
    ("dock_approval", "Approve / Reject Staging Assignments", "Dock"),
    ("management_reports", "Management Reports & Cost Exports", "Reports"),
    ("logistics_reports", "Logistics Operational Reports", "Reports"),
    ("carrier_performance", "Carrier Performance & Freight Analytics", "Carriers"),
    ("ai_assistant", "AI Logistics Assistant", "AI Assistant"),
    ("digital_twin", "Interactive 3D Digital Twin", "Digital Twin"),
    ("data_health", "Data Health & Reload Administration", "System"),
    ("agent_architecture", "Agent Architecture & Intelligence Explorer", "Architecture"),
    ("pipeline_monitoring", "Central Data Pipeline Monitoring", "Pipeline"),
    ("rules_configuration", "Configure Agent Business Rules", "Architecture"),
    ("user_management", "Employee & User Management", "Admin"),
    ("audit_logs", "Audit Logs & Permission Matrix", "Admin"),
]

DEFAULT_ROLE_PERMISSIONS = {
    "MANAGER": [p[0] for p in PERMISSION_DEFINITIONS],
    "DISPATCH_WORKER": [
        "dispatch_dashboard",
        "delay_risk",
        "dock_allocation",
        "dock_approval",
        "ai_assistant",
        "digital_twin",
    ],
    "LOGISTICS_PERSONNEL": [
        "dispatch_dashboard",
        "logistics_dashboard",
        "delay_risk",
        "tat_optimization",
        "dock_allocation",
        "logistics_reports",
        "carrier_performance",
        "ai_assistant",
        "digital_twin",
    ],
}


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt(rounds=12)).decode("utf-8")


def verify_password(password: str, password_hash: str) -> bool:
    try:
        return bcrypt.checkpw(password.encode("utf-8"), password_hash.encode("utf-8"))
    except Exception:
        return False


def validate_password_strength(password: str):
    if len(password) < 8:
        raise ValueError("Password must be at least 8 characters long.")
    if not re.search(r"[A-Za-z]", password) or not re.search(r"[0-9]", password):
        raise ValueError("Password must include both letters and numbers.")


def create_access_token(user: User, remember_me: bool = False) -> tuple[str, int]:
    minutes = 10080 if remember_me else settings.access_token_expire_minutes
    now = datetime.now(timezone.utc)
    exp = now + timedelta(minutes=minutes)
    payload = {
        "sub": str(user.id),
        "username": user.username,
        "employee_id": user.employee_id,
        "role": user.role.role_name,
        "plant_id": user.plant_id,
        "iat": int(now.timestamp()),
        "exp": int(exp.timestamp()),
    }
    token = jwt.encode(payload, settings.jwt_secret_key, algorithm=settings.jwt_algorithm)
    return token, minutes * 60


def write_audit_log(user_id: int | None, action: str, module_name: str, details: str | None = None):
    try:
        with SessionLocal() as session:
            session.add(AuditLog(
                user_id=user_id,
                action=action,
                module_name=module_name,
                details=details,
                timestamp=datetime.now(timezone.utc),
            ))
            session.commit()
    except Exception:
        pass


def seed_rbac_and_admin():
    """Seed roles/permissions cleanly and bootstrap the first administrator once."""
    with SessionLocal() as session:
        role_map = {r.role_name: r for r in session.query(Role).all()}
        for rname, desc in ROLE_DEFINITIONS:
            if rname not in role_map:
                r = Role(role_name=rname, description=desc)
                session.add(r)
                session.flush()
                role_map[rname] = r

        perm_map = {p.permission_key: p for p in session.query(Permission).all()}
        for pkey, pname, mod in PERMISSION_DEFINITIONS:
            if pkey not in perm_map:
                p = Permission(permission_key=pkey, permission_name=pname, module_name=mod)
                session.add(p)
                session.flush()
                perm_map[pkey] = p

        # Populate default matrix ONLY for roles with zero existing mappings
        for rname, pkeys in DEFAULT_ROLE_PERMISSIONS.items():
            role_obj = role_map[rname]
            existing_count = session.query(RolePermission).filter_by(role_id=role_obj.id).count()
            if existing_count == 0:
                for pkey in pkeys:
                    session.add(RolePermission(role_id=role_obj.id, permission_id=perm_map[pkey].id))
            elif rname == "MANAGER":
                # Ensure Manager retains newly introduced platform architecture/pipeline permissions
                existing_pids = {rp.permission_id for rp in session.query(RolePermission).filter_by(role_id=role_obj.id).all()}
                for pkey in pkeys:
                    pid = perm_map[pkey].id
                    if pid not in existing_pids:
                        session.add(RolePermission(role_id=role_obj.id, permission_id=pid))

        # One-time administrator bootstrap (disabled automatically once users exist)
        if session.query(User).count() == 0:
            admin_user = settings.initial_admin_username
            admin_pass = settings.initial_admin_password
            if admin_user and admin_pass:
                session.add(User(
                    employee_id="EMP-0001",
                    full_name="Operations Manager",
                    username=admin_user.strip(),
                    email="manager@gwcdata.ai",
                    password_hash=hash_password(admin_pass),
                    role_id=role_map["MANAGER"].id,
                    department="Logistics & Dispatch Management",
                    plant_id="ALL",
                    is_active=True,
                ))
                session.flush()
                session.add(AuditLog(
                    user_id=None,
                    action="BOOTSTRAP_ADMIN_CREATED",
                    module_name="Auth",
                    details=f"Initial administrator '{admin_user}' bootstrapped via server environment.",
                ))

        session.commit()


def get_user_permissions(session, role_id: int) -> list[str]:
    rows_q = (
        session.query(Permission.permission_key)
        .join(RolePermission, RolePermission.permission_id == Permission.id)
        .filter(RolePermission.role_id == role_id)
        .all()
    )
    return sorted([r[0] for r in rows_q])


def serialize_user(user: User, permissions: list[str] | None = None) -> dict:
    return {
        "id": user.id,
        "employee_id": user.employee_id,
        "full_name": user.full_name,
        "username": user.username,
        "email": user.email,
        "role_id": user.role_id,
        "role": user.role.role_name if user.role else None,
        "department": user.department,
        "plant_id": user.plant_id,
        "is_active": user.is_active,
        "permissions": permissions if permissions is not None else [],
        "created_at": user.created_at.isoformat() if user.created_at else None,
        "last_login": user.last_login.isoformat() if user.last_login else None,
    }


def _extract_token(request: Request, creds: HTTPAuthorizationCredentials | None) -> str | None:
    if creds and creds.credentials:
        return creds.credentials
    q_token = request.query_params.get("token")
    return q_token


def get_current_user(
    request: Request,
    creds: HTTPAuthorizationCredentials | None = Depends(security),
) -> dict:
    token = _extract_token(request, creds)
    if not token:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Authentication required.")
    try:
        payload = jwt.decode(token, settings.jwt_secret_key, algorithms=[settings.jwt_algorithm])
        uid = int(payload["sub"])
    except Exception:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired access token.")

    with SessionLocal() as session:
        user = session.query(User).options(joinedload(User.role)).filter_by(id=uid).first()
        if not user:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User account no longer exists.")
        if not user.is_active:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="User account is inactive. Contact Manager.")
        perms = get_user_permissions(session, user.role_id)
        return serialize_user(user, perms)


def require_permissions(*required_any: str):
    """Require at least one of the listed permission keys."""
    def checker(user: dict = Depends(get_current_user)) -> dict:
        if user.get("role") == "MANAGER" and "user_management" in user.get("permissions", []):
            return user
        user_perms = set(user.get("permissions", []))
        if any(req in user_perms for req in required_any):
            return user
        write_audit_log(
            user["id"],
            "ACCESS_DENIED",
            ",".join(required_any),
            f"Role {user.get('role')} attempted unauthorized access requiring {required_any}",
        )
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Access denied. Role '{user.get('role')}' lacks required permission ({', '.join(required_any)}).",
        )
    return checker

