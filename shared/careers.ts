/**
 * Careers a student can explore, each with a Holland code (its strongest
 * RIASEC types, most important first) and a common route into it in India.
 *
 * Written for this project. Codes follow the usual Holland classification of
 * each occupation; routes are the common ones, not the only ones — a counsellor
 * should always check current eligibility for a specific course or exam.
 */

import type { RiasecType } from './test.ts'

export type Career = {
  id: string
  title: string
  emoji: string
  code: [RiasecType, RiasecType, RiasecType]
  summary: string
  /** The usual route, from where a Class 10 student stands. */
  route: string
}

const career = (id: string, title: string, emoji: string, code: string, summary: string, route: string): Career => ({
  id,
  title,
  emoji,
  code: code.split('') as Career['code'],
  summary,
  route,
})

export const CAREERS: Career[] = [
  // Realistic
  career('electrician', 'Electrician', '🔌', 'RIC', 'Installs and repairs wiring, motors and electrical systems in homes, shops and factories.', 'ITI Electrician trade (2 years) after Class 10, then apprenticeship or a licence.'),
  career('auto-technician', 'Automobile technician', '🚗', 'RIC', 'Finds and fixes faults in cars, bikes and tractors, including electric vehicles.', 'ITI Mechanic (Motor Vehicle) after Class 10, or a polytechnic diploma in Automobile Engineering.'),
  career('solar-technician', 'Solar power technician', '☀️', 'RCI', 'Installs and maintains rooftop and field solar systems.', 'ITI Electrician or a Suryamitra skill course; a diploma in Electrical Engineering to grow further.'),
  career('civil-engineer', 'Civil engineer', '🏗️', 'RIC', 'Plans and builds roads, bridges, buildings and water systems.', 'Science (PCM) in Class 11–12, then B.Tech/B.E. in Civil Engineering; or a polytechnic diploma after Class 10.'),
  career('agri-entrepreneur', 'Farmer and agri-entrepreneur', '🌾', 'REC', 'Grows crops or runs dairy, poultry or food processing as a business.', 'Any stream; B.Sc Agriculture after Class 12 (PCB/PCM) helps, as do KVK and state agriculture courses.'),
  career('plumber', 'Plumber', '🚰', 'RCI', 'Fits and repairs water supply, drainage and sanitation systems.', 'ITI Plumber trade (1 year) after Class 8–10, then on-the-job experience.'),

  // Investigative
  career('doctor', 'Doctor', '🩺', 'ISR', 'Examines patients, diagnoses illness and treats it.', 'Science (PCB) in Class 11–12, NEET-UG, then MBBS (5.5 years including internship).'),
  career('software-developer', 'Software developer', '💻', 'ICR', 'Designs and writes the programs behind apps and websites.', 'Any stream with maths; B.Tech/B.E. in Computer Science, BCA or B.Sc Computer Science after Class 12.'),
  career('data-analyst', 'Data analyst', '📈', 'ICE', 'Turns data into answers a team or a government can act on.', 'Maths in Class 11–12, then B.Sc Statistics/Maths, B.Com or BCA, plus spreadsheet and SQL skills.'),
  career('lab-technician', 'Medical lab technician', '🧫', 'IRC', 'Tests blood and other samples so doctors can diagnose.', 'Science (PCB) in Class 11–12, then a DMLT diploma or B.Sc in Medical Laboratory Technology.'),
  career('pharmacist', 'Pharmacist', '💊', 'ICS', 'Prepares and dispenses medicines and explains how to take them.', 'Science (PCB or PCM) in Class 11–12, then D.Pharm (2 years) or B.Pharm (4 years).'),
  career('agri-scientist', 'Agricultural scientist', '🔬', 'IRC', 'Researches better seeds, soil and farming methods.', 'Science (PCB/PCM), B.Sc Agriculture, then M.Sc and ICAR exams for research posts.'),

  // Artistic
  career('graphic-designer', 'Graphic designer', '🎨', 'AER', 'Creates logos, posters, apps and social media visuals.', 'Any stream; B.Des (entrances such as UCEED or NID DAT), BFA, or a design diploma, plus a strong portfolio.'),
  career('content-writer', 'Writer and journalist', '📰', 'AES', 'Researches and writes news, articles, scripts and stories.', 'Any stream; BA in Journalism and Mass Communication, English or a regional language.'),
  career('fashion-designer', 'Fashion designer', '👗', 'AER', 'Designs clothing and accessories, from sketch to sample.', 'Any stream; B.Des in Fashion (NIFT, NID and other entrances) or a diploma in fashion design.'),
  career('architect', 'Architect', '🏛️', 'AIR', 'Designs buildings and spaces that are safe, useful and beautiful.', 'Maths in Class 11–12, NATA or JEE Main Paper 2, then B.Arch (5 years).'),
  career('animator', 'Animator and video editor', '🎬', 'ARI', 'Brings stories to life in animation, film and video.', 'Any stream; B.Sc/B.Des in Animation or a certificate course, plus a showreel.'),
  career('musician', 'Musician', '🎶', 'AES', 'Performs, composes or teaches music.', 'Any stream; BA/BPA in Music or training under a guru, plus regular performance.'),

  // Social
  career('teacher', 'School teacher', '🧑‍🏫', 'SAE', 'Helps children learn and grow, in class and beyond it.', 'D.El.Ed after Class 12 for primary, or a degree then B.Ed for secondary; clear CTET/TET.'),
  career('nurse', 'Nurse', '🏥', 'SIR', 'Cares for patients, gives treatment and supports families.', 'Science (PCB) in Class 11–12 for B.Sc Nursing; GNM diploma also possible.'),
  career('counsellor', 'Counsellor and psychologist', '🫶', 'SIA', 'Helps people cope, make decisions and look after their mental health.', 'Any stream (psychology helps); BA/B.Sc Psychology, then MA/M.Sc for counselling roles.'),
  career('physiotherapist', 'Physiotherapist', '🦵', 'SIR', 'Helps people recover movement after injury or illness.', 'Science (PCB) in Class 11–12, then BPT (4.5 years including internship).'),
  career('social-worker', 'Social worker', '🤲', 'SEA', 'Connects families with support, rights and government schemes.', 'Any stream; BSW after Class 12, then MSW for senior roles.'),
  career('community-health-worker', 'Community health worker', '❤️‍🩹', 'SCR', 'Brings basic health care and awareness to every home in a village or ward.', 'Selected locally (for example as an ASHA) after Class 8–10, with government training.'),

  // Enterprising
  career('entrepreneur', 'Entrepreneur', '🚀', 'ECS', 'Starts and grows a business, from a shop to a startup.', 'Any stream; a BBA, B.Com or skill course helps, as do schemes like Startup India and PMEGP.'),
  career('sales-executive', 'Sales and marketing executive', '📣', 'EAC', 'Finds customers and tells them why a product is worth buying.', 'Any stream; BBA, B.Com or BA, then on-the-job learning.'),
  career('lawyer', 'Lawyer', '⚖️', 'EIS', 'Advises people on the law and argues their case in court.', 'Any stream; CLAT or a state entrance for a 5-year integrated LLB, or LLB after a degree.'),
  career('hotel-manager', 'Hotel and hospitality manager', '🏨', 'ECS', 'Runs hotels, restaurants and travel services so guests are looked after.', 'Any stream; B.Sc Hospitality and Hotel Administration (NCHM JEE) or a hotel management diploma.'),
  career('civil-servant', 'Civil services officer', '🏛', 'ESI', 'Runs districts, departments and public programmes.', 'Any degree, then the UPSC or state public service exams.'),
  career('event-manager', 'Event manager', '🎉', 'EAS', 'Plans and runs weddings, festivals and conferences.', 'Any stream; a degree or diploma in event management, or work your way up.'),

  // Conventional
  career('accountant', 'Accountant and CA', '🧾', 'CEI', 'Keeps a business’s money records and taxes correct.', 'Commerce in Class 11–12, then B.Com, or CA Foundation → Intermediate → Final.'),
  career('banker', 'Bank officer', '🏦', 'CES', 'Helps customers with accounts, loans and payments.', 'Any degree, then IBPS, SBI or RBI exams for clerk and officer posts.'),
  career('office-administrator', 'Office administrator', '🗃️', 'CES', 'Keeps an office running: records, schedules, supplies and staff support.', 'Any stream; B.Com/BBA or a diploma in office management, plus computer skills.'),
  career('logistics-coordinator', 'Logistics coordinator', '📦', 'CER', 'Plans how goods move from factories to warehouses to shops.', 'Any stream; a logistics or supply-chain diploma, or BBA in Logistics.'),
  career('librarian', 'Librarian', '📚', 'CSI', 'Organises books and information so people can find what they need.', 'Any degree, then B.Lib.I.Sc and M.Lib.I.Sc.'),
  career('data-entry', 'Data and operations assistant', '⌨️', 'CRE', 'Keeps records and databases accurate and up to date.', 'Class 12 in any stream plus a computer course such as CCC or a diploma in computer applications.'),
]

export const TYPE_NAMES: Record<RiasecType, string> = {
  R: 'Realistic',
  I: 'Investigative',
  A: 'Artistic',
  S: 'Social',
  E: 'Enterprising',
  C: 'Conventional',
}
