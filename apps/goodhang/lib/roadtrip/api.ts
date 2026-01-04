'use client';

import { createClient } from '@/lib/supabase/client';
import { RoadtripInterest, RoadtripMessage, CustomSpotData } from '@/types/roadtrip';

export async function submitInterest(interest: RoadtripInterest): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient();

  const { error } = await supabase
    .from('roadtrip_interests')
    .insert([interest]);

  if (error) {
    console.error('Error submitting interest:', error);
    return { success: false, error: error.message };
  }

  return { success: true };
}

export async function submitMessage(message: RoadtripMessage): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient();

  const { error } = await supabase
    .from('roadtrip_messages')
    .insert([message]);

  if (error) {
    console.error('Error submitting message:', error);
    return { success: false, error: error.message };
  }

  return { success: true };
}

export async function getCustomSpots(): Promise<CustomSpotData[]> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('roadtrip_interests')
    .select('custom_city, custom_lat, custom_lng')
    .not('custom_city', 'is', null);

  if (error) {
    console.error('Error fetching custom spots:', error);
    return [];
  }

  // Group by city and count
  const spotCounts = new Map<string, CustomSpotData>();

  data?.forEach((item: { custom_city: string | null; custom_lat: number | null; custom_lng: number | null }) => {
    if (item.custom_city && item.custom_lat && item.custom_lng) {
      const key = `${item.custom_lat},${item.custom_lng}`;
      const existing = spotCounts.get(key);
      if (existing) {
        existing.count += 1;
      } else {
        spotCounts.set(key, {
          city: item.custom_city,
          lat: item.custom_lat,
          lng: item.custom_lng,
          count: 1,
        });
      }
    }
  });

  return Array.from(spotCounts.values());
}

export async function getStopInterestCounts(): Promise<Map<string, number>> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('roadtrip_interests')
    .select('stop_id')
    .not('stop_id', 'is', null);

  if (error) {
    console.error('Error fetching stop counts:', error);
    return new Map();
  }

  const counts = new Map<string, number>();
  data?.forEach((item: { stop_id: string | null }) => {
    if (item.stop_id) {
      counts.set(item.stop_id, (counts.get(item.stop_id) || 0) + 1);
    }
  });

  return counts;
}
