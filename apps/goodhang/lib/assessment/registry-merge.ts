/**
 * Registry Merge Utilities
 *
 * Handles merging new registry items (from FOS Interview extraction) with
 * existing registry items (from Sculptor extraction). Manages ID sequencing
 * and deduplication.
 */

import type {
  ExtractedRegistryData,
  ExtractedStory,
  ExtractedAnecdote,
  ExtractedEvent,
  ExtractedPerson,
  ParkingLotItem,
} from './extraction-prompt';

// =============================================================================
// PARSE EXISTING REGISTRY MARKDOWN
// =============================================================================

/**
 * Parse a registry markdown file to extract the max numeric ID for a given prefix.
 * Matches patterns like `## S01:`, `## A03`, `## EV02:`, `## P01:`, `## PL01:`.
 */
export function getMaxIdFromMarkdown(markdown: string, prefix: string): number {
  const pattern = new RegExp(`## ${prefix}(\\d+)`, 'g');
  let maxId = 0;
  let match;
  while ((match = pattern.exec(markdown)) !== null) {
    const num = parseInt(match[1]!, 10);
    if (num > maxId) maxId = num;
  }
  return maxId;
}

/**
 * Parse existing registry markdown files into an ExtractedRegistryData structure.
 * This is a lightweight parser — we mainly need names/titles for dedup and max IDs
 * for sequencing.
 */
export function parseExistingRegistries(files: Record<string, string>): {
  data: ExtractedRegistryData;
  maxIds: Record<string, number>;
} {
  const maxIds: Record<string, number> = {
    S: 0,
    A: 0,
    EV: 0,
    P: 0,
    PL: 0,
    C: 0,
  };

  // Extract max IDs from each file
  if (files['STORIES.registry.md']) {
    maxIds.S = getMaxIdFromMarkdown(files['STORIES.registry.md'], 'S');
  }
  if (files['ANECDOTES.registry.md']) {
    maxIds.A = getMaxIdFromMarkdown(files['ANECDOTES.registry.md'], 'A');
  }
  if (files['EVENTS.registry.md']) {
    maxIds.EV = getMaxIdFromMarkdown(files['EVENTS.registry.md'], 'EV');
  }
  if (files['PEOPLE.registry.md']) {
    maxIds.P = getMaxIdFromMarkdown(files['PEOPLE.registry.md'], 'P');
  }
  if (files['PARKING_LOT.md']) {
    maxIds.PL = getMaxIdFromMarkdown(files['PARKING_LOT.md'], 'PL');
  }
  if (files['CORRECTIONS.registry.md']) {
    maxIds.C = getMaxIdFromMarkdown(files['CORRECTIONS.registry.md'], 'C');
  }

  // Extract people names for dedup (simple regex: `## P01: Name`)
  const existingPeopleNames = new Set<string>();
  if (files['PEOPLE.registry.md']) {
    const peoplePattern = /## P\d+:\s*(.+)/g;
    let match;
    while ((match = peoplePattern.exec(files['PEOPLE.registry.md'])) !== null) {
      existingPeopleNames.add(match[1]!.trim().toLowerCase());
    }
  }

  return {
    data: {
      stories: [],
      anecdotes: [],
      events: [],
      people: [],
      corrections: [],
      parking_lot: [],
    },
    maxIds,
  };
}

// =============================================================================
// ID ASSIGNMENT
// =============================================================================

/** Pad a number to at least 2 digits */
function padId(num: number): string {
  return String(num).padStart(2, '0');
}

/**
 * Assign new sequential IDs to extracted items, continuing from existing max IDs.
 */
export function assignNewIds(
  newItems: ExtractedRegistryData,
  maxIds: Record<string, number>
): ExtractedRegistryData {
  let storyCounter = maxIds.S || 0;
  let anecdoteCounter = maxIds.A || 0;
  let eventCounter = maxIds.EV || 0;
  let peopleCounter = maxIds.P || 0;
  let parkingLotCounter = maxIds.PL || 0;

  return {
    stories: newItems.stories.map((s) => ({
      ...s,
      id: `S${padId(++storyCounter)}`,
    })),
    anecdotes: newItems.anecdotes.map((a) => ({
      ...a,
      id: `A${padId(++anecdoteCounter)}`,
    })),
    events: newItems.events.map((e) => ({
      ...e,
      id: `EV${padId(++eventCounter)}`,
    })),
    people: newItems.people.map((p) => ({
      ...p,
      id: `P${padId(++peopleCounter)}`,
    })),
    corrections: [], // FOS Interview doesn't produce corrections
    parking_lot: newItems.parking_lot.map((pl) => ({
      ...pl,
      id: `PL${padId(++parkingLotCounter)}`,
    })),
  };
}

// =============================================================================
// DEDUPLICATION
// =============================================================================

/**
 * Deduplicate people by exact name match (case-insensitive).
 * For stories/anecdotes/events, we keep both tellings — different sources provide
 * richer data. Only people need dedup since the same person may be mentioned
 * in both Sculptor and FOS Interview.
 */
