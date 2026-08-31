from __future__ import annotations

from django.contrib.auth.models import User
from django.db.models.signals import post_save
from django.dispatch import receiver

from apps.access.models import Profile


@receiver(post_save, sender=User)
def create_profile_for_new_user(sender, instance: User, created: bool, **kwargs: object) -> None:
    if created:
        Profile.objects.get_or_create(user=instance)
