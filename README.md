# HPC Career — Holistic Progress Card with career guidance

A mobile-first **Holistic Progress Card** (the NEP 2020 report card that a
learner, a teacher and a parent can all read) with a **career guidance journey**
built in: a short interests-and-personality test, a plain-language career
report, 36 careers with Indian routes into them, a counsellor chat, and a class
view for the teacher.

Built for **Code for a Billion — Bharat Agentic-AI Hackathon 2026**
(Code for India), impact area **01 · Education**. Open source under MIT.

**Pitch deck and demo video:** [slides (.pptx)](docs/HPC-Career-Explainer.pptx) ·
[slides (PDF)](docs/HPC-Career-Explainer.pdf) ·
[2-minute explainer with a live demo (MP4)](docs/HPC-Career-Demo.mp4) ·
[screenshots](docs/screens/)

## Why

| | |
| --- | --- |
| **24.8 crore** | students in Indian schools (UDISE+ 2023-24) |
| **93%** | of 10,000 students surveyed knew only 7 career options, out of about 250 (Mindler, 2019) |
| **< 1 in 10** | low-income Class 9–12 students had ever received career guidance — 9.36% (Bharat Career Aspiration Report 2024, UNICEF YuWaah & iDreamCareer) |

The stream decision comes at 15, mostly on advice from home. NEP 2020's
Holistic Progress Card describes the whole child, but stops short of the
question every Class 10 student faces: *what next?*

## Try it

```bash
npm install
npm run seed:demo        # demo school: 1 teacher, 5 students (3 have taken the test)
npm run dev:all          # app on http://localhost:5173, API on :8787
```

| Role    | Code   | Password       |
| ------- | ------ | -------------- |
| Student | `S001` | `student-demo` (has not taken the test yet) |
| Student | `S002`–`S004` | `student-demo` (have results) |
| Teacher | `T001` | `teacher-demo` |

These passwords are public. Never run `seed:demo` against real student data.

## What a student does

1. **Signs in** with the code and password the school gave them.
2. **Takes the career test** — 56 questions, about 10 minutes, one per screen.
   Progress is kept on the device, so a reload or a phone call costs nothing.
3. **Reads their report** — their interest code (e.g. *Creator · Helper ·
   Thinker*), how they usually are, the six careers that fit best with the route
   to each from Class 10, and next steps. It prints as a PDF for parents.
4. **Explores careers** — all 36, sorted by fit or filtered by type.
5. **Asks the counsellor** about streams, subjects and exams.

A **teacher** sees who in the class has finished, each student's interest code,
and where the class's interests lie.

## The test, honestly

| Part | Items | Source |
| --- | --- | --- |
| Interests (Holland's RIASEC: Realistic, Investigative, Artistic, Social, Enterprising, Conventional) | 36, six per type | Written for this project, about everyday activities Indian students recognise |
| Personality (Big Five) | 20 | [Mini-IPIP](https://doi.org/10.1037/1040-3590.18.2.192) (Donnellan, Oswald, Baird & Lucas, 2006). Items from the [International Personality Item Pool](https://ipip.ori.org), public domain; lightly adapted to the first person |

- The **interest items are not a validated instrument.** The report says so, and
  frames itself as a starting point for a conversation, not a diagnosis.
- **No population norms.** Interest scores are the share of "really like" a
  student gave each type; personality levels are fixed cut-points on the 1–5
  average. They say *more* or *less* for this student, not how they compare.
- Neuroticism is reported the kind way round, as **Calmness**, and every level
  of every trait is described as a way of being that suits some work.
- Answering the same thing to every question is detected and flagged.
- Scoring runs **only on the server** (`shared/scoring.ts`); the browser sends
  answers and shows what comes back.

## How it is built

```
shared/       the test items, 36 careers, scoring and report wording — plain TypeScript, unit-tested
server/       Express API: accounts, results, the counsellor (scripted for now)
src/          React 19 + Vite app: v1 Holistic Progress Card screens + the career journey
```

- **Accounts** are scrypt-hashed in one JSON file under `.data/` (git-ignored).
  Five wrong passwords lock an account for 15 minutes. Add accounts with
  `npm run account:add -- student S010 "Name" "Class 10 · A"`.
- **Sessions** are HMAC-signed tokens kept in the tab only (`sessionStorage`),
  because classroom phones are shared. Each role's pages are gated to it.
- **The counsellor** streams replies over SSE from `/api/chat`. Today it answers
  from a script (`shared/counsellorScript.ts`); the server-side generator in
  `server/lib/offline.ts` is the one place a model plugs in.

```bash
npm test         # scoring + API tests
npm run build    # typecheck + bundle; `npm run server` then serves dist/ and /api on one port
```

Set `SESSION_SECRET` (any long random string) in `.env.local` so a restart does
not sign everyone out.

## Next

- **Make the counsellor an agent**: a model with tools to read the student's
  result, look up careers and routes, and save a plan the teacher can see.
- Hindi and other Indian languages for the test and report.
- More careers, with links to official course and exam pages.
- Deployment and usage data from a pilot school.

## Licence

MIT — see [LICENSE](LICENSE). The Mini-IPIP items are public domain.
