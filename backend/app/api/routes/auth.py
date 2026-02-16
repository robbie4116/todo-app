from fastapi import APIRouter, HTTPException, status
from google.oauth2 import id_token
from google.auth.transport import requests as google_requests

from app.schemas.user import UserCreate, UserLogin, GoogleAuthRequest, Token
from app.models.user import User
from app.core.security import verify_password, get_password_hash, create_access_token
from app.core.database import get_database
from app.core.config import settings

router = APIRouter()


@router.post("/register", response_model=Token, status_code=status.HTTP_201_CREATED)
async def register(user: UserCreate):
    db = get_database()

    existing_user = db.users.find_one({"email": user.email.lower()})
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User with this email already exists"
        )

    hashed_password = get_password_hash(user.password)

    user_doc = User.create(
        email=user.email,
        name=user.name,
        hashed_password=hashed_password,
        auth_provider="local",
    )

    result = db.users.insert_one(user_doc)
    user_doc["_id"] = result.inserted_id

    access_token = create_access_token(data={"sub": user.email.lower()})
    user_response = User.to_dict(user_doc)

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": user_response
    }


@router.post("/login", response_model=Token)
async def login(user: UserLogin):
    db = get_database()

    user_doc = db.users.find_one({"email": user.email.lower()})
    if not user_doc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials"
        )

    # Google-only account: must sign in with Google
    if not user_doc.get("hashed_password"):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="This account uses Google sign-in"
        )

    if not verify_password(user.password, user_doc["hashed_password"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials"
        )

    access_token = create_access_token(data={"sub": user.email.lower()})
    user_response = User.to_dict(user_doc)

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": user_response
    }


@router.post("/google", response_model=Token)
async def google_auth(payload: GoogleAuthRequest):
    db = get_database()

    try:
        google_payload = id_token.verify_oauth2_token(
            payload.credential,
            google_requests.Request(),
            settings.GOOGLE_CLIENT_ID,
        )
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid Google token"
        )

    issuer = google_payload.get("iss")
    if issuer not in ("accounts.google.com", "https://accounts.google.com"):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token issuer"
        )

    if not google_payload.get("email_verified", False):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Google email is not verified"
        )

    email = google_payload.get("email", "").lower()
    name = google_payload.get("name") or "Google User"
    google_id = google_payload.get("sub")

    if not email or not google_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid Google token payload"
        )

    user_doc = db.users.find_one({"email": email})

    if user_doc:
        # Link existing local user to Google (optional policy)
        if not user_doc.get("google_id"):
            db.users.update_one(
                {"_id": user_doc["_id"]},
                {"$set": {"google_id": google_id, "auth_provider": "google"}}
            )
            user_doc = db.users.find_one({"_id": user_doc["_id"]})
    else:
        new_user = User.create(
            email=email,
            name=name,
            auth_provider="google",
            google_id=google_id,
        )
        result = db.users.insert_one(new_user)
        new_user["_id"] = result.inserted_id
        user_doc = new_user

    access_token = create_access_token(data={"sub": email})
    user_response = User.to_dict(user_doc)

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": user_response
    }
