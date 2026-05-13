from datetime import datetime, timezone
import logging
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from backend.base.crm.company.models.company import Company
    from backend.base.crm.users.models.users import User
    from backend.base.crm.partners.models.partners import Partner
    from .lead_stage import LeadStage
    from backend.base.crm.estimates.models.estimate import Estimate

from ...partners.models.contact import Contact
from backend.base.system.dotorm.dotorm.fields import (
    Char,
    Integer,
    Boolean,
    Many2one,
    One2many,
    Selection,
    Text,
)
from backend.base.system.schemas.base_schema import Id
from backend.base.crm.users.audit_mixin import AuditMixin
from backend.base.system.core.enviroment import env
from backend.base.system.dotorm.dotorm.access import get_access_session
from backend.base.crm.security.polymorphic_parent import (
    PolymorphicParentMixin,
)

logger = logging.getLogger(__name__)


class Lead(AuditMixin, PolymorphicParentMixin):
    __table__ = "leads"

    id: Id = Integer(primary_key=True)
    name: str = Char(string="Имя клиента")
    phone: str | None = Char(
        max_length=50, string="Телефон"
    )
    source: str = Selection(
        options=[
            ("avito", "Авито"),
            ("vk", "ВКонтакте"),
            ("site", "Сайт"),
            ("referral", "Сарафан"),
            ("other", "Другое"),
        ],
        default="other",
        string="Источник",
    )
    address: str | None = Text(string="Адрес участка")
    active: bool = Boolean(default=True)
    stage_id: "LeadStage" = Many2one(
        lambda: env.models.lead_stage,
        string="Стадия",
        index=True,
        ondelete="restrict",
    )
    user_id: "User | None" = Many2one(
        lambda: env.models.user,
        string="Ответственный",
        ondelete="restrict",
    )
    notes: str | None = Text(string="Заметки")
    is_frozen: bool = Boolean(
        default=False,
        string="Цены заморожены",
        description="Устанавливается при переходе в стадию Договор",
    )
    estimate_ids: list["Estimate"] = One2many(
        lambda: env.models.estimate,
        "lead_id",
        string="Расчёты",
    )

    async def update(self, payload, fields=None, session=None):
        """
        Override — логируем смену стадии как Activity.
        """
        new_stage = getattr(payload, "stage_id", None)
        old_stage_id = None

        # Проверяем, меняется ли stage_id
        if new_stage is not None and hasattr(new_stage, "id"):
            new_stage_id = new_stage.id
            if new_stage_id:
                # Читаем текущую стадию до обновления
                current = await self.__class__.search(
                    filter=[("id", "=", self.id)],
                    fields=["stage_id"],
                    limit=1,
                )
                if current and current[0].stage_id:
                    old_stage_id = current[0].stage_id.id

        result = await super().update(
            payload, fields=fields, session=session
        )

        # Логируем смену стадии после успешного обновления
        if (
            old_stage_id
            and new_stage is not None
            and hasattr(new_stage, "id")
            and old_stage_id != new_stage.id
        ):
            try:
                await self._log_stage_change(
                    old_stage_id, new_stage.id
                )
            except Exception as e:
                logger.warning(
                    "Failed to log stage change for lead %s: %s",
                    self.id,
                    e,
                )

        return result

    async def _log_stage_change(
        self, old_stage_id: int, new_stage_id: int
    ):
        """Создаёт Activity-запись о смене стадии."""
        Activity = env.models.activity
        ActivityType = env.models.activity_type

        # Получаем названия стадий
        old_stages = await env.models.lead_stage.search(
            filter=[("id", "=", old_stage_id)],
            fields=["name"],
            limit=1,
        )
        new_stages = await env.models.lead_stage.search(
            filter=[("id", "=", new_stage_id)],
            fields=["name"],
            limit=1,
        )
        old_name = old_stages[0].name if old_stages else str(old_stage_id)
        new_name = new_stages[0].name if new_stages else str(new_stage_id)

        # Ищем тип "Смена стадии"
        system_types = await ActivityType.search(
            filter=[("name", "=", "Смена стадии")],
            fields=["id"],
            limit=1,
        )
        type_id = system_types[0].id if system_types else 1

        access_session = get_access_session()
        user_id = (
            access_session.user_id if access_session else None
        )

        now = datetime.now(timezone.utc)

        await Activity.create(
            Activity(
                res_model="leads",
                res_id=self.id,
                activity_type_id=ActivityType(id=type_id),
                user_id=user_id,
                summary=f"{old_name} → {new_name}",
                date_deadline=now,
                state="done",
                done=True,
                done_datetime=now,
                active=True,
                notification_sent=True,
            )
        )
