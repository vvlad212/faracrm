from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from fastapi import FastAPI
    from backend.base.system.core.enviroment import Environment

from backend.base.system.core.app import App
from backend.base.crm.security.acl_post_init_mixin import ACL
from .models.estimate import Estimate
from .models.estimate_line import EstimateLine
from .seed_data import INITIAL_LEADS, INITIAL_ESTIMATES

from backend.base.crm.leads.models.leads import Lead


class EstimatesApp(App):
    info = {
        "name": "Estimates",
        "summary": "Расчёты для клиентов",
        "author": "CRM",
        "category": "Base",
        "version": "1.0.0",
        "license": "FARA CRM License v1.0",
        "depends": ["security", "components", "leads",
                     "project_templates"],
        "post_init": True,
    }

    BASE_USER_ACL = {
        "estimate": ACL.FULL,
        "estimate_line": ACL.FULL,
    }

    async def post_init(self, app: "FastAPI"):
        await super().post_init(app)
        env: "Environment" = app.state.env

        # 1. Лиды — создаём если их нет, иначе читаем
        existing_leads = await env.models.lead.search(
            filter=[], fields=["id", "name"], limit=100
        )
        if existing_leads:
            created_leads = existing_leads
        else:
            stages = await env.models.lead_stage.search(
                filter=[], fields=["id", "name"]
            )
            stage_map = {s.name: s for s in stages}

            created_leads = []
            for lead_data in INITIAL_LEADS:
                stage = stage_map.get(lead_data["stage_name"])
                is_frozen = lead_data["stage_name"] == "Договор"
                lead = await env.models.lead.create(
                    payload=Lead(
                        name=lead_data["name"],
                        phone=lead_data["phone"],
                        source=lead_data["source"],
                        address=lead_data["address"] or None,
                        notes=lead_data["notes"],
                        stage_id=stage,
                        is_frozen=is_frozen,
                    )
                )
                created_leads.append(lead)

        # 2. Расчёты — создаём если их нет
        existing_estimates = await env.models.estimate.search(
            filter=[], limit=1
        )
        if existing_estimates:
            return

        templates = await env.models.project_template.search(
            filter=[], fields=["id", "name"]
        )
        tmpl_map = {t.name: t for t in templates}

        for lead_idx, tmpl_name, status in INITIAL_ESTIMATES:
            if lead_idx >= len(created_leads):
                continue
            lead = created_leads[lead_idx]
            tmpl = tmpl_map.get(tmpl_name)
            if not tmpl:
                continue

            # create автоматически копирует строки из шаблона
            # (см. Estimate.create override)
            await env.models.estimate.create(
                payload=Estimate(
                    lead_id=lead,
                    source_template_id=tmpl,
                    status=status,
                )
            )
