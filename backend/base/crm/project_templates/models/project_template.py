from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from .project_template_line import ProjectTemplateLine

from backend.base.system.dotorm.dotorm.fields import (
    Integer,
    Char,
    Boolean,
    Text,
    One2many,
)
from backend.base.system.schemas.base_schema import Id
from backend.base.system.dotorm.dotorm.model import DotModel
from backend.base.system.core.enviroment import env
from backend.base.crm.users.audit_mixin import AuditMixin


class ProjectTemplate(AuditMixin, DotModel):
    __table__ = "project_template"

    id: Id = Integer(primary_key=True)
    name: str = Char(
        max_length=255, required=True, description="Название"
    )
    description: str | None = Text(description="Описание")
    dimensions: str | None = Char(
        max_length=100, description="Габариты (напр. 6×2.4)"
    )
    active: bool = Boolean(default=True)
    line_ids: list["ProjectTemplateLine"] = One2many(
        lambda: env.models.project_template_line,
        "template_id",
        string="Позиции",
    )
