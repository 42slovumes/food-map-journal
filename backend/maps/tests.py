"""共編權限與成員管理測試（REST 層）。

驗證「為什麼這樣設計」：viewer 只能讀不能寫、editor 可寫、非成員完全看不到、
只有 owner 能管理成員、成員可自行退出。
"""
import pytest
from django.contrib.auth import get_user_model
from django.core.cache import cache
from rest_framework.test import APIClient

from maps.models import ROLE_EDITOR, ROLE_VIEWER, Category, Collaborator, Map, Place

User = get_user_model()


@pytest.fixture(autouse=True)
def _clear_cache():
    cache.clear()
    yield
    cache.clear()


def make_user(name):
    return User.objects.create_user(
        username=name, email=f"{name}@x.com", password="pw-123456"
    )


def auth(user):
    c = APIClient()
    c.force_authenticate(user)
    return c


@pytest.fixture
def world(db):
    owner = make_user("owner")
    editor = make_user("editor")
    viewer = make_user("viewer")
    stranger = make_user("stranger")
    m = Map.objects.create(owner=owner, name="共享地圖")
    cat = Category.objects.create(map=m, owner=owner, name="拉麵")
    place = Place.objects.create(category=cat, name="店A", created_by=owner, updated_by=owner)
    Collaborator.objects.create(map=m, user=editor, role=ROLE_EDITOR, invited_by=owner)
    Collaborator.objects.create(map=m, user=viewer, role=ROLE_VIEWER, invited_by=owner)
    return {
        "owner": owner, "editor": editor, "viewer": viewer, "stranger": stranger,
        "map": m, "cat": cat, "place": place,
    }


def test_owner_invites_by_email(world):
    newbie = make_user("newbie")
    r = auth(world["owner"]).post(
        f"/api/v1/maps/{world['map'].id}/collaborators/",
        {"email": "newbie@x.com", "role": "editor"},
        format="json",
    )
    assert r.status_code == 201
    assert Collaborator.objects.filter(map=world["map"], user=newbie).exists()


def test_invite_unknown_email_rejected(world):
    r = auth(world["owner"]).post(
        f"/api/v1/maps/{world['map'].id}/collaborators/",
        {"email": "ghost@x.com", "role": "editor"},
        format="json",
    )
    assert r.status_code == 400


def test_non_owner_cannot_invite(world):
    # editor 是成員但非 owner，不能邀請
    r = auth(world["editor"]).post(
        f"/api/v1/maps/{world['map'].id}/collaborators/",
        {"email": "newbie@x.com", "role": "editor"},
        format="json",
    )
    assert r.status_code == 403


def test_editor_can_create_place(world):
    r = auth(world["editor"]).post(
        "/api/v1/places/",
        {"category": world["cat"].id, "name": "editor 新增", "status": "想去"},
        format="json",
    )
    assert r.status_code == 201


def test_viewer_cannot_create_place(world):
    r = auth(world["viewer"]).post(
        "/api/v1/places/",
        {"category": world["cat"].id, "name": "viewer 想新增", "status": "想去"},
        format="json",
    )
    assert r.status_code == 403


def test_viewer_can_read_places(world):
    r = auth(world["viewer"]).get(f"/api/v1/places/?map={world['map'].id}")
    assert r.status_code == 200
    assert r.json()["count"] == 1


def test_viewer_cannot_edit_or_delete_place(world):
    pid = world["place"].id
    patch = auth(world["viewer"]).patch(
        f"/api/v1/places/{pid}/", {"name": "改名"}, format="json"
    )
    assert patch.status_code == 403
    delete = auth(world["viewer"]).delete(f"/api/v1/places/{pid}/")
    assert delete.status_code == 403


def test_stranger_cannot_see_map_or_places(world):
    c = auth(world["stranger"])
    assert c.get(f"/api/v1/maps/{world['map'].id}/").status_code == 404
    assert c.get(f"/api/v1/places/?map={world['map'].id}").json()["count"] == 0


def test_only_owner_changes_role(world):
    collab = Collaborator.objects.get(map=world["map"], user=world["editor"])
    # viewer 不能改別人角色
    bad = auth(world["viewer"]).patch(
        f"/api/v1/maps/{world['map'].id}/collaborators/{collab.id}/",
        {"role": "viewer"}, format="json",
    )
    assert bad.status_code == 403
    # owner 可以
    ok = auth(world["owner"]).patch(
        f"/api/v1/maps/{world['map'].id}/collaborators/{collab.id}/",
        {"role": "viewer"}, format="json",
    )
    assert ok.status_code == 200
    collab.refresh_from_db()
    assert collab.role == ROLE_VIEWER


