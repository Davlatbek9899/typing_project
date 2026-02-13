from fastapi import APIRouter, Depends, HTTPException, status
from ..schemas import UserRegisterIn, UserLoginIn, EmailVerifyIn, TokenOut, UserOut
from ..auth import register, login, verify_email_code
from ..users import get_user_by_id, update_user
from ..security import decode_access_token
from fastapi.security import OAuth2PasswordBearer
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")


router = APIRouter(prefix="/auth", tags=["Auth"])
@router.post("/register", response_model=TokenOut)
async def user_register(payload: UserRegisterIn):
    return await register(payload)
@router.post("/login", response_model=TokenOut)
def user_login(payload: UserLoginIn):
    return login(payload)
@router.post("/register/verify_email", response_model=TokenOut)
async def verify_email(payload: EmailVerifyIn):
    return  verify_email_code(payload)

def get_current_user(token: str = Depends(oauth2_scheme)):
    """
    1) tokenni decode qiladi
    2) payload ichidan user_id (sub) ni oladi
    3) users.json dan userni topadi
    """
    try:
        payload = decode_access_token(token)  # odatda dict qaytaradi
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user_id = payload.get("sub")
    if user_id is None:
        raise HTTPException(status_code=401, detail="Token payload missing 'sub'")

    user = get_user_by_id(int(user_id))  # sende id int ekan
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    return user


@router.get("/me", response_model=UserOut)
def auth_me(user=Depends(get_current_user)):
    return user


@router.post("/completed", response_model=UserOut)
def auth_completed(user=Depends(get_current_user)):
    new_count = int(user.get("completed_texts_count", 0)) + 1

    # ✅ faqat kerakli fieldni patch qiling
    update_user(user_id=user["id"], updates={"completed_texts_count": new_count})
    # agar update_user boshqa signature bo‘lsa:
    # update_user(user["id"], {"completed_texts_count": new_count})

    # yangilangan userni qayta o‘qib qaytaramiz
    updated = get_user_by_id(int(user["id"]))
    return updated