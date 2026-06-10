from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    """自訂使用者：以 email 為主要識別，保留 username 相容性。"""

    email = models.EmailField("電子郵件", unique=True)
    display_name = models.CharField("顯示名稱", max_length=60, blank=True)
    avatar = models.ImageField("頭像", upload_to="avatars/", blank=True, null=True)
    # 第三方登入綁定（Google 的 sub）；email 帳密使用者為空字串
    google_id = models.CharField("Google ID", max_length=64, blank=True, default="")
    avatar_url = models.URLField("頭像連結", max_length=500, blank=True, default="")

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = ["username"]

    class Meta:
        verbose_name = "使用者"
        verbose_name_plural = "使用者"

    def __str__(self) -> str:
        return self.display_name or self.email

    def save(self, *args, **kwargs):
        # email 一律正規化成小寫（杜絕大小寫造成的重複/誤配帳號）
        if self.email:
            self.email = self.email.lower()
        if not self.display_name:
            self.display_name = self.username or self.email.split("@")[0]
        super().save(*args, **kwargs)
