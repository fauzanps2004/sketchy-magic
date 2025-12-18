
import { StyleType, CategoryType } from './types';

export const STYLES = [
  { id: StyleType.REALISTIC, label: 'Real Life', icon: 'fa-camera', description: 'Looks like a photo' },
  { id: StyleType.CINEMATIC, label: 'Movie', icon: 'fa-film', description: 'Like a big movie' },
  { id: StyleType.DARK, label: 'Spooky', icon: 'fa-ghost', description: 'Scary and dark' },
  { id: StyleType.SCIFI, label: 'Robot', icon: 'fa-robot', description: 'From the future' },
  { id: StyleType.FANTASY, label: 'Magic', icon: 'fa-hat-wizard', description: 'Wizards and dragons' },
];

export const CATEGORIES = [
  { id: CategoryType.CHARACTER, label: 'A Person' },
  { id: CategoryType.CREATURE, label: 'A Monster' },
  { id: CategoryType.OBJECT, label: 'A Thing' },
  { id: CategoryType.ENVIRONMENT, label: 'A Place' },
];
