# Vityilló – élesítés előtti ellenőrzőlista

**Jog · GDPR · biztonság · akadálymentesség · indexelés tiltása**

Állapot: 2026-10-01 · Stack: Next.js 16.3 (App Router, statikus generálás), Vercel, Supabase Storage (csak média), Resend (e-mail), SerpApi (Google-vélemények)

> **Fontos:** ez a dokumentum fejlesztői és megfelelési ellenőrzőlista, nem jogi tanácsadás. A jogi szövegeket (Impresszum, Adatkezelési tájékoztató, ÁSZF, lemondási feltételek) élesítés előtt nézze át ügyvéd vagy adatvédelmi szakértő.

**Jelölések:** ✅ a kódban megoldva (ennek a változtatásnak a része) · ⛔ blokkoló, élesítés előtt kötelező · ⚠️ erősen ajánlott · ℹ️ tájékoztató

---

## 0. Go / No-Go – mi blokkolja az élesítést?

| # | Teendő | Felelős | Állapot |
|---|---|---|---|
| 1 | **Adószám** (8-1-2 jegyű) az Impresszumba – az Ektv. 4. § szerint kötelező; a többi üzemeltetői adat már valós (2026-10-01) – lásd [1.6](#16-kitöltendő-adattábla) | tulajdonos | ⛔ |
| 2 | ÁSZF és lemondási feltételek véglegesítése a valós előleg-/lemondási szabályokkal, ügyvédi átnézéssel | tulajdonos + ügyvéd | ⛔ |
| 3 | Adatfeldolgozói szerződések (DPA) elfogadása: Vercel, Supabase, Resend – lásd [2.5](#25-szerződések-és-adattovábbítás) | tulajdonos | ⛔ |
| 4 | Rate limit szabály a Vercel Firewallban `/api/contact` és `/api/booking` útvonalra – lásd [3.5](#35-rate-limit--vercel-firewall) | fejlesztő | ⛔ |
| 5 | `SITE_INDEXABLE` beállítása (élesítéskor `true`), **utána Redeploy** – lásd [5.6](#56-élesítés-az-indexelés-bekapcsolása) | fejlesztő | ⛔ |
| 6 | `DevNoticeModal` („Bemutató verzió”) eltávolítása, valamint `BOOKING_ENABLED = true` (`lib/booking.ts`) és `CONTACT_ENABLED = true` (`lib/site.ts`) – csak ha a foglalás és az üzenetküldés valóban élesedik. Előtte: `CONTACT_EMAIL_TO` = vityillo.szomod@gmail.com a Vercelen. Jelenleg mindkettő ki van kapcsolva (az űrlap letiltva, a szerver 503-at ad). | fejlesztő | ⛔ |
| 7 | Facebook/Instagram linkek a láblécben placeholderek (`https://facebook.com`) – valós profil vagy eltávolítás | tulajdonos | ⚠️ |
| 8 | „Szauna” tartalom valós fotóval (most kandallós képet mutat, `lib/content.ts` → `sauna`) – különben megtévesztő lehet | tulajdonos | ⚠️ |
| 9 | „★★★ / 3 csillag” jelölés (`testimonials.starsLabel`) csak hivatalos minősítési tanúsítvány birtokában maradhat | tulajdonos | ⚠️ |
| 10 | Supabase-videók újrafeltöltése `cacheControl`-lal (`optimized-videos/`) | fejlesztő | ⚠️ |
| 11 | Helyi `data/messages.ndjson` törlése – korábbi fejlesztői űrlapbeküldések személyes adatokkal; a kód már nem ír ide | fejlesztő | ⚠️ |
| 12 | Akadálymentességi manuális teszt (NVDA + billentyűzet) – lásd [4.3](#43-tesztelési-protokoll) | fejlesztő | ⚠️ |

### Ebben a változtatásban elkészült (kód)

| Terület | Mi | Fájlok |
|---|---|---|
| Indexelés | `X-Robots-Tag` minden válaszon, `<meta name="robots">`, robots.txt sitemap nélkül + AI-crawlerek tiltása, `/sitemap.xml` → 404; egy kapcsoló: `SITE_INDEXABLE` | `lib/site.ts`, `next.config.ts`, `app/layout.tsx`, `app/robots.ts`, `app/sitemap.ts` |
| Biztonsági fejlécek | CSP, HSTS (csak Vercelen), nosniff, Referrer-Policy, X-Frame-Options, Permissions-Policy, COOP | `next.config.ts` |
| Hozzájárulás | Új banner (azonos súlyú „Mindet elfogadom” / „Csak a szükségesek”, Beállítások nézet), újranyitható a láblécből; a régi, tájékozatlan hozzájárulás törölve | `lib/consent.ts`, `components/layout/CookieBanner.tsx`, `Footer.tsx` |
| Google Térkép | Kétkattintásos betöltés: hozzájárulás nélkül nincs kérés a Google felé | `components/sections/LocationMap.tsx`, `app/[lang]/kapcsolat/page.tsx` |
| Adattakarékosság | A foglalási űrlap már nem kér nemet, születési évet, állampolgárságot, lakóhelyet, irányítószámot; 18+ checkbox; nincs lemezre írás; naplóban csak azonosító | `BookingWizard.tsx`, `lib/booking-schema.ts`, `lib/email.ts`, `app/api/*` |
| API-védelem | Origin/Referer/Sec-Fetch-Site ellenőrzés, content-type és 16 KB méretkorlát, honeypot, CR/LF-szűrés, `locale` enum | `lib/api-guard.ts`, `lib/validation.ts`, `components/ui/Honeypot.tsx` |
| Űrlapok | GDPR 13. cikk szerinti tájékoztatás a beküldés helyén, ÁSZF-checkbox külön, `aria-invalid` / `aria-describedby` / `aria-required` | `components/ui/FormField.tsx`, `ContactForm.tsx`, `BookingWizard.tsx` |
| Akadálymentesség | „Ugrás a tartalomra” link (Lenis-kompatibilis) | `components/layout/SkipLink.tsx` |
| Fogyasztóvédelem | Kitalált tartalék-vélemények és kitalált átlagértékelés eltávolítva | `components/sections/GuestStories.tsx`, dictionaries |
| Adatkezelési tájékoztató | Kóddal igazolható szakaszok javítva/bővítve (hu/en/de): kezelt adatok, jogalapok, adatfeldolgozók, Google Térkép, helyi tárolás, jogok | `dictionaries/*.json` → `legal.privacy` |
| Tesztek | Vitest, 28 teszt (origin-mátrix, méretkorlát, honeypot, consent parse/cache) | `lib/*.test.ts`, `vitest.config.mts` |

---

## 1. Jogi dokumentumok

### 1.1 Impresszum – kötelező adatok

Jogalap: az elektronikus kereskedelmi szolgáltatásokról szóló **2001. évi CVIII. törvény (Ektv.) 4. §**. A weboldalon könnyen, közvetlenül és folyamatosan elérhetőnek kell lennie (✅ a láblécben minden oldalon ott a link).

Kötelező tartalom:

1. **A szolgáltató neve** – cégnév (Kft. esetén teljes cégnév) vagy egyéni vállalkozó / magánszemély neve.
2. **Székhely / lakcím**, valamint a telephely, ha eltér (a szálláshely címe: Szomód, Szőlősor dűlő 119.).
3. **Elérhetőség** – telefon és **rendszeresen használt e-mail-cím**.
4. **Nyilvántartási adatok** – cégjegyzékszám és a nyilvántartó bíróság, vagy egyéni vállalkozói nyilvántartási szám.
5. **Adószám** (közösségi adószám, ha van).
6. **Szálláshely nyilvántartási (NTAK-) szám** és a nyilvántartást vezető hatóság (a település jegyzője). A szálláshely-szolgáltatás szabályai (239/2009. Korm. rendelet) szerint a nyilvántartási számot a szálláshely hirdetésében fel kell tüntetni – ellenőrizze az aktuális szöveget.
7. **Tárhelyszolgáltató** neve, címe, **e-mail-címe** – ✅ Vercel Inc., 440 N Barranca Avenue #4133, Covina, CA 91723, USA; privacy@vercel.com (a Vercel adatkezelési tájékoztatója szerint, frissítve 2026. 06. 01.).
8. Ha van: kamarai tagság, szakmai engedély, felelős szerkesztő.

> ℹ️ Magánszálláshely (magánszemély) esetén nincs cégjegyzékszám; helyette név, lakcím vagy értesítési cím, adóazonosító / adószám és NTAK-szám kell.

### 1.2 Adatkezelési tájékoztató – vázlat (GDPR 13. cikk)

A kóddal igazolható részeket ✅ frissítettük (`legal.privacy`, 8 szakasz, hu/en/de). A teljes dokumentum kötelező elemei:

1. **Adatkezelő** – név, cím, e-mail, telefon (⛔ fiktív most). Adatvédelmi tisztviselő: kis szálláshelynek nem kötelező; ha nincs, ez ne szerepeljen.
2. **Kezelt adatok köre** – adatkategóriánként, forrás szerint (✅ kész: kapcsolatfelvétel, foglalási kérés, bejelentkezéskori vendégadatok).
3. **Célok és jogalapok** – célonként külön sor (✅ kész):

   | Cél | Adatok | Jogalap (GDPR 6. cikk) | Megőrzés |
   |---|---|---|---|
   | Kapcsolatfelvétel | név, e-mail, (telefon), üzenet | (1) b) / f) | ⛔ konkrét idő, pl. lezárástól 1 év |
   | Foglalási kérés | név, e-mail, telefon, dátumok, létszám | (1) b) – szerződést megelőző lépés | ⛔ meghiúsulás esetén pl. 6 hónap |
   | Bejelentkezés, NTAK, VIZA | jogszabály szerinti vendégadatok | (1) c) – jogi kötelezettség | jogszabály szerint |
   | Számvitel | számla adatai | (1) c) | 8 év (Számv. tv. 169. §) |
   | Google Térkép betöltése | IP-cím, Google-sütik | (1) a) – hozzájárulás | Google szabályai szerint |
   | Szervernaplók (Vercel) | IP, user-agent, időpont | (1) f) – biztonság | ⛔ a Vercel-csomag szerint |

   ⚠️ Jogos érdek (f) esetén a tájékoztatónak meg kell neveznie az érdeket, és el kell végezni az érdekmérlegelési tesztet (belső dokumentum).
