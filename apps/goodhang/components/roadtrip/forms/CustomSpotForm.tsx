'use client';

import { useState, useEffect } from 'react';
import { RoadtripInterest } from '@/types/roadtrip';
import { submitInterest } from '@/lib/roadtrip/api';
import Modal from '@/components/roadtrip/ui/Modal';
import Button from '@/components/roadtrip/ui/Button';
import Checkbox from '@/components/roadtrip/ui/Checkbox';
import Input from '@/components/roadtrip/ui/Input';
import Textarea from '@/components/roadtrip/ui/Textarea';

interface CustomSpotFormProps {
  lat: number;
  lng: number;
  isOpen: boolean;
  onClose: () => void;
}

export default function CustomSpotForm({
  lat,
  lng,
  isOpen,
  onClose,
}: CustomSpotFormProps) {
  const [cityName, setCityName] = useState<string>('');
  const [isLoadingCity, setIsLoadingCity] = useState(true);
  const [formData, setFormData] = useState<Partial<RoadtripInterest>>({
    custom_lat: lat,
    custom_lng: lng,
    custom_city: '',
    name: '',
    email: '',
    linkedin: '',
    interest_brainstorm: false,
    interest_renubu: false,
    interest_workshop: false,
    interest_happy_hour: false,
    interest_coffee: false,
    interest_dinner: false,
    interest_crash: false,
    interest_intro: false,
    interest_join_leg: false,
    interest_unknown: false,
    note: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reverse geocode to get city name
  useEffect(() => {
    const fetchCityName = async () => {
      setIsLoadingCity(true);
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=10`
        );
        const data = await response.json();
        const city =
          data.address?.city ||
          data.address?.town ||
          data.address?.village ||
          data.address?.county ||
          'Unknown Location';
        const state = data.address?.state || '';
        const fullName = state ? `${city}, ${state}` : city;
        setCityName(fullName);
        setFormData((prev) => ({ ...prev, custom_city: fullName }));
      } catch (err) {
        console.error('Error fetching city name:', err);
        setCityName('Custom Location');
        setFormData((prev) => ({ ...prev, custom_city: 'Custom Location' }));
      } finally {
        setIsLoadingCity(false);
      }
    };

    if (isOpen) {
      fetchCityName();
    }
  }, [lat, lng, isOpen]);

  const handleCheckboxChange = (field: keyof RoadtripInterest) => {
    setFormData((prev) => ({ ...prev, [field]: !prev[field] }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    if (!formData.name || !formData.email) {
      setError('Please fill in your name and email');
      setIsSubmitting(false);
      return;
    }

    const result = await submitInterest({
      ...formData,
      custom_lat: lat,
      custom_lng: lng,
    } as RoadtripInterest);

    if (result.success) {
      setIsSuccess(true);
    } else {
      setError(result.error || 'Something went wrong. Please try again.');
    }

    setIsSubmitting(false);
  };

  if (isSuccess) {
    return (
      <Modal isOpen={isOpen} onClose={onClose} variant="postcard">
        <div className="text-center py-8">
          <div className="text-4xl mb-4">🗺️</div>
          <h2 className="rt-heading-elegant text-2xl font-bold text-[var(--rt-navy)] mb-2">
            Detour Requested!
          </h2>
          <p className="rt-typewriter text-[var(--rt-cork-dark)] mb-6">
            I&apos;ll consider swinging through {cityName}.
            <br />
            I&apos;ll be in touch!
          </p>
          <Button onClick={onClose} variant="secondary">
            Close
          </Button>
        </div>
      </Modal>
    );
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} variant="postcard">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="text-center mb-4">
          <h2 className="rt-heading-elegant text-xl font-bold text-[var(--rt-navy)] mb-2">
            {isLoadingCity ? (
              'Finding location...'
            ) : (
              <>Want me to swing through {cityName}?</>
            )}
          </h2>
          <p className="rt-typewriter text-sm text-[var(--rt-cork-dark)]">
            Help me plan a detour!
          </p>
        </div>

        {/* Work Section */}
        <div className="space-y-3">
          <h3 className="rt-typewriter font-bold text-[var(--rt-forest)] border-b border-[var(--rt-cork)] pb-1">
            Work
          </h3>
          <div className="space-y-2 pl-2">
            <Checkbox
              label="Brainstorm"
              checked={formData.interest_brainstorm}
              onChange={() => handleCheckboxChange('interest_brainstorm')}
            />
            <Checkbox
              label="Learn about Renubu"
              checked={formData.interest_renubu}
              onChange={() => handleCheckboxChange('interest_renubu')}
            />
            <Checkbox
              label="AI Workshop"
              checked={formData.interest_workshop}
              onChange={() => handleCheckboxChange('interest_workshop')}
            />
            <Checkbox
              label="Let's plan a happy hour!"
              checked={formData.interest_happy_hour}
              onChange={() => handleCheckboxChange('interest_happy_hour')}
            />
          </div>
        </div>

        {/* Fun Section */}
        <div className="space-y-3">
          <h3 className="rt-typewriter font-bold text-[var(--rt-forest)] border-b border-[var(--rt-cork)] pb-1">
            Fun
          </h3>
          <div className="space-y-2 pl-2">
            <Checkbox
              label="Coffee or drink"
              checked={formData.interest_coffee}
              onChange={() => handleCheckboxChange('interest_coffee')}
            />
            <Checkbox
              label="Dinner"
              checked={formData.interest_dinner}
              onChange={() => handleCheckboxChange('interest_dinner')}
            />
            <Checkbox
              label="Place to crash"
              checked={formData.interest_crash}
              onChange={() => handleCheckboxChange('interest_crash')}
            />
            <Checkbox
              label="Know someone I should meet"
              checked={formData.interest_intro}
              onChange={() => handleCheckboxChange('interest_intro')}
            />
          </div>
        </div>

        {/* Adventure Section */}
        <div className="space-y-3">
          <h3 className="rt-typewriter font-bold text-[var(--rt-forest)] border-b border-[var(--rt-cork)] pb-1">
            Adventure
          </h3>
          <div className="space-y-2 pl-2">
            <Checkbox
              label="I might want to join you for a leg"
              checked={formData.interest_join_leg}
              onChange={() => handleCheckboxChange('interest_join_leg')}
            />
            <Checkbox
              label="I don't know what I want, but I know I need something"
              checked={formData.interest_unknown}
              onChange={() => handleCheckboxChange('interest_unknown')}
            />
          </div>
        </div>

        {/* Contact Info */}
        <div className="space-y-4 pt-4 border-t border-[var(--rt-cork)]">
          <Input
            label="Name *"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="Your name"
            required
          />
          <Input
            label="Email *"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            placeholder="your@email.com"
            required
          />
          <Input
            label="LinkedIn"
            value={formData.linkedin}
            onChange={(e) =>
              setFormData({ ...formData, linkedin: e.target.value })
            }
            placeholder="linkedin.com/in/yourprofile"
          />
          <Textarea
            label="Note (optional)"
            value={formData.note || ''}
            onChange={(e) => setFormData({ ...formData, note: e.target.value })}
            placeholder="Why should I visit? What should we do?"
          />
        </div>

        {error && (
          <div className="p-3 bg-[var(--rt-rust)]/10 border border-[var(--rt-rust)] rounded text-[var(--rt-rust)] text-sm">
            {error}
          </div>
        )}

        <div className="flex gap-3 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting || isLoadingCity} fullWidth>
            {isSubmitting ? 'Sending...' : 'Request Detour'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
