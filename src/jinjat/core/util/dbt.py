from typing import Optional

from pydantic import BaseModel


class DbtTarget(BaseModel):
    project_dir: str
    profiles_dir: str
    target: Optional[str]