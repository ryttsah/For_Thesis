-- Farmer registration workflow (pending → approved / rejected)

CREATE TABLE IF NOT EXISTS farmer_registrations (
    id SERIAL PRIMARY KEY,
    farmer_id VARCHAR(32) NOT NULL UNIQUE,
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    first_name VARCHAR(80) NOT NULL,
    middle_initial VARCHAR(10) NOT NULL DEFAULT '',
    last_name VARCHAR(80) NOT NULL,
    farm_address VARCHAR(255) NOT NULL DEFAULT '',
    brgy VARCHAR(120) NOT NULL,
    municipality VARCHAR(120) NOT NULL,
    province VARCHAR(120) NOT NULL DEFAULT 'Negros Occidental',
    area_hectares DOUBLE PRECISION NOT NULL,
    area_input_unit VARCHAR(8) NOT NULL DEFAULT 'ha',
    area_input_value DOUBLE PRECISION NOT NULL,
    farm_status VARCHAR(40) NOT NULL,
    phone VARCHAR(40) NOT NULL,
    alt_phone VARCHAR(40) NOT NULL DEFAULT '',
    reg_purpose_type VARCHAR(40) NOT NULL DEFAULT 'registration_only',
    reg_purpose_other_text VARCHAR(255) NOT NULL DEFAULT '',
    rejection_reason TEXT,
    approved_at TIMESTAMPTZ,
    approved_by VARCHAR(120),
    rejected_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_farmer_registrations_status ON farmer_registrations (status);
