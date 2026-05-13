from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from fastapi import FastAPI
    from backend.base.system.core.enviroment import Environment

from backend.base.system.core.app import App
from backend.base.crm.security.acl_post_init_mixin import ACL
from .models.component_category import (
    ComponentCategory,
    INITIAL_COMPONENT_CATEGORIES,
)
from .models.component import Component
from .seed_data import ADDITIONAL_UOMS, INITIAL_COMPONENTS

from backend.base.crm.products.models.uom import Uom


class ComponentsApp(App):
    info = {
        "name": "Components",
        "summary": "Справочник материалов и работ",
        "author": "CRM",
        "category": "Base",
        "version": "1.0.0",
        "license": "FARA CRM License v1.0",
        "depends": ["security", "products"],
        "post_init": True,
    }

    BASE_USER_ACL = {
        "component": ACL.FULL,
        "component_category": ACL.FULL,
    }

    async def post_init(self, app: "FastAPI"):
        await super().post_init(app)
        env: "Environment" = app.state.env

        # 1. Дополнительные единицы измерения
        for uom_data in ADDITIONAL_UOMS:
            existing = await env.models.uom.search(
                filter=[("name", "=", uom_data["name"])]
            )
            if not existing:
                await env.models.uom.create(
                    payload=Uom(name=uom_data["name"]),
                )

        # 2. Категории компонентов
        for cat_data in INITIAL_COMPONENT_CATEGORIES:
            existing = await env.models.component_category.search(
                filter=[("name", "=", cat_data["name"])]
            )
            if not existing:
                await env.models.component_category.create(
                    payload=ComponentCategory(**cat_data),
                )

        # 3. Компоненты склада
        existing_components = await env.models.component.search(
            filter=[], limit=1
        )
        if existing_components:
            return  # Уже есть данные, не сеем повторно

        # Кешируем категории и UoM
        categories = await env.models.component_category.search(
            filter=[], fields=["id", "name"]
        )
        cat_map = {c.name: c for c in categories}

        uoms = await env.models.uom.search(
            filter=[], fields=["id", "name"]
        )
        uom_map = {u.name: u for u in uoms}

        for name, cat_name, uom_name, cost, price in INITIAL_COMPONENTS:
            payload = Component(
                name=name,
                cost_price=float(cost),
                list_price=float(price),
            )
            if cat_name in cat_map:
                payload.category_id = cat_map[cat_name]
            if uom_name in uom_map:
                payload.uom_id = uom_map[uom_name]

            await env.models.component.create(payload=payload)
