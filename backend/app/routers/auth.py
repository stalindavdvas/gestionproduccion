from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from fastapi.security import OAuth2PasswordRequestForm
from app.database import get_db
from app.models import Usuario
from app.auth_utils import verify_password, create_access_token, get_password_hash

router = APIRouter(tags=["Autenticación"])


@router.post("/token")
async def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(Usuario).filter(Usuario.username == form_data.username).first()

    # Validar usuario y contraseña
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Usuario o contraseña incorrectos",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Crear token con el ROL
    access_token = create_access_token(data={"sub": user.username, "rol": user.rol})
    return {"access_token": access_token, "token_type": "bearer", "rol": user.rol, "username": user.username}


# Endpoint temporal para crear el primer admin (ÚSALO UNA VEZ Y BÓRRALO O PROTÉGELO)
@router.post("/crear-admin-inicial")
def crear_admin(db: Session = Depends(get_db)):
    if db.query(Usuario).filter_by(username="admin").first():
        return {"mensaje": "El admin ya existe"}

    nuevo_usuario = Usuario(
        username="admin",
        hashed_password=get_password_hash("admin2026"),  # 👈 CONTRASEÑA POR DEFECTO
        rol="admin"
    )
    db.add(nuevo_usuario)

    nuevo_jefe = Usuario(
        username="jefe",
        hashed_password=get_password_hash("jefe1234"),
        rol="mantenimiento"
    )
    db.add(nuevo_jefe)

    db.commit()
    return {"mensaje": "Usuarios creados: admin/admin2026 y jefe/jefe1234"}