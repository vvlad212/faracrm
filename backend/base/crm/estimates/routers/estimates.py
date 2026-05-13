from fastapi import APIRouter, Depends, Request

from backend.base.crm.auth_token.app import AuthTokenApp
from backend.base.crm.estimates.models.estimate import Estimate
from backend.base.system.core.enviroment import env


router_private = APIRouter(
    tags=["Estimates"],
    dependencies=[Depends(AuthTokenApp.verify_access)],
)


@router_private.post("/estimate/{estimate_id}/apply_template")
async def apply_template(req: Request, estimate_id: int):
    """Копирует позиции из типового проекта в расчёт."""
    records = await Estimate.search(
        filter=[("id", "=", estimate_id)],
        fields=["id", "source_template_id"],
        limit=1,
    )
    if not records:
        return {"ok": False}

    estimate = records[0]
    template_ref = estimate.source_template_id
    if not template_ref:
        return {"ok": False}

    tid = template_ref.id if hasattr(template_ref, "id") else template_ref
    await Estimate.copy_template_lines(estimate_id, tid)
    return {"ok": True}


@router_private.delete("/estimate/{estimate_id}/clear_lines")
async def clear_lines(req: Request, estimate_id: int):
    """Удаляет все позиции расчёта."""
    lines = await env.models.estimate_line.search(
        filter=[("estimate_id", "=", estimate_id)],
        fields=["id"],
        limit=1000,
    )
    if lines:
        ids = [line.id for line in lines]
        await env.models.estimate_line.delete_bulk(ids)
    return {"ok": True, "deleted": len(lines)}