4. **Címzettek / adatfeldolgozók** (✅ kész): Vercel (tárhely), Supabase (média), Resend (e-mail). Önálló adatkezelő: Google (Térkép). Jogszabály alapján: NTAK, hatóságok.
5. **Harmadik országba történő továbbítás** – EU–USA Data Privacy Framework (DPF) vagy általános adatvédelmi kikötések (SCC). ⛔ Ellenőrizze, hogy a Vercel, a Supabase és a Resend szerepel-e a DPF-listán (dataprivacyframework.gov), és mi szerepel a DPA-jukban.
6. **Megőrzési idők** – célonként konkrét idő vagy kritérium (⛔ a „cél megszűnéséig” túl homályos).
7. **Érintetti jogok** (✅ kész): hozzáférés, helyesbítés, törlés, korlátozás, adathordozhatóság, tiltakozás, a hozzájárulás visszavonása; panasz a NAIH-nál (1055 Budapest, Falk Miksa utca 9–11.; naih.hu), bírósági jogorvoslat.
8. **Az adatszolgáltatás jellege** – a foglaláshoz szükséges mezők hiányában a kérés nem teljesíthető; az NTAK-adatok megadása jogszabályi kötelezettség.
9. **Automatizált döntéshozatal, profilalkotás** – nincs; ezt ki kell mondani.
10. **Sütik és helyi tárolás** (✅ kész, lásd 1.3).
11. **Hatály, módosítás dátuma, verziókövetés.**

### 1.3 Süti- és helyitárolás-tájékoztató

A Vityilló **nem használ követő-, analitikai vagy hirdetési sütit**. A valós leltár (a kódból):

| Kulcs | Tároló | Cél | Kategória | Élettartam |
|---|---|---|---|---|
| `vityillo-consent-v1` | localStorage | hozzájárulási döntés | nélkülözhetetlen | törlésig |
| `vityillo-theme` | localStorage | világos/sötét téma | nélkülözhetetlen (felhasználó kérte) | törlésig |
| `hasWatchedCinematic` | localStorage | nyitó animáció lejátszva | nélkülözhetetlen | törlésig |
| `vityillo-dev-notice-seen`, `cinematic-prompt-seen`, `cinematic-force` | sessionStorage | megjelenítési állapot | nélkülözhetetlen | fül bezárásáig |
| `vityillo-fx` | localStorage | csak teszteléshez, kézi beállítás; a site nem írja | – | – |
| Google-sütik (pl. `NID`) | Google domain | Térkép | **hozzájárulás-köteles** | Google szerint |

Jogalap: ePrivacy-irányelv 5. cikk (3) – Magyarországon az Eht. 155. § (4). A nélkülözhetetlen tároláshoz nem kell hozzájárulás, a Google Térképhez igen (✅ kétkattintásos megoldás).

⚠️ Szabály a jövőre: **új harmadik fél** (analitika, chat, Facebook Pixel, YouTube-beágyazás) csak akkor kerülhet be, ha a `lib/consent.ts`-ben új kategóriát kap, a banner és ez a táblázat is frissül, és a betöltés a `useConsent()` mögött van.

