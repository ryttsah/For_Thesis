-- Allow farmer analysis confidence to keep one decimal place, e.g. 99.9.
-- Run this once in Supabase SQL Editor if the column already exists as integer.

alter table farmer_submissions
  alter column confidence_pct type double precision
  using confidence_pct::double precision;
