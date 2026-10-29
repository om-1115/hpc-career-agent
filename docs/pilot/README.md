# Pilot kit

Everything needed to try HPC Career with one real class and measure whether it
helps — without touching the public demo.

**What it measures.** Each student answers the same three questions before the
psychometric test and again after reading their report, so each one is compared
with themselves:

| Question (before and after) | What it shows |
| --- | --- |
| Write down every job or career you can think of | how many careers they know (counted, not self-rated) |
| Do you know what to study after Class 10 to get to the work you want? | whether they know the route |
| How sure are you about which stream to take in Class 11? (1–5) | how ready they are for the stream decision |

After the report they also rate how well it describes them (1–5), say whether
they'll show it at home, and write down any confusing words. The before
questions also ask whether anyone at school has talked with them about careers
this year, so we know where the class started.

**What it does not measure.** Whether they choose a better stream, or stay in
school. It is one class, on one day, self-reported, with no comparison group: a
first look, not proof. Say so wherever the numbers are used.

## What's in the kit

| Piece | Where |
| --- | --- |
| Pilot mode: no profile list, sign-in with a code and six-digit PIN, the day's three steps on Home, Live HPC's sample data hidden | `PILOT_MODE=1` on the server |
| The before and after questions, answered once each | `shared/surveys.ts` (`PILOT_SURVEYS`) |
| Public, anonymous results page — counts only until 5 students have done all three steps | `/impact` on the pilot app; `shared/pilot.ts` |
| Accounts with PINs, and printable slips | `npm run pilot:accounts` |
| The results as Markdown, for the submission | `npm run pilot:report` |
| Delete everything afterwards | `npm run pilot:erase -- --yes` |
| Letter and consent slip for parents (English, Hindi draft) | [consent-note.md](consent-note.md) |
| The teacher's 40-minute plan and observation sheet | [session-plan.md](session-plan.md) |
| Where the results go, and the text for the submission | [results-template.md](results-template.md) |
| A class list to fill in | [class-template.csv](class-template.csv) |

## Before anything else

1. **The principal's permission**, in writing, for the date and the class.
2. **A signed consent slip from a parent of every student who takes part**
   ([consent-note.md](consent-note.md)). India's Digital Personal Data
   Protection Act, 2023 treats everyone under 18 as a child and asks for a
   parent's verifiable consent before a child's data is processed. Keep the
   signed slips. Students without one do the alternative activity instead.
3. **Ask each student, too**, on the day: taking part is their choice, and they
   can stop at any time.

Store as little as you can: first name and the first letter of the surname is
enough for the class list. No phone numbers, no Aadhaar, no photos.

## Set up the pilot app (once, about 15 minutes)

The pilot runs as a second Vercel project from the same repository, so the demo
stays as it is and the two never share data.

1. **Vercel → Add New → Project →** import `om-1115/hpc-career-agent` again and
   name it `hpc-career-pilot`. The build settings come from `vercel.json`.
2. **Storage →** connect an Upstash Redis database to the new project (the
   demo's database is fine — the pilot uses its own key — or make a new one; if
   you make one, pick the region closest to the school, Mumbai if offered).
   This sets `KV_REST_API_URL` and `KV_REST_API_TOKEN`.
3. **Settings → Environment Variables**, for Production:
   - `PILOT_MODE` = `1`
   - `DATA_KEY` = `hpc-career:pilot`
   - `SESSION_SECRET` = the output of `openssl rand -hex 32`
4. **Redeploy**, then check: the app opens on **Sign in with your slip**, and
   `/impact` shows zeros.
5. On your computer, make `.env.pilot.local` in the repository (git-ignored by
   `*.local`) with `KV_REST_API_URL`, `KV_REST_API_TOKEN`, `DATA_KEY` and
   `PILOT_MODE` copied from the project's settings. Never commit it or paste it
   anywhere.

The scripts refuse to run against Redis without `DATA_KEY`, so they can't touch
the demo's data by mistake, and `npm run seed:demo` refuses when `PILOT_MODE=1`.

## Make the accounts and slips

Fill in [class-template.csv](class-template.csv) (a `name` column, and `class`
if you like), then:

```bash
ENV_FILE=.env.pilot.local npm run pilot:accounts -- class.csv --url https://hpc-career-pilot.vercel.app --teacher "Teacher's name"
```

Students get codes P01, P02, …; the teacher gets T01. Each gets a random
six-digit PIN; only its scrypt hash is stored. The slips are written to
`.data/pilot-slips.html` — the only copy of the PINs. Print it, cut the slips
apart, then delete the file. Running the command again refuses to touch
existing accounts; add `--reset` to issue new PINs.

Five wrong PINs lock an account for 15 minutes. The count is kept in the
database, so it holds across every server instance.

## On the day

Follow [session-plan.md](session-plan.md). Before the class, sign in on one lab
machine with the teacher's slip to check the school's network lets the app
through.

## Afterwards

```bash
ENV_FILE=.env.pilot.local npm run pilot:report > ~/hpc-pilot-results.md
```

The report has the same numbers as `/impact`, plus the confusing words
students wrote — read those first and remove anything that could identify a
student before sharing. Then fill in [results-template.md](results-template.md)
and paste its text into the submission.

By the date the consent note promises, delete everything:

```bash
ENV_FILE=.env.pilot.local npm run pilot:erase -- --yes
```

Then delete `.env.pilot.local`, and the `hpc-career-pilot` project if it is no
longer needed.

## Try it locally first

```bash
DATA_FILE=.data/pilot.json npm run pilot:accounts -- docs/pilot/class-template.csv --url http://localhost:8787 --teacher "Test Teacher"
npm run build && PILOT_MODE=1 DATA_FILE=.data/pilot.json npm run server
```

Open http://localhost:8787, sign in with a slip from `.data/pilot-slips.html`,
and walk through the three steps; http://localhost:8787/impact shows the totals.
