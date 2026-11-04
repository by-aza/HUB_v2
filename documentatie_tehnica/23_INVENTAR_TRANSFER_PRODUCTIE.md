# Comparație istorică frontend LAB — fără inventar actual de transfer

## Clasificare și audit local — 03.11.2026

**HISTORICAL / NEEDS_REVIEW pentru orice transfer viitor.** Registrul original
de mai jos compara **29 diferențe LAB față de propriul HEAD**; nu este un inventar
valid pentru branch-ul curent al repository-ului principal.

Auditul static a comparat cele 29 hash-uri istorice cu fișierele din
`/media/aza/Depozit_Mint/HUB_v2`: **8 hash-uri identice, 18 diferite și 3 fișiere
absente**. Cele absente sunt `js/auth-security.js`, `js/turnstile-config.js` și
`js/turnstile.js`, fără dependențe runtime în sursele locale inspectate.
Managerul, căutarea comună și ciornele sunt deja prezente static aici.

Această numărătoare delimitează istoricul; nu stabilește diferențele aprobate de
publicat și nu dovedește versiunea live. **Un inventar nou de transfer trebuie
generat înainte de orice transfer viitor în producție**, după verificarea
branch-ului activ, fișierelor, dependențelor și țintei reale. Nu s-a generat un
inventar nou de deploy în această reconciliere.

Tabelul SHA256 și clasificările de mai jos rămân dovezi LAB din 19–21.10.2026;
„local”, „actual”, „funcțional” și „HOLD” se referă la acel context.
`supabase/auth-security-lab/` și `supabase/functions/hub-login/` sunt artefacte
istorice LAB absente din checkout-ul principal. Publicarea, autorizarea DB și
comportamentul în browser rămân **NEEDS_REVIEW**. Nu se reexecută SQL și nu se
copiază configurația LAB.

Actualizare **21.10.2026**, numai documentară. Baza comparației: working tree și fișierele neversionate din /home/aza/HUB AUTO/HUB_v2-LAB față de HEAD-ul aceluiași checkout. Nu este comparație cu frontendul publicat sau cu o altă copie a proiectului principal. Acea copie nu a fost accesată; versiunea ei exactă rămâne UNKNOWN.

## 1. Ce este necesar pentru RLS

Ultimele activări RLS, inclusiv Devize, au fost implementate fără schimbarea frontendului sau a loginului. **Nu există un transfer frontend nou obligatoriu doar pentru a porni RLS-ul deja activ.** Guard-ul UPSERT este în SQL-ul devize, nu într-un patch JS.

Nu se copiază întreg working tree-ul, configurația LAB, cheile sau referințele LAB în proiectul principal. js/config.js și inițializările inline se păstrează pentru mediul țintă. Nu se generează și nu se aplică artefacte de deploy prin această actualizare.

## 2. Rezultatul inventarului

**29 fișiere runtime:** 11 diferențe exclusiv de izolare a mediului LAB, 10 candidați funcționali, 6 fișiere mixte/HOLD, 2 Turnstile suspendate. Toate cele 29 hash-uri coincid cu registrul din 19.10.2026; clasificarea a fost reconciliată acum. Etapele RLS ulterioare nu au schimbat aceste surse.

„Funcțional” înseamnă de sincronizat numai dacă diferența aprobată lipsește din proiectul principal; nu afirmă că lipsește sau că versiunea LAB este deja pregătită pentru copiere. Modificările de avansuri/print confirmate anterior nu se retrimit automat.

