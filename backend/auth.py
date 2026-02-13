from .schemas import UserRegisterIn, UserLoginIn, UserOut, TokenOut, EmailVerifyIn
from .users import create_user, get_user_by_email, update_user
from .security import hash_password, verify_password, create_access_token
from typing import  Dict, Any
from fastapi import HTTPException
from .mail import send_verification_code

async def register(payload: UserRegisterIn) -> TokenOut:
    user1 = get_user_by_email(payload.email)

    if user1:
        if user1.get("is_verified"):
            raise HTTPException(status_code=409, detail="User already exists!")

        code = await send_verification_code(payload.email)
        user1["email_code"] = code
        update_user(user_id=user1["id"],
                    updates={"email_code": code})

        token = create_access_token(subject=str(user1["id"]))

        user_out = UserOut(
            id= user1["id"],
            firstname= user1.get("firstname"),
            lastname= user1.get("lastname"),
            email= user1.get("email"),
            completed_texts_count= user1.get("completed_texts_count")
        )
        return TokenOut(access_token=token, user=user_out)


    code = await send_verification_code(payload.email)
    hashed = hash_password(payload.password)

    user_data: Dict[str, Any] = {
        "firstname": payload.firstname.strip(),
        "lastname": payload.lastname.strip(),
        "email": payload.email,
        "hashed_password": hashed,
        "email_code": code,
        "is_verified": False
    }
    user = create_user(user_data)
    token = create_access_token(subject=str(user["id"]))

    user_out = UserOut(
        id= user["id"],
        firstname= user.get("firstname"),
        lastname= user.get("lastname"),
        email= user.get("email"),
        completed_texts_count= user.get("completed_texts_count")
    )

    return TokenOut(access_token=token, user=user_out)

def verify_email_code(payload: EmailVerifyIn) -> TokenOut:
    user = get_user_by_email(payload.email)
    if not user:
        raise HTTPException(status_code=404, detail="User not found!")

    if user["is_verified"]:
        return {"message": "User already verified!"}

    saved_code = user.get("email_code")
    if not saved_code:
        raise HTTPException(status_code=400, detail="No verification code. Please register/resend code!")
    if str(payload.code).strip() != str(saved_code).strip():
        raise HTTPException(status_code=400, detail="Invalid verification code!")

    update_user(user_id=user["id"], updates={
        "is_verified": True,
        "email_code": None
    })
    token = create_access_token(subject=str(user["id"]))
    user_out = UserOut(
        id=user["id"],
        firstname=user.get("firstname"),
        lastname=user.get("lastname"),
        email=user.get("email"),
        completed_texts_count=user.get("completed_texts_count", 0)
    )

    return TokenOut(access_token=token, user=user_out)

def login(payload: UserLoginIn) -> TokenOut:
    email = payload.email.lower().strip()
    user = get_user_by_email(email)
    if not user:
        raise HTTPException(status_code=401, detail="Email or Password incorrect")

    if not verify_password(payload.password, user["hashed_password"]):
        raise HTTPException(status_code=401, detail="Email or Password incorrect")
    if not user.get("is_verified", False):
        raise HTTPException(status_code=403, detail="Email not verified")

    token = create_access_token(subject=str(user["id"]))

    user_out = UserOut(
        id= user["id"],
        firstname= user.get("firstname"),
        lastname= user.get("lastname"),
        email= user.get("email"),
        completed_texts_count= user.get("completed_texts_count", 0)
    )
    return TokenOut(access_token=token, user=user_out)