# Stilul vizual HUB AUTO — manual practic pentru AI

Referință pentru ChatGPT, Codex, Claude, Gemini și alte modele AI. Inventar din codul LAB, **21.10.2026**.
Documentul descrie componentele existente; nu introduce o temă sau o bibliotecă nouă.
Analiză statică HTML/CSS/JS, fără browser, capturi sau verificarea fonturilor efectiv randate.
Regulile generale și separarea mediilor rămân în [AI_START_HERE.md](AI_START_HERE.md).
Pentru legăturile pagină–resurse: [01_ARHITECTURA.md](01_ARHITECTURA.md); pentru modulele active: [02_MODULE.md](02_MODULE.md).

Exemple vizuale: [referinte_vizuale/INDEX.md](referinte_vizuale/INDEX.md), cu marcaje LAB/DEMONSTRATIV și limitele datelor prezentate. Capturile sunt referințe vizuale, nu probe de salvare sau publicare în producție. Legăturile și clasificările au fost reconciliate documentar la 22.10.2026; codul nu a fost modificat.

## 1. Alegerea exemplului potrivit

HUB folosește mai multe familii vizuale. Alege un exemplu după componentă și context, nu copia toate stilurile unei pagini.

| Componentă / nevoie | Exemplu activ de consultat | Sursa stilurilor |
|---|---|---|
| Antet cu Înapoi, titlu și acțiune; listă adaptată în carduri pe mobil | [Avansuri][avans] — referința preferată pentru Înapoi | `<style>` inline și clasele Tailwind din aceeași pagină |
| KPI, grafice compacte, tabele de plăți și rezultate de căutare | [Manager][manager-html] | [manager.css][manager-css] și [manager.js][manager-js] |
| Registru cu listă și dosar, butoane, badge-uri și formulare compacte | [Clienți & Notificări][cn-html] | [clienti-notificari.css][cn-css] |
| Listă de vehicule, selecție, departamente și stare operațională | [Constatări v2][const-html] | [constatari_v2.css][const-css] și [constatari_v2.js][const-js] |
| Tabel cu multe coloane, detalii și modal de formular | [Comenzi piese SH][sh-html] | [comenzi_piese_sh.css][sh-css] |
| Fotografii și detalii desktop / drawer | [Dezmembrări][dez-html] | [dezmembrari.css][dez-css] și [dezmembrari.js][dez-js] |
| Formular mobil pentru fotografii și selecție de tip | [Captură Dezmembrări][cap-html] | [dezmembrari_capture.css][cap-css] |
| Dialog local cu focus gestionat și revenire la controlul inițial | Ciorne DF, încărcate de paginile existente | [local-deviz-drafts.css][draft-css] și [local-deviz-drafts.js][draft-js] |
| Document destinat tipăririi | [Print Deviz final][print-df], [Print Constatare][print-const] | Stiluri inline proprii, în `pt` și `mm` |

Managerul activ este `manager.html`, nu fostele fișiere `manager-v2.*`, eliminate.
Titlul HTML „Constatări v2 — prototip” este rezidual: pagina este legată din dashboard și încarcă JS-ul activ.
Eticheta „DEMO v3” din C&N nu face din întreaga pagină un mock; verifică acțiunea concretă înainte de reutilizare.
Nu folosi `.orig`, capturi istorice sau placeholderul `modules/stocuri/comenzi_piese.html` drept componente active.

[Registru lucrări](test_ai/registru-lucrari.html) este o demonstrație independentă din documentație, cu opt lucrări fictive locale, fără Supabase, persistență sau integrare în HUB. Aspectul său nu reprezintă automat o componentă aprobată a aplicației; pentru implementări folosește sursele active din tabel.

## 2. Fonturi, greutăți și ierarhie

Valorile de mai jos sunt **declarații din sursă**. Un import, o greutate cerută sau o clasă nu dovedesc singure fontul randat.

