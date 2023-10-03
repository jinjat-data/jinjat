from fastapi import FastAPI
from fastapi.responses import HTMLResponse
from pathlib import Path

def serve_nextjs_app(app: FastAPI):
    @app.get("/{path:path}", response_class=HTMLResponse)
    async def read_dynamic(path: str):
        return Path("index.html").read_text()