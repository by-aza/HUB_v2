# HUB AUTO v2

Aplicație web internă pentru activitățile unui hub auto: birou, service,
devize și avansuri, plăți, stocuri, flotă, detailing și administrare.
Acest director este **repository-ul principal de lucru HUB AUTO v2**.
Branch-ul activ se verifică la fiecare sarcină; conținutul său poate diferi de
versiunea publicată în producție. Mirror-ul separat `HUB_v2-LAB` furnizează
context istoric și de testare, fără a certifica acest checkout.

Stackul principal este **HTML, JavaScript Vanilla, Tailwind Play CDN și CSS custom**,
cu **Supabase** pentru autentificare, date și operații backend.
Interfața este multipagină; multe pagini includ și CSS/JS inline.

## Structură

| Cale | Conținut |
|---|---|
| [index.html](index.html) | Dashboardul și navigarea principală |
| [modules/](modules/) | Pagini grupate în admin, devize, flota, formulare, manager și stocuri |
| [css/](css/) | Stiluri comune și stiluri dedicate modulelor |
| [js/](js/) | Scripturi comune și logica unor module |
| [modules/manager/](modules/manager/) | Pagina Manager, cu propriile fișiere CSS și JS |
| [supabase/](supabase/) | Fișiere locale de configurație, trei migrări și SQL-uri auxiliare; pachetele RLS istorice din LAB lipsesc aici |
| [supabase/functions/](supabase/functions/) | Sursele locale ale funcțiilor Edge disponibile în checkout |
| [icons/](icons/) | Logo și iconuri pentru pagini și manifeste |
| [clienti_notificari_demo/](clienti_notificari_demo/) | Materiale demonstrative pentru Clienți & Notificări |
| [documentatie_tehnica/](documentatie_tehnica/) | Documentație tehnică, planuri, rapoarte și referințe |

## Documentație

Începe cu [harta documentației](documentatie_tehnica/INDEX.md) și alege documentele
potrivite sarcinii. [AGENTS.md](AGENTS.md) conține regulile de lucru pentru asistenții AI.
Codul actual și starea verificată a mediului țintă au prioritate față de documentația depășită;
contradicțiile trebuie raportate înainte de intervenție.

## Dezvoltare și publicare

Interfața principală nu are `package.json` sau un pas de build definit în rădăcină;
paginile încarcă direct fișiere locale și biblioteci CDN.
[vercel.json](vercel.json) definește antete de cache pentru paginile HTML.
Fișierul nu stabilește o procedură completă de deploy; comenzile de setup,
servire locală și publicare necesită confirmare pentru mediul vizat.
Prezența SQL-ului local nu dovedește aplicarea lui în baza de date.
Reconcilierea documentară din 03.11.2026 confirmă numai existența fișierelor,
importurile și implementarea statică. Supabase live, autorizarea efectivă,
comportamentul în browser și versiunea publicată rămân `NEEDS_REVIEW`.

Nu expune credențiale Supabase, parole, tokenuri sau alte secrete în documentație,
loguri ori capturi. Cheile privilegiate și cheile private nu aparțin frontendului.