| Sursă și selector/clase | Familie și dimensiuni reale relevante | Greutăți / observații |
|---|---|---|
| [Dashboard][index], `tailwind.config.theme.extend.fontFamily`, `body`, `.font-mono` | Inter pentru sans; JetBrains Mono pentru mono | Google Fonts: Inter `400;500;600;700;800`, Mono `500;700` |
| [Avansuri][avans], `body`, `.mono-text`, `.avans-col-car .font-mono`, `.avans-col-total .font-bold` | Inter declarat pe body; JetBrains Mono pe identificatori/sume; număr auto `1rem`, total `0.98rem` | Număr auto `700`; body are și clasa Tailwind `font-sans`, de verificat în cascadă |
| [Avansuri][avans], `.page-header .header-intro h1`, `.page-header .header-intro p`, `.table-shell th` | Titlu `1.15rem`, subtitlu `0.82rem`, antet tabel `0.73rem` | Titlu HTML `font-black uppercase`; `th: 700`, tracking `0.08em` |
| [Manager CSS][manager-css], `:root`, `h1`, `h2`, `small,.footnote` | Bază `13px/1.45 Inter,system-ui,-apple-system,"Segoe UI",sans-serif`; titlu `19px`, h2 `14px`, small `11px` | h2 `650`; [HTML][manager-html] încarcă Inter `400–800` în treptele de mai sus |
| [Manager CSS][manager-css], `.primary-value`, `.metric>strong` | `clamp(24px,1.8vw,38px)` și `clamp(20px,1.5vw,29px)`; cifre `tabular-nums` | `700`, respectiv `650`; pe mobil există suprascrieri `32px` și `21px` |
| [Manager CSS][manager-css], `.iban-button` | `11px ui-monospace,SFMono-Regular,Consolas,monospace` | Monospațiat de sistem, nu import JetBrains Mono |
| [C&N CSS][cn-css], `body`, `.cn-title-line h1`, `.cn-field>span`, `.cn-plate,.cn-money` | Bază `13px/1.45 Inter,system-ui,sans-serif`; titlu `17px`, etichetă câmp `10px`; Mono pentru numere/sume | [HTML][cn-html] încarcă Inter `400–800` și JetBrains Mono `500;700`; `.cn-client-name: 800` |
| [Constatări CSS][const-css], `body`, `.brand`, `.plate`, `.field label` | `14px Inter, Segoe UI, sans-serif`; brand `24px`, număr `18px`, etichete `11px` | `800`, `850`, respectiv `750`; pagina nu încarcă explicit Inter |
| [SH CSS][sh-css], `body`, `.parts-header-intro h1`, `.parts-table th`, `.parts-table td` | Inter/ui-sans-serif/system-ui; titlu `1.45rem`; th `0.72rem`, td `0.82rem` | Titlu și th `800`; importuri Inter `400–800` și Mono `500;700` |
| [Dezmembrări CSS][dez-css], `body`, `.dez-module-head h1`, `.dez-internal-id,.dez-detail-id` | Bază `13px Inter,"Segoe UI",sans-serif`; titlu `24px`; ID `11px` în JetBrains Mono/SFMono-Regular/Consolas/monospace | ID `700`; [pagina][dez-html] nu încarcă explicit fonturile web |
| [Captură CSS][cap-css], `body`, `.capture-topbar h1`, `.capture-submit` | Bază `14px Inter,"Segoe UI",system-ui,-apple-system,sans-serif`; titlu `18px`, submit `16px` | Titlu `850`, submit `900`; fără încărcare explicită Inter în [HTML][cap-html] |
| [Login][login], `body`, `label`, `button` | `sans-serif`; etichete `14px`, buton `16px` | Buton `bold`; nu este varianta Inter a dashboardului |
| [Deviz estimativ][deviz], `body`, `.title-deviz`; [print DF][print-df], `body`, `.antet-value` | Arial/sans-serif; titlu editor `18px !important`; print `10pt`, valori antet `11pt` | Fontul documentelor tipărite se păstrează separat de UI |
| [Print Constatare][print-const], `body`, variabilele `:root` | Arial/sans-serif `9pt`; `--title-font-size:11pt`, `--table-font-size:8.8pt`, `--company-line-font-size:6.8pt` | O scară separată pentru documentul tipărit |

Nu converti automat `rem` în pixeli: Manager definește fontul rădăcinii la `13px`, iar alte pagini au alt context.
Greutățile CSS `650/750/850/900` nu sunt dovada unor fișiere de font distincte încărcate; browserul poate folosi substituții.
Verifică `font`, `font-family`, moștenirea, utilitarele și stilurile calculate înainte de a schimba tipografia.

## 3. Tema dark și diferențele de paletă

### Varianta dashboard: culori Tailwind locale paginii

În [index.html][index], valorile sunt în `tailwind.config.theme.extend.colors`, **nu variabile CSS globale**.

| Token din configurație | Valoare |
|---|---|
| `background`, `foreground`, `card`, `popover` | `#14161c`, `#f1f2f4`, `#1b1e26`, `#1d2029` |
| `primary.DEFAULT / foreground` | `#2dd4cf / #161b24` |
| `secondary.DEFAULT`, `muted.DEFAULT / foreground` | `#262a34`, `#22262f / #98a0ad` |
| `accent.DEFAULT`, `destructive`, `warning.DEFAULT`, `success.DEFAULT` | `#2a2f3a`, `#ef4757`, `#f5b32b`, `#27c79a` |
| `border`, `sidebar.DEFAULT`, `sidebar.border` | `rgba(255,255,255,0.09)`, `#181b22`, `rgba(255,255,255,0.08)` |

### Variantele modulelor: variabilele proprii din `:root`

