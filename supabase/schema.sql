create table policy_schedules (
  id bigint generated always as identity primary key,

  -- Raw values as uploaded
  client_name text,
  policy_no text,
  division text,
  policy_type text,
  premium_raw text,
  underwriter text,
  policy_expiry_raw text,
  renewal_status_raw text,
  payment_status_raw text,
  claims_reported text,
  claim_amount_raw text,
  claim_description text,
  loss_ratio_raw text,

  -- Cleaned values
  premium_cleaned numeric(15,2),
  policy_expiry_cleaned date,
  renewal_status_cleaned text,
  payment_status_cleaned text,
  loss_ratio_cleaned numeric(8,2),
  claim_amount_cleaned numeric(15,2),
  days_to_expiry integer,

  -- Approval workflows
  approval_status text not null default 'pending',
  reviewed_at timestamptz,
  claim_approval_status text not null default 'not_applicable',
  claim_reviewed_at timestamptz,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Lock the table to the public; only the server-side secret key can access it
alter table policy_schedules enable row level security;
