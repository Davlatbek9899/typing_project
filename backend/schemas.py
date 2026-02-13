from pydantic import BaseModel, EmailStr, Field, model_validator


class UserRegisterIn(BaseModel):
    firstname: str = Field(..., min_length=3, max_length=30)
    lastname: str = Field(..., min_length=3, max_length=30)
    email: EmailStr
    password: str = Field(..., min_length=6, max_length=128)
    confirm_password: str = Field(..., min_length=6, max_length=128)

    @model_validator(mode="after")
    def password_match(self):
        if self.password != self.confirm_password:
            raise ValueError("Passwords do not match")
        return self

class EmailVerifyIn(BaseModel):
    email: EmailStr
    code: str = Field(..., min_length=6, max_length=6)

class UserLoginIn(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=6, max_length=128)

class UserOut(BaseModel):
    id: int
    firstname: str
    lastname: str
    email: EmailStr
    completed_texts_count: int


class TokenOut(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut

