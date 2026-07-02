export const COUNTRIES = [
  { code: 'IE', name: 'Ireland',        flag: '🇮🇪' },
  { code: 'US', name: 'United States',  flag: '🇺🇸' },
  { code: 'GB', name: 'United Kingdom', flag: '🇬🇧' },
  { code: 'DE', name: 'Germany',        flag: '🇩🇪' },
  { code: 'FR', name: 'France',         flag: '🇫🇷' },
  { code: 'JP', name: 'Japan',          flag: '🇯🇵' },
  { code: 'CA', name: 'Canada',         flag: '🇨🇦' },
  { code: 'AU', name: 'Australia',      flag: '🇦🇺' },
  { code: 'BR', name: 'Brazil',         flag: '🇧🇷' },
  { code: 'IN', name: 'India',          flag: '🇮🇳' },
  { code: 'KR', name: 'South Korea',    flag: '🇰🇷' },
  { code: 'CN', name: 'China',          flag: '🇨🇳' },
  { code: 'SG', name: 'Singapore',      flag: '🇸🇬' },
  { code: 'NL', name: 'Netherlands',    flag: '🇳🇱' },
  { code: 'CH', name: 'Switzerland',    flag: '🇨🇭' },
  { code: 'SE', name: 'Sweden',         flag: '🇸🇪' },
  { code: 'NO', name: 'Norway',         flag: '🇳🇴' },
  { code: 'ES', name: 'Spain',          flag: '🇪🇸' },
  { code: 'IT', name: 'Italy',          flag: '🇮🇹' },
  { code: 'MX', name: 'Mexico',         flag: '🇲🇽' },
  { code: 'ZA', name: 'South Africa',   flag: '🇿🇦' },
  { code: 'AE', name: 'UAE',            flag: '🇦🇪' },
  { code: 'NZ', name: 'New Zealand',    flag: '🇳🇿' },
  { code: 'AR', name: 'Argentina',      flag: '🇦🇷' },
  { code: 'PL', name: 'Poland',         flag: '🇵🇱' },
];

const COUNTRY_KEY = 'wealthquest_country';

export function getMyCountry() {
  return localStorage.getItem(COUNTRY_KEY) ?? null;
}

export function setMyCountry(code) {
  localStorage.setItem(COUNTRY_KEY, code);
}

export function getCountryByCode(code) {
  return COUNTRIES.find(c => c.code === code) ?? null;
}