| Fișier | Dispoziție | Motiv / conținut observat | Ref LAB în sursă | SHA256 sursă LAB |
|---|---|---|---|---|
| `css/local-deviz-drafts.css` | FUNCȚIONAL — sincronizare dacă lipsește în principal | Ciorne locale, stiluri | nu după ref | `83aabe691dfd6d626aa2167826ed680f7d18d4386e2553b48f4a9639f47df200` |
| `index.html` | FUNCȚIONAL — sincronizare dacă lipsește în principal | Manager/ciorne și optimizări dashboard; conține și configurare de mediu | DA | `b9afd02cf9bd0a65c9aaf171a4005dbc2039128934f58de35a9c2c64e2358fa4` |
| `js/auth-security.js` | MIXT / HOLD — reconciliere punctuală | MIXT: ramura AUTH suspendată + helper-ele pasive de bife/etichete folosite de pagini | nu după ref | `5cac4b04abed3385629e8f7f4a1e91b477dc23d7283e35ee4b9aaa1ae9b5a043` |
| `js/config.js` | LAB-ONLY — izolare mediu; nu transfera | Numai URL/cheie/inițializare client LAB față de HEAD | DA | `3526d72eac2670fd8dee82e64cedf0de0e501326bd6fc03eb3f88e8c9169079c` |
| `js/constatari_v2.js` | FUNCȚIONAL — sincronizare dacă lipsește în principal | Optimizare încărcare paralelă relații/audit și corecție de concurență a încărcării | nu după ref | `73cc784cc9703d5656a2306f7031482057905cb9327339812d7f3204017590f3` |
| `js/dezmembrari.js` | MIXT / HOLD — reconciliere punctuală | Integrare helper pasiv de etichete; dependență mixtă AUTH | nu după ref | `0e110056a4b4605cf4fa02d97bb7813f34605151e18c66af32d8bab8e07f1878` |
| `js/local-deviz-drafts.js` | FUNCȚIONAL — sincronizare dacă lipsește în principal | Ciorne locale Deviz Final | nu după ref | `4eb2aba729cc7b651f9f7dd000faf7ef9cbb06e77f442ac85225af351b71665a` |
| `js/session-timeout.js` | FUNCȚIONAL — sincronizare dacă lipsește în principal | Eveniment hub:before-signout pentru salvarea ciornelor; timeoutul nu se reinventează | nu după ref | `9d0a8c39a3fcdf091320fc5c1742be9d7cad19d89d8b27f0d24d0d917cdcbc66` |
| `js/turnstile-config.js` | SUSPENDAT / EXCLUS | Configurare Turnstile suspendată, enabled=false | nu după ref | `30584e1a74970a47ea20423acc975f623bd4a4ba5f1f106f782313fd260697fc` |
| `js/turnstile.js` | SUSPENDAT / EXCLUS | Cod Turnstile suspendat; getToken returnează null în modul actual dezactivat | DA | `c2b6d9e599a85c5220ea353e8dbbd15c97410ba3462d12113f21dd62b6e26696` |
| `modules/admin/admin.html` | MIXT / HOLD — reconciliere punctuală | MIXT: etichete/merge bife și pagini administrative; configurare LAB | DA | `cbdcc6d7c157fd0ef73e4f301818c95c08bc5b753d03c6c549ee99dc92b443d1` |
| `modules/admin/login.html` | MIXT / HOLD — reconciliere punctuală | MIXT: ciorne + cod AUTH/Turnstile suspendat; loginul actual se păstrează | nu după ref | `061b8d46f87a3111930fabb24caaa65f147f6beae8ea6c687229471428a362f1` |
| `modules/admin/panou_control.html` | MIXT / HOLD — reconciliere punctuală | MIXT: merge care păstrează bifele necunoscute și helper pasiv | nu după ref | `0319a8a697f85f5dd45dd893b917a7645498614f3e13a69ff733786c14a0fb05` |
| `modules/devize/cautare_devize.html` | LAB-ONLY — izolare mediu; nu transfera | Numai URL/cheie/inițializare client LAB față de HEAD | DA | `8d8dddd88b58baf868c00edc0f5a55e9b2f08a6ce6768e5bd6dae1944034c12d` |
| `modules/devize/contracte.html` | LAB-ONLY — izolare mediu; nu transfera | Numai URL/cheie/inițializare client LAB față de HEAD | DA | `edfe665aedf43ad3d07c68a300f35394d256a62c5b7abb906409499dfd379014` |
| `modules/devize/deviz-print.html` | FUNCȚIONAL — sincronizare dacă lipsește în principal | Afișarea avansului, brutului și restului; nu relivra automat o funcție deja confirmată | nu după ref | `3f87f517e740dc0ebe34f6ab3800b6fbe2e9e7766dda15a126f1af0a176b64b0` |
| `modules/devize/deviz.html` | LAB-ONLY — izolare mediu; nu transfera | Numai URL/cheie/inițializare client LAB față de HEAD | DA | `690cf9e204df24189a3dfe8d543fd9396f1947739a856d65937fc0c0a159e44d` |
| `modules/devize/deviz_final.html` | FUNCȚIONAL — sincronizare dacă lipsește în principal | Salvare atomică/import avansuri/ciorne; fișier funcțional mixt cu mediu LAB | DA | `7a7ac44c8aee5f7be25425b1ce122df196a51bf31384e5cd586d74c89d14c310` |
| `modules/flota/baza-vin.html` | LAB-ONLY — izolare mediu; nu transfera | Numai URL/cheie/inițializare client LAB față de HEAD | DA | `6eda09a4947728e10171e71c8e91b714c2999f6a475a0c4aa6ea4a19516ad98b` |
| `modules/flota/lista_masini.html` | LAB-ONLY — izolare mediu; nu transfera | Numai URL/cheie/inițializare client LAB față de HEAD | DA | `9f810fb586410226d9f6904e1a45a35ee74b68fef873126009a57b6829bf8283` |
| `modules/formulare/detailing.html` | LAB-ONLY — izolare mediu; nu transfera | Numai URL/cheie/inițializare client LAB față de HEAD | DA | `64a62f553eda64cd23ae09c41a5c1c1be515712bf1e25272bcaac55b2c442d25` |
| `modules/formulare/evidenta-awb.html` | LAB-ONLY — izolare mediu; nu transfera | Numai URL/cheie/inițializare client LAB față de HEAD | DA | `b97ba166e86d2e713277e87c327cfbffbeba9df5e6ebdd006604def93f897a96` |
| `modules/formulare/generator.html` | LAB-ONLY — izolare mediu; nu transfera | Numai URL/cheie/inițializare client LAB față de HEAD | DA | `6111aff0d4cd8a73d360c2ff01761d076068f78581678ca5d6bfe1a2b1ac39d4` |
| `modules/formulare/telefoane-clienti.html` | LAB-ONLY — izolare mediu; nu transfera | Numai URL/cheie/inițializare client LAB față de HEAD | DA | `c24ab245d8ff6c83c2297cdef754b8fa488309386967896cd25c1a9e6a4439a9` |
| `modules/manager/manager.css` | FUNCȚIONAL — sincronizare dacă lipsește în principal | Manager integrat, stiluri | nu după ref | `99441736491b724e6aeb9e2cf3abb96b8fb703776a365e5e8ea82ab5f59b57b2` |
| `modules/manager/manager.html` | FUNCȚIONAL — sincronizare dacă lipsește în principal | Manager integrat, structură și ciorne | nu după ref | `275d81ada8d6689e13def1d3ff270026c131319b5e225c4ac3e06f3ed8640f5f` |
| `modules/manager/manager.js` | FUNCȚIONAL — sincronizare dacă lipsește în principal | Manager integrat, calcule/încărcări/căutare și ciorne | nu după ref | `b68b2736ed9f628d37446504164e456d68293c00355968ea49998660ee9fd78e` |
| `modules/stocuri/consumabile.html` | LAB-ONLY — izolare mediu; nu transfera | Numai URL/cheie/inițializare client LAB față de HEAD | DA | `c6ee385258f6d46fea965c276423ea14531012f507a0fbb47f6a8825c0267c41` |
| `modules/stocuri/dezmembrari.html` | MIXT / HOLD — reconciliere punctuală | MIXT: referință helper pasiv și cache-bust, fără activare AUTH | nu după ref | `bdbb49bf6d6c63f0c5fa511c1fbb57f8928cbdb0d225a79dfb4052295096b22f` |

