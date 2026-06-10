from django.contrib.auth import get_user_model
from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

User = get_user_model()


class UserSerializer(serializers.ModelSerializer):
    avatar_image = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ["id", "username", "email", "display_name", "avatar", "avatar_url", "avatar_image"]
        read_only_fields = ["id", "avatar_url", "avatar_image"]

    def get_avatar_image(self, obj):
        """統一頭像來源：優先上傳檔，否則用第三方頭像連結。"""
        if obj.avatar:
            request = self.context.get("request")
            url = obj.avatar.url
            return request.build_absolute_uri(url) if request else url
        return obj.avatar_url or None


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8, style={"input_type": "password"})

    class Meta:
        model = User
        fields = ["id", "username", "email", "display_name", "password"]

    def validate_email(self, value):
        if User.objects.filter(email__iexact=value).exists():
            raise serializers.ValidationError("此電子郵件已被註冊。")
        return value

    def create(self, validated_data):
        password = validated_data.pop("password")
        # username 預設用 email 前綴，避免使用者一定要填
        if not validated_data.get("username"):
            base = validated_data["email"].split("@")[0]
            username = base
            i = 1
            while User.objects.filter(username=username).exists():
                username = f"{base}{i}"
                i += 1
            validated_data["username"] = username
        user = User(**validated_data)
        user.set_password(password)
        user.save()
        return user


class EmailTokenObtainPairSerializer(TokenObtainPairSerializer):
    """以 email + password 取得 JWT，並一併回傳使用者資料。"""

    username_field = User.USERNAME_FIELD

    def validate(self, attrs):
        data = super().validate(attrs)
        data["user"] = UserSerializer(self.user).data
        return data
