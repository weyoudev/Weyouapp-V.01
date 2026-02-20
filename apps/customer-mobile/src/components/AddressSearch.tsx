import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { fetchPlaceDetails, fetchPlaceSuggestions } from '../googlePlaces';

const DEBOUNCE_MS = 400;

export interface AddressSearchResult {
  addressLine: string;
  pincode: string;
  googlePlaceUrl: string;
}

export function AddressSearch({
  value,
  onSelect,
  placeholder = 'Search address (e.g. area, landmark)',
}: {
  value: string;
  onSelect: (result: AddressSearchResult) => void;
  placeholder?: string;
}) {
  const [input, setInput] = useState(value);
  const [suggestions, setSuggestions] = useState<{ placeId: string; description: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setInput(value);
  }, [value]);

  useEffect(() => {
    if (!input.trim()) {
      setSuggestions([]);
      setOpen(false);
      return;
    }
    const t = setTimeout(async () => {
      setLoading(true);
      try {
        const list = await fetchPlaceSuggestions(input);
        setSuggestions(list);
        setOpen(list.length > 0);
      } finally {
        setLoading(false);
      }
    }, DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [input]);

  const onSelectPlace = useCallback(
    async (placeId: string) => {
      setOpen(false);
      setSuggestions([]);
      setLoading(true);
      try {
        const details = await fetchPlaceDetails(placeId);
        if (details) {
          setInput(details.addressLine);
          onSelect({
            addressLine: details.addressLine,
            pincode: details.pincode,
            googlePlaceUrl: details.googlePlaceUrl,
          });
        }
      } finally {
        setLoading(false);
      }
    },
    [onSelect]
  );

  return (
    <View style={styles.wrap}>
      <TextInput
        style={styles.input}
        placeholder={placeholder}
        value={input}
        onChangeText={setInput}
        onFocus={() => suggestions.length > 0 && setOpen(true)}
      />
      {loading && (
        <View style={styles.loader}>
          <ActivityIndicator size="small" />
        </View>
      )}
      {open && suggestions.length > 0 && (
        <View style={styles.list}>
          {suggestions.slice(0, 5).map((s) => (
            <TouchableOpacity
              key={s.placeId}
              style={styles.item}
              onPress={() => onSelectPlace(s.placeId)}
            >
              <Text style={styles.itemText} numberOfLines={2}>
                {s.description}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginBottom: 12,
    position: 'relative',
    zIndex: 10,
  },
  input: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
  },
  loader: {
    position: 'absolute',
    right: 12,
    top: 10,
  },
  list: {
    marginTop: 4,
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
    elevation: 3,
  },
  item: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e5e7eb',
  },
  itemText: {
    fontSize: 14,
    color: '#374151',
  },
});
