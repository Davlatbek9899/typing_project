import os
import secrets
from dotenv import load_dotenv
from pydantic import EmailStr
from fastapi_mail import FastMail, MessageSchema, ConnectionConfig

load_dotenv()

conf = ConnectionConfig(
    MAIL_USERNAME=os.getenv("MAIL_USERNAME"),
    MAIL_PASSWORD=os.getenv("MAIL_PASSWORD"),
    MAIL_FROM=os.getenv("MAIL_FROM"),
    MAIL_PORT=int(os.getenv("MAIL_PORT", "587")),
    MAIL_SERVER=os.getenv("MAIL_SERVER", "smtp.gmail.com"),
    MAIL_STARTTLS=True,
    MAIL_SSL_TLS=False,
    USE_CREDENTIALS=True,
)

def generate_code(length: int = 6) -> str:
    """6 xonali verification code (masalan: 482913)"""
    max_num = 10 ** length
    return f"{secrets.randbelow(max_num):0{length}d}"

async def send_verification_code(to_email: EmailStr) -> str:
    """
    Emailga kod yuboradi.
    Qaytishda kodni ham qaytaradi (keyin tekshirish uchun).
    """
    code = generate_code(6)

    message = MessageSchema(
        subject="Verification Code",
        recipients=[to_email],
        body=f"Sizning tasdiqlash kodingiz: {code}",
        subtype="plain",
    )

    fm = FastMail(conf)
    await fm.send_message(message)

    return code
