/**
 * Slack export ZIP parsing and chunking.
 * Ported from fancyrobot-cloud/backend/fancyrobot_backend/scraper/slack.py
 *
 * Reads a Slack export ZIP, extracts user/channel info, and yields
 * one TextChunk per message that can be fed into reduceChunks().
 */

import AdmZip from 'adm-zip';
import path from 'path';
import type { CombineChunksStrategy, CombineContext, TextChunk } from '../types.js';

export interface SlackChunkMetadata {
  channel: string;
  title: string;
  users: string[];
  date: string;
  startDate: string;
  endDate: string;
  type: string;
  channelPurpose: string | null;
  channelTopic: string | null;
}

export type SlackChunk = TextChunk<SlackChunkMetadata>;

interface ChannelInfo {
  name: string;
  purpose: string | null;
  topic: string | null;
}

/**
 * Strategy that merges adjacent Slack messages within the same channel.
 * Tracks the user set and date range across merged chunks.
 */
export const slackCombineStrategy: CombineChunksStrategy<SlackChunkMetadata> = {
  combine(
    chunk1: SlackChunk,
    chunk2: SlackChunk,
    context: CombineContext,
  ): SlackChunk[] {
    // Don't merge across channels
    if (chunk1.metadata.channel !== chunk2.metadata.channel) {
      return [chunk1, chunk2];
    }

    const combinedText = `${chunk1.text}\n\n${chunk2.text}`;
    const users = [...new Set([...chunk1.metadata.users, ...chunk2.metadata.users])].sort();

    const dates = [
      chunk1.metadata.startDate,
      chunk2.metadata.startDate,
      chunk1.metadata.endDate,
      chunk2.metadata.endDate,
    ].sort();

    const encoded = context.encoding.encode(combinedText);

    if (encoded.length <= context.targetChunkSize) {
      return [
        {
          text: combinedText,
          metadata: {
            ...chunk1.metadata,
            users,
            date: dates[0]!,
            startDate: dates[0]!,
            endDate: dates[dates.length - 1]!,
          },
          encoded,
        },
      ];
    }

    return [chunk1, chunk2];
  },
};

/**
 * Find the root directory inside a Slack export ZIP.
 * Looks for the directory containing users.json and channels.json.
 */
function findRootDir(zip: AdmZip): string {
  const entries = zip.getEntries().map((e) => e.entryName);
  const usersEntry = entries.find((name) => name.endsWith('users.json'));
  if (!usersEntry) {
    throw new Error('Not a Slack export: no users.json found');
  }
  const root = path.posix.dirname(usersEntry);
  const channelsPath = root ? `${root}/channels.json` : 'channels.json';
  if (!entries.includes(channelsPath)) {
    throw new Error('Not a Slack export: no channels.json found');
  }
  return root;
}

/**
 * Build user ID → display name mapping.
 * Uses the most recent display name (respects name changes).
 */
function getUsers(zip: AdmZip, root: string): Map<string, string> {
  const usersPath = root ? `${root}/users.json` : 'users.json';
  const data = zip.readAsText(usersPath);
  const users: Array<{
    id: string;
    name: string;
    real_name?: string;
    profile?: { display_name?: string };
  }> = JSON.parse(data);

  const map = new Map<string, string>();
  for (const user of users) {
    const displayName =
      user.profile?.display_name || user.real_name || user.name || user.id;
    map.set(user.id, displayName);
  }
  return map;
}

/**
 * Parse channels.json and yield channel info.
 */
function getChannels(zip: AdmZip, root: string): ChannelInfo[] {
  const channelsPath = root ? `${root}/channels.json` : 'channels.json';
  const data = zip.readAsText(channelsPath);
  const channels: Array<{
    name: string;
    purpose?: { value?: string };
    topic?: { value?: string };
  }> = JSON.parse(data);

  return channels.map((ch) => ({
    name: ch.name,
    purpose: ch.purpose?.value || null,
    topic: ch.topic?.value || null,
  }));
}

/**
 * Substitute <@USERID> references with display names.
 */
function subUserNames(text: string, userMap: Map<string, string>): string {
  let result = text;
  for (const [id, name] of userMap) {
    result = result.replaceAll(`<@${id}>`, `<@${name}>`);
  }
  return result;
}

/**
 * Extract a single Slack message into a TextChunk.
 */
function extractMessage(
  message: { user: string; text: string; reactions?: Array<{ name: string; count: number }> },
  userMap: Map<string, string>,
): TextChunk<{ users: string[] }> {
  const userName = userMap.get(message.user) ?? message.user;
  const text = subUserNames(message.text, userMap);

  let reactionTxt = '';
  if (message.reactions?.length) {
    const parts = message.reactions.map(
      (r) => `${r.name}${r.count > 1 ? `\u00d7${r.count}` : ''}`,
    );
    reactionTxt = `\nreactions: ${parts.join(', ')}`;
  }

  return {
    text: `${userName}:\n${text}${reactionTxt}`,
    metadata: { users: [userName] },
  };
}

/**
 * Read a Slack export ZIP buffer and yield one TextChunk per message.
 * Feed the result into reduceChunks(chunks, slackCombineStrategy) to merge.
 */
export function readSlackChunks(zipBuffer: Buffer): SlackChunk[] {
  const zip = new AdmZip(zipBuffer);
  const root = findRootDir(zip);
  const userMap = getUsers(zip, root);
  const channels = getChannels(zip, root);

  const chunks: SlackChunk[] = [];

  for (const channel of channels) {
    // Find all JSON files in the channel directory
    const prefix = root ? `${root}/${channel.name}/` : `${channel.name}/`;
    const messageFiles = zip
      .getEntries()
      .filter((e) => e.entryName.startsWith(prefix) && e.entryName.endsWith('.json'))
      .sort((a, b) => a.entryName.localeCompare(b.entryName));

    for (const entry of messageFiles) {
      const dateStr = path.basename(entry.entryName, '.json');
      const messages: Array<{
        type?: string;
        user: string;
        text: string;
        reactions?: Array<{ name: string; count: number }>;
      }> = JSON.parse(zip.readAsText(entry.entryName));

      for (const message of messages) {
        if (message.type !== 'message') continue;

        const msgChunk = extractMessage(message, userMap);
        chunks.push({
          text: msgChunk.text,
          metadata: {
            channel: channel.name,
            title: `#${channel.name}`,
            users: msgChunk.metadata.users,
            type: 'file',
            date: dateStr,
            startDate: dateStr,
            endDate: dateStr,
            channelPurpose: channel.purpose,
            channelTopic: channel.topic,
          },
        });
      }
    }
  }

  return chunks;
}
