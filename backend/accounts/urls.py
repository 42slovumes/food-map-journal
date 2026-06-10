from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView

from .views import GoogleAuthView, LoginView, MeView, RegisterView

urlpatterns = [
    path("auth/register/", RegisterView.as_view(), name="register"),
    path("auth/login/", LoginView.as_view(), name="login"),
    path("auth/google/", GoogleAuthView.as_view(), name="google_login"),
    path("auth/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
    path("auth/me/", MeView.as_view(), name="me"),
]
