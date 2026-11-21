from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_health_endpoint():
    response = client.get("/api/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"
    assert response.json()["service"] == "GB ELITEX"


def test_ping_is_no_store():
    response = client.get("/api/ping")
    assert response.status_code == 200
    assert response.json()["ok"] is True
    assert "no-store" in response.headers["cache-control"]


def test_download_is_bounded():
    response = client.get("/api/download?size_kb=16")
    assert response.status_code == 200
    assert len(response.content) == 16 * 1024
    assert client.get("/api/download?size_kb=9999").status_code == 400


def test_upload_discards_payload():
    payload = b"test-data" * 100
    response = client.post("/api/upload", content=payload, headers={"content-type": "application/octet-stream"})
    assert response.status_code == 200
    assert response.json()["received_bytes"] == len(payload)
    assert response.json()["stored"] is False


def test_frontend_is_served():
    response = client.get("/")
    assert response.status_code == 200
    assert "GB ELITEX" in response.text


def test_service_worker_can_control_root_scope():
    response = client.get("/static/service-worker.js")
    assert response.status_code == 200
    assert response.headers.get("service-worker-allowed") == "/"