### 1.4 ÁSZF – vázlat (szálláshely-szolgáltatás, online foglalási kérés)

1. **Szolgáltató adatai** (= Impresszum) és a szálláshely NTAK-száma.
2. **Tárgy és hatály** – szálláshely-szolgáltatás a weboldalon keresztül; fogyasztói szerződés.
3. **A szerződés létrejötte** – a weboldali űrlap **ajánlatkérés**; a szerződés az üzemeltető írásos visszaigazolásával jön létre (✅ ezt a jelenlegi szöveg is mondja). Tartalmaznia kell:
   - az elektronikus szerződéskötés **technikai lépéseit** (a 3 lépéses varázsló), a **beviteli hibák javításának** módját (Vissza gomb, összesítő), a **szerződés nyelveit** (hu/en/de), és azt, hogy a szerződést iktatják-e és utóbb hozzáférhető-e – **Ptk. 6:82. §**, Ektv. 5–6. §;
   - az ÁSZF szerződésbe épülését (**Ptk. 6:77–6:81. §**): a foglalás előtt megismerhető, elfogadása aktív ✅ (külön checkbox).
4. **Árak és fizetés** – bruttó végár, HUF; az árak fő/éj és hétköznap/hétvége szerinti logikája; **idegenforgalmi adó** külön (összeg, kinek fizetendő); előleg mértéke, határideje, módja; a maradék fizetése.
5. **Elállási jog kizárása** – **45/2014. (II. 26.) Korm. rendelet 29. § (1) l)**: meghatározott időpontra szóló szálláshely-szolgáltatásnál a fogyasztót nem illeti meg a 14 napos elállási jog. ⛔ Ezt kifejezetten fel kell tüntetni, különben a fogyasztó elállhat.
6. **Lemondási feltételek** – lásd 1.5.
7. **Érkezés/távozás, házirend** – 15:00 / 10:00, dohányzás, háziállat, csendrendelet, maximális létszám (6 fő), a wellness-eszközök (jacuzzi, szauna, medence) használati szabályai, gyermekfelügyelet.
8. **Kártérítés és felelősség** – ⚠️ A felelősség nem zárható ki szándékos vagy súlyosan gondatlan szerződésszegésre, illetve életet, testi épséget vagy egészséget megkárosító szerződésszegésre (**Ptk. 6:152. §**). A jelenlegi „nem vállal felelősséget…” mondat ennél szélesebben fogalmaz, ezért át kell írni.
9. **Panaszkezelés** – **Fgytv. (1997. évi CLV. tv.) 17/A. §**: hol és hogyan lehet panaszt tenni (e-mail, telefon, helyben); szóbeli panasznál jegyzőkönyv; az írásbeli panaszra 30 napon belül érdemi, indokolt válasz; a jegyzőkönyv és a válasz megőrzése a jogszabályban előírt ideig.
10. **Jogérvényesítés** – fogyasztóvédelmi hatóság (vármegyei kormányhivatal), illetve a **Komárom-Esztergom Vármegyei Békéltető Testület** (Tatabánya – a pontos címet a bekeltetes.hu-n ellenőrizze); a vállalkozást együttműködési kötelezettség terheli. ℹ️ Az uniós online vitarendezési (ODR) platform 2025. július 20-án megszűnt, ezért az ODR-link már nem kötelező.
11. **Irányadó jog, nyelv, hatály, módosítás.**

### 1.5 Lemondási és visszatérítési szabályzat – vázlat

Lehet az ÁSZF fejezete vagy külön oldal; az ÁSZF-ben mindenképp hivatkozni kell rá.

1. **Előleg** – mértéke (% vagy összeg), esedékessége, módja (átutalás, SZÉP-kártya stb.).
2. **Lemondási határidők, sávosan** – pl. érkezés előtt > 14 nap: teljes előleg-visszatérítés; 14–7 nap: 50%; < 7 nap vagy no-show: nem jár vissza. (A jelenlegi szöveg 14 napos küszöböt használ – ⛔ véglegesíteni kell.)
3. **A lemondás módja** – írásban (e-mail), és a beérkezés időpontja számít.
4. **Visszatérítés** – határidő (pl. 14 napon belül), módja (az eredeti fizetési mód), a költségek viselése.
5. **Az üzemeltető általi lemondás** – teljes visszatérítés, kiváltó szálláshely felajánlása.
6. **Vis maior / hatósági korlátozás** – utalvány vagy visszatérítés.
7. **Korábbi távozás** – visszatérítés jár-e.
8. **Módosítás** – dátumcsere feltételei.

### 1.6 Kitöltendő adattábla

| Adat | Most a kódban (2026-10-01) | Állapot |
|---|---|---|
| Üzemeltető | Ádám Róbert, adószámmal rendelkező magánszemély | ✅ |
| Szálláshely típusa | magánszálláshely | ✅ |
| Cím | 2896 Szomód, Szőlősor dűlő 119. (telephely és levelezési cím) | ✅ |
| Cégjegyzékszám | – (magánszemélynél nincs) | ✅ eltávolítva |
| **Adószám** | **hiányzik** – a sor nem jelenik meg, amíg nincs megadva | ⛔ |
| NTAK-szám | MA25108720 | ✅ |
| Nyilvántartó hatóság (jegyző) | nincs feltüntetve | ⚠️ ajánlott pótolni |
| Telefon, e-mail | +36 30 455 2876, vityillo.szomod@gmail.com (hu/en/de, lábléc + jogi oldalak) | ✅ |
| Tárhelyszolgáltató | Vercel Inc., Covina, privacy@vercel.com | ✅ |
| Előleg, lemondási sávok | 14 napos szabály (vázlat) | ⛔ |
| Megőrzési idők célonként | „cél megszűnéséig” | ⛔ |
| Supabase-projekt régiója | ismeretlen | ⚠️ |

⚠️ **Adószám ≠ adóazonosító jel.** A weboldalra az **adószám** kerül (8-1-2 jegyű, pl. 12345678-1-11). A 10 jegyű adóazonosító jel személyes azonosító, ezért soha nem kerülhet ki.

Az adatok helye: `dictionaries/{hu,en,de}.json` → `legal.imprint`, `legal.privacy.sections[0]`, `legal.terms`, `footer` (mindhárom nyelven, azonos szerkezetben).

### 1.7 Eszközök licencauditja (képek, fontok, ikonok, védjegy)

**Leltár a kódból:**

