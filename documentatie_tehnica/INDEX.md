# Harta documentației HUB AUTO v2

Acesta este indexul canonic al documentației. Selectează documentele după sarcină;
nu citi toate fișierele implicit. Codul actual și starea live verificată a mediului
țintă rămân autoritative. Raportează contradicțiile înainte de a acționa asupra lor.

**Reconciliere locală — 03.11.2026.** Acest index se aplică repository-ului principal
`/media/aza/Depozit_Mint/HUB_v2`. Verifică branch-ul activ și mediul țintă la fiecare
sarcină; nicio ramură nu este presupusă permanentă. Fișierele acestui checkout
sunt autoritative pentru existență, căi/importuri și implementarea statică.

Documentația a fost importată din mirror-ul separat `/home/aza/HUB AUTO/HUB_v2-LAB`.
Dovezile LAB, confirmările istorice de producție și planurile/prototipurile își
păstrează proveniența.

**Catalog producție verificat live — 03.11.2026:** auditul read-only furnizat de
utilizator provine din integrarea Supabase conectată, pentru `HUB_Service_Auto` /
`xyovkxmtbvgcwavuyxxu`. Inventarul și proveniența sunt în [03](03_SUPABASE.md),
iar sinteza de preluare în [22](22_STADIU_RLS_SI_DIRECTIE_SIMPLITATE.md).
Actualizarea documentară nu a accesat Supabase și nu a schimbat mediul live.
LAB `smrrvkyyywtferhlrjnn` era **INACTIVE**, fără audit live nou; comparațiile și
rezultatele sale din 21.10.2026 rămân istorice. Autorizarea funcțională RLS,
rolurile de business, compatibilitatea frontendului publicat și comportamentul
în browser rămân **NEEDS_REVIEW**.

Inventar: 31 de fișiere Markdown sub acest director, inclusiv indexul. Căile din
inventar sunt relative la rădăcina repository-ului; linkurile sunt relative la
acest fișier. Artefactele istorice absente sunt indicate prin căi în cod inline,
fără linkuri locale spre fișiere inexistente.

