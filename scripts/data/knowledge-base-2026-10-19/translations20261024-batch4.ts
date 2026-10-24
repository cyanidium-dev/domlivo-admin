import type {ArticleTranslation} from './types'

/**
 * Hand-written translations of the batch 4 useful-information pages
 * (2026-10-24): healthcare (it), SIM and internet (it), driving licence (it,
 * de), holidays (de, pl), pros and cons (it, ru, uk). Applied with
 *   npx tsx scripts/applyKnowledgeTranslations.ts --execute --file scripts/data/knowledge-base-2026-10-19/translations20261024-batch4.ts
 */
export const TRANSLATIONS: ArticleTranslation[] = [
  // ------------------------------------------------------------ Italian ---
  {
    id: 'KB-HEALTHCARE',
    locale: 'it',
    title: 'Come funzionano sanità, assicurazione sanitaria e scuole per uno straniero che vive in Albania?',
    summary:
      'Il pronto soccorso è gratuito per tutti nei casi che mettono in pericolo la vita, residenti e visitatori, al numero 112 (funziona anche il 127). Per il resto serve un\'assicurazione: un residente straniero che non lavora in Albania può entrare volontariamente nel sistema pubblico pagando il 3,4% del doppio del salario minimo, circa 3.400 lek (37 euro) al mese a persona, con sei mesi di attesa prima che medico di famiglia, ospedale e farmaci rimborsati diventino disponibili; fino ad allora, e per le cliniche private, serve una polizza privata, che diversi tipi di permesso di soggiorno chiedono comunque. Le scuole pubbliche sono gratuite e aperte ai bambini stranieri, in albanese; le scuole internazionali di Tirana accettano bambini dai 2 anni e comunicano le rette su richiesta.',
    sections: [
      {
        heading: 'Il sistema pubblico e come entrarci',
        body: 'L\'Albania ha un sistema di assicurazione sanitaria obbligatoria gestito dal fondo FSDKSH. Dipendenti e autonomi residenti in Albania vi contribuiscono con i versamenti; bambini, studenti e alcuni altri gruppi sono coperti dallo Stato; tutti gli altri, compreso un residente straniero che vive di pensione o di redditi dall\'estero, possono aderire volontariamente. Il contributo volontario è il 3,4% di una base pari al doppio del salario minimo, cioè 3.400 lek al mese nel 2026. Le prestazioni partono sei mesi dopo l\'iscrizione e il pagamento; se vi iscrivete più di tre mesi dopo aver perso un\'altra copertura, l\'attesa è di un anno.\n\nGli assicurati si registrano presso un medico di famiglia (3,9 milioni di residenti erano nelle liste dei medici di famiglia nel 2024), ricevono cure negli ospedali pubblici e pagano solo una parte del prezzo dei farmaci nella lista di rimborso. Tutto ciò che è fuori dal pacchetto si paga per intero, e la maggior parte degli stranieri a Tirana, Durazzo e nel sud usa cliniche private per quanto non è urgente, pagando a visita.',
        tables: [
          {
            title: 'Assicurazione sanitaria pubblica per un residente straniero',
            columns: ['Regola', 'Cosa dice', 'Fonte'],
            rows: [
              ['Chi può aderire volontariamente', 'Chiunque non sia coperto come dipendente, autonomo o categoria a carico dello Stato', 'Legge 10383/2011 art. 5(3)'],
              ['Contributo', '3,4% del doppio del salario minimo: 3.400 lek (circa 37 euro) al mese a persona nel 2026', 'FSDKSH; salario minimo 50.000 lek'],
              ['Periodo di attesa', '6 mesi; 1 anno se vi iscrivete in ritardo', 'Rapporto annuale FSDKSH 2024'],
              ['Cosa è coperto', 'Medico di famiglia, ricoveri, farmaci nella lista di rimborso; il resto lo paga il paziente', 'Legge 10383/2011 art. 3'],
              ['Emergenze', 'Gratuite nei casi di pericolo di vita per residenti e visitatori; numero 112 (in uso anche il 127)', 'Legge 147/2014 art. 4 e 10'],
            ],
          },
        ],
      },
      {
        heading: 'Assicurazione e permesso di soggiorno',
        body: 'L\'assicurazione è anche un documento. Il permesso per nomadi digitali richiede una polizza valida almeno un anno; le liste di e-Albania per ricongiungimento familiare e pensionati chiedono una "prova di assicurazione sanitaria in Albania"; il soggiorno permanente richiede la copertura del sistema albanese. Il permesso per proprietari di immobili non elenca alcuna assicurazione nelle regole del 2026, ma una polizza resta il modo sensato per coprire i sei mesi di attesa del sistema pubblico. Nessuna lista ufficiale dice quali assicuratori o polizze estere siano accettati, e i prezzi degli assicuratori albanesi per una polizza del genere non erano pubblicati sulle loro pagine quando è stata scritta questa pagina: chiedete un preventivo a SIGAL, Intersig, Eurosig o Albsig e tenete la polizza in albanese.',
        tables: [
          {
            title: 'Assicurazione sanitaria per tipo di permesso',
            columns: ['Permesso', 'Assicurazione richiesta'],
            rows: [
              ['Nomade digitale', 'Polizza valida almeno 1 anno'],
              ['Ricongiungimento familiare, pensionato', 'Prova di assicurazione sanitaria in Albania (lista e-Albania)'],
              ['Proprietario di immobile', 'Non prevista nelle regole del 2026'],
              ['Soggiorno permanente', 'Copertura del sistema di assicurazione sanitaria albanese'],
            ],
          },
        ],
      },
      {
        heading: 'Scuole e asili',
        body: 'Le scuole pubbliche sono gratuite, superiori comprese, e la legge garantisce il diritto all\'istruzione a stranieri e apolidi alle stesse condizioni dei cittadini; la scuola è obbligatoria per ogni bambino residente in Albania dai 6 ai 16 anni e la lingua di insegnamento è l\'albanese. I bambini che arrivano piccoli imparano la lingua in un anno; gli adolescenti di solito frequentano una scuola internazionale.\n\nTirana ha diverse scuole in inglese. La Tirana International School (QSI) accetta bambini dall\'asilo a due anni fino ai 13 (grado 8 americano) senza richiedere l\'inglese e, come le altre scuole internazionali, comunica le rette solo su richiesta. Fuori Tirana la scelta è tra scuola pubblica e scuola privata albanese; è uno dei motivi per cui le famiglie con figli in età scolare si stabiliscono nella capitale e comprano una casa vacanza sulla costa, e non il contrario.',
        tables: [
          {
            title: 'Scuola per i bambini stranieri',
            columns: ['Opzione', 'Regola o prezzo'],
            rows: [
              ['Scuola pubblica', 'Gratuita; aperta ai bambini stranieri; in albanese; obbligatoria dai 6 ai 16 anni'],
              ['Tirana International School (QSI)', 'Dai 2 ai 13 anni, inglese non richiesto; rette su richiesta'],
            ],
          },
        ],
      },
    ],
    faq: [
      {q: 'La sanità in Albania è gratuita per gli stranieri?', a: 'Il pronto soccorso nei casi di pericolo di vita è gratuito per tutti, visitatori compresi. Le altre cure sono gratuite solo per gli assicurati; un residente straniero può aderire volontariamente al sistema pubblico per circa 3.400 lek al mese dopo sei mesi di attesa.'},
      {q: 'Quanto costa l\'assicurazione sanitaria in Albania?', a: 'L\'assicurazione pubblica volontaria costa il 3,4% del doppio del salario minimo, 3.400 lek (circa 37 euro) al mese a persona nel 2026. Le polizze private hanno prezzi fissati da ciascun assicuratore; non abbiamo ancora un prezzo pubblicato.'},
      {q: 'Serve un\'assicurazione sanitaria per il permesso di soggiorno?', a: 'Per il permesso da nomade digitale sì, una polizza valida un anno; le liste per famiglia e pensionati chiedono una prova di assicurazione in Albania; il permesso per proprietari non la elenca.'},
      {q: 'Qual è il numero di emergenza in Albania?', a: 'Il 112 per legge, gratuito da qualsiasi telefono; anche il 127 è usato per l\'ambulanza.'},
      {q: 'I miei figli possono frequentare una scuola pubblica in Albania?', a: 'Sì, gratuitamente, in albanese; la frequenza è obbligatoria dai 6 ai 16 anni per ogni bambino residente nel paese.'},
    ],
    gaps: [
      'Prezzo annuo e copertura di una polizza sanitaria privata per stranieri (SIGAL, Intersig, Eurosig, Albsig) non trovati sulle pagine degli assicuratori.',
      'Prezzi di visite ed esami degli ospedali privati di Tirana (Spitali Amerikan, Hygeia, Salus) non pubblicati.',
      'Nessuna dichiarazione ufficiale sulla registrazione di un titolare di permesso straniero presso un medico di famiglia; dedotta dal testo della legge sui residenti.',
      'Le rette delle scuole internazionali di Tirana sono comunicate solo su richiesta; nessuna cifra ufficiale.',
    ],
    seoTitle: 'Sanità, assicurazione sanitaria e scuole in Albania per stranieri (2026)',
    seoDescription: 'Emergenze gratuite al 112; assicurazione pubblica volontaria 3.400 lek al mese con 6 mesi di attesa; quali permessi richiedono una polizza; scuole pubbliche gratuite in albanese, internazionali a Tirana dai 2 anni.',
  },
  {
    id: 'KB-SIM-INTERNET',
    locale: 'it',
    title: 'Quanto costano una SIM e internet a casa in Albania, e il roaming UE funziona?',
    summary:
      'Una SIM prepagata con 15 GB costa 1.600 lek (circa 17 euro) per 30 giorni da One Albania, o 10 GB allo stesso prezzo da Vodafone; un pacchetto turistico con 1 TB per 15 giorni costa 2.700 lek. La fibra a casa parte da 1.300 lek (14 euro) al mese per 100 Mbps e 1.900 lek per 1 Gbps con contratto di 12 o 24 mesi, più 1.500 lek di attivazione; la fibra arriva in 55 dei 61 comuni albanesi. L\'Albania non è ancora nell\'area UE "roam like at home" (i negoziati sono stati proposti a febbraio 2026), quindi una SIM dell\'UE qui paga il roaming; il roaming all\'interno dei Balcani occidentali è senza sovrapprezzi. Prezzi dalle pagine degli operatori del 24 ottobre 2026.',
    sections: [
      {
        heading: 'Mobile: pacchetti prepagati e SIM turistiche',
        body: 'Contano due reti: Vodafone Albania e One Albania (la fusione di One e ALBtelecom). Entrambe vendono SIM prepagate nei negozi e in aeroporto; per comprare una SIM serve un documento d\'identità, e l\'acquisto turistico online include una verifica dell\'identità, quindi portate il passaporto. I pacchetti più economici di Vodafone (GO, Run, Fly) si vendono solo tramite la sua app. One Albania vende anche piani in abbonamento con roaming UE incluso, da 1.500 lek al mese per 15 GB.',
        tables: [
          {
            title: 'Pacchetti mobili, ottobre 2026',
            columns: ['Operatore e pacchetto', 'Prezzo', 'Cosa include'],
            rows: [
              ['One LITE (prepagato, 30 giorni)', '600 lek', '500 MB, 50 minuti'],
              ['One GO+ (prepagato, 30 giorni)', '1.100 lek', '3 GB, 400 minuti'],
              ['One SMART+ (prepagato, 30 giorni)', '1.600 lek', '15 GB, 4.000 minuti'],
              ['One PREMIUM+ (prepagato, 30 giorni)', '2.200 lek', '35 GB, 4.000 minuti, 50 minuti internazionali'],
              ['Vodafone Run / Fly (prepagato, solo app)', '1.600 / 2.100 lek', '10 GB / 20 GB'],
              ['Vodafone Tourist Tera Pack', 'Da 2.700 lek (15 giorni) a 3.300 lek (30 giorni)', '1-1,2 TB, 1.000 minuti; il pacchetto da 30 giorni aggiunge 20 GB di roaming nei Balcani occidentali'],
              ['One EU START / SUPER / MAX (abbonamento)', '1.500 / 2.200 / 3.000 lek al mese', '15 / 50 / 100 GB con roaming UE'],
            ],
          },
        ],
      },
      {
        heading: 'Roaming con una SIM dell\'UE',
        body: 'L\'Albania è fuori dall\'area di roaming dell\'UE. A febbraio 2026 la Commissione europea ha proposto di aprire negoziati con l\'Albania e gli altri paesi dei Balcani occidentali per estendere a loro il "roam like at home", ma finché quegli accordi non saranno conclusi il vostro operatore UE applica qui la tariffa di roaming extra-UE. I Balcani occidentali (Albania, Kosovo, Macedonia del Nord, Montenegro, Serbia, Bosnia) sono in roaming senza sovrapprezzi dal 2021, ed è per questo che una SIM albanese funziona anche in un viaggio in Kosovo o Montenegro. Per un soggiorno di più di qualche giorno una SIM prepagata locale costa meno di qualunque pacchetto di roaming.',
        tables: [
          {
            title: 'Situazione del roaming, 2026',
            columns: ['Direzione', 'Stato'],
            rows: [
              ['SIM UE usata in Albania', 'Tariffe di roaming extra-UE; negoziati UE proposti il 25.02.2026, non conclusi'],
              ['SIM albanese nei Balcani occidentali', 'Nessun sovrapprezzo (limiti di uso corretto, es. 20 GB sul pacchetto turistico Vodafone)'],
              ['SIM albanese nell\'UE', 'I piani in abbonamento One Albania includono il roaming UE da 1.500 lek al mese'],
            ],
          },
        ],
      },
      {
        heading: 'Internet a casa',
        body: 'La fibra fino all\'appartamento è la norma negli edifici nuovi e in quasi tutte le città e località costiere; One Albania dichiara che la sua fibra raggiunge 55 dei 61 comuni e l\'89% delle linee fisse del paese era sopra i 30 Mbps a fine 2025. I contratti durano 12 o 24 mesi; il modem è gratuito e l\'attivazione costa 1.500 lek da One e Vodafone. Di solito l\'inquilino mantiene il contratto del proprietario e paga la bolletta; un nuovo contratto si firma in negozio con passaporto e indirizzo. Dove la fibra non è arrivata, nei villaggi e in alcuni complessi sul mare, Starlink costa circa 82 dollari al mese più il kit.',
        tables: [
          {
            title: 'Offerte fibra per la casa, ottobre 2026 (lek al mese)',
            columns: ['Operatore', '100 Mbps', '300-500 Mbps', '1 Gbps', 'Condizioni'],
            rows: [
              ['One Ultra Fiber', '1.300', '1.600 (300 Mbps)', '1.900', '12 o 24 mesi; attivazione 1.500; modem gratuito'],
              ['Digicom', '-', '1.390 (500 Mbps)', '1.690', 'Durata del contratto non indicata'],
              ['Tring', '1.290 listino / 1.090 promo', '1.590 (300) / 1.790 (500)', '2.090', 'Modem incluso'],
              ['Vodafone GigaFibra con TV famiglia', '2.300', '2.500 (300 Mbps)', '2.800', '24 mesi; attivazione 1.500'],
              ['Starlink (senza fibra)', '-', '-', '-', 'Circa 82 dollari al mese più il kit'],
            ],
          },
        ],
      },
    ],
    faq: [
      {q: 'Quanto costa una SIM in Albania?', a: 'Si paga il pacchetto: 1.600 lek (circa 17 euro) per 15 GB e 4.000 minuti per 30 giorni da One Albania, 1.100 lek per 3 GB; un pacchetto turistico Vodafone con 1 TB costa 2.700 lek per 15 giorni.'},
      {q: 'Il mio piano telefonico UE funziona in Albania senza costi di roaming?', a: 'No. L\'Albania non è ancora nell\'area di roaming UE; i negoziati sono stati proposti a febbraio 2026. Per più di un fine settimana comprate una SIM prepagata locale.'},
      {q: 'Quanto costa internet a casa in Albania?', a: '1.300 lek (circa 14 euro) al mese per la fibra a 100 Mbps da One Albania, 1.900 lek per 1 Gbps, più 1.500 lek di attivazione; i pacchetti Vodafone con TV costano 2.300-2.800 lek.'},
      {q: 'Serve un permesso di soggiorno per una SIM o per internet?', a: 'Per una SIM prepagata basta il passaporto (è richiesta una verifica dell\'identità). I contratti per la casa si firmano con passaporto e indirizzo; di solito l\'inquilino mantiene il contratto del proprietario.'},
      {q: 'C\'è il 5G in Albania?', a: 'Entrambi gli operatori pubblicizzano il 5G nelle città; le cifre di copertura non sono pubblicate. Fibra e 4G coprono le esigenze quotidiane sulla costa.'},
    ],
    gaps: [
      'Il testo di legge sulla registrazione della SIM con documento d\'identità (regolamento AKEP) e se il passaporto basti per gli stranieri non sono stati trovati; dedotto dalla verifica dell\'identità degli operatori.',
      'Prezzo della SIM in sé non mostrato sulle pagine degli operatori.',
      'Dati di copertura 5G (AKEP) non documentati.',
    ],
    seoTitle: 'SIM e internet in Albania (2026): prezzi prepagati, fibra, roaming UE',
    seoDescription: '15 GB prepagati per 1.600 lek, pacchetto turistico 1 TB per 2.700 lek; fibra da 1.300 lek al mese per 100 Mbps, 1.900 per 1 Gbps. L\'Albania è fuori dal roaming UE; il roaming nei Balcani occidentali è gratuito.',
  },
  {
    id: 'KB-DRIVING-LICENCE',
    locale: 'it',
    title: 'Si può guidare in Albania con la patente straniera, e come si converte in una patente albanese?',
    summary:
      'Sì, per il primo anno: una patente straniera o internazionale vale finché non si è residenti in Albania da più di un anno (Codice della strada art. 133); il governo britannico indica gli stessi 12 mesi per le patenti UE e del Regno Unito. Dopo si converte alla DPSHTRR senza esame se è stata rilasciata da uno Stato UE, dagli Stati Uniti, dal Canada o da un paese con accordo bilaterale (Italia, Germania, Grecia, Kosovo, Macedonia del Nord, Montenegro, Serbia, Turchia e altri), per 4.000 + 4.500 lek (circa 92 euro), con traduzioni autenticate e certificato medico; serve un permesso di soggiorno valido più di un anno. Il carburante ha un prezzo massimo fissato dallo Stato più volte a settimana: 213 lek al litro il gasolio e 190 la benzina il 14 ottobre 2026.',
    sections: [
      {
        heading: 'Per quanto tempo vale la vostra patente',
        body: 'Il Codice della strada consente a chi ha una patente straniera o internazionale di guidare i veicoli che essa copre finché non è residente in Albania da più di un anno. Una patente che non segue il formato internazionale ha bisogno di una traduzione ufficiale in albanese; una patente internazionale rilasciata nel paese d\'origine lo evita. Una volta ottenuto il permesso di soggiorno e superato l\'anno, la patente straniera non vale più per voi in Albania, nemmeno con la patente internazionale, e serve quella albanese. I visitatori senza residenza continuano a guidare con la patente di casa.',
        tables: [
          {
            title: 'Patenti straniere in Albania',
            columns: ['Situazione', 'Regola'],
            rows: [
              ['Visitatore o residente da meno di un anno', 'Patente straniera o internazionale valida; traduzione se non in formato internazionale'],
              ['Patenti UE e britanniche (GOV.UK)', 'Utilizzabili fino a 12 mesi; nessun esame di guida per la conversione'],
              ['Residente da più di un anno', 'Patente albanese obbligatoria; conversione alla DPSHTRR'],
              ['Patente internazionale albanese', '1.000 lek, valida 3 anni, per viaggi nei paesi della Convenzione di Vienna 1968'],
            ],
          },
        ],
      },
      {
        heading: 'Convertire la patente alla DPSHTRR',
        body: 'La conversione si fa all\'ufficio regionale dei trasporti (DRSHTRR) e costa 4.000 lek per la pratica e la verifica più 4.500 lek per la conversione stessa, circa 92 euro in totale. Le patenti degli Stati UE, degli Stati Uniti e del Canada, e dei paesi con accordi bilaterali di riconoscimento, si convertono senza esame di teoria o di guida; la lista DPSHTRR nomina Italia, Kosovo, Macedonia del Nord, Croazia, Montenegro, Grecia, Serbia, Germania, Moldavia, Turchia, Qatar, Emirati Arabi Uniti, Arabia Saudita e Corea del Sud. Il Regno Unito non è nella lista anche se GOV.UK dice che non serve l\'esame; verificate con la DRSHTRR prima di farci affidamento. Si consegna la patente originale, che viene rispedita al paese che l\'ha rilasciata.\n\nPortate: traduzione autenticata del passaporto e del permesso di soggiorno (valido più di un anno), copia tradotta e autenticata della patente, certificato medico non più vecchio di sei mesi e, per le patenti statunitensi e canadesi, una lettera di verifica apostillata dell\'autorità che l\'ha rilasciata. A Tirana la patente albanese si rilascia in giornata; altrove entro tre giorni lavorativi.',
        tables: [
          {
            title: 'Conversione della patente, 2026',
            columns: ['Voce', 'Dettaglio'],
            rows: [
              ['Costi', '4.000 lek (pratica) + 4.500 lek (conversione), circa 92 euro'],
              ['Chi non fa l\'esame', 'Stati UE, USA, Canada, e Italia, Germania, Grecia, Kosovo, Macedonia del Nord, Croazia, Montenegro, Serbia, Moldavia, Turchia, Qatar, EAU, Arabia Saudita, Corea del Sud'],
              ['Condizione', 'Permesso di soggiorno albanese valido più di 1 anno'],
              ['Documenti', 'Traduzioni autenticate di passaporto, permesso e patente; certificato medico entro 6 mesi; lettera di verifica apostillata per patenti USA e canadesi'],
              ['Rilascio', 'In giornata a Tirana, entro 3 giorni lavorativi altrove'],
            ],
          },
        ],
      },
      {
        heading: 'Carburante, distanze e dove serve l\'auto',
        body: 'I prezzi alla pompa hanno un tetto fissato dal Consiglio di trasparenza e cambiano con il prezzo del petrolio, spesso più volte a settimana; a metà ottobre 2026 il gasolio era a 213 lek al litro (circa 2,31 euro) e la benzina a 190 lek (2,06 euro), più che in gran parte dell\'UE. Le distanze sono brevi: 45 km dall\'aeroporto di Tirana a Durazzo, 155 km a Valona, 285 km a Saranda. A Durazzo, Valona e Saranda si può vivere senza auto; un appartamento con posto auto conta soprattutto d\'estate, quando le strade sul mare si riempiono.',
        tables: [
          {
            title: 'Costi di guida e distanze',
            columns: ['Voce', 'Valore'],
            rows: [
              ['Tetto gasolio / benzina, 14.10.2026', '213 / 190 lek al litro (2,31 / 2,06 euro)'],
              ['Aeroporto di Tirana - Durazzo / Valona / Saranda', '45 km / 155 km / 285 km'],
              ['Autobus interurbano invece dell\'auto', 'Tirana-Durazzo 235 lek, Tirana-Valona 700 lek'],
            ],
          },
        ],
      },
    ],
    faq: [
      {q: 'Posso guidare in Albania con la patente italiana o UE?', a: 'Sì, finché non siete residenti da più di un anno (12 mesi secondo GOV.UK). Dopo serve la patente albanese.'},
      {q: 'Devo fare l\'esame di guida per ottenere la patente albanese?', a: 'No, se la patente è di uno Stato UE, degli USA, del Canada o di un paese nella lista di accordi della DPSHTRR; la patente si converte per 4.000 + 4.500 lek.'},
      {q: 'Quali documenti servono per convertire la patente?', a: 'Traduzioni autenticate di passaporto, permesso di soggiorno (valido oltre un anno) e patente, certificato medico non più vecchio di sei mesi e, per patenti USA e canadesi, una lettera di verifica apostillata.'},
      {q: 'Basta la patente internazionale in Albania?', a: 'Per i visitatori e il primo anno di residenza sì; non sostituisce la patente albanese una volta che si vive qui da più di un anno.'},
      {q: 'Quanto costa il carburante in Albania?', a: 'Tetto a 213 lek al litro per il gasolio e 190 lek per la benzina il 14 ottobre 2026, circa 2,31 e 2,06 euro; i tetti cambiano più volte a settimana.'},
    ],
    gaps: [
      'Patenti britanniche: GOV.UK dice che non serve l\'esame, la lista DPSHTRR omette il Regno Unito; da confermare con la DRSHTRR.',
      'Le modifiche di agosto 2026 al Codice della strada non sono state verificate rispetto all\'art. 133.',
      'Costo dell\'assicurazione auto obbligatoria (RC) per un residente non documentato.',
    ],
    seoTitle: 'Guidare in Albania con la patente straniera (2026): validità, conversione alla DPSHTRR, costi',
    seoDescription: 'Le patenti straniere valgono per il primo anno di residenza; poi conversione senza esame per patenti UE, USA, canadesi e dei paesi in lista per 4.000 + 4.500 lek con traduzioni autenticate. Tetto carburante e distanze.',
  },
  {
    id: 'KB-PROS-CONS',
    locale: 'it',
    title: 'Quali sono i pro e i contro di vivere in Albania?',
    summary:
      'A favore: costi fissi bassi (circa 650 euro al mese per una persona in affitto a Durazzo), ingresso facile (90 giorni senza visto per cittadini UE, britannici e israeliani, un anno per gli americani, nessun permesso per gli ucraini fino a marzo 2027), un permesso annuale rinnovabile per chi compra un appartamento, inverni miti sulla costa, fibra veloce ed economica, carte accettate nelle città e bonifici in euro via SEPA da ottobre 2025. Contro: affitti a Tirana in crescita dell\'8-12% all\'anno, sei mesi di attesa prima che l\'assicurazione sanitaria pubblica paghi, ancora niente roaming UE, un solo aeroporto funzionante, nessun treno passeggeri, carburante a 2,06-2,31 euro al litro, appartamenti estivi costruiti senza riscaldamento e un boom edilizio che rende indispensabile controllare le carte di un edificio. Le cifre qui sotto vengono dalle pagine con fonti di questa base di conoscenza.',
    sections: [
      {
        heading: 'Cosa gioca a favore dell\'Albania',
        body: '- I soldi rendono di più. Una persona che affitta un bilocale spende circa 650 euro al mese a Durazzo e 865 euro a Tirana tra affitto, bollette, internet, telefono, cibo e assicurazione; un appartamento sulla spiaggia di Durazzo si vende a circa 1.500 euro al metro quadro e comprare costa circa il 2,5% di spese.\n- Entrare è semplice. I cittadini di UE, Regno Unito e Israele restano 90 giorni su 180 senza visto, gli americani un anno, gli ucraini non hanno bisogno né di visto né di permesso fino al 30 marzo 2027. Possedere un appartamento dà diritto a un permesso di soggiorno annuale rinnovabile senza valore minimo.\n- Il clima sulla costa. Valona e Saranda hanno gli inverni più caldi del paese e una stagione balneare da giugno a ottobre; Durazzo è mite e umida.\n- Infrastrutture dove contano. Fibra a 1.300 lek al mese per 100 Mbps, 89% delle linee fisse sopra i 30 Mbps, carte accettate in negozi e ristoranti nelle città, e bonifici in euro da una banca UE come normali pagamenti SEPA.\n- Le reti di sicurezza esistono. Il pronto soccorso è gratuito per chiunque in pericolo di vita, le scuole pubbliche sono gratuite e aperte ai bambini stranieri, e un residente straniero può aderire volontariamente all\'assicurazione sanitaria pubblica per circa 3.400 lek al mese.',
        tables: [
          {
            title: 'I vantaggi, con le cifre',
            columns: ['Vantaggio', 'Cifra'],
            rows: [
              ['Costi fissi mensili, una persona in affitto in un 1+1', 'Circa 650 euro a Durazzo, 865 euro a Tirana'],
              ['Soggiorno senza visto', '90 giorni per UE, Regno Unito, Israele; 1 anno per i cittadini USA; ucraini senza visto né permesso fino al 30.03.2027'],
              ['Permesso di soggiorno per proprietari di immobili', '1 anno, rinnovabile, nessun valore minimo (legge 79/2021 art. 84)'],
              ['Costi di acquisto', 'Circa 2,5% del prezzo; nessuna imposta di trasferimento sugli appartamenti'],
              ['Fibra a casa', '1.300 lek al mese per 100 Mbps; 89% delle linee sopra i 30 Mbps'],
              ['Carte e bonifici', '67% dei pagamenti bancari con carta; SEPA attiva dal 7.10.2025'],
              ['Assicurazione sanitaria pubblica, volontaria', '3.400 lek al mese a persona'],
            ],
          },
        ],
      },
      {
        heading: 'Cosa mette in difficoltà',
        body: '- Affitti e prezzi salgono in fretta dove gli stranieri vogliono vivere. I canoni richiesti sono cresciuti dell\'8-12% nel 2025-2026 e un 1+1 a Tirana è passato da 400 a 590 euro in quattro anni; i prezzi delle case a livello nazionale a fine 2025 erano del 28% più alti di un anno prima. Economico è relativo all\'Europa occidentale, non al 2020.\n- La sanità va pianificata. Il sistema pubblico paga solo sei mesi dopo l\'adesione; prima, e per le cliniche private, si paga o si ha una polizza privata. Le cure specialistiche per qualcosa di serio significano Tirana o un viaggio all\'estero.\n- Spostarsi. Un solo aeroporto internazionale funzionante, l\'aeroporto di Valona bloccato in una disputa sulla concessione, nessun treno passeggeri finché non riapre la linea Tirana-Durazzo (prevista per fine 2027), carburante a 190-213 lek al litro e autobus frequenti ma senza orari pubblicati.\n- Gli inverni non sono quello che promette l\'estate. Tirana è il posto più freddo e più caldo del paese; molti appartamenti costieri sono stati costruiti per gli affitti estivi e non hanno riscaldamento; le località di mare sono vuote da novembre ad aprile.\n- Telefono e burocrazia. Niente roaming UE per ora, documenti tradotti e apostillati per ogni permesso, 30 giorni di tempo per presentare la domanda dopo l\'arrivo e una registrazione dell\'indirizzo che, se saltata, annulla il permesso.\n- La qualità degli edifici varia. Centinaia di migliaia di edifici sono passati per la legalizzazione e quelli nuovi sorgono in fretta; controllare atti di proprietà, permesso e costruttore prima di pagare non è facoltativo.',
        tables: [
          {
            title: 'Gli svantaggi, con le cifre',
            columns: ['Svantaggio', 'Cifra'],
            rows: [
              ['Crescita degli affitti', '+8-12% canoni richiesti 2025-2026; 1+1 a Tirana da 400 a 590 euro in quattro anni'],
              ['Prezzi delle case', '+28% in un anno a fine 2025 (indice della Banca d\'Albania)'],
              ['Assicurazione sanitaria pubblica', '6 mesi di attesa per gli aderenti volontari'],
              ['Trasporti', 'Aeroporto di Valona non operativo; treni di nuovo a fine 2027 al più presto'],
              ['Carburante', '190-213 lek al litro (2,06-2,31 euro), ottobre 2026'],
              ['Clima', 'Tirana con le estati più calde (35 °C e oltre) e gli inverni più freddi; appartamenti a Saranda spesso senza riscaldamento'],
              ['Roaming', 'Fuori dall\'area di roaming UE; negoziati proposti a febbraio 2026'],
              ['Scadenze del permesso', 'Domanda entro 30 giorni dall\'ingresso; registrazione dell\'indirizzo entro 30 giorni o il permesso è annullato'],
              ['Edifici legalizzati', '291.114 decisioni di legalizzazione entro il 2025; 26.101 solo nel 2025'],
            ],
          },
        ],
      },
      {
        heading: 'A chi conviene',
        body: 'L\'Albania funziona meglio per chi ha un reddito da altrove: pensionati italiani, tedeschi o polacchi, lavoratori remoti con permesso da nomade digitale, famiglie che dividono l\'anno tra una città europea e la costa, e acquirenti che vogliono un appartamento sul mare al prezzo di un posto auto a casa loro. Funziona meno per chi ha bisogno di uno stipendio locale (lo stipendio medio lordo è di circa 1.000 euro al mese), di cure specialistiche vicine o di una scuola in inglese fuori Tirana.\n\nLa prova pratica è un inverno: affittate un appartamento da ottobre a maggio, con riscaldamento, e vedete se la città vi va ancora bene. Le nostre pagine su dove vivere, affitti a lungo termine e costo della vita danno le cifre; gli annunci mostrano cosa compra la stessa somma in ogni città.',
      },
    ],
    faq: [
      {q: 'L\'Albania è un buon posto dove vivere per gli stranieri?', a: 'Per chi ha un reddito dall\'estero sì: costi fissi bassi, ingresso facile, un permesso per i proprietari di immobili e inverni miti sulla costa. I compromessi sono affitti in crescita, sei mesi di attesa per l\'assicurazione sanitaria pubblica, niente roaming UE e trasporti limitati.'},
      {q: 'La vita in Albania è economica?', a: 'I costi fissi per una persona che affitta un 1+1 sono circa 650 euro al mese a Durazzo e 865 euro a Tirana ai prezzi di ottobre 2026; lo stipendio medio lordo locale è di circa 1.000 euro.'},
      {q: 'L\'Albania è sicura per viverci?', a: 'Il pronto soccorso è gratuito per chiunque in pericolo di vita e gli stranieri si stabiliscono nelle città e sulla costa senza precauzioni particolari; i rischi che le persone incontrano davvero sono nella burocrazia e nella qualità degli edifici, non nella sicurezza personale, quindi controllate le carte di ogni immobile.'},
      {q: 'Qual è il più grande svantaggio di vivere in Albania?', a: 'La distanza dai servizi specialistici: un solo aeroporto, nessun treno, Tirana per la sanità seria e le scuole internazionali, e sei mesi di attesa prima che l\'assicurazione pubblica paghi.'},
      {q: 'Posso vivere in Albania senza parlare albanese?', a: 'A Tirana e nelle località costiere inglese e italiano bastano per la vita quotidiana; contratti, permessi e scuole pubbliche sono in albanese, quindi mettete in conto le traduzioni.'},
    ],
    gaps: [
      'Nessuna statistica con fonte su criminalità o sicurezza (INSTAT, polizia) per ora.',
      'Dati su qualità dell\'aria e dell\'acqua per Tirana e la costa non documentati.',
      'Numero di residenti stranieri per nazionalità (INSTAT o direzione migrazione) non documentato.',
    ],
    seoTitle: 'Vivere in Albania: pro e contro con le cifre (2026)',
    seoDescription: 'Costi bassi (circa 650 euro al mese a Durazzo), ingresso facile, permesso per i proprietari e inverni miti contro affitti in crescita, 6 mesi di attesa per la sanità pubblica, niente roaming UE e un solo aeroporto. Con fonti.',
  },
  // ------------------------------------------------------------- German ---
  {
    id: 'KB-DRIVING-LICENCE',
    locale: 'de',
    title: 'Darf man in Albanien mit dem ausländischen Führerschein fahren, und wie tauscht man ihn in einen albanischen um?',
    summary:
      'Ja, im ersten Jahr: Ein ausländischer oder internationaler Führerschein gilt, bis man länger als ein Jahr in Albanien ansässig ist (Straßenverkehrsgesetz Art. 133); GOV.UK nennt für britische und EU-Führerscheine dieselben 12 Monate. Danach tauscht man ihn bei der DPSHTRR ohne Prüfung um, wenn er von einem EU-Staat, den USA, Kanada oder einem Land mit bilateralem Abkommen (Deutschland, Italien, Griechenland, Kosovo, Nordmazedonien, Montenegro, Serbien, Türkei und andere) ausgestellt wurde, für 4.000 + 4.500 Lek (etwa 92 Euro), mit beglaubigten Übersetzungen und ärztlichem Attest; nötig ist eine Aufenthaltsgenehmigung mit mehr als einem Jahr Laufzeit. Der Kraftstoffpreis wird vom Staat mehrmals pro Woche gedeckelt: 213 Lek je Liter Diesel und 190 Lek Benzin am 14. Oktober 2026.',
    sections: [
      {
        heading: 'Wie lange Ihr Führerschein gilt',
        body: 'Das Straßenverkehrsgesetz erlaubt Inhabern eines ausländischen oder internationalen Führerscheins, die darin eingetragenen Fahrzeuge zu führen, solange sie nicht länger als ein Jahr in Albanien ansässig sind. Ein Führerschein, der nicht dem internationalen Format entspricht, braucht eine amtliche albanische Übersetzung; ein internationaler Führerschein aus der Heimat erspart das. Sobald Sie eine Aufenthaltsgenehmigung haben und das Jahr vorbei ist, gilt der ausländische Führerschein für Sie in Albanien nicht mehr, auch nicht mit internationalem Führerschein, und ein albanischer ist Pflicht. Besucher ohne Wohnsitz fahren weiter mit ihrem heimischen Führerschein.',
        tables: [
          {
            title: 'Ausländische Führerscheine in Albanien',
            columns: ['Situation', 'Regel'],
            rows: [
              ['Besucher oder weniger als ein Jahr ansässig', 'Ausländischer oder internationaler Führerschein gültig; Übersetzung, wenn nicht im internationalen Format'],
              ['Britische und EU-Führerscheine (GOV.UK)', 'Bis zu 12 Monate nutzbar; keine Fahrprüfung beim Umtausch'],
              ['Länger als ein Jahr ansässig', 'Albanischer Führerschein nötig; Umtausch bei der DPSHTRR'],
              ['Albanischer internationaler Führerschein', '1.000 Lek, 3 Jahre gültig, für Reisen in Staaten des Wiener Übereinkommens 1968'],
            ],
          },
        ],
      },
      {
        heading: 'Umtausch bei der DPSHTRR',
        body: 'Der Umtausch erfolgt bei der regionalen Verkehrsbehörde (DRSHTRR) und kostet 4.000 Lek für Antrag und Prüfung plus 4.500 Lek für den Umtausch selbst, zusammen etwa 92 Euro. Führerscheine aus EU-Staaten, den USA und Kanada sowie aus Ländern mit bilateralen Anerkennungsabkommen werden ohne Theorie- oder Fahrprüfung umgetauscht; die DPSHTRR-Liste nennt Italien, Kosovo, Nordmazedonien, Kroatien, Montenegro, Griechenland, Serbien, Deutschland, Moldau, Türkei, Katar, die Emirate, Saudi-Arabien und Südkorea. Das Vereinigte Königreich steht nicht auf der Liste, obwohl GOV.UK schreibt, dass keine Prüfung nötig sei; fragen Sie bei der DRSHTRR nach, bevor Sie sich darauf verlassen. Der Originalführerschein wird abgegeben und an das Ausstellungsland zurückgeschickt.\n\nMitzubringen: beglaubigte Übersetzung von Reisepass und Aufenthaltsgenehmigung (länger als ein Jahr gültig), beglaubigte übersetzte Kopie des Führerscheins, ein ärztliches Attest, das nicht älter als sechs Monate ist, und für US- und kanadische Führerscheine ein apostilliertes Bestätigungsschreiben der ausstellenden Behörde. In Tirana wird der albanische Führerschein am selben Tag ausgestellt, anderswo innerhalb von drei Werktagen.',
        tables: [
          {
            title: 'Führerscheinumtausch 2026',
            columns: ['Punkt', 'Detail'],
            rows: [
              ['Gebühren', '4.000 Lek (Antrag) + 4.500 Lek (Umtausch), etwa 92 Euro'],
              ['Wer keine Prüfung braucht', 'EU-Staaten, USA, Kanada sowie Italien, Deutschland, Griechenland, Kosovo, Nordmazedonien, Kroatien, Montenegro, Serbien, Moldau, Türkei, Katar, VAE, Saudi-Arabien, Südkorea'],
              ['Voraussetzung', 'Albanische Aufenthaltsgenehmigung mit mehr als 1 Jahr Laufzeit'],
              ['Unterlagen', 'Beglaubigte Übersetzungen von Pass, Genehmigung und Führerschein; ärztliches Attest unter 6 Monaten; apostilliertes Bestätigungsschreiben für US- und kanadische Führerscheine'],
              ['Ausstellung', 'Am selben Tag in Tirana, innerhalb von 3 Werktagen anderswo'],
            ],
          },
        ],
      },
      {
        heading: 'Kraftstoff, Entfernungen und wo man ein Auto braucht',
        body: 'Die Preise an der Zapfsäule werden vom Transparenzrat gedeckelt und ändern sich mit dem Ölpreis, oft mehrmals pro Woche; Mitte Oktober 2026 lag der Deckel für Diesel bei 213 Lek je Liter (etwa 2,31 Euro) und für Benzin bei 190 Lek (2,06 Euro), mehr als in den meisten EU-Ländern. Die Entfernungen sind kurz: 45 km vom Flughafen Tirana nach Durrës, 155 km nach Vlorë, 285 km nach Sarandë. In Durrës, Vlorë und Sarandë lebt man ohne Auto; eine Wohnung mit Stellplatz zählt vor allem im Sommer, wenn sich die Straßen am Meer füllen.',
        tables: [
          {
            title: 'Fahrkosten und Entfernungen',
            columns: ['Punkt', 'Wert'],
            rows: [
              ['Deckel Diesel / Benzin, 14.10.2026', '213 / 190 Lek je Liter (2,31 / 2,06 Euro)'],
              ['Flughafen Tirana nach Durrës / Vlorë / Sarandë', '45 km / 155 km / 285 km'],
              ['Überlandbus statt Auto', 'Tirana-Durrës 235 Lek, Tirana-Vlorë 700 Lek'],
            ],
          },
        ],
      },
    ],
    faq: [
      {q: 'Darf ich in Albanien mit einem deutschen oder EU-Führerschein fahren?', a: 'Ja, bis Sie länger als ein Jahr ansässig sind (12 Monate laut GOV.UK). Danach brauchen Sie einen albanischen Führerschein.'},
      {q: 'Muss ich eine Fahrprüfung ablegen, um den albanischen Führerschein zu bekommen?', a: 'Nicht, wenn Ihr Führerschein aus einem EU-Staat, den USA, Kanada oder einem Land auf der Abkommensliste der DPSHTRR stammt; er wird für 4.000 + 4.500 Lek umgetauscht.'},
      {q: 'Welche Unterlagen brauche ich für den Umtausch?', a: 'Beglaubigte Übersetzungen von Pass, Aufenthaltsgenehmigung (über ein Jahr gültig) und Führerschein, ein ärztliches Attest unter sechs Monaten und für US- und kanadische Führerscheine ein apostilliertes Bestätigungsschreiben.'},
      {q: 'Reicht ein internationaler Führerschein in Albanien?', a: 'Für Besucher und das erste Jahr des Aufenthalts ja; er ersetzt den albanischen Führerschein nicht, sobald Sie länger als ein Jahr hier leben.'},
      {q: 'Was kostet Kraftstoff in Albanien?', a: 'Am 14. Oktober 2026 gedeckelt auf 213 Lek je Liter Diesel und 190 Lek Benzin, etwa 2,31 und 2,06 Euro; die Deckel ändern sich mehrmals pro Woche.'},
    ],
    gaps: [
      'Britische Führerscheine: GOV.UK sagt, keine Prüfung nötig, die DPSHTRR-Liste nennt das Vereinigte Königreich nicht; mit der DRSHTRR zu klären.',
      'Die Änderungen des Straßenverkehrsgesetzes vom August 2026 wurden nicht gegen Art. 133 geprüft.',
      'Kosten der Kfz-Haftpflicht (TPL) für einen Ansässigen nicht belegt.',
    ],
    seoTitle: 'Autofahren in Albanien mit ausländischem Führerschein (2026): Gültigkeit, Umtausch bei der DPSHTRR, Gebühren',
    seoDescription: 'Ausländische Führerscheine gelten im ersten Jahr des Aufenthalts; danach Umtausch ohne Prüfung für EU-, US-, kanadische und gelistete Führerscheine für 4.000 + 4.500 Lek mit beglaubigten Übersetzungen. Kraftstoffdeckel und Entfernungen.',
  },
  {
    id: 'KB-HOLIDAY-COSTS',
    locale: 'de',
    title: 'Welche albanische Küste passt für den Urlaub, wann fährt man, und was kostet eine Woche?',
    summary:
      'Der Norden und die Mitte (Velipojë, Shëngjin, Durrës, Golem) haben lange Sandstrände, flaches Wasser und die niedrigsten Preise; der Süden (Vlorë, Dhërmi, Himarë, Sarandë, Ksamil) hat Kiesbuchten, klareres Wasser und die wärmste, längste Saison, zu höheren Preisen und drei bis vier Stunden weiter vom Flughafen Tirana. Sieben Nächte in einer gemieteten Wohnung kosten zum durchschnittlichen Angebotspreis im Juli und August etwa 630 US-Dollar in Durrës und 805 in Sarandë, in der Nebensaison 430-500 und 640 (AirROI, 2025-2026), plus Reinigungsgebühr und örtliche Übernachtungssteuer. Die Saison läuft an der ganzen Küste von Juni bis Mitte September; in Sarandë und Vlorë kann man bis in den Oktober baden.',
    sections: [
      {
        heading: 'Norden und Mitte gegen Süden',
        body: 'Albanien hat zwei Küsten. Die Adria von der montenegrinischen Grenze bis Vlorë ist flach und sandig: Velipojë und Shëngjin im Norden, dann der 10 km lange Strand von Durrës und Golem, das nächste Meer von Tirana aus (45 km vom Flughafen). Das Wasser ist flach und wird früh warm, was Familien mit kleinen Kindern entgegenkommt; hier machen die meisten Albaner und die meisten Domlivo-Käufer Urlaub, Wohnungen gibt es reichlich und so günstig wie nirgends an der Küste. Das Ionische Meer südlich von Vlorë ist die Riviera: Berge, die in Kiesbuchten bei Dhërmi, Jala und Himarë abfallen, dann Sarandë gegenüber von Korfu und die weißen Strände von Ksamil. Das Wasser ist klarer und die Saison länger, aber die Straße ist langsamer, die Preise sind höher und die Dörfer sind von November bis April still.\n\nTirana selbst ist ein Städtetrip, kein Strand: die günstigsten Ferienwohnungen des Landes, am besten im Frühling und Herbst, mit der Küste eine Busstunde entfernt.',
        tables: [
          {
            title: 'Die Orte im Vergleich',
            columns: ['Ort', 'Strand', 'Vom Flughafen Tirana', 'Winter', 'Passt für'],
            rows: [
              ['Shëngjin', 'Langer Sandstrand, Pinienwald bei Rana e Hedhur', 'Etwa 90 km, Taxi 70-75 Euro bis Shkodër', 'Kühlster Küstenwinter', 'Günstigste Wohnungen am Meer, Familien'],
              ['Durrës und Golem', 'Sandig, flach, 10 km Strand', '45 km, Bus 600 Lek, Taxi 30 Euro', 'Mild, feucht; Meer 14 °C', 'Leichte Anreise, lange Aufenthalte, die meisten Wohnungen zum Mieten und Kaufen'],
              ['Vlorë', 'Stadtstrände sandig, Kies südlich von Uji i Ftohtë', '155 km, Taxi 105-110 Euro', 'Warm (Dez-Feb kurz)', 'Stadt und Riviera an einem Ort'],
              ['Sarandë und Ksamil', 'Kiesbuchten, weißer Sand in Ksamil, Fähre nach Korfu', '285 km, Taxi 200 Euro, etwa 3,5 Stunden', 'Am wärmsten; viele Wohnungen ohne Heizung', 'Die Riviera, die längste Saison'],
            ],
            methodology: 'Klimaangaben sind Schätzungen (siehe Klimafakten); Entfernungen und Preise aus der Taxiliste des Flughafens und der Busseite des Flughafens.',
          },
        ],
      },
      {
        heading: 'Wann fahren',
        body: 'Juli und August sind überall voll und heiß, mit 35 °C in Tirana und den Stränden auf dem Höhepunkt von Andrang und Preisen. Juni und September sind die besten Monate an der ganzen Küste: warmes Meer, halb so viele Menschen, Mietpreise 20-30 % unter der Spitze. Im Süden badet man bis in den Oktober. Von November bis April sind die Küstenorte still, Flüge und Wohnungen billig, und in dieser Zeit kommen Käufer, um Immobilien zu besichtigen; wer in Albanien überwintern will, sollte prüfen, ob die Wohnung eine Heizung hat, denn viele wurden für die Sommervermietung gebaut. Das Angebot an Ferienwohnungen hat sich seit 2020 verfünffacht, außerhalb des Augusts gibt es also immer Auswahl.',
        tables: [
          {
            title: 'Durchschnittlicher Nachtpreis von Ferienwohnungen, USD (AirROI, Aug 2025 - Jul 2026)',
            columns: ['Ort', 'Hochsaison (Jul-Sep oder Jun-Aug)', 'Nebensaison', 'Nachsaison'],
            rows: [
              ['Sarandë', '115', '91', 'Jan, Nov, Dez: Auslastung 26 %'],
              ['Ksamil', '111', '91', 'Jan, Nov, Dez: Auslastung 21 %'],
              ['Durrës', '90', '72', '62 (Dez-Feb)'],
              ['Vlorë', '85', '68', '61 (Dez-Feb)'],
              ['Tirana', '63 (August)', '-', '56 (Januar)'],
              ['Durrës und Vlorë, Durchschnitt Juni 2026', 'Etwa 75-76 Euro', '-', '-'],
            ],
            methodology: 'Durchschnitte der angebotenen Nachtpreise auf Airbnb-ähnlichen Plattformen, keine Hotelpreise; eine Zweischlafzimmerwohnung am Strand kostet mehr als der Durchschnitt, ein Studio im Hinterland weniger.',
          },
        ],
      },
      {
        heading: 'Was eine Woche kostet',
        body: 'Für zwei Personen in einer gemieteten Wohnung kosten sieben Nächte zum durchschnittlichen Angebotspreis in der Hochsaison etwa 630 US-Dollar in Durrës und 805 in Sarandë, im Juni oder September 500 und 640. Dazu kommen die Reinigungsgebühr, im Schnitt 14 Dollar in Tirana und 31 in Sarandë, und die kommunale Übernachtungssteuer, die der Gastgeber einzieht: 140 Lek je Nacht und Person in Pensionen und Wohnungen in Tirana, 70 Lek in Vlorë. Anreise: der Flughafenbus nach Durrës kostet 600 Lek, ein Taxi 30 Euro; nach Sarandë kostet das Taxi 200 Euro oder der Bus etwa 1.220 Lek. Wer einen Monat statt einer Woche bleibt, mietet monatlich: eine 1+1 am Strand von Durrës wird im Sommer für 400-600 Euro im Monat angeboten, weniger als zwei Wochen zu Nachtpreisen.\n\nWer jeden Sommer wiederkommt: Die Wohnungen in diesen Orten werden ab den Preisen verkauft, die unser Index für jede Stadt zeigt, und eine Wohnung, die man einen Monat selbst nutzt und den Rest der Saison vermietet, trägt ihre Nebenkosten; die Seite "Mieten oder kaufen" rechnet es vor.',
        tables: [
          {
            title: 'Eine Woche für zwei in einer gemieteten Wohnung, 2026',
            columns: ['Posten', 'Durrës', 'Sarandë'],
            rows: [
              ['7 Nächte, Hochsaison (durchschnittlicher Angebotspreis)', 'Etwa 630 USD', 'Etwa 805 USD'],
              ['7 Nächte, Juni oder September', 'Etwa 500 USD', 'Etwa 640 USD'],
              ['Reinigungsgebühr (Durchschnitt je Aufenthalt)', '14-31 USD je nach Ort', '31 USD im Schnitt, 20 Median'],
              ['Übernachtungssteuer, vom Gastgeber eingezogen', '140 Lek je Nacht und Person in Tiraner Wohnungen; 70 Lek in Vlorë', 'Von jeder Gemeinde festgelegt'],
              ['Flughafentransfer', 'Bus 600 Lek, Taxi 30 Euro', 'Taxi 200 Euro, Bus etwa 1.220 Lek'],
              ['Ein Monat statt einer Woche, 1+1 am Strand', '400-600 Euro im Monat im Sommer', '-'],
            ],
          },
        ],
      },
    ],
    faq: [
      {q: 'Wo sind die besten Strände in Albanien?', a: 'Sandig und flach im Norden und in der Mitte (Velipojë, Shëngjin, Durrës, Golem), Kiesbuchten mit dem klarsten Wasser im Süden (Dhërmi, Himarë, Ksamil). Familien wählen meist den Norden, Schwimmer den Süden.'},
      {q: 'Wann ist die beste Reisezeit für Albanien?', a: 'Juni und September: warmes Meer, weniger Menschen und Mietpreise 20-30 % unter Juli und August. Im Süden badet man bis in den Oktober.'},
      {q: 'Was kostet eine Woche in Albanien?', a: 'Sieben Nächte in einer gemieteten Wohnung zum durchschnittlichen Angebotspreis kosten in der Hochsaison etwa 630 USD in Durrës und 805 USD in Sarandë, im Juni oder September 500-640 USD, plus Reinigungsgebühr, Übernachtungssteuer, Essen und Transfers.'},
      {q: 'Wie weit ist Sarandë vom Flughafen Tirana?', a: 'Etwa 285 km und 3,5 Stunden mit dem Taxi (200 Euro); viele Besucher fliegen stattdessen nach Korfu und nehmen die Fähre.'},
      {q: 'Ist Albanien für einen Strandurlaub billiger als Griechenland oder Kroatien?', a: 'Nachtpreise von 60-115 USD und Mahlzeiten in Lek halten es bei gleichem Meer günstiger; für Käufer vergleichen wir die drei Märkte auf den Ländervergleichsseiten.'},
    ],
    gaps: [
      'Keine belegten Restaurant- und Cafépreise für ein Urlaubsbudget.',
      'Typische Flugpreise nach Tirana aus EU-Städten nach Saison nicht belegt.',
      'Meerestemperaturen nach Monat von einem Wetterdienst, um die Klimaschätzungen zu ersetzen.',
      'Liste der Blaue-Flagge-Strände 2026 nicht geprüft.',
    ],
    seoTitle: 'Strandurlaub in Albanien (2026): Norden oder Süden, Reisezeit, was eine Woche kostet',
    seoDescription: 'Sandiger Norden und Mitte (Durrës, Shëngjin) gegen die Kies-Riviera (Sarandë, Ksamil): Saison, Nachtpreise je Ort, eine Woche für zwei ab etwa 630 USD, Transfers und Steuern, mit Quellen.',
  },
  // ------------------------------------------------------------- Polish ---
  {
    id: 'KB-HOLIDAY-COSTS',
    locale: 'pl',
    title: 'Które wybrzeże Albanii wybrać na wakacje, kiedy jechać i ile kosztuje tydzień?',
    summary:
      'Północ i środek (Velipojë, Shëngjin, Durrës, Golem) mają długie piaszczyste plaże, płytką wodę i najniższe ceny; południe (Wlora, Dhërmi, Himarë, Saranda, Ksamil) ma kamieniste zatoczki, czystszą wodę i najcieplejszy, najdłuższy sezon, za wyższą cenę i trzy do czterech godzin dalej od lotniska w Tiranie. Siedem nocy w wynajętym mieszkaniu po średniej cenie z ogłoszeń kosztuje w lipcu i sierpniu około 630 USD w Durrës i 805 USD w Sarandzie, a w miesiącach przed i po sezonie 430-500 i 640 USD (AirROI, 2025-2026), plus opłata za sprzątanie i lokalny podatek od noclegu. Sezon trwa na całym wybrzeżu od czerwca do połowy września; w Sarandzie i Wlorze kąpać się można do października.',
    sections: [
      {
        heading: 'Północ i środek kontra południe',
        body: 'Albania ma dwa wybrzeża. Adriatyk, od granicy z Czarnogórą do Wlory, jest płaski i piaszczysty: Velipojë i Shëngjin na północy, potem 10 km plaży Durrës i Golemu, najbliższe morze od Tirany (45 km od lotniska). Woda jest płytka i szybko się nagrzewa, co odpowiada rodzinom z małymi dziećmi; tu wypoczywa większość Albańczyków i większość kupujących na Domlivo, więc mieszkań jest dużo i są najtańsze na wybrzeżu. Morze Jońskie na południe od Wlory to Riwiera: góry opadające do kamienistych zatoczek w Dhërmi, Jali i Himarë, dalej Saranda naprzeciw Korfu i białe plaże Ksamilu. Woda jest czystsza, a sezon dłuższy, ale droga wolniejsza, ceny wyższe, a od listopada do kwietnia w miejscowościach jest pusto.\n\nSama Tirana to wyjazd do miasta, nie na plażę: najtańsze noclegi krótkoterminowe w kraju, najlepsze wiosną i jesienią, z wybrzeżem godzinę jazdy autobusem.',
        tables: [
          {
            title: 'Kurorty w porównaniu',
            columns: ['Miejscowość', 'Plaża', 'Z lotniska w Tiranie', 'Zima', 'Najlepsza dla'],
            rows: [
              ['Shëngjin', 'Długa piaszczysta plaża, las piniowy w Rana e Hedhur', 'Około 90 km, taksówka 70-75 euro do Szkodry', 'Najchłodniejsza zima na wybrzeżu', 'Najtańsze mieszkania nad morzem, rodziny'],
              ['Durrës i Golem', 'Piasek, płytko, 10 km plaży', '45 km, autobus 600 leków, taksówka 30 euro', 'Łagodna, wilgotna; morze 14 °C', 'Łatwy dojazd, dłuższe pobyty, najwięcej mieszkań do wynajęcia i kupna'],
              ['Wlora', 'Plaże miejskie piaszczyste, kamienie na południe od Uji i Ftohtë', '155 km, taksówka 105-110 euro', 'Ciepła (grudzień-luty krótko)', 'Miasto i Riwiera w jednym miejscu'],
              ['Saranda i Ksamil', 'Kamieniste zatoczki, biały piasek w Ksamilu, prom na Korfu', '285 km, taksówka 200 euro, około 3,5 godziny', 'Najcieplejsza; wiele mieszkań bez ogrzewania', 'Riwiera, najdłuższy sezon'],
            ],
            methodology: 'Opisy klimatu są szacunkami (patrz fakty klimatyczne); odległości i ceny z cennika taksówek lotniskowych i strony autobusów lotniska.',
          },
        ],
      },
      {
        heading: 'Kiedy jechać',
        body: 'Lipiec i sierpień są wszędzie pełne i gorące, w Tiranie 35 °C, a plaże są najbardziej zatłoczone i najdroższe. Czerwiec i wrzesień to najlepsze miesiące na całym wybrzeżu: ciepłe morze, o połowę mniej ludzi, ceny najmu 20-30% poniżej szczytu. Na południu kąpać się można do października. Od listopada do kwietnia w nadmorskich miejscowościach jest cicho, loty i mieszkania są tanie i właśnie wtedy przyjeżdżają kupujący oglądać nieruchomości; jeśli planujesz zimować w Albanii, sprawdź, czy mieszkanie ma ogrzewanie, bo wiele zbudowano pod wynajem letni. Podaż noclegów krótkoterminowych wzrosła od 2020 roku pięciokrotnie, więc poza sierpniem zawsze jest wybór.',
        tables: [
          {
            title: 'Średnia cena za noc w najmie krótkoterminowym, USD (AirROI, sie 2025 - lip 2026)',
            columns: ['Miejscowość', 'Szczyt sezonu (lip-wrz lub cze-sie)', 'Przed i po sezonie', 'Poza sezonem'],
            rows: [
              ['Saranda', '115', '91', 'Sty, lis, gru: obłożenie 26%'],
              ['Ksamil', '111', '91', 'Sty, lis, gru: obłożenie 21%'],
              ['Durrës', '90', '72', '62 (gru-lut)'],
              ['Wlora', '85', '68', '61 (gru-lut)'],
              ['Tirana', '63 (sierpień)', '-', '56 (styczeń)'],
              ['Durrës i Wlora, średnia z czerwca 2026', 'Około 75-76 euro', '-', '-'],
            ],
            methodology: 'Średnie cen za noc z ogłoszeń na platformach typu Airbnb, nie ceny hotelowe; mieszkanie z dwiema sypialniami przy plaży kosztuje więcej niż średnia, kawalerka w głębi lądu mniej.',
          },
        ],
      },
      {
        heading: 'Ile kosztuje tydzień',
        body: 'Dla dwóch osób w wynajętym mieszkaniu siedem nocy po średniej cenie z ogłoszeń to w szczycie sezonu około 630 USD w Durrës i 805 USD w Sarandzie, w czerwcu lub wrześniu 500 i 640 USD. Do tego opłata za sprzątanie, średnio 14 USD w Tiranie i 31 USD w Sarandzie, oraz gminny podatek od noclegu, który pobiera gospodarz: 140 leków za noc od osoby w pensjonatach i mieszkaniach w Tiranie, 70 leków we Wlorze. Dojazd: autobus z lotniska do Durrës kosztuje 600 leków, taksówka 30 euro; do Sarandy taksówka 200 euro albo autobus około 1 220 leków. Jeśli zostajesz na miesiąc, a nie tydzień, wynajmij na miesiąc: mieszkanie 1+1 przy plaży w Durrës ogłaszane jest latem za 400-600 euro miesięcznie, mniej niż dwa tygodnie po cenach za noc.\n\nJeśli wracasz co lato: mieszkania w tych miejscowościach sprzedają się od cen, które nasz indeks pokazuje dla każdego miasta, a mieszkanie, z którego korzystasz miesiąc i wynajmujesz przez resztę sezonu, pokrywa własne koszty utrzymania; strona "wynajmować czy kupić" liczy to dokładnie.',
        tables: [
          {
            title: 'Tydzień dla dwóch osób w wynajętym mieszkaniu, 2026',
            columns: ['Pozycja', 'Durrës', 'Saranda'],
            rows: [
              ['7 nocy, szczyt sezonu (średnia cena z ogłoszeń)', 'Około 630 USD', 'Około 805 USD'],
              ['7 nocy, czerwiec lub wrzesień', 'Około 500 USD', 'Około 640 USD'],
              ['Opłata za sprzątanie (średnio za pobyt)', '14-31 USD zależnie od miejscowości', '31 USD średnio, mediana 20'],
              ['Podatek od noclegu pobierany przez gospodarza', '140 leków za noc od osoby w mieszkaniach w Tiranie; 70 leków we Wlorze', 'Ustala każda gmina'],
              ['Transfer z lotniska', 'Autobus 600 leków, taksówka 30 euro', 'Taksówka 200 euro, autobus około 1 220 leków'],
              ['Miesiąc zamiast tygodnia, 1+1 przy plaży', '400-600 euro miesięcznie latem', '-'],
            ],
          },
        ],
      },
    ],
    faq: [
      {q: 'Gdzie są najlepsze plaże w Albanii?', a: 'Piaszczyste i płytkie na północy i w środku (Velipojë, Shëngjin, Durrës, Golem), kamieniste zatoczki z najczystszą wodą na południu (Dhërmi, Himarë, Ksamil). Rodziny zwykle wybierają północ, pływacy południe.'},
      {q: 'Kiedy najlepiej jechać do Albanii?', a: 'W czerwcu i wrześniu: ciepłe morze, mniej ludzi i ceny najmu 20-30% niższe niż w lipcu i sierpniu. Na południu kąpać się można do października.'},
      {q: 'Ile kosztuje tydzień w Albanii?', a: 'Siedem nocy w wynajętym mieszkaniu po średniej cenie z ogłoszeń to w szczycie sezonu około 630 USD w Durrës i 805 USD w Sarandzie, w czerwcu lub wrześniu 500-640 USD, plus sprzątanie, podatek od noclegu, jedzenie i transfery.'},
      {q: 'Jak daleko jest Saranda od lotniska w Tiranie?', a: 'Około 285 km i 3,5 godziny taksówką (200 euro); wielu odwiedzających leci zamiast tego na Korfu i płynie promem.'},
      {q: 'Czy Albania jest tańsza od Grecji lub Chorwacji na wakacje nad morzem?', a: 'Ceny za noc 60-115 USD i posiłki w lekach utrzymują ją taniej przy tym samym morzu; dla kupujących porównujemy te trzy rynki na stronach porównań krajów.'},
    ],
    gaps: [
      'Brak udokumentowanych cen restauracji i kawiarni do budżetu wakacyjnego.',
      'Typowe ceny lotów do Tirany z miast UE według sezonu nieudokumentowane.',
      'Temperatury morza według miesięcy z serwisu meteorologicznego, by zastąpić szacunki klimatyczne.',
      'Lista plaż z Błękitną Flagą na 2026 rok niesprawdzona.',
    ],
    seoTitle: 'Wakacje w Albanii nad morzem (2026): północ czy południe, kiedy jechać, ile kosztuje tydzień',
    seoDescription: 'Piaszczysta północ i środek (Durrës, Shëngjin) kontra kamienista Riwiera (Saranda, Ksamil): sezony, ceny za noc według miejscowości, tydzień dla dwóch osób od około 630 USD, transfery i podatki, ze źródłami.',
  },
  // ------------------------------------------------------------ Russian ---
  {
    id: 'KB-PROS-CONS',
    locale: 'ru',
    title: 'Какие плюсы и минусы жизни в Албании?',
    summary:
      'За: низкие обязательные расходы (около 650 евро в месяц на одного человека со съёмной квартирой в Дурресе), простой въезд (90 дней без визы для граждан ЕС, Великобритании и Израиля, год для американцев, никакого ВНЖ для украинцев до марта 2027 года), годовой продлеваемый ВНЖ для любого, кто купил квартиру, мягкие зимы на побережье, дешёвое быстрое оптоволокно, карты в городах и переводы в евро через SEPA с октября 2025 года. Против: аренда в Тиране дорожает примерно на 8-12% в год, государственная медстраховка начинает платить только через полгода, роуминга с ЕС пока нет, один работающий аэропорт, нет пассажирских поездов, топливо по 2,06-2,31 евро за литр, летние квартиры без отопления и строительный бум, из-за которого проверка документов на дом обязательна. Цифры ниже взяты со страниц этой базы знаний, у каждой есть источник.',
    sections: [
      {
        heading: 'Что говорит в пользу Албании',
        body: '- Деньги тянутся дальше. Один человек со съёмной однокомнатной квартирой тратит около 650 евро в месяц в Дурресе и 865 евро в Тиране на аренду, счета, интернет, телефон, еду и страховку; квартира у пляжа в Дурресе продаётся примерно по 1 500 евро за квадратный метр, а покупка обходится примерно в 2,5% сборов.\n- Въехать просто. Граждане ЕС, Великобритании и Израиля проводят 90 дней из 180 без визы, американцы - год, украинцам до 30 марта 2027 года не нужны ни виза, ни ВНЖ. Владение квартирой даёт право на годовой продлеваемый ВНЖ без минимальной стоимости.\n- Климат на побережье. Во Влёре и Саранде самые тёплые зимы в стране и купальный сезон с июня по октябрь; Дуррес мягкий и влажный.\n- Инфраструктура там, где она важна. Оптоволокно за 1 300 леков в месяц за 100 Мбит/с, 89% стационарных линий быстрее 30 Мбит/с, карты принимают в магазинах и ресторанах в городах, а переводы в евро из банка ЕС идут как обычные платежи SEPA.\n- Страховочные сетки есть. Экстренная помощь бесплатна для любого при угрозе жизни, государственные школы бесплатны и открыты для детей иностранцев, а иностранный резидент может добровольно вступить в государственную медстраховку примерно за 3 400 леков в месяц.',
        tables: [
          {
            title: 'Преимущества в цифрах',
            columns: ['Преимущество', 'Цифра'],
            rows: [
              ['Обязательные расходы в месяц, один человек в съёмной 1+1', 'Около 650 евро в Дурресе, 865 евро в Тиране'],
              ['Пребывание без визы', '90 дней для ЕС, Великобритании, Израиля; 1 год для граждан США; украинцы без визы и ВНЖ до 30.03.2027'],
              ['ВНЖ для собственников недвижимости', '1 год, продлеваемый, без минимальной стоимости (закон 79/2021, ст. 84)'],
              ['Расходы при покупке', 'Около 2,5% цены; налога на переход права на квартиры нет'],
              ['Домашнее оптоволокно', '1 300 леков в месяц за 100 Мбит/с; 89% линий быстрее 30 Мбит/с'],
              ['Карты и переводы', '67% банковских платежей по картам; SEPA работает с 7.10.2025'],
              ['Государственная медстраховка, добровольная', '3 400 леков в месяц на человека'],
            ],
          },
        ],
      },
      {
        heading: 'С чем люди сталкиваются',
        body: '- Аренда и цены быстро растут там, где хотят жить иностранцы. Запрашиваемая аренда выросла на 8-12% в 2025-2026 годах, а 1+1 в Тиране подорожала с 400 до 590 евро за четыре года; цены на жильё по стране в конце 2025 года были на 28% выше, чем годом раньше. «Дёшево» - относительно Западной Европы, а не 2020 года.\n- Медицину нужно планировать. Государственная система платит только через полгода после вступления; до этого, как и в частных клиниках, вы платите сами или держите частный полис. Серьёзная специализированная помощь - это Тирана или поездка за границу.\n- Передвижение. Один работающий международный аэропорт, аэропорт Влёры застрял в споре о концессии, пассажирских поездов нет до открытия линии Тирана-Дуррес (запланировано на конец 2027 года), топливо по 190-213 леков за литр и автобусы, которые ходят часто, но без опубликованного расписания.\n- Зимы не такие, как обещает лето. Тирана - самое холодное и самое жаркое место в стране; многие квартиры на побережье построены под летнюю аренду и без отопления; с ноября по апрель приморские города пусты.\n- Телефон и бумаги. Роуминга с ЕС пока нет, документы для каждого ВНЖ переводятся и апостилируются, на подачу после приезда даётся 30 дней, а пропущенная регистрация адреса аннулирует ВНЖ.\n- Качество строительства разное. Сотни тысяч зданий прошли легализацию, новые растут быстро; проверить документы на собственность, разрешение и застройщика до оплаты - не опция, а необходимость.',
        tables: [
          {
            title: 'Недостатки в цифрах',
            columns: ['Недостаток', 'Цифра'],
            rows: [
              ['Рост аренды', '+8-12% запрашиваемой аренды в 2025-2026; 1+1 в Тиране с 400 до 590 евро за четыре года'],
              ['Цены на жильё', '+28% за год на конец 2025 года (индекс Банка Албании)'],
              ['Государственная медстраховка', '6 месяцев ожидания для добровольных участников'],
              ['Транспорт', 'Аэропорт Влёры не работает; поезда вернутся не раньше конца 2027 года'],
              ['Топливо', '190-213 леков за литр (2,06-2,31 евро), октябрь 2026'],
              ['Климат', 'В Тиране самое жаркое лето (35 °C и выше) и самые холодные зимы; квартиры в Саранде часто без отопления'],
              ['Роуминг', 'Вне зоны роуминга ЕС; переговоры предложены в феврале 2026'],
              ['Сроки по ВНЖ', 'Подача в течение 30 дней после въезда; регистрация адреса в течение 30 дней, иначе ВНЖ аннулируют'],
              ['Легализованные здания', '291 114 решений о легализации к 2025 году; 26 101 только в 2025-м'],
            ],
          },
        ],
      },
      {
        heading: 'Кому это подходит',
        body: 'Албания лучше всего подходит тем, чей доход приходит откуда-то ещё: пенсионерам из Италии, Германии или Польши, удалёнщикам с ВНЖ цифрового кочевника, семьям, которые делят год между европейским городом и побережьем, и покупателям, которые хотят квартиру у моря по цене парковочного места дома. Хуже она подходит тем, кому нужна местная зарплата (средняя зарплата до вычетов - около 1 000 евро в месяц), специализированная медицина рядом или англоязычная школа вне Тираны.\n\nПрактическая проверка - зима: снимите квартиру с отоплением с октября по май и посмотрите, подходит ли вам город по-прежнему. Наши страницы о том, где жить, о долгосрочной аренде и стоимости жизни дают цифры; объявления показывают, что те же деньги покупают в каждом городе.',
      },
    ],
    faq: [
      {q: 'Хорошо ли иностранцам живётся в Албании?', a: 'Тем, у кого доход из-за границы, - да: низкие обязательные расходы, простой въезд, ВНЖ для собственников недвижимости и мягкие зимы на побережье. Компромиссы - растущая аренда, полгода ожидания государственной медстраховки, отсутствие роуминга с ЕС и ограниченный транспорт.'},
      {q: 'Дёшево ли жить в Албании?', a: 'Обязательные расходы одного человека со съёмной 1+1 - около 650 евро в месяц в Дурресе и 865 евро в Тиране по ценам октября 2026 года; средняя местная зарплата до вычетов - около 1 000 евро.'},
      {q: 'Безопасно ли жить в Албании?', a: 'Экстренная помощь бесплатна для любого при угрозе жизни, иностранцы селятся в городах и на побережье без особых предосторожностей; реальные риски - в бумагах и качестве строительства, а не в личной безопасности, поэтому проверяйте документы на каждый объект.'},
      {q: 'Главный минус жизни в Албании?', a: 'Удалённость от специализированных услуг: один аэропорт, нет поездов, за серьёзной медициной и международными школами - в Тирану, и полгода ожидания, пока государственная страховка начнёт платить.'},
      {q: 'Можно ли жить в Албании без албанского языка?', a: 'В Тиране и приморских городах английского и итальянского хватает на повседневную жизнь; договоры, ВНЖ и государственные школы - на албанском, так что закладывайте расходы на переводы.'},
    ],
    gaps: [
      'Пока нет статистики преступности и безопасности с источником (INSTAT, полиция).',
      'Данные о качестве воздуха и воды в Тиране и на побережье не собраны.',
      'Число иностранных резидентов по гражданству (INSTAT или миграционная служба) не собрано.',
    ],
    seoTitle: 'Жизнь в Албании: плюсы и минусы в цифрах (2026)',
    seoDescription: 'Низкие расходы (около 650 евро в месяц в Дурресе), простой въезд, ВНЖ для собственников и мягкие зимы против растущей аренды, полугодового ожидания медстраховки, отсутствия роуминга с ЕС и одного аэропорта. С источниками.',
  },
  // ---------------------------------------------------------- Ukrainian ---
  {
    id: 'KB-PROS-CONS',
    locale: 'uk',
    title: 'Які плюси і мінуси життя в Албанії?',
    summary:
      'За: низькі обов\'язкові витрати (близько 650 євро на місяць на одну людину з орендованою квартирою в Дурресі), простий в\'їзд (90 днів без візи для громадян ЄС, Великої Британії та Ізраїлю, рік для американців, жодної посвідки для українців до березня 2027 року), річна посвідка на проживання з продовженням для кожного, хто купив квартиру, м\'які зими на узбережжі, дешеве швидке оптоволокно, картки в містах і перекази в євро через SEPA з жовтня 2025 року. Проти: оренда в Тирані дорожчає приблизно на 8-12% на рік, державне медичне страхування починає платити лише через півроку, роумінгу з ЄС поки немає, один працюючий аеропорт, немає пасажирських поїздів, пальне по 2,06-2,31 євро за літр, літні квартири без опалення і будівельний бум, через який перевірка документів на будинок обов\'язкова. Цифри нижче взяті зі сторінок цієї бази знань, кожна має джерело.',
    sections: [
      {
        heading: 'Що говорить на користь Албанії',
        body: '- Гроші тягнуться далі. Одна людина з орендованою однокімнатною квартирою витрачає близько 650 євро на місяць у Дурресі і 865 євро в Тирані на оренду, рахунки, інтернет, телефон, їжу та страховку; квартира біля пляжу в Дурресі продається приблизно по 1 500 євро за квадратний метр, а купівля обходиться приблизно у 2,5% зборів.\n- В\'їхати просто. Громадяни ЄС, Великої Британії та Ізраїлю проводять 90 днів зі 180 без візи, американці - рік, українцям до 30 березня 2027 року не потрібні ні віза, ні посвідка. Володіння квартирою дає право на річну посвідку з продовженням без мінімальної вартості.\n- Клімат на узбережжі. У Вльорі та Саранді найтепліші зими в країні і купальний сезон з червня по жовтень; Дуррес м\'який і вологий.\n- Інфраструктура там, де вона важлива. Оптоволокно за 1 300 леків на місяць за 100 Мбіт/с, 89% стаціонарних ліній швидші за 30 Мбіт/с, картки приймають у магазинах і ресторанах у містах, а перекази в євро з банку ЄС ідуть як звичайні платежі SEPA.\n- Страхувальні сітки є. Невідкладна допомога безкоштовна для будь-кого при загрозі життю, державні школи безкоштовні й відкриті для дітей іноземців, а іноземний резидент може добровільно вступити до державного медичного страхування приблизно за 3 400 леків на місяць.',
        tables: [
          {
            title: 'Переваги в цифрах',
            columns: ['Перевага', 'Цифра'],
            rows: [
              ['Обов\'язкові витрати на місяць, одна людина в орендованій 1+1', 'Близько 650 євро в Дурресі, 865 євро в Тирані'],
              ['Перебування без візи', '90 днів для ЄС, Великої Британії, Ізраїлю; 1 рік для громадян США; українці без візи й посвідки до 30.03.2027'],
              ['Посвідка для власників нерухомості', '1 рік, з продовженням, без мінімальної вартості (закон 79/2021, ст. 84)'],
              ['Витрати при купівлі', 'Близько 2,5% ціни; податку на перехід права на квартири немає'],
              ['Домашнє оптоволокно', '1 300 леків на місяць за 100 Мбіт/с; 89% ліній швидші за 30 Мбіт/с'],
              ['Картки та перекази', '67% банківських платежів картками; SEPA працює з 7.10.2025'],
              ['Державне медичне страхування, добровільне', '3 400 леків на місяць на особу'],
            ],
          },
        ],
      },
      {
        heading: 'З чим люди стикаються',
        body: '- Оренда і ціни швидко зростають там, де хочуть жити іноземці. Запитувана оренда зросла на 8-12% у 2025-2026 роках, а 1+1 у Тирані подорожчала з 400 до 590 євро за чотири роки; ціни на житло по країні наприкінці 2025 року були на 28% вищі, ніж рік тому. «Дешево» - порівняно із Західною Європою, а не з 2020 роком.\n- Медицину треба планувати. Державна система платить лише через півроку після вступу; до того, як і в приватних клініках, ви платите самі або тримаєте приватний поліс. Серйозна спеціалізована допомога - це Тирана або поїздка за кордон.\n- Пересування. Один працюючий міжнародний аеропорт, аеропорт Вльори застряг у спорі про концесію, пасажирських поїздів немає до відкриття лінії Тирана-Дуррес (заплановано на кінець 2027 року), пальне по 190-213 леків за літр і автобуси, які ходять часто, але без опублікованого розкладу.\n- Зими не такі, як обіцяє літо. Тирана - найхолодніше і найспекотніше місце в країні; багато квартир на узбережжі збудовано під літню оренду і без опалення; з листопада по квітень приморські міста порожні.\n- Телефон і папери. Роумінгу з ЄС поки немає, документи для кожної посвідки перекладаються й апостилюються, на подачу після приїзду дається 30 днів, а пропущена реєстрація адреси анулює посвідку.\n- Якість будівництва різна. Сотні тисяч будівель пройшли легалізацію, нові ростуть швидко; перевірити документи на власність, дозвіл і забудовника до оплати - не опція, а необхідність.',
        tables: [
          {
            title: 'Недоліки в цифрах',
            columns: ['Недолік', 'Цифра'],
            rows: [
              ['Зростання оренди', '+8-12% запитуваної оренди у 2025-2026; 1+1 у Тирані з 400 до 590 євро за чотири роки'],
              ['Ціни на житло', '+28% за рік на кінець 2025 року (індекс Банку Албанії)'],
              ['Державне медичне страхування', '6 місяців очікування для добровільних учасників'],
              ['Транспорт', 'Аеропорт Вльори не працює; поїзди повернуться не раніше кінця 2027 року'],
              ['Пальне', '190-213 леків за літр (2,06-2,31 євро), жовтень 2026'],
              ['Клімат', 'У Тирані найспекотніше літо (35 °C і вище) та найхолодніші зими; квартири в Саранді часто без опалення'],
              ['Роумінг', 'Поза зоною роумінгу ЄС; переговори запропоновано в лютому 2026'],
              ['Строки щодо посвідки', 'Подача протягом 30 днів після в\'їзду; реєстрація адреси протягом 30 днів, інакше посвідку анулюють'],
              ['Легалізовані будівлі', '291 114 рішень про легалізацію до 2025 року; 26 101 лише у 2025-му'],
            ],
          },
        ],
      },
      {
        heading: 'Кому це підходить',
        body: 'Албанія найкраще підходить тим, чий дохід надходить звідкись іще: пенсіонерам з Італії, Німеччини чи Польщі, віддаленим працівникам із посвідкою цифрового кочівника, сім\'ям, які ділять рік між європейським містом і узбережжям, і покупцям, які хочуть квартиру біля моря за ціною паркомісця вдома. Гірше вона підходить тим, кому потрібна місцева зарплата (середня зарплата до вирахувань - близько 1 000 євро на місяць), спеціалізована медицина поруч або англомовна школа поза Тираною.\n\nПрактична перевірка - зима: орендуйте квартиру з опаленням з жовтня по травень і подивіться, чи місто вам досі підходить. Наші сторінки про те, де жити, про довгострокову оренду та вартість життя дають цифри; оголошення показують, що ті самі гроші купують у кожному місті.',
      },
    ],
    faq: [
      {q: 'Чи добре іноземцям живеться в Албанії?', a: 'Тим, у кого дохід з-за кордону, - так: низькі обов\'язкові витрати, простий в\'їзд, посвідка для власників нерухомості і м\'які зими на узбережжі. Компроміси - зростання оренди, півроку очікування державного медичного страхування, відсутність роумінгу з ЄС та обмежений транспорт.'},
      {q: 'Чи дешево жити в Албанії?', a: 'Обов\'язкові витрати однієї людини з орендованою 1+1 - близько 650 євро на місяць у Дурресі і 865 євро в Тирані за цінами жовтня 2026 року; середня місцева зарплата до вирахувань - близько 1 000 євро.'},
      {q: 'Чи безпечно жити в Албанії?', a: 'Невідкладна допомога безкоштовна для будь-кого при загрозі життю, іноземці селяться в містах і на узбережжі без особливих пересторог; реальні ризики - у паперах і якості будівництва, а не в особистій безпеці, тому перевіряйте документи на кожен об\'єкт.'},
      {q: 'Головний мінус життя в Албанії?', a: 'Віддаленість від спеціалізованих послуг: один аеропорт, немає поїздів, за серйозною медициною і міжнародними школами - до Тирани, і півроку очікування, поки державна страховка почне платити.'},
      {q: 'Чи можна жити в Албанії без албанської мови?', a: 'У Тирані та приморських містах англійської й італійської вистачає на повсякденне життя; договори, посвідки і державні школи - албанською, тож закладайте витрати на переклади.'},
    ],
    gaps: [
      'Поки немає статистики злочинності та безпеки з джерелом (INSTAT, поліція).',
      'Дані про якість повітря і води в Тирані та на узбережжі не зібрані.',
      'Кількість іноземних резидентів за громадянством (INSTAT або міграційна служба) не зібрана.',
    ],
    seoTitle: 'Життя в Албанії: плюси і мінуси в цифрах (2026)',
    seoDescription: 'Низькі витрати (близько 650 євро на місяць у Дурресі), простий в\'їзд, посвідка для власників і м\'які зими проти зростання оренди, піврічного очікування медстрахування, відсутності роумінгу з ЄС та одного аеропорту. З джерелами.',
  },
]