| Eszköz | Forrás | Licenc / jogállás | Teendő |
|---|---|---|---|
| Fotók (35 db) | saját fotók (`images/` → Supabase) | szerzői jog a fotósé (Szjt.) | ⛔ írásos **felhasználási engedély** a fotóstól (ha nem a tulajdonos fotózott), amely a webes és marketingcélú felhasználásra is kiterjed |
| Felismerhető személyek a képeken | – | képmáshoz való jog (Ptk. 2:48. §) | ⚠️ hozzájáruló nyilatkozat, vagy olyan kép, amelyen nem azonosítható senki |
| Drónfelvételek (videók) | Supabase | drónrepülési szabályok, magánszféra | ℹ️ ellenőrizze a felvétel jogszerűségét |
| Playfair Display, Inter | `next/font/google` – **build időben önhosztolt**, a látogató nem kér semmit a Google-tól | SIL Open Font License 1.1 | ✅ rendben; a licencszöveget érdemes megőrizni |
| Ikonok | `lucide-react` | ISC | ✅ |
| Animáció | GSAP | Webflow / GreenSock ingyenes „standard” licenc (nem OSI) | ℹ️ olvassa el a licencfeltételeket (gsap.com/standard-license) |
| Logó (szarvas + hegy + fenyők) | saját (`public/brand/`) | szerzői jog a tervezőé | ⚠️ átruházási vagy felhasználási szerződés a tervezővel; **védjegykutatás** az SZTNH e-kutatásában (és EUIPO/TMview) a „Vityilló” névre és a logóra; ha üzleti szempontból fontos, védjegybejelentés |
| Google-vélemények | SerpApi → `/api/reviews` | a vélemények szövege a szerzőké; a Google ÁSZF-je | ⚠️ lásd alább |
| Google Maps embed | Google | Google Maps ÁSZF | ✅ hozzájárulással |

**Google-vélemények – két kockázat:**

1. **Fogyasztóvédelem:** ha a weboldal véleményeket mutat, tájékoztatni kell arról, *hogyan biztosítja*, hogy azok valódi vendégektől származnak (UCPD 7. cikk (6) / Fttv.). A kód a szöveges értékelésekre szűr – ez szelekció, ezért egy rövid sor kell a fal alá, például: „Forrás: Google-értékelések; csak a szöveges véleményeket jelenítjük meg, szűrés és módosítás nélkül.” ✅ A kitalált tartalékvéleményeket és a belőlük számolt átlagot eltávolítottuk; a kitalált vélemény feketelistás tisztességtelen gyakorlat.
2. **GDPR:** a véleményírók neve személyes adat. Adattakarékos megoldás: csak keresztnév + kezdőbetű („Eszter K.”). A Google ÁSZF-je korlátozza a Google-tartalom kivételét; a SerpApi-s lekérés használatát jogilag mérlegelni kell (alternatíva: a hivatalos Google Places API szabályai szerinti megjelenítés).

**Licencnapló sablon** (vezesse pl. `docs/asset-licenses.md` néven):

```markdown
| Fájl / csoport | Szerző | Forrás | Licenc / szerződés | Kelt | Engedélyezett felhasználás | Bizonyíték helye |
|---|---|---|---|---|---|---|
| public/images/hot-tub-*.webp | Kovács Fotó Bt. | megbízás | felhasználási szerződés #12 | 2026-06-01 | web, social, nyomtatott | Drive/Jog/fotó-szerz.pdf |
| Playfair Display | Claus Eggers Sørensen | Google Fonts | OFL 1.1 | – | korlátlan | licenses/OFL.txt |
```

Folyamat: (1) leltár (`public/`, Supabase bucket, CSS `url()`, `next/font`, npm-csomagok) → (2) minden tételhez licenc vagy szerződés → (3) amihez nincs bizonyíték, azt csere vagy eltávolítás → (4) új eszköz csak a napló frissítésével kerülhet be.

npm-függőségek licencei egy paranccsal:

```bash
npx license-checker --production --summary
```

---

## 2. Adatvédelem (GDPR, adattakarékosság)

### 2.1 Hozzájárulás – a megvalósított minta

Szabályok, amelyeket a ✅ új banner betart (EDPB 05/2020 és 03/2022 iránymutatások):

- **Nincs előzetes betöltés:** a Google Térkép a döntés előtt nem kér le semmit (✅ ellenőrizve: friss böngészőben 0 kérés a google.com felé).
- **Azonos súlyú gombok:** a „Mindet elfogadom” és a „Csak a szükségesek” ugyanazt a stílust kapja, egy kattintásra érhető el, nincs rejtett elutasítás.
- **Granularitás:** a Beállítások nézetben kategóriánként lehet dönteni; a jelölőnégyzet alapból **nincs bepipálva**.
- **Visszavonás ugyanolyan könnyű:** „Süti-beállítások” a láblécben, minden oldalon (GDPR 7. cikk (3)).
- **Verziózás:** `vityillo-consent-v1` – ha a kategóriák változnak, a `CONSENT_VERSION` emelése mindenkit újrakérdez. A régi, tájékozatlan `accepted` értéket töröltük.
- **Tájékozottság:** a szöveg megnevezi a Google-t, az IP-címet és a sütiket, és a tájékoztatóra linkel.
- **Nem modális:** nem blokkolja az oldalt („cookie wall” nincs), és első látogatáskor nem veszi el a fókuszt.

```tsx
// Bármely jövőbeli harmadik fél ugyanígy gate-elendő:
import { hasExternalConsent, useConsent } from '@/lib/consent'

const consent = useConsent()             // 'unknown' | 'undecided' | 'decided'
if (!hasExternalConsent(consent)) return <ConsentPlaceholder />  // semmi külső kérés
return <ThirdPartyEmbed />
```

### 2.2 Űrlapok – tájékoztatás vagy hozzájárulás?

| Helyzet | Helyes megoldás | Vityilló |
|---|---|---|
| Kapcsolatfelvétel, foglalási kérés | **Tájékoztatás** a beküldés helyén (GDPR 13. cikk) + link; **nem** hozzájárulás-checkbox, mert a jogalap 6. cikk (1) b)/f) | ✅ |
| ÁSZF elfogadása | külön, **nem előre bepipált** checkbox, olvasható linkkel | ✅ |
| Hírlevél, marketing | **külön**, nem kötelező, nem előre bepipált checkbox; dupla megerősítés (double opt-in); naplózott hozzájárulás (ki, mikor, milyen szövegre) | nincs ilyen funkció |
| „Elolvastam az adatkezelési tájékoztatót” checkbox | kerülendő: összemossa a tájékoztatást a hozzájárulással | ✅ eltávolítva (eddig az ÁSZF-fel egy dobozban volt) |

Hozzájárulás-checkbox mintája, ha egyszer kell (pl. hírlevél):

```tsx
<input type="checkbox" id="newsletter" {...register('newsletter')} />  {/* defaultValue: false */}
<label htmlFor="newsletter">
  Kérek hírlevelet (havonta legfeljebb 1). Bármikor leiratkozhatok. <Link href={privacy}>Részletek</Link>
</label>
// A szerveren: { consent: true, text: '<pontos címkeszöveg>', version: 'v1', at: ISO-időpont } – ez a bizonyíték.
```

