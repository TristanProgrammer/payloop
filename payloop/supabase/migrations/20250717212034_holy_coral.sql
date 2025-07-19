/*
  # Initial Schema for Property Management SaaS

  1. New Tables
    - `landlords`
      - `id` (uuid, primary key)
      - `business_name` (text)
      - `owner_name` (text)
      - `phone` (text, unique)
      - `email` (text, unique)
      - `subscription_plan` (text)
      - `subscription_status` (text)
      - `trial_ends_at` (timestamptz)
      - `subscription_ends_at` (timestamptz)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

    - `properties`
      - `id` (uuid, primary key)
      - `landlord_id` (uuid, foreign key)
      - `name` (text)
      - `location` (text)
      - `total_units` (integer)
      - `property_type` (text)
      - `occupied_units` (integer)
      - `monthly_revenue` (decimal)
      - `outstanding_payments` (decimal)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

    - `tenants`
      - `id` (uuid, primary key)
      - `landlord_id` (uuid, foreign key)
      - `property_id` (uuid, foreign key)
      - `unit_number` (text)
      - `name` (text)
      - `phone` (text)
      - `email` (text)
      - `rent_amount` (decimal)
      - `due_date` (integer)
      - `move_in_date` (date)
      - `status` (text)
      - `last_payment_date` (date)
      - `outstanding_amount` (decimal)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

    - `payments`
      - `id` (uuid, primary key)
      - `tenant_id` (uuid, foreign key)
      - `landlord_id` (uuid, foreign key)
      - `amount` (decimal)
      - `payment_date` (timestamptz)
      - `method` (text)
      - `reference` (text)
      - `status` (text)
      - `created_at` (timestamptz)

    - `payment_confirmations`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key)
      - `full_name` (text)
      - `phone` (text)
      - `plan_selected` (text)
      - `transaction_code` (text)
      - `status` (text)
      - `timestamp` (timestamptz)
      - `approved_at` (timestamptz)
      - `rejected_at` (timestamptz)
      - `admin_notes` (text)

    - `sms_logs`
      - `id` (uuid, primary key)
      - `tenant_id` (uuid, foreign key)
      - `landlord_id` (uuid, foreign key)
      - `recipient_phone` (text)
      - `recipient_name` (text)
      - `message` (text)
      - `sms_type` (text)
      - `status` (text)
      - `message_id` (text)
      - `cost` (decimal)
      - `error_message` (text)
      - `sent_at` (timestamptz)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to access their own data
    - Add admin policies for payment confirmations and SMS logs

  3. Indexes
    - Add indexes for frequently queried columns
    - Add composite indexes for complex queries
*/

-- Create landlords table
CREATE TABLE IF NOT EXISTS landlords (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_name text NOT NULL,
  owner_name text NOT NULL,
  phone text UNIQUE NOT NULL,
  email text UNIQUE NOT NULL,
  subscription_plan text NOT NULL DEFAULT 'trial',
  subscription_status text NOT NULL DEFAULT 'active',
  trial_ends_at timestamptz DEFAULT (now() + interval '7 days'),
  subscription_ends_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create properties table
CREATE TABLE IF NOT EXISTS properties (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  landlord_id uuid REFERENCES landlords(id) ON DELETE CASCADE,
  name text NOT NULL,
  location text NOT NULL,
  total_units integer NOT NULL DEFAULT 1,
  property_type text NOT NULL DEFAULT 'apartment',
  occupied_units integer NOT NULL DEFAULT 0,
  monthly_revenue decimal(12,2) NOT NULL DEFAULT 0,
  outstanding_payments decimal(12,2) NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create tenants table
CREATE TABLE IF NOT EXISTS tenants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  landlord_id uuid REFERENCES landlords(id) ON DELETE CASCADE,
  property_id uuid REFERENCES properties(id) ON DELETE CASCADE,
  unit_number text NOT NULL,
  name text NOT NULL,
  phone text NOT NULL,
  email text,
  rent_amount decimal(10,2) NOT NULL,
  due_date integer NOT NULL CHECK (due_date >= 1 AND due_date <= 31),
  move_in_date date NOT NULL,
  status text NOT NULL DEFAULT 'active',
  last_payment_date date,
  outstanding_amount decimal(10,2) NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create payments table
CREATE TABLE IF NOT EXISTS payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid REFERENCES tenants(id) ON DELETE CASCADE,
  landlord_id uuid REFERENCES landlords(id) ON DELETE CASCADE,
  amount decimal(10,2) NOT NULL,
  payment_date timestamptz NOT NULL DEFAULT now(),
  method text NOT NULL DEFAULT 'mpesa',
  reference text,
  status text NOT NULL DEFAULT 'paid',
  created_at timestamptz DEFAULT now()
);

-- Create payment_confirmations table
CREATE TABLE IF NOT EXISTS payment_confirmations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES landlords(id) ON DELETE CASCADE,
  full_name text NOT NULL,
  phone text NOT NULL,
  plan_selected text NOT NULL,
  transaction_code text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  timestamp timestamptz DEFAULT now(),
  approved_at timestamptz,
  rejected_at timestamptz,
  admin_notes text
);

