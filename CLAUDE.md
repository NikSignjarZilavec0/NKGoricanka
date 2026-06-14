# CLAUDE.md — NK Goričanka spletna stran

> Delovni kontekst projekta. Posodablja se ob vsakem večjem koraku.
> Vsa **koda** je v angleščini, vsa **vsebina strani** v slovenščini.

## 1. Pregled in cilj

Produkcijsko pripravljena spletna stran nogometnega kluba **NK Goričanka**
(Rogašovci / Goričko, Prekmurje, Slovenija). Cilj: po `docker compose up -d --build`
stran v celoti deluje brez dodatnih korakov — vključno z bazo, seed podatki in
privzetim administratorjem.

Funkcionalnosti:
- **Javni del:** domača stran, novice (seznam + posamezna z `slug`), igralski kader,
  profil igralca, tekme (prihajajoče + odigrane), o klubu (zgodovina, kontakt, zemljevid).
- **Admin del** (`/admin`, prijava obvezna): CRUD novice / igralci / tekme + urejanje
  podatkov o klubu.
- **SEO za SPA:** Express za javne strani vrine `<title>`, meta description in
  Open Graph / Twitter Card tage v začetni HTML.

## 2. Stack in razlogi

| Plast | Tehnologija | Razlog |
|-------|-------------|--------|
| Baza | MongoDB + Mongoose | zahteva (MERN), prožna shema |
| Backend | Node.js + Express (REST) | zahteva, zrel ekosistem |
| Frontend | React 18 + Vite + React Router 6 | hiter build, SPA |
| Stanje | React Context (`AuthContext`) | dovolj za obseg, brez Redux boilerplata |
| Avtentikacija | express-session + bcryptjs + connect-mongo | seje v Mongo → preživijo restart |
| Slike | multer → Docker volumen `/uploads` | slike preživijo `--build` |
| Validacija | express-validator | standard, deklarativno |
| Varnost | helmet | varnostni HTTP headerji |
| SEO | lasten `seoRenderer` middleware | vrine meta tage v `index.html` |

**Opomba:** uporabljen je `bcryptjs` (čisti JS) namesto `bcrypt` (native), da se izognemo
prevajanju native modulov v Alpine Docker sliki — API je enak.

V **produkciji** Express servira zgrajen React build (isti origin) → potrebna sta le
2 kontejnerja: `mongo` + `app`.

## 3. Arhitektura / mape

```
NKGoricanka/
├── docker-compose.yml        # mongo + app, 2 volumna (data, uploads)
├── Dockerfile                # multi-stage: build client → run server
├── .env / .env.example       # vse nastavitve
├── server/                   # Express API + servira React build + SEO
│   └── src/
│       ├── index.js          # entry: connect DB → seed → listen
│       ├── app.js            # express app (helmet, session, routes, SEO, static)
│       ├── config/db.js
│       ├── models/           # User, News, Player, Match, ClubInfo
│       ├── middleware/       # auth, upload (multer), validate, errorHandler
│       ├── controllers/      # auth, news, player, match, club
│       ├── routes/           # /api/* routerji
│       ├── seo/seoRenderer.js
│       ├── utils/slugify.js
│       └── seed/seed.js      # idempotenten seed + privzeti admin
└── client/                   # React SPA (Vite)
    └── src/
        ├── main.jsx, App.jsx, index.css (design system)
        ├── api/              # axios instance + servisi
        ├── context/AuthContext.jsx
        ├── components/       # Navbar, Footer, Cards, Layout, ProtectedRoute ...
        └── pages/            # public + admin strani
```

**Povezava backend/frontend:** v dev teče Vite (5173) s proxyjem `/api` in `/uploads`
na Express (5000). V produkciji Express servira `client/dist` + vrača `index.html`
(s SEO meta tagi) za vse ne-API poti.

## 4. Podatkovni modeli (Mongoose)

- **User**: `username` (unique), `passwordHash`, `role` (`admin`), `createdAt`
- **News**: `title`, `slug` (unique), `content`, `excerpt`, `coverImage`, `author`,
  `published` (bool), `publishedAt`, timestamps
- **Player**: `name`, `position` (`goalkeeper|defender|midfielder|forward`), `shirtNumber`,
  `birthdate`, `heightCm`, `photo`, `bio`, `nationality`, `active`,
  `stats {appearances, goals, assists, yellowCards, redCards}`, timestamps
- **Match**: `opponent`, `opponentLogo`, `isHome`, `date`, `location`, `competition`,
  `season`, `status` (`upcoming|finished|cancelled`), `score {ours, theirs}`,
  `scorers [{playerName, minute}]`, timestamps
- **ClubInfo** (singleton): `name`, `shortName`, `foundedYear`, `history`, `address`,
  `email`, `phone`, `colors {primary, accent}`, `socialLinks {facebook, instagram, ...}`,
  `logo`, `mapEmbedUrl`, `latitude`, `longitude`

