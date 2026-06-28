
-- trip_members
CREATE TABLE public.trip_members (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips(id) on delete cascade,
  user_id uuid not null,
  role text not null default 'collaborator',
  created_at timestamptz not null default now(),
  unique(trip_id, user_id)
);
GRANT SELECT, INSERT, DELETE ON public.trip_members TO authenticated;
GRANT ALL ON public.trip_members TO service_role;
ALTER TABLE public.trip_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "members can view own membership rows"
  ON public.trip_members FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR EXISTS (SELECT 1 FROM public.trips t WHERE t.id = trip_id AND t.user_id = auth.uid()));

CREATE POLICY "trip owner manages members"
  ON public.trip_members FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.trips t WHERE t.id = trip_id AND t.user_id = auth.uid()) OR user_id = auth.uid());

CREATE POLICY "trip owner deletes members"
  ON public.trip_members FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.trips t WHERE t.id = trip_id AND t.user_id = auth.uid()) OR user_id = auth.uid());

-- trip_invites
CREATE TABLE public.trip_invites (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips(id) on delete cascade,
  email text not null,
  token text not null unique,
  status text not null default 'pending',
  invited_by uuid not null,
  accepted_user_id uuid,
  accepted_at timestamptz,
  created_at timestamptz not null default now()
);
CREATE INDEX trip_invites_token_idx ON public.trip_invites(token);
CREATE INDEX trip_invites_email_idx ON public.trip_invites(lower(email));
GRANT SELECT, INSERT, UPDATE, DELETE ON public.trip_invites TO authenticated;
GRANT ALL ON public.trip_invites TO service_role;
ALTER TABLE public.trip_invites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "owner can manage invites"
  ON public.trip_invites FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.trips t WHERE t.id = trip_id AND t.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.trips t WHERE t.id = trip_id AND t.user_id = auth.uid()));

CREATE POLICY "invitee can view own invites by email"
  ON public.trip_invites FOR SELECT TO authenticated
  USING (lower(email) = lower((auth.jwt() ->> 'email')));

-- Extend trips SELECT so members can view
CREATE POLICY "members can view trip"
  ON public.trips FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.trip_members m WHERE m.trip_id = trips.id AND m.user_id = auth.uid()));
