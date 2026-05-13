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
