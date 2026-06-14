# Objava na splet — Oracle Cloud + domena + HTTPS

Vodič za objavo NK Goričanka spletne strani na **Oracle Cloud (Always Free)** strežniku,
dostopno prek lastne domene z varnim **HTTPS** (samodejni SSL certifikat prek Caddy).

Rezultat: `https://tvoja-domena.si` deluje javno, na enem brezplačnem strežniku,
v dveh ukazih po nastavitvi.

---

## 0. Kaj potrebuješ

- **Oracle Cloud račun** (https://cloud.oracle.com) — Always Free nivo.
- **Domeno** (npr. `.si` pri Domenca/registrarju, ali `.com` pri Namecheap/Cloudflare).
- SSH odjemalec (vgrajen v Windows PowerShell: `ssh`).

> 💡 **Brezplačno za vedno:** Oracle Always Free vključuje ARM strežnike
> *VM.Standard.A1.Flex* (do 4 OCPU + 24 GB RAM skupaj). To je idealno za to aplikacijo.
> Naše Docker slike (`mongo:7`, `node:20-alpine`, `caddy:2`) podpirajo ARM (arm64).

---

## 1. Ustvari strežnik (VM instanco)

V Oracle konzoli (regija **eu-frankfurt-1**):

1. **Menu → Compute → Instances → Create instance**
2. **Name:** `nkgoricanka`
3. **Image:** Canonical **Ubuntu 22.04**
4. **Shape:** *Ampere* → **VM.Standard.A1.Flex**, nastavi npr. **2 OCPU / 12 GB RAM**
   (vse znotraj Always Free).
   - Če ARM ni na voljo (»Out of host capacity«), poskusi kasneje ali izberi
     *VM.Standard.E2.1.Micro* (1 GB RAM — glej opombo o swapu spodaj).
5. **Add SSH keys:** izberi *Generate a key pair* in **prenesi privatni ključ**
   (npr. `nkg_key.key`), ali prilepi svoj javni ključ.
6. **Create.** Počakaj nekaj minut → zapiši si **javni IP** instance.

### Poveži se prek SSH (iz Windows PowerShell)

```powershell
# privatni ključ mora imeti omejene pravice
icacls "C:\pot\do\nkg_key.key" /inheritance:r /grant:r "$($env:USERNAME):(R)"
ssh -i "C:\pot\do\nkg_key.key" ubuntu@<JAVNI_IP>
```

---

## 2. Odpri vrata (mreža) — POMEMBNO

Treba je odpreti **80** (HTTP) in **443** (HTTPS) na **dveh** mestih:

### a) Oracle Security List (cloud požarni zid)
**Networking → Virtual Cloud Networks → (tvoj VCN) → Security Lists → Default →
Add Ingress Rules**, dodaj dve pravili:

| Source CIDR | IP Protocol | Destination Port |
|---|---|---|
| `0.0.0.0/0` | TCP | `80` |
| `0.0.0.0/0` | TCP | `443` |

(Port 22 za SSH je že odprt. Porta **5000 NE odpiraj** — dostop naj bo samo prek HTTPS.)

### b) Požarni zid v sistemu (Ubuntu)
Oracle Ubuntu slike privzeto blokirajo vse razen 22. Na strežniku zaženi:

```bash
sudo iptables -I INPUT 6 -m state --state NEW -p tcp --dport 80 -j ACCEPT
sudo iptables -I INPUT 6 -m state --state NEW -p tcp --dport 443 -j ACCEPT
sudo netfilter-persistent save
```

---

## 3. Namesti Docker

Na strežniku (preko SSH):

```bash
sudo apt-get update
curl -fsSL https://get.docker.com | sudo sh
sudo usermod -aG docker ubuntu
newgrp docker          # ali se odjavi in znova prijavi
docker version         # preveri
```

> **Samo če uporabljaš E2.1.Micro (1 GB RAM)** — dodaj 2 GB swap, da gradnja ne zmanjka spomina:
> ```bash
> sudo fallocate -l 2G /swapfile && sudo chmod 600 /swapfile
> sudo mkswap /swapfile && sudo swapon /swapfile
> echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
> ```

---

## 4. Prenesi kodo na strežnik

**Možnost A — prek Git (priporočeno).** Najprej projekt potisni v (zaseben) GitHub repo,
nato na strežniku:

```bash
git clone https://github.com/<uporabnik>/NKGoricanka.git
cd NKGoricanka
```

**Možnost B — prek SCP iz Windowsa** (brez `node_modules`):

```powershell
# v PowerShell na svojem računalniku, iz mape C:\doc\drugo
tar --exclude=node_modules --exclude=.git -czf nkg.tar.gz NKGoricanka
scp -i "C:\pot\do\nkg_key.key" nkg.tar.gz ubuntu@<JAVNI_IP>:~
```
Nato na strežniku:
```bash
tar -xzf nkg.tar.gz && cd NKGoricanka
```

---

## 5. Produkcijske nastavitve (`.env`)

Na strežniku uredi `.env` (`nano .env`) — **OBVEZNO spremeni skrivnosti**:

```env
PORT=5000
MONGO_URI=mongodb://mongo:27017/nkgoricanka
SESSION_SECRET=<DOLGA_NAKLJUČNA_VREDNOST>      # generiraj: openssl rand -hex 32
ADMIN_USERNAME=admin
ADMIN_PASSWORD=<MOČNO_GESLO>
SITE_URL=https://tvoja-domena.si               # tvoja prava domena (za SEO/OG)
SECURE_COOKIES=true                            # ker tečemo prek HTTPS (Caddy)
NODE_ENV=production
```

> `SESSION_SECRET` zgeneriraj z: `openssl rand -hex 32`

---

## 6. Domena (DNS zapisi)

Pri svojem registrarju (ali Cloudflare) ustvari **A zapisa**, ki kažeta na javni IP strežnika:

| Tip | Ime (host) | Vrednost |
|---|---|---|
| A | `@` | `<JAVNI_IP>` |
| A | `www` | `<JAVNI_IP>` |

> Če uporabljaš **Cloudflare**, med pridobivanjem certifikata pusti oblaček **siv (DNS only)**,
> da lahko Caddy izda Let's Encrypt certifikat. Kasneje ga lahko vklopiš (oranžen).

Počakaj, da se DNS razširi (običajno nekaj minut do ~1 ure). Preveri:
```bash
dig +short tvoja-domena.si      # mora vrniti tvoj IP
```

---

## 7. Vklopi HTTPS in zaženi

1. V datoteki **`Caddyfile`** zamenjaj `nkgoricanka.si` s **svojo domeno**.
2. *(priporočeno)* v `docker-compose.yml` zakomentiraj `ports:` pod servisom `app`,
   da port 5000 ni javen (Caddy ga doseže interno).
3. Zaženi z dodanim Caddy proxyjem:

```bash
docker compose -f docker-compose.yml -f docker-compose.caddy.yml up -d --build
```

Caddy bo samodejno pridobil SSL certifikat. Prvič lahko traja 10–60 s.

---

## 8. Preveri

- Odpri **`https://tvoja-domena.si`** → stran mora delovati prek HTTPS (zelena ključavnica).
- **`https://tvoja-domena.si/admin`** → prijava z `ADMIN_USERNAME` / `ADMIN_PASSWORD`.
- Predogled deljenja: prilepi povezavo do novice v npr. Facebook/Telegram → mora pokazati
  naslov, opis in sliko (Open Graph deluje, ker Express vrine meta tage).

Dnevniki, če kaj ne dela:
```bash
docker compose -f docker-compose.yml -f docker-compose.caddy.yml logs -f caddy
docker compose logs -f app
```

---

## 9. Vzdrževanje

**Posodobitev kode:**
```bash
git pull            # ali znova prenesi
docker compose -f docker-compose.yml -f docker-compose.caddy.yml up -d --build
```
Podatki (baza) in naložene slike **ostanejo** (Docker volumna `mongo_data`, `uploads_data`).

**Varnostna kopija baze:**
```bash
docker exec nkgoricanka-mongo mongodump --archive=/tmp/dump.gz --gzip --db nkgoricanka
docker cp nkgoricanka-mongo:/tmp/dump.gz ./backup-$(date +%F).gz
```

**Varnostna kopija slik:** vsebina volumna `uploads_data`
(`docker run --rm -v nkgoricanka_uploads_data:/u -v $PWD:/b alpine tar czf /b/uploads.tgz -C /u .`).

**Hardening (priporočeno):**
- Spremenjeno admin geslo + dolg `SESSION_SECRET` ✓ (4. korak)
- `SECURE_COOKIES=true` ✓ (samo prek HTTPS)
- Redne posodobitve: `sudo apt-get update && sudo apt-get upgrade -y`
- Vrata 5000 ne odpiraj javno (samo 80/443 + 22)

---

## 10. Pogoste težave

| Težava | Rešitev |
|---|---|
| Stran se ne odpre | Preveri **oba** požarna zidova (5. → 2a in 2b korak); preveri `dig` (DNS kaže na IP). |
| Caddy ne dobi certifikata | DNS še ni razširjen ali port 80/443 zaprt; poglej `logs caddy`. Cloudflare → siv oblaček. |
| »Out of host capacity« (ARM) | Poskusi kasneje / drugo *availability domain*, ali uporabi E2.1.Micro + swap. |
| Prijava ne deluje prek HTTPS | Preveri `SECURE_COOKIES=true` in da dostopaš prek `https://`. |
| Gradnja zmanjka spomina (micro) | Dodaj swap (3. korak) ali uporabi ARM A1 shape. |
