/**
 * Fallback catalog for property amenities and offers migration.
 * Used to enrich migrated items when legacy sources lack icon/description.
 */

export type LocalizedText = {
  en?: string
  uk?: string
  ru?: string
  it?: string
  sq?: string
}

export const AMENITY_CATALOG = [
  {
    key: 'smart-home-access',
    iconKey: 'smartphone',
    title: {
      en: 'Smart home access',
      uk: 'Розумний доступ до будинку',
      ru: 'Умный доступ к дому',
      it: 'Accesso smart alla casa',
      sq: 'Qasje inteligjente në shtëpi',
    },
    description: {
      en: 'Convenient and secure digital access for everyday living.',
      uk: 'Зручний і безпечний цифровий доступ для щоденного користування.',
      ru: 'Удобный и безопасный цифровой доступ для повседневного пользования.',
      it: 'Accesso digitale comodo e sicuro per la vita di tutti i giorni.',
      sq: 'Qasje digjitale e përshtatshme dhe e sigurt për përdorim të përditshëm.',
    },
  },
  {
    key: 'natural-light',
    iconKey: 'sun',
    title: {
      en: 'Natural light',
      uk: 'Природне освітлення',
      ru: 'Естественное освещение',
      it: 'Luce naturale',
      sq: 'Dritë natyrale',
    },
    description: {
      en: 'Large windows create a bright and welcoming atmosphere.',
      uk: 'Великі вікна створюють світлу й затишну атмосферу.',
      ru: 'Большие окна создают светлую и уютную атмосферу.',
      it: 'Le ampie finestre creano un ambiente luminoso e accogliente.',
      sq: 'Dritaret e mëdha krijojnë një atmosferë të ndritshme dhe mikpritëse.',
    },
  },
  {
    key: 'private-parking',
    iconKey: 'parking',
    title: {
      en: 'Private parking',
      uk: 'Приватне паркування',
      ru: 'Частная парковка',
      it: 'Parcheggio privato',
      sq: 'Parkim privat',
    },
    description: {
      en: 'Dedicated parking space for comfort and convenience.',
      uk: 'Виділене паркомісце для комфорту та зручності.',
      ru: 'Выделенное парковочное место для комфорта и удобства.',
      it: 'Posto auto dedicato per comfort e praticità.',
      sq: 'Vend parkimi i dedikuar për rehati dhe komoditet.',
    },
  },
  {
    key: 'sea-view',
    iconKey: 'waves',
    title: {
      en: 'Sea view',
      uk: 'Вид на море',
      ru: 'Вид на море',
      it: 'Vista mare',
      sq: 'Pamje nga deti',
    },
    description: {
      en: 'Enjoy open views and a relaxing coastal atmosphere.',
      uk: 'Насолоджуйтеся відкритими краєвидами та спокійною прибережною атмосферою.',
      ru: 'Наслаждайтесь открытыми видами и спокойной прибрежной атмосферой.',
      it: 'Goditi una vista aperta e un\'atmosfera rilassante sul mare.',
      sq: 'Shijoni pamje të hapura dhe një atmosferë të qetë bregdetare.',
    },
  },
  {
    key: 'security-system',
    iconKey: 'shield',
    title: {
      en: 'Security system',
      uk: 'Система безпеки',
      ru: 'Система безопасности',
      it: 'Sistema di sicurezza',
      sq: 'Sistem sigurie',
    },
    description: {
      en: 'Added protection for peace of mind at home.',
      uk: 'Додатковий захист для спокою та впевненості вдома.',
      ru: 'Дополнительная защита для спокойствия и уверенности дома.',
      it: 'Protezione aggiuntiva per vivere la casa in tranquillità.',
      sq: 'Mbrojtje shtesë për qetësi dhe siguri në shtëpi.',
    },
  },
  {
    key: 'high-speed-wifi',
    iconKey: 'wifi',
    title: {
      en: 'High-speed Wi-Fi',
      uk: 'Швидкісний Wi-Fi',
      ru: 'Высокоскоростной Wi-Fi',
      it: 'Wi-Fi ad alta velocità',
      sq: 'Wi-Fi me shpejtësi të lartë',
    },
    description: {
      en: 'Reliable internet connection for work, streaming, and daily use.',
      uk: 'Надійне інтернет-з\'єднання для роботи, стримінгу та щоденного користування.',
      ru: 'Надёжное интернет-соединение для работы, стриминга и повседневного использования.',
      it: 'Connessione internet affidabile per lavoro, streaming e uso quotidiano.',
      sq: 'Lidhje interneti e besueshme për punë, transmetim dhe përdorim të përditshëm.',
    },
  },
  {
    key: 'pool',
    iconKey: 'waves',
    title: {
      en: 'Pool',
      uk: 'Басейн',
      ru: 'Бассейн',
      it: 'Piscina',
      sq: 'Pishinë',
    },
    description: {
      en: 'Private or shared swimming pool.',
      uk: 'Приватний або спільний басейн.',
      ru: 'Частный или общий бассейн.',
      it: 'Piscina privata o condivisa.',
      sq: 'Pishinë private ose e përbashkët.',
    },
  },
  {
    key: 'elevator',
    iconKey: 'elevator',
    title: {
      en: 'Elevator',
      uk: 'Ліфт',
      ru: 'Лифт',
      it: 'Ascensore',
      sq: 'Ashensor',
    },
    description: {
      en: 'Elevator access for easy floor access.',
      uk: 'Доступ до ліфта для зручного переміщення між поверхами.',
      ru: 'Доступ к лифту для удобного передвижения между этажами.',
      it: 'Accesso all\'ascensore per spostamenti comodi.',
      sq: 'Qasje në ashensor për lëvizje të lehta.',
    },
  },
  {
    key: 'balcony',
    iconKey: 'balcony',
    title: {
      en: 'Balcony',
      uk: 'Балкон',
      ru: 'Балкон',
      it: 'Balcone',
      sq: 'Ballkon',
    },
    description: {
      en: 'Outdoor space with views.',
      uk: 'Зовнішній простір з видом.',
      ru: 'Наружное пространство с видом.',
      it: 'Spazio esterno con vista.',
      sq: 'Hapësirë e jashtme me pamje.',
    },
  },
  {
    key: 'air-conditioning',
    iconKey: 'snowflake',
    title: {
      en: 'Air conditioning',
      uk: 'Кондиціонер',
      ru: 'Кондиционер',
      it: 'Aria condizionata',
      sq: 'Kondicioner',
    },
    description: {
      en: 'Climate control for year-round comfort.',
      uk: 'Контроль клімату для комфорту цілий рік.',
      ru: 'Контроль климата для круглогодичного комфорта.',
      it: 'Controllo del clima per comfort tutto l\'anno.',
      sq: 'Kontroll i klimës për rehati gjatë gjithë vitit.',
    },
  },
  {
    key: 'furnished',
    iconKey: 'sofa',
    title: {
      en: 'Furnished',
      uk: 'Мебльовано',
      ru: 'Меблировано',
      it: 'Arredato',
      sq: 'E mobiluar',
    },
    description: {
      en: 'Fully furnished for immediate occupancy.',
      uk: 'Повністю мебльовано для негайного заселення.',
      ru: 'Полностью меблировано для немедленного заселения.',
      it: 'Completamente arredato per uso immediato.',
      sq: 'E mobiluar plotësisht për përdorim të menjëhershëm.',
    },
  },
  {
    key: 'garden',
    iconKey: 'tree',
    title: {
      en: 'Garden',
      uk: 'Сад',
      ru: 'Сад',
      it: 'Giardino',
      sq: 'Kopsht',
    },
    description: {
      en: 'Private garden space.',
      uk: 'Приватний сад.',
      ru: 'Частный сад.',
      it: 'Spazio giardino privato.',
      sq: 'Hapësirë kopshti private.',
    },
  },
  {
    key: 'terrace',
    iconKey: 'home',
    title: {
      en: 'Terrace',
      uk: 'Тераса',
      ru: 'Терраса',
      it: 'Terrazza',
      sq: 'Tarracë',
    },
    description: {
      en: 'Outdoor terrace or patio.',
      uk: 'Зовнішня тераса або патіо.',
      ru: 'Наружная терраса или патио.',
      it: 'Terrazza o patio esterno.',
      sq: 'Tarracë ose patio e jashtme.',
    },
  },
] as const

