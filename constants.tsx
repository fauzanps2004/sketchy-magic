
import { StyleType, CategoryType } from './types';

export const STYLES = [
  { id: StyleType.REALISTIC, label: 'Foto Nyata', icon: 'fa-camera', description: 'Hasil seperti foto asli' },
  { id: StyleType.IPHONE, label: 'Kamera iPhone', icon: 'fa-mobile-screen-button', description: 'Hasil jepretan iPhone 15 Pro' },
  { id: StyleType.KIDS_DRAWING, label: 'Coretan Anak', icon: 'fa-child', description: 'Gaya gambar krayon anak-anak' },
  { id: StyleType.WATERCOLOR, label: 'Lukisan Air', icon: 'fa-palette', description: 'Gaya cat air artistik' },
  { id: StyleType.ANIME, label: 'Gaya Anime', icon: 'fa-clapperboard', description: 'Vibrant & Clean Line Art' },
  { id: StyleType.COMIC, label: 'Komik Klasik', icon: 'fa-book-open', description: 'Vintage 60s Comic Style' },
  { id: StyleType.CINEMATIC, label: 'Ala Film', icon: 'fa-film', description: 'Visual epik layar lebar' },
  { id: StyleType.DARK, label: 'Misterius', icon: 'fa-moon', description: 'Gelap dan penuh drama' },
  { id: StyleType.SCIFI, label: 'Masa Depan', icon: 'fa-rocket', description: 'Tema robot & teknologi' },
  { id: StyleType.FANTASY, label: 'Dunia Sihir', icon: 'fa-hat-wizard', description: 'Naga & ksatria' },
];

export const CATEGORIES = [
  { id: CategoryType.CHARACTER, label: 'Karakter' },
  { id: CategoryType.CREATURE, label: 'Monster/Hewan' },
  { id: CategoryType.VEHICLE, label: 'Kendaraan' },
  { id: CategoryType.OBJECT, label: 'Benda Perkakas' },
  { id: CategoryType.ENVIRONMENT, label: 'Pemandangan' },
];
