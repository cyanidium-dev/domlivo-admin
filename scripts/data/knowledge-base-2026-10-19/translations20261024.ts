import type {ArticleTranslation} from './types'

/**
 * Hand-written translations of the useful-information pages (batch 3,
 * 2026-10-24), one entry per page and language. A page is translated only
 * into the languages its question is asked in (Google autocomplete, Search
 * Console): the frontend indexes it there and serves the English fallback as
 * noindex elsewhere. Applied with scripts/applyKnowledgeTranslations.ts,
 * which matches sections, tables, rows and FAQ by position against the live
 * English document.
 */
export const TRANSLATIONS: ArticleTranslation[] = [
  // ------------------------------------------------------------ Italian ---
  {
    id: 'KB-RENT-BY-CITY',
    locale: 'it',
    title: 'Quanto costa affittare una casa in Albania a lungo termine, città per città (2026)?',
    summary:
      'Un bilocale (1+1) con contratto annuale viene proposto in media a circa 590 euro al mese a Tirana (media delle agenzie, primo semestre 2026), a una mediana di 390 euro a Durazzo e 380-430 euro a Saranda (settembre 2026), 300-600 euro a Valona a seconda della zona e 250-430 euro a Shëngjin. I trilocali (2+1) costano circa il 30-60% in più. Sono canoni richiesti negli annunci: di solito si chiude al 5-10% in meno, e sul mare d\'estate gli stessi appartamenti costano il 60-100% in più che con un contratto invernale o annuale.',
    sections: [
      {
        heading: 'Canoni richiesti per città, contratto annuale',
        body: 'I canoni qui sotto sono quelli pubblicati dai proprietari per un appartamento arredato con contratto di 12 mesi, in euro, perché quasi tutti gli annunci sulla costa sono in euro. Le cifre di Tirana vengono dalla media semestrale di una rete di agenzie e da un campione di annunci; quelle delle città di mare da campioni di annunci raccolti a settembre 2026, piccoli, quindi vanno letti come intervalli e non come statistiche di mercato.',
        tables: [
          {
            title: 'Canoni mensili richiesti, EUR, 2026',
            columns: ['Città', '1+1 (una camera)', '2+1 (due camere)', 'Base'],
            rows: [
              ['Tirana, tutte le zone', '590 in media; mediana 550 negli annunci', '954 in media; mediana 750 negli annunci', 'Media agenzie I sem. 2026; 50 annunci, settembre 2026'],
              ['Tirana, vicino al centro', '600-900', '1.000-1.200 (Komuna e Parisit, con posto auto)', 'Agenti, 2026'],
              ['Tirana, quartieri esterni (Fresku, Kombinat, verso Kamëz)', '380-500', 'Circa 450', 'Agenti, 2026'],
              ['Durazzo, tutte le zone', '300-550, mediana 390', '300-700, mediana 500', '32 annunci, settembre 2026'],
              ['Durazzo, centro città', '250-400', '350-550', 'Guida agli affitti, aprile 2026'],
              ['Durazzo, spiaggia (Plazh), contratto annuale o invernale', '200-350; mediana 350 a settembre', '300-500; 600 negli annunci di settembre', 'Guida 2026; annunci, settembre 2026'],
              ['Durazzo, Golem (complessi nuovi)', '430-450', '-', '3 annunci, settembre 2026'],
              ['Valona, interno e centro', '300', '350-500', '4 annunci, 2026'],
              ['Valona, Lungomare e lato mare', '400-600 (ogni taglio)', '-', 'Annunci, 2026'],
              ['Saranda, centro', '380-430', '350-700', 'Annunci, 2025-2026'],
              ['Shëngjin', '250 (centro storico, 2+1 di 56 m²) fino a 430 (1+1 in complesso nuovo); monolocale 350', '-', 'Annunci, 2025-2026'],
              ['Albania, media nazionale', 'Monolocale 239-467, una camera 293-674 (media 369)', '359-826 (media 532)', 'Aggregatore, metà 2026'],
            ],
            methodology: 'Canoni richiesti da una rete in franchising (Tirana) e da campioni della prima pagina di annunci MerrJep e Homezone (costa). Valori in euro a 92,02 lek per euro quando l\'annuncio era in lek. I canoni effettivi sono di solito del 5-10% più bassi.',
          },
        ],
      },
      {
        heading: 'Estate e inverno sulla costa',
        body: 'Sulla spiaggia di Durazzo lo stesso 1+1 viene proposto a 400-600 euro al mese da giugno a settembre e a 200-350 euro da ottobre a maggio; un 2+1 a 500-900 euro d\'estate e 300-500 euro d\'inverno. I proprietari che d\'estate affittano a notte offrono spesso da ottobre contratti "invernali" di 9 mesi: è il modo più economico di vivere sul mare. Molti appartamenti vacanza a Valona e Saranda non hanno riscaldamento, controllatelo prima di firmare per l\'inverno.',
        tables: [
          {
            title: 'Spiaggia di Durazzo (Plazh): estate contro inverno, EUR al mese',
            columns: ['Appartamento', 'Giugno-settembre', 'Ottobre-maggio'],
            rows: [
              ['1+1', '400-600', '200-350'],
              ['2+1', '500-900', '300-500'],
            ],
          },
        ],
      },
      {
        heading: 'Quanto crescono gli affitti',
        body: 'I canoni richiesti per i nuovi contratti a Tirana sono saliti di circa il 48% in quattro anni (un 1+1 da 400 euro nel 2022 a 590 nel 2026) e i trilocali del 26% in un anno sulla media delle agenzie. L\'indice ufficiale dei prezzi al consumo, che misura gli affitti pagati da chi è già in casa, è salito solo dell\'1-8,5% all\'anno nello stesso periodo: chi resta nello stesso appartamento vede aumenti molto più piccoli di chi firma un nuovo contratto in una zona richiesta. A Durazzo il canone richiesto per un 1+1 è circa raddoppiato dal 2022, da 200 euro a una mediana di 390.',
        tables: [
          {
            title: 'Variazione degli affitti, 2022-2026',
            columns: ['Serie', 'Variazione'],
            rows: [
              ['Tirana, 1+1 richiesto, III trim. 2022 - I sem. 2026', 'Da 400 a 590 euro, circa +48%'],
              ['Tirana, 2+1 media agenzie, I sem. 2025 - I sem. 2026', 'Da 755 a 954 euro, +26%'],
              ['Durazzo, una camera, III trim. 2022 - settembre 2026', 'Da 200 a 390 euro (mediana), circa +95%'],
              ['Affitti pagati dagli inquilini già in casa (indice INSTAT), 2022-2026', 'Da +1% a +8,5% all\'anno'],
            ],
          },
        ],
      },
      {
        heading: 'Caparra, contratto e chi paga cosa',
        body: 'Aspettatevi una caparra di una o due mensilità; qualche proprietario chiede due o tre mesi anticipati. Un contratto di oltre un anno deve essere scritto e autenticato dal notaio; un contratto di 12 mesi di solito è una scrittura privata senza notaio. Il preavviso è di 30-90 giorni. L\'inquilino paga luce, acqua e internet a consumo, di norma su contratti che restano a nome del proprietario, e nella maggior parte dei palazzi la quota mensile di amministrazione. La tassa del 15% sull\'affitto è del proprietario, non vostra, e quando l\'inquilino è un privato la dichiara lui una volta all\'anno.\n\nSe affittate prima di comprare, il contratto annuale serve anche per il permesso di soggiorno: il contratto di locazione autenticato vale come prova dell\'alloggio.',
        tables: [
          {
            title: 'Condizioni abituali di un contratto a lungo termine',
            columns: ['Voce', 'Prassi'],
            rows: [
              ['Caparra', '1-2 mensilità; capita la richiesta di 2-3 mesi anticipati'],
              ['Forma del contratto', 'Oltre 1 anno: scritto e autenticato; 1 anno o meno: scritto, notaio facoltativo'],
              ['Preavviso', '30-90 giorni'],
              ['Riparazioni', 'Proprietario: strutturali; inquilino: manutenzione ordinaria'],
              ['Tassa sull\'affitto', '15% del canone, a carico del proprietario'],
            ],
          },
        ],
      },
    ],
    faq: [
      {q: 'Quanto costa un bilocale a Tirana?', a: 'Circa 590 euro al mese sulla media delle agenzie del primo semestre 2026; 380-500 euro nei quartieri esterni e 600-900 euro vicino al centro.'},
      {q: 'Quanto costa l\'affitto a Durazzo?', a: 'Mediana di 390 euro per un 1+1 e 500 euro per un 2+1 negli annunci di settembre 2026; 200-350 euro per un 1+1 sulla spiaggia con contratto invernale.'},
      {q: 'L\'affitto in Albania si paga in euro o in lek?', a: 'In entrambi: quasi tutti gli annunci sulla costa sono in euro, molti a Tirana in lek. Il contratto può essere in una delle due valute; le bollette sono in lek.'},
      {q: 'Che caparra chiedono i proprietari?', a: 'Di solito una o due mensilità, a volte due o tre mesi pagati in anticipo.'},
      {q: 'Posso affittare solo per l\'inverno?', a: 'Sì, sulla costa: chi d\'estate affitta a notte propone da ottobre contratti di 9 mesi a tariffa invernale, 200-350 euro per un 1+1 sulla spiaggia di Durazzo.'},
    ],
    gaps: [
      'I campioni delle città di mare sono di 2-18 annunci per città; un indice mensile degli affitti su un campione più ampio è ancora da costruire.',
      'Nessuna norma pubblicata sulla provvigione di agenzia per le locazioni (prassi: 50-100% di una mensilità).',
      'La quota di appartamenti sulla costa offerti con contratti invernali di 9 mesi non è quantificata.',
    ],
    seoTitle: 'Affitti a lungo termine in Albania per città (2026): Tirana, Durazzo, Valona, Saranda',
    seoDescription: 'Canoni annuali richiesti per 1+1 e 2+1: Tirana circa 590 euro, Durazzo mediana 390, Saranda 380-430, Shëngjin da 250. Estate e inverno sulla costa, caparre e contratti.',
  },
  {
    id: 'KB-RENT-OR-BUY',
    locale: 'it',
    title: 'In Albania conviene affittare o comprare un appartamento?',
    summary:
      'Comprare costa circa il 2,5% del prezzo in spese e i costi fissi annui di un appartamento sono bassi (140-240 euro per 55 m² a Durazzo, bollette escluse), quindi possedere batte affittare non appena si resta abbastanza a lungo da assorbire quelle spese e il 3% di provvigione alla rivendita. A Durazzo un 1+1 sulla spiaggia che si affitta a 390 euro al mese si vende a circa 82.500 euro alla mediana dell\'indice di ottobre 2026, un rendimento lordo del 5,7%; con il 25% di anticipo e un mutuo in euro al tasso medio del 5,00% la rata è di circa 408 euro al mese su 20 anni. Affittate prima se non siete sicuri della città o pensate di restare meno di tre anni.',
    sections: [
      {
        heading: 'Lo stesso appartamento, in affitto e comprato',
        body: 'L\'esempio è un bilocale di 55 m² nel quartiere della spiaggia di Durazzo (Plazh), il tipo di appartamento che la maggior parte degli acquirenti stranieri cerca su Domlivo. Il prezzo è la mediana dell\'indice di Durazzo per metro quadro al 23 ottobre 2026; il canone è la mediana richiesta negli annunci di settembre 2026. Cambiate il prezzo nel calcolatore dei costi di acquisto e il canone nel calcolatore del rendimento per adattarli all\'appartamento che avete in mente.',
        tables: [
          {
            title: 'Affittare o comprare un 1+1 di 55 m² a Durazzo Plazh',
            columns: ['Voce', 'In affitto', 'Comprando'],
            rows: [
              ['Prezzo o canone', '390 euro al mese (mediana degli annunci, settembre 2026)', '82.500 euro (55 m² a 1.500 euro/m², mediana dell\'indice di Durazzo; oggi: {{median:durres}})'],
              ['Soldi necessari il primo giorno', 'Caparra di 1-2 mesi: 390-780 euro', 'Anticipo del 25%, 20.625 euro, più circa 2.100 euro di spese; oppure l\'intero prezzo in contanti'],
              ['Rata mensile', '390 euro, in aumento a ogni nuovo contratto', '408 euro di mutuo su 20 anni al 5,00% in euro (362 euro su 25 anni); nulla se si paga in contanti'],
              ['Costi fissi annui', 'Nessuno oltre le bollette', 'Circa 140-240 euro: imposta sugli immobili, tasse comunali, amministrazione del palazzo'],
              ['Rendimento lordo se invece lo affittate', '-', '5,7% all\'anno (4.680 euro di canone su 82.500 euro)'],
              ['Costo di andarsene', 'Preavviso di 30-90 giorni', 'Provvigione del venditore 3% e 15% di tassa sull\'eventuale plusvalenza'],
            ],
          },
        ],
      },
      {
        heading: 'Cosa costa comprare oltre al prezzo',
        body: 'In Albania chi compra un appartamento non paga imposta di trasferimento. Si paga il notaio (una percentuale del prezzo a scaglioni, 0,35% a 45.000 euro e meno sopra), la registrazione all\'ASHK di 5.000 lek e, se si è passati da un\'agenzia, di solito l\'1% del prezzo; il 3% di provvigione lo paga il venditore. La cifra di lavoro di Domlivo per tutti i costi dell\'acquirente è circa il 2,5% del prezzo, molto meno del 7-12% abituale in Italia, Germania o Polonia, ed è il motivo principale per cui qui comprare si ripaga in fretta.\n\nAnche possedere costa poco. L\'imposta annuale sugli immobili è lo 0,05% del valore di riferimento (circa 20 euro all\'anno per un appartamento di 55 m² a Durazzo), le tasse comunali per pulizia e illuminazione circa 65 euro all\'anno, e l\'amministrazione del palazzo 400-1.200 lek al mese a seconda dell\'edificio. Le bollette sono uguali che si affitti o si possieda.',
        tables: [
          {
            title: 'Costi una tantum e annui del possesso',
            columns: ['Costo', 'Importo', 'Chi paga'],
            rows: [
              ['Onorario notarile', 'A scaglioni, circa 0,35% a 45.000 euro', 'L\'acquirente, salvo accordo diverso'],
              ['Registrazione del contratto all\'ASHK', '5.000 lek (circa 54 euro)', 'L\'acquirente'],
              ['Provvigione di agenzia', 'Acquirente 1%, venditore 3% (tariffari pubblicati di due agenzie di Tirana)', 'Ciascuna parte'],
              ['Imposta di trasferimento', 'Nessuna su appartamenti e case (solo terreni, a carico del venditore)', '-'],
              ['Imposta annuale sugli immobili', '0,05% del valore di riferimento; 33,75 lek/m² all\'anno a Durazzo', 'Il proprietario'],
              ['Tasse comunali (pulizia, illuminazione, verde)', '6.000 lek all\'anno a Durazzo; 417 lek al mese a Tirana', 'Il proprietario (spesso girate all\'inquilino)'],
              ['Amministrazione del palazzo', '400-500 lek al mese nei palazzi vecchi, 1.000-1.200 nei nuovi (Tirana)', 'Chi abita'],
              ['Tassa alla vendita', '15% della plusvalenza (prezzo di vendita meno prezzo di acquisto)', 'Il venditore'],
            ],
          },
        ],
      },
      {
        heading: 'Quando affittare è la scelta migliore',
        body: '- Non avete ancora passato un inverno in quella città. Durazzo, Valona e Saranda si svuotano da ottobre a maggio e molti appartamenti vacanza non hanno riscaldamento. Un contratto invernale di 9 mesi costa 200-350 euro al mese per un 1+1 sulla spiaggia di Durazzo e dice più di qualsiasi visita.\n- Potreste andarvene entro tre anni circa. Comprare e rivendere costano insieme circa il 5,5-6% del prezzo tra spese e provvigioni, più il 15% di tassa sull\'eventuale plusvalenza: un soggiorno breve raramente li recupera, anche con prezzi in salita.\n- Il vostro budget richiede un mutuo in euro per più del 75% del prezzo. Le banche prestano al massimo il 75% in euro (85% in lek) e la rata non può superare il 35% del reddito; gli stranieri sono finanziati caso per caso.\n- Volete tenervi liberi di scegliere tra Tirana e la costa, o tra l\'Albania e un altro paese.',
      },
      {
        heading: 'Quando comprare è la scelta migliore',
        body: '- Resterete, o tornerete ogni anno, per cinque anni o più. A 390 euro al mese in cinque anni pagate 23.400 euro di affitto; la stessa somma è un quarto dell\'appartamento di Durazzo qui sopra.\n- Pagate in contanti. Allora il costo annuo del possesso è qualche centinaio di euro di tasse e spese, contro 4.680 euro di affitto, e il valore dell\'appartamento resta vostro: l\'indice dei prezzi delle case della Banca d\'Albania a fine 2025 era del 28% più alto di un anno prima (nessuno può promettere che continui).\n- Volete un permesso di soggiorno legato alla proprietà. Possedere un appartamento, senza valore minimo, dà diritto a un permesso annuale rinnovabile ai sensi dell\'articolo 84 della legge 79/2021; affittare no.\n- Volete che l\'appartamento si paghi da solo quando non ci siete. Gli appartamenti sulla spiaggia di Durazzo rendono un 5,7% lordo con contratto annuale e di più a notte d\'estate; le società di gestione prendono il 10-30% di quella cifra.\n\nPrima di decidere, inserite le vostre cifre nei due calcolatori: quello dei costi di acquisto mostra le spese per qualsiasi prezzo, quello del rendimento quanto rende un appartamento. Poi confrontate gli appartamenti su Domlivo al prezzo che l\'indice indica come tipico per la città.',
        tables: [
          {
            title: 'Dati di mercato alla base del confronto',
            columns: ['Dato', 'Valore', 'Periodo'],
            rows: [
              ['Durazzo, prezzo richiesto al m², mediana', '{{median:durres}} euro (1.500 euro quando questa pagina è stata scritta)', 'Indice in tempo reale'],
              ['Tasso medio sui nuovi mutui casa', '3,77% in lek, 5,00% in euro', 'Giugno 2026'],
              ['Rapporto massimo mutuo/valore, prima casa', '85% in lek, 75% in euro', 'Da luglio 2025'],
              ['Indice dei prezzi delle case, Albania', '+28% in un anno (secondo semestre 2025); Tirana +4,4%', 'II sem. 2025'],
              ['Crescita dei canoni richiesti', '+8-12% nel 2025-2026; inquilini già in casa +1-8,5% all\'anno', '2026'],
              ['Permesso di soggiorno per proprietari', 'Un anno, rinnovabile, nessun valore minimo', 'Legge 79/2021 art. 84'],
            ],
          },
        ],
      },
    ],
    faq: [
      {q: 'Quanto costano le spese per comprare un appartamento in Albania?', a: 'Circa il 2,5% del prezzo: notaio a scaglioni, 5.000 lek di registrazione all\'ASHK e di solito l\'1% di agenzia. Sugli appartamenti non c\'è imposta di trasferimento.'},
      {q: 'Quant\'è la rata del mutuo su un appartamento da 82.500 euro?', a: 'Con il 25% di anticipo e un mutuo in euro alla media di giugno 2026 del 5,00%, circa 408 euro al mese su 20 anni o 362 euro su 25 anni, prima di commissione bancaria e assicurazioni.'},
      {q: 'Quanto devo restare perché comprare convenga?', a: 'Comprare e rivendere costano insieme circa il 5,5-6% del prezzo, quindi come regola almeno tre-cinque anni; di più se i prezzi smettono di salire.'},
      {q: 'Comprare un appartamento dà il permesso di soggiorno?', a: 'Sì: il proprietario può chiedere un permesso annuale rinnovabile ai sensi dell\'articolo 84 della legge 79/2021, senza valore minimo dell\'immobile. L\'inquilino no.'},
      {q: 'Uno straniero può avere un mutuo in Albania?', a: 'Caso per caso: le banche non pubblicano condizioni generali per gli stranieri, prestano al massimo il 75% in euro e tengono la rata sotto il 35% del reddito.'},
    ],
    gaps: [
      'Costo tipico dell\'assicurazione casa (facoltativa, richiesta dalle banche con il mutuo) non documentato.',
      'Esempio di Tirana non costruito: il campione dell\'indice per Tirana è ancora piccolo (10 appartamenti).',
      'Nessuna banca pubblica le condizioni di mutuo per acquirenti non residenti; da chiedere direttamente.',
    ],
    seoTitle: 'Affittare o comprare in Albania (2026): costi a confronto su un appartamento a Durazzo',
    seoDescription: 'Comprare costa circa il 2,5% di spese e 140-240 euro all\'anno di possesso; un 1+1 a Durazzo si affitta a 390 euro o si vende a circa 82.500 euro (rendimento 5,7%). Mutuo al 5%, quando conviene affittare, calcolatori.',
  },
  {
    id: 'KB-COST-OF-LIVING',
    locale: 'it',
    title: 'Quanto costa vivere in Albania al mese, città per città?',
    summary:
      'Una persona sola in un bilocale in affitto spende circa 650 euro al mese a Durazzo e 865 euro a Tirana tra affitto, bollette, internet, telefono, spesa e assicurazione sanitaria, ai prezzi di ottobre 2026 (stima Domlivo). La differenza è quasi tutta nell\'affitto: un 1+1 è proposto a una mediana di 390 euro a Durazzo e a 590 euro in media a Tirana. Una spesa di base al supermercato per una persona costa circa 15.400 lek (168 euro), la corrente 10,2 lek per kWh, la fibra da 1.300 lek e un pacchetto mobile da 15 GB 1.600 lek al mese. Lo stipendio medio lordo in Albania era di 92.150 lek (circa 1.000 euro) nel secondo trimestre 2026.',
    sections: [
      {
        heading: 'Un bilancio mensile per una persona',
        body: 'La tabella somma le spese ricorrenti di una persona che affitta un 1+1 arredato con contratto annuale. Gli affitti sono quelli richiesti negli annunci; di solito si paga il 5-10% in meno. La spesa è un paniere fisso prezzato in una catena nazionale di supermercati (vedi sotto); chi compra al mercato e nei discount spende meno, chi compra prodotti importati di più. Non sono compresi ristoranti, vestiti, auto, viaggi, rette scolastiche e tutto quello che spenderesti in qualunque altro paese.\n\nUna coppia non spende il doppio: affitto, internet e bollette si dividono, quindi aggiungete circa 200-250 euro per cibo, telefono e assicurazione della seconda persona.',
        tables: [
          {
            title: 'Spese mensili ricorrenti, una persona, EUR (92,02 lek/EUR)',
            columns: ['Voce', 'Durazzo', 'Tirana', 'Base'],
            rows: [
              ['Affitto, 1+1 arredato, contratto annuale', '390', '590', 'Durazzo mediana annunci, settembre 2026; Tirana media agenzie, I sem. 2026'],
              ['Elettricità, 250 kWh', '27,7', '27,7', '10,2 lek/kWh con IVA, tariffa unica nazionale'],
              ['Acqua e scarichi, 6 m³', '10,0', '7,1', 'Tariffe ERRU più quota fissa di 200 lek'],
              ['Internet in fibra, 100 Mbps', '14', '14', 'One Ultra Fiber 1.300 lek'],
              ['Mobile, 15 GB', '17', '17', 'One SMART+ prepagato, 1.600 lek per 30 giorni'],
              ['Trasporto pubblico', 'Quasi tutto a piedi', '17', 'Abbonamento mensile Tirana tutte le linee 1.600 lek; corsa singola 40 lek'],
              ['Spesa alimentare, paniere di base', '168', '168', 'Prezzi a scaffale SPAR, ottobre 2026'],
              ['Assicurazione sanitaria pubblica volontaria', '37', '37', '3,4% del doppio del salario minimo di 50.000 lek'],
              ['Tasse comunali (pulizia, illuminazione)', '5,4', '4,5', 'Durazzo 6.000 lek all\'anno; Tirana 417 lek al mese'],
              ['Totale', 'circa 650', 'circa 865', 'Calcolo Domlivo'],
            ],
            methodology: 'Somma di tariffe documentate e canoni richiesti per un consumo definito; ristoranti e spese discrezionali escluse.',
          },
        ],
      },
      {
        heading: 'Quanto costa il cibo al supermercato',
        body: 'Prezzi a scaffale del negozio online di SPAR, una catena nazionale con un centinaio di punti vendita, letti il 24 ottobre 2026. Verdura, frutta, uova e pane costano di solito meno ai mercati giornalieri (pazar) e in panetteria; marche importate, olio d\'oliva e formaggi sono il punto in cui l\'Albania smette di essere economica.',
        tables: [
          {
            title: 'Prezzi al supermercato, ottobre 2026 (lek)',
            columns: ['Prodotto', 'Prezzo, lek', 'In euro'],
            rows: [
              ['Latte, 1 L (UHT)', '170', '1,85'],
              ['Pane bianco, 400 g confezionato', '169', '1,84'],
              ['Uova, 10 (di campagna, medie)', '425', '4,62'],
              ['Pollo intero fresco', '399-439', '4,34-4,77'],
              ['Formaggio bianco, 900 g', '1.749', '19,01'],
              ['Riso, 1 kg', '145-319', '1,58-3,47'],
              ['Pasta, 500 g (Barilla)', '129', '1,40'],
              ['Zucchero, 1 kg', '95', '1,03'],
              ['Olio di semi di girasole, 1 L', '179-199', '1,95-2,16'],
              ['Olio extravergine di oliva, 1 L', '1.699', '18,46'],
              ['Acqua, 1,5 L', '45', '0,49'],
              ['Birra locale, lattina 0,5 L', '85', '0,92'],
              ['Pomodori, 1 kg', '239', '2,60'],
              ['Patate, 1 kg', '129', '1,40'],
              ['Cipolle / carote / cetrioli, 1 kg', '99 / 119 / 69', '1,08 / 1,29 / 0,75'],
              ['Banane / limoni / peperoni, 1 kg', '229 / 249 / 199', '2,49 / 2,71 / 2,16'],
            ],
            methodology: 'Un solo rivenditore, fascia media, prezzi del negozio online senza promozioni salvo indicazione. Un paniere mensile per una persona costruito su questi prezzi arriva a circa 15.400 lek.',
          },
        ],
      },
      {
        heading: 'Spostarsi',
        body: 'Tirana è l\'unica città dove serve un abbonamento all\'autobus; Durazzo, Valona e Saranda si girano a piedi e quasi tutti gli appartamenti sono a distanza pedonale dal mare. Il carburante non è economico: lo Stato fissa un tetto ai prezzi alla pompa più volte a settimana e a metà ottobre 2026 il gasolio era a 213 lek al litro (circa 2,31 euro) e la benzina a 190 lek (2,06 euro). Un autobus interurbano costa 235 lek da Tirana a Durazzo e 700 lek fino a Valona con la tariffa regolamentata a chilometri, e l\'autobus dall\'aeroporto al centro di Tirana 400 lek.',
        tables: [
          {
            title: 'Prezzi dei trasporti, 2026',
            columns: ['Voce', 'Prezzo'],
            rows: [
              ['Autobus urbano Tirana, una corsa / abbonamento mensile', '40 lek / 1.600 lek'],
              ['Autobus Tirana-Durazzo / Tirana-Valona / Tirana-Saranda', '235 / 700 / circa 1.220 lek'],
              ['Autobus dall\'aeroporto al centro di Tirana', '400 lek, ogni ora, 24 ore su 24'],
              ['Gasolio / benzina, prezzo massimo alla pompa, 14.10.2026', '213 / 190 lek al litro'],
            ],
          },
        ],
      },
      {
        heading: 'I prezzi rispetto agli stipendi locali',
        body: 'Lo stipendio medio lordo mensile era di 92.150 lek (circa 1.000 euro) nel secondo trimestre 2026, +9,8% in un anno, e il salario minimo è di 50.000 lek (543 euro). I prezzi al consumo sono saliti del 2,9% nell\'anno fino a settembre 2026. A Tirana l\'affitto assorbe una fetta enorme di uno stipendio locale: per questo quasi tutti gli albanesi comprano invece di affittare, e per questo gli stranieri con un reddito europeo trovano la costa economica ma il centro di Tirana meno.\n\nSe pensate a un soggiorno lungo, la pagina sugli affitti a lungo termine riporta i canoni per quartiere, e la pagina affittare o comprare mostra quando un appartamento di proprietà costa meno di uno in affitto.',
        tables: [
          {
            title: 'Stipendi e inflazione, 2026',
            columns: ['Indicatore', 'Valore', 'Periodo'],
            rows: [
              ['Stipendio medio lordo mensile', '92.150 lek (circa 1.000 euro), +9,8% in un anno', 'II trim. 2026'],
              ['Salario minimo', '50.000 lek (circa 543 euro)', '2026'],
              ['Inflazione dei prezzi al consumo', '2,9%', 'Settembre 2026'],
              ['Cambio ufficiale', '90,74 lek per euro', '23 ottobre 2026'],
            ],
          },
        ],
      },
    ],
    faq: [
      {q: 'Si può vivere in Albania con 1.000 euro al mese?', a: 'Sì, da soli, a Durazzo o in una cittadina di mare più piccola: le spese fisse con un 1+1 in affitto sono circa 650 euro ai prezzi di ottobre 2026, e resta margine per ristoranti e viaggi. Nel centro di Tirana 1.000 euro sono stretti quando l\'affitto supera i 600.'},
      {q: 'Quanto costa l\'affitto in Albania?', a: 'Un bilocale con contratto annuale è proposto a circa 590 euro in media a Tirana e a una mediana di 390 euro a Durazzo; 380-430 euro a Saranda e 250-430 euro a Shëngjin.'},
      {q: 'Quanto costa fare la spesa in Albania?', a: 'Un paniere mensile di base per una persona in una catena nazionale di supermercati costa circa 15.400 lek (168 euro) a ottobre 2026: latte 170 lek, 10 uova 425, pane 169, pomodori 239 al chilo.'},
      {q: 'Quanto costa la corrente in Albania?', a: '10,2 lek per kWh con IVA fino a 700 kWh al mese, uguale ovunque; 250 kWh costano circa 28 euro.'},
      {q: 'L\'Albania è economica per i pensionati?', a: 'Una coppia di pensionati in un 1+1 in affitto paga circa 520 euro al mese di spese fisse a Durazzo e 720 euro a Tirana prima del cibo, secondo i dati della nostra pagina sulla pensione.'},
    ],
    gaps: [
      'Nessun prezzo documentato di bar e ristoranti (menu o un\'indagine di una testata affidabile); un caffè e un pasto fuori mancano dal bilancio.',
      'Prezzi ai mercati giornalieri e nei discount (Big Market, Conad) non campionati; il paniere usa un solo rivenditore di fascia media.',
      'Le colonne di bilancio per Valona e Saranda aspettano campioni di affitti più ampi.',
      'Prezzo di una polizza sanitaria privata per il permesso di soggiorno non trovato sulle pagine degli assicuratori.',
    ],
    seoTitle: 'Costo della vita in Albania al mese (2026): Tirana e Durazzo con prezzi reali',
    seoDescription: 'Una persona: circa 650 euro al mese a Durazzo e 865 a Tirana per affitto, bollette, internet, telefono, spesa e assicurazione. Prezzi al supermercato, corrente, autobus e carburante, fonti di ottobre 2026.',
  },
  {
    id: 'KB-GETTING-TO-ALBANIA',
    locale: 'it',
    title: 'Come si arriva in Albania e come ci si muove: traghetti dall\'Italia, aeroporto, autobus?',
    summary:
      'L\'aeroporto di Tirana (TIA, a 17 km dalla città) è l\'unico aeroporto internazionale funzionante nel 2026: l\'autobus per il centro costa 400 lek ogni ora, giorno e notte, un taxi circa 2.200 lek, l\'autobus per Durazzo 600 lek. Dall\'Italia i traghetti notturni fanno Bari-Durazzo tutti i giorni (8-11 ore; passaggio ponte Ventouris 60-90 euro più 23 euro di tasse portuali, GNV da 48 euro, un\'auto 104-170 euro) e Ancona-Durazzo tre volte a settimana, tutti i giorni d\'estate (circa 16 ore). L\'aeroporto di Valona non è operativo e la sua concessione è in via di risoluzione. Gli autobus interurbani hanno tariffe regolamentate a chilometri: 235 lek Tirana-Durazzo, 700 lek Tirana-Valona; una corsa urbana a Tirana costa 40 lek.',
    sections: [
      {
        heading: 'Traghetti dall\'Italia',
        body: 'Tre compagnie collegano Bari a Durazzo: Adria Ferries (tutti i giorni, circa 8 ore, partenza notturna alle 22:00 o alle 23:00 in alta stagione), Ventouris (corsa notturna 22:00-08:00 tutto l\'anno, corse in più a luglio e agosto) e GNV (10 ore e 45 minuti, da 48 euro). Adria Ferries fa anche Ancona-Durazzo, tre notti a settimana fuori stagione e tutti i giorni da luglio a metà settembre; Star Lines collega Brindisi e Valona ma non pubblica tariffe online. Prenotate una cabina se viaggiate con bambini o se la mattina dopo dovete firmare un contratto: il passaggio ponte è una poltrona reclinabile o il vostro sacco a pelo.\n\nTutte le tariffe italiane escludono le tasse portuali, che Ventouris indica in 15 euro di tassa portuale più 8 euro di contributo ambientale a passeggero e a veicolo, e Adria in 15 euro a passeggero e 20 euro per auto. Quando questa pagina è stata scritta Adria non aveva ancora pubblicato il listino 2026; è riportato quello 2025. Su queste rotte le carte d\'identità cartacee non sono più accettate.',
        tables: [
          {
            title: 'Traghetti Italia-Albania, tariffe di sola andata',
            columns: ['Rotta e compagnia', 'Durata', 'Passeggero', 'Auto', 'Frequenza'],
            rows: [
              ['Bari-Durazzo, Ventouris (2026)', '10 h, notturna', 'Ponte 60-90 euro, cabina 90-140 euro, secondo stagione', '120-140 euro', 'Ogni notte, corse in più a luglio e agosto'],
              ['Bari-Durazzo, Adria Ferries (tariffe 2025)', 'Circa 8 h', 'Ponte 62-108 euro, cabina a 2 letti 89-160 euro', '104-170 euro', 'Tutti i giorni, tutto l\'anno'],
              ['Bari-Durazzo, GNV (2026)', '10 h 45', 'Da 48 euro', 'Non pubblicato', 'Non pubblicata'],
              ['Ancona-Durazzo, Adria Ferries (tariffe 2025)', 'Circa 16 h', 'Ponte 90-145 euro, cabina 125-240 euro', '125-216 euro', '3 a settimana; tutti i giorni da luglio a metà settembre'],
              ['Brindisi-Valona, Star Lines', '4,5-8 h (siti di prenotazione)', 'Da circa 50 euro (siti di prenotazione)', 'Da circa 70 euro (siti di prenotazione)', 'Non pubblicata dalla compagnia'],
            ],
            methodology: 'Pagine delle compagnie, lette il 24.10.2026; stagioni come definite da ciascuna compagnia; tasse portuali escluse.',
          },
        ],
      },
      {
        heading: 'L\'aeroporto di Tirana e come lasciarlo',
        body: 'L\'aeroporto internazionale di Tirana (Rinas) è a 17 km dalla città. L\'autobus per il centro ferma dietro il Teatro dell\'Opera in piazza Skanderbeg, parte a ogni ora piena giorno e notte e costa 400 lek; un secondo autobus va al terminal degli autobus Sud e Nord per 300 lek, e un autobus diretto per Durazzo costa 600 lek con nove partenze al giorno. Il taxi ufficiale dell\'aeroporto chiede circa 2.200 lek per il centro e ha tariffe fisse per la costa. L\'aeroporto di Valona è stato certificato nel 2025 ma a ottobre 2026 non aveva ancora aperto: il governo ha avviato la risoluzione della concessione ad agosto 2026, quindi per il sud volate su Tirana o su Corfù.',
        tables: [
          {
            title: 'Dall\'aeroporto di Tirana, 2026',
            columns: ['Destinazione', 'Autobus', 'Taxi ufficiale (tariffa fissa)', 'Distanza, tempo'],
            rows: [
              ['Centro di Tirana', '400 lek, ogni ora, 24 ore su 24, 30-40 min', 'Circa 2.200 lek (22-25 euro)', '17-20 km, 20-25 min'],
              ['Durazzo', '600 lek, 9 al giorno', '30 euro', '45 km, circa 45 min'],
              ['Scutari (per Shëngjin)', 'Dal terminal di Tirana', '70-75 euro', '100 km, circa 1 h 30'],
              ['Valona', 'Dal terminal di Tirana', '105-110 euro', '155 km, circa 1 h 30-2 h'],
              ['Saranda', 'Dal terminal di Tirana', '200 euro', '285 km, circa 3 h 30'],
              ['Aeroporto di Valona', 'Non operativo; concessione in via di risoluzione da agosto 2026', '-', '-'],
            ],
          },
        ],
      },
      {
        heading: 'Autobus tra le città e in città',
        body: 'Gli autobus interurbani partono da Tirana dal terminal Sud e Nord vicino al cavalcavia di Casa Italia: per Durazzo ogni 20-30 minuti circa dalle 06:00 alle 21:15, per Valona ogni 30 minuti circa dalle 05:00 alle 17:30, per Scutari dalle 05:00 alle 18:00. Le linee internazionali e del sud-est usano il terminal sull\'autostrada Tirana-Elbasan. Le tariffe sono regolamentate a chilometri e comprendono l\'IVA; il biglietto si compra dall\'autista o al terminal. La ferrovia Tirana-Durazzo è in ricostruzione e non funziona. A Tirana una corsa urbana costa 40 lek e l\'abbonamento mensile a tutte le linee 1.600 lek.',
        tables: [
          {
            title: 'Tariffe interurbane regolamentate da Tirana (VKM 92/2024)',
            columns: ['Rotta', 'Fascia di distanza', 'Tariffa'],
            rows: [
              ['Tirana-Durazzo', '45-50 km', '235 lek'],
              ['Tirana-Scutari', '100-110 km', '525 lek'],
              ['Tirana-Valona', '140-150 km', '700 lek'],
              ['Tirana-Saranda', '260-270 km', 'Circa 1.220 lek'],
              ['Autobus urbano di Tirana', 'Una corsa / abbonamento mensile', '40 lek / 1.600 lek'],
            ],
            methodology: 'Fasce tariffarie della delibera; Domlivo ha abbinato le rotte alle fasce in base alla distanza stradale.',
          },
        ],
      },
      {
        heading: 'Arrivare in auto',
        body: 'I prezzi del carburante hanno un tetto fissato dal Consiglio di trasparenza dello Stato e cambiano più volte a settimana; il 14 ottobre 2026 i tetti erano 213 lek al litro per il gasolio e 190 lek per la benzina, circa 2,31 e 2,06 euro. Una patente straniera o internazionale vale finché non si è residenti da un anno; dopo va convertita in una patente albanese alla DPSHTRR, cosa che avviene senza esame per le patenti italiane, dell\'UE, statunitensi, canadesi e di molti altri paesi, con circa 8.500 lek di tasse. Gli appartamenti vicino al mare a Durazzo, Valona e Shëngjin sono in vendita con o senza posto auto; nei mesi estivi un posto auto vale la spesa.',
        tables: [
          {
            title: 'Guidare in Albania, 2026',
            columns: ['Voce', 'Regola o prezzo'],
            rows: [
              ['Tetto gasolio / benzina, 14.10.2026', '213 / 190 lek al litro'],
              ['Patente straniera', 'Valida fino a un anno di residenza; patenti UE e britanniche fino a 12 mesi'],
              ['Conversione in patente albanese', 'Senza esame per patenti UE, USA, Canada e paesi convenzionati (Italia compresa); 4.000 + 4.500 lek; serve un permesso di soggiorno di oltre 1 anno'],
            ],
          },
        ],
      },
    ],
    faq: [
      {q: 'Quanto dura il traghetto da Bari a Durazzo?', a: 'Circa 8 ore con Adria Ferries, 10 ore con Ventouris e 10 ore e 45 con GNV; sono tutte corse notturne con arrivo intorno alle 08:00.'},
      {q: 'Quanto costa il traghetto dall\'Italia all\'Albania?', a: 'Da 48 euro con GNV; un passaggio ponte Ventouris costa 60-90 euro a tratta secondo la stagione e una cabina 90-140 euro, più 23 euro di tasse portuali a persona; un\'auto 104-170 euro a seconda di compagnia e stagione.'},
      {q: 'Come arrivo dall\'aeroporto di Tirana in città o a Durazzo?', a: 'L\'autobus per il centro costa 400 lek e passa ogni ora giorno e notte; l\'autobus per Durazzo costa 600 lek nove volte al giorno; il taxi ufficiale chiede circa 2.200 lek per Tirana e 30 euro per Durazzo.'},
      {q: 'L\'aeroporto di Valona è aperto?', a: 'No. A ottobre 2026 non era operativo e il governo stava risolvendo la concessione; volate su Tirana o su Corfù e prendete il traghetto per Saranda.'},
      {q: 'Quanto costa un autobus da Tirana a Durazzo o a Valona?', a: '235 lek per Durazzo e 700 lek per Valona con la tariffa regolamentata a chilometri; gli autobus per Durazzo partono ogni 20-30 minuti.'},
    ],
    gaps: [
      'Il 24.10.2026 Adria Ferries non aveva pubblicato un listino 2026; sono riportate le tariffe 2025.',
      'Star Lines (Brindisi-Valona) non pubblica tariffe né orari; solo cifre dei siti di prenotazione.',
      'Nessuna tariffa comunale dei taxi di Tirana trovata; solo i listini degli operatori.',
      'Tariffa dell\'autobus urbano di Durazzo non trovata.',
    ],
    seoTitle: 'Come arrivare in Albania (2026): traghetti Bari e Ancona-Durazzo, aeroporto di Tirana, autobus',
    seoDescription: 'Bari-Durazzo ogni notte in 8-11 ore da 48-90 euro più tasse portuali, Ancona-Durazzo 3 a settimana. Autobus aeroporto 400 lek, taxi 2.200 lek, autobus per Durazzo 600 lek. Tariffe interurbane, tetto carburante, aeroporto di Valona.',
  },
  {
    id: 'KB-MONEY-IN-ALBANIA',
    locale: 'it',
    title: 'Soldi in Albania: servono contanti, le carte funzionano e come si apre un conto in banca?',
    summary:
      'La valuta è il lek (ALL); il 23 ottobre 2026 il cambio della Banca d\'Albania era di 90,74 lek per euro, e il lek si rafforza da anni. Le carte sono accettate in supermercati, hotel, distributori e nella maggior parte dei ristoranti delle città (circa il 67% dei pagamenti tramite banca nel 2025 è stato con carta e a metà 2026 c\'erano 38.662 POS), ma mercati, piccoli negozi, taxi e molti proprietari vogliono contanti, in lek o in euro. Dal 7 ottobre 2025 l\'Albania fa parte della SEPA, quindi i bonifici in euro da una banca dell\'UE sono economici e rapidi. Contanti da 10.000 euro in su vanno dichiarati alla frontiera. Il conto in banca si apre di persona con il passaporto; le banche pubblicano poche regole per i non residenti, quindi chiedete alla filiale cosa serve prima di partire.',
    sections: [
      {
        heading: 'Lek, euro e cambio',
        body: 'Prezzi nei negozi, bollette e tasse sono in lek. Immobili, affitti sulla costa e auto sono di solito quotati in euro, e proprietari e venditori accettano volentieri gli euro; anche un negozio di norma prende una banconota in euro, al suo cambio. La Banca d\'Albania pubblica un cambio ufficiale ogni giorno lavorativo: 90,74 lek per euro il 23 ottobre 2026, contro circa 126 nel 2020, quindi un euro compra in Albania un terzo in meno rispetto a sei anni fa. Cambiate in banca o in un ufficio di cambio autorizzato (zyrë këmbimi) in città piuttosto che in aeroporto; gli uffici espongono in vetrina sia il cambio di acquisto che quello di vendita.',
        tables: [
          {
            title: 'Il lek contro l\'euro',
            columns: ['Data', 'Lek per euro', 'Fonte'],
            rows: [
              ['Media 2020', '126,24', 'Banca d\'Albania'],
              ['9 settembre 2026', '92,02', 'Fixing della Banca d\'Albania (il cambio usato nelle pagine Domlivo)'],
              ['23 ottobre 2026', '90,74', 'Fixing della Banca d\'Albania'],
            ],
          },
        ],
      },
      {
        heading: 'Dove funzionano le carte e dove servono i contanti',
        body: 'Visa e Mastercard funzionano in supermercati, hotel, distributori, farmacie, in aeroporto e nella maggior parte dei ristoranti di città; il contactless è la norma. Gli stessi albanesi ormai pagano con carta più spesso di quanto prelevino: circa il 67% dei pagamenti tramite banca nel 2025 è stato con carta, il 78% degli adulti ha un conto (40% nel 2018) e il numero di POS è cresciuto del 38% in un anno fino a 38.662 a metà 2026, spinto dal turismo. I contanti restano la regola ai mercati giornalieri, nei villaggi, per i taxi, i piccoli bar, gli amministratori di condominio e per quasi tutti gli affitti pagati a privati. Tenete lek in banconote piccole.\n\nI bancomat applicano la commissione estera della vostra banca più, spesso, una commissione locale mostrata sullo schermo prima della conferma; prelevare importi più grandi meno spesso costa meno. Se la vostra carta è emessa in un paese sotto sanzioni finanziarie non funzionerà neanche in Albania.',
        tables: [
          {
            title: 'Pagamenti in Albania, 2025-2026',
            columns: ['Indicatore', 'Valore'],
            rows: [
              ['Quota di pagamenti bancari effettuati con carta, 2025', 'Circa 67%; 20% via internet o mobile banking'],
              ['Adulti con un conto in banca', '78% (40% nel 2018)'],
              ['POS attivi, metà 2026', '38.662, +38% in un anno'],
              ['Pagamenti con carta ai POS, I sem. 2026', 'Circa 16 milioni, +28%; 58,3 miliardi di lek'],
              ['Contanti da dichiarare alla frontiera', '10.000 euro o più, in entrata e in uscita; multa 20.000-60.000 lek alla prima violazione'],
            ],
          },
        ],
      },
      {
        heading: 'Mandare soldi in Albania',
        body: 'L\'Albania è entrata nella SEPA: la prima operazione SEPA è stata fatta il 7 ottobre 2025 e nella primavera 2026 undici banche offrivano bonifici SEPA, con 363.000 bonifici per 4,3 miliardi di euro nei primi sei mesi. Un bonifico in euro da un conto italiano, tedesco o polacco a una banca albanese è ormai un normale pagamento SEPA e non più un bonifico SWIFT con commissioni delle banche corrispondenti, cosa che conta quando si paga una caparra o il prezzo di un appartamento. Anche Wise versa sui conti albanesi in lek. Per l\'acquisto di un immobile il denaro deve comunque passare da una banca ed essere documentato: vedi la pagina sul pagamento dell\'immobile e sui controlli antiriciclaggio.',
        tables: [
          {
            title: 'Trasferimenti da e per l\'Albania',
            columns: ['Canale', 'Stato'],
            rows: [
              ['Bonifici SEPA in euro', 'Attivi dal 7 ottobre 2025; 11 banche; ammissione dell\'European Payments Council il 21.11.2024'],
              ['Wise', 'Versa sui conti bancari albanesi in lek; il destinatario non ha bisogno di un conto Wise'],
              ['Contanti oltre frontiera', 'Da dichiarare da 10.000 euro (gratis, modulo RTVK)'],
            ],
          },
        ],
      },
      {
        heading: 'Aprire un conto in banca e il codice fiscale',
        body: 'I conti si aprono di persona in filiale. Tutte le banche chiedono il passaporto; la maggior parte chiede una prova di indirizzo in Albania (un contratto di affitto o il contratto di acquisto) e lo scopo del conto, e un permesso di soggiorno rende tutto più facile. Le banche albanesi pubblicano le commissioni ma non una regola generale per i non residenti, quindi scrivete prima alla filiale e portate i documenti che l\'agenzia o il notaio vi danno per l\'acquisto. Una carta di debito standard a Raiffeisen costa 100 lek al mese, nulla dentro un pacchetto di conto, con un limite di prelievo di 30.000 lek al giorno.\n\nPer il fisco, le persone fisiche usano come codice fiscale il numero personale di 10 caratteri stampato sulla carta di soggiorno biometrica; viene rilasciato ufficialmente ai cittadini e agli stranieri con residenza permanente. Un lavoratore autonomo o una società si registra al Centro nazionale delle imprese e ottiene un NIPT in un giorno. Uno di questi serve per pagare l\'imposta annuale sugli immobili o dichiarare i redditi da affitto.',
        tables: [
          {
            title: 'Conto in banca e codice fiscale',
            columns: ['Voce', 'Cosa vale'],
            rows: [
              ['Canone carta di debito (Raiffeisen, cliente standard)', '100 lek al mese, 0 nei pacchetti di conto; prelievi 30.000 lek al giorno, 600.000 al mese'],
              ['Codice fiscale, persone fisiche', 'Numero personale (NID) sulla carta d\'identità o di soggiorno; rilasciato a cittadini e residenti permanenti'],
              ['Codice fiscale, imprese e autonomi', 'NIPT dal Centro nazionale delle imprese (QKB)'],
              ['Pagare un appartamento', 'Tramite banca, con la provenienza dei fondi documentata ai sensi della legge 9917/2008'],
            ],
          },
        ],
      },
    ],
    faq: [
      {q: 'In Albania si può pagare in euro?', a: 'Immobili, affitti sulla costa e auto sono quotati in euro e gli euro in contanti sono presi quasi ovunque; negozi, bollette e tasse sono in lek. Portate lek per mercati, taxi e piccoli bar.'},
      {q: 'Le carte di credito funzionano in Albania?', a: 'Sì in supermercati, hotel, distributori e ristoranti di città: il 67% dei pagamenti tramite banca nel 2025 è stato con carta e a metà 2026 c\'erano 38.662 POS. Mercati, villaggi e proprietari privati vogliono contanti.'},
      {q: 'Quanti contanti posso portare in Albania?', a: 'Qualsiasi importo, ma da 10.000 euro in su vanno dichiarati alla dogana in entrata e in uscita; la multa per la mancata dichiarazione parte da 20.000 lek.'},
      {q: 'L\'Albania è nella SEPA?', a: 'Sì, dalla prima operazione SEPA del 7 ottobre 2025; undici banche fanno bonifici SEPA in euro.'},
      {q: 'Uno straniero può aprire un conto in banca in Albania?', a: 'Sì, di persona con il passaporto e di solito una prova di indirizzo albanese; le banche non pubblicano una regola generale per i non residenti, quindi chiedete alla filiale cosa serve.'},
    ],
    gaps: [
      'Requisiti di apertura del conto per non residenti e canoni dei conti non trovati sulle pagine delle banche (Intesa, BKT, Credins, OTP, Union, Tirana Bank).',
      'Commissioni bancomat per carte straniere non trovate nei tariffari pubblicati.',
      'Non confermato da una fonte primaria se chi ha un permesso di soggiorno temporaneo riceve un codice fiscale personale, o come paga altrimenti l\'imposta sugli immobili.',
      'Disponibilità di conti Revolut e Wise per i residenti in Albania non confermata.',
    ],
    seoTitle: 'Soldi in Albania (2026): lek, carte, contanti, bonifici SEPA, conto in banca',
    seoDescription: '90,74 lek per euro (ottobre 2026). Le carte funzionano in città, i contanti comandano ai mercati e per l\'affitto; dichiarare contanti da 10.000 euro; SEPA da ottobre 2025. Come uno straniero apre un conto e ottiene il codice fiscale.',
  },
  // ------------------------------------------------------------ Russian ---
  {
    id: 'KB-COST-OF-LIVING',
    locale: 'ru',
    title: 'Сколько стоит жизнь в Албании в месяц, по городам?',
    summary:
      'Один человек, снимающий однокомнатную квартиру (1+1), тратит около 650 евро в месяц в Дурресе и 865 евро в Тиране на аренду, коммуналку, интернет, телефон, продукты и медицинскую страховку по ценам октября 2026 года (расчёт Domlivo). Главная разница - аренда: 1+1 сдают по медианной цене 390 евро в Дурресе и в среднем за 590 евро в Тиране. Базовая продуктовая корзина на одного в супермаркете стоит около 15 400 леков (168 евро), электричество - 10,2 лека за кВт·ч, оптоволокно - от 1 300 леков, мобильный пакет на 15 ГБ - 1 600 леков в месяц. Средняя зарплата до вычетов в Албании во втором квартале 2026 года составила 92 150 леков (около 1 000 евро).',
    sections: [
      {
        heading: 'Бюджет на месяц для одного человека',
        body: 'В таблице сложены регулярные расходы одного человека, который снимает меблированную 1+1 по годовому договору. Аренда указана по объявлениям; обычно удаётся договориться на 5-10% дешевле. Продукты - фиксированная корзина по ценам одной национальной сети супермаркетов (см. ниже); кто покупает на рынке и в дискаунтерах, платит меньше, кто берёт импортные товары - больше. Не учтены кафе и рестораны, одежда, машина, поездки, школа и всё, что вы потратили бы в любой другой стране.\n\nПара платит не вдвое больше: аренда, интернет и коммуналка общие, так что на еду, телефон и страховку второго человека добавьте примерно 200-250 евро.',
        tables: [
          {
            title: 'Регулярные расходы в месяц, один человек, EUR (92,02 лека за евро)',
            columns: ['Статья', 'Дуррес', 'Тирана', 'Основание'],
            rows: [
              ['Аренда, 1+1 с мебелью, годовой договор', '390', '590', 'Дуррес - медиана объявлений, сентябрь 2026; Тирана - средняя по агентствам, I полугодие 2026'],
              ['Электричество, 250 кВт·ч', '27,7', '27,7', '10,2 лека за кВт·ч с НДС, единый тариф по стране'],
              ['Вода и канализация, 6 м³', '10,0', '7,1', 'Тарифы ERRU плюс фиксированная плата 200 леков'],
              ['Оптоволоконный интернет, 100 Мбит/с', '14', '14', 'One Ultra Fiber, 1 300 леков'],
              ['Мобильная связь, 15 ГБ', '17', '17', 'Предоплаченный пакет One SMART+, 1 600 леков за 30 дней'],
              ['Общественный транспорт', 'В основном пешком', '17', 'Месячный проездной на все линии Тираны 1 600 леков; одна поездка 40 леков'],
              ['Продукты, базовая корзина', '168', '168', 'Цены на полках SPAR, октябрь 2026'],
              ['Добровольная государственная медстраховка', '37', '37', '3,4% от двух минимальных зарплат по 50 000 леков'],
              ['Муниципальные сборы (уборка, освещение)', '5,4', '4,5', 'Дуррес 6 000 леков в год; Тирана 417 леков в месяц'],
              ['Итого', 'около 650', 'около 865', 'Расчёт Domlivo'],
            ],
            methodology: 'Сумма подтверждённых тарифов и запрашиваемой аренды при заданном потреблении; рестораны и необязательные траты не учтены.',
          },
        ],
      },
      {
        heading: 'Сколько стоят продукты в магазине',
        body: 'Цены с полок интернет-магазина SPAR - национальной сети примерно из сотни магазинов - сняты 24 октября 2026 года. Овощи, фрукты, яйца и хлеб обычно дешевле на ежедневных рынках (pazar) и в пекарнях; импортные бренды, оливковое масло и сыр - то, на чём Албания перестаёт быть дешёвой.',
        tables: [
          {
            title: 'Цены в супермаркете, октябрь 2026 (леки)',
            columns: ['Продукт', 'Цена, леки', 'В евро'],
            rows: [
              ['Молоко, 1 л (ультрапастеризованное)', '170', '1,85'],
              ['Белый хлеб, 400 г в упаковке', '169', '1,84'],
              ['Яйца, 10 шт. (деревенские, размер M)', '425', '4,62'],
              ['Целая свежая курица', '399-439', '4,34-4,77'],
              ['Белый сыр, 900 г', '1 749', '19,01'],
              ['Рис, 1 кг', '145-319', '1,58-3,47'],
              ['Паста, 500 г (Barilla)', '129', '1,40'],
              ['Сахар, 1 кг', '95', '1,03'],
              ['Подсолнечное масло, 1 л', '179-199', '1,95-2,16'],
              ['Оливковое масло extra virgin, 1 л', '1 699', '18,46'],
              ['Вода, 1,5 л', '45', '0,49'],
              ['Местное пиво, банка 0,5 л', '85', '0,92'],
              ['Помидоры, 1 кг', '239', '2,60'],
              ['Картофель, 1 кг', '129', '1,40'],
              ['Лук / морковь / огурцы, 1 кг', '99 / 119 / 69', '1,08 / 1,29 / 0,75'],
              ['Бананы / лимоны / перец, 1 кг', '229 / 249 / 199', '2,49 / 2,71 / 2,16'],
            ],
            methodology: 'Один ретейлер средней ценовой категории, цены интернет-магазина без акций, если не указано иное. Месячная корзина на одного человека по этим ценам выходит около 15 400 леков.',
          },
        ],
      },
      {
        heading: 'Транспорт',
        body: 'Тирана - единственный город, где нужен проездной на автобус; Дуррес, Влёра и Саранда обходятся пешком, и большинство квартир стоят в пешей доступности от моря. Топливо недешёвое: государство устанавливает потолок цен на заправках несколько раз в неделю, и в середине октября 2026 года дизель стоил не больше 213 леков за литр (около 2,31 евро), бензин - 190 леков (2,06 евро). Междугородний автобус из Тираны в Дуррес стоит 235 леков, до Влёры - 700 леков по регулируемому тарифу за расстояние, автобус из аэропорта в центр Тираны - 400 леков.',
        tables: [
          {
            title: 'Цены на транспорт, 2026',
            columns: ['Статья', 'Цена'],
            rows: [
              ['Городской автобус Тираны, одна поездка / месячный проездной', '40 леков / 1 600 леков'],
              ['Автобус Тирана-Дуррес / Тирана-Влёра / Тирана-Саранда', '235 / 700 / около 1 220 леков'],
              ['Автобус из аэропорта в центр Тираны', '400 леков, каждый час, круглосуточно'],
              ['Дизель / бензин, потолок цены на заправке, 14.10.2026', '213 / 190 леков за литр'],
            ],
          },
        ],
      },
      {
        heading: 'Цены на фоне местных зарплат',
        body: 'Средняя зарплата до вычетов во втором квартале 2026 года составила 92 150 леков (около 1 000 евро), на 9,8% больше, чем годом раньше, минимальная - 50 000 леков (543 евро). Потребительские цены за год к сентябрю 2026 года выросли на 2,9%. В Тиране аренда съедает очень большую часть местной зарплаты - поэтому большинство албанцев покупают жильё, а не снимают, и поэтому иностранцам с европейским доходом побережье кажется дешёвым, а центр Тираны - уже не очень.\n\nЕсли вы планируете жить долго, на странице о долгосрочной аренде собраны ставки по районам, а страница «снимать или покупать» показывает, когда своя квартира обходится дешевле съёмной.',
        tables: [
          {
            title: 'Зарплаты и инфляция, 2026',
            columns: ['Показатель', 'Значение', 'Период'],
            rows: [
              ['Средняя зарплата до вычетов в месяц', '92 150 леков (около 1 000 евро), +9,8% за год', 'II квартал 2026'],
              ['Минимальная зарплата', '50 000 леков (около 543 евро)', '2026'],
              ['Инфляция потребительских цен', '2,9%', 'Сентябрь 2026'],
              ['Официальный курс', '90,74 лека за евро', '23 октября 2026'],
            ],
          },
        ],
      },
    ],
    faq: [
      {q: 'Можно ли жить в Албании на 1 000 евро в месяц?', a: 'Да, одному, в Дурресе или небольшом городе на побережье: обязательные расходы со съёмной 1+1 по ценам октября 2026 года - около 650 евро, остаётся на кафе и поездки. В центре Тираны 1 000 евро впритык, как только аренда переваливает за 600.'},
      {q: 'Сколько стоит аренда в Албании?', a: 'Однокомнатная квартира по годовому договору сдаётся в среднем за 590 евро в Тиране и по медиане 390 евро в Дурресе; 380-430 евро в Саранде и 250-430 евро в Шенгьине.'},
      {q: 'Сколько стоят продукты в Албании?', a: 'Базовая месячная корзина на одного в национальной сети супермаркетов в октябре 2026 года - около 15 400 леков (168 евро): молоко 170 леков, 10 яиц 425, хлеб 169, помидоры 239 за кило.'},
      {q: 'Сколько стоит электричество в Албании?', a: '10,2 лека за кВт·ч с НДС до 700 кВт·ч в месяц, одинаково по всей стране; 250 кВт·ч обходятся примерно в 28 евро.'},
      {q: 'Дёшево ли в Албании пенсионерам?', a: 'Пара пенсионеров в съёмной 1+1 платит около 520 евро в месяц обязательных расходов в Дурресе и 720 евро в Тиране без еды - по данным нашей страницы о пенсии.'},
    ],
    gaps: [
      'Нет подтверждённых цен кафе и ресторанов (меню или обзор надёжного СМИ); кофе и обед вне дома в бюджете отсутствуют.',
      'Цены на ежедневных рынках и в дискаунтерах (Big Market, Conad) не собраны; корзина построена по одному ретейлеру средней категории.',
      'Колонки бюджета для Влёры и Саранды ждут более крупных выборок по аренде.',
      'Цена частной медстраховки для ВНЖ на сайтах страховщиков не найдена.',
    ],
    seoTitle: 'Стоимость жизни в Албании в месяц (2026): Тирана и Дуррес с реальными ценами',
    seoDescription: 'Один человек: около 650 евро в месяц в Дурресе и 865 в Тиране на аренду, коммуналку, интернет, телефон, продукты и страховку. Цены в супермаркете, электричество, автобусы и топливо, источники октября 2026.',
  },
  {
    id: 'KB-RESIDENCE-PERMIT-HOWTO',
    locale: 'ru',
    title: 'Как получить ВНЖ в Албании: виды, документы, сборы и сроки?',
    summary:
      'Заявление подаётся онлайн на e-Albania в течение 30 дней после въезда, находясь в стране: вы загружаете документы, после одобрения комплекта платите сбор в банке в течение 24 часов и отправляете оригиналы почтой в течение 7 дней; решение занимает до 30 дней, затем вы лично получаете биометрическую карту в местном отделе миграции. Первый ВНЖ выдают до одного года (гражданам США - на пять) с правом продления; постоянное проживание - после пяти лет. Сборы по постановлению VKM 858/2021: 8 000 леков для собственника недвижимости, 4 500 леков для пенсионера, цифрового кочевника, студента или члена семьи, 12 500 леков за постоянный ВНЖ, плюс сама карта. Подтверждение средств - депозит 300 000 леков на человека в год или доход 32 000 леков в месяц, если для вида ВНЖ не установлено иное.',
    sections: [
      {
        heading: 'Какой ВНЖ вам подходит',
        body: 'Албания выдаёт временные разрешения (тип B) под конкретную цель и постоянное (тип C) после пяти лет. Первый временный ВНЖ действует не больше года, если закон не говорит иначе; годовой ВНЖ можно продлевать до пяти раз подряд. У граждан ЕС с апреля 2026 года более лёгкий путь: регистрационное свидетельство, которое выдаётся онлайн без сервисного сбора. Украинцам ВНЖ не нужен до 30 марта 2027 года.',
        tables: [
          {
            title: 'Основные виды ВНЖ для тех, кто переезжает в Албанию',
            columns: ['ВНЖ', 'Кому', 'Срок', 'Сервисный сбор, первый / продление'],
            rows: [
              ['Собственник недвижимости (ст. 84)', 'Владелец жилья в Албании или совладелец не менее половины; минимальной стоимости нет', 'До 1 года, продление каждый год', '8 000 / 4 000 леков'],
              ['Пенсионер (ст. 85)', 'Вышедший на пенсию за границей; работать нельзя; супруг может присоединиться', 'До 1 года, с продлением', '4 500 / 2 250 леков'],
              ['Цифровой кочевник (единое разрешение, ст. 68)', 'Удалённая работа на иностранного работодателя или клиентов; страховка на 1 год; средства 408 000 леков', 'До 1 года', '4 500 / 2 250 леков'],
              ['Наёмный работник или самозанятый (единое разрешение)', 'Трудовой договор, одобренный агентством занятости, либо бизнес-план и 500 000 леков средств', '1-3 года', '8 000-10 000 / 4 000 леков'],
              ['Инвестор (ст. 85/1, с 2025 года)', 'Бизнес, где на каждого иностранца работают 5 албанцев с зарплатой не ниже средней', '2 года, затем 3, затем постоянный', '9 000 / 4 500 леков'],
              ['Воссоединение семьи (ст. 41)', 'Супруг и дети обладателя ВНЖ; жильё, страховка и доход', '1 год, с продлением', '4 500 / 2 250 леков'],
              ['Граждане США и Косово', 'Любая цель, первое обращение', '5 лет', '12 000 леков'],
              ['Граждане ЕС', 'Регистрационное свидетельство вместо ВНЖ, с апреля 2026 года', 'Проверка за 2 рабочих дня', 'Без сервисного сбора'],
              ['Постоянное проживание (тип C)', '5 лет непрерывного законного проживания, доход, страховка, жильё, уплаченные налоги', 'Бессрочно; карта обновляется каждые 10 лет', '12 500 леков'],
            ],
            methodology: 'Сборы из приложения 6 к VKM 858/2021 в редакции 2026 года; они не включают биометрическую карту, которая оплачивается отдельно. Дети до 16 лет платят только за карту.',
          },
        ],
      },
      {
        heading: 'Как проходит подача, шаг за шагом',
        body: '- Въезжаете в Албанию (без визы или по визе типа D) и подаёте заявление на e-Albania в течение 30 дней; в момент подачи вы должны быть в стране и иметь личную электронную почту - на неё приходят все уведомления. Единые разрешения (работа, цифровой кочевник, инвестор) можно подать из-за границы, срок - до 12 недель.\n- Загружаете документы. Если чего-то не хватает, вам сообщат в течение 10 дней, и у вас будет до 30 дней, чтобы дополнить комплект.\n- Когда комплект принят, вы получаете временное разрешение в течение одного рабочего дня - оно действует месяц и продлевается до решения - и сообщение с суммой сбора: оплатите его в албанском банке в течение 24 часов.\n- В течение 7 дней отправьте почтой в отдел миграции оригиналы, две фотографии, квитанцию об оплате и подписанную форму. Пропустите срок - заявление отклонят.\n- Решение занимает до 30 дней. Затем лично придите в местный отдел миграции (Drejtoria Vendore e Kufirit dhe Migracionit), чтобы подтвердить личность и подать на биометрическую карту.\n- Зарегистрируйте адрес в службе гражданского состояния в течение 30 дней после получения ВНЖ, иначе его аннулируют. О смене адреса сообщайте полиции в течение 10 дней.\n- Продлевайте за 60 дней до окончания срока, приложив подтверждение уплаты государственных и местных налогов за прошлый год.',
        tables: [
          {
            title: 'Сроки, которые важны',
            columns: ['Шаг', 'Срок'],
            rows: [
              ['Подать заявление после въезда', 'В течение 30 дней'],
              ['Дополнить комплект с недостающими документами', 'Сообщают в течение 10 дней, до 30 дней на дополнение'],
              ['Оплатить сбор в банке', 'В течение 24 часов после сообщения'],
              ['Отправить оригиналы, фото, квитанцию и форму', 'В течение 7 дней'],
              ['Решение', 'До 30 дней; единые разрешения до 12 недель'],
              ['Зарегистрировать адрес', 'В течение 30 дней после получения ВНЖ'],
              ['Заявление на продление', 'За 60 дней до окончания срока'],
              ['Допустимое время за границей', 'До 180 дней с уведомлением'],
            ],
          },
        ],
      },
      {
        heading: 'Документы и подтверждение средств',
        body: 'Для любого заявления нужны форма, фотография не старше шести месяцев (47 x 36 мм, белый фон), копия паспорта со штампом о въезде или визой D, самодекларация об отсутствии судимости и самодекларация о подходящем жилье с адресом. Документы, выданные за границей, должны быть переведены на албанский, выданы не раньше чем шесть месяцев назад, заверены и апостилированы.\n\nДля ВНЖ собственника добавьте свидетельство о собственности или нотариальную копию договора купли-продажи с подтверждением оплаты, подтверждение средств и заявление о цели пребывания; в правилах 2026 года медстраховка для этого ВНЖ не указана. Пенсионеры показывают справку о пенсии; старый список e-Albania ещё требует пенсию не меньше 1 200 000 леков в год, справку банка о переводе пенсии и медстраховку в Албании - возьмите их с собой. Цифровые кочевники декларируют иностранный контракт и 408 000 леков средств и прикладывают полис медстрахования на год; оригиналы они сдают в течение 30 дней после одобрения.\n\nАрендатор может подтвердить жильё съёмной квартирой: обычный документ - годовой договор аренды, заверенный нотариусом.',
        tables: [
          {
            title: 'Что считается достаточными средствами',
            columns: ['ВНЖ', 'Подтверждение средств'],
            rows: [
              ['Общее правило (собственники, семья и другие)', 'Банковский депозит 300 000 леков на человека за календарный год (около 3 260 евро) или ежемесячный доход 32 000 леков на человека (около 348 евро)'],
              ['Пенсионер', 'Справка о пенсии (порог 1 200 000 леков в год по-прежнему есть в списке e-Albania и в правилах визы D)'],
              ['Цифровой кочевник', 'Самодекларация о средствах не менее 408 000 леков (около 4 430 евро)'],
              ['Самозанятый', 'Не менее 500 000 леков плюс бизнес-план'],
            ],
          },
        ],
      },
    ],
    faq: [
      {q: 'Сколько времени занимает ВНЖ в Албании?', a: 'До 30 дней с момента полного заявления (в законе - четыре недели); на это время у вас временное разрешение. Единые разрешения, поданные из-за границы, рассматривают до 12 недель.'},
      {q: 'Сколько стоит ВНЖ?', a: '8 000 леков (около 87 евро) для собственника недвижимости, 4 500 леков для пенсионера, цифрового кочевника, студента или члена семьи, 12 500 леков за постоянное проживание; продление - вдвое дешевле. Биометрическая карта оплачивается отдельно.'},
      {q: 'Нужно ли быть в Албании, чтобы подать заявление?', a: 'Да, для обычного ВНЖ: вы подаёте на e-Albania в течение 30 дней после въезда. Единые разрешения для работы, удалёнки и инвесторов можно подать из-за границы.'},
      {q: 'Даёт ли покупка квартиры ВНЖ?', a: 'Она даёт право подать на годовой ВНЖ собственника по статье 84 с продлением, без минимальной стоимости; достаточно владеть хотя бы половиной квартиры.'},
      {q: 'Что будет, если не зарегистрировать адрес?', a: 'ВНЖ аннулируют, если адрес не зарегистрирован в службе гражданского состояния в течение 30 дней после его получения.'},
    ],
    gaps: [
      'Стоимость биометрической карты ВНЖ не опубликована ни в VKM, ни на e-Albania.',
      'Штраф за подачу позже 30 дней после въезда упомянут на e-Albania без суммы.',
      'Нет официального списка принимаемых страховщиков и подтверждения, что иностранный полис принимают для каждого вида ВНЖ.',
      'Минимальная сумма инвестиций для ВНЖ инвестора устанавливается министерской инструкцией, не найденной на 24.10.2026.',
    ],
    seoTitle: 'ВНЖ в Албании (2026): как подать, документы, сборы, сроки',
    seoDescription: 'Подача на e-Albania в течение 30 дней после въезда, решение до 30 дней, биометрическая карта лично. Сборы 4 500-8 000 леков, постоянный 12 500. Подтверждение средств, документы, ВНЖ собственника, пенсионера и кочевника.',
  },
  {
    id: 'KB-MONEY-IN-ALBANIA',
    locale: 'ru',
    title: 'Деньги в Албании: нужны ли наличные, работают ли карты и как открыть счёт в банке?',
    summary:
      'Валюта - лек (ALL); 23 октября 2026 года курс Банка Албании был 90,74 лека за евро, и лек укрепляется уже несколько лет. Карты принимают в супермаркетах, гостиницах, на заправках и в большинстве ресторанов в городах (около 67% платежей через банки в 2025 году прошли по картам, а к середине 2026 года в стране было 38 662 терминала), но рынки, маленькие магазины, такси и многие арендодатели хотят наличные - в леках или евро. С 7 октября 2025 года Албания входит в SEPA, поэтому переводы в евро из банка ЕС дёшевы и быстры. Наличные от 10 000 евро нужно декларировать на границе. Счёт в банке открывают лично по паспорту; правил для нерезидентов банки почти не публикуют, так что заранее спросите в отделении, что понадобится.',
    sections: [
      {
        heading: 'Лек, евро и курс',
        body: 'Цены в магазинах, счета и налоги - в леках. Недвижимость, аренда на побережье и машины обычно указаны в евро, арендодатели и продавцы охотно берут евро; в магазине купюру в евро тоже обычно примут, по своему курсу. Банк Албании публикует официальный курс каждый рабочий день: 90,74 лека за евро 23 октября 2026 года против примерно 126 в 2020 году - то есть на евро в Албании сегодня можно купить на треть меньше, чем шесть лет назад. Меняйте в банке или в лицензированном обменнике (zyrë këmbimi) в городе, а не в аэропорту; обменники вывешивают в окне и курс покупки, и курс продажи.',
        tables: [
          {
            title: 'Лек к евро',
            columns: ['Дата', 'Леков за евро', 'Источник'],
            rows: [
              ['Среднее за 2020 год', '126,24', 'Банк Албании'],
              ['9 сентября 2026', '92,02', 'Фиксинг Банка Албании (курс, используемый на страницах Domlivo)'],
              ['23 октября 2026', '90,74', 'Фиксинг Банка Албании'],
            ],
          },
        ],
      },
      {
        heading: 'Где работают карты и где нужны наличные',
        body: 'Visa и Mastercard работают в супермаркетах, гостиницах, на заправках, в аптеках, аэропорту и большинстве городских ресторанов; бесконтактная оплата - норма. Сами албанцы теперь платят картой чаще, чем снимают наличные: около 67% платежей через банки в 2025 году прошли по картам, у 78% взрослых есть счёт (в 2018 году - у 40%), а число терминалов за год выросло на 38%, до 38 662 к середине 2026 года, во многом благодаря туризму. Наличные остаются правилом на ежедневных рынках, в деревнях, в такси, маленьких кафе, у управляющих домами и почти при любой оплате аренды частному собственнику. Держите леки мелкими купюрами.\n\nБанкоматы берут комиссию вашего банка за операцию за рубежом плюс часто местную комиссию, которую показывают на экране до подтверждения; снимать крупные суммы реже выходит дешевле. Если карта выпущена в стране под финансовыми санкциями, в Албании она тоже не сработает.',
        tables: [
          {
            title: 'Платежи в Албании, 2025-2026',
            columns: ['Показатель', 'Значение'],
            rows: [
              ['Доля банковских платежей по картам, 2025', 'Около 67%; 20% через интернет- или мобильный банк'],
              ['Взрослые со счётом в банке', '78% (40% в 2018 году)'],
              ['Активные терминалы, середина 2026', '38 662, +38% за год'],
              ['Платежи картами в терминалах, I полугодие 2026', 'Около 16 миллионов, +28%; 58,3 млрд леков'],
              ['Наличные, которые нужно декларировать на границе', '10 000 евро и больше, на въезде и выезде; штраф 20 000-60 000 леков за первое нарушение'],
            ],
          },
        ],
      },
      {
        heading: 'Как перевести деньги в Албанию',
        body: 'Албания вошла в SEPA: первая операция SEPA прошла 7 октября 2025 года, и к весне 2026 года переводы SEPA делали одиннадцать банков - 363 000 переводов на 4,3 млрд евро за первые полгода. Перевод в евро с немецкого, итальянского или польского счёта в албанский банк теперь обычный платёж SEPA, а не SWIFT с комиссиями банков-корреспондентов, и это важно, когда вы платите задаток или цену квартиры. Wise тоже выплачивает на албанские счета в леках. При покупке недвижимости деньги всё равно должны пройти через банк с подтверждением происхождения: см. страницу об оплате недвижимости и проверках против отмывания денег.',
        tables: [
          {
            title: 'Переводы в Албанию и из неё',
            columns: ['Канал', 'Статус'],
            rows: [
              ['Переводы SEPA в евро', 'Работают с 7 октября 2025 года; 11 банков; приём в Европейский платёжный совет 21.11.2024'],
              ['Wise', 'Выплачивает на албанские банковские счета в леках; получателю не нужен счёт Wise'],
              ['Наличные через границу', 'Декларировать от 10 000 евро (бесплатно, форма RTVK)'],
            ],
          },
        ],
      },
      {
        heading: 'Открыть счёт в банке и получить налоговый номер',
        body: 'Счета открывают лично в отделении. Каждый банк просит паспорт; большинство - подтверждение адреса в Албании (договор аренды или договор купли-продажи) и цель счёта, а ВНЖ всё заметно упрощает. Албанские банки публикуют тарифы, но не общее правило для нерезидентов, поэтому сначала напишите в отделение и возьмите документы, которые агентство или нотариус дают вам по сделке. Стандартная дебетовая карта в Raiffeisen стоит 100 леков в месяц, внутри пакета счёта - бесплатно, лимит на снятие наличных 30 000 леков в день.\n\nДля налогов физические лица используют как налоговый номер личный номер из 10 знаков, напечатанный на биометрической карте ВНЖ; официально его выдают гражданам и иностранцам с постоянным проживанием. Самозанятый или компания регистрируются в Национальном бизнес-центре и за день получают NIPT. Один из этих номеров нужен, чтобы платить ежегодный налог на здание или декларировать доход от аренды.',
        tables: [
          {
            title: 'Банковский счёт и налоговый номер',
            columns: ['Статья', 'Что действует'],
            rows: [
              ['Плата за дебетовую карту (Raiffeisen, стандартный клиент)', '100 леков в месяц, 0 в пакетах счёта; наличные 30 000 леков в день, 600 000 в месяц'],
              ['Налоговый номер, физические лица', 'Личный номер (NID) на удостоверении или карте ВНЖ; выдаётся гражданам и постоянным резидентам'],
              ['Налоговый номер, бизнес и самозанятые', 'NIPT из Национального бизнес-центра (QKB)'],
              ['Оплата квартиры', 'Через банк, с документами о происхождении средств по закону 9917/2008'],
            ],
          },
        ],
      },
    ],
    faq: [
      {q: 'Можно ли платить в Албании евро?', a: 'Недвижимость, аренда на побережье и машины указаны в евро, наличные евро берут почти везде; магазины, счета и налоги - в леках. Носите леки для рынков, такси и маленьких кафе.'},
      {q: 'Работают ли банковские карты в Албании?', a: 'Да - в супермаркетах, гостиницах, на заправках и в городских ресторанах: 67% платежей через банки в 2025 году прошли по картам, к середине 2026 года было 38 662 терминала. Рынки, деревни и частные арендодатели хотят наличные.'},
      {q: 'Сколько наличных можно ввезти в Албанию?', a: 'Любую сумму, но от 10 000 евро нужно декларировать на таможне при въезде и выезде; штраф за недекларирование начинается с 20 000 леков.'},
      {q: 'Входит ли Албания в SEPA?', a: 'Да, с первой операции SEPA 7 октября 2025 года; переводы SEPA в евро делают одиннадцать банков.'},
      {q: 'Может ли иностранец открыть счёт в албанском банке?', a: 'Да, лично, по паспорту и обычно с подтверждением албанского адреса; общего правила для нерезидентов банки не публикуют, так что спросите в отделении, что понадобится.'},
    ],
    gaps: [
      'Требования банков к открытию счёта нерезидентами и тарифы на обслуживание счетов на их страницах не найдены (Intesa, BKT, Credins, OTP, Union, Tirana Bank).',
      'Комиссии банкоматов для иностранных карт в опубликованных тарифах не найдены.',
      'Первоисточником не подтверждено, получают ли обладатели временного ВНЖ личный налоговый номер и как иначе они платят налог на недвижимость.',
      'Доступность счетов Revolut и Wise для резидентов Албании не подтверждена.',
    ],
    seoTitle: 'Деньги в Албании (2026): леки, карты, наличные, переводы SEPA, счёт в банке',
    seoDescription: '90,74 лека за евро (октябрь 2026). Карты работают в городах, наличные правят на рынках и при аренде; декларировать наличные от 10 000 евро; SEPA с октября 2025. Как иностранцу открыть счёт и получить налоговый номер.',
  },
  // ---------------------------------------------------------- Ukrainian ---
  {
    id: 'KB-RESIDENCE-PERMIT-HOWTO',
    locale: 'uk',
    title: 'Як отримати посвідку на проживання (ВНЖ) в Албанії: види, документи, збори та строки?',
    summary:
      'Заяву подають онлайн на e-Albania протягом 30 днів після в\'їзду, перебуваючи в країні: ви завантажуєте документи, після схвалення комплекту сплачуєте збір у банку протягом 24 годин і надсилаєте оригінали поштою протягом 7 днів; рішення займає до 30 днів, після чого ви особисто отримуєте біометричну картку в місцевому відділі міграції. Першу посвідку видають до одного року (громадянам США - на п\'ять) із правом продовження; постійне проживання - після п\'яти років. Збори за постановою VKM 858/2021: 8 000 леків для власника нерухомості, 4 500 леків для пенсіонера, цифрового кочівника, студента або члена сім\'ї, 12 500 леків за постійну посвідку, плюс сама картка. Підтвердження коштів - депозит 300 000 леків на особу на рік або дохід 32 000 леків на місяць, якщо для виду посвідки не встановлено інше.',
    sections: [
      {
        heading: 'Яка посвідка вам підходить',
        body: 'Албанія видає тимчасові посвідки (тип B) під конкретну мету і постійну (тип C) після п\'яти років. Перша тимчасова посвідка діє не більше року, якщо закон не каже інакше; річну посвідку можна продовжувати до п\'яти разів поспіль. Громадяни ЄС з квітня 2026 року мають легший шлях: реєстраційне свідоцтво, яке видають онлайн без сервісного збору. Українцям посвідка не потрібна до 30 березня 2027 року.',
        tables: [
          {
            title: 'Основні види посвідок для тих, хто переїжджає в Албанію',
            columns: ['Посвідка', 'Кому', 'Строк', 'Сервісний збір, перша / продовження'],
            rows: [
              ['Власник нерухомості (ст. 84)', 'Власник житла в Албанії або співвласник не менше половини; мінімальної вартості немає', 'До 1 року, продовження щороку', '8 000 / 4 000 леків'],
              ['Пенсіонер (ст. 85)', 'Той, хто вийшов на пенсію за кордоном; працювати не можна; подружжя може приєднатися', 'До 1 року, з продовженням', '4 500 / 2 250 леків'],
              ['Цифровий кочівник (єдиний дозвіл, ст. 68)', 'Дистанційна робота на іноземного роботодавця чи клієнтів; страховка на 1 рік; кошти 408 000 леків', 'До 1 року', '4 500 / 2 250 леків'],
              ['Найманий працівник або самозайнятий (єдиний дозвіл)', 'Трудовий договір, схвалений агентством зайнятості, або бізнес-план і 500 000 леків коштів', '1-3 роки', '8 000-10 000 / 4 000 леків'],
              ['Інвестор (ст. 85/1, з 2025 року)', 'Бізнес, де на кожного іноземця працюють 5 албанців із зарплатою не нижче середньої', '2 роки, потім 3, потім постійна', '9 000 / 4 500 леків'],
              ['Возз\'єднання сім\'ї (ст. 41)', 'Подружжя і діти власника посвідки; житло, страховка і дохід', '1 рік, з продовженням', '4 500 / 2 250 леків'],
              ['Громадяни США і Косово', 'Будь-яка мета, перше звернення', '5 років', '12 000 леків'],
              ['Громадяни ЄС', 'Реєстраційне свідоцтво замість посвідки, з квітня 2026 року', 'Перевірка за 2 робочі дні', 'Без сервісного збору'],
              ['Постійне проживання (тип C)', '5 років безперервного законного проживання, дохід, страховка, житло, сплачені податки', 'Безстроково; картку оновлюють кожні 10 років', '12 500 леків'],
            ],
            methodology: 'Збори з додатка 6 до VKM 858/2021 у редакції 2026 року; вони не включають біометричну картку, яку оплачують окремо. Діти до 16 років платять лише за картку.',
          },
        ],
      },
      {
        heading: 'Як відбувається подача, крок за кроком',
        body: '- В\'їжджаєте в Албанію (без візи або за візою типу D) і подаєте заяву на e-Albania протягом 30 днів; у момент подачі ви маєте бути в країні й мати особисту електронну пошту - на неї приходять усі повідомлення. Єдині дозволи (робота, цифровий кочівник, інвестор) можна подати з-за кордону, строк - до 12 тижнів.\n- Завантажуєте документи. Якщо чогось не вистачає, вам повідомлять протягом 10 днів, і у вас буде до 30 днів, щоб доповнити комплект.\n- Коли комплект прийнято, ви отримуєте тимчасовий дозвіл протягом одного робочого дня - він діє місяць і продовжується до рішення - і повідомлення із сумою збору: сплатіть його в албанському банку протягом 24 годин.\n- Протягом 7 днів надішліть поштою до відділу міграції оригінали, дві фотографії, квитанцію про оплату і підписану форму. Пропустите строк - заяву відхилять.\n- Рішення займає до 30 днів. Потім особисто прийдіть до місцевого відділу міграції (Drejtoria Vendore e Kufirit dhe Migracionit), щоб підтвердити особу і подати на біометричну картку.\n- Зареєструйте адресу в службі цивільного стану протягом 30 днів після отримання посвідки, інакше її анулюють. Про зміну адреси повідомляйте поліцію протягом 10 днів.\n- Продовжуйте за 60 днів до закінчення строку, додавши підтвердження сплати державних і місцевих податків за минулий рік.',
        tables: [
          {
            title: 'Строки, які важливі',
            columns: ['Крок', 'Строк'],
            rows: [
              ['Подати заяву після в\'їзду', 'Протягом 30 днів'],
              ['Доповнити комплект документами, яких не вистачає', 'Повідомляють протягом 10 днів, до 30 днів на доповнення'],
              ['Сплатити збір у банку', 'Протягом 24 годин після повідомлення'],
              ['Надіслати оригінали, фото, квитанцію і форму', 'Протягом 7 днів'],
              ['Рішення', 'До 30 днів; єдині дозволи до 12 тижнів'],
              ['Зареєструвати адресу', 'Протягом 30 днів після отримання посвідки'],
              ['Заява на продовження', 'За 60 днів до закінчення строку'],
              ['Дозволений час за кордоном', 'До 180 днів з повідомленням'],
            ],
          },
        ],
      },
      {
        heading: 'Документи та підтвердження коштів',
        body: 'Для будь-якої заяви потрібні форма, фотографія не старша за шість місяців (47 x 36 мм, білий фон), копія паспорта зі штампом про в\'їзд або візою D, самодекларація про відсутність судимості і самодекларація про належне житло з адресою. Документи, видані за кордоном, мають бути перекладені албанською, видані не раніше ніж шість місяців тому, засвідчені й апостильовані.\n\nДля посвідки власника додайте свідоцтво про право власності або нотаріальну копію договору купівлі-продажу з підтвердженням оплати, підтвердження коштів і заяву про мету перебування; у правилах 2026 року медстраховка для цієї посвідки не вказана. Пенсіонери показують довідку про пенсію; старий перелік e-Albania ще вимагає пенсію не менше 1 200 000 леків на рік, довідку банку про переказ пенсії та медстраховку в Албанії - візьміть їх із собою. Цифрові кочівники декларують іноземний контракт і 408 000 леків коштів та додають поліс медстрахування на рік; оригінали вони здають протягом 30 днів після схвалення.\n\nОрендар може підтвердити житло орендованою квартирою: звичайний документ - річний договір оренди, засвідчений нотаріусом.',
        tables: [
          {
            title: 'Що вважається достатніми коштами',
            columns: ['Посвідка', 'Підтвердження коштів'],
            rows: [
              ['Загальне правило (власники, сім\'я та інші)', 'Банківський депозит 300 000 леків на особу за календарний рік (близько 3 260 євро) або щомісячний дохід 32 000 леків на особу (близько 348 євро)'],
              ['Пенсіонер', 'Довідка про пенсію (поріг 1 200 000 леків на рік досі є в переліку e-Albania і в правилах візи D)'],
              ['Цифровий кочівник', 'Самодекларація про кошти не менше 408 000 леків (близько 4 430 євро)'],
              ['Самозайнятий', 'Не менше 500 000 леків плюс бізнес-план'],
            ],
          },
        ],
      },
    ],
    faq: [
      {q: 'Скільки часу займає посвідка на проживання в Албанії?', a: 'До 30 днів від повної заяви (у законі - чотири тижні); на цей час у вас тимчасовий дозвіл. Єдині дозволи, подані з-за кордону, розглядають до 12 тижнів.'},
      {q: 'Скільки коштує посвідка на проживання?', a: '8 000 леків (близько 87 євро) для власника нерухомості, 4 500 леків для пенсіонера, цифрового кочівника, студента або члена сім\'ї, 12 500 леків за постійне проживання; продовження - удвічі дешевше. Біометричну картку оплачують окремо.'},
      {q: 'Чи треба бути в Албанії, щоб подати заяву?', a: 'Так, для звичайної посвідки: ви подаєте на e-Albania протягом 30 днів після в\'їзду. Єдині дозволи для роботи, дистанційної роботи та інвесторів можна подати з-за кордону.'},
      {q: 'Чи дає купівля квартири посвідку на проживання?', a: 'Вона дає право подати на річну посвідку власника за статтею 84 з продовженням, без мінімальної вартості; достатньо володіти хоча б половиною квартири.'},
      {q: 'Що буде, якщо не зареєструвати адресу?', a: 'Посвідку анулюють, якщо адресу не зареєстровано в службі цивільного стану протягом 30 днів після її отримання.'},
    ],
    gaps: [
      'Вартість біометричної картки посвідки не опублікована ні у VKM, ні на e-Albania.',
      'Штраф за подачу пізніше ніж через 30 днів після в\'їзду згаданий на e-Albania без суми.',
      'Немає офіційного переліку прийнятних страховиків і підтвердження, що іноземний поліс приймають для кожного виду посвідки.',
      'Мінімальна сума інвестицій для посвідки інвестора встановлюється міністерською інструкцією, не знайденою на 24.10.2026.',
    ],
    seoTitle: 'ВНЖ в Албанії (2026): як подати, документи, збори, строки',
    seoDescription: 'Подача на e-Albania протягом 30 днів після в\'їзду, рішення до 30 днів, біометрична картка особисто. Збори 4 500-8 000 леків, постійна 12 500. Підтвердження коштів, документи, посвідки власника, пенсіонера і кочівника.',
  },
  // ------------------------------------------------------------- German ---
  {
    id: 'KB-RENT-BY-CITY',
    locale: 'de',
    title: 'Was kostet eine Wohnung in Albanien zur Langzeitmiete, nach Städten (2026)?',
    summary:
      'Eine Zweizimmerwohnung (1+1) mit Jahresvertrag wird in Tirana im Durchschnitt für etwa 590 Euro im Monat angeboten (Agenturdurchschnitt, erstes Halbjahr 2026), in Durrës zu einem Median von 390 Euro und in Sarandë für 380-430 Euro (September 2026), in Vlorë je nach Lage für 300-600 Euro und in Shëngjin für 250-430 Euro. Dreizimmerwohnungen (2+1) kosten rund 30-60 % mehr. Das sind Angebotsmieten: Mieter einigen sich meist 5-10 % darunter, und Wohnungen am Strand kosten im Sommer 60-100 % mehr als mit Winter- oder Jahresvertrag.',
    sections: [
      {
        heading: 'Angebotsmieten nach Stadt, Jahresvertrag',
        body: 'Die Mieten unten sind das, was Vermieter für eine möblierte Wohnung mit Zwölfmonatsvertrag inserieren, in Euro, weil fast alle Anzeigen an der Küste in Euro stehen. Die Zahlen für Tirana stammen aus dem Halbjahresdurchschnitt eines Agenturnetzes und aus einer Stichprobe von Anzeigen; die Küstenstädte aus Stichproben von Anzeigen vom September 2026, die klein sind - lesen Sie sie als Spanne, nicht als Marktstatistik.',
        tables: [
          {
            title: 'Angebotsmieten pro Monat, EUR, 2026',
            columns: ['Stadt', '1+1 (ein Schlafzimmer)', '2+1 (zwei Schlafzimmer)', 'Grundlage'],
            rows: [
              ['Tirana, alle Lagen', '590 Durchschnitt; 550 Median in Anzeigen', '954 Durchschnitt; 750 Median in Anzeigen', 'Agenturdurchschnitt 1. Hj. 2026; 50 Anzeigen, September 2026'],
              ['Tirana, nahe Zentrum', '600-900', '1.000-1.200 (Komuna e Parisit, mit Stellplatz)', 'Makler, 2026'],
              ['Tirana, Außenbezirke (Fresku, Kombinat, Rand von Kamëz)', '380-500', 'Etwa 450', 'Makler, 2026'],
              ['Durrës, alle Lagen', '300-550, Median 390', '300-700, Median 500', '32 Anzeigen, September 2026'],
              ['Durrës, Stadtzentrum', '250-400', '350-550', 'Mietratgeber, April 2026'],
              ['Durrës, Strand (Plazh), Jahres- oder Wintervertrag', '200-350; Median 350 im September', '300-500; 600 in Anzeigen vom September', 'Ratgeber 2026; Anzeigen, September 2026'],
              ['Durrës, Golem (neuere Anlagen)', '430-450', '-', '3 Anzeigen, September 2026'],
              ['Vlorë, Hinterland und Zentrum', '300', '350-500', '4 Anzeigen, 2026'],
              ['Vlorë, Lungomare und Meerseite', '400-600 (alle Größen)', '-', 'Anzeigen, 2026'],
              ['Sarandë, Zentrum', '380-430', '350-700', 'Anzeigen, 2025-2026'],
              ['Shëngjin', '250 (Altstadt, 2+1 mit 56 m²) bis 430 (1+1 in neuer Anlage); Studio 350', '-', 'Anzeigen, 2025-2026'],
              ['Albanien, landesweiter Mix', 'Studio 239-467, ein Schlafzimmer 293-674 (Durchschnitt 369)', '359-826 (Durchschnitt 532)', 'Aggregator, Mitte 2026'],
            ],
            methodology: 'Angebotsmieten eines Franchise-Netzes (Tirana) und Stichproben der ersten Seite von MerrJep- und Homezone-Anzeigen (Küste). Euro-Werte zu 92,02 Lek je Euro, wo die Anzeige in Lek stand. Erzielte Mieten liegen meist 5-10 % darunter.',
          },
        ],
      },
      {
        heading: 'Sommer und Winter an der Küste',
        body: 'Am Strand von Durrës wird dieselbe 1+1 von Juni bis September für 400-600 Euro im Monat angeboten und von Oktober bis Mai für 200-350 Euro; eine 2+1 für 500-900 Euro im Sommer und 300-500 Euro im Winter. Vermieter, die im Sommer pro Nacht vermieten, bieten ab Oktober oft neunmonatige "Winterverträge" an - die günstigste Art, am Meer zu wohnen. Viele Ferienwohnungen in Vlorë und Sarandë haben keine Heizung; prüfen Sie das, bevor Sie für den Winter unterschreiben.',
        tables: [
          {
            title: 'Strand von Durrës (Plazh): Sommer gegen Winter, EUR im Monat',
            columns: ['Wohnung', 'Juni-September', 'Oktober-Mai'],
            rows: [
              ['1+1', '400-600', '200-350'],
              ['2+1', '500-900', '300-500'],
            ],
          },
        ],
      },
      {
        heading: 'Wie schnell die Mieten steigen',
        body: 'Die Angebotsmieten für Neuvermietungen in Tirana sind in vier Jahren um etwa 48 % gestiegen (eine 1+1 von 400 Euro 2022 auf 590 Euro 2026), 2+1-Wohnungen im Agenturdurchschnitt um 26 % in einem Jahr. Der amtliche Verbraucherpreisindex, der die Mieten bestehender Mieter misst, stieg im selben Zeitraum nur um 1-8,5 % im Jahr: Wer wohnen bleibt, erlebt viel kleinere Erhöhungen als jemand, der in einer gefragten Lage neu unterschreibt. In Durrës hat sich die Angebotsmiete für eine 1+1 seit 2022 etwa verdoppelt, von rund 200 Euro auf einen Median von 390.',
        tables: [
          {
            title: 'Mietentwicklung 2022-2026',
            columns: ['Reihe', 'Veränderung'],
            rows: [
              ['Tirana, 1+1 Angebotsmiete, 3. Quartal 2022 bis 1. Hj. 2026', 'Von 400 auf 590 Euro, etwa +48 %'],
              ['Tirana, 2+1 Agenturdurchschnitt, 1. Hj. 2025 bis 1. Hj. 2026', 'Von 755 auf 954 Euro, +26 %'],
              ['Durrës, ein Schlafzimmer, 3. Quartal 2022 bis September 2026', 'Von 200 auf 390 Euro Median, etwa +95 %'],
              ['Mieten bestehender Mieter (INSTAT-Mietindex), 2022-2026', '+1 % bis +8,5 % im Jahr'],
            ],
          },
        ],
      },
      {
        heading: 'Kaution, Vertrag und wer was zahlt',
        body: 'Rechnen Sie mit einer Kaution von einer oder zwei Monatsmieten; manche Vermieter verlangen zwei oder drei Monate im Voraus. Ein Mietvertrag über mehr als ein Jahr muss schriftlich und notariell beglaubigt sein; ein Zwölfmonatsvertrag ist meist ein schriftlicher Vertrag ohne Notar. Kündigungsfristen liegen bei 30-90 Tagen. Der Mieter zahlt Strom, Wasser und Internet nach Verbrauch, meist über Verträge, die auf den Eigentümer laufen, und in den meisten Häusern das monatliche Hausgeld. Die Steuer von 15 % auf die Miete trägt der Vermieter, nicht Sie; bei privaten Mietern erklärt er sie einmal im Jahr.\n\nWer vor dem Kauf mietet, braucht den Jahresvertrag auch für die Aufenthaltsgenehmigung: der notariell beglaubigte Mietvertrag gilt als Nachweis der Unterkunft.',
        tables: [
          {
            title: 'Übliche Bedingungen eines Langzeitmietvertrags',
            columns: ['Punkt', 'Praxis'],
            rows: [
              ['Kaution', '1-2 Monatsmieten; Forderungen nach 2-3 Monaten im Voraus kommen vor'],
              ['Vertragsform', 'Über 1 Jahr: schriftlich und notariell; 1 Jahr oder kürzer: schriftlich, Notar freiwillig'],
              ['Kündigungsfrist', '30-90 Tage'],
              ['Reparaturen', 'Vermieter: Substanz; Mieter: laufende Instandhaltung'],
              ['Steuer auf die Miete', '15 % der Miete, zahlt der Vermieter'],
            ],
          },
        ],
      },
    ],
    faq: [
      {q: 'Was kostet eine Zweizimmerwohnung in Tirana?', a: 'Etwa 590 Euro im Monat im Agenturdurchschnitt des ersten Halbjahrs 2026; 380-500 Euro in den Außenbezirken und 600-900 Euro nahe dem Zentrum.'},
      {q: 'Was kostet die Miete in Durrës?', a: 'Ein Median von 390 Euro für eine 1+1 und 500 Euro für eine 2+1 in den Anzeigen vom September 2026; 200-350 Euro für eine 1+1 am Strand mit Wintervertrag.'},
      {q: 'Wird die Miete in Albanien in Euro oder Lek gezahlt?', a: 'Beides: fast alle Anzeigen an der Küste stehen in Euro, viele in Tirana in Lek. Der Vertrag kann in beiden Währungen lauten; die Nebenkosten werden in Lek abgerechnet.'},
      {q: 'Welche Kaution verlangen Vermieter?', a: 'Meist eine oder zwei Monatsmieten, manchmal zwei oder drei Monate im Voraus.'},
      {q: 'Kann ich nur für den Winter mieten?', a: 'Ja, an der Küste: Eigentümer, die im Sommer pro Nacht vermieten, bieten ab Oktober Neunmonatsverträge zum Wintertarif an, 200-350 Euro für eine 1+1 am Strand von Durrës.'},
    ],
    gaps: [
      'Die Küstenstichproben umfassen 2-18 Anzeigen je Stadt; ein monatlicher Mietindex aus einer größeren Stichprobe steht noch aus.',
      'Keine veröffentlichte Norm für die Maklerprovision bei Vermietungen (Praxis: 50-100 % einer Monatsmiete).',
      'Der Anteil der Küstenwohnungen mit neunmonatigen Winterverträgen ist nicht quantifiziert.',
    ],
    seoTitle: 'Langzeitmiete in Albanien nach Städten (2026): Tirana, Durrës, Vlorë, Sarandë',
    seoDescription: 'Angebotsmieten mit Jahresvertrag für 1+1 und 2+1: Tirana etwa 590 Euro, Durrës Median 390, Sarandë 380-430, Shëngjin ab 250. Sommer und Winter an der Küste, Kaution und Vertrag.',
  },
]