| Sursă | Fundal și suprafețe | Text, delimitare și accente |
|---|---|---|
| [Avansuri][avans] | `--bg:#14161c`, `--surface:#181b22`, `--card:#1b1e26` | `--text:#f1f2f4`, `--muted:#98a0ad`, `--border:rgba(255,255,255,0.08)`, `--accent:#2dd4cf`, `--success:#27c79a`, `--danger:#ef4757` |
| [C&N][cn-css] | `--bg:#14161c`, `--panel:#1b1e26`, `--panel2:#20242d`, `--panel3:#282d38` | `--text:#f2f4f7`, `--muted:#98a1af`, `--line:rgba(255,255,255,.09)`, `--cyan:#2dd4cf`, `--amber:#f5b32b` |
| [Manager][manager-css] | `--bg:#101217`, `--card:#191e26`; antet `.topbar: #171b22` | `--line:#2a323e`, `--text:#f1f3f6`, `--muted:#a3adbc`, `--teal:#48d8c8`, `--blue:#7fa8f5`, `--amber:#f0c17a`, `--red:#f79c9c` |
| [Constatări][const-css] | `--bg:#070c14`, `--panel:#0c1421`, `--card:#101a29`; body cu gradient radial | `--line:#213047`, `--text:#edf4ff`, `--muted:#8fa0b8`, `--cyan:#22d3ee`, `--blue:#3b82f6`, `--green:#22c55e`, `--rose:#f43f5e` |
| [Comenzi SH][sh-css] | `--parts-bg:#07111a`, `--parts-panel:#0e1d2c`, `--parts-panel-2:#102235`, `--parts-row:#0c1a28` | `--parts-text:#eef5fb`, `--parts-muted:#9fb0c2`, `--parts-border:rgba(126,158,190,.16)`, `--parts-blue:#2e8df1`, `--parts-green:#36b84a`, `--parts-orange:#f3ab2f` |
| [Dezmembrări][dez-css] | `--dez-bg:#07111a`, `--dez-panel:#0b1722`, `--dez-card:#101f2d`; body real `#030910`, shell `.dez-app` cu gradiente | `--dez-line:#1f3445`, `--dez-text:#e8f3ff`, `--dez-muted:#8fa4b8`, `--dez-cyan:#19d3ee`, `--dez-amber:#f97316` |
| [Captură][cap-css] | `--cap-bg:#02070d`, `--cap-surface:#07111d`, `--cap-panel:#0b1624`; body cu gradiente | `--cap-line:#21364c`, `--cap-text:#eef7ff`, `--cap-muted:#92a3b7`, `--cap-cyan:#18dff0`, `--cap-danger:#f87171` |

Numele asemănătoare nu au semantică identică: `accent` din dashboard este gri; `--accent` din Avansuri este turcoaz.
Loginul are fundal `#121214`, container `#1d1d22`, acțiune verde `#00b37e`; nu îl recolora ca Managerul.
[Deviz final][df] folosește utilitare slate/cyan/emerald (`bg-slate-950`, `bg-slate-900`, `bg-cyan-600`), fără paleta custom din index.
Paginile de print sunt albe. [Print DF][print-df] are `.section-title:#c695f3`, `.marker-discount:#E8E3FA`, `.marker-avans:#fce7e7` cu `print-color-adjust:exact`.
Comentariul „mov” de lângă `.header-bg` nu descrie valoarea sa reală: `hsl(0,0%,83%)`, gri; citește declarația.

## 4. Antete, navigare și Înapoi

### Referința preferată: Avansuri

În [avans.html][avans], `.page-header .header-top` este grid `auto minmax(0,1fr) auto`, cu `gap:16px`, `padding:16px 18px`.
Linkul este la stânga, titlul centrat, acțiunea la dreapta; antetul este și `.panel-card`, cu rază `16px`.
Reperul HTML existent este scurt:

```html
<a href="../../index.html" class="back-link justify-self-start inline-flex items-center gap-2 transition-all group">
  <i data-lucide="arrow-left" class="w-5 h-5 group-hover:-translate-x-1 transition-transform"></i>
  <span class="font-bold uppercase tracking-wider text-xs">Înapoi</span>
</a>
```

| Element | Selector / clasă reală | Comportament de păstrat |
|---|---|---|
| Culoare | `.page-header .back-link`, `:hover` | `var(--muted)` → `var(--text)` |
| Săgeată | `[data-lucide="arrow-left"]`, `w-5 h-5`, `group-hover:-translate-x-1` | Icon Lucide și deplasare la hover; pagina execută `lucide.createIcons()` |
| Text | `font-bold uppercase tracking-wider text-xs` | Text compact, majuscule, spațiere între litere |
| Mobil, până la `767px` | `.header-top`, `.header-intro`, `.add-btn` | Grid în două coloane, gap `8px`, padding `12px`; titlu la stânga, acțiune pe toată lățimea |

Modelul are nevoie de regulile inline specifice și de utilitarele încărcate; simpla clasă `back-link` nu le aduce.
Pentru o pagină nouă, adaptează calea de întoarcere la locul real al paginii, păstrând aspectul modelului.
Nu schimba mecanismul de navigare al paginilor existente doar pentru a copia aspectul.

### Alte implementări existente

