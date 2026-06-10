"""Google 登入端點測試。

用 mock 取代真實的 Google ID token 驗證，聚焦在「我們的邏輯為什麼這樣」：
未設定金鑰要優雅停用、無效憑證要擋下、新帳號自動建立且為不可用密碼、
既有 email 帳號要被『連結』而非重複建立。
"""
from unittest.mock import patch

import pytest
from django.contrib.auth import get_user_model
from django.core.cache import cache
from django.test import override_settings
from rest_framework.test import APIClient

User = get_user_model()
URL = "/api/v1/auth/google/"
GOOGLE = "accounts.views.google_id_token.verify_oauth2_token"


@pytest.fixture(autouse=True)
def clear_throttle_cache():
    # 認證端點有 rate limiting；清掉 cache 避免限流計數在測試間累積
    cache.clear()
    yield
    cache.clear()


@pytest.fixture
def client():
    return APIClient()


@pytest.mark.django_db
@override_settings(GOOGLE_OAUTH_CLIENT_ID="")
def test_disabled_when_no_client_id(client):
    # 未設定金鑰時不能讓使用者誤以為能用 → 明確回 503
    r = client.post(URL, {"credential": "x"}, format="json")
    assert r.status_code == 503


@pytest.mark.django_db
@override_settings(GOOGLE_OAUTH_CLIENT_ID="dummy.apps.googleusercontent.com")
def test_missing_credential(client):
    r = client.post(URL, {}, format="json")
    assert r.status_code == 400


@pytest.mark.django_db
@override_settings(GOOGLE_OAUTH_CLIENT_ID="dummy")
@patch(GOOGLE, side_effect=ValueError("bad token"))
def test_invalid_token_rejected(_mock, client):
    # 偽造 / 過期憑證必須擋下，不可放行
    r = client.post(URL, {"credential": "forged"}, format="json")
    assert r.status_code == 401


@pytest.mark.django_db
@override_settings(GOOGLE_OAUTH_CLIENT_ID="dummy")
@patch(GOOGLE)
def test_unverified_email_rejected(mock_verify, client):
    mock_verify.return_value = {"email": "x@example.com", "email_verified": False, "sub": "1"}
    r = client.post(URL, {"credential": "ok"}, format="json")
    assert r.status_code == 401


@pytest.mark.django_db
@override_settings(GOOGLE_OAUTH_CLIENT_ID="dummy")
@patch(GOOGLE)
def test_missing_email_verified_claim_rejected(mock_verify, client):
    # claim 缺失時 .get() 回 None；必須拒絕，不可放行（這是審查抓到的關鍵漏洞）
    mock_verify.return_value = {"email": "missing@example.com", "sub": "1"}
    r = client.post(URL, {"credential": "ok"}, format="json")
    assert r.status_code == 401
    assert not User.objects.filter(email="missing@example.com").exists()


@pytest.mark.django_db
@override_settings(GOOGLE_OAUTH_CLIENT_ID="dummy")
@patch(GOOGLE)
def test_missing_sub_rejected(mock_verify, client):
    mock_verify.return_value = {"email": "nosub@example.com", "email_verified": True}
    r = client.post(URL, {"credential": "ok"}, format="json")
    assert r.status_code == 400


@pytest.mark.django_db
def test_logout_blacklists_refresh_token(client):
    User.objects.create_user(username="lo", email="lo@example.com", password="pw-123456")
    login = client.post(
        "/api/v1/auth/login/", {"email": "lo@example.com", "password": "pw-123456"}, format="json"
    )
    refresh = login.json()["refresh"]

    out = client.post("/api/v1/auth/logout/", {"refresh": refresh}, format="json")
    assert out.status_code == 205

    # 已撤銷的 refresh token 不能再換新 access token
    again = client.post("/api/v1/auth/refresh/", {"refresh": refresh}, format="json")
    assert again.status_code == 401


@pytest.mark.django_db
@override_settings(GOOGLE_OAUTH_CLIENT_ID="dummy")
@patch(GOOGLE)
def test_creates_new_user_with_unusable_password(mock_verify, client):
    mock_verify.return_value = {
        "email": "newg@example.com",
        "email_verified": True,
        "sub": "google-123",
        "name": "G User",
        "picture": "http://img/p.png",
    }
    r = client.post(URL, {"credential": "ok"}, format="json")
    assert r.status_code == 200
    data = r.json()
    assert data["access"] and data["refresh"]
    assert data["created"] is True
    assert data["user"]["email"] == "newg@example.com"
    assert data["user"]["display_name"] == "G User"

    u = User.objects.get(email="newg@example.com")
    assert u.google_id == "google-123"
    # Google 使用者不應有可用密碼（不能用 email/密碼登入）
    assert not u.has_usable_password()


@pytest.mark.django_db
@override_settings(GOOGLE_OAUTH_CLIENT_ID="dummy")
@patch(GOOGLE)
def test_links_existing_email_account(mock_verify, client):
    # 既有 email/密碼帳號用同一 email 透過 Google 登入 → 連結，不重建
    existing = User.objects.create_user(
        username="exist", email="exist@example.com", password="pw-123456"
    )
    mock_verify.return_value = {
        "email": "exist@example.com",
        "email_verified": True,
        "sub": "google-999",
        "name": "Exist",
    }
    r = client.post(URL, {"credential": "ok"}, format="json")
    assert r.status_code == 200
    assert r.json()["created"] is False
    assert User.objects.filter(email="exist@example.com").count() == 1
    existing.refresh_from_db()
    assert existing.google_id == "google-999"
    # 原本的密碼登入仍可用
    assert existing.has_usable_password()
