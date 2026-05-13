import datetime
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from backend.base.crm.leads.models.leads import Lead
    from backend.base.crm.project_templates.models.project_template import (
        ProjectTemplate,
    )
    from .estimate_line import EstimateLine

from backend.base.system.dotorm.dotorm.fields import (
    Integer,
    Char,
    Boolean,
    Datetime,
    Many2one,
    One2many,
    Selection,
    Text,
)
from backend.base.system.schemas.base_schema import Id
from backend.base.system.dotorm.dotorm.model import DotModel
from backend.base.system.dotorm.dotorm.decorators import hybridmethod
from backend.base.system.core.enviroment import env
from backend.base.crm.users.audit_mixin import AuditMixin


async def _default_name():
    """Генерирует имя расчёта вида 'Р-0000042'."""
    session = env.apps.db.get_session()
    result = await session.execute(
        "SELECT nextval(pg_get_serial_sequence('estimate', 'id'))"
        " AS next_id"
    )
    next_id = result[0]["next_id"] if result else 0
    return f"Р-{str(next_id).zfill(7)}"


class Estimate(AuditMixin, DotModel):
    __table__ = "estimate"

    id: Id = Integer(primary_key=True)
    name: str = Char(
        max_length=255,
        description="Номер расчёта",
        default=_default_name,
    )
    lead_id: "Lead | None" = Many2one(
        lambda: env.models.lead,
        description="Лид",
        index=True,
        ondelete="restrict",
    )
    source_template_id: "ProjectTemplate | None" = Many2one(
        lambda: env.models.project_template,
        description="Типовой проект-источник",
        ondelete="set null",
    )
    status: str = Selection(
        options=[
            ("draft", "Черновик"),
            ("sent", "Отправлен"),
            ("accepted", "Принят"),
            ("declined", "Отклонён"),
        ],
        default="draft",
        description="Статус",
    )
    date_created: datetime.datetime = Datetime(
        description="Дата создания",
        default=lambda: datetime.datetime.now(datetime.timezone.utc),
    )
    notes: str | None = Text(description="Заметки")
    active: bool = Boolean(default=True)
    line_ids: list["EstimateLine"] = One2many(
        lambda: env.models.estimate_line,
        "estimate_id",
        string="Позиции расчёта",
    )

    # --- Post-create hook: копируем строки шаблона ---

    # Оригинальные create/create_bulk (hybridmethod.func из OrmPrimaryMixin)
    @staticmethod
    def _find_parent_func(name: str):
        for klass in DotModel.__mro__:
            if name in klass.__dict__:
                desc = klass.__dict__[name]
                return desc.func if hasattr(desc, "func") else desc
        raise AttributeError(f"{name} not found in DotModel MRO")

    @hybridmethod
    async def create(self, payload, session=None) -> int:
        _parent = Estimate._find_parent_func("create")
        record_id = await _parent(self, payload, session)
        # source_template_id может быть int или объект с .id
        tmpl = getattr(payload, "source_template_id", None)
        if tmpl:
            tid = tmpl.id if hasattr(tmpl, "id") else tmpl
            if tid:
                await Estimate.copy_template_lines(record_id, tid)
        return record_id

    @hybridmethod
    async def create_bulk(self, payload_list, session=None):
        _parent = Estimate._find_parent_func("create_bulk")
        records = await _parent(self, payload_list, session)
        # records = [{id: ...}, ...]
        if records:
            for rec, payload in zip(records, payload_list):
                tmpl = getattr(payload, "source_template_id", None)
                if tmpl:
                    tid = tmpl.id if hasattr(tmpl, "id") else tmpl
                    if tid:
                        await Estimate.copy_template_lines(
                            rec["id"], tid
                        )
        return records

    @staticmethod
    async def copy_template_lines(estimate_id: int, template_id: int):
        """Копирует позиции из типового проекта в расчёт."""
        template_lines = await env.models.project_template_line.search(
            filter=[("template_id", "=", template_id)],
            fields=["id", "component_id", "quantity", "sequence"],
            sort="sequence",
            order="asc",
            limit=200,
        )

        for tl in template_lines:
            comp_ref = tl.component_id
            cid = comp_ref.id if hasattr(comp_ref, "id") else comp_ref
            if not cid:
                continue

            comp_list = await env.models.component.search(
                filter=[("id", "=", cid)],
                fields=[
                    "id", "name", "category_id", "uom_id",
                    "cost_price", "list_price",
                ],
                limit=1,
            )
            if not comp_list:
                continue
            c = comp_list[0]
            cat_name = (
                c.category_id.name
                if c.category_id and hasattr(c.category_id, "name")
                else None
            )
            uom_name = (
                c.uom_id.name
                if c.uom_id and hasattr(c.uom_id, "name")
                else None
            )

            line = env.models.estimate_line(
                estimate_id=estimate_id,
                component_id=cid,
                name=c.name,
                category_name=cat_name,
                uom_name=uom_name,
                quantity=tl.quantity or 1.0,
                cost_price=c.cost_price,
                sale_price=c.list_price,
                is_included=True,
                is_manual=False,
                sequence=tl.sequence or 10,
            )
            await env.models.estimate_line.create(line)
