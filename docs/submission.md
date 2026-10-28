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

- **Career test:** 56 questions in about 10 minutes, covering interests
  (Holland's RIASEC; 36 items written for Indian students) and personality (the
  public-domain Mini-IPIP). One question per screen, built for shared classroom
  phones, scored only on the server.
- **A report written for the student:** their interest code, personality
  described as strengths, the six best-fitting careers with the route to each
  from Class 10, next steps, and a print-ready page for parents.
- **Explore careers:** 36 careers with Indian routes, sorted by fit.
- **Counsellor chat:** streaming replies; scripted in the app today.
- **Teacher view:** who has finished, the class's spread of interests, and each
  student's interest code.
- Student and teacher sign-in (hashed passwords, lockout, role-gated pages), 23
  automated tests and CI on every push.

**How we used AgentFoundry:** *[fill in once the counsellor agent is built and
evaluated in AF: the agent (Claude Agent SDK kit) in `counsellor/`, its five
tools wired to the app's data (`server/counsellor/tools.ts`), the evals and
what they caught, with screenshots in `docs/af/`.]*

**GitHub repository URL**

https://github.com/om-1115/hpc-career-agent

**Demo URL (live app or video)**

*[The video is `docs/HPC-Career-Demo.mp4` (2:56, captioned). For judges, upload
it to YouTube (unlisted) or Google Drive and paste that link. The direct GitHub
link also works but downloads rather than plays in some browsers:
https://github.com/om-1115/hpc-career-agent/raw/main/docs/HPC-Career-Demo.mp4]*

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

**Deployment & impact data** *(optional, judged — 25%)*

Not deployed for this hackathon: the entry is the open-source repository, the
deck and the demo video. Anyone can run it locally in two commands
(`npm run seed:demo`, `npm run dev:all`) with a demo school of one teacher and
five students. The deck's "How we will show impact" slide sets out what a pilot
would measure: students who finish, reports discussed at home, and teacher use
in subject choice.

**Track / category**

Education

**Contact email**

*[your personal email]*

**Confirmations**

- [ ] Built using AgentFoundry (AF), the official IDE — *tick only once the
  counsellor agent is built there*
- [x] Our repository is public and includes a README with setup steps
- [x] The demo link works and is accessible to judges — *after uploading the
  video*
