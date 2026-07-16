# Revisionskontoret i Horsens — revision-horsens.dk

Moderniseret hjemmeside bygget med [Hugo](https://gohugo.io) og hostet på **Cloudflare Pages**.

## Lokal udvikling

```bash
hugo server          # dev-server på http://localhost:1313
hugo --gc --minify   # produktion-build til public/
```

Kræver Hugo **extended** ≥ 0.146 (bygget med 0.163.2).

## Struktur

| Sti | Indhold |
|---|---|
| `hugo.toml` | Konfiguration, menu, kontaktoplysninger (telefon, e-mail, CVR m.m. rettes her) |
| `content/` | Én markdown-fil pr. side (titel, beskrivelse, manchet i front matter) |
| `data/medarbejdere.yaml` | Medarbejdere — navn, rolle, foto, specialer |
| `data/ydelser.yaml` | Ydelseslisten med noter og beskrivelser |
| `data/tider.yaml` | Åbningstider |
| `data/infolinks.yaml` | Linkbokse på Information-siden |
| `assets/billeder/` | Kildebilleder — Hugo genererer selv webp + responsive størrelser |
| `assets/css/main.css` | Al styling (minificeres + fingerprintes af Hugo) |
| `static/fonts/` | Selv-hostede fonte (ingen Google-CDN → ingen cookies/GDPR-problemer) |
| `static/_headers` | Sikkerheds- og cache-headers til Cloudflare Pages |
| `static/_redirects` | 301-redirects fra det gamle sites adresser |

## Deploy på Cloudflare Pages

1. Skub repoet til GitHub/GitLab og opret et nyt **Pages-projekt** i Cloudflare-dashboardet.
2. Build-indstillinger:
   - **Framework preset:** Hugo
   - **Build command:** `hugo --gc --minify`
   - **Build output directory:** `public`
3. Miljøvariabler (Settings → Environment variables):
   - `HUGO_VERSION` = `0.163.2`
4. Tilføj custom domain `revision-horsens.dk` under **Custom domains**, og opret en *Bulk Redirect* (eller en `www` CNAME + redirect rule) fra `www.revision-horsens.dk` → `https://revision-horsens.dk`.

Hver push til main-branchen udløser automatisk et nyt deploy; pull requests får preview-URL'er.

### FDR-nyhedsfeedet

"Aktuelle nyheder" hentes fra FDR's feed (`fdr.dk/wp-json/fcp/v1/get-posts?slug=fdr_feed`) **når sitet bygges** — ikke i den besøgendes browser. Det holder sitet cookiefrit og hurtigt, men betyder, at nyhederne kun opdateres ved et nyt build. For at holde dem friske:

1. Opret en **Deploy Hook** i Cloudflare Pages (Settings → Builds & deployments → Deploy hooks).
2. Kald hook-URL'en på et skema, fx dagligt — nemmest med en gratis cron-tjeneste eller en GitHub Action med `schedule: cron: "0 5 * * *"` der kører `curl -X POST <hook-url>`.

Fejler feedet under et build, udgives sitet stadig — bare uden FDR-sektionen (der vises en WARN i build-loggen).

## Typiske rettelser

- **Ny nyhed:** kopiér `content/nyheder/skabelon.md`, ret titel/dato/tekst og slet `draft: true`-linjen. Nyeste nyhed vises automatisk øverst på /nyheder/ og på forsiden.
- **Ny medarbejder:** læg foto i `assets/billeder/`, tilføj blok i `data/medarbejdere.yaml`.
- **Nye åbningstider:** ret `data/tider.yaml` (JSON-LD/Google opdateres kun i `layouts/partials/jsonld.html`).
- **Ny ydelse:** tilføj blok i `data/ydelser.yaml` — vises automatisk på forsiden og /ydelser/.
- **Telefon/e-mail/CVR:** ret `[params]` i `hugo.toml` — bruges overalt.
