from pathlib import Path
from typing import Optional, Dict, Any
import json



def new_default():
    return {"users": [],"user_id": 0}


BASE_DIR = Path(__file__).resolve().parent
DATA_FILE = BASE_DIR / "database" / "users.json"

def load_data() -> Dict[str, Any]:
    if not DATA_FILE.exists():
        return new_default()
    try:
        with open(DATA_FILE, "r", encoding="utf-8") as f:
            if f.read().strip() == "":
                return new_default()
            f.seek(0)
            return json.load(f)
    except (json.JSONDecodeError, OSError):
        return new_default()


def save_data(data: Dict[str, Any]) -> None:
    DATA_FILE.parent.mkdir(parents=True, exist_ok=True)
    temp_file = DATA_FILE.with_suffix(".tmp")

    with open(temp_file, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=4)

    temp_file.replace(DATA_FILE)

def get_user_by_email(email: str) -> Optional[Dict[str, Any]]:
    data = load_data()
    email = email.lower().strip()
    for user in data["users"]:
        if user.get("email", "").lower() == email:
            return user
    return None

def get_user_by_id(user_id: int) -> Optional[Dict[str, Any]]:
    data = load_data()
    user_id = int(user_id)
    for user in data["users"]:
        if user.get("id", -1) == user_id:
            return user
    return None

def create_user(new_user: Dict[str, Any]) -> Dict[str, Any]:
    data = load_data()
    if not new_user:
        raise ValueError("Invalid value!")
    email = new_user["email"].lower().strip()
    if get_user_by_email(email):
        raise ValueError("Email already exists!")
    data["user_id"] += 1
    fields = ["firstname", "lastname", "email", "hashed_password"]
    for field in fields:
        if field not in new_user:
            raise ValueError(f"Missing field {field}")
    user: Dict[str, Any] = {
        "id": data["user_id"],
        "firstname": new_user["firstname"],
        "lastname": new_user["lastname"],
        "email": email,
        "hashed_password": new_user["hashed_password"],
        "completed_texts_count": 0,
        "email_code": new_user["email_code"],
        "is_verified": False
    }
    data["users"].append(user)
    save_data(data)
    user.pop("hashed_password", None)
    return user

def update_user(user_id: int, updates: Dict[str, Any]) -> Dict[str, Any]:
    data = load_data()
    user_id = int(user_id)

    for i, user in enumerate(data["users"]):
        if int(user.get("id")) == user_id:
            for key, value in updates.items():
                user[key] = value

            data["users"][i] = user
            save_data(data)

            safe_user = dict(user)
            safe_user.pop("hashed_password", None)

            return safe_user
    raise ValueError("User not found!")
