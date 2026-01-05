export type MembershipTier = 'free' | 'core';
export type ApplicationStatus = 'pending' | 'approved' | 'rejected';
export type UserRole = 'member' | 'ambassador' | 'admin';
export type MembershipStatus = 'pending' | 'active' | 'suspended' | 'alumni';

export interface Profile {
  id: string;
  email: string;
  name: string;
  avatar_url?: string;
  bio?: string;
  role?: string;
  company?: string;
  linkedin_url?: string;
  interests?: string[];
  membership_tier: MembershipTier;
  membership_status: MembershipStatus;
  user_role: UserRole;
  region_id?: string;
  created_at: string;
  updated_at: string;
}

export interface Application {
  id: string;
  email: string;
  name: string;
  linkedin_url?: string;
  why_join: string;
  contribution?: string;
  referral_source?: string;
  status: ApplicationStatus;
  reviewed_by?: string;
  reviewed_at?: string;
  interview_scheduled_at?: string;
  interview_completed_at?: string;
  interview_notes?: string;
  admin_notes?: string;
  rejection_reason?: string;
  created_at: string;
}

export interface Event {
  id: string;
  title: string;
  description?: string;
  location: string;
  location_lat?: number;
  location_lng?: number;
  event_datetime: string;
  capacity?: number;
  is_public: boolean;
  created_by?: string;
  region_id?: string;
  image_url?: string;
  created_at: string;
  updated_at: string;
}

export interface RSVP {
  id: string;
  event_id: string;
  user_id?: string;
  guest_name?: string;
  guest_email?: string;
  plus_ones: number;
  created_at: string;
}

export interface Region {
  id: string;
  name: string;
  slug: string;
  description?: string;
  ambassador_ids?: string[];
  created_at: string;
}

// Joined types for queries
export interface EventWithRSVPCount extends Event {
  rsvp_count?: number;
  user_rsvp?: RSVP;
}

export interface ApplicationWithReviewer extends Application {
  reviewer?: Profile;
}

// ============================================================
// BEACON TYPES
// ============================================================

export type BeaconStatus = 'active' | 'closed';
export type BeaconDurationHint = 'quick_drink' | 'few_hours' | 'all_night';
export type BeaconResponseType = 'on_my_way' | 'next_time';

export interface Beacon {
  id: string;
  user_id: string;
  lat: number;
  lng: number;
  venue_name: string | null;
  venue_address: string | null;
  vibe_text: string | null;
  duration_hint: BeaconDurationHint | null;
  tagged_member_ids: string[];
  status: BeaconStatus;
  created_at: string;
  closed_at: string | null;
  updated_at: string;
}

export interface BeaconResponse {
  id: string;
  beacon_id: string;
  user_id: string;
  response_type: BeaconResponseType;
  created_at: string;
}

export interface BeaconPing {
  id: string;
  beacon_id: string;
  from_user_id: string;
  created_at: string;
}

// Joined types for queries
export interface BeaconWithCreator extends Beacon {
  creator?: Profile;
}

export interface BeaconWithDetails extends BeaconWithCreator {
  response_counts?: {
    on_my_way: number;
    next_time: number;
  };
  distance_miles?: number;
  responses?: BeaconResponseWithUser[];
  pings?: BeaconPingWithUser[];
}

export interface BeaconResponseWithUser extends BeaconResponse {
  user?: Profile;
}

export interface BeaconPingWithUser extends BeaconPing {
  from_user?: Profile;
}

// ============================================================
// FAVOR TOKEN TYPES
// ============================================================

export type TokenMintSource = 'initial_grant' | 'event_drop' | 'quest_reward' | 'admin_grant';

export type FavorStatus =
  | 'asked'
  | 'negotiating'
  | 'accepted'
  | 'pending_confirmation'
  | 'completed'
  | 'declined'
  | 'withdrawn'
  | 'disputed';

export type FavorCategory =
  | 'introductions'
  | 'expertise'
  | 'local_knowledge'
  | 'mentorship'
  | 'creative'
  | 'technical'
  | 'career'
  | 'wellness'
  | 'other';

export interface FavorToken {
  id: string;
  name: string;
  visual_seed: string;
  signature_pattern: string;
  minted_at: string;
  mint_source: TokenMintSource;
  mint_event_id: string | null;
  current_owner_id: string;
  original_owner_id: string;
  favor_history: string[];
  created_at: string;
  updated_at: string;
}

export interface Favor {
  id: string;
  token_id: string;
  requester_id: string;
  recipient_id: string;
  description: string;
  status: FavorStatus;
  created_at: string;
  accepted_at: string | null;
  completed_at: string | null;
  updated_at: string;
  completion_note: string | null;
  revision_request: string | null;
  // Negotiation fields
  current_proposal_id: string | null;
  requester_confirmed: boolean;
  recipient_confirmed: boolean;
}

// ============================================================
// FAVOR PROPOSAL TYPES (Counter-proposal negotiation)
// ============================================================

