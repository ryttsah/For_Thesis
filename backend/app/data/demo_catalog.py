"""Seed payloads mirrored from frontend demoData.ts."""

FARMS = [
    {"external_id": "farm-1", "name": "Dela Cruz Farm", "owner": "R. Dela Cruz", "sector": "D (West)", "brgy": "Brgy. Alangilan", "trees": 42, "status": "risk", "last_survey": "Apr 22"},
    {"external_id": "farm-2", "name": "Gonzales Farm", "owner": "M. Gonzales", "sector": "D (West)", "brgy": "Brgy. Alangilan", "trees": 38, "status": "risk", "last_survey": "Apr 25"},
    {"external_id": "farm-3", "name": "Reyes Farm", "owner": "A. Reyes", "sector": "B (South)", "brgy": "Brgy. Conception", "trees": 56, "status": "caution", "last_survey": "Apr 28"},
    {"external_id": "farm-4", "name": "Santos Farm", "owner": "L. Santos", "sector": "E (Central)", "brgy": "Brgy. Mandalagan", "trees": 64, "status": "caution", "last_survey": "May 4"},
    {"external_id": "farm-5", "name": "Bautista Farm", "owner": "J. Bautista", "sector": "B (South)", "brgy": "Brgy. Conception", "trees": 47, "status": "caution", "last_survey": "May 3"},
    {"external_id": "farm-6", "name": "Espinosa Homestead", "owner": "J. Espinosa", "sector": "B (South)", "brgy": "Brgy. Conception", "trees": 40, "status": "healthy", "last_survey": "May 8"},
    {"external_id": "farm-7", "name": "Lim Farm", "owner": "P. Lim", "sector": "A (North)", "brgy": "Brgy. Mandalagan", "trees": 52, "status": "pending", "last_survey": "May 2"},
    {"external_id": "farm-8", "name": "Espinosa Farm", "owner": "J. Espinosa", "sector": "C (East)", "brgy": "Brgy. Granada", "trees": 35, "status": "healthy", "last_survey": "May 3"},
    {"external_id": "farm-9", "name": "Tan Farm", "owner": "S. Tan", "sector": "A (North)", "brgy": "Brgy. Mandalagan", "trees": 48, "status": "healthy", "last_survey": "May 1"},
]

QUEUE = [
    {"external_id": "q1", "brgy": "Brgy. Mandalagan", "title": "Yellowing vs. Heat Stress", "sub": "Santos Farm, Sector E - May 4", "conf": "52%", "validated": False},
    {"external_id": "q2", "brgy": "Brgy. Conception", "title": "Scale Insect vs. N-Deficiency", "sub": "Bautista Farm, Sector B - May 3", "conf": "48%", "validated": False},
    {"external_id": "q3", "brgy": "Brgy. Mandalagan", "title": "Rhinoceros Beetle - Uncertain", "sub": "Lim Farm, Sector A - May 2", "conf": "55%", "validated": False},
    {"external_id": "q4", "brgy": "Brgy. Granada", "title": "Yellowing - Possible nutrient deficiency", "sub": "Mendoza Farm, Sector C - May 1", "conf": "61%", "validated": False},
    {"external_id": "q5", "brgy": "Brgy. Mandalagan", "title": "Healthy vs. early scale signs", "sub": "Ramos Farm, Sector A - Apr 30", "conf": "43%", "validated": False},
    {"external_id": "q6", "brgy": "Brgy. Alangilan", "title": "Rhino beetle damage assessment", "sub": "Flores Farm, Sector D - Apr 29", "conf": "67%", "validated": False},
    {"external_id": "q7", "brgy": "Brgy. Conception", "title": "Multiple pest detection", "sub": "Castro Farm, Sector B - Apr 28", "conf": "38%", "validated": False},
]

