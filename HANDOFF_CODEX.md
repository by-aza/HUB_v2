# Handoff — transfer Evidență Facturi & Piese în feature-responsive

05.11.2026. Destinație: `/media/aza/Depozit_Mint/HUB_v2`, branch
`feature-responsive`, HEAD de pornire `c818458e22e560fd413733788a88bff039ca93ca`; working tree inițial
curat, zero staged. Sursă: `/home/aza/HUB AUTO/HUB_v2-LAB`, plan v2.3 §0.14 și
navigarea finală BIROU din handoff. Toate cele 12 hash-uri din manifestul sursă
au fost verificate înainte de transfer. LAB a rămas nemodificat.

**Transfer local efectuat; backend EP instalat și verificat read-only la 05.11.2026. Frontend nepublicat.**
Fișierele sunt unstaged, pentru review în GitKraken. Preflight-ul a făcut numai
SELECT-uri de catalog/ACL/precondiții în producție; fără export de date de business.

Verificarea finală confirmă 8 RPC-uri EP, 7 tabele RLS, 2 VIEW-uri invoker,
36 corpuri de funcții conforme și contractul DF păstrat. Data API refuză anon și
nu expune `ep_private`. [Dovezi și limite curente](documentatie_tehnica/03_SUPABASE.md#ep-productie-verificat-20261105).
Backup: arhivă verificată, restaurare reală încă nedemonstrată. Acceptanța în
browser cu sesiune reală și fluxurile de scriere rămân NEEDS_REVIEW.
În această verificare s-au modificat numai documente; fără commit/push/deploy.

## Manifest runtime exact — 9 fișiere

| Fișier | Operație | SHA256 rezultat |
|---|---|---|
| `modules/stocuri/evidenta_piese.html` | replace obsolete module DEMO with tested persistent module | `c9fe0489b174b9e16d6266ea39b5b3de85ba0310420bc32755b6b8e98601bc29` |
| `css/evidenta_piese.css` | replace obsolete module DEMO with tested persistent module | `f610aad6d0be4e11a645fbcfc75e7641d6894ea8c357fc43d17fed4504067770` |
| `js/evidenta_piese.js` | replace obsolete module DEMO with tested persistent module | `31e1673bc7f093b1ef0c8e417862e79e984198faae3e1430c6cebe82e6ddfb64` |
| `js/evidenta_piese_api.js` | new | `3ea9e2ab191cf9b1b9255bf6f4499ad6bb761f7171d7fe06512d01fa03d0431f` |
| `js/ep_df_import.js` | new | `11f1f9d4b9c53107309fee773a8af0fdd1b3ca38c5583a9cd0e0bda2eab409f3` |
| `index.html` | EP merge only | `caca8c52156f50c83b9f41b24ee9f6f9aa9bdd46fc55f53e9107adf4c67f72c8` |
| `modules/admin/admin.html` | EP merge only | `443b966ed7550288993e080f75dc687b632842205acbdeb4ebf33fb99ef7baf3` |
| `modules/devize/deviz_final.html` | EP merge only | `50eafc12a9e2ed7c8c44ea9e625c0bf68216e1ecd29c0b82a5824c2e48a8d05a` |
| `modules/devize/deviz-print.html` | EP merge only | `1179063b2510f8881b6cde133d84df896a3801373b042b11a7cea329f3341dde` |

Pentru index/Admin/DF/print s-au integrat numai deltele EP. Nu s-au copiat
`js/config.js`, loginul, Turnstile, auth-security, timeout-ul sau ciornele din LAB.
Admin păstrează exact codul său în afara bifei EP, etichetei/mapării și booleanului
strict al acelei bife. Guard-urile EP țintesc exclusiv proiectul destinației,
reutilizând configurația existentă. Navigarea finală: BIROU după Căutare Deviz,
turcoaz/NEW în sidebar și carduri, fără duplicare și cu tooltip rapid păstrat.

[Manifest JSON cu hash-urile sursă/înainte/rezultat și probele](documentatie_tehnica/evidenta_piese/TRANSFER_FEATURE_RESPONSIVE_20261105.json).

## SQL consolidat — instalat, nu se reaplică

1. [`01_PERSISTENTA_EP.sql`](documentatie_tehnica/evidenta_piese/productie/01_PERSISTENTA_EP.sql) — SHA256 `dd2d15938d78c2d6adb71e546e5271429237d08242f6f78fb7fd8ee5f86d511b`.
2. [`02_REGISTRU_FRONTEND_EP.sql`](documentatie_tehnica/evidenta_piese/productie/02_REGISTRU_FRONTEND_EP.sql) — SHA256 `4945b942ec0a4e8ef45ad5ddbf146cdc256a239b31a2cd1f4b6a456ebe226b08`.
3. [`03_IMPORT_DF_EP.sql`](documentatie_tehnica/evidenta_piese/productie/03_IMPORT_DF_EP.sql) — SHA256 `248faf897f657a2448cbdb5a16e430f8a90cfbb510fd34305be56659c3d3452c`.

Sunt surse revizuite în afara `supabase/migrations`, fără ID-uri de migrare noi.
Nu se aplică și drafturile componente/patch-urile LAB peste aceste consolidări.
Nu se copiază conturi, date LAB, receipt-uri, seed-uri sau migrări cleanup.
Catalogul instalat și verificările finale sunt în [03](documentatie_tehnica/03_SUPABASE.md#ep-productie-verificat-20261105).
Precondițiile de mai jos descriu pregătirea anterioară aplicării.
Definiția DF corespunde exact amprentei din LAB; nu s-a eliminat guard-ul.
La primul SQL s-a adăugat și verificarea resolverului de vehicul; al doilea
verifică existența celor șapte tabele EP. Corpurile de business sunt păstrate.

**Readiness curent:** catalogul instalat corespunde celor trei surse de mai sus,
cu hash-uri neschimbate. Istoricul remote are 8 înregistrări fără EP; aceasta nu
infirmă instalarea și nu autorizează rerularea ori repararea automată a istoricului.
Nu există blocaj de contract identificat; acceptanța live și recuperarea prin
restore real rămân limite deschise, detaliate în 03.

## Teste locale efectuate la transfer — istoric distinct de verificarea producției

- Static: **64 PASS** — scripturi inline/JS, căi, guard-uri, lipsa referințelor
  de proiect LAB, configurație și blocuri fără legătură cu EP păstrate.
- SQL izolat: **37 PASS**, trei surse aplicate numai local, exact șapte tabele și
  două VIEW-uri invoker. Regresii: cent/snapshot, editare istorică, duplicate,
  UUID/revizii, atomicitate, cantități retur/magazie/DF, DF-only și contract manual vechi.
- Chrome financiar: **34 PASS** — formular furnizor/IBAN/factură, reload,
  import parțial în DF, preț istoric, editare/resalvare/eliminare, discount,
  manoperă/avans, setare Admin, refuz acces, print și layout responsive.
  Auth/SDK sunt simulate; SQL-ul rulează numai în PostgreSQL local.
- Navigare Chrome: **118 PASS**, 320/390/640/768/769/1024/1440 px,
  fără overflow, ordinea/unicitatea, NEW, drawer, hover/active/tooltip și permisiuni.
- Capturi desktop/mobil și print inspectate. Linkuri și `git diff --check`: PASS.

Runner-ele/probele/backupurile temporare sunt în `/tmp/ep-transfer-20261105`. Comenzi locale de reluare
(fără backend live; PGlite instalat în `/tmp`, Playwright/Chrome existente):

```bash
/home/aza/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node /tmp/ep-transfer-20261105/tests/static.cjs /media/aza/Depozit_Mint/HUB_v2
/home/aza/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node /tmp/ep-transfer-20261105/tests/database.cjs /media/aza/Depozit_Mint/HUB_v2
/home/aza/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node /tmp/ep-transfer-20261105/tests/browser.cjs /media/aza/Depozit_Mint/HUB_v2
/home/aza/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node /tmp/ep-transfer-20261105/tests/navigation.cjs /media/aza/Depozit_Mint/HUB_v2
```

Aceste fișiere temporare pot dispărea; manifestul păstrează rezultatele și limitele.
Nu se rerulează runner-ele Auth/HTTP LAB nemodificate în producție.

## Conflicte, rollback și pași înainte de lansare

Nu s-au găsit conflicte de merge; diferențele Admin/Auth fără legătură cu EP au
fost excluse intenționat. Backendul necesar este acum instalat; publicarea
frontendului rămâne o acțiune separată, neexecutată în acest task.

Backupul fișierelor destinație și hash-urile inițiale sunt în `/tmp/ep-transfer-20261105/backup` și
`baseline.json`. Pentru revenirea locală se inversează numai patch-ul EP după
compararea hash-urilor curente; nu se face reset global și nu se șterge munca
ulterioară. Revenirea bazei necesită plan separat; după date reale preferă o
corecție compatibilă, fără DROP/ștergeri automate.

1. Review GitKraken al celor 9 runtime/3 SQL/documente, păstrând modificările
   locale existente. Nu reaplica SQL-urile deja instalate.
2. Închide limita backupului prin restore real într-un PostgreSQL 17/Supabase
   explicit izolat și disponibil; arhiva actuală nu dovedește singură recuperarea.
3. Acceptanță browser autorizată pe candidatul transferat: sesiune reală, Admin și
   operator cu bifa EP, refuz acces, facturi/reload, cantități, DF manual/import,
   discount/avans și print desktop/mobil. Testele care scriu date nu sunt autorizate
   de verificarea read-only; preferă o țintă izolată. Concurența rămâne de verificat.
4. După acceptanță și aprobare separată, publică frontendul. Bifa EP se acordă
   numai utilizatorilor selectați prin Admin existent; nu s-au schimbat bife acum.
   Firefox, imprimantă fizică, multipagină și volum rămân NEEDS_REVIEW.