| Sursă | Selector | Particularitate reală |
|---|---|---|
| [Manager HTML][manager-html] + [CSS][manager-css], blocul final „Înapoi” | `.topbar`, `.topbar .back-link` | Suprascrie flex cu grid; padding `16px 18px`, gap `16px`; link `#98a0ad` → `#f1f2f4`, SVG `20px`, translație `-4px`, text `12px/16px`, greutate `700`, tracking `.05em` |
| [Manager][manager-html] | `.back-link[href]` | `../../index.html?hub=1`; parametrul păstrează revenirea la HUB fără bucla de redirect |
| [C&N CSS][cn-css] | `.cn-topbar`, `.cn-back-link` | Antet flex, min-height `68px`, padding `10px 24px`, gap `20px`; link cu gap `7px`, icon SVG `17px` |
| [Constatări CSS][const-css] | `.topbar`, `.back-btn` | Antet `72px`, padding `0 22px`; buton conturat `30px` înălțime, rază `7px`, font `12px/500`; variantă diferită de modelul preferat |
| [Dezmembrări CSS][dez-css] | `.dez-back-btn` | Gap `8px`, icon `20px`, hover `translateX(-4px)`; text `12px/800`, tracking `.08em` |
| [Captură CSS][cap-css] | `.capture-topbar`, `.capture-back` | Grid `42px minmax(0,1fr) 42px`, min-height `50px`; buton doar icon `38×38px`, SVG `25px`, cu `aria-label` în HTML |
| [Dashboard][index] | `#sidebar`, `#sidebar.collapsed`, `.nav-btn` | Sidebar `260px` → `76px`; mobil este drawer, nu antetul Avansuri |

În [Comenzi SH JS][sh-js], `#backButton` folosește deja `history.back()`; este comportamentul acelei pagini, nu destinația linkului-model.

## 5. Butoane și acțiuni

| Sursă | Selectori/clase reale | Valori relevante |
|---|---|---|
| [Avansuri][avans] | `.page-header .add-btn` | Min-height `40px`, padding `0 16px`, rază `10px`, fundal `rgba(45,212,207,.16)`, border `.28`, text `#dffdfb`; hover fundal `.24` |
| [Avansuri][avans] | `.avans-col-actions button` | Min-height `34px`, padding `7px 12px`, rază `10px`, font `11px/700`, tracking `.05em`; hover `brightness(1.08)` |
| [Avansuri][avans] | `.avans-col-actions button:nth-child(1)`, `:nth-child(2)`, `:nth-child(3)`, `:nth-child(4)` pe aceleași butoane | Primul turcoaz, 2/3 neutre, al patrulea roșu; dependență de ordinea DOM, nu clase semantice independente |
| [C&N CSS][cn-css] | `.cn-button`, `.cn-icon-button`, `.cn-button-small` | Buton min-height `36px`, padding `0 12px`, gap `7px`, greutate `700`, rază `9px`; icon `36×36px`; small `30px`, font `11px` |
| [C&N CSS][cn-css] | `.cn-button-primary`, `.cn-button-ghost`, `.cn-button-danger` | Primary `#157a78`, border turcoaz `.42`; ghost transparent; danger text `#ff9aa4`, fond roșu `.1`; hover comun `brightness(1.1)` |
| [Constatări CSS][const-css] | `.btn`, `.btn-primary`, `.btn-success`, `.btn-danger` | Height `38px`, padding `0 15px`, rază `8px`, greutate `700`; fonduri `#0891b2`, `#166534`, `#881337`; hover `brightness(1.12)` |
| [SH CSS][sh-css] | `.parts-btn`, `.parts-btn-primary` | Min-height `36px`, padding `0 14px`, rază `7px`, font `.8rem/700`; primary gradient verde `#26a442` → `#168536` |
| [Manager CSS][manager-css] | `button,select,input`, `.pay-button`, `.text-button` | Bază padding `8px 11px`, rază `7px`, fond `#222a35`; plată `10px`, padding `6px 9px`, fond `#372f23`; acțiune text `11px`, fără border/fond |
| [Deviz final][df] | `#btn-salveaza-deviz`, `#btn-deviz-nou` | Clase existente `rounded-xl px-4 py-2 text-sm font-extrabold`; salvare `bg-cyan-600 hover:bg-cyan-500`, nou `bg-emerald-600 hover:bg-emerald-500` |
| [Captură CSS][cap-css] | `.capture-submit` | Min-height `53px`, rază `8px`, font `16px/900`, text `#031018`; gradient `#25e9f3` → `#12cfdf`, umbră cyan |

Nu impune o singură culoare pentru acțiunea principală: turcoaz, verde și cyan sunt variante deja folosite.
Păstrează legătura dintre control și acțiune; ID-urile și handler-ele nu sunt simple detalii de decor.

## 6. Carduri, panouri și spațiere

