
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

export interface TransformationResult {
  originalImage: string;
  resultImage: string;
  style: StyleType;
  category: CategoryType;
  timestamp: number;
}
