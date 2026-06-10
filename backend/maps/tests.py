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


def test_my_role_reported_in_map_list(world):
    owner_maps = auth(world["owner"]).get("/api/v1/maps/").json()["results"]
    assert owner_maps[0]["my_role"] == "owner"
    viewer_maps = auth(world["viewer"]).get("/api/v1/maps/").json()["results"]
    assert viewer_maps[0]["my_role"] == "viewer"
    assert viewer_maps[0]["collaborators_count"] == 2
