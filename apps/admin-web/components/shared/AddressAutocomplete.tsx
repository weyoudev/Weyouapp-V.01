'use client';

import { useEffect, useRef, useState } from 'react';
import { Input } from '@/components/ui/input';

const GOOGLE_MAPS_API_KEY = typeof window !== 'undefined' ? (process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? '') : '';

export interface AddressAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  onPlaceSelect?: (result: { addressLine: string; pincode?: string }) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  id?: string;
}

interface GooglePlaceResult {
  formatted_address?: string;
  address_components?: Array<{ types: string[]; long_name: string }>;
}

interface GooglePlacesAutocomplete {
  getPlace: () => GooglePlaceResult;
  addListener: (event: string, fn: () => void) => void;
}

declare global {
  interface Window {
    google?: {
      maps?: {
        places?: {
          Autocomplete: new (input: HTMLInputElement, opts?: { types?: string[]; componentRestrictions?: { country: string }; fields?: string[] }) => GooglePlacesAutocomplete;
        };
        event?: { clearInstanceListeners: (obj: unknown) => void };
      };
    };
  }
}

export function AddressAutocomplete({
  value,
  onChange,
  onPlaceSelect,
  placeholder = 'Search address or enter manually',
  disabled,
  className,
  id,
}: AddressAutocompleteProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<GooglePlacesAutocomplete | null>(null);
  const [scriptLoaded, setScriptLoaded] = useState(false);

  useEffect(() => {
    if (!GOOGLE_MAPS_API_KEY) return;
    if (window.google?.maps?.places) {
      setScriptLoaded(true);
      return;
    }
    const existing = document.querySelector('script[src*="maps.googleapis.com"]');
    if (existing) {
      const check = () => {
        if (window.google?.maps?.places) setScriptLoaded(true);
        else setTimeout(check, 100);
      };
      check();
      return;
    }
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=places`;
    script.async = true;
    script.defer = true;
    script.onload = () => setScriptLoaded(true);
    document.head.appendChild(script);
    return () => {
      script.remove();
    };
  }, []);

  useEffect(() => {
    if (!scriptLoaded || !inputRef.current || !window.google?.maps?.places) return;
    if (autocompleteRef.current) return;
    const Autocomplete = window.google!.maps!.places!.Autocomplete;
    const autocomplete = new Autocomplete(inputRef.current, {
      types: ['address'],
      componentRestrictions: { country: 'in' },
      fields: ['formatted_address', 'address_components'],
    });
    autocomplete.addListener('place_changed', () => {
      const place = autocomplete.getPlace();
      const formatted = place.formatted_address ?? '';
      onChange(formatted);
      let pincode: string | undefined;
      const components = place.address_components ?? [];
      for (const c of components) {
        if (c.types.includes('postal_code')) {
          pincode = c.long_name;
          break;
        }
      }
      if (onPlaceSelect) onPlaceSelect({ addressLine: formatted, pincode });
    });
    autocompleteRef.current = autocomplete;
    return () => {
      if (autocompleteRef.current && window.google?.maps?.event) {
        window.google.maps.event.clearInstanceListeners(autocompleteRef.current);
      }
      autocompleteRef.current = null;
    };
  }, [scriptLoaded, onChange, onPlaceSelect]);

  return (
    <div className="space-y-1">
      <Input
        ref={inputRef}
        id={id}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        className={className}
        autoComplete="off"
      />
      {GOOGLE_MAPS_API_KEY && scriptLoaded && (
        <p className="text-xs text-muted-foreground">Start typing to search with Google Maps</p>
      )}
      {!GOOGLE_MAPS_API_KEY && (
        <p className="text-xs text-muted-foreground">Set NEXT_PUBLIC_GOOGLE_MAPS_API_KEY for address search</p>
      )}
    </div>
  );
}
