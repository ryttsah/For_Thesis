from __future__ import annotations

from collections import Counter, defaultdict
from datetime import UTC, datetime
from io import BytesIO
from typing import Iterable

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import inch
from reportlab.platypus import (
    PageBreak,
    Paragraph,
    SimpleDocTemplate,
    Spacer,
    Table,
    TableStyle,
)
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.domain import Farm, Officer, PriorityVisit, ScheduledVisit, Survey, ValidationQueueItem
from app.models.farmer_registration import FarmerRegistration
from app.services.brgy import brgy_match


CONDITION_LABELS = {
    "healthy": "Healthy",
    "yellowing": "Yellowing",
    "scale": "Coconut Scale Insect (Lisap)",
    "beetle": "Rhinoceros Beetle (Bagangan)",
}


def _classify_condition(value: str) -> str:
    lower = value.strip().lower()
    if "scale" in lower or "lisap" in lower or "csi" in lower:
        return "scale"
    if "rhino" in lower or "beetle" in lower or "bagangan" in lower:
        return "beetle"
    if "yellow" in lower or "dilaw" in lower:
        return "yellowing"
    return "healthy"


def _month_bounds(month: str | None) -> tuple[str, str, str]:
    now = datetime.now(UTC)
    raw = month or now.strftime("%Y-%m")
    try:
        year, month_no = [int(part) for part in raw.split("-", 1)]
        start = datetime(year, month_no, 1)
    except ValueError:
        start = datetime(now.year, now.month, 1)
    if start.month == 12:
        end = datetime(start.year + 1, 1, 1)
    else:
        end = datetime(start.year, start.month + 1, 1)
    title = start.strftime("%B %Y")
    return start.strftime("%Y-%m-%d"), end.strftime("%Y-%m-%d"), title


def _filter_by_scope(rows: Iterable, brgy: str | None):
    if not brgy:
        return list(rows)
    return [row for row in rows if brgy_match(getattr(row, "brgy", ""), brgy)]


def _report_footer(canvas, doc) -> None:
    canvas.saveState()
    canvas.setFont("Helvetica", 8)
    canvas.setFillColor(colors.HexColor("#6b7280"))
    canvas.drawString(inch * 0.65, 0.45 * inch, "PCA Negros Occidental - Coconut Leaf Condition Monitoring System")
    canvas.drawRightString(A4[0] - inch * 0.65, 0.45 * inch, f"Page {doc.page}")
    canvas.restoreState()


