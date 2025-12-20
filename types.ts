
export enum StyleType {
  REALISTIC = 'Realistic',
  CINEMATIC = 'Cinematic',
  DARK = 'Dark Fantasy',
  SCIFI = 'Sci-Fi / Cyberpunk',
  FANTASY = 'Epic Fantasy'
}

export enum CategoryType {
  CHARACTER = 'Character',
  CREATURE = 'Creature',
  OBJECT = 'Object',
  ENVIRONMENT = 'Environment',
  VEHICLE = 'Vehicle'
}

export type ImageSize = '1K' | '2K' | '4K';

export interface GeneratedImages {
  square: string;    // 1:1
  portrait: string;  // 9:16
  landscape: string; // 16:9
}

export interface TransformationResult {
  originalImage: string;
  results: GeneratedImages;
  style: StyleType;
  category: CategoryType;
  timestamp: number;
}