export const PROPERTY_OFFERS_CATALOG = [
  {
    key: 'city-center-location',
    iconKey: 'home',
    title: {
      en: 'City center location',
      uk: 'Розташування в центрі міста',
      ru: 'Расположение в центре города',
      it: 'Posizione nel centro città',
      sq: 'Vendndodhje në qendër të qytetit',
    },
  },
  {
    key: 'family-friendly-layout',
    iconKey: 'home',
    title: {
      en: 'Family-friendly layout',
      uk: 'Планування для сім\'ї',
      ru: 'Планировка для семьи',
      it: 'Layout adatto alla famiglia',
      sq: 'Planimetri e përshtatshme për familje',
    },
  },
  {
    key: 'investment-potential',
    iconKey: 'building',
    title: {
      en: 'Investment potential',
      uk: 'Інвестиційний потенціал',
      ru: 'Инвестиционный потенциал',
      it: 'Potenziale di investimento',
      sq: 'Potencial investimi',
    },
  },
  {
    key: 'modern-interior',
    iconKey: 'sofa',
    title: {
      en: 'Modern interior',
      uk: 'Сучасний інтер\'єр',
      ru: 'Современный интерьер',
      it: 'Interni moderni',
      sq: 'Interier modern',
    },
  },
  {
    key: 'move-in-ready',
    iconKey: 'key',
    title: {
      en: 'Move-in ready',
      uk: 'Готове до заселення',
      ru: 'Готово к заселению',
      it: 'Pronto da abitare',
      sq: 'Gati për banim',
    },
  },
  {
    key: 'quiet-neighborhood',
    iconKey: 'tree',
    title: {
      en: 'Quiet neighborhood',
      uk: 'Тихий район',
      ru: 'Тихий район',
      it: 'Quartiere tranquillo',
      sq: 'Lagje e qetë',
    },
  },
] as const

/** Deterministic fallback icons when no catalog match */
export const FALLBACK_ICON_POOL = [
  'home',
  'shield',
  'sun',
  'wifi',
  'building',
  'car',
  'tree',
  'key',
] as const

/**
 * Synonym mapping: normalized legacy title → catalog key
 * Used when exact catalog match fails
 */
export const TITLE_TO_CATALOG_KEY: Record<string, string> = {
  'sea view': 'sea-view',
  seaview: 'sea-view',
  'sea-view': 'sea-view',
  wifi: 'high-speed-wifi',
  'wi-fi': 'high-speed-wifi',
  internet: 'high-speed-wifi',
  parking: 'private-parking',
  garage: 'private-parking',
  secure: 'security-system',
  security: 'security-system',
  bright: 'natural-light',
  sunny: 'natural-light',
  light: 'natural-light',
  pool: 'pool',
  elevator: 'elevator',
  balcony: 'balcony',
  ac: 'air-conditioning',
  'air conditioning': 'air-conditioning',
  furnished: 'furnished',
  garden: 'garden',
  terrace: 'terrace',
}
