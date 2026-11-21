from __future__ import annotations

from datetime import datetime, timezone
from pathlib import Path

from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import FileResponse, JSONResponse, Response
from fastapi.staticfiles import StaticFiles

BASE_DIR = Path(__file__).resolve().parent
STATIC_DIR = BASE_DIR / "static"
APP_VERSION = "0.1.0"
MAX_TRANSFER_BYTES = 1024 * 1024

app = FastAPI(
    title="GB ELITEX API",
    description=(
        "Early-stage connectivity diagnostics platform. The current browser test "
        "measures the path between the user's browser and this GB ELITEX service only."
    ),
    version=APP_VERSION,
    docs_url="/api/docs",
    redoc_url=None,
)


@app.middleware("http")
async def add_security_headers(request: Request, call_next):
    response = await call_next(request)
    response.headers.setdefault("X-Content-Type-Options", "nosniff")
    response.headers.setdefault("X-Frame-Options", "DENY")
    response.headers.setdefault("Referrer-Policy", "strict-origin-when-cross-origin")
    response.headers.setdefault("Permissions-Policy", "camera=(), microphone=(), geolocation=()")
    if request.url.path == "/static/service-worker.js":
        response.headers["Service-Worker-Allowed"] = "/"
    return response


@app.get("/api/health", tags=["system"])
async def health():
    """Lightweight health check used by Render."""
    return {
        "status": "ok",
        "service": "GB ELITEX",
        "version": APP_VERSION,
        "timestamp_utc": datetime.now(timezone.utc).isoformat(),
    }


@app.get("/api/ping", tags=["diagnostics"])
async def ping():
    """Small no-cache response for browser-to-service RTT sampling."""
    return JSONResponse(
        {
            "ok": True,
            "service": "gb-elitex",
            "timestamp_utc": datetime.now(timezone.utc).isoformat(),
        },
        headers={"Cache-Control": "no-store, no-cache, must-revalidate", "Pragma": "no-cache"},
    )


@app.get("/api/download", tags=["diagnostics"])
async def download_payload(size_kb: int = 256):
    """Return a bounded payload for a user-triggered service-path throughput sample."""
    if not 16 <= size_kb <= 1024:
        raise HTTPException(status_code=400, detail="size_kb must be between 16 and 1024")
    size_bytes = size_kb * 1024
    payload = b"G" * size_bytes
    return Response(
        content=payload,
        media_type="application/octet-stream",
        headers={
            "Content-Length": str(size_bytes),
            "Cache-Control": "no-store, no-cache, must-revalidate",
            "X-GB-ELITEX-Test": "service-path-download",
        },
    )


@app.post("/api/upload", tags=["diagnostics"])
async def upload_payload(request: Request):
    """Accept and discard a bounded payload; no user payload is stored."""
    content_length = request.headers.get("content-length")
    if content_length:
        try:
            if int(content_length) > MAX_TRANSFER_BYTES:
                raise HTTPException(status_code=413, detail="Upload limit is 1 MiB")
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid Content-Length header")

    received_bytes = 0
    async for chunk in request.stream():
        received_bytes += len(chunk)
        if received_bytes > MAX_TRANSFER_BYTES:
            raise HTTPException(status_code=413, detail="Upload limit is 1 MiB")
    return JSONResponse(
        {
            "ok": True,
            "received_bytes": received_bytes,
            "stored": False,
            "note": "Payload was measured and discarded; it was not saved.",
        },
        headers={"Cache-Control": "no-store"},
    )


@app.get("/", include_in_schema=False)
async def home():
    return FileResponse(STATIC_DIR / "index.html")


app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")