SURVEYS = [
    {"external_id": "s1", "survey_date": "May 9, 2026", "farm": "Espinosa Farm", "sector": "C (East)", "brgy": "Brgy. Granada", "images": 12, "ai_result": "Healthy (94%)", "officer": "M. Aguilar", "status": "healthy"},
    {"external_id": "s2", "survey_date": "May 8, 2026", "farm": "Espinosa Homestead", "sector": "B (South)", "brgy": "Brgy. Conception", "images": 6, "ai_result": "Healthy (91%)", "officer": "M. Aguilar", "status": "healthy"},
    {"external_id": "s3", "survey_date": "May 8, 2026", "farm": "Tan Farm", "sector": "A (North)", "brgy": "Brgy. Mandalagan", "images": 8, "ai_result": "Healthy (87%)", "officer": "M. Aguilar", "status": "healthy"},
    {"external_id": "s4", "survey_date": "May 7, 2026", "farm": "Lim Farm", "sector": "A (North)", "brgy": "Brgy. Mandalagan", "images": 15, "ai_result": "Uncertain (55%)", "officer": "—", "status": "pending"},
    {"external_id": "s5", "survey_date": "May 6, 2026", "farm": "Bautista Farm", "sector": "B (South)", "brgy": "Brgy. Conception", "images": 10, "ai_result": "Scale Insect (48%)", "officer": "R. Cruz", "status": "review"},
    {"external_id": "s6", "survey_date": "May 5, 2026", "farm": "Reyes Farm", "sector": "B (South)", "brgy": "Brgy. Conception", "images": 14, "ai_result": "Yellowing (62%)", "officer": "M. Aguilar", "status": "caution"},
    {"external_id": "s7", "survey_date": "May 4, 2026", "farm": "Santos Farm", "sector": "E (Central)", "brgy": "Brgy. Mandalagan", "images": 11, "ai_result": "Heat Stress (52%)", "officer": "—", "status": "pending"},
    {"external_id": "s8", "survey_date": "May 3, 2026", "farm": "Dela Cruz Farm", "sector": "D (West)", "brgy": "Brgy. Alangilan", "images": 18, "ai_result": "Rhino Beetle (91%)", "officer": "M. Aguilar", "status": "risk"},
    {"external_id": "s9", "survey_date": "May 2, 2026", "farm": "Gonzales Farm", "sector": "D (West)", "brgy": "Brgy. Alangilan", "images": 9, "ai_result": "Scale Insect (73%)", "officer": "R. Cruz", "status": "risk"},
]

SCHEDULED_VISITS = [
    {"external_id": "visit1", "farm": "Reyes Farm", "owner": "A. Reyes", "brgy": "Brgy. Conception", "visit_date": "2026-05-14", "slot": "AM", "scheduled_by": "M. Aguilar", "purpose": "Field check for low yield"},
    {"external_id": "visit2", "farm": "Bautista Farm", "owner": "J. Bautista", "brgy": "Brgy. Conception", "visit_date": "2026-05-15", "slot": "PM", "scheduled_by": "M. Aguilar", "purpose": "Preventive pest follow-up"},
    {"external_id": "visit3", "farm": "Dela Cruz Farm", "owner": "R. Dela Cruz", "brgy": "Brgy. Alangilan", "visit_date": "2026-05-14", "slot": "AM", "scheduled_by": "J. Buenacosa", "purpose": "Urgent beetle response"},
    {"external_id": "visit4", "farm": "Santos Farm", "owner": "L. Santos", "brgy": "Brgy. Mandalagan", "visit_date": "2026-05-16", "slot": "PM", "scheduled_by": "L. Flores", "purpose": "Heat stress validation"},
]

BOOKED_SLOTS = [
    {"visit_date": "2026-05-14", "slot": "AM"},
    {"visit_date": "2026-05-21", "slot": "PM"},
]