## 3. Separarea necesară înaintea unei sincronizări solicitate

- **Manager + ciorne:** reuniunea include modules/manager/manager.css, manager.html, manager.js, index.html, js/local-deviz-drafts.js, css/local-deviz-drafts.css, modules/devize/deviz_final.html, js/session-timeout.js și numai integrarea de ciorne aprobată din modules/admin/login.html. Pachetul funcțional nu autorizează rescrierea loginului.
- **Avansuri/print:** deviz_final.html și deviz-print.html se reconciliază cu implementarea deja testată în producție. RLS nu justifică o nouă implementare paralelă a salvării sau a printului.
- **Constatări:** diferența JS locală este optimizare de încărcare, nu cerință pentru politicile RLS. Se transferă numai dacă este cerută/lipsește din principal.
- **Admin și Dezmembrări:** paginile mixte apelează helper-e pasive din js/auth-security.js chiar când HUB_AUTH_SECURITY_ENABLED=false: hubMergePermissionFlags, hubProfileLabels și hubAttachActorLabels. Nu se poate exclude orbește helperul și copia paginile care îl apelează. La reconciliere se păstrează logica pasivă necesară sau citirile existente ale versiunii țintă, fără activarea ramurii AUTH/RPC suspendate. Nu se modifică acum codul pentru a face această separare.
- **Login/Turnstile:** HUB_AUTH_SECURITY_ENABLED=false și HUB_TURNSTILE.enabled=false, siteKey goală. Loginul local referă încă wrapper-ul HubTurnstile, care în modul dezactivat returnează null. Excluderea fișierului dintr-un viitor transfer cere și reconcilierea apelurilor; nu se face ștergere/copiere integrală în această sarcină. Loginul țintă rămâne fluxul actual.
- **LAB-only:** cele 11 diferențe de URL/cheie sunt izolare de mediu, nu modificări funcționale de publicat. Nu se înlocuiesc global chei/ref-uri pentru a fabrica un deploy.

## 4. Excluderi și dovezi

AUTH avansat, hub-login, limiterul și Turnstile rămân SUSPENDATE. supabase/auth-security-lab/, supabase/functions/hub-login/, clonele/exporturile, helperul de sesiuni, fixture-urile și cheile nu sunt pachete frontend de producție.

SQL-urile deja aplicate și rollback-urile au registrul separat în [10_PLAN_RLS.md](10_PLAN_RLS.md). Nu sunt necesare noi migrări pentru a transfera documentația. Nicio stare de deploy frontend nu se deduce din numărul migrărilor SQL.

La o sincronizare viitoare solicitată se compară fișierul țintă real, se alege diferența funcțională necesară, se păstrează configurația țintă și loginul, apoi se consemnează versiunea și verificarea. Acum nu există manifest executabil/aprobare de publicare, commit, push sau deploy.

Stadiu central: [22_STADIU_RLS_SI_DIRECTIE_SIMPLITATE.md](22_STADIU_RLS_SI_DIRECTIE_SIMPLITATE.md).