### 2.3 Adattakarékossági mátrix – „amit nem kell, azt nem kérjük”

Szabály: **minden mezőhöz kell egy cél és egy jogalap – ha valamelyik hiányzik, a mező törlendő.** Felülvizsgálat minden űrlapváltozásnál.

| Mező | Cél | Jogalap | Kötelező? | Döntés |
|---|---|---|---|---|
| Név, e-mail | válasz, visszaigazolás | 6(1)b | igen | ✅ marad |
| Telefon (foglalás) | sürgős egyeztetés | 6(1)b | igen | marad (ha az e-mail elég, legyen opcionális) |
| Dátumok, létszám (korcsoportok) | ár, elérhetőség | 6(1)b | igen | ✅ marad |
| Különleges kérések | teljesítés | 6(1)b | nem | ✅ marad |
| Honnan talált ránk | marketing | 6(1)f | **nem** | ✅ opcionálissá tettük |
| Nem, születési év, állampolgárság, lakóhely, irányítószám | NTAK/VIZA | 6(1)c – **de csak bejelentkezéskor** | – | ✅ **eltávolítva** – érkezéskor a szálláshely-kezelő szoftver rögzíti |
| 18+ | szerződéskötési képesség | 6(1)b | igen | ✅ születési év helyett checkbox |

Ugyanez a tárolásra:

- ✅ Az űrlapadat nem kerül lemezre vagy adatbázisba; az egyetlen „tároló” az üzemeltető postafiókja → ⚠️ a postafiókban is legyen megőrzési szabály (pl. 1 év után törlés).
- ✅ A szervernapló csak a beküldés azonosítóját tartalmazza, e-mail-címet és nevet nem.
- ⚠️ A Resend dashboardon tárolt e-mail-előzmények megőrzési idejét ellenőrizze és minimalizálja.

### 2.4 Harmadik felek auditja – lépésről lépésre

**1. Hálózati leltár (15 perc):** Chrome inkognitó → DevTools → *Network* → „Disable cache” → oldalanként (főoldal, szobák, élmények, galéria, kapcsolat, foglalás) betöltés **elfogadás előtt**:

```text
Szűrő: -domain:localhost -domain:vityillo.hu
Elvárt eredmény elfogadás előtt: csak <projekt>.supabase.co (média) – semmi más.
Elfogadás után a /kapcsolat oldalon: + www.google.com, maps.gstatic.com, fonts.gstatic.com stb. (Térkép).
```

**2. Sütik és tárolás:** DevTools → *Application* → Cookies / Local Storage / Session Storage: vesse össze az 1.3-as táblázattal. Elfogadás előtt nem lehet harmadik fél sütije.

**3. Automatikus szkennerek** (a nyilvános URL-en, élesítés előtt, jelszavas preview-n nem működnek):

- webbkoll.5july.net – sütik, harmadik felek, fejlécek, CSP
- themarkup.org/blacklight – követők, fingerprinting
- securityheaders.com, observatory.mozilla.org – biztonsági fejlécek

**4. Szerveroldali adatfolyamok** – ezek a böngészőben nem látszanak:

| Szolgáltatás | Mit kap | Visszatérő vizsgálat |
|---|---|---|
| Vercel | minden kérés: IP, UA, URL (naplók) | log retention, Web Analytics **kikapcsolva** (nincs telepítve) |
| Supabase Storage | a videók közvetlenül innen töltődnek → IP | projekt régiója (EU ajánlott); a bucket csak publikus médiát tartalmazhat |
| Resend | az űrlapok teljes tartalma | DPA, megőrzés, küldő domain (SPF/DKIM) |
| SerpApi | semmilyen látogatói adatot (szerveroldali, fix lekérdezés) | API-kulcs kizárólag szerveren (`server-only`) ✅ |
| Google (Térkép) | IP + sütik, **csak hozzájárulás után** | ✅ |

**5. SDK-szabály a kódban:** új `<script>`, `<iframe>`, `fetch` külső hostra vagy npm SDK csak úgy kerülhet be, ha (a) szerepel a CSP-ben (`next.config.ts` – különben a böngésző blokkolja, ez jó vészfék), (b) szerepel ebben a táblázatban és a tájékoztatóban, (c) hozzájárulás-köteles esetben a `useConsent()` mögött van.

```bash
# Gyors grep a kódban külső hostokra:
rg -n "https?://(?!localhost|vityillo\.hu)" app components lib --pcre2
```

### 2.5 Szerződések és adattovábbítás

- ⛔ **DPA (GDPR 28. cikk)** elfogadása: Vercel (dashboard → Settings → Legal), Supabase (supabase.com/legal/dpa), Resend (resend.com/legal/dpa). Mentse el PDF-ben.
- ⛔ **DPF / SCC**: ellenőrizze a szolgáltatók státuszát a DPF-listán; ha nincs rajta, az SCC a DPA része.
- ⚠️ **Adatkezelési nyilvántartás (GDPR 30. cikk)**: rendszeres adatkezelésnél kis vállalkozásnak is kötelező (a vendégadatok kezelése rendszeres). Egyszerű táblázat elég.
- ⚠️ **Incidenskezelési eljárás**: 72 órás bejelentés a NAIH felé (33. cikk) – ki, hogyan, milyen sablonnal.

---

## 3. Biztonság

### 3.1 A Vityilló tényleges támadási felülete

| Felület | Kockázat | Állapot |
|---|---|---|
| `POST /api/contact` | spam, e-mail-bombázás, header injection, nagy törzs | ✅ origin-ellenőrzés, honeypot, 16 KB, CR/LF-szűrés, Zod; ⛔ rate limit (WAF) |
| `POST /api/booking` | ugyanez | ✅ ugyanez + jelenleg 503 (`BOOKING_ENABLED = false`) |
| `GET /api/reviews` | SerpApi-kreditek elhasználása | ✅ 6 órás cache, `hl` enum; ⚠️ WAF rate limit is ajánlott |
| Adatbázis | **nincs** (a Supabase csak Storage) → jelenleg nincs SQLi-felület | ℹ️ lásd 3.2, ha lesz |
| Kliens | XSS | ✅ React escapel, `dangerouslySetInnerHTML` csak statikus bootstrapnél, CSP |
| Titkok | kiszivárgás | ✅ `.env*` gitignore-ban, `server-only` a SerpApi- és e-mail-modulon |

### 3.2 SQL injection – modern stack, ha jön adatbázis

**Hol fordul elő Supabase/Node stacken:**

