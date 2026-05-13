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
        При переходе в стадию «Договор» замораживаем цены расчётов.
        При уходе из «Договор» — размораживаем.
        """
        new_stage = getattr(payload, "stage_id", None)
        old_stage_id = None
        old_stage_name = None
        new_stage_name = None

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

        # Логируем смену стадии и обрабатываем заморозку
        if (
            old_stage_id
            and new_stage is not None
            and hasattr(new_stage, "id")
            and old_stage_id != new_stage.id
        ):
            # Получаем названия стадий для логирования и проверки
            old_stages = await env.models.lead_stage.search(
                filter=[("id", "=", old_stage_id)],
                fields=["name"],
                limit=1,
            )
            new_stages = await env.models.lead_stage.search(
                filter=[("id", "=", new_stage.id)],
                fields=["name"],
                limit=1,
            )
            old_stage_name = (
                old_stages[0].name if old_stages else None
            )
            new_stage_name = (
                new_stages[0].name if new_stages else None
            )

            try:
                await self._log_stage_change_by_name(
                    old_stage_name or str(old_stage_id),
                    new_stage_name or str(new_stage.id),
                )
            except Exception as e:
                logger.warning(
                    "Failed to log stage change for lead %s: %s",
                    self.id,
                    e,
                )

            # Заморозка/разморозка цен
            try:
                await self._handle_freeze(
                    old_stage_name, new_stage_name
                )
            except Exception as e:
                logger.warning(
                    "Failed to handle price freeze for lead %s: %s",
                    self.id,
                    e,
                )

        return result

    async def _handle_freeze(
        self, old_stage_name: str | None, new_stage_name: str | None
    ):
        """Замораживает/размораживает цены при смене стадии."""
        FREEZE_STAGE = "Договор"

        entering_freeze = (
            new_stage_name == FREEZE_STAGE
            and old_stage_name != FREEZE_STAGE
        )
        leaving_freeze = (
            old_stage_name == FREEZE_STAGE
            and new_stage_name != FREEZE_STAGE
        )

        if not entering_freeze and not leaving_freeze:
            return

        # Обновляем is_frozen на лиде
        session = self.__class__._get_db_session(session=None)
        await session.execute(
            'UPDATE "leads" SET is_frozen = $1 WHERE id = $2',
            [entering_freeze, self.id],
            cursor="void",
        )

        if entering_freeze:
            # Обновляем цены из актуальных компонентов и замораживаем
            await self._freeze_estimate_prices()
            logger.info("Froze prices for lead %s", self.id)
        else:
            logger.info("Unfroze prices for lead %s", self.id)

    async def _freeze_estimate_prices(self):
        """Обновляет цены в расчётах из текущих цен компонентов при заморозке."""
        Estimate = env.models.estimate
        EstimateLine = env.models.estimate_line

        estimates = await Estimate.search(
            filter=[("lead_id", "=", self.id)],
            fields=["id"],
            limit=10000,
        )
        if not estimates:
            return

        estimate_ids = [e.id for e in estimates]
        lines = await EstimateLine.search(
            filter=[
                ("estimate_id", "in", estimate_ids),
                ("is_manual", "=", False),
            ],
            fields=["id", "component_id"],
            limit=10000,
        )
        if not lines:
            return

        # Собираем уникальные component_id
        comp_ids = set()
        for line in lines:
            cid = (
                line.component_id.id
                if hasattr(line.component_id, "id")
                else line.component_id
            )
            if cid:
                comp_ids.add(cid)

        if not comp_ids:
            return

        # Загружаем актуальные цены компонентов
        components = await env.models.component.search(
            filter=[("id", "in", list(comp_ids))],
            fields=["id", "cost_price", "list_price"],
            limit=10000,
        )
        comp_prices = {
            c.id: (c.cost_price, c.list_price) for c in components
        }

        # Обновляем цены в каждой строке
        session = self.__class__._get_db_session(session=None)
        for line in lines:
            cid = (
                line.component_id.id
                if hasattr(line.component_id, "id")
                else line.component_id
            )
            if cid and cid in comp_prices:
                cost, sale = comp_prices[cid]
                await session.execute(
                    'UPDATE "estimate_line" '
                    "SET cost_price = $1, sale_price = $2 "
                    "WHERE id = $3",
                    [cost, sale, line.id],
                    cursor="void",
                )

    async def _log_stage_change_by_name(
        self, old_name: str, new_name: str
    ):
        """Создаёт Activity-запись о смене стадии."""
        Activity = env.models.activity
        ActivityType = env.models.activity_type

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
