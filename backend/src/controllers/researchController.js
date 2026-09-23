/**
 * NASA Space Apps Challenge 2026: Astronaut Health Monitoring System
 * NASA Research Controller: backend/src/controllers/researchController.js
 * 
 * Delivers structured educational research regarding NASA's Five Human
 * Spaceflight Hazards, the Twins Study, and the Open Science Data Repository.
 * All URLs are strictly verified official NASA domains.
 */

const NASA_HAZARDS = [
  {
    id: 'space_radiation',
    number: 1,
    title: 'Space Radiation',
    description: 'Deep space radiation comprises Galactic Cosmic Rays (GCR) and Solar Particle Events (SPE). Unlike Earth, deep space lacks atmospheric and magnetospheric shielding, exposing astronauts to accelerated cellular and genomic damage.',
    systemMapping: 'Radiation Monitoring',
    mappingDetail: 'Tracks daily and cumulative simulated ionizing radiation dose against mission limits to demonstrate dosimeter telemetry.',
    researchContext: 'NASA Human Research Program studies radiation mitigation via active/passive shielding and biomarker surveillance.'
  },
  {
    id: 'isolation_confinement',
    number: 2,
    title: 'Isolation and Confinement',
    description: 'Long missions confine small crews in enclosed habitats for months. Sleep disruption, circadian desynchronization, and behavioral stressors can compromise crew cohesion, mood, and cognitive performance.',
    systemMapping: 'Behavioral & Psychological Health Check-in',
    mappingDetail: 'Daily self-assessments of mood, stress, loneliness, crew connection, and cognitive focus provide early indicators of behavioral friction.',
    researchContext: 'NASA analog habitats (such as HERA and CHAPEA) investigate behavioral health countermeasure schedules and crew dynamics.'
  },
  {
    id: 'distance_from_earth',
    number: 3,
    title: 'Distance from Earth',
    description: 'As missions travel beyond low Earth orbit toward Mars, round-trip communication delays range between 5 and 40 minutes. Immediate consultation with Earth-based flight surgeons is physically impossible.',
    systemMapping: 'Onboard Autonomy & Decision-Support',
    mappingDetail: 'Enables astronauts to record, evaluate, compare with personal baselines, and receive recommended protocols completely offline onboard.',
    researchContext: 'NASA Exploration Medical Capability (ExMC) focuses on clinical decision-support architectures for autonomous exploration.'
  },
  {
    id: 'gravity_fields',
    number: 4,
    title: 'Gravity Fields',
    description: 'Astronauts experience transitions between Earth gravity (1g), microgravity (0g), and lunar/Martian fractional gravity (0.16g / 0.38g). Unloading causes rapid bone mineral density loss and muscle deconditioning.',
    systemMapping: 'Exercise & Physical Countermeasures',
    mappingDetail: 'Daily exercise duration tracking and multi-day trend analysis ensure countermeasure compliance to prevent musculoskeletal decline.',
    researchContext: 'NASA Human Research Program countermeasure protocols require ~2 hours daily of combined resistive and aerobic exercise.'
  },
  {
    id: 'hostile_closed_environments',
    number: 5,
    title: 'Hostile / Closed Environments',
    description: 'Spacecraft environmental control and life support systems (ECLSS) maintain artificial atmospheric pressure, temperature, and air revitalization. Elevated CO2 or trace toxins can trigger cephalic headaches, nausea, or respiratory stress.',
    systemMapping: 'Physiological Telemetry & Symptom Tracking',
    mappingDetail: 'Continuous monitoring of SpO₂, heart rate, blood pressure, core temperature, and reporting of nausea, headache, or dizziness (Space Motion Sickness).',
    researchContext: 'NASA research monitors environmental micro-constituents and Spaceflight-Associated Neuro-ocular Syndrome (SANS).'
  }
];

const NASA_STUDIES = [
  {
    title: 'NASA Twins Study',
    description: 'A landmark longitudinal study comparing astronaut Scott Kelly (340 days aboard ISS) with his identical twin Mark Kelly on Earth. Demonstrated telomere elongation in space followed by post-flight shortening, gene expression shifts, and the resilience of human physiology.',
    relevance: 'Highlights the critical importance of establishing individual biological baselines rather than relying solely on generalized static thresholds.'
  },
  {
    title: 'NASA Human Research Program (HRP)',
    description: 'NASA program dedicated to discovering the physiological and psychological countermeasures necessary to safely send humans to the Moon, Mars, and beyond.',
    relevance: 'Provides the scientific framework for the 5 hazards and the physiological indicators monitored by this application.'
  },
  {
    title: 'NASA Open Science Data Repository (OSDR)',
    description: 'Public open repository combining GeneLab and Ames Life Sciences Data Archive, offering spaceflight biological, transcriptomic, and physiological datasets.',
    relevance: 'Supplies open-science datasets informing modern space biology monitoring protocols.'
  }
];

const VERIFIED_SOURCES = [
  {
    organization: 'NASA Human Research Program',
    url: 'https://www.nasa.gov/hrp',
    verified: true,
    description: 'Official NASA HRP portal covering risks, evidence books, and spaceflight health standards.'
  },
  {
    organization: 'NASA Twins Study Results',
    url: 'https://www.nasa.gov/twins-study',
    verified: true,
    description: 'Official findings and publications from the landmark NASA Twins Study.'
  },
  {
    organization: 'NASA Open Science Data Repository (OSDR)',
    url: 'https://osdr.nasa.gov',
    verified: true,
    description: 'Official NASA repository for space-related life sciences and biology data.'
  },
  {
    organization: 'NASA Official Homepage',
    url: 'https://www.nasa.gov',
    verified: true,
    description: 'Main NASA agency portal.'
  }
];

function getResearchData(req, res) {
  res.status(200).json({
    success: true,
    disclaimer: 'The health values displayed in this prototype are simulated data for demonstration purposes. Monitored health indicators and health considerations are informed by NASA human spaceflight research.',
    hazards: NASA_HAZARDS,
    studies: NASA_STUDIES,
    sources: VERIFIED_SOURCES
  });
}

module.exports = {
  getResearchData
};
