# Clare Scout County — County Events Calendar (v0_3)

A single-page county calendar for all six sections, with a PIN-gated admin for
adding events. Events are stored in Netlify Blobs, so one person adds an event
and everyone sees it.

Themed on the county badge: deep blue `#1F409B`, sun yellow `#FFF100`, sky blue
`#00B9F0`, grass green `#8DC345`, dolmen brown `#51432C` and stone grey
`#B5A8A3`. The badge is embedded in `public/index.html` as a base64 PNG, so
there is no separate image file to lose.

---

## Read this first: drag and drop will not work

This site needs a serverless function (`netlify/functions/events.mjs`) to store
and serve the events. **Netlify does not deploy functions on a drag-and-drop
deploy** — it only uploads the static files, so the function 404s and the admin
reports "the events service is not responding".

Functions are only deployed when the site is built **from a Git repository** or
pushed with the **Netlify CLI**. This folder is set up for the Git route.

---

## Deploy

### 1. Put this folder in a GitHub repository

**Without using git**, in the browser:

1. Go to <https://github.com/new>, name it `clare-scout-county-calendar`,
   set it Private if you prefer, and create it **without** a README.
2. On the empty repo page, click **uploading an existing file**.
3. Drag in `package.json`, `netlify.toml`, `README.md`, and the `public` and
   `netlify` folders. GitHub keeps the folder structure.
4. Commit.

**Or from a terminal:**

```bash
cd clare-scout-county-calendar
git init
git add .
git commit -m "County events calendar"
git branch -M main
git remote add origin https://github.com/YOURNAME/clare-scout-county-calendar.git
git push -u origin main
```

### 2. Connect it in Netlify

**If you want to keep the site URL you already have**, open that site →
**Site configuration → Build & deploy → Continuous deployment → Link repository**,
and pick the new repo. The drag-and-drop deploy is replaced by a proper build.

**For a new site**: **Add new site → Import an existing project → GitHub**, pick
the repo.

Netlify reads `netlify.toml`, so leave the build settings as they come up:

| Setting | Value |
|---|---|
| Build command | `echo 'static site — nothing to build'` |
| Publish directory | `public` |
| Functions directory | `netlify/functions` |

Deploy. When it finishes, check **Logs → Functions** shows an `events` function.

### 3. Set the admin PIN

The default PIN is **1907**.

To change it: **Site configuration → Environment variables → Add a variable**,
key `ADMIN_PIN`, value your PIN. Then **Deploys → Trigger deploy → Deploy site**.

The PIN is an entry barrier, not security. Anyone who knows it can edit the
calendar, and the events themselves are public.

---

## Updating it later

Edit the file in GitHub (or push a commit) and Netlify rebuilds automatically,
usually within a minute. Almost everything visual lives in `public/index.html`.

Adding, editing and deleting **events** does not need a redeploy — that is what
the Admin screen is for.

---

## Using it

- **Section pills** filter the whole calendar to one section. "All Sections"
  shows everything.
- **Type toggles** switch each colour on and off. The three types take their
  colours from the badge: **Training** = sky blue, **County** = sun yellow,
  **National** = grass green. Colour coding is consistent across the calendar,
  table and detail views.
- **Calendar / Table** switches views. On phones the calendar becomes a
  month-by-month agenda automatically.
- **Export .ics** downloads whatever is currently filtered, so a Cub Scouter can
  filter to Cubs and import just those events into their own calendar.
  Individual events have an "Add to my calendar" button.

## Admin

Click **Admin**, enter the PIN, then add, edit or delete events. Nothing is live
until you press **Publish to the calendar**. "Discard changes" throws away
unpublished edits.

**Export JSON** downloads the full event list as a backup. **Import JSON** loads
one back in (still needs Publish). Worth taking an export before a big edit.

## Event fields

| Field | Notes |
|---|---|
| Event name | required |
| Start date | required |
| End date | optional, for camps and weekends |
| Type | Training, County or National |
| Sections | one or more, or All Sections |
| Time | free text, e.g. `10:00 – 16:00` |
| Location / venue | free text |
| Description | free text |
| Hosted by | group or team running it |
| Contact name / email / phone | all optional |

## Files

```
package.json                  declares the one dependency (@netlify/blobs)
netlify.toml                  build, publish dir, functions dir, redirects
public/index.html             the entire front end, badge included
netlify/functions/events.mjs  the events API
```

## If publishing ever fails

- **"The events service is not responding"** — the function is not deployed.
  Check the deploy was built from Git, and that **Logs → Functions** lists
  `events`.
- **"Could not save"** — the function ran but Netlify Blobs rejected the write.
  Check **Logs → Functions → events** for the underlying error.
