/**
 * The psychometric test: what a student likes doing (interests, Holland's RIASEC
 * model) and how they tend to be (personality, the Big Five).
 *
 * Interests — 36 items written for this project, six per RIASEC type, about
 * everyday activities an Indian school student will recognise. RIASEC is a
 * theory (John Holland, 1959–1997); these items are original and have NOT been
 * validated as a psychometric instrument. Treat the result as a conversation
 * starter, not a diagnosis.
 *
 * Personality — the 20-item Mini-IPIP (Donnellan, Oswald, Baird & Lucas, 2006,
 * Psychological Assessment 18(2), 192–203). Its items come from the
 * International Personality Item Pool, which is in the public domain
 * (https://ipip.ori.org). Wording is lightly adapted to the first person.
 */

export type RiasecType = 'R' | 'I' | 'A' | 'S' | 'E' | 'C'
export type Trait = 'O' | 'C' | 'E' | 'A' | 'N'

export type InterestItem = { id: string; section: 'interest'; type: RiasecType; text: string; emoji: string }
export type PersonalityItem = {
  id: string
  section: 'personality'
  trait: Trait
  /** -1: agreeing means LESS of the trait, so the answer is reversed before scoring. */
  key: 1 | -1
  text: string
}
export type Item = InterestItem | PersonalityItem

export const INTEREST_SCALE = [
  { value: 1, label: 'Really dislike', emoji: '😣' },
  { value: 2, label: 'Dislike', emoji: '🙁' },
  { value: 3, label: 'Not sure', emoji: '😐' },
  { value: 4, label: 'Like', emoji: '🙂' },
  { value: 5, label: 'Really like', emoji: '😍' },
] as const

export const PERSONALITY_SCALE = [
  { value: 1, label: 'Not like me at all' },
  { value: 2, label: 'Not much like me' },
  { value: 3, label: 'Somewhat like me' },
  { value: 4, label: 'A lot like me' },
  { value: 5, label: 'Exactly like me' },
] as const

const interest = (id: string, type: RiasecType, emoji: string, text: string): InterestItem => ({
  id,
  section: 'interest',
  type,
  emoji,
  text,
})

export const INTEREST_ITEMS: InterestItem[] = [
  interest('r1', 'R', '🚲', 'Repair a bicycle, a fan or a mixer'),
  interest('i1', 'I', '🧪', 'Do an experiment in a science lab'),
  interest('a1', 'A', '🎨', 'Draw, paint or design a poster'),
  interest('s1', 'S', '📚', 'Help a younger child with their studies'),
  interest('e1', 'E', '🚩', 'Lead a team for a class activity'),
  interest('c1', 'C', '🗂️', 'Keep records and accounts neat and correct'),

  interest('r2', 'R', '🪚', 'Build something with wood or tools'),
  interest('i2', 'I', '🧩', 'Solve puzzles and tricky maths problems'),
  interest('a2', 'A', '✍️', 'Write a story, a poem or a song'),
  interest('s2', 'S', '🩹', 'Look after someone who is unwell'),
  interest('e2', 'E', '🛍️', 'Sell things or run a small stall'),
  interest('c2', 'C', '📁', 'Sort files, books or lists into order'),

  interest('r3', 'R', '🌱', 'Work outdoors on a farm or in a garden'),
  interest('i3', 'I', '🌧️', 'Find out why things happen, like why it rains'),
  interest('a3', 'A', '🎭', 'Act in a play or make short videos'),
  interest('s3', 'S', '🤝', 'Help people sort out their problems'),
  interest('e3', 'E', '💬', 'Convince people to agree with your idea'),
  interest('c3', 'C', '📊', 'Work with numbers in a table or spreadsheet'),

  interest('r4', 'R', '⚙️', 'Operate machines in a workshop'),
  interest('i4', 'I', '🔬', 'Study plants, animals or the human body'),
  interest('a4', 'A', '🎸', 'Play a musical instrument or sing'),
  interest('s4', 'S', '🏘️', 'Work with others on a community project'),
  interest('e4', 'E', '🎪', 'Organise an event at school'),
  interest('c4', 'C', '✅', 'Follow clear steps to finish a task'),

  interest('r5', 'R', '🔌', 'Wire a switchboard or fix electrical things'),
  interest('i5', 'I', '💻', 'Write a computer program to solve a problem'),
  interest('a5', 'A', '👗', 'Design clothes, rooms or websites'),
  interest('s5', 'S', '👂', 'Listen to a friend and give advice'),
  interest('e5', 'E', '🎤', 'Speak in front of a big group'),
  interest('c5', 'C', '🔍', 'Check work carefully for mistakes'),

  interest('r6', 'R', '🛠️', 'Look after a scooter, tractor or other vehicle'),
  interest('i6', 'I', '🔭', 'Read about new discoveries in science'),
  interest('a6', 'A', '📷', 'Take photographs of people and places'),
  interest('s6', 'S', '🙋', 'Volunteer to help in your neighbourhood'),
  interest('e6', 'E', '💡', 'Plan how to earn money from an idea'),
  interest('c6', 'C', '🗓️', 'Plan a timetable or a monthly budget'),
]

const personality = (id: string, trait: Trait, key: 1 | -1, text: string): PersonalityItem => ({
  id,
  section: 'personality',
  trait,
  key,
  text,
})

/** Mini-IPIP, in its published order. */
export const PERSONALITY_ITEMS: PersonalityItem[] = [
  personality('p1', 'E', 1, 'I am the life of the party.'),
  personality('p2', 'A', 1, 'I sympathise with other people’s feelings.'),
  personality('p3', 'C', 1, 'I get chores done right away.'),
  personality('p4', 'N', 1, 'I have frequent mood swings.'),
  personality('p5', 'O', 1, 'I have a vivid imagination.'),
  personality('p6', 'E', -1, 'I don’t talk a lot.'),
  personality('p7', 'A', -1, 'I am not interested in other people’s problems.'),
  personality('p8', 'C', -1, 'I often forget to put things back in their proper place.'),
  personality('p9', 'N', -1, 'I am relaxed most of the time.'),
  personality('p10', 'O', -1, 'I am not interested in abstract ideas.'),
  personality('p11', 'E', 1, 'I talk to a lot of different people at parties.'),
  personality('p12', 'A', 1, 'I feel other people’s emotions.'),
  personality('p13', 'C', 1, 'I like order.'),
  personality('p14', 'N', 1, 'I get upset easily.'),
  personality('p15', 'O', -1, 'I have difficulty understanding abstract ideas.'),
  personality('p16', 'E', -1, 'I keep in the background.'),
  personality('p17', 'A', -1, 'I am not really interested in others.'),
  personality('p18', 'C', -1, 'I make a mess of things.'),
  personality('p19', 'N', -1, 'I seldom feel blue.'),
  personality('p20', 'O', -1, 'I do not have a good imagination.'),
]

export const ALL_ITEMS: Item[] = [...INTEREST_ITEMS, ...PERSONALITY_ITEMS]

/** Item id → answer, 1–5. */
export type Answers = Record<string, number>