**EP — 05.11.2026:** cele nouă runtime sunt integrate în `feature-responsive`;
backendul este instalat și verificat read-only. Frontendul nu este publicat.
[Handoff și manifest](../HANDOFF_CODEX.md),
[stadiu](evidenta_piese/PLAN_EVIDENTA_PIESE.md),
[verificare finală DB/API și limite](03_SUPABASE.md#ep-productie-verificat-20261105).

## Interpretarea statutului

| Statut | Sens |
|---|---|
| CURRENT | Punct de intrare verificat în această intervenție documentară |
| REFERENCE | Referință tehnică utilă în limitele și la data indicate; nu certifică starea live actuală |
| PLAN | Propunere sau document de lucru; nu acordă aprobare de implementare |
| HISTORICAL | Audit, jurnal, rezultate trecute sau etapă încheiată/înlocuită |
| PROTOTYPE | Demonstrație ori experiment; nu dovedește integrare funcțională |
| NEEDS_REVIEW | Acoperirea ori valabilitatea actuală necesită confirmare; motivul este indicat în inventar |

Un document poate conține atât actualizări, cât și arhivă. Citește întâi nota datată
de stadiu, apoi numai secțiunea necesară. Eticheta descrie folosirea documentului,
nu aplicarea unui SQL, succesul unui test sau autorizarea unei operații.
Documentul 22 este reperul central pentru **catalogul de producție verificat la 03.11.2026** și limitele sale;
comparația LAB/producție din 21.10 este istorică. Formulările vechi RLS OFF/NEAPLICAT
și avertismentul depășit Security Definer pentru VIEW din arhive nu descriu catalogul actual.

## Task routing — alegerea documentelor

După [regulile AI](../AGENTS.md), folosește rândul relevant și inspectează sursa reală.
Numerele din tabel sunt linkuri către fișierele complete din inventarul de mai jos.

| Sarcină | Lectură selectivă | Verificare necesară înainte de implementare |
|---|---|---|
| UI sau responsive | [Design](DESIGN_SYSTEM_HUB.md), [resurse](01_ARHITECTURA.md), [catalog vizual](referinte_vizuale/INDEX.md) | Pagina încărcată, cascada CSS, stări și breakpoint-uri; capturile sunt exemple |
| Un modul anume | [Module](02_MODULE.md), [fluxuri](05_FLUXURI_PRINCIPALE.md), [integrări](06_DEPENDENTE_SI_INTEGRARI.md), documentul tematic | Handler, resurse, consumatori actuali; 02 include frontendul EP local și backendul instalat |
| Query-uri sau schemă Supabase | [03](03_SUPABASE.md), [09](09_MATRICE_ACCES.md), [22](22_STADIU_RLS_SI_DIRECTIE_SIMPLITATE.md), [06](06_DEPENDENTE_SI_INTEGRARI.md) | Catalog, politici, granturi și consumatori actuali; schema cere aprobare explicită |
| Autentificare, roluri sau RLS | [22](22_STADIU_RLS_SI_DIRECTIE_SIMPLITATE.md), [04](04_ROLURI_SI_ACCES.md), [09](09_MATRICE_ACCES.md), [12](12_TESTE_ACCES.md); [10](10_PLAN_RLS.md)/[11](11_PLAN_ROLLBACK.md) pentru pachete | Aprobare explicită; nu reactiva planurile AUTH suspendate sau seriile vechi |
| Deviz Final sau Avansuri | [17](17_MODIFICARI_AVANSURI_2026-10-14_15.md), [05](05_FLUXURI_PRINCIPALE.md), [03](03_SUPABASE.md); [20 ciorne](20_DEVIZ_FINAL_CIORNE_LOCALE_2026-10-17.md) dacă e relevant | RPC, import, totaluri și print; ciornele locale sunt distincte de datele salvate |
| Manager Dashboard | [18 redesign](18_MANAGER_DASHBOARD_REDESIGN.md), [19](19_MANAGER_V2_FISIERE_DEPLOY.md), [09](09_MATRICE_ACCES.md); [15](15_OPTIMIZARI_IMPLEMENTATE.md) pentru performanță | Sursele active din modules/manager/ și integrarea HUB; nu prototipul obsolete |
| Evidență Facturi & Piese | [Plan/stadiu candidat](evidenta_piese/PLAN_EVIDENTA_PIESE.md), [handoff](../HANDOFF_CODEX.md), [02](02_MODULE.md), [03](03_SUPABASE.md) | Transfer local efectuat; backend EP instalat/verificat read-only, acceptanță browser restantă |
| Deploy sau transfer în producție | [23](23_INVENTAR_TRANSFER_PRODUCTIE.md), [19](19_MANAGER_V2_FISIERE_DEPLOY.md), documentul funcției | 23 este comparație istorică LAB; generează un inventar nou și compară ținta înainte de transfer; aprobare explicită obligatorie |
| Investigație de performanță | [15](15_OPTIMIZARI_IMPLEMENTATE.md), apoi [13](13_AUDIT_PERFORMANTA.md)/[14](14_PLAN_OPTIMIZARE.md) pentru context | Măsoară versiunea actuală; nu reaplica remedieri istorice |
| Curățenie distructivă sau plan de rollback | [16](16_CURATENIE_PROIECT.md), [07](07_RISCURI_SI_ZONE_SENSIBILE.md), [06](06_DEPENDENTE_SI_INTEGRARI.md), [11](11_PLAN_ROLLBACK.md); [10](10_PLAN_RLS.md)/[22](22_STADIU_RLS_SI_DIRECTIE_SIMPLITATE.md) pentru DB | Analiza nu modifică fișiere; execuția cere inventar actual, backup verificat, rollback, ținte exacte și aprobare explicită |

## Inventarul Markdown

### Pornire și vedere de ansamblu

| Cale exactă | Statut | Conținut și limite |
|---|---|---|
| [documentatie_tehnica/INDEX.md](INDEX.md) | CURRENT | Harta canonică și rutarea după sarcină; inventar documentar verificat la 03.11.2026. |
| [HANDOFF_CODEX.md](../HANDOFF_CODEX.md) | CURRENT | Transfer EP din 05.11: 9 runtime, 3 SQL instalate, hash-uri și limite înainte de publicare. |
| [documentatie_tehnica/AI_START_HERE.md](AI_START_HERE.md) | REFERENCE | Ghid reconciliat pentru repository-ul principal la 03.11; păstrează istoricul LAB din 21–22.10 și separă starea statică de live. |
| [documentatie_tehnica/00_OVERVIEW.md](00_OVERVIEW.md) | REFERENCE | Scopul aplicației și delimitarea checkout-ului principal la 03.11; sinteza din 21.10 și actualizările LAB/producție rămân istorice. |

### Arhitectură și module

| Cale exactă | Statut | Conținut și limite |
|---|---|---|
| [documentatie_tehnica/01_ARHITECTURA.md](01_ARHITECTURA.md) | REFERENCE | Arhitectură statică locală reconciliată; arborele LAB și stările DB din corp sunt istorice, fără inventar live nou. |
| [documentatie_tehnica/02_MODULE.md](02_MODULE.md) | NEEDS_REVIEW | Inventar static reconciliat: Manager/căutare/ciorne, acces frontend Admin și frontendul EP transferat/backendul instalat. Browserul rămâne neverificat; probele DB EP sunt în 03. |

### UI și sistem vizual

| Cale exactă | Statut | Conținut și limite |
|---|---|---|
| [documentatie_tehnica/DESIGN_SYSTEM_HUB.md](DESIGN_SYSTEM_HUB.md) | REFERENCE | Manual static din codul LAB: fonturi, palete locale, componente, stări și praguri responsive; fără verificarea stilurilor randate în browser. |

### Supabase, autentificare, roluri și RLS

| Cale exactă | Statut | Conținut și limite |
|---|---|---|
| [documentatie_tehnica/22_STADIU_RLS_SI_DIRECTIE_SIMPLITATE.md](22_STADIU_RLS_SI_DIRECTIE_SIMPLITATE.md) | NEEDS_REVIEW | Actualizare RLS EP verificată read-only la 05.11; catalogul general la 03.11 din auditul furnizat; comparația LAB din 21.10 este istorică. Autorizarea efectivă și frontendul publicat rămân NEEDS_REVIEW. |
| [documentatie_tehnica/03_SUPABASE.md](03_SUPABASE.md) | NEEDS_REVIEW | EP instalat/verificat live read-only la 05.11: RPC, RLS/ACL, Data API și DF; acceptanța browser/scrieri rămâne NEEDS_REVIEW. Auditul general 03.11 și detaliile LAB 21.10 rămân datate. |
| [documentatie_tehnica/04_ROLURI_SI_ACCES.md](04_ROLURI_SI_ACCES.md) | NEEDS_REVIEW | Roluri, bife, login, rutare și diferențe UI–DB; amestecă stadiul 21.10 cu arhivă. Accesul efectiv actual nu a fost retestat aici. |
| [documentatie_tehnica/09_MATRICE_ACCES.md](09_MATRICE_ACCES.md) | NEEDS_REVIEW | Matrice S/I/U/D extrasă din politici la 21.10, citiri contextuale și limite; vechile propuneri sunt arhivate. Necesită catalog actual înainte de schimbări. |
| [documentatie_tehnica/10_PLAN_RLS.md](10_PLAN_RLS.md) | HISTORICAL | Registru istoric RLS; cele zece directoare de pachete SQL/rollback lipsesc din acest checkout. Căile se păstrează ca referințe indisponibile, fără reexecuție. |
| [documentatie_tehnica/20_RLS_SERIA_1_TABELE_SIMPLE.md](20_RLS_SERIA_1_TABELE_SIMPLE.md) | HISTORICAL | Stadiul Contracte/TODO la 21.10 și arhiva propunerii comune Seria 1; vechea etichetă NEAPLICAT nu descrie acel stadiu. |
| [documentatie_tehnica/21_RLS_SERIA_0_AUTH_PROFILES.md](21_RLS_SERIA_0_AUTH_PROFILES.md) | HISTORICAL | Protecția minimă a rolurilor/bifelor consemnată activă și arhiva Seriei 0 integrale; AUTH avansat/Turnstile sunt consemnate suspendate. |

### Fluxuri principale și integrări

| Cale exactă | Statut | Conținut și limite |
|---|---|---|
| [documentatie_tehnica/05_FLUXURI_PRINCIPALE.md](05_FLUXURI_PRINCIPALE.md) | REFERENCE | Fluxuri clienți, constatări, devize, avansuri, stoc, fotografii și Manager; separă salvarea RPC, ciorna și printul; include actualizări și arhivă datate. |
| [documentatie_tehnica/06_DEPENDENTE_SI_INTEGRARI.md](06_DEPENDENTE_SI_INTEGRARI.md) | REFERENCE | Graful de date și consumatori; CDN, Supabase, R2/Drive/OCR, Apps Script și Google Sheets. Disponibilitatea serviciilor nu este confirmată prin acest index. |

### Riscuri, teste de acces și rollback

| Cale exactă | Statut | Conținut și limite |
|---|---|---|
| [documentatie_tehnica/07_RISCURI_SI_ZONE_SENSIBILE.md](07_RISCURI_SI_ZONE_SENSIBILE.md) | NEEDS_REVIEW | Registru de riscuri și restanțe din 21.10, cu constatări istorice depășite explicit marcate; riscurile active necesită verificarea stării actuale. |
| [documentatie_tehnica/11_PLAN_ROLLBACK.md](11_PLAN_ROLLBACK.md) | REFERENCE | Referință istorică de rollback; pachetele și scripturile Seria 0/1 invocate sunt absente aici. Modelele pot restaura acces larg; fără autorizare de execuție. |
| [documentatie_tehnica/12_TESTE_ACCES.md](12_TESTE_ACCES.md) | HISTORICAL | Dovezi istorice LAB și confirmări istorice de producție distincte; README/rezultatele pachetelor lipsesc aici. Nicio suită rerulată în checkout. |

### Performanță și optimizare

| Cale exactă | Statut | Conținut și limite |
|---|---|---|
| [documentatie_tehnica/15_OPTIMIZARI_IMPLEMENTATE.md](15_OPTIMIZARI_IMPLEMENTATE.md) | REFERENCE | Registru al optimizărilor, cu reconciliere LAB la 22.10; separă validările de producție din 13.10 de evoluțiile ulterioare Manager/căutare. |
| [documentatie_tehnica/13_AUDIT_PERFORMANTA.md](13_AUDIT_PERFORMANTA.md) | HISTORICAL | Audit read-only din 12.10: requesturi, polling, statistici și limite. Citește mai întâi 15 pentru remedierile consemnate. |
| [documentatie_tehnica/14_PLAN_OPTIMIZARE.md](14_PLAN_OPTIMIZARE.md) | PLAN | Quick wins și propuneri medii/structurale, cu puncte deja rezolvate și polling Generator păstrat intenționat; nu este backlog obligatoriu. |

### Manager Dashboard

| Cale exactă | Statut | Conținut și limite |
|---|---|---|
| [documentatie_tehnica/18_MANAGER_DASHBOARD_REDESIGN.md](18_MANAGER_DASHBOARD_REDESIGN.md) | REFERENCE | Manager integrat în LAB: KPI, calendar, căutare comună, plăți și Dezmembrări. Testare manuală raportată la 16.10; publicarea acestei versiuni nu este confirmată. |

### Deviz Final și Avansuri

| Cale exactă | Statut | Conținut și limite |
|---|---|---|
| [documentatie_tehnica/17_MODIFICARI_AVANSURI_2026-10-14_15.md](17_MODIFICARI_AVANSURI_2026-10-14_15.md) | HISTORICAL | Jurnalul integrării avansurilor: eligibilitate, RPC atomic, totaluri și print; include confirmarea istorică de producție și restanțe punctuale. |
| [documentatie_tehnica/20_DEVIZ_FINAL_CIORNE_LOCALE_2026-10-17.md](20_DEVIZ_FINAL_CIORNE_LOCALE_2026-10-17.md) | REFERENCE | Contractul ciornelor locale DF: izolare, recuperare, conflicte și ștergere; teste locale și acceptanță manuală restantă. Nu echivalează ciorna cu salvarea Supabase. |

### Transfer în producție și publicare

| Cale exactă | Statut | Conținut și limite |
|---|---|---|
| [documentatie_tehnica/19_MANAGER_V2_FISIERE_DEPLOY.md](19_MANAGER_V2_FISIERE_DEPLOY.md) | REFERENCE | Liste istorice LAB pentru Manager/ciorne; implementările există static și aici. Nu este inventar actual de livrare sau dovadă de publicare. |
| [documentatie_tehnica/23_INVENTAR_TRANSFER_PRODUCTIE.md](23_INVENTAR_TRANSFER_PRODUCTIE.md) | HISTORICAL / NEEDS_REVIEW | Comparație LAB cu propriul HEAD: 29 diferențe istorice. Audit local 03.11: 8 hash-uri identice, 18 diferite, 3 fișiere absente. Inventar nou obligatoriu înainte de transfer; publicarea rămâne neverificată. |

### Referințe vizuale

| Cale exactă | Statut | Conținut și limite |
|---|---|---|
| [documentatie_tehnica/referinte_vizuale/INDEX.md](referinte_vizuale/INDEX.md) | REFERENCE | Catalogul celor 12 JPEG LAB din 21–22.10: proveniență și limite DEMONSTRATIV, formulare nesalvate și blocaje; capturile nu probează persistența ori deploy-ul. |

### Rapoarte istorice, lucrări încheiate și planuri

| Cale exactă | Statut | Conținut și limite |
|---|---|---|
| [documentatie_tehnica/08_RECOMANDARI.md](08_RECOMANDARI.md) | PLAN | Recomandări cu restanțe punctuale și propuneri istorice inclusiv React; secțiunea 21.10 păstrează direcția de simplitate, fără aprobare implicită de extindere. |
| [documentatie_tehnica/16_CURATENIE_PROIECT.md](16_CURATENIE_PROIECT.md) | HISTORICAL | Audit read-only din 13.10: copii, placeholder-e și candidați de arhivare. Lista este veche și nu dovedește că țintele sunt nefolosite acum. |
| [documentatie_tehnica/18_MANAGER_DASHBOARD_V2_PROTOTIP.md](18_MANAGER_DASHBOARD_V2_PROTOTIP.md) | HISTORICAL | Arhiva prototipului Manager declarat OBSOLETE; descrie rute eliminate și probe ale acelei etape, nu implementarea activă. |
| [documentatie_tehnica/evidenta_piese/PLAN_EVIDENTA_PIESE.md](evidenta_piese/PLAN_EVIDENTA_PIESE.md) | REFERENCE / NEEDS_REVIEW | Frontend EP transferat local, backend instalat/verificat read-only la 05.11; teste locale și acceptanță browser restantă. Corpul anterior păstrează istoricul DEMO/LAB. |

## Subfoldere și materiale care nu sunt Markdown

- [documentatie_tehnica/evidenta_piese/](evidenta_piese/) conține planul indexat mai sus
  și [referinte/demo2_claude.html](evidenta_piese/referinte/demo2_claude.html) — **PROTOTYPE**:
  pagină „Evidență Piese v2 · Demo 2”, cu stiluri și script proprii, referință UX.
  Nu este implementarea activă din [modules/stocuri/evidenta_piese.html](../modules/stocuri/evidenta_piese.html).
- [documentatie_tehnica/referinte_vizuale/](referinte_vizuale/) conține catalogul indexat
  și 12 imagini JPEG; folosește catalogul pentru proveniența fiecărei imagini.
- [documentatie_tehnica/test_ai/](test_ai/) conține doar
  [registru-lucrari.html](test_ai/registru-lucrari.html) — **PROTOTYPE**:
  demonstrație independentă cu lucrări fictive și interacțiuni locale în memorie;
  fără integrare Supabase sau navigare HUB. Nu conține fișiere Markdown.

## Artefacte istorice absente din checkout

Căile următoare sunt nume istorice în cod inline, **indisponibile local**.
Absența lor nu certifică existența externă, nu cere recreare și nu autorizează
importul sau execuția SQL. [10](10_PLAN_RLS.md) păstrează cele 38 de nume SQL/rollback;
[12](12_TESTE_ACCES.md) păstrează numele README/rezultatelor, exclusiv ca dovezi LAB.

- Pachete RLS sub `supabase/`: `contracte-production-package-20261019/`,
  `evidenta-awb-rls-20261019/`, `plati-manager-rls-20261019/`,
  `stoc-rls-20261020/`, `config-alerte-rls-20261020/`,
  `audit-logs-rls-20261020/`, `service-personal-rls-20261020/`,
  `avansuri-rls-20261020/`, `constatari-rls-20261021/`, `devize-rls-20261021/`.
- Migrații istorice absente: `supabase/migrations/20261018155917_rls_seria_1_contracte_todo.sql`
  și `supabase/migrations/20261018162136_rls_seria_0_auth_profiles.sql`.
- Scripturi istorice absente: `supabase/rls_seria_0_audit.sql`,
  `supabase/rls_seria_0_test.sql`, `supabase/rls_seria_0_rollback.sql`,
  `supabase/rls_seria_1_audit.sql`, `supabase/rls_seria_1_test.sql`,
  `supabase/rls_seria_1_rollback.sql`.
- AUTH/Turnstile LAB: `js/auth-security.js`, `js/turnstile-config.js`,
  `js/turnstile.js`, `supabase/auth-security-lab/`, `supabase/functions/hub-login/`;
  nu sunt dependențe runtime curente, vezi [06](06_DEPENDENTE_SI_INTEGRARI.md).
- Referințe externe istorice fără copie aici: `Pagini NOI HUB_v2/`, inclusiv
  `Pagini NOI HUB_v2/CLIENTS & REMINDERS/`; `README_DEMO_EVIDENTA_PIESE.md` și
  `CORECTARI_EVIDENTA_PIESE.md`; arhiva `manager-v1-original-LAB.zip`, consemnată
  ca livrată în afara repository-ului.
- Prototipurile `modules/manager/manager-v2.html`, `modules/manager/manager-v2.css`
  și `modules/manager/manager-v2.js` sunt eliminate istoric și absente aici.
  Imaginile 02–07 din catalogul vizual sunt deja marcate ABSENT în acel istoric;
  nu sunt dependențe și nu se reconstruiesc.

## Confirmări necesare și limite de utilizare

Documentele **NEEDS_REVIEW** sunt 02, 03, 04, 07, 09, 22 și 23, cu motivele din inventar.
Acoperirea statică Evidență Piese și diferențele frontend au fost reconciliate documentar.
Catalogul general este consemnat din auditul read-only furnizat la 03.11.2026,
completat de verificarea EP live read-only la 05.11 în 03;
autorizarea funcțională, riscurile din afara faptelor auditate, starea LAB, comportamentul
în browser și inventarul viitor de transfer cer verificări separate, autorizate potrivit sarcinii. 23 este istoric și rămâne NEEDS_REVIEW
pentru orice folosire ca bază a unui transfer.
Niciun document nu rămâne neclasificat în inventarul inspectat.

Nu este necesară o decizie pentru folosirea acestui index. O viitoare reorganizare,
curățenie, actualizare a altor documente sau operație de producție cere o cerere separată;
indexarea nu autorizează mutarea, arhivarea sau ștergerea materialelor existente.
