import pytest
from fastapi.testclient import TestClient

from app import activity
from app.main import app, inngest_client


@pytest.fixture
def client():
    activity.clear()
    activity.set_shipping_broken(False)
    return TestClient(app)


def test_send_events_adds_seq_when_count_gt_1(client, monkeypatch):
    sent = []

    async def fake_send(events):
        sent.extend(events)
        return [f"id-{i}" for i, _ in enumerate(events)]

    monkeypatch.setattr(inngest_client, "send", fake_send)

    resp = client.post("/api/events", json={"name": "demo/x", "data": {"a": 1}, "count": 3})

    assert resp.status_code == 200
    assert resp.json() == {"ids": ["id-0", "id-1", "id-2"]}
    assert [e.data for e in sent] == [{"a": 1, "seq": 1}, {"a": 1, "seq": 2}, {"a": 1, "seq": 3}]


def test_send_single_event_keeps_data(client, monkeypatch):
    sent = []

    async def fake_send(events):
        sent.extend(events)
        return ["id-0"]

    monkeypatch.setattr(inngest_client, "send", fake_send)

    client.post("/api/events", json={"name": "demo/x", "data": {"a": 1}})

    assert sent[0].data == {"a": 1}


def test_send_events_failure_returns_502(client, monkeypatch):
    async def boom(events):
        raise RuntimeError("dev server down")

    monkeypatch.setattr(inngest_client, "send", boom)

    resp = client.post("/api/events", json={"name": "demo/x"})

    assert resp.status_code == 502
    assert "dev server down" in resp.json()["detail"]


def test_logs_endpoints(client):
    activity.log("fn", "hello")

    assert [e["message"] for e in client.get("/api/logs").json()] == ["hello"]
    assert client.delete("/api/logs").status_code == 204
    assert client.get("/api/logs").json() == []


def test_shipping_toggle_endpoints(client):
    assert client.get("/api/toggles/shipping-broken").json() == {"enabled": False}
    client.put("/api/toggles/shipping-broken", json={"enabled": True})
    assert client.get("/api/toggles/shipping-broken").json() == {"enabled": True}


def test_index_served(client):
    resp = client.get("/")
    assert resp.status_code == 200
    assert "Inngest Demo" in resp.text
