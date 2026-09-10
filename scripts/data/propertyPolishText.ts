/**
 * Polish titles and short descriptions for the listings that had none.
 *
 * Polish was added to the site after these eleven listings were written and
 * nothing back-filled them, so a Polish reader met an empty title on five live
 * pages. These are translations of the English, which is the locale those
 * listings were authored in.
 *
 * The long `description` is deliberately left to fall back: it is a different
 * order of work, six of the eleven are drafts, and an empty long description
 * falls back gracefully where an empty title does not.
 */
export const PL_TEXT: Record<string, {title: string; shortDescription: string}> = {
  '2-bedroom-apartment-in-currila-durres': {
    title: 'Mieszkanie 2+1 w dzielnicy Currila, Durrës',
    shortDescription:
      'W pełni umeblowane mieszkanie 78 m² na czwartym piętrze w Currili, z balkonem od strony morza.',
  },
  '1-bedroom-apartment-in-kodra-e-diellit-tirana': {
    title: 'Mieszkanie 1+1 na Kodra e Diellit, Tirana',
    shortDescription:
      'Mieszkanie 55 m² na szóstym piętrze na Kodra e Diellit w Tiranie, w budynku z 2021 roku.',
  },
  '1-bedroom-apartment-in-bllok-tirana': {
    title: 'Mieszkanie 1+1 w Bllok, Tirana',
    shortDescription:
      'Umeblowane mieszkanie na wynajem, trzecie piętro w Bllok — najbardziej ruchliwej dzielnicy Tirany.',
  },
  '4-bedroom-villa-in-gjiri-i-lalzit-durres': {
    title: 'Willa z czterema sypialniami w Gjiri i Lalzit, Durrës',
    shortDescription:
      'Przestronna willa z prywatnym basenem i ogrodem w Gjiri i Lalzit pod Durrës.',
  },
  '3-bedroom-apartment-at-sunny-hills-residence': {
    title: 'Mieszkanie z trzema sypialniami w Sunny Hills Residence',
    shortDescription:
      'Mieszkanie na drugim piętrze w Sunny Hills Residence; na parterze budynku sauna i pokój gier.',
  },
  'investment-building-floor-for-apart-hotel-durres': {
    title: 'Piętro budynku pod aparthotel, Durrës — inwestycja',
    shortDescription:
      'Całe wejście budynku mieszkalnego w Durrës, nadające się na aparthotel. Sprzedaż piętrami lub w całości.',
  },
  '2-bedroom-apartment-in-sarande-near-the-sea': {
    title: 'Mieszkanie 2+1 w Sarandzie, blisko morza',
    shortDescription:
      'Przestronne, umeblowane mieszkanie sto metrów od morza w Sarandzie, z bocznym widokiem na wodę.',
  },
  '1-bedroom-apartment-in-orikum-sea-view': {
    title: 'Mieszkanie 1+1 w Orikum z widokiem na morze',
    shortDescription:
      'Przytulne mieszkanie w nowym budynku na wybrzeżu jońskim w Orikum, z dużym balkonem i bocznym widokiem na morze.',
  },
  '180-m-2-bedroom-penthouse-in-butrint-sarande': {
    title: 'Penthouse 180 m² z dwiema sypialniami w Butrincie, Saranda',
    shortDescription:
      'Dwupoziomowy penthouse w pierwszej linii w Butrincie, z panoramicznym widokiem na Morze Jońskie.',
  },
  '1-bedroom-apartment-near-the-sea-sarande': {
    title: 'Mieszkanie 1+1 blisko morza, Saranda',
    shortDescription:
      'Jasne mieszkanie z otwartym widokiem na morze, sto metrów od plaży w Sarandzie.',
  },
  'house-for-sale-near-the-sea-in-vlore': {
    title: 'Dom na sprzedaż niedaleko morza, Wlora',
    shortDescription:
      'W pełni umeblowany dom 109 m² w spokojnej części Wlory, trzy kilometry od morza, z kompletem dokumentów.',
  },
}
