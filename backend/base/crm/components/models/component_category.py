from backend.base.system.dotorm.dotorm.fields import (
    Integer,
    Char,
    Boolean,
)
from backend.base.system.dotorm.dotorm.model import DotModel


class ComponentCategory(DotModel):
    __table__ = "component_category"

    id: int = Integer(primary_key=True)
    name: str = Char(max_length=255, required=True, description="Название")
    sequence: int = Integer(default=10, description="Порядок сортировки")
    active: bool = Boolean(default=True)


INITIAL_COMPONENT_CATEGORIES = [
    {"name": "Фундамент", "sequence": 10},
    {"name": "Каркас", "sequence": 20},
    {"name": "Утепление", "sequence": 30},
    {"name": "Кровля", "sequence": 40},
    {"name": "Окна и двери", "sequence": 50},
    {"name": "Отделка", "sequence": 60},
    {"name": "Инженерка", "sequence": 70},
    {"name": "Работа", "sequence": 80},
]
