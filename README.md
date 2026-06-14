# NK Goričanka — spletna stran kluba

Profesionalna, polno responzivna spletna stran nogometnega kluba **NK Goričanka**
(Goričko / Rogašovci, Prekmurje). Zgrajena na **MERN** skladu (MongoDB, Express,
React, Node.js) z administracijo, nalaganjem slik in SEO za družbena omrežja.

Rdeče-rumen športni dizajn · vsebina v slovenščini · koda v angleščini.

---

## 🚀 Hiter zagon (Docker)

Potrebuješ **Docker** + **Docker Compose**.

```bash
# 1) (neobvezno) prilagodi nastavitve
cp .env.example .env        # privzeti .env je že priložen in deluje takoj

# 2) zgradi in zaženi
docker compose up -d --build
```

Nato odpri:

| | URL |
|---|---|
| Javna stran | http://localhost:5000 |
| Administracija | http://localhost:5000/admin |

**Privzeti administrator** (iz `.env`): `admin` / `admin123`
> ⚠️ V produkciji obvezno spremeni `ADMIN_PASSWORD` in `SESSION_SECRET`.

Ob prvem zagonu se baza **samodejno napolni** z demonstracijskimi podatki
(igralci, novice, tekme, podatki kluba) in ustvari administrator — vse je
**idempotentno** (ponovni zagoni ne podvajajo podatkov).

### Ustavitev / ponoven zagon

```bash
docker compose down              # ustavi (podatki in slike ostanejo v volumnih)
docker compose up -d --build     # ponoven build — slike in baza se OHRANIJO
docker compose down -v           # POZOR: izbriše tudi volumne (baza + slike)
```

---

## 🌐 Objava na splet (Oracle Cloud + domena + HTTPS)

Popoln vodič po korakih je v **[DEPLOY.md](DEPLOY.md)** — brezplačen Oracle Cloud strežnik,
lastna domena in samodejni SSL (Caddy). Na kratko:

```bash
# na strežniku, po nastavitvi .env (SITE_URL, SECURE_COOKIES=true) in domene/DNS:
docker compose -f docker-compose.yml -f docker-compose.caddy.yml up -d --build
```

---

## ⚙️ Okoljske spremenljivke (`.env`)

| Spremenljivka | Opis | Privzeto |
|---|---|---|
| `PORT` | port aplikacije | `5000` |
| `MONGO_URI` | povezava do MongoDB | `mongodb://mongo:27017/nkgoricanka` |
| `SESSION_SECRET` | skrivnost za seje | *(zamenjaj!)* |
| `ADMIN_USERNAME` | privzeti admin | `admin` |
| `ADMIN_PASSWORD` | privzeto geslo | `admin123` |
| `SITE_URL` | bazni URL za OG/canonical (v produkciji tvoja domena) | `http://localhost:5000` |
| `SECURE_COOKIES` | `true` samo pri HTTPS (varni piškotki sej) | `false` |

---

## 🧩 Kaj vsebuje

**Javni del**
- Domača stran (hero, zadnje novice, naslednja tekma & zadnji rezultat, hitre povezave)
- Novice — seznam + posamezna novica (`/news/:slug`)
- Igralski kader po pozicijah + profil igralca s statistiko
- Tekme — prihajajoče (razpored) in odigrane (rezultati, strelci)
- O klubu — zgodovina, kontakt, zemljevid (OpenStreetMap)
- 404 stran, prijazna sporočila o napakah

**Admin del** (`/admin`, prijava obvezna)
- Nadzorna plošča s statistiko
- CRUD: novice (objavi/skrij, naslovna slika), igralci (foto + statistika),
  tekme (rezultat + strelci)
- Urejanje podatkov kluba (zgodovina, kontakt, **barve**, družbena omrežja, grb, lokacija)

**Tehnične lastnosti**
- Avtentikacija: `express-session` + `bcryptjs`, seje v MongoDB (`connect-mongo`) → preživijo restart
- Nalaganje slik: `multer` → Docker volumen `/uploads` → slike ostanejo po `--build`
- Validacija: `express-validator`; varnostni headerji: `helmet` (CSP prilagojen za OSM embed)
- **SEO za SPA:** Express za javne strani (zlasti `/news/:slug`) v začetni HTML vrine
  `<title>`, meta description ter Open Graph / Twitter Card tage → delujejo predogledi
  ob deljenju in indeksiranje
- V produkciji Express servira zgrajen React build (isti origin) → samo 2 kontejnerja

---

## 🗂️ Struktura

```
NKGoricanka/
├── docker-compose.yml      # mongo + app, volumna: mongo_data, uploads_data
├── Dockerfile              # multi-stage: build React → run Express
├── .env / .env.example
├── CLAUDE.md               # popoln delovni kontekst (arhitektura, modeli, API …)
├── server/                 # Express API + SEO + servira build
│   └── src/{models,controllers,routes,middleware,seo,seed,config,utils}
└── client/                 # React (Vite) SPA
    └── src/{pages,components,context,api,hooks,styles,utils}
```

Podroben opis arhitekture, podatkovnih modelov in vseh API endpointov je v
[`CLAUDE.md`](CLAUDE.md).

---

## 💻 Razvoj brez Dockerja (neobvezno)

Potrebuješ lokalni MongoDB na `mongodb://localhost:27017`.

```bash
# Backend
cd server && npm install && npm run dev      # http://localhost:5000

# Frontend (nov terminal)
cd client && npm install && npm run dev      # http://localhost:5173 (proxy /api → :5000)
```

---

## 🖼️ Podatki, logo in avtorske pravice — POMEMBNO

- Prikazani **igralci, novice in tekme so demonstracijski (placeholder)** podatki,
  jasno označeni. Zamenjaj jih prek administracije.
- Leto ustanovitve in točen naslov igrišča nista uradno potrjena — **preveri in popravi**
  v *Admin → Podatki kluba*.
- **Logo in fotografije:** trenutni grb je generičen SVG placeholder. Uradni logo in
  fotografije kluba so lahko **avtorsko zaščiteni** — pred javno objavo jih nadomesti
  z **uradnimi mediji kluba** (naloži prek administracije).

---

## 🏗️ Tehnologije

React 18 · Vite · React Router 6 · Express 4 · Mongoose 8 · MongoDB 7 ·
express-session · connect-mongo · bcryptjs · multer · helmet · express-validator · Docker
