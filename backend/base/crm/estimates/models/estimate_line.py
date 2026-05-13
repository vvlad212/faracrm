from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from .estimate import Estimate
    from backend.base.crm.components.models.component import Component

from backend.base.system.dotorm.dotorm.fields import (
    Integer,
    Char,
    Float,
    Boolean,
    Many2one,
)
from backend.base.system.schemas.base_schema import Id
from backend.base.system.dotorm.dotorm.model import DotModel
from backend.base.system.core.enviroment import env


class EstimateLine(DotModel):
    __table__ = "estimate_line"

    id: Id = Integer(primary_key=True)
    estimate_id: "Estimate" = Many2one(
        lambda: env.models.estimate,
        description="Расчёт",
        ondelete="cascade",
    )
    component_id: "Component | None" = Many2one(
        lambda: env.models.component,
        description="Компонент из склада",
        ondelete="restrict",
    )
    # Snapshot-поля (копируются при создании строки)
    name: str = Char(
        max_length=255,
        required=True,
        description="Название позиции",
    )
    category_name: str | None = Char(
        max_length=255, description="Категория (для группировки)"
    )
    uom_name: str | None = Char(
        max_length=50, description="Единица измерения"
    )
    quantity: float = Float(default=1.0, description="Количество")
    cost_price: float = Float(
        default=0.0, description="Себестоимость за ед."
    )
    sale_price: float = Float(
        default=0.0, description="Продажная цена за ед."
    )
    is_included: bool = Boolean(
        default=True, description="Включено в расчёт"
    )
    is_manual: bool = Boolean(
        default=False, description="Ручная позиция (не из склада)"
    )
    sequence: int = Integer(default=10, description="Порядок")
