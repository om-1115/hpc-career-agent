/**
 * The stand-in career counsellor, shared by the gateway's offline mode and the
 * browser's fallback transport so there is exactly one script to maintain.
 *
 * Replies are deliberately short, structured, and end with a question — that is
 * the shape the real counselling flow takes, so the UI is exercised honestly.
 */

type Topic = {
  id: string
  patterns: RegExp[]
  reply: string
}

/**
 * A small intent matcher standing in for the real counsellor until a backend is
 * wired up. Replies are deliberately short, structured and end with a question,
 * which is how the counselling flow is meant to feel.
 */
const TOPICS: Topic[] = [
  {
    id: 'greeting',
    patterns: [/^\s*(hi|hey|hello|namaste|yo|good\s+(morning|afternoon|evening))\b/i],
    reply:
      "Hi! I'm your career counsellor. I can help you think through subjects, streams, skills and what comes after this year.\n\nWhat's on your mind right now?",
  },
  {
    id: 'stream',
    patterns: [/stream/i, /after\s+(class|grade)\s*10/i, /science\s+or\s+commerce/i, /which\s+subject/i, /pcm|pcb/i],
    reply:
      "Choosing a stream is less about the 'best' option and more about how you like to work.\n\n•  Science — you enjoy problem-solving, experiments, taking things apart\n•  Commerce — numbers, money, how businesses actually run\n•  Arts & Humanities — language, history, people, ideas\n\nHere's the part most people miss: every stream now opens into design, data, law, media and management. You are narrowing far less than it feels like.\n\nWhich of your current subjects do you look forward to most?",
  },
  {
    id: 'fit',
    patterns: [/career.*(fit|suit|match)/i, /(fit|suit|match).*career/i, /what.*(should|can)\s+i\s+(do|become)/i, /subjects i like/i],
    reply:
      "Let's work backwards from what you already enjoy rather than from a list of job titles.\n\nThink about a class where you lose track of time. Then ask what you were actually doing — building something, explaining something, organising something, or noticing a pattern nobody else did.\n\nThat verb matters more than the subject. Someone who loves explaining things thrives in teaching, product, law or medicine equally.\n\nWhich subject makes time disappear for you?",
  },
  {
    id: 'lost',
    patterns: [/no idea/i, /don'?t know what/i, /confused/i, /lost/i, /clueless/i, /nothing interests/i],
    reply:
      "That's a completely normal place to be at your age, and it isn't a problem to solve today.\n\nMost people don't find a career by thinking harder — they find it by trying things and noticing what sticks. So the useful question isn't 'what do I want to be', it's 'what do I want to try next term'.\n\nOne small experiment beats six months of worrying.\n\nIf you had one free afternoon a week for the next month, what would you be curious enough to try?",
  },
  {
    id: 'skills',
    patterns: [/skill/i, /what should i learn/i, /improve myself/i, /build this year/i],
    reply:
      "Three that compound no matter which path you take:\n\n1.  Writing clearly — it is thinking made visible, and every field rewards it\n2.  Working with data — a spreadsheet you actually understand goes a surprisingly long way\n3.  Finishing things — one completed small project teaches more than five abandoned big ones\n\nAfter that, pick one skill specific to what you're curious about and go deep for a term.\n\nWhat are you curious about at the moment?",
  },
  {
    id: 'exams',
    patterns: [/entrance/i, /exam/i, /jee|neet|cuet|clat|nift|nid/i, /competitive/i],
    reply:
      "Entrance exams are a door, not the whole building — and fewer paths need them than people assume.\n\n•  Engineering and medicine — yes, JEE and NEET are the main routes\n•  Design — NID and NIFT test observation and drawing, not rote learning\n•  Law — CLAT leans on reasoning and current affairs\n•  Most other degrees — CUET or board marks are enough\n\nPick the field first, then find out what it actually asks for. Preparing for an exam before you know why is the most common way students lose a year.\n\nWhich field are you weighing up?",
  },
  {
    id: 'design',
    patterns: [/design/i, /ux|ui/i, /architect/i, /animation/i, /fashion/i],
    reply:
      "Design is a strong fit if you notice when things are badly made and can imagine them better.\n\nThe field is wider than it looks: product and UX design, graphic and communication design, industrial and product design, fashion, animation, architecture. They share one core skill — understanding a person's problem before you make anything.\n\nYou don't need to draw well to start. You need to be curious about why things are the way they are.\n\nStart here: redesign something that annoys you daily — a form, a menu, a bus timetable. Want help picking one?",
  },
  {
    id: 'stem',
    patterns: [/engineer/i, /doctor|medicine|mbbs/i, /comput|software|coding|programming/i, /data science|ai\b/i],
    reply:
      "Good instinct — just be specific about which part appeals to you.\n\n'Engineer' covers someone designing bridges and someone debugging code at 2am; 'doctor' covers a surgeon and a public-health researcher. The day-to-day work differs enormously.\n\nThe fastest way to find out is to spend an hour with someone doing it, or a weekend doing a tiny version of the work yourself.\n\nWhat drew you to it — the subject, the impact, or the stability?",
  },
  {
    id: 'sports-arts',
    patterns: [/sport|athlet|football|cricket/i, /music|danc|theatre|drama/i, /art\b|painting/i],
    reply:
      "Worth taking seriously rather than filing under 'hobby'.\n\nThese fields have real careers around the edges of performing too — coaching, sports science, physiotherapy, production, sound, curation, arts management. Many are steadier than the headline role and just as close to the thing you love.\n\nThe honest test is whether you enjoy the practice, not just the performance.\n\nHow much time do you put into it in a normal week?",
  },
  {
    id: 'parents',
    patterns: [/parent|family|mother|father|mom|dad/i, /pressure/i, /they want me/i],
    reply:
      "This comes up more than almost anything else, and it usually isn't a disagreement about careers — it's a disagreement about risk.\n\nWhat your family generally wants is for you to be secure. If you can show them the path you're drawn to has a real route to that, the conversation changes shape quickly.\n\nSo bring evidence, not just preference: what the work is, who hires for it, what it pays, what the first three years look like.\n\nWhat's the option they're pushing for, and what's yours?",
  },
  {
    id: 'college',
    patterns: [/college|university|admission|degree/i, /abroad/i],
    reply:
      "Two things matter far more than a college's ranking: what you actually get to do there, and who you're surrounded by.\n\nLook for places where students build, intern and present work — not just attend. A mid-tier college with active clubs and real projects will often beat a famous one where you sit through lectures.\n\nAlso check the fee against realistic starting salaries in that field before committing.\n\nWhich courses are on your shortlist?",
  },
  {
    id: 'after-this-year',
    patterns: [/after this year/i, /next year/i, /plan/i, /future/i, /looking forward/i],
    reply:
      "Let's make it concrete rather than abstract.\n\nWrite down three things: one subject you'd happily study for three more years, one thing you'd like to be noticeably better at by next summer, and one person whose work you'd want to shadow for a day.\n\nThose three answers usually point in the same direction, and that direction is a decent plan.\n\nWant to start with the first one?",
  },
]

const FALLBACK =
  "That's worth unpacking properly.\n\nTell me a bit more — is this about choosing subjects, picking a career direction, building a skill, or handling pressure from someone else? Once I know which, I can be a lot more useful.\n\nAnd if it helps, you can just describe what's actually going on. No need to phrase it as a question."

export function findReply(text: string): string {
  const match = TOPICS.find((topic) => topic.patterns.some((pattern) => pattern.test(text)))
  return match ? match.reply : FALLBACK
}

/** Word-ish chunks, so both callers stream the same way. */
export function chunkReply(reply: string): string[] {
  return reply.match(/\S+\s*|\s+/g) ?? [reply]
}
