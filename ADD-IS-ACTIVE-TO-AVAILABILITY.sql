ALTER TABLE expert_availability ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