## 5. API endpointi

Javni (GET):
- `GET /api/club`
- `GET /api/news` (objavljene), `GET /api/news/:slug`
- `GET /api/players`, `GET /api/players/:id`
- `GET /api/matches` (`?status=upcoming|finished`), `GET /api/matches/:id`

Avtentikacija:
- `POST /api/auth/login`, `POST /api/auth/logout`, `GET /api/auth/me`

Admin (zaščiteno z `requireAuth`):
- News: `GET /api/news/admin/all`, `POST /api/news`, `PUT /api/news/:id`, `DELETE /api/news/:id`
- Players: `POST /api/players`, `PUT /api/players/:id`, `DELETE /api/players/:id`
- Matches: `POST /api/matches`, `PUT /api/matches/:id`, `DELETE /api/matches/:id`
- Club: `PUT /api/club`

Nalaganje slik gre prek `multipart/form-data` (polje `image` / `coverImage` / `photo` / `logo`).

## 6. Okoljske spremenljivke

| Spremenljivka | Opis | Privzeto (.env) |
|---------------|------|-----------------|
| `PORT` | port Express strežnika | `5000` |
| `MONGO_URI` | povezava do MongoDB | `mongodb://mongo:27017/nkgoricanka` |
| `SESSION_SECRET` | skrivnost za seje | (zamenjaj v produkciji) |
| `ADMIN_USERNAME` | privzeti admin | `admin` |
| `ADMIN_PASSWORD` | privzeto admin geslo | `admin123` |
| `SITE_URL` | bazni URL za absolutne OG povezave | `http://localhost:5000` |
| `NODE_ENV` | okolje | `production` |

## 7. Zagon

```bash
docker compose up -d --build
# odpri http://localhost:5000  (admin: http://localhost:5000/admin)
```

Privzeti admin (iz `.env`): **admin / admin123** — zamenjaj v produkciji.

Lokalni razvoj (brez Dockerja): `mongo` lokalno, `cd server && npm i && npm run dev`,
`cd client && npm i && npm run dev` (Vite na 5173 s proxyjem na 5000).

## 8. Stanje nalog

### Dokončano
- [x] Struktura projekta (server/ + client/), Docker (Dockerfile multi-stage, compose, 2 volumna)
- [x] Okolje prek `.env` / `.env.example` (+ delujoč `.env`)
- [x] Mongoose modeli: User, News, Player, Match, ClubInfo (singleton)
- [x] Backend: helmet+CSP, express-session+connect-mongo, multer (2.x), express-validator
- [x] Controllerji + routerji za vse vire; auth (login/logout/me) z bcryptjs + regenerate seje
- [x] Idempotenten seed (admin iz .env + realistični placeholder podatki) ob praznem stanju
- [x] SEO middleware: vrine title/description/OG/Twitter v index.html (home, /news/:slug, /players/:id, sekcije)
- [x] Frontend: React 18 + Vite + Router; AuthContext + ClubContext (žive klubske barve prek CSS spr.)
- [x] Javne strani: domov, novice (seznam+slug), kader+profil, tekme (taba), o klubu (OSM zemljevid), 404
- [x] Admin: prijava, dashboard, CRUD novice/igralci/tekme, urejanje kluba (barve, soc., logo, lokacija)
- [x] Rdeče-rumen dizajn (design system v `index.css` + `styles/site.css`), polno responzivno, hamburger meni
- [x] Client build (vite) uspešen; server moduli prestanejo `node --check`; 0 npm ranljivosti (server)
- [x] **End-to-end preverjeno z `docker compose up -d --build`:**
  - oba kontejnerja delujeta (mongo healthy), seed se izvede 1×, ob ponovnem buildu NE podvaja (idempotentno)
  - vse javne strani vračajo 200 s pravilnimi SEO `<title>`; OG/Twitter tagi vrineni (home=website, /news/:slug=article)
  - login (napačno→401, pravilno→seja), zaščitena pot brez seje→401, z sejo→OK
  - nalaganje slike (multer)→ shranjena, servirana (200), **preživi `--build`** (volumen); podatki prav tako
  - vizualno preverjeno (Vite preview): domov/hero, novice, kader, profil igralca, tekme, o klubu (OSM zemljevid),
    admin prijava+dashboard+CRUD modal, mobilni hamburger meni — brez napak v konzoli

### TODO / znane omejitve
- Uradni **logo in fotografije** kluba so lahko avtorsko zaščiteni → pred javno objavo
  zamenjaj s uradnimi mediji kluba (glej README). Trenutno: SVG placeholder logo + barvni placeholderji.
- Realni podatki (igralci, tekme, novice) so **placeholder** in jasno označeni — zamenjaj prek admina.
- Leto ustanovitve / točen naslov igrišča nista javno potrjena → preveri in popravi v admin → O klubu.
