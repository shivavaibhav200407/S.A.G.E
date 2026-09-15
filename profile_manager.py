import json
import os
from pydantic import BaseModel, Field
from typing import List

PROFILE_FILE = "user_profile.json"

class UserProfile(BaseModel):
    user_name: str = "Vaibhav"
    target_topic: str = "Agentic AI & RAG"
    skill_level: int = Field(default=1, ge=1, le=5)
    preferred_style: str = "Practical & Code-First"
    current_state: str = "TEACHING"
    weak_topics: List[str] = Field(default_factory=list)
    completed_modules: List[str] = Field(default_factory=list)
    prerequisite_gaps: List[str] = Field(default_factory=list)

def load_profile() -> UserProfile:
    if not os.path.exists(PROFILE_FILE):
        profile = UserProfile()
        save_profile(profile)
        return profile
    with open(PROFILE_FILE, "r") as f:
        data = json.load(f)
        return UserProfile(**data)

def save_profile(profile: UserProfile):
    with open(PROFILE_FILE, "w") as f:
        json.dump(profile.model_dump(), f, indent=4)