export type ProposalStatus = 'pending' | 'accepted' | 'declined' | 'superseded';

export interface FavorProposal {
  id: string;
  favor_id: string;
  proposer_id: string;
  description: string;
  status: ProposalStatus;
  awaiting_response_from: string;
  created_at: string;
  responded_at: string | null;
}

export interface FavorProposalWithProposer extends FavorProposal {
  proposer?: Profile;
  awaiting_user?: Profile;
}

export interface FavorMessage {
  id: string;
  favor_id: string;
  sender_id: string;
  message: string;
  message_type: 'message' | 'counter_proposal' | 'status_change';
  proposed_description: string | null;
  created_at: string;
}

export interface FavorListing {
  id: string;
  owner_id: string;
  description: string;
  category: FavorCategory;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface FavorBlock {
  id: string;
  blocker_id: string;
  blocked_id: string;
  created_at: string;
}

// Joined types for favor queries
export interface FavorTokenWithOwner extends FavorToken {
  owner?: Profile;
  original_owner?: Profile;
}

export interface FavorTokenWithHistory extends FavorToken {
  owner?: Profile;
  favors?: FavorWithParties[];
}

export interface FavorWithParties extends Favor {
  requester?: Profile;
  recipient?: Profile;
  token?: FavorToken;
}

export interface FavorWithDetails extends FavorWithParties {
  messages?: FavorMessageWithSender[];
  proposals?: FavorProposalWithProposer[];
  current_proposal?: FavorProposalWithProposer;
}

export interface FavorMessageWithSender extends FavorMessage {
  sender?: Profile;
}

export interface FavorListingWithOwner extends FavorListing {
  owner?: Profile;
}

// ============================================================
// D&D CHARACTER TYPES
// ============================================================

export type CharacterRace = 'human' | 'elf' | 'dwarf' | 'orc' | 'halfling' | 'dragonborn';

export type CharacterAlignment =
  | 'LG' | 'NG' | 'CG'  // Good row
  | 'LN' | 'TN' | 'CN'  // Neutral row
  | 'LE' | 'NE' | 'CE'; // Evil row

// 6 class branches based on primary attribute
export type ClassBranch = 'fighter' | 'rogue' | 'ranger' | 'wizard' | 'cleric' | 'bard';

// 54 classes (6 branches x 9 alignments) - subset shown, full list in character/types.ts
export type CharacterClass =
  // Fighter Branch (STR)
  | 'paladin' | 'guardian' | 'berserker' | 'soldier' | 'mercenary' | 'barbarian' | 'warlord' | 'bounty_hunter' | 'raider'
  // Rogue Branch (DEX)
  | 'scout' | 'agent' | 'swashbuckler' | 'spy' | 'thief' | 'trickster' | 'assassin' | 'freelancer' | 'poacher'
  // Ranger Branch (CON)
  | 'warden' | 'pathfinder' | 'wanderer' | 'sentinel' | 'survivalist' | 'nomad' | 'tracker' | 'scavenger' | 'outcast'
  // Wizard Branch (INT)
  | 'sage' | 'enchanter' | 'alchemist' | 'lorekeeper' | 'artificer' | 'illusionist' | 'necromancer' | 'warlock' | 'maverick'
  // Cleric Branch (WIS)
  | 'priest' | 'healer' | 'shaman' | 'judge' | 'druid' | 'oracle' | 'inquisitor' | 'cult_leader' | 'heretic'
  // Bard Branch (CHA)
  | 'herald' | 'minstrel' | 'troubadour' | 'diplomat' | 'performer' | 'fool' | 'propagandist' | 'charlatan' | 'provocateur';

export interface MemberCharacter {
  id: string;
  user_id: string;

  // Core D&D Identity
  race: CharacterRace;
  class: CharacterClass;
  alignment: CharacterAlignment;

  // 6 Attributes (8-20 range)
  attr_strength: number;
  attr_dexterity: number;
  attr_constitution: number;
  attr_intelligence: number;
  attr_wisdom: number;
  attr_charisma: number;

  // Enneagram (e.g., "7w8")
  enneagram_type: string | null;

  // Avatar
  avatar_seed: string;
  avatar_url: string | null;

  // AI-Generated Profile Summary
  profile_summary: string | null;
  key_strengths: string[] | null;
  summary_generated_at: string | null;

  // Status
  is_active: boolean;
  is_public: boolean;

  // Timestamps
  created_at: string;
  updated_at: string;
}

// Joined types for queries
export interface MemberCharacterWithTitle extends MemberCharacter {
  display_title: string | null;  // e.g., "Master Orcish Maverick"
}

export interface MemberCharacterWithProfile extends MemberCharacterWithTitle {
  member_name: string;
  profile_avatar_url: string | null;
  company: string | null;
  cs_score: number | null;
  cs_archetype: string | null;
  cs_tier: string | null;
}

// For Breakouts feature - matches the view
export type CharacterForBreakouts = MemberCharacterWithProfile;
