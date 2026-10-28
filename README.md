# HPC Career — Holistic Progress Card with career guidance

A mobile-first **Holistic Progress Card** (the NEP 2020 report card that a
learner, a teacher and a parent can all read) that becomes every student's
**career passbook**. Just as a bank passbook records every deposit, it records
every step of a student's career journey from Class 9 to 12: each test, each
plan and their own reflections. Built in are a short interests-and-personality
test, a plain-language career report, 36 careers with Indian routes into them, a
counsellor chat, and a class view for the teacher.

Built for **Code for a Billion — Bharat Agentic-AI Hackathon 2026**
(Code for India), impact area **01 · Education**. Open source under MIT.

[![CI](https://github.com/om-1115/hpc-career-agent/actions/workflows/ci.yml/badge.svg)](https://github.com/om-1115/hpc-career-agent/actions/workflows/ci.yml)

**Pitch deck and demo video:** [slides (.pptx)](docs/HPC-Career-Explainer.pptx) ·
[slides (PDF)](docs/HPC-Career-Explainer.pdf) ·
[3-minute explainer with a live demo (MP4)](docs/HPC-Career-Demo.mp4) ·
[all screenshots](docs/screens/)

<p>
  <img src="docs/screens/05-interest-question.png" width="200" alt="A career test question: how much would you like to repair a bicycle, a fan or a mixer?">
  <img src="docs/screens/08-report-top.png" width="200" alt="A career report: You're a Doer and a Thinker, with interest bars">
  <img src="docs/screens/11-explore-careers.png" width="200" alt="Explore careers, sorted by best fit, each with the route from Class 10">
  <img src="docs/screens/14-teacher-class.png" width="200" alt="The teacher's class view: who has finished and each student's interest code">
</p>

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

The app opens on **Choose your profile**: tap one, no password needed.

| Profile | What's there |
| ------- | ------------ |
| Asha Kumari (`S001`) | hasn't taken the test yet: start here for the whole journey |
| Rohan Verma (`S002`) | a result and a passbook going back to Class 9 |
| Priya Nair, Imran Khan (`S003`, `S004`) | results to explore |
| Meera Sharma (`T001`) | the teacher's class view |

Profiles open without a password for now, so never run `seed:demo` against
real student data. Password sign-in is still built into the API
(`/api/login`: hashed passwords and a 5-try lock) for when the app goes to a
school.

## What a student does

1. **Picks their profile** (for now; a school would add their password).
2. **Takes the career test** — 56 questions, about 10 minutes, one per screen.
   Progress is kept on the device, so a reload or a phone call costs nothing.
3. **Reads their report** — their interest code (e.g. *Creator · Helper ·
   Thinker*), how they usually are, the six careers that fit best with the route
   to each from Class 10, and next steps. It prints as a PDF for parents.
4. **Explores careers** — all 36, sorted by fit or filtered by type.
5. **Asks the counsellor** about streams, subjects and exams.
6. **Keeps a career passbook** — every test (a retake keeps the old one), every
   plan and their own reflections, on one dated timeline. They come back each
   year, see how they have grown, and decide with evidence, not guesswork.

A **teacher** sees who in the class has finished, each student's interest code,
and where the class's interests lie.

## How this meets the judging criteria

Code for a Billion scores four criteria, 25% each
([rubric](https://github.com/karlmehta/code-for-a-billion/blob/main/JUDGING.md)).
The evidence for each, in this repository:

| Criterion | Evidence |
| --- | --- |
| **Size of the problem** | 24.8 crore students in Indian schools (UDISE+ 2023-24), and every one of them faces a stream decision around Class 10. The app runs on any phone browser, including shared classroom phones. |
| **Severity of the problem** | 93% of 10,000 students surveyed knew only 7 of about 250 career options (Mindler, 2019). Only 9.36% of low-income Class 9–12 students had ever had career guidance, and family members (30%) and teachers (13%) were the top influences (Bharat Career Aspiration Report 2024). The choice sets a student's next decade of study and work. |
| **Quality of the solution** | A complete journey — test, report, careers with Indian routes, passbook, counsellor, teacher view — built on Holland's RIASEC model and the public-domain Mini-IPIP, scored on the server, with strength-based wording and honest limits ([the test, honestly](#the-test-honestly)). Signed sessions, role-gated pages, password sign-in ready in the API, 24 automated tests and CI on every push. The counsellor agent is built in AgentFoundry, with its tools wired to the app's tested code and a 10-case eval suite that passes ([the agent](#the-counsellor-agent-built-in-agentfoundry)). |
| **Proven impact** | Not deployed for this hackathon, so there is no field data yet. The repository runs in two commands with a seeded demo school, and the [deck](docs/HPC-Career-Explainer.pdf) sets out what a pilot would measure: students who finish, reports discussed at home, and teacher use in subject choice. |

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

## The counsellor agent, built in AgentFoundry

The counsellor is a **Claude Agent SDK** agent built in
[AgentFoundry](https://codeforindia.org/hackathon) (the hackathon's IDE) in
[`counsellor/`](counsellor/). It has five tools, created with AgentFoundry's
Tool Builder and wired to the app's own, unit-tested functions
([`server/counsellor/tools.ts`](server/counsellor/tools.ts)):

| Tool | What it does |
| --- | --- |
| `get_my_result` | the signed-in student's interest code, personality and best-fitting careers |
| `search_careers` | the app's 36 careers, by RIASEC letters or keyword, with fit for this student |
| `get_career` | one career and its route from Class 10 — the only routes it may quote |
| `save_plan` | saves a plan the teacher can see, only after the student says yes |
| `alert_teacher` | flags distress to the teacher, alongside the Tele-MANAS helpline (14416) |

It has no file, shell or web access, and the student is never a tool
parameter, so it can only see the student who is signed in. In AgentFoundry
the agent answers *"Which careers suit me?"* by calling `get_my_result` and
suggesting directions from that student's real result, and its **10 behaviour
evals pass** (safety, privacy, consent, scope, Hindi, fairness, honesty). The
first run passed 9/10 because replies were too long for a phone; a concrete
length rule in the prompt fixed it and made replies 20% shorter.

<p>
  <img src="docs/af/04-run.png" width="420" alt="The agent in AgentFoundry calling get_my_result and suggesting careers from the student's result">
  <img src="docs/af/03-evals.png" width="420" alt="AgentFoundry Evals: 10 of 10 counsellor behaviour cases pass">
</p>

How it was built, and how to run it: [counsellor/AF_BUILD.md](counsellor/AF_BUILD.md).
Design, prompt and model choices: [docs/counsellor-agent.md](docs/counsellor-agent.md).
The app's chat screen still uses its script; connecting it to the agent needs
a model key on the server.

## How it is built

```
shared/       the test items, 36 careers, scoring and report wording — plain TypeScript, unit-tested
server/       Express API: accounts, results, the counsellor (scripted for now) and its agent tools
counsellor/   the counsellor agent, built in AgentFoundry (Claude Agent SDK, five tools, evals)
src/          React 19 + Vite app: v1 Holistic Progress Card screens + the career journey
```

- **Profiles** are in one JSON file under `.data/` (git-ignored). The app
  opens them from a list for now (`/api/profiles`); password sign-in
  (`/api/login`) keeps scrypt hashes and locks an account for 15 minutes
  after five wrong passwords. Add accounts with
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

- **Connect the counsellor agent to the app's chat screen**, with a model key
  on the server and the signed-in student passed to its tools, then re-run the
  evals on that model.
- Hindi and other Indian languages for the test and report.
- More careers, with links to official course and exam pages.
- Deployment and usage data from a pilot school.

## Licence

MIT — see [LICENSE](LICENSE). The Mini-IPIP items are public domain.