export function deduplicatePeople(
  existingPeopleMarkdown: string | undefined,
  newPeople: ExtractedPerson[]
): ExtractedPerson[] {
  if (!existingPeopleMarkdown) return newPeople;

  // Extract existing people names from markdown
  const existingNames = new Set<string>();
  const namePattern = /## P\d+:\s*(.+)/g;
  let match;
  while ((match = namePattern.exec(existingPeopleMarkdown)) !== null) {
    existingNames.add(match[1]!.trim().toLowerCase());
  }

  // Filter out people whose names already exist
  return newPeople.filter(
    (p) => !existingNames.has(p.name.trim().toLowerCase())
  );
}

// =============================================================================
// MERGE ORCHESTRATION
// =============================================================================

export interface MergeResult {
  /** New items with properly sequenced IDs (after dedup) */
  newItems: ExtractedRegistryData;
  /** Existing registry markdown files (unchanged) */
  existingFiles: Record<string, string>;
  /** Counts for logging */
  counts: {
    stories: number;
    anecdotes: number;
    events: number;
    people: number;
    parking_lot: number;
    total: number;
  };
}

/**
 * Orchestrate the full merge: parse existing → dedup → assign IDs → return result.
 */
export function mergeRegistries(
  existingFiles: Record<string, string>,
  newItems: ExtractedRegistryData
): MergeResult {
  const { maxIds } = parseExistingRegistries(existingFiles);

  // Deduplicate people only
  const dedupedPeople = deduplicatePeople(
    existingFiles['PEOPLE.registry.md'],
    newItems.people
  );

  const itemsToMerge: ExtractedRegistryData = {
    ...newItems,
    people: dedupedPeople,
  };

  // Assign new IDs continuing from existing max
  const reIdedItems = assignNewIds(itemsToMerge, maxIds);

  const counts = {
    stories: reIdedItems.stories.length,
    anecdotes: reIdedItems.anecdotes.length,
    events: reIdedItems.events.length,
    people: reIdedItems.people.length,
    parking_lot: reIdedItems.parking_lot.length,
    total:
      reIdedItems.stories.length +
      reIdedItems.anecdotes.length +
      reIdedItems.events.length +
      reIdedItems.people.length +
      reIdedItems.parking_lot.length,
  };

  return { newItems: reIdedItems, existingFiles, counts };
}

// =============================================================================
// MARKDOWN GENERATION
// =============================================================================

/**
 * Generate merged registry markdown files. Appends new items to existing content,
 * or creates new files if none exist.
 */
export function generateMergedRegistryMarkdown(
  mergeResult: MergeResult,
  entitySlug: string
): Array<{ name: string; path: string; content: string }> {
  const files: Array<{ name: string; path: string; content: string }> = [];
  const now = new Date().toISOString();
  const { newItems, existingFiles } = mergeResult;

  // STORIES
  if (newItems.stories.length > 0) {
    const existing = existingFiles['STORIES.registry.md'];
    let content: string;
    if (existing) {
      // Append new stories to existing file
      content = existing.trimEnd() + '\n\n';
      content += `<!-- FOS Interview extraction: ${now} -->\n\n`;
      content += formatStories(newItems.stories);
    } else {
      content = formatStoriesFile(newItems.stories, entitySlug, now);
    }
    files.push({
      name: 'STORIES.registry.md',
      path: `contexts/${entitySlug}/registry/STORIES.registry.md`,
      content,
    });
  }

  // ANECDOTES
  if (newItems.anecdotes.length > 0) {
    const existing = existingFiles['ANECDOTES.registry.md'];
    let content: string;
    if (existing) {
      content = existing.trimEnd() + '\n\n';
      content += `<!-- FOS Interview extraction: ${now} -->\n\n`;
      content += formatAnecdotes(newItems.anecdotes);
    } else {
      content = formatAnecdotesFile(newItems.anecdotes, entitySlug, now);
    }
    files.push({
      name: 'ANECDOTES.registry.md',
      path: `contexts/${entitySlug}/registry/ANECDOTES.registry.md`,
      content,
    });
  }

  // EVENTS
  if (newItems.events.length > 0) {
    const existing = existingFiles['EVENTS.registry.md'];
    let content: string;
    if (existing) {
      content = existing.trimEnd() + '\n\n';
      content += `<!-- FOS Interview extraction: ${now} -->\n\n`;
      content += formatEvents(newItems.events);
    } else {
      content = formatEventsFile(newItems.events, entitySlug, now);
    }
    files.push({
      name: 'EVENTS.registry.md',
      path: `contexts/${entitySlug}/registry/EVENTS.registry.md`,
      content,
    });
  }

  // PEOPLE
  if (newItems.people.length > 0) {
    const existing = existingFiles['PEOPLE.registry.md'];
    let content: string;
    if (existing) {
      content = existing.trimEnd() + '\n\n';
      content += `<!-- FOS Interview extraction: ${now} -->\n\n`;
      content += formatPeople(newItems.people);
    } else {
      content = formatPeopleFile(newItems.people, entitySlug, now);
    }
    files.push({
      name: 'PEOPLE.registry.md',
      path: `contexts/${entitySlug}/registry/PEOPLE.registry.md`,
      content,
    });
  }

  // PARKING_LOT
  if (newItems.parking_lot.length > 0) {
    const existing = existingFiles['PARKING_LOT.md'];
    let content: string;
    if (existing) {
      content = existing.trimEnd() + '\n\n';
      content += `<!-- FOS Interview extraction: ${now} -->\n\n`;
      content += formatParkingLot(newItems.parking_lot);
    } else {
      content = formatParkingLotFile(newItems.parking_lot, entitySlug, now);
    }
    files.push({
      name: 'PARKING_LOT.md',
      path: `contexts/${entitySlug}/registry/PARKING_LOT.md`,
      content,
    });
  }

  return files;
}

