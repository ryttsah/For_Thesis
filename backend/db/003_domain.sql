-- Domain tables: farms, queue, surveys, visits, officers, farmer portal data

CREATE TABLE IF NOT EXISTS farms (
    id SERIAL PRIMARY KEY,
    external_id VARCHAR(32) UNIQUE,
    name VARCHAR(120) NOT NULL,
    owner VARCHAR(80) NOT NULL,
    sector VARCHAR(40) NOT NULL,
    brgy VARCHAR(120) NOT NULL,
    trees INTEGER NOT NULL DEFAULT 0,
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    last_survey VARCHAR(40) NOT NULL DEFAULT '—'
);

CREATE TABLE IF NOT EXISTS validation_queue (
    id SERIAL PRIMARY KEY,
    external_id VARCHAR(32) NOT NULL UNIQUE,
    brgy VARCHAR(120) NOT NULL,
    title VARCHAR(200) NOT NULL,
    sub VARCHAR(200) NOT NULL,
    conf VARCHAR(16) NOT NULL,
    validated BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS surveys (
    id SERIAL PRIMARY KEY,
    external_id VARCHAR(32) UNIQUE,
    survey_date VARCHAR(40) NOT NULL,
    farm VARCHAR(120) NOT NULL,
    sector VARCHAR(40) NOT NULL,
    brgy VARCHAR(120) NOT NULL,
    images INTEGER NOT NULL DEFAULT 0,
    ai_result VARCHAR(120) NOT NULL,
    officer VARCHAR(80) NOT NULL DEFAULT '—',
    status VARCHAR(20) NOT NULL
);

CREATE TABLE IF NOT EXISTS scheduled_visits (
    id SERIAL PRIMARY KEY,
    external_id VARCHAR(32) NOT NULL UNIQUE,
    farm VARCHAR(120) NOT NULL,
    owner VARCHAR(80) NOT NULL,
    brgy VARCHAR(120) NOT NULL,
    visit_date VARCHAR(16) NOT NULL,
    slot VARCHAR(4) NOT NULL,
    scheduled_by VARCHAR(80) NOT NULL,
    purpose TEXT NOT NULL DEFAULT ''
);

CREATE TABLE IF NOT EXISTS booked_slots (
    id SERIAL PRIMARY KEY,
    visit_date VARCHAR(16) NOT NULL,
    slot VARCHAR(4) NOT NULL,
    UNIQUE (visit_date, slot)
);

CREATE TABLE IF NOT EXISTS officers (
    emp_id VARCHAR(32) PRIMARY KEY,
    name VARCHAR(80) NOT NULL,
    phone VARCHAR(40) NOT NULL,
    brgy VARCHAR(120) NOT NULL,
    farms_covered VARCHAR(16) NOT NULL DEFAULT '—',
    status VARCHAR(20) NOT NULL DEFAULT 'Active',
    last_active VARCHAR(20) NOT NULL DEFAULT '—'
);

CREATE TABLE IF NOT EXISTS priority_visits (
    id SERIAL PRIMARY KEY,
    external_id VARCHAR(32) NOT NULL UNIQUE,
    farm VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    level VARCHAR(16) NOT NULL,
    due_label VARCHAR(32) NOT NULL,
    assigned VARCHAR(80) NOT NULL DEFAULT '—',
    brgy VARCHAR(120) NOT NULL,
    completed BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS farmer_notifications (
    id SERIAL PRIMARY KEY,
    external_id VARCHAR(32) UNIQUE,
    farmer_id VARCHAR(32) NOT NULL,
    date_line VARCHAR(80) NOT NULL,
    body TEXT NOT NULL,
    dot_color VARCHAR(16) NOT NULL DEFAULT '#166534',
    is_new BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS farmer_submissions (
    id SERIAL PRIMARY KEY,
    farmer_id VARCHAR(32) NOT NULL,
    date_label VARCHAR(80) NOT NULL,
    sector VARCHAR(8) NOT NULL,
    tag VARCHAR(32) NOT NULL,
    tag_class VARCHAR(16) NOT NULL,
    color VARCHAR(16) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_farms_brgy ON farms (brgy);
CREATE INDEX IF NOT EXISTS idx_validation_queue_brgy ON validation_queue (brgy);
CREATE INDEX IF NOT EXISTS idx_surveys_brgy ON surveys (brgy);
CREATE INDEX IF NOT EXISTS idx_scheduled_visits_brgy ON scheduled_visits (brgy);
CREATE INDEX IF NOT EXISTS idx_priority_visits_brgy ON priority_visits (brgy);
CREATE INDEX IF NOT EXISTS idx_farmer_notifications_farmer ON farmer_notifications (farmer_id);
CREATE INDEX IF NOT EXISTS idx_farmer_submissions_farmer ON farmer_submissions (farmer_id);