| Sursă | Selector | Dimensiuni, contur și suprafață |
|---|---|---|
| [Avansuri][avans] | `.panel-card`, `.page-shell` | Fond `rgba(27,30,38,.96)`, border `1px solid var(--border)`, umbră `0 16px 40px rgba(0,0,0,.24)`; container max-width `1440px`, centrat |
| [Manager CSS][manager-css] | `.card`, `.content`, `.executive-grid` | Card padding `17px 18px`, rază `10px`, border `1px`, fond `--card`; conținut max-width `2560px`; grid `1.9fr repeat(5,minmax(0,1fr))`, gap `10px` |
| [Manager CSS][manager-css] | `.primary-kpi`, `.analysis-grid` | Bordură superioară `2px --teal`, gradient `#1b3335` → `#191e26`; analiză `1.7fr 1fr`, gap `12px` |
| [C&N CSS][cn-css] | `.cn-panel`, `.cn-workspace`, `.cn-page` | Rază `var(--radius)=12px`, fond `--panel`, border `1px`; workspace `minmax(0,3fr) minmax(360px,2fr)`, gap `10px`; pagină padding `8px 18px 0` |
| [Constatări CSS][const-css] | `.section`, `.grid`, `.grid.two` | Card padding `14px`, margin-bottom `13px`, rază `9px`, gradient `#101a29` → `#0c1522`; grile de 3/2 coloane, gap `11px` |
| [Constatări CSS][const-css] | `.vehicle-row`, `.vehicle-row.selected`, `.vehicle-row.urgent:before` | Min-height `84px`, padding `12px`, rază `9px`, margin-bottom `7px`; selecție contur cyan, urgență bară rose de `3px` |
| [Captură CSS][cap-css] | `.capture-type`, `.capture-photo-slot`, `.capture-photo-grid` | Tip min-height `72px`, rază `8px`; foto aspect-ratio `1.08`, rază `8px`, imagine `object-fit:cover`; grid foto 3 coloane, gap `8px` |
| [CSS comun][common-css] | `.hub-card`, `.hub-card:hover` | Doar tranziție `150ms ease-in-out`, cursor default și hover `translateY(-.25rem)` cu umbră albastră; nu furnizează fond, font sau layout |

Nu există o scară globală obligatorie de spațiere. Exemplele folosesc frecvent gap `7–12px`, padding interior `12–18px`, margini laterale `18–24px`.
Aceste intervale rezumă exemplele de mai sus; pentru implementare se preia valoarea exactă a componentei alese.
Dashboardul redefinește `rounded-lg=.85rem`, `rounded-xl=1.2rem`, `rounded-2xl=1.5rem`; configurația nu este încărcată automat în alte pagini.

## 7. Tabele și liste

| Sursă | Selectori | Reguli existente |
|---|---|---|
| [Avansuri][avans] | `.table-shell thead`, `.table-shell th`, `.table-shell tbody td` | Antet `rgba(20,22,28,.96)`, blur `12px`; th `.73rem/700`, uppercase, tracking `.08em`; celule cu border-top alb `.05` |
| [Avansuri][avans] | `.table-shell tbody tr:hover`, `#avansBody tr` | Hover alb `.02`; până la `767px`, rândurile devin carduri grid cu zone date/total/auto/observații/acțiuni, padding `12px`, rază `14px` |
| [Manager CSS][manager-css] | `table`, `th`, `td`, `.table-scroll`, `.payments-table` | Tabel `11px`; th `9px/600`, padding `8px 10px`; td `9px 10px`; hover `#212834`; wrapper overflow auto; plăți min-width `850px` |
| [C&N CSS][cn-css] | `.cn-table-wrap`, `.cn-table-wrap table`, `.cn-table-wrap th`, `.cn-table-wrap td` | Wrapper overflow auto; **min-width final `980px`**, după declarația inițială `930px`; antet sticky top `0`, z-index `2`, font `10px`, padding `9px 10px` |
| [C&N CSS][cn-css] | `.cn-table-wrap tbody tr:hover`, `tr.is-selected` | Fundal `rgba(45,212,207,.07)`; celulele păstrează `white-space:nowrap`, nu se transformă automat în carduri |
| [SH CSS][sh-css] | `.parts-table-scroll`, `.parts-table`, `.parts-table-row.is-selected` | Zonă scroll `325px`, tabel min-width `980px`, td height `56px`; selecție fond albastru `.14` și bară interioară verde `3px` |

Nu înlocui toate tabelele cu aceeași soluție mobilă: Avansuri schimbă structura vizuală, C&N/SH păstrează scroll orizontal.
Clasele rândurilor pot fi generate în JS: de exemplu [Constatări][const-js] construiește `.vehicle-row.selected/urgent`.

## 8. Badge-uri, statusuri și mesaje

