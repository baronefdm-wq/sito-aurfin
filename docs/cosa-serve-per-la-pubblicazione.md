# AURFIN: cosa serve per la pubblicazione del sito

Elenco di documenti, informazioni, decisioni e servizi necessari o utili per pubblicare il sito. Lo stato si basa su ciò che è stato fornito finora (visura del 02/11/2026, scheda dell'elenco OAM, atto costitutivo, logo e palette, casella Gmail per le notifiche).

**Questo elenco non è una consulenza legale.** Le voci normative vanno confermate con compliance, consulente privacy e mandanti.

## Legenda

| Colonna | Valori |
|---|---|
| **Tipo** | Documento · Informazione · Decisione · Servizio |
| **Priorità** | **Obbligatorio** = necessario prima della pubblicazione (o da confermare come tale con la compliance) · **Consigliato** = non blocca, ma ha valore concreto · **Se applicabile** = dipende dalla situazione di AURFIN |
| **Stato** | ✅ Già disponibile · 🟡 Parziale · ⬜ Da fornire |

Le voci di codice citate (`SMTP_HOST`, `site.ts` ecc.) sono i punti in cui il dato viene inserito nel progetto. **Le password e le chiavi vanno solo nella configurazione del server: mai nel codice, nelle email o in chat.**

---

## 1. Identità societaria e stato dell'impresa

| Cosa serve | Tipo | Priorità | Chi lo fornisce | Stato | Dove viene usato | Note |
|---|---|---|---|---|---|---|
| Visura camerale aggiornata | Documento | Obbligatorio | AURFIN / commercialista | ✅ | Verifica dei dati in `site.ts`, footer, Informazioni societarie | Estratta il 02/11/2026. Ricontrollare se il lancio si allontana o i dati cambiano |
| Conferma dell'avvio dell'attività | Informazione | Obbligatorio | Visura | ✅ | Condizione per pubblicare | Stato «attiva», inizio attività 26/03/2026 |
| Ragione sociale e forma giuridica | Informazione | Obbligatorio | Visura | ✅ | Footer, Chi siamo, Informazioni societarie, privacy | Confermate dalla visura del 02/11/2026 |
| Sede legale, C.F./P. IVA, REA | Informazione | Obbligatorio | Visura | ✅ | Footer, Informazioni societarie | Confermati dalla visura del 02/11/2026 |
| PEC | Informazione | Obbligatorio | Visura | ✅ | Contatti, Informazioni societarie, Reclami | Verificare che sia attiva e presidiata |
| Capitale sociale (sottoscritto e versato) | Informazione | Obbligatorio | Visura / commercialista | ✅ | Footer, Informazioni societarie | € 10.200,00 sottoscritto, € 2.550,00 versato: invariato nella visura del 02/11/2026 |
| Legale rappresentante da indicare nei documenti | Informazione | Consigliato | Visura | ✅ | Informativa privacy, documenti interni | Amministratore unico: Jacopo Santarelli. Decidere se citarlo sul sito. Non si pubblicano codici fiscali, domicili né dati personali dei soci |

## 2. Iscrizione OAM e requisiti dell'agente

| Cosa serve | Tipo | Priorità | Chi lo fornisce | Stato | Dove viene usato | Note |
|---|---|---|---|---|---|---|
| Numero e data di iscrizione all'Elenco degli Agenti in attività finanziaria | Documento | Obbligatorio | AURFIN / OAM | ✅ | Footer, Chi siamo, Trasparenza, Informativa, Informazioni societarie | N. A14406 del 07/10/2021; scheda OAM: «iscritto», autorizzato ad operare. Ricontrollare su organismo-am.it subito prima del lancio |
| Conferma del ruolo effettivo (agente) e dell'oggetto sociale esclusivo | Informazione | Obbligatorio | Visura / OAM | ✅ | Testi di Chi siamo e Come funziona | Oggetto sociale esclusivo e attività prevalente da visura; elenco Agenti da scheda OAM |
| Polizza di responsabilità civile professionale | Documento | Obbligatorio | AURFIN / assicuratore | ⬜ | Uso interno | Per l'OAM è condizione di efficacia dell'iscrizione: [requisiti](https://www.organismo-am.it/requisiti-persone-fisiche), [circolare polizze](https://www.organismo-am.it/documenti/Circolari/Circolare%20Polizze%20Assicurative%20.pdf). Verificare i massimali vigenti |
| Requisiti di onorabilità e professionalità di esponenti e collaboratori | Documento | Obbligatorio | AURFIN / compliance | ⬜ | Uso interno; team sul sito solo se autorizzato | Da verificare con la compliance |
| Elenco di dipendenti e collaboratori abilitati al contatto con il pubblico | Informazione | Obbligatorio | AURFIN / compliance | ⬜ | Spazio team; pagina Team solo con consenso | Solo chi è abilitato dovrebbe avere il ruolo di consulente |
| Piano di aggiornamento professionale | Documento | Se applicabile | AURFIN / OAM | ⬜ | Uso interno | Verificare gli obblighi sulle circolari OAM vigenti |

## 3. Mandanti e prodotti

| Cosa serve | Tipo | Priorità | Chi lo fornisce | Stato | Dove viene usato | Note |
|---|---|---|---|---|---|---|
| Contratti di mandato | Documento | Obbligatorio | AURFIN / mandante | ⬜ | Determinano prodotti e testi del sito | L'agente opera su mandato di un solo intermediario o gruppo, con le eccezioni di legge: [OAM](https://www.organismo-am.it/profilo-professionale). Verificare il testo vigente dell'art. 128-quater TUB |
| Nomi degli intermediari mandanti | Informazione | Obbligatorio | AURFIN | ⬜ | Footer, Chi siamo, Trasparenza, email | `registration.principals` in `site.ts` |
| Prodotti effettivamente in mandato | Decisione | Obbligatorio | AURFIN / mandante | ⬜ | Pagine prodotto, preventivo, FAQ | Una soluzione non in mandato va tolta dal sito, anche dal modulo |
| Regole del mandante su sito e pubblicità | Documento | Obbligatorio | Mandante | ⬜ | Tutti i testi | Molti mandanti chiedono di approvare i testi: da verificare |
| Autorizzazione all'uso di nome e logo del mandante | Documento | Se applicabile | Mandante | ⬜ | Chi siamo, Trasparenza | Solo con consenso scritto |
| Elenco documenti richiesti per prodotto e categoria | Documento | Consigliato | Mandante | 🟡 | Passaggio «Documenti» del preventivo, area clienti | L'elenco attuale è indicativo (`document-requirements.ts`) |
| Criteri generali di ammissibilità | Informazione | Consigliato | Mandante | ⬜ | Testi prodotto, pre-qualifica, spunti per i consulenti | I testi non devono promettere idoneità |
| Regole operative su firma, canali e chi raccoglie i documenti | Informazione | Obbligatorio | Mandante / compliance | ⬜ | Percorso cliente e procedure | Definisce cosa può gestire direttamente AURFIN |

## 4. Trasparenza e documenti precontrattuali

| Cosa serve | Tipo | Priorità | Chi lo fornisce | Stato | Dove viene usato | Note |
|---|---|---|---|---|---|---|
| Informativa sull'agente da dare al cliente | Documento | Obbligatorio | Compliance / mandante | ⬜ | Pagina Trasparenza, prima del caricamento dei documenti | Forma e contenuti da verificare con la compliance |
| Fogli informativi dei prodotti | Documento | Obbligatorio | Mandante | ⬜ | Pagina Trasparenza | Versioni aggiornate, con una procedura di sostituzione |
| Modulo «Informazioni europee di base sul credito ai consumatori» | Documento | Se applicabile | Mandante | ⬜ | Fase di proposta, non sul sito | Lo fornisce il finanziatore nel suo processo |
| Guide della Banca d'Italia applicabili | Documento | Consigliato | Banca d'Italia / compliance | ⬜ | Pagina Trasparenza | Quali siano obbligatorie: da verificare con la compliance |
| Informativa su compensi e provvigioni | Documento | Se applicabile | Compliance / mandante | ⬜ | Trasparenza, FAQ «Quanto costa la consulenza» | Oggi la FAQ è generica |
| Validazione dei testi segnati «Da validare» | Decisione | Obbligatorio | Compliance | ⬜ | Pagine prodotto, FAQ, Chi siamo, Come funziona | Limiti di rata e durata, assicurazioni, rinnovo, recesso, estinzione. Le fonti usate sono in parte secondarie |
| Revisione o sostituzione delle guide in bozza | Decisione | Consigliato | Compliance / AURFIN | 🟡 | Sezione Guide | Oggi sono bozze non indicizzate |

## 5. Pubblicità e comunicazione commerciale

| Cosa serve | Tipo | Priorità | Chi lo fornisce | Stato | Dove viene usato | Note |
|---|---|---|---|---|---|---|
| Approvazione delle diciture pubblicitarie | Decisione | Obbligatorio | Compliance / mandante | 🟡 | Footer, pagine prodotto | La dicitura attuale è una bozza |
| Regole per messaggi con importi, tassi o costi | Documento | Obbligatorio | Compliance | ⬜ | Simulatore, campagne | Il sito oggi non mostra tassi né costi. Verificare art. 123 TUB se verranno introdotti |
| Procedura di approvazione di contenuti e campagne | Decisione | Consigliato | AURFIN / compliance | ⬜ | Guide, social, campagne | Chi approva, chi conserva le versioni |
| Testo del consenso marketing e canali coperti | Documento | Obbligatorio | Consulente privacy | 🟡 | Preventivo, profilo cliente | Il consenso è già separato e non preselezionato; il testo va validato |
| Base giuridica per ricontattare i clienti sul rinnovo | Decisione | Obbligatorio | Consulente privacy / compliance | ⬜ | Spazio team (rinnovi) | Da definire prima di usare i rinnovi per contatti commerciali |
| Tempo di risposta promesso al pubblico | Decisione | Consigliato | AURFIN | ⬜ | Conferme, home | Da dichiarare solo se sostenibile |

## 6. Privacy e GDPR

| Cosa serve | Tipo | Priorità | Chi lo fornisce | Stato | Dove viene usato | Note |
|---|---|---|---|---|---|---|
| Informativa privacy definitiva | Documento | Obbligatorio | Consulente privacy | 🟡 | Pagina Privacy, tutti i moduli | Esiste la struttura con segnaposto |
| Valutazione d'impatto (DPIA) | Documento | Obbligatorio | Consulente privacy / DPO | ⬜ | Uso interno | Necessità da confermare, ma probabile: dati finanziari e documenti d'identità raccolti online |
| Valutazione sulle buste paga | Decisione | Obbligatorio | Consulente privacy / DPO | ⬜ | Passaggio Documenti, area clienti | Possono mostrare dati particolari (art. 9 GDPR), per esempio trattenute sindacali. Valutare anche l'oscuramento delle voci non necessarie |
| Registro dei trattamenti | Documento | Obbligatorio | Consulente privacy | ⬜ | Uso interno | Da confermare l'applicabilità, ma consigliato comunque |
| Ruoli privacy di AURFIN e mandante | Decisione | Obbligatorio | Consulente privacy / mandante | ⬜ | Informativa, contratti | Titolare, contitolare o responsabile: dipende dal mandato |
| Nomina o esclusione del DPO | Decisione | Se applicabile | Consulente privacy | ⬜ | Informativa privacy | Da motivare e documentare |
| Accordi con i fornitori (DPA) | Documento | Obbligatorio | AURFIN / fornitori | ⬜ | Hosting, email, storage, backup, WhatsApp | Da firmare prima di trattare dati reali |
| Trasferimenti di dati fuori UE | Decisione | Obbligatorio | Consulente privacy | ⬜ | Scelta dei fornitori | Rilevante per Gmail, WhatsApp e hosting |
| Tempi di conservazione per tipo di dato | Decisione | Obbligatorio | Consulente privacy / compliance | ⬜ | Conservazione documenti (`DOCUMENT_RETENTION_DAYS`), informativa | Distinguere richieste non proseguite e pratiche concluse. Non fissare valori senza parere |
| Base giuridica per documenti e pre-qualifica | Decisione | Obbligatorio | Consulente privacy | ⬜ | Preventivo | Include fascia di reddito e finanziamenti in corso |
| Procedura per le richieste degli interessati | Documento | Obbligatorio | Consulente privacy / AURFIN | ⬜ | Informativa, spazio team | Canale dedicato e tempi di risposta |
| Procedura per le violazioni dei dati | Documento | Obbligatorio | Consulente privacy / fornitore tecnico | ⬜ | Uso interno | Chi fa cosa, e quando notificare |
| Istruzioni e autorizzazioni al personale | Documento | Obbligatorio | AURFIN / consulente privacy | ⬜ | Spazio team | Prima di dare gli accessi |
| Valutazione delle notifiche al personale | Decisione | Consigliato | Consulente privacy | 🟡 | Email e WhatsApp al team | Oggi i messaggi hanno dati minimi; il nome compare solo nell'email |

## 7. Antiriciclaggio

| Cosa serve | Tipo | Priorità | Chi lo fornisce | Stato | Dove viene usato | Note |
|---|---|---|---|---|---|---|
| Definizione di chi fa l'adeguata verifica | Decisione | Obbligatorio | Compliance / mandante | ⬜ | Percorso documenti, procedure | Riferimento: D.Lgs. 231/2007. Da verificare con la compliance |
| Procedura per identificare il cliente | Documento | Obbligatorio | Mandante / compliance | ⬜ | Procedure; eventuale SPID/CIE | Il caricamento di un documento online non equivale di per sé all'identificazione |
| Conservazione dei dati antiriciclaggio | Decisione | Obbligatorio | Compliance | ⬜ | Procedure, conservazione documenti | Va coordinata con i tempi privacy |
| Formazione antiriciclaggio del personale | Documento | Se applicabile | Compliance | ⬜ | Uso interno | Verificare gli obblighi |
| Procedura per le operazioni sospette | Documento | Se applicabile | Compliance / mandante | ⬜ | Uso interno | Non va resa visibile al cliente |

## 8. Reclami e ABF

| Cosa serve | Tipo | Priorità | Chi lo fornisce | Stato | Dove viene usato | Note |
|---|---|---|---|---|---|---|
| Procedura reclami approvata | Documento | Obbligatorio | Compliance / mandante | ⬜ | Pagina Reclami | Esiste la struttura con segnaposto |
| Recapito dedicato ai reclami | Informazione | Obbligatorio | AURFIN | 🟡 | Pagina Reclami (`complaints` in `site.ts`) | C'è la PEC societaria; va deciso se usarla |
| Termini di risposta | Informazione | Obbligatorio | Compliance | ⬜ | Pagina Reclami | Non indicarli senza conferma |
| Applicabilità dell'ABF e di altri strumenti | Decisione | Obbligatorio | Compliance | ⬜ | Pagina Reclami | Dipende da ruolo e prodotti |
| Responsabile dei reclami e registro interno | Decisione | Consigliato | AURFIN / compliance | ⬜ | Uso interno | Consente anche la rendicontazione |

## 9. Cookie

| Cosa serve | Tipo | Priorità | Chi lo fornisce | Stato | Dove viene usato | Note |
|---|---|---|---|---|---|---|
| Verifica dei cookie realmente installati in produzione | Decisione | Obbligatorio | Fornitore tecnico / consulente privacy | 🟡 | Pagina Cookie | Oggi solo cookie tecnici. I cookie tecnici richiedono informativa, non consenso: [linee guida del Garante](https://www.garanteprivacy.it/home/docweb/-/docweb-display/docweb/9677876) |
| Scelta di usare strumenti di statistica | Decisione | Consigliato | AURFIN | ⬜ | Sito, Pagina Cookie | Se si aggiungono, rivalutare informativa e consenso |
| Banner di consenso | Servizio | Se applicabile | Fornitore tecnico | ⬜ | Tutto il sito | Solo con cookie non tecnici. [Garante, FAQ](https://www.garanteprivacy.it/faq/cookie) |
| Testo definitivo dell'informativa cookie | Documento | Obbligatorio | Consulente privacy | 🟡 | Pagina Cookie | Va aggiornato a ogni nuovo strumento |

## 10. Accessibilità

| Cosa serve | Tipo | Priorità | Chi lo fornisce | Stato | Dove viene usato | Note |
|---|---|---|---|---|---|---|
| Verifica di accessibilità WCAG 2.2 AA | Servizio | Consigliato | Fornitore tecnico / auditor | 🟡 | Tutto il sito | Il sito è progettato con questo obiettivo, ma non è stato sottoposto ad audit |
| Verifica degli obblighi applicabili | Decisione | Obbligatorio | Compliance | ⬜ | Pagina Accessibilità | L. 4/2004 e modifiche: dipende da dimensioni e servizi offerti |
| Dichiarazione di accessibilità e canale per segnalazioni | Documento | Se applicabile | Compliance / AURFIN | 🟡 | Pagina Accessibilità | Struttura presente |

## 11. Recapiti e sede

| Cosa serve | Tipo | Priorità | Chi lo fornisce | Stato | Dove viene usato | Note |
|---|---|---|---|---|---|---|
| Email pubblica sul dominio aziendale | Informazione | Obbligatorio | AURFIN | ✅ | Contatti, footer, risposte dei clienti ai preventivi | info@aurfin.it (`contacts.email`): il dominio ha la posta su Aruba. È l'unico recapito sul sito: telefono, orari, mappa e WhatsApp non vengono mostrati. Va letta ogni giorno lavorativo |
| Validazione del testo dell'email di preventivo | Decisione | Obbligatorio | Compliance / mandante | ⬜ | Scheda pratica, «Rispondi con il preventivo» | Verificare cosa può contenere un preventivo via email e quali documenti informativi vanno consegnati |
| Conferma dell'impegno «entro un giorno lavorativo» | Decisione | Obbligatorio | AURFIN | 🟡 | Sito, conferma al cliente (`firstResponsePromise`) | Pubblico e vincolante nei fatti: serve chi risponde ogni giorno, anche durante le assenze |

## 12. Team e contenuti

| Cosa serve | Tipo | Priorità | Chi lo fornisce | Stato | Dove viene usato | Note |
|---|---|---|---|---|---|---|
| Presentazione aziendale e storia reale | Informazione | Consigliato | AURFIN | ⬜ | Chi siamo | Oggi il testo è generico per scelta |
| Persone da mostrare: nomi, ruoli, foto, consenso | Documento | Consigliato | AURFIN | ⬜ | Chi siamo (`team` in `site.ts`) | La sezione compare solo con dati reali |
| Conferma degli impegni di servizio | Decisione | Obbligatorio | AURFIN | 🟡 | Home, Chi siamo, Come funziona | Scritti come impegni: vanno rispettati nella pratica |
| Dati reali su clienti o volumi | Informazione | Se applicabile | AURFIN | ⬜ | Home | Da pubblicare solo se verificabili |
| Recensioni vere e autorizzate | Documento | Se applicabile | AURFIN | ⬜ | Home | Nessuna recensione è stata inserita |
| Referente per guide e aggiornamenti | Decisione | Consigliato | AURFIN | ⬜ | Sezione Guide | Serve una revisione periodica delle informazioni |

## 13. Brand

| Cosa serve | Tipo | Priorità | Chi lo fornisce | Stato | Dove viene usato | Note |
|---|---|---|---|---|---|---|
| Logo ufficiale in formato vettoriale (SVG o AI) | Documento | Consigliato | AURFIN / grafico | 🟡 | Header, footer, accessi, icona | Oggi è una ricostruzione dalla tavola fornita |
| Palette ufficiale | Informazione | Consigliato | AURFIN | ✅ | Tutto il sito | Già applicata |
| Font ufficiali, se esistono | Informazione | Se applicabile | AURFIN / grafico | ⬜ | Tutto il sito | Oggi: Source Serif 4, Inter, Montserrat |
| Titolarità di marchio e dominio | Documento | Consigliato | AURFIN | ⬜ | Protezione del brand | Verificare che siano intestati alla società |
| Immagine per le condivisioni social | Documento | Consigliato | AURFIN / grafico | ⬜ | Anteprime dei link | Non ancora presente |

## 14. Simulatore

| Cosa serve | Tipo | Priorità | Chi lo fornisce | Stato | Dove viene usato | Note |
|---|---|---|---|---|---|---|
| Decisione: restare configuratore o calcolare la rata | Decisione | Consigliato | AURFIN / compliance | ✅ | Home, pagine prodotto | Oggi è un configuratore, senza rate né costi. Non blocca la pubblicazione |
| Condizioni approvate (tassi, costi, durate, limiti, validità) | Documento | Se applicabile | Mandante | ⬜ | Simulatore | Necessarie solo per calcolare una rata |
| Esempio rappresentativo e avvertenze | Documento | Se applicabile | Compliance / mandante | ⬜ | Simulatore | Indispensabili se si mostrano valori economici |
| Procedura di aggiornamento delle condizioni | Decisione | Se applicabile | AURFIN / mandante | ⬜ | Simulatore | Evita di mostrare tassi scaduti |

## 15. Convenzioni

| Cosa serve | Tipo | Priorità | Chi lo fornisce | Stato | Dove viene usato | Note |
|---|---|---|---|---|---|---|
| Elenco delle convenzioni attive con enti o aziende | Documento | Se applicabile | AURFIN / mandante | ⬜ | Eventuali pagine dedicate | Pubblicare solo con accordo scritto |
| Autorizzazione a citare enti e aziende | Documento | Se applicabile | Ente / azienda | ⬜ | Eventuali pagine dedicate | Vale anche per i loghi |
| Codici dei canali di provenienza | Decisione | Consigliato | AURFIN | ⬜ | Link con `?canale=`, cruscotto | Permette di misurare quale canale porta pratiche |

## 16. Infrastruttura

| Cosa serve | Tipo | Priorità | Chi lo fornisce | Stato | Dove viene usato | Note e configurazione |
|---|---|---|---|---|---|---|
| Hosting con server nell'UE | Servizio | Obbligatorio | Fornitore tecnico | ⬜ | Tutta l'app | Serve un'istanza stabile con disco persistente. L'account va creato da AURFIN. `DATA_MODE=live` |
| Dominio del sito | Servizio | Obbligatorio | AURFIN | ⬜ | Tutta l'app | `NEXT_PUBLIC_SITE_URL` |
| Accesso alla gestione DNS | Informazione | Obbligatorio | AURFIN / registrar | ⬜ | Dominio, email | Anche i record SPF, DKIM e DMARC |
| Certificato HTTPS | Servizio | Obbligatorio | Hosting | ⬜ | Tutta l'app | Di solito incluso nell'hosting |
| Indirizzo dedicato al team | Decisione | Consigliato | AURFIN | ⬜ | Spazio team | `TEAM_HOST`, per esempio team.dominio |
| Email aziendale per invii e notifiche | Servizio | Obbligatorio | AURFIN / provider | 🟡 | Notifiche, email ai clienti | Oggi funziona con Gmail, solo per le prove. `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM`, `NOTIFY_EMAIL_TO` |
| Storage privato dei documenti | Servizio | Obbligatorio | Fornitore tecnico | 🟡 | Documenti | Oggi cartella locale. Serve cifratura, accessi limitati e antivirus. `STORAGE_DRIVER`, `STORAGE_LOCAL_DIR` |
| Scansione antivirus dei file | Servizio | Consigliato | Fornitore tecnico | ⬜ | Caricamento documenti | Oggi si controllano tipo e contenuto, non i virus |
| Database in produzione | Servizio | Obbligatorio | Fornitore tecnico | 🟡 | Tutti i dati | SQLite va bene con una sola istanza. Prevedere Postgres se si passa a più istanze. `DATABASE_PATH` |
| Backup automatici e prova di ripristino | Servizio | Obbligatorio | Fornitore tecnico | ⬜ | Database e documenti | Devono essere cifrati, nell'UE e con tempi coerenti con la conservazione |
| Monitoraggio e avvisi di errore | Servizio | Consigliato | Fornitore tecnico | ⬜ | Tutta l'app | Controllo di disponibilità e registrazione errori, senza dati personali |
| Segreti di produzione | Informazione | Obbligatorio | Fornitore tecnico | ⬜ | Sessioni e link | `SESSION_SECRET` (minimo 32 caratteri), `SITE_ACCESS_KEY` solo per la versione di prova |
| Disattivazione della modalità revisione | Decisione | Obbligatorio | AURFIN | ⬜ | Tutto il sito | `NEXT_PUBLIC_REVIEW_MODE=false` solo a contenuti approvati |
| WhatsApp Business Cloud API | Servizio | Se applicabile | AURFIN / Meta | ⬜ | Notifiche al team | Numero dedicato e modello approvato. `NOTIFY_WHATSAPP_TO`, `WHATSAPP_TOKEN`, `WHATSAPP_PHONE_NUMBER_ID`, `WHATSAPP_TEMPLATE` |
| Calendario dei consulenti | Servizio | Se applicabile | Fornitore tecnico | ⬜ | Consulenze, appuntamenti | Oggi gli appuntamenti si gestiscono nello spazio team. `CALENDAR_PROVIDER` |
| Firma elettronica | Servizio | Se applicabile | Mandante / fornitore | ⬜ | Fase contrattuale | Spesso è già nel flusso del mandante |
| Identificazione con SPID o CIE | Servizio | Se applicabile | Mandante / fornitore | ⬜ | Identificazione | Richiede accordi con i provider e parere della compliance |
| Collegamento al portale del mandante | Servizio | Se applicabile | Mandante / fornitore | ⬜ | Spazio team | Oggi è prevista l'esportazione dei dati |

## 17. Sicurezza

| Cosa serve | Tipo | Priorità | Chi lo fornisce | Stato | Dove viene usato | Note |
|---|---|---|---|---|---|---|
| Elenco degli utenti del team, con ruolo ed email aziendale | Informazione | Obbligatorio | AURFIN | ⬜ | Spazio team | I profili attuali sono dimostrativi |
| Primo amministratore reale | Informazione | Obbligatorio | AURFIN | ⬜ | Spazio team | `TEAM_ADMIN_EMAIL`, `TEAM_ADMIN_NAME` |
| Verifica in due passaggi per il personale | Decisione | Obbligatorio | AURFIN / fornitore tecnico | 🟡 | Accesso al team | Da verificare in produzione con l'email aziendale |
| Test di sicurezza indipendente | Servizio | Consigliato | Auditor esterno | ⬜ | Tutta l'app | Da fare prima di trattare documenti reali |
| Limiti di frequenza condivisi | Servizio | Se applicabile | Fornitore tecnico | ⬜ | Moduli e accessi | Oggi sono in memoria: bastano con una sola istanza |
| Politica di sicurezza dei contenuti (CSP) | Servizio | Consigliato | Fornitore tecnico | ⬜ | Tutta l'app | Non ancora attiva |
| Procedura per uscita o cambio di ruolo del personale | Documento | Obbligatorio | AURFIN | ⬜ | Spazio team | Revoca immediata degli accessi |
| Sicurezza dei dispositivi di lavoro | Documento | Consigliato | AURFIN | ⬜ | Uso interno | I documenti scaricati escono dall'archivio protetto |

## 18. Operatività del team e procedure interne

| Cosa serve | Tipo | Priorità | Chi lo fornisce | Stato | Dove viene usato | Note |
|---|---|---|---|---|---|---|
| Chi riceve e assegna le nuove richieste | Decisione | Obbligatorio | AURFIN | ⬜ | Spazio team, notifiche | Assegnazione manuale o automatica |
| Tempo massimo interno per il primo contatto | Decisione | Consigliato | AURFIN | ⬜ | Solleciti al team | `FIRST_CONTACT_ALERT_HOURS` (predefinito 24 ore) |
| Copione del primo contatto | Documento | Consigliato | AURFIN / compliance | ⬜ | Uso interno | Coerente con le promesse del sito |
| Corrispondenza tra stati della pratica e flusso reale | Decisione | Consigliato | AURFIN / mandante | 🟡 | Spazio team, area clienti | Da confermare con la pratica reale |
| Testi delle email ai clienti | Documento | Obbligatorio | AURFIN / compliance | 🟡 | Conferme e aggiornamenti | Da approvare prima dell'attivazione |
| Regole per i rinnovi | Decisione | Consigliato | Compliance / mandante | 🟡 | Spazio team (rinnovi) | Il riferimento del 40% della durata è da verificare. Si modifica in `RENEWAL_FRACTION` (src/lib/domain.ts) |
| Procedura per le richieste non proseguite | Documento | Consigliato | AURFIN | ⬜ | Spazio team | Motivo, comunicazione al cliente, conservazione |
| Formazione del team sullo strumento | Decisione | Consigliato | AURFIN | ⬜ | Spazio team | Prima della pubblicazione |

## 19. Assicurazioni e altri adempimenti

| Cosa serve | Tipo | Priorità | Chi lo fornisce | Stato | Dove viene usato | Note |
|---|---|---|---|---|---|---|
| Polizza RC professionale valida e rinnovata | Documento | Obbligatorio | AURFIN / assicuratore | ⬜ | Uso interno | Il rinnovo va comunicato all'OAM: [circolare](https://www.organismo-am.it/documenti/Circolari/Circolare%20Polizze%20Assicurative%20.pdf). Verificare i termini vigenti |
| Polizza per rischi informatici | Documento | Consigliato | AURFIN / assicuratore | ⬜ | Uso interno | Utile perché si conservano documenti di identità |
| Attività assicurativa connessa, se svolta | Documento | Se applicabile | AURFIN / compliance | ⬜ | Testi del sito | Lo statuto la prevede solo con le relative iscrizioni: oggi il sito non la presenta |
| Bilanci e adempimenti societari in regola | Documento | Consigliato | Commercialista | 🟡 | Uso interno | La visura riporta depositi di bilancio del 2025 con pratica aperta: verificarne l'esito |
| Contributi e comunicazioni periodiche all'OAM | Documento | Se applicabile | AURFIN / OAM | ⬜ | Uso interno | Verificare le circolari vigenti |
| Contratti con collaboratori e fornitori | Documento | Se applicabile | AURFIN / legale | ⬜ | Uso interno | Riservatezza e trattamento dei dati |
| Termini d'uso dell'area clienti | Documento | Consigliato | Legale / compliance | ⬜ | Area clienti | Oggi non presenti |

---

> ### Le 4 cose da fare per prime
>
> 1. **Fornire i contratti di mandato**: da questi dipendono prodotti, testi e nomi da indicare sul sito.
> 2. **Recuperare la polizza RC**: copia della polizza valida.
> 3. **Coinvolgere il consulente privacy**: DPIA, buste paga, tempi di conservazione, ruoli e informativa.
> 4. **Far validare i testi e definire antiriciclaggio e reclami**: contenuti segnati «Da validare», adeguata verifica, procedura reclami.
>
> Stato dell'impresa e iscrizione OAM sono chiariti dai documenti ricevuti. Infrastruttura, utenti e recapiti si possono completare in parallelo: non servono a nulla finché il mandato non è chiuso.