OFFICERS = [
    {"emp_id": "PCA-2024-0012", "name": "M. Aguilar", "phone": "0917-345-8801", "brgy": "Brgy. Conception", "farms_covered": "62", "status": "Active", "last_active": "May 9"},
    {"emp_id": "PCA-2024-0013", "name": "R. Cruz", "phone": "0917-220-1144", "brgy": "Brgy. Granada", "farms_covered": "48", "status": "Active", "last_active": "May 8"},
    {"emp_id": "PCA-2024-0014", "name": "J. Buenacosa", "phone": "0917-441-9022", "brgy": "Brgy. Alangilan", "farms_covered": "55", "status": "Active", "last_active": "May 7"},
    {"emp_id": "PCA-2024-0015", "name": "L. Flores", "phone": "0917-883-2011", "brgy": "Brgy. Mandalagan", "farms_covered": "43", "status": "Active", "last_active": "May 6"},
    {"emp_id": "PCA-2024-0016", "name": "K. Mendoza", "phone": "0917-100-7788", "brgy": "Unassigned", "farms_covered": "—", "status": "Inactive", "last_active": "Apr 30"},
    {"emp_id": "PCA-2024-0017", "name": "T. Villanueva", "phone": "0917-200-9901", "brgy": "Unassigned", "farms_covered": "—", "status": "Inactive", "last_active": "Apr 28"},
]

PRIORITY_VISITS = [
    {"external_id": "pv1", "farm": "Dela Cruz Farm - Sector D (West)", "description": "Rhinoceros Beetle outbreak — 3 trees severely damaged.", "level": "urgent", "due_label": "Today", "assigned": "M. Aguilar", "brgy": "Brgy. Alangilan", "completed": False},
    {"external_id": "pv2", "farm": "Gonzales Farm - Sector D (West)", "description": "Scale Insect spreading. Needs biological control.", "level": "urgent", "due_label": "Today", "assigned": "R. Cruz", "brgy": "Brgy. Alangilan", "completed": False},
    {"external_id": "pv3", "farm": "Reyes Farm - Sector B (South)", "description": "Yellowing spreading to upper fronds.", "level": "high", "due_label": "May 11", "assigned": "M. Aguilar", "brgy": "Brgy. Conception", "completed": False},
    {"external_id": "pv4", "farm": "Santos Farm - Sector E (Central)", "description": "Heat stress — irrigation check required.", "level": "high", "due_label": "May 12", "assigned": "R. Flores", "brgy": "Brgy. Mandalagan", "completed": False},
    {"external_id": "pv5", "farm": "Bautista Farm - Sector B (South)", "description": "Minor scale insect — preventive spray recommended.", "level": "medium", "due_label": "May 15", "assigned": "—", "brgy": "Brgy. Conception", "completed": False},
]

FARMER_NOTIFICATIONS = [
    {"external_id": "seed1", "farmer_id": "FARMER-001", "date_line": "May 10, 2026 | 2:00 PM", "body": "Farm profile updated. Contact your officer if any detail is incorrect.", "dot_color": "#166534", "is_new": False},
    {"external_id": "seed2", "farmer_id": "FARMER-001", "date_line": "May 15, 2026 | 9:00 AM", "body": "Farm visit scheduled by Officer M. Aguilar — field check for low yield.", "dot_color": "#ea580c", "is_new": True},
]

FARMER_SUBMISSIONS = [
    {"farmer_id": "FARMER-001", "date_label": "Apr 28, 2026 - Healthy", "sector": "A", "tag": "Healthy", "tag_class": "green", "color": "#22a355"},
    {"farmer_id": "FARMER-001", "date_label": "Apr 10, 2026 - Yellowing", "sector": "B", "tag": "Caution", "tag_class": "orange", "color": "#f59e0b"},
    {"farmer_id": "FARMER-001", "date_label": "Mar 22, 2026 - Healthy", "sector": "D", "tag": "Healthy", "tag_class": "green", "color": "#22a355"},
]

DEFAULT_FARMER_ID = "FARMER-001"