1. **PostgREST szűrő-injekció** a supabase-js-ben – a leggyakoribb, és sokan nem is tudnak róla:

   ```ts
   // ❌ A felhasználó vesszővel/zárójellel saját feltételt fűzhet hozzá:
   supabase.from('rooms').select().or(`name.ilike.%${q}%,city.ilike.%${q}%`)
   // q = "x%,price.lt.1"  ->  extra szűrő a lekérdezésben

   // ✅ Egyedi szűrőmetódusok – paraméterként mennek át:
   const safe = z.string().trim().max(60).regex(/^[\p{L}\p{N} .-]*$/u).parse(q)
   supabase.from('rooms').select().ilike('name', `%${safe}%`)
   ```

2. **Dinamikus SQL Postgres-függvényben** (`.rpc()`):

   ```sql
   -- ❌
   EXECUTE 'SELECT * FROM bookings WHERE email = ''' || p_email || '''';
   -- ✅ paraméter + azonosító-escapelés
   EXECUTE format('SELECT * FROM %I WHERE email = $1', p_table) USING p_email;
   ```

3. **ORM „raw” kapui:** Prisma `$queryRawUnsafe` (❌) vs. `$queryRaw` tagged template (✅); Drizzle `sql.raw()` (❌) vs. `` sql`... ${x}` `` (✅); Knex `whereRaw('a = ?', [x])` (✅), sztring-összefűzéssel ❌.
4. **`SECURITY DEFINER` függvények** – a hívó jogai helyett a tulajdonoséval futnak: mindig `SET search_path = ''`, és a függvényen belül `auth.uid()`-ellenőrzés.

**RLS – deny-by-default minta:**

```sql
alter table public.booking_requests enable row level security;
alter table public.booking_requests force row level security;
revoke all on public.booking_requests from anon, authenticated;

-- Beszúrás csak a szerverről (Route Handler / Server Action a service role kulccsal),
-- tehát anon/authenticated policy NINCS -> minden kliensoldali kérés elutasítva.

-- Személyzet olvashat:
create policy "staff can read" on public.booking_requests
  for select to authenticated
  using ( exists (select 1 from public.staff s where s.user_id = (select auth.uid())) );
```

Szabályok: a **service role kulcs** megkerüli az RLS-t → csak szerveren, soha nem `NEXT_PUBLIC_`; generált típusok (`supabase gen types typescript`); migrációk a repóban; a Supabase dashboard *Security Advisor*-a legyen tiszta.

### 3.3 XSS – vektorok és védekezés

| Vektor | Példa | Védekezés |
|---|---|---|
| HTML injektálása | `dangerouslySetInnerHTML={{ __html: userText }}` / Vue `v-html` | ne használja felhasználói adattal; ha muszáj: `DOMPurify.sanitize()` |
| URL-attribútum | `<a href={user.website}>` → `javascript:alert(1)` | protokoll-allowlist: `new URL(u).protocol === 'https:'` |
| JSON-LD | `<script type="application/ld+json">{JSON.stringify(data)}</script>` – a `</script>` kitörhet | `JSON.stringify(data).replace(/</g, '\\u003c')` |
| Markdown | user markdown → HTML | `rehype-sanitize` |
| E-mail-sablon | a vendég neve a host e-mailjében | ✅ `escapeHtml` minden mezőn (`lib/email.ts`) |
| Hiányzó CSP | bármely fenti hiba kihasználható | ✅ CSP; ⚠️ a `'unsafe-inline'` script statikus oldalon szükséges kompromisszum (nonce csak dinamikus rendereléssel) |

### 3.4 Űrlap-visszaélések – mi van beépítve

```ts
// app/api/contact/route.ts – a sorrend számít:
const origin = checkRequestOrigin(request.headers, siteAllowedHosts()) // 403: cross-site / idegen Origin / idegen Referer
const body = await readJsonBody(request)                               // 415 / 413 (16 KB, streamelve mérve) / 400
if (isHoneypotFilled(body.value)) return ok()                          // bot: csendes 200, nincs e-mail
const parsed = contactSchema.safeParse(body.value)                     // 422; Zod eldobja az ismeretlen kulcsokat
// singleLine(): CR/LF -> szóköz a tárgysorba kerülő mezőkben (header injection)
```

- **CSRF:** a Server Actionök beépített origin-ellenőrzést kapnak, a Route Handlerek **nem** → ezt pótolja a `checkRequestOrigin` (Sec-Fetch-Site → Origin → Referer → honeypot).
- **Mass assignment:** a Zod `z.object` eldobja az ismeretlen mezőket; a kérés törzsét soha ne terítse (`...body`) közvetlenül adatbázis-insertbe.
- **Válaszok:** a hibakódok nem szivárogtatnak belső állapotot; a botok ugyanazt a 200-at kapják, mint egy ember.
- **E-mail-kézbesítés:** ha a Resend hibázik, 502 → a látogató hibaüzenetet lát, nem hamis „köszönjük”-öt.

### 3.5 Rate limit – Vercel Firewall

Az alkalmazáson belüli, memóriában tartott számláló Vercelen **hatástalan**: minden kérés más példányra futhat. Ezért a korlátozás a platform szintjén van:

1. Vercel Dashboard → projekt → **Firewall** → *Configure* → **New Rule**.
2. *If:* `Request Path` *equals* `/api/contact` **OR** `/api/booking`, **AND** `Method` *equals* `POST`.
3. *Then:* **Rate Limit** – fixed window, **10 perc**, **5 kérés**, kulcs: **IP** → action: **Deny (429)**.
4. Külön szabály a `/api/reviews`-ra: pl. 60 kérés/perc/IP.
5. *Save* → **Publish**. Teszt: 6 POST 10 percen belül → 429.

A szabályok száma és típusa csomagfüggő, ezt ellenőrizze. Ha alkalmazásszintű limit kell (pl. másik hoszt), akkor `@upstash/ratelimit` + Upstash Redis – ez új függőség, titok és költség.

### 3.6 HTTP biztonsági fejlécek – ✅ beépítve

Ellenőrzés élesben:

```bash
curl -sI https://vityillo.hu/hu | grep -iE "content-security|strict-transport|x-content-type|referrer-policy|x-frame|permissions-policy|cross-origin-opener|x-robots"
```

- A HSTS és az `upgrade-insecure-requests` **csak Vercel-buildben** kerül ki (`VERCEL=1`), mert helyi `next start` mellett a Chrome egy évre https-re kényszerítené a teljes localhostot.
- A HSTS `preload` szándékosan hiányzik: a preload-lista egyirányú és minden aldomainre vonatkozik.
- **Új külső forrásnál a CSP-t bővíteni kell**, különben a böngésző blokkolja; a konzolban `Refused to load…` üzenet jelenik meg.

### 3.7 Titkok és függőségek

```bash
git log --all -p | grep -nE "re_[A-Za-z0-9]{20,}|sb_secret_|service_role" # kulcs a git-történetben?
npx gitleaks detect --no-banner                                          # alaposabb
npm audit --omit=dev
```

