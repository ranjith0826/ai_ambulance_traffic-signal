/**
 * LifeLane AI API & Map Configuration Manager
 * Handles API keys for Mapbox, Google Maps, MapTiler, OpenRouteService, and Gemini AI.
 * Supports localStorage override for runtime key configuration without rebuilding.
 */

export interface MapLayerOption {
  id: string;
  name: string;
  provider: 'cartodb' | 'osm' | 'mapbox' | 'maptiler' | 'google';
  url: string;
  attribution: string;
  maxZoom: number;
  subdomains?: string[];
  requiresKey?: 'mapbox' | 'maptiler' | 'google';
  description: string;
}

export interface ApiKeysState {
  mapboxToken: string;
  googleMapsKey: string;
  mapTilerKey: string;
  openRouteServiceKey: string;
  geminiApiKey: string;
  selectedTheme: string;
  // AWS Cloud Settings
  awsAccessKeyId: string;
  awsSecretAccessKey: string;
  awsRegion: string;
  awsS3Bucket: string;
  awsBedrockModel: string;
}

const STORAGE_KEY = 'lifelane_api_keys_v1';

export const getStoredApiKeys = (): ApiKeysState => {
  const envMapbox = import.meta.env.VITE_MAPBOX_TOKEN || '';
  const envGoogle = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';
  const envMapTiler = import.meta.env.VITE_MAPTILER_KEY || '';
  const envORS = import.meta.env.VITE_OPENROUTESERVICE_KEY || '';
  const envGemini = import.meta.env.VITE_GEMINI_API_KEY || '';
  const envTheme = import.meta.env.VITE_DEFAULT_MAP_THEME || 'positron';
  const envAwsKey = import.meta.env.VITE_AWS_ACCESS_KEY_ID || '';
  const envAwsSecret = import.meta.env.VITE_AWS_SECRET_ACCESS_KEY || '';
  const envAwsRegion = import.meta.env.VITE_AWS_REGION || 'us-east-1';
  const envAwsBucket = import.meta.env.VITE_AWS_S3_BUCKET || 'lifelane-ambulance-reports';
  const envAwsModel = import.meta.env.VITE_AWS_BEDROCK_MODEL || 'anthropic.claude-3-5-sonnet-20240620-v1:0';

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      const selected = parsed.selectedTheme === 'voyager' ? 'positron' : (parsed.selectedTheme || envTheme);
      return {
        mapboxToken: parsed.mapboxToken || envMapbox,
        googleMapsKey: parsed.googleMapsKey || envGoogle,
        mapTilerKey: parsed.mapTilerKey || envMapTiler,
        openRouteServiceKey: parsed.openRouteServiceKey || envORS,
        geminiApiKey: parsed.geminiApiKey || envGemini,
        selectedTheme: selected,
        awsAccessKeyId: parsed.awsAccessKeyId || envAwsKey,
        awsSecretAccessKey: parsed.awsSecretAccessKey || envAwsSecret,
        awsRegion: parsed.awsRegion || envAwsRegion,
        awsS3Bucket: parsed.awsS3Bucket || envAwsBucket,
        awsBedrockModel: parsed.awsBedrockModel || envAwsModel,
      };
    }
  } catch (e) {
    console.error('Failed reading api keys from localStorage', e);
  }

  return {
    mapboxToken: envMapbox,
    googleMapsKey: envGoogle,
    mapTilerKey: envMapTiler,
    openRouteServiceKey: envORS,
    geminiApiKey: envGemini,
    selectedTheme: envTheme,
    awsAccessKeyId: envAwsKey,
    awsSecretAccessKey: envAwsSecret,
    awsRegion: envAwsRegion,
    awsS3Bucket: envAwsBucket,
    awsBedrockModel: envAwsModel,
  };
};

export const saveApiKeys = (keys: ApiKeysState) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(keys));
    window.dispatchEvent(new CustomEvent('lifelane:api-keys-updated', { detail: keys }));
  } catch (e) {
    console.error('Failed saving api keys', e);
  }
};

export const getMapLayerOptions = (keys: ApiKeysState): MapLayerOption[] => {
  const mapboxToken = keys.mapboxToken || 'pk.eyJ1IjoibGlmZWxhbmUiLCJhIjoiY2x6cTNwbzgyMDdpZzJrb2s3eHBjc251aCJ9.placeholder';
  const mapTilerKey = keys.mapTilerKey || 'placeholder';

  return [
    {
      id: 'positron',
      name: 'CartoDB Positron (Pure White)',
      provider: 'cartodb',
      url: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
      attribution: '&copy; <a href="https://carto.com/">CartoDB</a> & OpenStreetMap contributors',
      maxZoom: 19,
      description: 'Clean pure white minimalist cartography optimized for high-contrast emergency transit',
    },
    {
      id: 'voyager',
      name: 'CartoDB Voyager (Streets)',
      provider: 'cartodb',
      url: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
      attribution: '&copy; <a href="https://carto.com/">CartoDB</a> & OpenStreetMap contributors',
      maxZoom: 19,
      description: 'Standard urban street styling',
    },
    {
      id: 'osm',
      name: 'OpenStreetMap Standard',
      provider: 'osm',
      url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
      description: 'Standard open global street map without API key requirement',
    },
    {
      id: 'mapbox_light',
      name: 'Mapbox Navigation Light',
      provider: 'mapbox',
      url: `https://api.mapbox.com/styles/v1/mapbox/light-v11/tiles/{z}/{x}/{y}?access_token=${mapboxToken}`,
      attribution: '&copy; <a href="https://www.mapbox.com/">Mapbox</a> & OpenStreetMap',
      maxZoom: 19,
      requiresKey: 'mapbox',
      description: 'High-definition vector tiles designed for emergency transit',
    },
    {
      id: 'mapbox_dark',
      name: 'Mapbox Night Tactical',
      provider: 'mapbox',
      url: `https://api.mapbox.com/styles/v1/mapbox/dark-v11/tiles/{z}/{x}/{y}?access_token=${mapboxToken}`,
      attribution: '&copy; <a href="https://www.mapbox.com/">Mapbox</a> & OpenStreetMap',
      maxZoom: 19,
      requiresKey: 'mapbox',
      description: 'High-contrast dark grid for nighttime traffic dispatch operations',
    },
    {
      id: 'maptiler_streets',
      name: 'MapTiler Clean Streets',
      provider: 'maptiler',
      url: `https://api.maptiler.com/maps/streets-v2/{z}/{x}/{y}.png?key=${mapTilerKey}`,
      attribution: '&copy; <a href="https://www.maptiler.com/">MapTiler</a> & OpenStreetMap',
      maxZoom: 19,
      requiresKey: 'maptiler',
      description: 'Crisp vector raster tiles from MapTiler Cloud',
    },
    {
      id: 'google_hybrid',
      name: 'Google Satellite Hybrid',
      provider: 'google',
      url: 'https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}',
      attribution: '&copy; Google Maps Satellite Imagery',
      maxZoom: 20,
      description: 'High-resolution aerial satellite imagery with road overlay',
    },
  ];
};
