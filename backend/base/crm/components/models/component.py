import logging
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from .component_category import ComponentCategory
    from backend.base.crm.products.models.uom import Uom

from backend.base.system.dotorm.dotorm.fields import (
    Integer,
    Char,
    Float,
    Boolean,
    Many2one,
    Text,
)
from backend.base.system.schemas.base_schema import Id
from backend.base.system.dotorm.dotorm.model import DotModel
from backend.base.system.core.enviroment import env
from backend.base.crm.users.audit_mixin import AuditMixin

logger = logging.getLogger(__name__)


class Component(AuditMixin, DotModel):
    __table__ = "components"
    __route__ = "/component"

    id: Id = Integer(primary_key=True)
    name: str = Char(
        max_length=255, required=True, description="Название"
    )
    category_id: "ComponentCategory | None" = Many2one(
        lambda: env.models.component_category,
        description="Категория",
        ondelete="restrict",
    )
    uom_id: "Uom | None" = Many2one(
        lambda: env.models.uom,
        description="Единица измерения",
        ondelete="restrict",
    )
    cost_price: float = Float(
        default=0.0, description="Себестоимость за единицу"
    )
    list_price: float = Float(
        default=0.0, description="Продажная цена за единицу"
    )
    description: str | None = Text(description="Заметка / поставщик")
    active: bool = Boolean(default=True)

    async def update(self, payload, fields=None, session=None):
        """Override — при изменении цен обновляем незамороженные расчёты."""
        old_cost = self.cost_price
        old_list = self.list_price

        result = await super().update(
            payload, fields=fields, session=session
        )

        # После update self синхронизирован с payload
        if self.cost_price != old_cost or self.list_price != old_list:
            await self._sync_prices_to_estimates()

        return result

    async def _sync_prices_to_estimates(self):
        """Обновить цены во всех незамороженных расчётах."""
        EstimateLine = env.models.estimate_line
        Estimate = env.models.estimate
        Lead = env.models.lead

        # Все строки расчётов с этим компонентом
        lines = await EstimateLine.search(
            filter=[("component_id", "=", self.id)],
            fields=["id", "estimate_id"],
            limit=10000,
        )
        if not lines:
            return

        # Собираем estimate_id → [line_ids]
        estimate_ids = set()
        for line in lines:
            eid = (
                line.estimate_id.id
                if hasattr(line.estimate_id, "id")
                else line.estimate_id
            )
            if eid:
                estimate_ids.add(eid)

        if not estimate_ids:
            return

        # Находим расчёты и их лидов
        estimates = await Estimate.search(
            filter=[("id", "in", list(estimate_ids))],
            fields=["id", "lead_id"],
            limit=10000,
        )

        # Собираем lead_id → is_frozen
        lead_ids = set()
        for est in estimates:
            lid = (
                est.lead_id.id
                if hasattr(est.lead_id, "id")
                else est.lead_id
            )
            if lid:
                lead_ids.add(lid)

        frozen_leads = set()
        if lead_ids:
            leads = await Lead.search(
                filter=[
                    ("id", "in", list(lead_ids)),
                    ("is_frozen", "=", True),
                ],
                fields=["id"],
                limit=10000,
            )
            frozen_leads = {l.id for l in leads}

        # Определяем замороженные расчёты
        frozen_estimates = set()
        for est in estimates:
            lid = (
                est.lead_id.id
                if hasattr(est.lead_id, "id")
                else est.lead_id
            )
            if lid and lid in frozen_leads:
                frozen_estimates.add(est.id)

        # Обновляем только незамороженные строки
        unfrozen_line_ids = []
        for line in lines:
            eid = (
                line.estimate_id.id
                if hasattr(line.estimate_id, "id")
                else line.estimate_id
            )
            if eid and eid not in frozen_estimates:
                unfrozen_line_ids.append(line.id)

        if not unfrozen_line_ids:
            return

        # Массовое обновление через SQL
        session = self.__class__._get_db_session(session=None)
        await session.execute(
            'UPDATE "estimate_line" '
            "SET cost_price = $1, sale_price = $2 "
            "WHERE component_id = $3 AND id = ANY($4)",
            [self.cost_price, self.list_price, self.id, unfrozen_line_ids],
            cursor="void",
        )
        logger.info(
            "Synced prices for component %s to %d estimate lines",
            self.id,
            len(unfrozen_line_ids),
        )