| Sursă | Selector/clase | Formă și culoare |
|---|---|---|
| [C&N CSS][cn-css] | `.cn-status,.cn-channel,.cn-chip` | Pill `999px`, padding `3px 7px`, font `10px/700`; bază albastră, `.warning` amber, `.danger` rose, `.success` verde |
| [Constatări CSS][const-css] | `.status`, `.status:before`, `.work`, `.wait`, `.done`, `.archived` | Rază `6px`, padding `5px 8px`, font `12px/800`, punct `7px`; text albastru `#60a5fa`, amber `#fbbf24`, verde `#4ade80`, gri `#94a3b8` |
| [SH CSS][sh-css] | `.parts-status-pill`, `.status-ordered`, `.status-transit`, `.status-arrived`, `.status-problem` | Min-height `24px`, rază `5px`, padding `0 9px`, font `.72rem/700`; albastru / portocaliu / verde / roșu, după stare |
| [Manager CSS][manager-css] | `.payment-badge.neplatit`, `.payment-badge.platit`, `.count-badge` | Plată `9px`, padding `3px 7px`, rază `5px`; neplătit amber pe `#3a3021`, plătit teal pe `#193f38`; count `10px`, rază `4px` |
| [Manager CSS][manager-css] + [JS][manager-js] | `.dismantling-card.has-backlog`, `.dismantling-count`, `.is-unavailable` | Backlog: bară stânga `3px --amber`, număr `30px/700`; indisponibilitatea are tratament neutru, nu total zero inventat |
| [Dashboard][index] | `.nav-new-badge`, `.nav-demo-badge` | Font `9px/800`, padding `1px 5px`, pill `999px`; nou cyan, demo amber; sensuri diferite |
| [Constatări CSS][const-css] | `.dirty-label` | Text `12px/600`, amber `#f59e0b`, padding `4px 9px`, rază `6px`; marchează modificări nesalvate |

Păstrează denumirea și semnificația stării din cod. Culoarea singură nu definește statusul de business.
În [Manager JS][manager-js], clasele `.active`, `.copied`, `.has-backlog` și `.is-unavailable` se aplică din starea reală.

## 9. Formulare și căutare

| Sursă | Selector | Valori și stări |
|---|---|---|
| [Avansuri][avans] | `#searchInput`; `#avansForm input`, `#avansForm select`, `#avansForm textarea`; echivalentele din `#paymentForm` | Min-height `42px`, rază `12px`, border `1px --border`, fond `#13161f`; placeholder `#7c8594`; etichete HTML `text-[10px] font-bold uppercase tracking-widest` |
| [C&N CSS][cn-css] | `.cn-field`, `.cn-field input`, `.cn-field select`, `.cn-field textarea`, `.cn-form-grid` | Câmpuri fond `#151820`, rază `8px`; input/select height `38px`, padding `0 10px`; textarea min-height `78px`, padding `9px`, resize vertical; grilă gap `9px` |
| [Constatări CSS][const-css] | `.value,.control`, `.control:disabled` | Min-height `38px`, padding `10px 11px`, rază `7px`, border `#263a55`, fond `#0a1321`; disabled opacity `.72` |
| [SH CSS][sh-css] | `.parts-field input`, `.parts-field select`, `.parts-field textarea`; clasa `.is-invalid` pe câmp | Min-height `36px`, padding `8px 11px`, rază `6px`, font `.84rem`; textarea min-height `58px`; invalid border `rgba(227,75,84,.82)` |
| [Manager CSS][manager-css] | `.search-wrap`, `.search-results`, `.search-result-link` | Lățime finală `360px`, max-width `100%`; rezultate max-height `min(70vh,620px)`; link padding `9px 12px`, hover fond `#26333a` |
| [Login][login] | `.input-group`, `input`, `input:focus` | Grup margin-bottom `20px`; input padding `12px`, rază `4px`, fond `#121214`, border `#29292e`; focus border `#4cf3a8` |

Nu copia numai inputul: păstrează label-ul, mesajul de validare, starea disabled și grila/contextul formularului.
Rezultatele de căutare Manager sunt randate prin [JS][manager-js]; CSS-ul nu înlocuiește navigarea și tratarea erorilor.

## 10. Ferestre modal

| Sursă | Overlay / dialog | Dimensiuni și structură |
|---|---|---|
| [Avansuri][avans] | `#avansModal`, `#paymentModal`, `#paymentHistoryModal`; `.panel-card` | Overlay `rgba(5,8,14,.72)`, blur `10px`, HTML `z-50`; dialog fond `rgba(27,30,38,.98)`, rază `16px` prin selector specific; cardurile HTML folosesc `max-w-lg` / `max-w-md` / `max-w-4xl` |
| [C&N CSS][cn-css] | `.cn-modal-overlay`, `.cn-modal` | z-index `50`, overlay padding `18px`, fond `rgba(5,7,11,.82)`, blur `4px`; dialog width `min(760px,96vw)`, max-height `92vh`, rază `16px`; body scrollabil |
| [C&N CSS][cn-css] | `.cn-small-modal`, `.cn-advance-modal`, `.cn-modal-nested` | Lățimi `min(520px,96vw)` și `min(1120px,97vw)`; avans height `min(820px,94vh)`; strat nested z-index `60` |
| [Constatări CSS][const-css] | `.final-estimate-modal`, `.final-estimate-dialog`, `.final-estimate-body` | Overlay z-index `60`, padding `16px`, blur `3px`; dialog width `min(100%,1180px)`, max-height `92vh`, rază `12px`; header/footer separate de body cu overflow-y auto |
| [SH CSS][sh-css] | `.parts-modal`, `.parts-modal-card`, `.parts-dialog-card` | Overlay z-index `60`, padding `22px`, blur `3px`; card width `min(100%,720px)`, dialog scurt `460px`, max-height `calc(100vh - 44px)`, rază `8px`; intrare animată `150ms` |
| [Ciorne CSS][draft-css] | `.df-local-overlay`, `.df-local-dialog` | z-index `10000`, padding overlay `16px`, fond `rgba(2,6,23,.85)`; dialog width `min(620px,100%)`, max-height `85vh`, padding `24px`, rază `16px`, fond `#0f172a` |