// =============================================================================
// FORMAT HELPERS (items only, for appending)
// =============================================================================

function formatStories(stories: ExtractedStory[]): string {
  return stories
    .map(
      (s) => `## ${s.id}: ${s.title}
- **Summary:** ${s.summary}
- **Core Quote:** "${s.core_quote}"
- **Emotional Tone:** ${s.emotional_tone}
- **Tags:** ${(s.tags || []).join(', ')}
- **Used In:** ${(s.used_in || []).join(', ')}
- **Confidence:** ${s.confidence}
- **Source:** FOS Interview`
    )
    .join('\n\n');
}

function formatAnecdotes(anecdotes: ExtractedAnecdote[]): string {
  return anecdotes
    .map(
      (a) => `## ${a.id}
- **Summary:** ${a.summary}
${a.quote ? `- **Quote:** "${a.quote}"` : ''}
- **Illustrates:** ${a.illustrates}
- **Tags:** ${(a.tags || []).join(', ')}
- **Confidence:** ${a.confidence}
- **Source:** FOS Interview`
    )
    .join('\n\n');
}

function formatEvents(events: ExtractedEvent[]): string {
  return events
    .map(
      (e) => `## ${e.id}
- **Date Range:** ${e.date_range}
- **Summary:** ${e.summary}
- **Impact:** ${e.impact}
- **Tags:** ${(e.tags || []).join(', ')}
- **Confidence:** ${e.confidence}
- **Source:** FOS Interview`
    )
    .join('\n\n');
}

function formatPeople(people: ExtractedPerson[]): string {
  return people
    .map(
      (p) => `## ${p.id}: ${p.name}
- **Relationship:** ${p.relationship}
- **Context:** ${p.context}
- **Can Reference:** ${p.can_reference ? 'Yes' : 'No'}
${p.reference_rules ? `- **Reference Rules:** ${p.reference_rules}` : ''}
- **Tags:** ${(p.tags || []).join(', ')}
- **Source:** FOS Interview`
    )
    .join('\n\n');
}

function formatParkingLot(items: ParkingLotItem[]): string {
  return items
    .map(
      (pl) => `## ${pl.id}: ${pl.topic}
- **Priority:** ${pl.priority}
- **Context:** ${pl.context}
${pl.follow_up_questions ? `- **Follow-up Questions:**\n${pl.follow_up_questions.map((q) => `  - ${q}`).join('\n')}` : ''}
- **Source:** FOS Interview`
    )
    .join('\n\n');
}

// =============================================================================
// FORMAT HELPERS (full files, for new creation)
// =============================================================================

function formatStoriesFile(stories: ExtractedStory[], entitySlug: string, now: string): string {
  return `---
title: Stories Registry
type: registry
entity: ${entitySlug}
generated: "${now}"
---

# Stories Registry

Canonical stories with IDs for reference across commandment files.

${formatStories(stories)}
`;
}

function formatAnecdotesFile(anecdotes: ExtractedAnecdote[], entitySlug: string, now: string): string {
  return `---
title: Anecdotes Registry
type: registry
entity: ${entitySlug}
generated: "${now}"
---

# Anecdotes Registry

Brief examples and proof points for reference.

${formatAnecdotes(anecdotes)}
`;
}

function formatEventsFile(events: ExtractedEvent[], entitySlug: string, now: string): string {
  return `---
title: Events Registry
type: registry
entity: ${entitySlug}
generated: "${now}"
---

# Events Registry

Key life events with dates/timeframes.

${formatEvents(events)}
`;
}

function formatPeopleFile(people: ExtractedPerson[], entitySlug: string, now: string): string {
  return `---
title: People Registry
type: registry
entity: ${entitySlug}
generated: "${now}"
---

# People Registry

Important relationships and reference rules.

${formatPeople(people)}
`;
}

function formatParkingLotFile(items: ParkingLotItem[], entitySlug: string, now: string): string {
  return `---
title: Parking Lot
type: registry
entity: ${entitySlug}
generated: "${now}"
---

# Parking Lot

Topics mentioned but not fully explored. Follow up later.

${formatParkingLot(items)}
`;
}