-- Create sms_logs table
CREATE TABLE IF NOT EXISTS sms_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid REFERENCES tenants(id) ON DELETE SET NULL,
  landlord_id uuid REFERENCES landlords(id) ON DELETE CASCADE,
  recipient_phone text NOT NULL,
  recipient_name text NOT NULL,
  message text NOT NULL,
  sms_type text NOT NULL DEFAULT 'custom',
  status text NOT NULL DEFAULT 'sent',
  message_id text,
  cost decimal(8,2) NOT NULL DEFAULT 0,
  error_message text,
  sent_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE landlords ENABLE ROW LEVEL SECURITY;
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_confirmations ENABLE ROW LEVEL SECURITY;
ALTER TABLE sms_logs ENABLE ROW LEVEL SECURITY;

-- Create policies for landlords
CREATE POLICY "Landlords can read own data"
  ON landlords
  FOR SELECT
  TO authenticated
  USING (auth.uid()::text = id::text);

--  Clean insert policy for landlords
CREATE POLICY "Landlords can insert their own record"
ON landlords
FOR INSERT
TO authenticated
WITH CHECK (
  id = auth.uid()
);
ALTER TABLE landlords ADD CONSTRAINT unique_id UNIQUE (id);

-- Optional: Create an index to improve policy performance
CREATE UNIQUE INDEX idx_landlords_uid ON landlords(uid);

CREATE POLICY "Landlords can update own data"
  ON landlords
  FOR UPDATE
  TO authenticated
  USING (auth.uid()::text = id::text);

-- Create policies for properties
CREATE POLICY "Landlords can manage own properties"
  ON properties
  FOR ALL
  TO authenticated
  USING (landlord_id::text = auth.uid()::text);

-- Create policies for tenants
CREATE POLICY "Landlords can manage own tenants"
  ON tenants
  FOR ALL
  TO authenticated
  USING (landlord_id::text = auth.uid()::text);

-- Create policies for payments
CREATE POLICY "Landlords can manage own payments"
  ON payments
  FOR ALL
  TO authenticated
  USING (landlord_id::text = auth.uid()::text);

-- Create policies for payment_confirmations
CREATE POLICY "Users can read own payment confirmations"
  ON payment_confirmations
  FOR SELECT
  TO authenticated
  USING (user_id::text = auth.uid()::text);

CREATE POLICY "Users can insert own payment confirmations"
  ON payment_confirmations
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id::text = auth.uid()::text);

-- Create policies for sms_logs
CREATE POLICY "Landlords can read own SMS logs"
  ON sms_logs
  FOR SELECT
  TO authenticated
  USING (landlord_id::text = auth.uid()::text);

CREATE POLICY "Landlords can insert SMS logs"
  ON sms_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (landlord_id::text = auth.uid()::text);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_properties_landlord_id ON properties(landlord_id);
CREATE INDEX IF NOT EXISTS idx_tenants_landlord_id ON tenants(landlord_id);
CREATE INDEX IF NOT EXISTS idx_tenants_property_id ON tenants(property_id);
CREATE INDEX IF NOT EXISTS idx_payments_tenant_id ON payments(tenant_id);
CREATE INDEX IF NOT EXISTS idx_payments_landlord_id ON payments(landlord_id);
CREATE INDEX IF NOT EXISTS idx_payment_confirmations_user_id ON payment_confirmations(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_confirmations_status ON payment_confirmations(status);
CREATE INDEX IF NOT EXISTS idx_sms_logs_landlord_id ON sms_logs(landlord_id);
CREATE INDEX IF NOT EXISTS idx_sms_logs_tenant_id ON sms_logs(tenant_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_landlords_updated_at BEFORE UPDATE ON landlords FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_properties_updated_at BEFORE UPDATE ON properties FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_tenants_updated_at BEFORE UPDATE ON tenants FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();