Clasele Tailwind ale modalului Avansuri pot spune `rounded-3xl`, dar selectorul specific setează raza la `16px`.
În C&N, `.cn-client-modal` are limita finală `calc(100dvh - 32px)`, body flexibil scrollabil și footer separat; mobil limita devine `calc(100dvh - 16px)`.
În [Ciorne JS][draft-js], `dialog()` creează `role="dialog"`, `aria-modal`, titlu asociat, închidere Escape, ciclu Tab și restaurarea focusului.
Aceste comportamente sunt dovada acelui dialog; nu presupune că toate modalurile le implementează.
Păstrează perechea HTML/CSS/JS și mecanismul de afișare: `.hidden`, `[hidden]` și `.is-open` nu sunt interschimbabile automat.

## 11. Responsive: pragurile reale

| Sursă | Prag / selector | Adaptare de păstrat |
|---|---|---|
| [Avansuri][avans] | `max-width:767px`; `.page-shell` la `min-width:768px` | Mobil: scroll al documentului, tabel în carduri, titlu `.96rem`, acțiune full width; desktop padding lateral `20px` |
| [Manager CSS][manager-css] | `max-width:1500px`, `1050px`, `760px` | KPI: 3 apoi 2 coloane; la `760px` KPI principal ocupă 2 coloane, analiza trece la 1 coloană; căutare full width |
| [Manager CSS][manager-css] | Suprascrieri finale pentru `.topbar` la `1050px/760px`; `min-width:2000px` | Toolbar pe rând separat la `1050px`; antet mobil padding `12px`; pe ecrane mari card padding `18px 20px`, dar antetul este suprascris ulterior la `16px 18px` |
| [C&N CSS][cn-css] | `max-width:1100px`, `720px` | Workspace într-o coloană la `1100px`; la `720px` antet cu wrap, formulare într-o coloană, margini pagină `8px`; tabelul rămâne lat și scrollabil |
| [Constatări CSS][const-css] | `max-width:1050px`, `1100px`, `720px` | La `1050px` lista ocupă `48vh`, detaliile min-height `70vh`; la `1100px` general-top-grid devine 1 coloană; la `720px` grilele vizate și modalul se compactează |
| [SH CSS][sh-css] | `max-width:1180px`, `860px` | Toolbar/footer într-o coloană; la `860px` shell `calc(100% - 20px)`, acțiune principală full width, formular 1 coloană, modal padding `10px`; tabel min-width `980px` |
| [Dezmembrări CSS][dez-css] | `min-width:768px and max-width:1180px` | Lista ocupă lățimea; `.dez-detail-pane` devine drawer width `min(92vw,720px)`, z-index `21`, backdrop `20`; starea `.is-open` este gestionată și în JS |
| [Captură CSS][cap-css] | `.capture-app`; `max-width:360px`, `min-width:520px` | Container `min(100%,430px)`, padding `8px 13px 22px`; foarte îngust: padding lateral `10px`, gap `6px`; ecran larg: încadrare cu umbră, fără layout desktop |
| [Dashboard][index] | `max-width:768px`, `#sidebar.mobile-open` | Drawer width `min(280px,86vw)`, height `100dvh`; overlay și blocarea scrollului prin `body.menu-open` |

Pragurile nu sunt unice la nivel HUB. Nu înlocui media query-urile cu un set comun presupus.
Urmărește și JS-ul: [Dezmembrări][dez-js] folosește `matchMedia` pentru intervalul drawer-ului.

## 12. Hover, focus, disabled și mișcare

| Sursă | Selector / stare | Valoare sau comportament |
|---|---|---|
| [Avansuri][avans] | Inputurile formularelor și `#searchInput:focus` | Border `rgba(45,212,207,.75)`, ring `0 0 0 3px rgba(45,212,207,.12)`, outline eliminat |
| [C&N CSS][cn-css] | `button:focus-visible`, `input:focus-visible`, `select:focus-visible`, `textarea:focus-visible` | Outline `2px solid var(--cyan)`, offset `2px` |
| [Manager CSS][manager-css] | `button:focus-visible`, `a:focus-visible`, `input:focus-visible`, `select:focus-visible`, `summary:focus-visible`, `.skip-link:focus` | Outline `2px --teal`, offset `3px`; skip-link apare la top `10px` |
| [Ciorne CSS][draft-css] | Butoane, `.df-local-select`, `.df-local-entry:focus-visible` | Outline `2px #22d3ee`, offset `3px` |
| [SH CSS][sh-css] | Inputuri focus; `.parts-btn:disabled` | Border verde `.72`, ring verde `2px/.12`; disabled opacity `.55`, cursor not-allowed |
| [Manager CSS][manager-css] | `button:disabled`; `@media(prefers-reduced-motion:reduce)` | Opacity `.5`, cursor wait; media query-ul setează `scroll-behavior:auto!important`, nu oprește toate animațiile din HUB |
| [Constatări CSS][const-css] | `.vehicle-row:hover` | `translateY(-1px)`, border `#34506d`, transition `.15s` |
| [Dashboard][index] | `.animate-neon`, `.shimmer-on-hover:hover::after`, `.animate-float` | Animații `2.4s`, `.9s`, respectiv `4s`; efecte ale dashboardului, nu cerințe pentru orice formular |

