-- =============================================================================
-- Cross-Forest Messaging System
-- =============================================================================
-- Enables founder-to-founder communication across forests
-- Demo: Justin pings Scott, Scott's Claude surfaces the message later
-- =============================================================================

-- Messages table in founder_os schema
create table if not exists founder_os.messages (
  id uuid primary key default gen_random_uuid(),

  -- Sender info
  from_forest text not null,           -- e.g., 'founder:justin'
  from_name text not null,             -- Human-readable: 'Justin Strackany'

  -- Recipient info
  to_forest text not null,             -- e.g., 'founder:scott-leese'
  to_name text not null,               -- Human-readable: 'Scott Leese'

  -- Message content
  subject text,                        -- Optional subject line
  content text not null,               -- The actual message

  -- Status tracking
  status text not null default 'pending'
    check (status in ('pending', 'delivered', 'read', 'replied')),

  -- Threading
  reply_to_id uuid references founder_os.messages(id),

  -- Timestamps
  created_at timestamptz not null default now(),
  delivered_at timestamptz,
  read_at timestamptz,
  replied_at timestamptz,

  -- Metadata
  metadata jsonb default '{}'
);

-- Indexes for common queries
create index idx_messages_to_forest on founder_os.messages(to_forest);
create index idx_messages_from_forest on founder_os.messages(from_forest);
create index idx_messages_status on founder_os.messages(status);
create index idx_messages_pending on founder_os.messages(to_forest, status)
  where status = 'pending';
create index idx_messages_thread on founder_os.messages(reply_to_id)
  where reply_to_id is not null;

-- Comments
comment on table founder_os.messages is 'Cross-forest messaging between founder OS instances';
comment on column founder_os.messages.from_forest is 'Layer/forest identifier of sender (e.g., founder:justin)';
comment on column founder_os.messages.to_forest is 'Layer/forest identifier of recipient (e.g., founder:scott-leese)';
comment on column founder_os.messages.status is 'Message lifecycle: pending -> delivered -> read -> replied';

-- =============================================================================
-- Helper function to get pending message count for a forest
-- =============================================================================
create or replace function founder_os.get_pending_message_count(p_forest text)
returns integer as $$
  select count(*)::integer
  from founder_os.messages
  where to_forest = p_forest
    and status = 'pending';
$$ language sql stable;

-- =============================================================================
-- Helper function to mark messages as delivered
-- =============================================================================
create or replace function founder_os.mark_messages_delivered(p_forest text)
returns integer as $$
declare
  v_count integer;
begin
  update founder_os.messages
  set status = 'delivered',
      delivered_at = now()
  where to_forest = p_forest
    and status = 'pending';

  get diagnostics v_count = row_count;
  return v_count;
end;
$$ language plpgsql;

-- =============================================================================
-- Grant permissions (service role for MCP servers)
-- =============================================================================
grant usage on schema founder_os to service_role;
grant all on founder_os.messages to service_role;
grant execute on function founder_os.get_pending_message_count(text) to service_role;
grant execute on function founder_os.mark_messages_delivered(text) to service_role;
