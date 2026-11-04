# HUB AUTO v2 — contract de lucru pentru agenți AI

HUB AUTO v2 este aplicația internă pentru birou, service, devize, avansuri,
magazie, flotă și administrare. Stack: HTML, JavaScript Vanilla,
Tailwind/CSS custom și Supabase. Acesta este repository-ul principal de lucru
HUB AUTO v2; mirror-ul HUB_v2-LAB este separat. Conținutul local poate diferi
de versiunea publicată în producție.

## Înainte de lucru

- Citește [documentatie_tehnica/INDEX.md](documentatie_tehnica/INDEX.md).
  Folosește rutarea pentru a selecta numai documentele relevante sarcinii;
  nu citi implicit toate fișierele Markdown.
- La începutul fiecărei sarcini, verifică directorul, branch-ul activ și mediul țintă;
  branch-ul de lucru nu este presupus permanent. Verifică cererea, fișierele
  autorizate și modificările locale preexistente;
  păstrează munca utilizatorului și fișierele neversionate.
- Inspectează sursele efectiv folosite: pagina, CSS/JS încărcate, handler-ele,
  interogările și consumatorii afectați. Documentația nu înlocuiește codul.
- Codul executat și starea verificată a bazei din mediul țintă prevalează când
  documentația este depășită. Raportează contradicțiile, sursele și limitele
  **înainte de a acționa asupra lor**; nu alege tacit o interpretare.
  Dovezile LAB, mock și producție se raportează separat. Existența fișierelor,
  importurile și logica frontend inspectată static nu dovedesc starea live
  Supabase, autorizarea efectivă, comportamentul browserului sau versiunea publicată.

## Limita intervenției

- Păstrează funcționalitatea, fluxurile, convențiile vizuale, selectorii și navigarea
  existente. Fă cea mai mică schimbare care rezolvă complet cererea.
- Fără refactorizări fără legătură cu cererea sau funcționalități inventate.
- Dacă cererea este de analiză, diagnostic, review sau planificare, nu modifica fișiere.
- Nu modifica schema DB, RLS, autentificarea, rolurile sau accesul fără aprobare explicită.
- Fără commit, push, deploy, schimbare de branch sau operații distructive fără aprobare explicită.
- „Dezactivează”, „oprește”, „ascunde”, „scoate din uz” (disable/stop/hide/decommission)
  nu autorizează ștergerea permanentă a codului, datelor, backupurilor sau infrastructurii.
- Orice lucrare distructivă cere inventar, backup verificat, metodă de rollback,
  lista exactă a țintelor și aprobarea explicită a utilizatorului înainte de execuție.
- Nu expune și nu documenta secrete, credențiale, tokenuri de sesiune sau chei private.
  Nu introduce chei Supabase privilegiate în browser.

## Cod și verificare

- La editări HTML/CSS/JS, adaugă un comentariu scurt în română la fiecare bloc sau
  clasă importantă (card, buton, tabel, grid, font, dimensiune, selector, conexiune Supabase).
  Comentariile sunt un ghid de setări rapide: `/* fundalul paginii */`,
  `/* dimensiune font titlu */`, `/* preia datele din tabelul 'masini' */`.
  Nu comenta fiecare linie; păstrează codul funcțional intact.
- Testele trebuie să fie relevante și proporționale cu schimbarea.
  Raportează ce ai verificat efectiv și ce rămâne neverificat;
  sintaxa/static/mock nu reprezintă dovadă de browser sau producție.

## Întreținerea documentației

- După o implementare testată și acceptată, fă o evaluare a impactului asupra documentației înainte de închiderea lucrării.
- Actualizează numai documentele direct afectate de comportamentul verificat. Nu modifica toate documentele care doar menționează indirect modulul.
- Nu documenta drept implementată o funcție planificată, netestată, parțială sau existentă numai într-un prototip.
- Dacă implementarea nu a fost verificată, raportează documentele care ar necesita actualizare, dar nu le modifica drept stare confirmată.
- Dacă lista fișierelor autorizate pentru sarcina curentă nu include documentația, nu extinde automat scopul. Enumeră actualizările recomandate și așteaptă aprobarea.
- Folosește responsabilitatea documentelor astfel:
  - `02_MODULE.md` pentru module și pagini;
  - `03_SUPABASE.md` pentru tabele, coloane, relații, VIEW-uri și RPC-uri;
  - `04_ROLURI_SI_ACCES.md`, `09_MATRICE_ACCES.md` și `22_STADIU_RLS_SI_DIRECTIE_SIMPLITATE.md` pentru autentificare, roluri, permisiuni și RLS;
  - `05_FLUXURI_PRINCIPALE.md` pentru fluxuri de business;
  - `06_DEPENDENTE_SI_INTEGRARI.md` pentru legături între module și servicii;
  - `07_RISCURI_SI_ZONE_SENSIBILE.md` pentru riscuri active și zone sensibile;
  - `DESIGN_SYSTEM_HUB.md` numai pentru reguli sau componente vizuale reutilizabile;
  - `README.md` numai când se schimbă scopul, stackul sau structura principală;
  - `documentatie_tehnica/INDEX.md` când se creează, redenumește, reclasifică sau schimbă rolul unui document.
- Nu copia aceeași informație în mai multe documente. Fiecare informație trebuie menținută în documentul care îi este proprietar, iar celelalte documente trebuie să trimită către acesta.
- Nu rescrie rapoartele istorice pentru a reflecta starea prezentă. Păstrează-le ca dovezi datate și actualizează documentele curente.
- O corecție minoră care nu schimbă comportamentul, fluxul, schema, accesul sau interfața documentată nu necesită automat actualizarea documentației.
- Creează un document separat pentru un modul numai dacă acesta are mai multe fișiere, propriul model de date, fluxuri importante, integrări, permisiuni speciale sau suficiente reguli încât documentul general al modulelor ar deveni greu de folosit.
- Un document nou de modul trebuie adăugat în `documentatie_tehnica/INDEX.md`, cu scop, statut, fișiere relevante și ruta de utilizare.
- După actualizarea documentației, verifică linkurile și căile, contradicțiile și execută `git diff --check`.
- În raportul final precizează separat:
  - codul modificat;
  - documentația modificată;
  - comportamentul verificat;
  - informațiile rămase `NEEDS_REVIEW`.