Nu elimina focusul vizibil fără un indicator echivalent. Nu presupune o singură regulă globală pentru disabled sau hover.
Suprafețele interactive și decorative diferă: de exemplu `.hub-card` păstrează `cursor:default`.

## 13. Construirea unei pagini noi în stilul existent

1. Citește [AI_START_HERE.md](AI_START_HERE.md), apoi alege familia vizuală după un modul apropiat ca funcție.
2. Deschide pagina activă și toate resursele ei; inspectează și sfârșitul CSS-ului, media query-urile și clasele generate în JS.
3. Reutilizează antetul și componentele aprobate; pentru Înapoi preferă Avansuri, cu destinația potrivită noii pagini.
4. Păstrează împreună familia de fonturi, paleta, dimensiunile, stările și densitatea exemplului; nu amesteca arbitrar tokenuri între module.
5. Dacă refolosești clase Tailwind custom din index, verifică exact configurația necesară; `css/style.css` nu o furnizează.
6. Nu importa un CSS de modul întreg doar pentru un buton: selectori generici precum `body`, `table`, `.btn` sau `.topbar` pot schimba pagina.
7. Păstrează labels, mesaje, navigarea cu tastatura și stările reale; componentele vizuale nu înlocuiesc handler-ele sau permisiunile.
8. Urmează modelul responsive al componentei: scroll orizontal, carduri mobile, drawer sau formular îngust, după exemplul ales.
9. Adaugă comentarii românești la blocurile importante conform [AGENTS.md](../AGENTS.md); nu comenta fiecare linie.
10. Într-o etapă de implementare, verifică pagina în browser, fontul calculat, desktop/mobil, focus/hover/disabled și modalurile; raportează separat ce nu ai verificat.

Nu publica automat noua pagină în meniuri și nu modifica modulele existente pentru a obține uniformitate.
Contractele de date și logica financiară rămân în documentele tematice; acest manual nu le redefinește.

## 14. Limite și neconcordanțe de reținut

- Valorile sunt din working tree-ul LAB; nu afirmă că aceeași versiune vizuală este publicată în producție.
- Importurile Google Fonts lipsesc explicit în paginile Constatări și Dezmembrări/captură inspectate; fallback-ul efectiv nu a fost verificat în browser.
- În [C&N CSS][cn-css], `.cn-template-variable` cere `font-family:var(--mono)`, dar definiția `--mono` nu a fost găsită în sursele HTML/CSS/JS inspectate; nu îl documenta drept token global disponibil.
- Managerul activ folosește `renderTrend()` și elemente DOM/CSS în [JS][manager-js], conform referințelor reconciliate din [01_ARHITECTURA.md](01_ARHITECTURA.md). Contextul redesignului este în [18_MANAGER_DASHBOARD_REDESIGN.md](18_MANAGER_DASHBOARD_REDESIGN.md).
- În C&N, min-width-ul tabelului și unele reguli mobile sunt suprascrise ulterior; în Manager, antetul și căutarea au suprascrieri finale. Prima declarație nu este întotdeauna rezultatul final.
- Nu au fost corectate fonturi, variabile, comentarii, titluri sau stiluri în această etapă documentară.

[index]: ../index.html
[avans]: ../modules/devize/avans.html
[manager-html]: ../modules/manager/manager.html
[manager-css]: ../modules/manager/manager.css
[manager-js]: ../modules/manager/manager.js
[cn-html]: ../modules/devize/clienti-notificari.html
[cn-css]: ../css/clienti-notificari.css
[const-html]: ../modules/formulare/constatari_v2.html
[const-css]: ../css/constatari_v2.css
[const-js]: ../js/constatari_v2.js
[sh-html]: ../modules/devize/comenzi_piese_sh.html
[sh-css]: ../css/comenzi_piese_sh.css
[sh-js]: ../js/comenzi_piese_sh.js
[dez-html]: ../modules/stocuri/dezmembrari.html
[dez-css]: ../css/dezmembrari.css
[dez-js]: ../js/dezmembrari.js
[cap-html]: ../modules/stocuri/dezmembrari_capture.html
[cap-css]: ../css/dezmembrari_capture.css
[draft-css]: ../css/local-deviz-drafts.css
[draft-js]: ../js/local-deviz-drafts.js
[common-css]: ../css/style.css
[login]: ../modules/admin/login.html
[deviz]: ../modules/devize/deviz.html
[df]: ../modules/devize/deviz_final.html
[print-df]: ../modules/devize/deviz-print.html
[print-const]: ../modules/formulare/constatare-print.html