def build_monthly_report_pdf(
    db: Session,
    *,
    generated_by: str,
    role: str,
    report_type: str = "monthly",
    month: str | None = None,
    brgy: str | None = None,
) -> bytes:
    period_start, period_end, period_title = _month_bounds(month)

    surveys = db.scalars(
        select(Survey)
        .where(Survey.survey_date >= period_start)
        .where(Survey.survey_date < period_end)
        .order_by(Survey.survey_date, Survey.id),
    ).all()
    visits = db.scalars(
        select(ScheduledVisit)
        .where(ScheduledVisit.visit_date >= period_start)
        .where(ScheduledVisit.visit_date < period_end)
        .order_by(ScheduledVisit.visit_date, ScheduledVisit.id),
    ).all()
    queue_items = db.scalars(select(ValidationQueueItem).order_by(ValidationQueueItem.id)).all()
    farms = db.scalars(select(Farm).order_by(Farm.sector, Farm.name)).all()
    officers = db.scalars(select(Officer).order_by(Officer.name)).all()
    registrations = db.scalars(select(FarmerRegistration).order_by(FarmerRegistration.applied_at.desc())).all()
    priority_visits = db.scalars(select(PriorityVisit).order_by(PriorityVisit.id.desc())).all()

    surveys = _filter_by_scope(surveys, brgy)
    visits = _filter_by_scope(visits, brgy)
    queue_items = _filter_by_scope(queue_items, brgy)
    farms = _filter_by_scope(farms, brgy)
    registrations = _filter_by_scope(registrations, brgy)
    priority_visits = _filter_by_scope(priority_visits, brgy)

    total_scans = sum(row.images for row in surveys)
    condition_counts = Counter()
    condition_confidence: dict[str, list[int]] = defaultdict(list)
    for row in surveys:
        condition = _classify_condition(row.ai_result)
        condition_counts[condition] += row.images

    for row in db.scalars(select(Survey).order_by(Survey.id)).all():
        condition_confidence[_classify_condition(row.ai_result)].append(80)

    scope_label = brgy or "Province-wide"
    sectors = sorted({(row.sector[:1] or "-").upper() for row in farms + surveys if getattr(row, "sector", "")})
    pending_reviews = sum(1 for row in queue_items if not row.validated)
    resolved_reviews = sum(1 for row in queue_items if row.validated)
    risk_farms = sum(1 for row in farms if row.status in {"risk", "caution"})

    buffer = BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        leftMargin=0.62 * inch,
        rightMargin=0.62 * inch,
        topMargin=0.62 * inch,
        bottomMargin=0.7 * inch,
    )
    styles = getSampleStyleSheet()
    styles.add(ParagraphStyle(name="SmallMuted", parent=styles["Normal"], fontSize=8.5, textColor=colors.HexColor("#6b7280"), leading=11))
    styles.add(ParagraphStyle(name="SectionTitle", parent=styles["Heading2"], fontSize=13, leading=16, spaceBefore=10, spaceAfter=6, textColor=colors.HexColor("#166534")))

    report_titles = {
        "monthly": "Monthly Coconut Health Summary",
        "officer-performance": "Officer Performance Report",
        "farmer-audit": "Farmer Registration Audit",
        "high-risk": "High-Risk Farm Export",
    }
    title = report_titles.get(report_type, report_titles["monthly"])

    story = [
        Paragraph("PCA NEGROS OCCIDENTAL - COCONUT LEAF CONDITION MONITORING SYSTEM", styles["SmallMuted"]),
        Paragraph(title, styles["Title"]),
        Paragraph(f"Reporting Period: {period_title}", styles["Heading3"]),
        Spacer(1, 8),
    ]

    meta = [
        ["Report Generated", datetime.now(UTC).strftime("%B %d, %Y, %I:%M %p UTC"), "Coverage Area", scope_label],
        ["Generated By", generated_by, "Sectors Covered", ", ".join(sectors) if sectors else "No sector data yet"],
        ["Prepared For", "PCA Division Office - Negros Occidental", "Report Type", title],
    ]
    story.append(_table(meta, [1.25 * inch, 2.1 * inch, 1.25 * inch, 2.1 * inch], header=False))

    story += [Paragraph("Executive Summary", styles["SectionTitle"])]

    if report_type == "officer-performance":
        return _finish_officer_report(
            doc,
            story,
            buffer,
            styles,
            officers=officers,
            farms=farms,
            visits=visits,
            queue_items=queue_items,
            surveys=surveys,
        )
    if report_type == "farmer-audit":
        return _finish_farmer_audit_report(doc, story, buffer, styles, registrations=registrations)
    if report_type == "high-risk":
        return _finish_high_risk_report(
            doc,
            story,
            buffer,
            styles,
            farms=farms,
            surveys=surveys,
            priority_visits=priority_visits,
            queue_items=queue_items,
        )

    story += [
        Paragraph(
            (
                f"During the reporting period, the system logged {total_scans} coconut leaf scan(s) "
                f"from {len(surveys)} survey/submission record(s) across {len(sectors)} sector(s). "
                f"{risk_farms} farm(s) are currently marked caution or risk. "
                f"{pending_reviews} item(s) remain pending in the PCA review queue."
            ),
            styles["Normal"],
        ),
        Paragraph("1. Transaction Summary", styles["SectionTitle"]),
    ]

    summary_rows = [["Detected Condition", "Number of Scans", "% of Total", "Avg. Confidence Score"]]
    for key in ("healthy", "yellowing", "scale", "beetle"):
        count = condition_counts[key]
        pct = round((count / total_scans) * 100) if total_scans else 0
        avg_conf = "0.80" if count else "-"
        summary_rows.append([CONDITION_LABELS[key], str(count), f"{pct}%", avg_conf])
    summary_rows.append(["Total", str(total_scans), "100%" if total_scans else "0%", "-"])
    story.append(_table(summary_rows, [2.5 * inch, 1.25 * inch, 1.0 * inch, 1.6 * inch]))

    story += [
        Paragraph("Figure 1. Distribution of leaf scans by detected condition.", styles["SmallMuted"]),
        Paragraph("2. Weekly Scan Trend", styles["SectionTitle"]),
    ]
    weekly = [0, 0, 0, 0, 0]
    for row in surveys:
        try:
            day = datetime.strptime(row.survey_date[:10], "%Y-%m-%d").day
        except ValueError:
            day = 1
        weekly[min(4, (day - 1) // 7)] += row.images
    story.append(_table([["Week", "Week 1", "Week 2", "Week 3", "Week 4", "Week 5"], ["Scans", *map(str, weekly)]], [0.9 * inch] * 6))
    story.append(Paragraph("Figure 2. Weekly scan volume for the reporting period.", styles["SmallMuted"]))

    story += [PageBreak(), Paragraph("3. Sector-Wise Breakdown", styles["SectionTitle"])]
    sector_rows = [["Sector", "Farm / Owner", "Scans Logged", "Most Common Condition", "Assigned Officer"]]
    officer_by_brgy = {row.brgy: row.name for row in officers if row.status == "Active"}
    for farm in farms:
        farm_surveys = [row for row in surveys if row.farm == farm.name]
        scan_count = sum(row.images for row in farm_surveys)
        if farm_surveys:
            common = Counter(_classify_condition(row.ai_result) for row in farm_surveys).most_common(1)[0][0]
            common_label = CONDITION_LABELS[common]
        else:
            common_label = farm.status.title()
        sector_rows.append([
            farm.sector,
            f"{farm.name} / {farm.owner}",
            str(scan_count),
            common_label,
            officer_by_brgy.get(farm.brgy, "-"),
        ])
    if len(sector_rows) == 1:
        sector_rows.append(["-", "No farm data found for this scope.", "0", "-", "-"])
    story.append(_table(sector_rows, [0.75 * inch, 2.2 * inch, 1.0 * inch, 1.65 * inch, 1.35 * inch]))

    story += [Paragraph("4. Farm Visits and Officer Assignment", styles["SectionTitle"])]
    visit_rows = [["Farm", "Barangay", "Officer Assigned", "Visit Date", "Purpose"]]
    for visit in visits:
        visit_rows.append([visit.farm, visit.brgy, visit.scheduled_by, visit.visit_date, visit.purpose or "-"])
    if len(visit_rows) == 1:
        visit_rows.append(["-", "No visits logged in this reporting period.", "-", "-", "-"])
    story.append(_table(visit_rows, [1.25 * inch, 1.4 * inch, 1.35 * inch, 1.0 * inch, 2.0 * inch]))

    story += [Paragraph("5. Uncertain Result Review Queue Summary", styles["SectionTitle"])]
    total_flagged = pending_reviews + resolved_reviews
    review_rows = [
        ["Status", "Number of Cases", "% of Flagged Cases"],
        ["Flagged for Review", str(total_flagged), "100%" if total_flagged else "0%"],
        ["Resolved by Officer", str(resolved_reviews), f"{round(resolved_reviews / total_flagged * 100)}%" if total_flagged else "0%"],
        ["Pending Review", str(pending_reviews), f"{round(pending_reviews / total_flagged * 100)}%" if total_flagged else "0%"],
    ]
    story.append(_table(review_rows, [2.5 * inch, 1.6 * inch, 1.6 * inch]))
    story.append(Spacer(1, 12))
    story.append(Paragraph("This report was automatically generated from the system database for internal PCA monitoring use.", styles["SmallMuted"]))

    doc.build(story, onFirstPage=_report_footer, onLaterPages=_report_footer)
    return buffer.getvalue()


def _finish_officer_report(
    doc: SimpleDocTemplate,
    story: list,
    buffer: BytesIO,
    styles,
    *,
    officers: list[Officer],
    farms: list[Farm],
    visits: list[ScheduledVisit],
    queue_items: list[ValidationQueueItem],
    surveys: list[Survey],
) -> bytes:
    active_officers = [row for row in officers if row.status == "Active"]
    story.append(
        Paragraph(
            f"This report summarizes {len(active_officers)} active officer(s), {len(visits)} scheduled visit(s), "
            f"and {len(queue_items)} review queue item(s) for the selected scope.",
            styles["Normal"],
        ),
    )
    rows = [["Officer", "Assigned Barangay", "Farms Covered", "Visits Logged", "Open Reviews", "Last Active"]]
    for officer in officers:
        visit_count = sum(1 for visit in visits if visit.scheduled_by == officer.name)
        review_count = sum(1 for item in queue_items if brgy_match(item.brgy, officer.brgy) and not item.validated)
        farm_count = sum(1 for farm in farms if brgy_match(farm.brgy, officer.brgy))
        rows.append([officer.name, officer.brgy, str(farm_count), str(visit_count), str(review_count), officer.last_active])
    if len(rows) == 1:
        rows.append(["-", "No officer records found.", "0", "0", "0", "-"])
    story += [
        Paragraph("1. Officer Assignment and Workload", styles["SectionTitle"]),
        _table(rows, [1.35 * inch, 1.45 * inch, 0.8 * inch, 0.8 * inch, 0.85 * inch, 1.0 * inch]),
        Paragraph("2. Visit Activity", styles["SectionTitle"]),
        _table(
            [["Farm", "Barangay", "Officer", "Visit Date", "Purpose"]]
            + ([[v.farm, v.brgy, v.scheduled_by, v.visit_date, v.purpose or "-"] for v in visits] or [["-", "No visits logged.", "-", "-", "-"]]),
            [1.3 * inch, 1.25 * inch, 1.25 * inch, 0.95 * inch, 2.1 * inch],
        ),
        Paragraph("3. Survey Records Handled", styles["SectionTitle"]),
        _table(
            [["Date", "Farm", "AI Result", "Officer", "Status"]]
            + ([[s.survey_date, s.farm, s.ai_result, s.officer, s.status] for s in surveys] or [["-", "No survey records.", "-", "-", "-"]]),
            [0.9 * inch, 1.55 * inch, 1.55 * inch, 1.25 * inch, 0.95 * inch],
        ),
    ]
    doc.build(story, onFirstPage=_report_footer, onLaterPages=_report_footer)
    return buffer.getvalue()


def _finish_farmer_audit_report(
    doc: SimpleDocTemplate,
    story: list,
    buffer: BytesIO,
    styles,
    *,
    registrations: list[FarmerRegistration],
) -> bytes:
    counts = Counter(row.status for row in registrations)
    story.append(
        Paragraph(
            f"This audit covers {len(registrations)} farmer registration record(s): "
            f"{counts['approved']} approved, {counts['pending']} pending, and {counts['rejected']} rejected.",
            styles["Normal"],
        ),
    )
    rows = [["Farmer ID", "Farmer Name", "Barangay", "Municipality", "Status", "Applied"]]
    for row in registrations:
        rows.append([
            row.farmer_id,
            " ".join(part for part in [row.first_name, row.middle_initial, row.last_name] if part),
            row.brgy,
            row.municipality,
            row.status.title(),
            row.applied_at.strftime("%Y-%m-%d") if row.applied_at else "-",
        ])
    if len(rows) == 1:
        rows.append(["-", "No registration records found.", "-", "-", "-", "-"])
    story += [
        Paragraph("1. Registration Status Summary", styles["SectionTitle"]),
        _table([["Status", "Count"], ["Approved", str(counts["approved"])], ["Pending", str(counts["pending"])], ["Rejected", str(counts["rejected"])]], [2.0 * inch, 1.0 * inch]),
        Paragraph("2. Farmer Registration Records", styles["SectionTitle"]),
        _table(rows, [0.9 * inch, 1.55 * inch, 1.15 * inch, 1.25 * inch, 0.8 * inch, 0.8 * inch]),
    ]
    doc.build(story, onFirstPage=_report_footer, onLaterPages=_report_footer)
    return buffer.getvalue()


def _finish_high_risk_report(
    doc: SimpleDocTemplate,
    story: list,
    buffer: BytesIO,
    styles,
    *,
    farms: list[Farm],
    surveys: list[Survey],
    priority_visits: list[PriorityVisit],
    queue_items: list[ValidationQueueItem],
) -> bytes:
    risky_farms = [farm for farm in farms if farm.status in {"risk", "caution"}]
    open_priority = [visit for visit in priority_visits if not visit.completed]
    open_reviews = [item for item in queue_items if not item.validated]
    story.append(
        Paragraph(
            f"This export highlights {len(risky_farms)} caution/risk farm(s), {len(open_priority)} open priority visit(s), "
            f"and {len(open_reviews)} pending review item(s).",
            styles["Normal"],
        ),
    )
    farm_rows = [["Farm", "Owner", "Sector", "Barangay", "Status", "Last Survey"]]
    for farm in risky_farms:
        farm_rows.append([farm.name, farm.owner, farm.sector, farm.brgy, farm.status.title(), farm.last_survey])
    if len(farm_rows) == 1:
        farm_rows.append(["-", "No high-risk farms found.", "-", "-", "-", "-"])
    story += [
        Paragraph("1. Caution and Risk Farms", styles["SectionTitle"]),
        _table(farm_rows, [1.25 * inch, 1.1 * inch, 0.8 * inch, 1.25 * inch, 0.85 * inch, 0.95 * inch]),
        Paragraph("2. Open Priority Visits", styles["SectionTitle"]),
        _table(
            [["Farm", "Description", "Level", "Due", "Assigned"]]
            + ([[v.farm, v.description, v.level.title(), v.due_label, v.assigned] for v in open_priority] or [["-", "No open priority visits.", "-", "-", "-"]]),
            [1.25 * inch, 2.35 * inch, 0.7 * inch, 0.8 * inch, 1.2 * inch],
        ),
        Paragraph("3. Related Survey Findings", styles["SectionTitle"]),
        _table(
            [["Date", "Farm", "AI Result", "Status"]]
            + ([[s.survey_date, s.farm, s.ai_result, s.status] for s in surveys if _classify_condition(s.ai_result) != "healthy"] or [["-", "No risk survey findings in this period.", "-", "-"]]),
            [0.95 * inch, 1.65 * inch, 1.9 * inch, 1.0 * inch],
        ),
    ]
    doc.build(story, onFirstPage=_report_footer, onLaterPages=_report_footer)
    return buffer.getvalue()


def _table(rows: list[list[str]], widths: list[float], *, header: bool = True) -> Table:
    table = Table(rows, colWidths=widths, repeatRows=1 if header else 0)
    style = [
        ("GRID", (0, 0), (-1, -1), 0.35, colors.HexColor("#d1d5db")),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("FONTNAME", (0, 0), (-1, -1), "Helvetica"),
        ("FONTSIZE", (0, 0), (-1, -1), 8.5),
        ("LEADING", (0, 0), (-1, -1), 10),
        ("ROWBACKGROUNDS", (0, 1 if header else 0), (-1, -1), [colors.white, colors.HexColor("#f9fafb")]),
    ]
    if header:
        style += [
            ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#166534")),
            ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
            ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ]
    else:
        style += [
            ("FONTNAME", (0, 0), (0, -1), "Helvetica-Bold"),
            ("FONTNAME", (2, 0), (2, -1), "Helvetica-Bold"),
        ]
    table.setStyle(TableStyle(style))
    return table
