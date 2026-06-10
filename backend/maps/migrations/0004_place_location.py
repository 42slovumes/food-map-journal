import django.contrib.gis.db.models.fields
from django.db import migrations


def create_postgis(apps, schema_editor):
    # 僅 PostgreSQL 需要 postgis 擴充；SpatiaLite 由後端自動初始化空間中繼資料
    if schema_editor.connection.vendor == "postgresql":
        schema_editor.execute("CREATE EXTENSION IF NOT EXISTS postgis")


def populate_location(apps, schema_editor):
    from django.contrib.gis.geos import Point

    Place = apps.get_model("maps", "Place")
    for p in Place.objects.exclude(latitude__isnull=True).exclude(longitude__isnull=True):
        p.location = Point(p.longitude, p.latitude, srid=4326)
        p.save(update_fields=["location"])


class Migration(migrations.Migration):
    dependencies = [
        ("maps", "0003_map_share_token"),
    ]

    operations = [
        migrations.RunPython(create_postgis, migrations.RunPython.noop),
        migrations.AddField(
            model_name="place",
            name="location",
            field=django.contrib.gis.db.models.fields.PointField(
                blank=True, geography=False, null=True, srid=4326, verbose_name="座標點"
            ),
        ),
        migrations.RunPython(populate_location, migrations.RunPython.noop),
    ]
