from app import activity


def setup_function():
    activity.clear()
    activity.set_shipping_broken(False)


def test_log_and_since_return_new_entries_only():
    activity.log("fn-a", "first", run_id="run-1")
    first_id = activity.since(0)[-1]["id"]
    activity.log("fn-b", "second")

    entries = activity.since(first_id)

    assert [e["message"] for e in entries] == ["second"]
    assert entries[0]["function"] == "fn-b"
    assert entries[0]["run_id"] is None


def test_clear_removes_entries():
    activity.log("fn-a", "hello")
    activity.clear()
    assert activity.since(0) == []


def test_shipping_toggle():
    assert activity.is_shipping_broken() is False
    activity.set_shipping_broken(True)
    assert activity.is_shipping_broken() is True