Ha bármi kiszivárgott: **rotálás** (Resend, SerpApi), a git-történet tisztítása önmagában nem elég. A Next.js biztonsági közleményeit kövesse (most 16.3.6).

---

## 4. Akadálymentesség (WCAG 2.2 AA)

### 4.1 Elvégzett javítások ✅

- **Ugrás a tartalomra** link: első fókuszálható elem, fókuszkor látható; a `<main>` kap fókuszt, és azonnal a navigációs sáv alá ugrik (Lenis-kompatibilis).
- **Űrlapok:** `label for` ↔ `id`, `aria-invalid`, `aria-describedby` → a hibaszöveg fókuszkor is felolvasásra kerül, `aria-required`, `autocomplete` (name/email/tel), a checkbox címkéi kattinthatók.
- **Banner:** címkézett `region` (landmark), valódi `<button>`-ök, `fieldset`/`legend` a beállításokban, láblécből nyitva fókuszkezeléssel.
- **Térkép-helyőrző:** szöveges magyarázat és billentyűzettel elérhető gombok.

### 4.2 Fejlesztői checklista

**Képernyőolvasó és szemantika**

- [ ] Oldalanként pontosan egy `<h1>`, a szintek nem ugranak (⚠️ `/kapcsolat`: h1 → h3 űrlapcím, h2 nélkül).
- [ ] Landmarkok: `header/nav`, `main` (egy), `footer`; a több `nav` legyen `aria-label`-lel megkülönböztetve.
- [ ] `<html lang>` a nyelvnek megfelelő (✅ `LangUpdater`).
- [ ] **Alt-szöveg döntési fa:** a kép információt hordoz → leíró alt (mi látszik, nem „kép a…”) · funkciót lát el (linkként) → a cél leírása · dekoratív → `alt=""` (✅ a véleménykártyák háttere) · szöveget tartalmaz → a szöveg.
- [ ] Ikon-only gombok: `aria-label` (✅ Facebook/Instagram), a dekoratív ikonok `aria-hidden`.
- [ ] ARIA szabály: **inkább semmi ARIA, mint rossz ARIA.** Natív elem (`button`, `a`, `input`) az ARIA-szerep előtt; `role="button"` + `div` helyett `<button>`.
- [ ] Dinamikus üzenetek: `role="alert"` (hiba) / `aria-live="polite"` (siker, betöltés).
- [ ] Canvas/WebGL effektek (`JacuzziCanvas`, `BogracCanvas`): `aria-hidden="true"`, a tartalom szövegesen is elérhető.

**Billentyűzet (100%)**

- [ ] Minden funkció elérhető Tab / Shift+Tab / Enter / Space / Esc / nyilakkal; nincs billentyűzetcsapda.
- [ ] A fókuszsorrend a vizuális sorrendet követi; nincs pozitív `tabindex`.
- [ ] **Látható fókusz** mindenhol (✅ globális `:focus-visible` gyűrű) – különösen fontos, mert az egyedi kurzor elrejti a natív kurzort.
- [ ] Modálok (DevNoticeModal, CommandPalette, galéria-lightbox): fókusz be, **fókuszcsapda**, Esc zár, fókusz vissza a nyitóelemre. ⚠️ A `DevNoticeModal` nem csapdáz – egyetlen gombja van, de a Tab kiléphet mögüle.
- [ ] Megjelenő menük, dropdownok: Esc zár, a nyilak navigálnak.
- [ ] Dátumválasztó: natív `type="date"` ✅.
- [ ] **Mozgó tartalom (WCAG 2.2.2):** az 5 mp-nél tovább mozgó marquee-nek megállíthatónak kell lennie. ⚠️ A véleményfal csak egérrel (hover) áll meg, billentyűzettel nem → kell egy „Szünet” gomb, vagy megállás `:focus-within`-re.
- [ ] Görgetésvezérelt jelenetek (CinematicStory, pin): a tartalom billentyűzettel is bejárható, és van kihagyás (✅ CinematicSkipPrompt).

**Mozgás, látás**

- [ ] `prefers-reduced-motion`: nincs parallax, scrub vagy autoplay (✅ `lib/fx.ts` lite mód, `gsap.matchMedia`).
- [ ] Kontraszt: szöveg ≥ 4.5:1, nagy szöveg és UI-elemek ≥ 3:1 – a `text-muted-foreground` és a `/25`-ös placeholder-színek axe-szel mérendők, mindkét témában.
- [ ] 200%-os zoom és 320 px szélesség: nincs vízszintes görgetés, nincs levágott tartalom (WCAG 1.4.10).
- [ ] Célterület ≥ 24×24 px (WCAG 2.5.8) – kis ikonos gombok, csillagok.
- [ ] Egyedi kurzor: ⚠️ a natív kurzor elrejtése megnehezíti a nagyított OS-kurzort használók dolgát → ajánlott egy kikapcsoló, vagy `prefers-contrast: more` mellett natív kurzor.

**Űrlapok**

- [ ] Látható címke minden mezőn (nem csak placeholder) ✅.
- [ ] Hiba: szöveg + ikon (nem csak szín), a mezőhöz kötve ✅; a varázsló lépésváltásakor a fókusz az új lépés első mezőjére vagy a címére kerüljön (⚠️ most a „Tovább” gombon marad).
- [ ] A kötelező mezők jelölése vizuálisan is (pl. `*` + magyarázat).

### 4.3 Tesztelési protokoll

1. **Automata:** axe DevTools (vagy Lighthouse Accessibility) minden oldaltípuson, világos és sötét témában – 0 „serious/critical”.
2. **Csak billentyűzet:** egér nélkül teljes foglalás → kapcsolat → süti-beállítás visszavonása → nyelvváltás.
3. **Képernyőolvasó:** NVDA + Firefox (Windows) és VoiceOver + Safari (iOS): címsorlista (H), landmarkok (D), űrlapmódban a hibák felolvasása.
4. **Reduced motion:** Windows „Animációk megjelenítése” kikapcsolva → a site lite módban, minden tartalom látszik.
5. **Zoom:** 200% és 400%, mobil 320 px.

ℹ️ **EAA (EU 2019/882), 2025. 06. 28-tól:** a mikrovállalkozásnak minősülő szolgáltatók (10 főnél kevesebb, legfeljebb 2 M EUR árbevétel/mérlegfőösszeg) mentesülnek; a WCAG 2.2 AA ettől függetlenül a cél.

---

## 5. Indexelés tiltása (keresők és AI-crawlerek)

### 5.1 Miért nem elég a `robots.txt` `Disallow: /`?

