-- Create trip invitations table for the Tripmates feature
CREATE TABLE IF NOT EXISTS trip_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  invited_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  invited_user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),
  token TEXT NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(24), 'hex'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  responded_at TIMESTAMPTZ
);

-- Index for looking up invitations by email + trip
CREATE INDEX IF NOT EXISTS idx_trip_invitations_trip_email ON trip_invitations(trip_id, email);
CREATE INDEX IF NOT EXISTS idx_trip_invitations_token ON trip_invitations(token);
CREATE INDEX IF NOT EXISTS idx_trip_invitations_user ON trip_invitations(invited_user_id) WHERE invited_user_id IS NOT NULL;

-- Enable RLS
ALTER TABLE trip_invitations ENABLE ROW LEVEL SECURITY;

-- Trip owner can see all invitations for their trip
CREATE POLICY "Trip owner can view invitations"
  ON trip_invitations FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM trips WHERE trips.id = trip_invitations.trip_id AND trips.user_id = auth.uid()
    )
  );

-- Trip owner can create invitations
CREATE POLICY "Trip owner can create invitations"
  ON trip_invitations FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM trips WHERE trips.id = trip_invitations.trip_id AND trips.user_id = auth.uid()
    )
  );

-- Invited user can see their own invitation (when matched via email or user_id)
CREATE POLICY "Invited user can view own invitation"
  ON trip_invitations FOR SELECT
  USING (
    email = (SELECT email FROM auth.users WHERE id = auth.uid())
    OR invited_user_id = auth.uid()
  );

-- Invited user can update status (accept/decline)
CREATE POLICY "Invited user can update their invitation status"
  ON trip_invitations FOR UPDATE
  USING (
    email = (SELECT email FROM auth.users WHERE id = auth.uid())
    OR invited_user_id = auth.uid()
  )
  WITH CHECK (
    status IN ('accepted', 'declined')
  );