-- Allow long recommendation titles to be stored in farmer analysis history.
-- Run this once in Supabase SQL Editor if submissions return a 500 error.

alter table farmer_submissions
  alter column date_label type text,
  alter column tag type text;
