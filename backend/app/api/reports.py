from typing import Annotated

from fastapi import APIRouter, Depends, Query
from fastapi.responses import Response
from sqlalchemy.orm import Session

from app.api.deps import get_current_user_id, require_role
from app.db.session import get_db
from app.models.domain import Officer
from app.services.reports import build_monthly_report_pdf

router = APIRouter(prefix="/reports", tags=["reports"])


@router.get("/monthly.pdf")
def monthly_report(
    db: Annotated[Session, Depends(get_db)],
    user_id: Annotated[str, Depends(get_current_user_id)],
    role: Annotated[str, Depends(require_role("officer", "admin"))],
    month: Annotated[str | None, Query(pattern=r"^\d{4}-\d{2}$")] = None,
    type: Annotated[
        str,
        Query(pattern=r"^(monthly|officer-performance|farmer-audit|high-risk)$"),
    ] = "monthly",
    generated_at: Annotated[str | None, Query(max_length=120)] = None,
) -> Response:
    brgy = None
    generated_by = user_id
    if role == "officer":
        officer = db.get(Officer, user_id)
        if officer is not None:
            generated_by = officer.name
            if officer.brgy not in ("", "Unassigned", "-"):
                brgy = officer.brgy

    pdf = build_monthly_report_pdf(
        db,
        generated_by=generated_by,
        role=role,
        report_type=type,
        month=month,
        brgy=brgy,
        generated_at=generated_at,
    )
    scope = "province" if role == "admin" else "officer"
    filename = f"pca-{scope}-{type}-report-{month or 'current'}.pdf"
    return Response(
        content=pdf,
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )
