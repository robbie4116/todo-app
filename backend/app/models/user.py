from datetime import datetime, timezone
from typing import Optional


class User:
    """User model for MongoDB"""

    @staticmethod
    def create(
        email: str,
        name: str,
        hashed_password: Optional[str] = None,
        auth_provider: str = "local",
        google_id: Optional[str] = None,
    ) -> dict:
        doc = {
            "email": email.lower(),
            "name": name,
            "auth_provider": auth_provider,
            "google_id": google_id,
            "created_at": datetime.now(timezone.utc),
        }

        if hashed_password:
            doc["hashed_password"] = hashed_password

        return doc

    @staticmethod
    def to_dict(user_doc: dict) -> dict:
        """Convert MongoDB document to dict"""
        if user_doc:
            user_doc = dict(user_doc)
            user_doc["id"] = str(user_doc["_id"])
            del user_doc["_id"]
            user_doc.pop("hashed_password", None)
            user_doc.pop("google_id", None)
            user_doc.pop("auth_provider", None)
        return user_doc
