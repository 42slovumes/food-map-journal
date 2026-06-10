from django.conf import settings
from django.contrib.auth import get_user_model
from google.auth.transport import requests as google_requests
from google.oauth2 import id_token as google_id_token
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.exceptions import TokenError
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenObtainPairView

from .serializers import (
    EmailTokenObtainPairSerializer,
    RegisterSerializer,
    UserSerializer,
)

User = get_user_model()


class RegisterView(generics.CreateAPIView):
    """使用者註冊。"""

    serializer_class = RegisterSerializer
    permission_classes = [permissions.AllowAny]
    throttle_scope = "auth"


class LoginView(TokenObtainPairView):
    """使用者登入：email + password 取得 JWT。"""

    serializer_class = EmailTokenObtainPairSerializer
    permission_classes = [permissions.AllowAny]
    throttle_scope = "auth"


class MeView(generics.RetrieveUpdateAPIView):
    """取得 / 更新目前登入者的個人資料。"""

    serializer_class = UserSerializer

    def get_object(self):
        return self.request.user

    def get_serializer_context(self):
        return {**super().get_serializer_context(), "request": self.request}


def _unique_username(base: str) -> str:
    base = (base or "user").split("@")[0][:24] or "user"
    username = base
    i = 1
    while User.objects.filter(username=username).exists():
        username = f"{base}{i}"
        i += 1
    return username


class GoogleAuthView(APIView):
    """以 Google Identity Services 的 ID token 登入 / 註冊。

    流程：前端取得 Google ID token (credential) → 後端用 google-auth 驗證
    （檢查簽章、aud=本站 client_id、iss=accounts.google.com、未過期）→
    依 email 找到或建立使用者 → 換發本站自己的 JWT。
    """

    permission_classes = [permissions.AllowAny]
    throttle_scope = "auth"

    def post(self, request):
        client_id = settings.GOOGLE_OAUTH_CLIENT_ID
        if not client_id:
            return Response(
                {"detail": "伺服器尚未設定 Google 登入（GOOGLE_OAUTH_CLIENT_ID）。"},
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )

        credential = request.data.get("credential")
        if not credential:
            return Response({"detail": "缺少 Google credential。"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            idinfo = google_id_token.verify_oauth2_token(
                credential, google_requests.Request(), client_id
            )
        except ValueError:
            return Response(
                {"detail": "Google 憑證驗證失敗或已過期。"},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        # 嚴格驗證必要 claim：email 必須存在且「明確已驗證」(email_verified === True)，
        # sub 必須存在。缺漏或非 True 一律拒絕，避免 None/非布林值繞過。
        email = idinfo.get("email")
        sub = idinfo.get("sub")
        if not email or not sub:
            return Response({"detail": "Google 帳號資訊不完整。"}, status=status.HTTP_400_BAD_REQUEST)
        if idinfo.get("email_verified") is not True:
            return Response(
                {"detail": "此 Google 帳號的 email 尚未驗證。"},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        email = email.lower()
        name = idinfo.get("name") or email.split("@")[0]
        picture = idinfo.get("picture", "")

        user = User.objects.filter(email__iexact=email).first()
        created = False
        if user is None:
            user = User(
                email=email,
                username=_unique_username(email),
                display_name=name,
                google_id=sub,
                avatar_url=picture,
            )
            user.set_unusable_password()
            user.save()
            created = True
        else:
            # 既有帳號（原本可能用 email/密碼）：補綁 google_id 與頭像
            changed = False
            if sub and not user.google_id:
                user.google_id = sub
                changed = True
            if picture and not user.avatar_url:
                user.avatar_url = picture
                changed = True
            if changed:
                user.save()

        refresh = RefreshToken.for_user(user)
        return Response(
            {
                "access": str(refresh.access_token),
                "refresh": str(refresh),
                "user": UserSerializer(user, context={"request": request}).data,
                "created": created,
            }
        )


class LogoutView(APIView):
    """登出：把 refresh token 加入黑名單，立即在伺服器端撤銷。"""

    permission_classes = [permissions.AllowAny]

    def post(self, request):
        token = request.data.get("refresh")
        if token:
            try:
                RefreshToken(token).blacklist()
            except TokenError:
                pass  # 已過期 / 無效，視同已登出
        return Response(status=status.HTTP_205_RESET_CONTENT)
