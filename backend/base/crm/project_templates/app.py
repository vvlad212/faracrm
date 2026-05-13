from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from fastapi import FastAPI
    from backend.base.system.core.enviroment import Environment

from backend.base.system.core.app import App
from backend.base.crm.security.acl_post_init_mixin import ACL
from .models.project_template import ProjectTemplate
from .models.project_template_line import ProjectTemplateLine
from .seed_data import ALL_TEMPLATES


class ProjectTemplatesApp(App):
    info = {
        "name": "Project Templates",
        "summary": "Типовые проекты (пресеты расчётов)",
        "author": "CRM",
        "category": "Base",
        "version": "1.0.0",
        "license": "FARA CRM License v1.0",
        "depends": ["security", "components"],
        "post_init": True,
    }

    BASE_USER_ACL = {
        "project_template": ACL.FULL,
        "project_template_line": ACL.FULL,
    }

    async def post_init(self, app: "FastAPI"):
        await super().post_init(app)
        env: "Environment" = app.state.env

        # Сеем типовые проекты если их ещё нет
        existing = await env.models.project_template.search(
            filter=[], limit=1
        )
        if existing:
            return

        # Кеш компонентов по имени
        components = await env.models.component.search(
            filter=[], fields=["id", "name"]
        )
        comp_map = {c.name: c for c in components}

        for tmpl_data in ALL_TEMPLATES:
            tmpl = await env.models.project_template.create(
                payload=ProjectTemplate(
                    name=tmpl_data["name"],
                    description=tmpl_data["description"],
                    dimensions=tmpl_data["dimensions"],
                )
            )

            for seq, (comp_name, qty) in enumerate(
                tmpl_data["lines"], start=1
            ):
                comp = comp_map.get(comp_name)
                if not comp:
                    continue
                await env.models.project_template_line.create(
                    payload=ProjectTemplateLine(
                        template_id=tmpl,
                        component_id=comp,
                        quantity=float(qty),
                        sequence=seq * 10,
                    )
                )