A `robots.txt` a **feltérképezést** tiltja, nem az **indexelést**. Ha a Googlebot nem töltheti le az oldalt, a `noindex` jelzést sem látja – ha pedig valahol link mutat az oldalra, az URL cím és leírás nélkül, de bekerülhet a találatok közé („Indexelve, bár a robots.txt letiltotta”). A Google dokumentációja szerint a `noindex` csak akkor hat, ha az oldal **nincs** tiltva a robots.txt-ben.

**Helyes rétegzés (✅ megvalósítva):**

| Réteg | Mire hat | Megvalósítás |
|---|---|---|
| `X-Robots-Tag: noindex, nofollow, noarchive, nosnippet, noimageindex` HTTP-fejléc | **minden** válasz: HTML, képek, `/_next/image`, PDF | `next.config.ts` → `headers()` |
| `<meta name="robots" content="noindex, nofollow, nocache">` + `googlebot` | HTML-oldalak (pl. cache-elt másolatok) | `app/layout.tsx` → `metadata.robots` |
| robots.txt: kereső **engedve**, AI-crawlerek tiltva, sitemap-sor nélkül | a kereső lássa a noindexet; az AI-tanításra a noindex nem hat | `app/robots.ts` |
| `/sitemap.xml` → 404 | ne legyen URL-leltár | `app/sitemap.ts` → `notFound()` |

### 5.2 A kód

```ts
// lib/site.ts – egyetlen kapcsoló; "true"-n kívül minden érték = TILTVA (fail closed)
export const SITE_INDEXABLE = process.env.SITE_INDEXABLE === 'true'
```

```ts
// next.config.ts – minden válaszra
const noindexHeaders = SITE_INDEXABLE
  ? []
  : [{ key: 'X-Robots-Tag', value: 'noindex, nofollow, noarchive, nosnippet, noimageindex' }]

async headers() {
  return [{ source: '/:path*', headers: [...securityHeaders, ...noindexHeaders] }, /* ... */]
}
```

```ts
// app/layout.tsx – minden oldal örökli (egyik page sem írja felül a robots-ot)
export const metadata: Metadata = {
  ...(SITE_INDEXABLE ? {} : {
    robots: { index: false, follow: false, nocache: true,
              googleBot: { index: false, follow: false, noimageindex: true } },
  }),
}
```

```ts
// app/robots.ts – élesítés előtt
return {
  rules: [
    { userAgent: '*', allow: '/', disallow: '/api/' },          // lássák a noindexet
    { userAgent: ['GPTBot', 'CCBot', 'Google-Extended', 'ClaudeBot', /* … */], disallow: '/' },
  ],
  // nincs sitemap
}
```

```ts
// app/sitemap.ts
if (!SITE_INDEXABLE) notFound()   // tiszta 404 (ellenőrizve: Next 16.3.6 statikus build)
```

Ugyanez más keretrendszerekben:

- **Nuxt 3:** `routeRules: { '/**': { headers: { 'X-Robots-Tag': 'noindex, nofollow' } } }` + `useHead({ meta: [{ name: 'robots', content: 'noindex, nofollow' }] })`.
- **Statikus hoszt (Netlify):** `_headers` fájl: `/*` → `X-Robots-Tag: noindex, nofollow`.
- **Nginx:** `add_header X-Robots-Tag "noindex, nofollow" always;`.

### 5.3 Ellenőrzés

```bash
curl -sI https://vityillo.hu/hu | grep -i x-robots-tag                                     # fejléc
curl -s  https://vityillo.hu/hu | grep -oE '<meta name="(robots|googlebot)"[^>]*>'          # meta
curl -s  https://vityillo.hu/robots.txt                                                     # nincs Sitemap-sor
curl -s -o /dev/null -w "%{http_code}\n" https://vityillo.hu/sitemap.xml                    # 404
```

Helyben (`next build && next start`) mind a négy ellenőrzés ✅ a várt eredményt adta.

Ezután: Google Search Console → *URL-ellenőrzés* → „Élő URL tesztelése” → „Az indexelést a noindex tiltja”. Néhány nap múlva a `site:vityillo.hu` keresés üres.

### 5.4 Ha már bekerült az indexbe

1. A `noindex` maradjon (lásd fent), és a robots.txt **ne** tiltsa a feltérképezést.
2. Search Console → **Eltávolítások** → *Ideiglenes eltávolítás* (kb. 6 hónapig rejt) – közben a `noindex` véglegesen kivezeti.
3. Bing Webmaster Tools → *Block URLs*.

### 5.5 Teljes elzárás (ha senki ne lássa)

A `noindex` csak a jóhiszemű robotokra hat. Valódi elzáráshoz:

- **Vercel Deployment Protection** (Vercel Authentication / Password Protection – a csomagtól függ), vagy
- **HTTP Basic Auth** a `proxy.ts`-ben (Next 16: a middleware neve `proxy`):

```ts
// proxy.ts – a meglévő locale-logika ELÉ
import { timingSafeEqual } from 'node:crypto'

function authorized(request: NextRequest): boolean {
  const expected = process.env.PREVIEW_BASIC_AUTH            // "felhasznalo:jelszo", csak szerveren
  if (!expected) return true                                 // nincs beállítva → nincs védelem
  const [scheme, encoded] = (request.headers.get('authorization') ?? '').split(' ')
  if (scheme !== 'Basic' || !encoded) return false
  const given = Buffer.from(atob(encoded))
  const want = Buffer.from(expected)
  return given.length === want.length && timingSafeEqual(given, want)
}

export function proxy(request: NextRequest) {
  if (!authorized(request)) {
    return new NextResponse('Authentication required', {
      status: 401,
      headers: { 'WWW-Authenticate': 'Basic realm="Vityillo preview", charset="UTF-8"' },
    })
  }
  // ... meglévő locale-átirányítás
}
// Figyelem: a jelenlegi matcher kihagyja az /api-t és a kiterjesztéses fájlokat;
// teljes védelemhez a matchert is bővíteni kell.
```

### 5.6 Élesítés: az indexelés bekapcsolása

1. Vercel → Settings → Environment Variables → `SITE_INDEXABLE` = `true` (**Production** környezet).
2. ⛔ **Redeploy** (Deployments → … → Redeploy). A változó **build időben** értékelődik ki (fejlécek, robots.txt, sitemap, metadata) – redeploy nélkül a régi, tiltó állapot marad.
3. Ellenőrzés: `curl -sI https://vityillo.hu/hu | grep -i x-robots-tag` → üres; a `/sitemap.xml` 200-at ad és 90 URL-t tartalmaz.
4. Search Console → *Sitemaps* → `https://vityillo.hu/sitemap.xml` beküldése.
5. ⚠️ A preview-deploymentek (`*.vercel.app`) maradjanak `noindex`-en: a Vercel ezeket alapból `X-Robots-Tag: noindex`-szel szolgálja ki. A `SITE_INDEXABLE` csak a **Production** környezetben legyen `true`.