def test_member_can_leave(world):
    collab = Collaborator.objects.get(map=world["map"], user=world["editor"])
    # editor 移除自己＝退出
    r = auth(world["editor"]).delete(
        f"/api/v1/maps/{world['map'].id}/collaborators/{collab.id}/"
    )
    assert r.status_code == 204
    assert not Collaborator.objects.filter(id=collab.id).exists()


def test_cannot_move_place_to_unauthorized_map(world):
    # IDOR 回歸：editor 不能把地點搬到自己沒權限的別人地圖
    other = make_user("other")
    other_map = Map.objects.create(owner=other, name="別人的地圖")
    other_cat = Category.objects.create(map=other_map, owner=other, name="別人分類")
    r = auth(world["editor"]).patch(
        f"/api/v1/places/{world['place'].id}/", {"category": other_cat.id}, format="json"
    )
    assert r.status_code == 403
    world["place"].refresh_from_db()
    assert world["place"].category_id == world["cat"].id  # 未被搬移


def test_cannot_move_category_to_unauthorized_map(world):
    other = make_user("other2")
    other_map = Map.objects.create(owner=other, name="別人的地圖2")
    r = auth(world["editor"]).patch(
        f"/api/v1/categories/{world['cat'].id}/", {"map": other_map.id}, format="json"
    )
    assert r.status_code == 403
    world["cat"].refresh_from_db()
    assert world["cat"].map_id == world["map"].id


def test_share_enable_and_public_read(world):
    # owner 開啟公開分享
    r = auth(world["owner"]).post(f"/api/v1/maps/{world['map'].id}/share/")
    assert r.status_code == 200 and r.json()["is_shared"] is True
    token = r.json()["share_token"]
    # 免登入即可讀公開地圖
    pub = APIClient().get(f"/api/v1/public/maps/{token}/")
    assert pub.status_code == 200
    body = pub.json()
    assert body["map"]["name"] == "共享地圖"
    assert any(p["name"] == "店A" for p in body["places"])
    # 公開 payload 不外洩私人欄位
    assert "want_reason" not in body["places"][0]
    assert "created_by" not in body["places"][0]
    # 公開分類不外洩內部旗標
    assert "is_public" not in body["categories"][0]
    assert "is_collaborative" not in body["categories"][0]


def test_public_404_when_not_shared(world):
    import uuid as _uuid

    r = APIClient().get(f"/api/v1/public/maps/{_uuid.uuid4()}/")
    assert r.status_code == 404


def test_only_owner_can_share(world):
    r = auth(world["editor"]).post(f"/api/v1/maps/{world['map'].id}/share/")
    assert r.status_code == 403


def test_share_token_only_visible_to_owner(world):
    auth(world["owner"]).post(f"/api/v1/maps/{world['map'].id}/share/")
    owner_view = auth(world["owner"]).get("/api/v1/maps/").json()["results"][0]
    assert owner_view["is_shared"] is True and owner_view["share_token"]
    viewer_view = auth(world["viewer"]).get("/api/v1/maps/").json()["results"][0]
    assert viewer_view["is_shared"] is True
    assert viewer_view["share_token"] is None  # 非 owner 看不到 token


def test_recommendations_groups(world):
    Place.objects.create(
        category=world["cat"], name="高分店", rating=5, status="已去",
        created_by=world["owner"], updated_by=world["owner"],
    )
    r = auth(world["owner"]).get(f"/api/v1/recommendations/?map={world['map'].id}")
    assert r.status_code == 200
    data = r.json()
    assert {"high_rated", "nearby", "wishlist", "friends"} <= set(data)
    assert any(p["name"] == "高分店" for p in data["high_rated"])
    # 推薦精簡序列化器不外洩個人欄位
    assert "want_reason" not in data["high_rated"][0]
    assert "experience_note" not in data["high_rated"][0]


def test_recommendations_friends_from_collab_maps(world):
    # owner 的高評價地點應出現在 editor 的「朋友也收藏」
    Place.objects.create(
        category=world["cat"], name="朋友推的店", rating=5, status="已去",
        created_by=world["owner"], updated_by=world["owner"],
    )
    r = auth(world["editor"]).get("/api/v1/recommendations/")
    assert r.status_code == 200
    assert any(p["name"] == "朋友推的店" for p in r.json()["friends"])


def test_my_role_reported_in_map_list(world):
    owner_maps = auth(world["owner"]).get("/api/v1/maps/").json()["results"]
    assert owner_maps[0]["my_role"] == "owner"
    viewer_maps = auth(world["viewer"]).get("/api/v1/maps/").json()["results"]
    assert viewer_maps[0]["my_role"] == "viewer"
    assert viewer_maps[0]["collaborators_count"] == 2
