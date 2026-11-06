from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_health_endpoint():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {
        "status": "ok",
        "service": "civiclens-api",
        "version": "0.1.0",
    }


def test_api_root_describes_foundation():
    response = client.get("/api/v1")
    assert response.status_code == 200
    assert response.json()["name"] == "CivicLens API"
    assert response.json()["status"] == "foundation"


def test_cors_allows_local_web_origin():
    response = client.options(
        "/health",
        headers={
            "Origin": "http://localhost:3000",
            "Access-Control-Request-Method": "GET",
        },
    )
    assert response.status_code == 200
    assert response.headers["access-control-allow-origin"] == "http://localhost:3000"
