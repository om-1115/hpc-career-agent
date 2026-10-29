# Submission draft — Code for a Billion 2026

Paste-ready answers for the hackathon's submission form:
[github.com/karlmehta/code-for-a-billion → New issue → Submission](https://github.com/karlmehta/code-for-a-billion/issues/new?template=submission.yml).
Deadline: **15 November 2026**.

---

**Team / Project name**

HPC Career — career guidance inside the Holistic Progress Card

**Team members (names + GitHub handles)**

Om Kumar (@om-1115)

**Problem statement** *(2–5 sentences)*

Most Indian students choose their stream at 15 with almost no career guidance,
usually on family advice alone. In a survey of 10,000 students, 93% knew only 7
career options out of about 250, and fewer than 1 in 10 low-income Class 9–12
students have ever received career guidance. NEP 2020's Holistic Progress Card
describes the whole child, but stops short of the question every Class 10
student faces: what next? HPC Career puts that conversation inside the progress
card, on any phone, and turns it into a career passbook the student keeps from
Class 9 to 12.

**What you built** *(your solution, key features, and how you used AgentFoundry)*

A mobile-first Holistic Progress Card that becomes every student's career
passbook, open source under MIT:

- **Career passbook:** just as a bank passbook records every deposit, it records
  every step of the career journey from Class 9 to 12 — each test (retakes keep
  the old one), each plan and the student's own reflections — on one dated
  timeline, so they decide with evidence, not guesswork.

- **Psychometric test:** 56 questions in about 10 minutes, covering interests
  (Holland's RIASEC; 36 items written for Indian students) and personality (the
  public-domain Mini-IPIP). One question per screen, built for shared classroom
  phones, scored only on the server.
- **A report written for the student:** their interest code, personality
  described as strengths, the six best-fitting careers with the route to each
  from Class 10, next steps, and a print-ready page for parents.
- **Explore careers:** 36 careers with Indian routes, sorted by fit.
- **Counsellor agent, built in AgentFoundry:** a Claude Agent SDK agent with five
  tools that read the student's own result, look up careers and their routes
  from Class 10, save a plan only after the student agrees, and alert the
  teacher if a student is in distress. (The chat screen in the app is still
  scripted; plugging the agent in needs a model key.)
- **Surveys that reflect back:** Skills, Looking Forward and Goal Setting
  (academic and non-academic). Each mixes options with the student's own
  words, explains "stream" inside the question, has an "I don't understand
  this question" button, and ends by writing the answers back as a
  first-person reflection the student edits and keeps in their passbook.
- **Live HPC:** the student's progress card for the term so far — about me,
  their reflections, projects, and how each competency is growing term by term
  (projects and competencies are sample content until a school records them).
- **Teacher view:** who has finished, the class's spread of interests, and each
  student's interest code.
- Student and teacher profiles that open with one tap (password sign-in is
  ready in the API for schools), role-gated pages, 24 automated tests and CI on
  every push.

**How we used AgentFoundry:** we built the counsellor agent in AF
(`counsellor/`, screenshots in `docs/af/`):

- **Built:** scaffolded with AF's *Claude Agent SDK (TypeScript)* kit; created
  all five tools with AF's Tool Builder, then wired each one to the app's own,
  unit-tested functions, so the agent reads and writes exactly what the app's
  screens do. Built-in file, shell and web tools are off, and the student is
  never a tool parameter, so the agent can only see the signed-in student.
- **Tested:** each tool with AF's Tools → Test; a live run from the agent card,
  where the Trace shows it calling `get_my_result` and answering from the
  student's real result.
- **Evaluated:** a 10-case suite in AF Evals covering safety (Tele-MANAS 14416),
  privacy, consent before saving, staying on topic, replying in Hindi, no
  gender stereotypes, family conversations and not inventing exam facts. The
  first run passed 9/10: replies were too long for a phone. We gave the prompt a
  concrete length limit and re-ran: 10/10, with replies 20% shorter on average.

**GitHub repository URL**

https://github.com/om-1115/hpc-career-agent

**Demo URL (live app or video)**

Live app: https://hpc-career-agent.vercel.app
Video: https://drive.google.com/file/d/1j4Z9LbF3U3TctUBFZJVDrT7gIAyu70To/view?usp=sharing

(The live app opens on the demo school's profiles, no sign-up. The video is the 2:53 captioned explainer with a live demo; also in the repo as
`docs/HPC-Career-Demo.mp4`.)

Slides: https://github.com/om-1115/hpc-career-agent/blob/main/docs/HPC-Career-Explainer.pdf

**Scale & severity of the problem** *(judged — 50% of the score)*

Scale: about 24.8 crore students are enrolled in Indian schools (UDISE+
2023-24, Ministry of Education). Every one of them reaches a stream decision
around Class 10.

Severity: that choice is made with very little information. In a Mindler
survey of 10,000 students aged 14–21 (2019), 93% knew only 7 career options out
of about 250. In the Bharat Career Aspiration Report 2024 (UNICEF YuWaah and
iDreamCareer; 4,968 Class 9–12 students from low-income families in 25 states),
only 9.36% had ever received career guidance, and family members (30%) and
teachers (13%) were the top influences on career choice. A stream chosen
without guidance shapes a student's next decade of study and work.

We saw this first-hand in the Holistic Progress Card pilot in Kangra, Himachal
Pradesh (GSSS Kachhiari and GSSS Khaniara). A Grade 9 student filled in "Which
stream will you choose?" without knowing what "stream" meant ("Bhar diya
tha... par stream ka matlab pata nahi tha"), and a Grade 12 student aiming for
the Army or Navy had no idea which exam leads there or when it opens.

**Deployment & impact data** *(optional, judged — 25%)*

Not deployed to a school yet, so there is no data yet on students using HPC
Career itself. A public demo with a sample school is live at
https://hpc-career-agent.vercel.app.

What we do have is discovery research from the Holistic Progress Card pilot in
two government schools in Kangra, Himachal Pradesh (GSSS Kachhiari and GSSS
Khaniara): a conversation with 10 students, Grade 9 and Grade 12 interviews,
and principals' feedback, while students used the state's existing assessment
bots. It found that students answer career questions they don't understand,
know a destination but not the route, can't log in on day one (no phones at
school, unknown codes), split roughly half and half between choosing options
and writing their own answers, and ignore tools nobody explains. HPC Career was
designed around these findings: plain-language results, a route from Class 10
for every career, and one-tap profiles for shared classroom phones. Full
findings, what we changed and what to test next:
https://github.com/om-1115/hpc-career-agent/blob/main/docs/user-research.md

Anyone can run the app locally in two commands (`npm run seed:demo`,
`npm run dev:all`) and pick a profile from a demo school. A pilot of HPC Career
would measure students who finish, reports discussed at home, and teacher use
in subject choice.

**Track / category**

Education

**Contact email**

*[your personal email]*

**Confirmations**

- [x] Built using AgentFoundry (AF), the official IDE
- [x] Our repository is public and includes a README with setup steps
- [x] The demo link works and is accessible to judges
