# Field research: what students told us

**What this is:** discovery research from the Holistic Progress Card pilot in
Kangra district, Himachal Pradesh (GSSS Kachhiari and GSSS Khaniara), drawn
from the pilot's field notes and the HPC concept note. Students were using the
state's existing assessment bots and surveys, **not HPC Career**. This research
shaped what we built. It is not evidence that HPC Career works: that needs a
pilot of this app (see the deck's "How we will show impact").

**How much evidence:** almost all of it comes from one conversation with 10
students at GSSS Kachhiari, plus Grade 9 and Grade 12 interview fragments and
conversations with principals. That is enough to expose real friction and form
strong hypotheses; it is not enough to size groups of students.

Each finding is marked **[O] observed** (stated in the field notes) or
**[H] hypothesis** (inferred, needs testing). Quotes are from the field notes;
the names in the full persona write-up are illustrative.

## What we found

### 1. Students answer career questions they don't understand

A Grade 9 student filled in *"Which stream will you choose?"* and *"Which
stream interests you?"* without knowing what "stream" meant. **[O]**

> "Bhar diya tha... par stream ka matlab pata nahi tha."
> (I filled it in... but I didn't know what "stream" meant.)

The result is data that looks complete and means nothing: high completion, low
validity. **[O]**

### 2. Students who know where they want to go don't know the route

A Grade 12 student named Army, Navy, CA, doctor and computer courses as
interests, with no clarity on which exam leads where, when it opens or what it
needs. Students said one-to-one career guidance would help. **[O]**

> "Subject-wise questions se kya hoga — paper kaise aata hai, wo batao."
> (What good are subject-wise questions? Tell me how the paper comes.)

They want previous-year papers and an explanation when they get something
wrong, not generic practice. **[O]**

### 3. Login fails before the content does

Students can't bring phones to school; they use the ICT lab, one or two
periods a week, on shared machines. At the start of the year a student didn't
know her school code or student ID and carried them on a slip of paper to the
lab. Mobile number and OTP are why adults end up completing student work.
**[O]**

### 4. One answer format fails about half the room

Of 10 students, about 5 preferred choosing from options and about 5 preferred
writing their own answer, because writing helped them think and say more.
Sometimes no option felt right, and there was no way to say so. **[O]** With 10
students in one school this is not a 50/50 split of the population; it shows
that a single format will fail many students. **[H]**

> "Likhne se saaf ho jata hai ki main kya soch rahi hoon."
> (Writing makes it clear what I'm thinking.)

### 5. A tool nobody is told about goes unused

Newly admitted students didn't know the state's practice bot existed, and many
schools hadn't used it since the previous year. Principals said students
already sit many assessments a month and won't take another unless the value
is obvious, and that programmes clash with exam months. **[O]**

> "Mujhe pata hi nahi tha ki ye bot hai."
> (I didn't even know this bot existed.)

## What we did with it

| Finding | In HPC Career |
| --- | --- |
| Students don't know what "stream" means (1) | The report explains every result in plain words and gives each career's route from Class 10, stream by stream. The test asks about everyday activities, not careers or streams. |
| Destination known, route unknown (2) | 36 careers, each with its route from Class 10 in India; a counsellor agent that answers only from those routes and says when to check the official website. |
| Login fails on day one; no phones at school (3) | Built for shared classroom phones: profiles open with one tap, sessions live in the tab only, and an unfinished test survives a reload. |
| Tools nobody is told about go unused (5) | Career guidance sits on the student's home screen ("Find careers that fit you") with the time it takes up front; the report is written for the student and their family. A proper in-app orientation is still to build (below). |
| Students need guidance, not another assessment (2, 5) | The test is 10 minutes and gives something back at once: a report, careers that fit and a passbook to return to. |

## What it tells us to build next

- **An "in my own words" answer and a "none of these fit me" option** on every
  question (finding 4). Today the test is options only.
- **Hindi**, starting with the test and the report (findings 1 and 4).
- **Exam pathways for Grade 12**: exam name, eligibility, dates and what to
  study for the destinations students named (finding 2).
- **Orientation as a feature**: a short in-app intro and a teacher script, and
  scheduling away from exam months (finding 5).

## What to test next

1. **Comprehension:** run the test and report past 15–20 Grade 9 students and
   mark every word they can't explain. "Stream" was found by accident; assume
   there are others.
2. **Answer format at scale:** options only vs writing only vs both vs voice,
   with about 100 students across grades and devices, separating preference
   from how hard typing is.
3. **A pilot of HPC Career itself:** students who finish, reports discussed at
   home, and teachers using the class view in subject choice.
