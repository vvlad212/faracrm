from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from .project_template import ProjectTemplate
    from backend.base.crm.components.models.component import Component

from backend.base.system.dotorm.dotorm.fields import (
    Integer,
    Float,
    Many2one,
)
from backend.base.system.schemas.base_schema import Id
from backend.base.system.dotorm.dotorm.model import DotModel
from backend.base.system.core.enviroment import env


class ProjectTemplateLine(DotModel):
    __table__ = "project_template_line"

    id: Id = Integer(primary_key=True)
    template_id: "ProjectTemplate" = Many2one(
        lambda: env.models.project_template,
        description="Типовой проект",
        ondelete="cascade",
    )
    component_id: "Component" = Many2one(
        lambda: env.models.component,
        description="Компонент",
        ondelete="restrict",
    )
    quantity: float = Float(default=1.0, description="Количество")
    sequence: int = Integer(default=10, description="Порядок")
