import { useState, useEffect, useRef, useCallback } from 'react'
import { supabase } from './supabaseClient'

// ─────────────────────────────────────────────────────────────────────────────
// DATA
// ─────────────────────────────────────────────────────────────────────────────

const STATES = [
  { name: 'Alaska',         level: 10, status: 'Extreme',  pop: '~30,000 Brown/Grizzly',          bears: 'Grizzly, Brown Bear, Black Bear',   advice: 'Highest bear density in North America. Bear spray is non-negotiable. Travel in groups of 4+, make constant noise on every trail.' },
  { name: 'Montana',        level: 10, status: 'Extreme',  pop: '~1,000 Grizzly + 15,000 Black',  bears: 'Grizzly, Black Bear',                advice: 'Yellowstone & Glacier ecosystems. Bear canisters required in backcountry. Never hike alone in the Bob Marshall Wilderness.' },
  { name: 'Wyoming',        level: 10, status: 'Extreme',  pop: '~800 Grizzly + 7,000 Black',     bears: 'Grizzly, Black Bear',                advice: 'Yellowstone corridor. Mandatory canisters in backcountry. Grizzly population expanding outside park boundaries yearly.' },
  { name: 'New Jersey',     level: 9,  status: 'High',     pop: '~3,000 Black Bears',             bears: 'Black Bear',                         advice: 'Highest Black Bear density per sq/mi in the US. Frequent suburban encounters. Secure all garbage and outdoor food sources.' },
  { name: 'Maine',          level: 9,  status: 'High',     pop: '~36,000 Black Bears',            bears: 'Black Bear',                         advice: 'Largest Black Bear population east of the Mississippi. Especially active in berry season (Aug–Oct). Make noise near streams.' },
  { name: 'Washington',     level: 9,  status: 'High',     pop: '~25,000 Black + Grizzly (N. Cascades)', bears: 'Black Bear, Grizzly (N. Cascades)', advice: 'Grizzly recovery zone active in North Cascades. Dense old-growth forests with minimal sightlines — make constant noise.' },
  { name: 'California',     level: 9,  status: 'High',     pop: '~35,000–40,000 Black Bears',     bears: 'Black Bear',                         advice: 'High human-bear conflict in Yosemite, Sequoia, and Kings Canyon. Canisters required in Yosemite backcountry. Store food properly.' },
  { name: 'Idaho',          level: 8,  status: 'Elevated', pop: '~20,000 Black + some Grizzly',   bears: 'Black Bear, Grizzly (Selkirks)',      advice: 'Selkirk Mountains host a recovering Grizzly population. Northern Idaho wilderness areas require Grizzly protocols.' },
  { name: 'North Carolina', level: 8,  status: 'Elevated', pop: '~20,000 Black Bears',            bears: 'Black Bear',                         advice: 'Mountain and coastal plain populations. Active in Great Smoky Mountains NP. Bear activity spikes in fall mast season.' },
  { name: 'Colorado',       level: 7,  status: 'Elevated', pop: '~17,000–20,000 Black Bears',     bears: 'Black Bear',                         advice: 'Increasing urban encroachment. Active spring through fall. High-country camping requires bear canisters in many wilderness areas.' },
  { name: 'Oregon',         level: 7,  status: 'Elevated', pop: '~25,000–30,000 Black Bears',     bears: 'Black Bear',                         advice: 'Cascade Range hotspot. High activity during huckleberry and salmon seasons. Be alert in the Wallowas and Coast Range.' },
  { name: 'Pennsylvania',   level: 7,  status: 'Elevated', pop: '~20,000 Black Bears',            bears: 'Black Bear',                         advice: 'Fastest-growing population in the East. Pocono Mountains hub. Active April–November. Camping food storage is critical.' },
  { name: 'Wisconsin',      level: 7,  status: 'Elevated', pop: '~24,000 Black Bears',            bears: 'Black Bear',                         advice: 'Northern Wisconsin forests. Dawn and dusk activity peaks. Secure all food and scented items in bear-resistant containers.' },
  { name: 'Texas',          level: 2,  status: 'Low',      pop: '~50 Black Bears',                bears: 'Black Bear (rare)',                  advice: 'Extremely rare. Stray sightings in Trans-Pecos and Big Bend National Park area only. Very low overall risk.' },
  { name: 'Florida',        level: 1,  status: 'Low',      pop: '~4,000 Florida Black Bears',     bears: 'Florida Black Bear',                 advice: 'Primarily Ocala National Forest and Osceola County area. Population rebounded from near extinction. Never feed wildlife.' },
  { name: 'Ohio',           level: 1,  status: 'Low',      pop: 'Very rare stray sightings',      bears: 'Black Bear (stray)',                 advice: 'Extremely rare. Occasional strays cross from Pennsylvania border counties. Report any sightings to ODNR immediately.' },
]

const BEARS = [
  {
    name: 'American Black Bear',
    sci: 'Ursus americanus',
    weight: '125–500 lbs (57–227 kg)',
    speed: 30,
    aggr: 4,
    pop: '~900,000',
    color: 'Black, cinnamon, or blonde',
    habitat: 'Forests across North America',
    img: 'https://images.unsplash.com/photo-1530595467537-0b5996c41f2d?w=600&q=80',
    desc: "North America's most common bear. Despite the name, their coats range from glossy black to cinnamon brown to blonde. Generally shy and non-confrontational with humans — the only bear species in the eastern US.",
    triggers: 'Mothers with cubs are the primary danger. Food-conditioned bears near campgrounds are the second. Rarely attacks without provocation.',
    interact: 'Stand your ground — do NOT run. Make yourself appear large. Speak calmly but firmly. Deploy bear spray at 60 feet. If contact occurs: FIGHT BACK aggressively targeting eyes and nose. NEVER play dead with a Black Bear.',
    neverDo: 'Playing dead with a Black Bear is potentially fatal.',
  },
  {
    name: 'Grizzly Bear',
    sci: 'Ursus arctos horribilis',
    weight: '400–790 lbs (181–358 kg)',
    speed: 35,
    aggr: 8,
    pop: '~55,000 (North America)',
    color: 'Brown with silver-tipped guard hairs',
    habitat: 'Alaska, western Canada, northern Rockies',
    img: 'https://images.unsplash.com/photo-1474511320723-9a56873867b5?w=600&q=80',
    desc: 'The iconic apex predator of the American West, identifiable by a pronounced shoulder hump and dish-shaped face profile. Far more territorial and less tolerant of humans than Black Bears. Primary threat to backcountry hikers.',
    triggers: 'Surprise encounters at close range (#1 cause of attacks), defending cubs, and protecting cached food kills. Attacks can come with zero warning signs.',
    interact: 'Defensive attack: PLAY DEAD (face down, hands laced behind neck, legs spread to resist rolling). Remain still until bear leaves completely. Predatory attack (stalking/night): FIGHT BACK with everything available.',
    neverDo: 'Running triggers chase. Do not make direct eye contact during approach — it reads as a challenge.',
  },
  {
    name: 'Polar Bear',
    sci: 'Ursus maritimus',
    weight: '900–1,500 lbs (410–680 kg)',
    speed: 40,
    aggr: 10,
    pop: '~26,000',
    color: 'White/cream (hollow, clear fur over black skin)',
    habitat: 'Arctic sea ice, coastal Alaska and Canada',
    img: 'https://images.unsplash.com/photo-1589656966895-2f33e7653819?w=600&q=80',
    desc: "The world's largest land predator and the only bear that is an obligate carnivore. Unlike all other bear species, Polar Bears will actively stalk and hunt humans. Climate-change-driven habitat loss is increasing human encounters.",
    triggers: 'Hunger and starvation due to shrinking sea ice. They do not view humans as a threat — they view humans as prey. No defensive trigger exists: every approach is predatory.',
    interact: 'FIGHT BACK with everything available — rocks, firearms, flare guns, bear spray. NEVER play dead: it will not stop a Polar Bear. Make noise. Use deterrents at maximum range. In polar bear habitat, carry a firearm.',
    neverDo: 'Playing dead is guaranteed to make the outcome worse.',
  },
  {
    name: 'Kodiak Brown Bear',
    sci: 'Ursus arctos middendorffi',
    weight: '660–1,320 lbs (300–600 kg)',
    speed: 35,
    aggr: 8,
    pop: '~3,500 (Kodiak Island only)',
    color: 'Dark to medium brown',
    habitat: 'Kodiak Island Archipelago, Alaska',
    img: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=80',
    desc: 'A subspecies of Brown Bear isolated on Kodiak Island for 12,000 years, producing the second largest land carnivore on Earth. Males can exceed 1,500 lbs in fall. Generally tolerant near salmon streams but enormously powerful.',
    triggers: 'Same as Grizzly: surprise encounters, cubs, food caches. Particularly dangerous near salmon streams during runs when competition for resources is highest.',
    interact: 'Same protocols as Grizzly. Play dead (face down) for defensive attacks. Fight back if the attack is predatory or continues after playing dead. Bear spray is highly effective even on these massive animals.',
    neverDo: 'Do not try to climb a tree — Kodiak Bears can climb faster than you.',
  },
  {
    name: 'Spirit Bear (Kermode Bear)',
    sci: 'Ursus americanus kermodei',
    weight: '200–400 lbs (90–180 kg)',
    speed: 30,
    aggr: 3,
    pop: '~400 (Great Bear Rainforest, BC)',
    color: 'Cream/white (recessive gene — not albino)',
    habitat: "Princess Royal Island & BC's mid-coast",
    img: 'https://images.unsplash.com/photo-1501706362039-c06b2d715385?w=600&q=80',
    desc: 'A rare white-coated subspecies of the American Black Bear, sacred to the Gitga\'at and Kitasoo First Nations peoples of BC. The cream coloring comes from a recessive gene — not albinism. Found only in old-growth temperate rainforest.',
    triggers: 'Same behavioral triggers as Black Bear. Extremely rare to encounter. These bears are under active conservation and governance by local First Nations.',
    interact: 'Same as Black Bear: stand firm, appear large, speak calmly, back away slowly. Fight back if attacked. Report all sightings immediately — these bears are critically rare and data on encounters is valuable.',
    neverDo: 'Do not attempt to photograph at close range. Do not post exact locations of sightings publicly.',
  },
  {
    name: 'Florida Black Bear',
    sci: 'Ursus americanus floridanus',
    weight: '150–400 lbs (68–181 kg)',
    speed: 30,
    aggr: 3,
    pop: '~4,000',
    color: 'Glossy black with tan muzzle',
    habitat: 'Ocala National Forest, Osceola, SW Florida',
    img: 'https://images.unsplash.com/photo-1530595467537-0b5996c41f2d?w=600&q=80',
    desc: "Florida's only native bear species — a subtropical subspecies of the American Black Bear adapted to Florida's warm, humid climate. Rebounded from near extinction in the 1970s to over 4,000 individuals through conservation efforts.",
    triggers: 'Unsecured garbage and food attractants near neighborhoods are the leading cause of encounters. Most incidents involve food-conditioned bears. Mothers with cubs from January (earliest birth timing of any US bear).',
    interact: 'Make yourself large and loud. Back away without running. Deploy bear spray if charged. Fight back if contact occurs — same as all Black Bear encounters. Most importantly: NEVER FEED THESE BEARS.',
    neverDo: 'Never leave garbage cans or pet food outdoors — a fed Florida Black Bear is typically euthanized.',
  },
]

const TRIGGERS = [
  {
    icon: '🐾',
    title: 'Mother with Cubs',
    severity: 'Extreme',
    desc: "A sow with cubs is the single most dangerous bear encounter. The mother will attack any perceived threat with explosive speed and almost zero warning — she is not bluffing. This is the leading cause of all bear attacks globally.",
    tips: ['Back away slowly and quietly without turning your back', 'NEVER get between a sow and her cubs — ever', 'Do not make eye contact; speak in a low, calm voice', 'Deploy bear spray the moment she charges (at ~60 feet)', 'Grizzly: play dead. Black Bear: fight back.'],
  },
  {
    icon: '⚡',
    title: 'Surprise at Close Range',
    severity: 'High',
    desc: 'Bears have poor eyesight but exceptional hearing and smell. A bear surprised at close range before it identifies you may launch a defensive attack before it can process what you are. This is the #1 cause of Grizzly attacks on hikers.',
    tips: ['Use a bear bell continuously on trails with blind corners', 'Talk loudly, clap, or call out near stream crossings', 'Check wind direction — approach from downwind if possible', 'Be extra alert in thick brush and near berry patches', 'Travel in groups of 4+ — groups are almost never attacked'],
  },
  {
    icon: '🍂',
    title: 'Hyperphagia Season (Late Summer–Fall)',
    severity: 'High',
    desc: "In late summer and fall, bears enter 'hyperphagia' — a biological feeding frenzy where they consume 20,000+ calories per day to build fat for hibernation. During this state bears are single-mindedly focused on food and far less tolerant of any competition.",
    tips: ['Avoid trails near berry patches August through October', 'Store ALL food and scented items in bear canisters', 'Cook and eat 200+ feet from your sleeping area', 'Hang food or use a canister — bears can smell calories through tent fabric', 'Pack out every scrap of trash — even fruit peels'],
  },
  {
    icon: '🥩',
    title: 'Defending a Food Cache',
    severity: 'Extreme',
    desc: "Bears bury and cache large prey kills, then guard them ferociously for days. A Grizzly defending a cached elk carcass has a near-zero attack threshold. You may not realize you're walking toward one until it's too late — they can be smelled from miles away.",
    tips: ['If you smell rotting meat in the woods, leave the area immediately', 'Circling ravens and magpies often signal a carcass below', 'Never make camp within a half mile of a detected carcass', 'Report cached carcasses near trails to park rangers', 'Never approach what appears to be a sleeping large animal'],
  },
  {
    icon: '🌅',
    title: 'Dawn & Dusk Activity Peaks',
    severity: 'Elevated',
    desc: 'Bears are crepuscular — most active at dawn and dusk, and on heavily overcast days when light is low. Trail encounter probability spikes dramatically during these windows. Evening valley crossings and stream corridors are especially high-risk.',
    tips: ['Avoid solo hiking at dawn or dusk', 'Keep bear spray in a hip holster (not the pack) during these hours', 'Make extra deliberate noise near stream banks at dusk', 'Check recent trail reports before entering at dawn', 'Camping hikers should be inside tents before full dark'],
  },
  {
    icon: '🌱',
    title: 'Spring Emergence (March–May)',
    severity: 'Elevated',
    desc: "Bears emerge from dens in early spring in a state of 'walking hibernation' — hungry, disoriented, and irritable. Spring also brings newborn cubs (as young as 2–3 months old), making sows hyper-defensive at a time when cubs are hidden in vegetation.",
    tips: ['Exercise extra caution on all spring trails March through May', 'Newborn cubs may be invisible in brush — the sow knows you are there', 'Bears are ravenous: all food and cooking smells attract them', 'Check official wildlife agency reports for recent den emergence data', "Snow can still cover a Grizzly's shoulder hump — don't mistake it for a rock"],
  },
  {
    icon: '🏕️',
    title: 'Food-Conditioned & Habituated Bears',
    severity: 'High',
    desc: "Bears that have learned to associate humans with food lose their natural fear response and become dangerously unpredictable. They account for the majority of campground incidents. These bears are almost always euthanized. 'A fed bear is a dead bear' is not a metaphor.",
    tips: ['Never feed wildlife — it is illegal in most parks and carries heavy fines', 'Use certified bear-proof containers and dumpsters at all campgrounds', 'Remove bird feeders from April through November in bear country', 'Report any habituated or bold bears to wildlife officials immediately', 'Secure all scented items: food, trash, toiletries, lip balm, sunscreen'],
  },
  {
    icon: '🤕',
    title: 'Injured, Sick, or Starving Bears',
    severity: 'High',
    desc: "An injured or starving bear may take risks it would never otherwise consider. Starvation-driven predatory attacks on humans, while rare, are documented — especially during drought years when natural food sources fail. A bear with dental injuries may seek soft, accessible food near camps.",
    tips: ['Report any bear acting lethargic, disoriented, or unusually bold immediately', 'Do not approach bears that appear injured or sick', 'Bears active during deep winter are almost certainly ill — report them', 'Contact wildlife authorities — do not attempt to help yourself', 'During drought years, increase all food security precautions substantially'],
  },
]

const INTERACTION_GUIDE = [
  {
    bear: 'All Bears',
    tactic: '3 UNIVERSAL RULES',
    color: 'border-gray-500/40 bg-gray-900/30',
    badge: 'bg-gray-500/30 text-gray-200',
    steps: [
      { icon: '🚫', text: 'Never run — running triggers the predatory chase instinct in every bear species' },
      { icon: '🧴', text: 'Deploy bear spray at 60 feet — it is 92% effective when used correctly, outperforming firearms' },
      { icon: '📢', text: 'Make noise — announce yourself on every trail to prevent surprise encounters' },
    ],
    warning: null,
  },
  {
    bear: 'Black Bear',
    tactic: 'FIGHT BACK',
    color: 'border-blue-500/40 bg-blue-900/20',
    badge: 'bg-blue-500/30 text-blue-200',
    steps: [
      { icon: '🛑', text: 'Stand your ground. Do not run or turn your back.' },
      { icon: '👐', text: 'Raise your arms, open your jacket — appear as large as possible.' },
      { icon: '🗣️', text: 'Speak calmly but firmly to identify yourself as human.' },
      { icon: '↩️', text: 'Back away slowly if the bear is not advancing.' },
      { icon: '🧴', text: 'Deploy bear spray when the bear is within 60 feet.' },
      { icon: '👊', text: 'If contact occurs: FIGHT BACK. Target the eyes and nose aggressively.' },
    ],
    warning: '⛔ NEVER play dead with a Black Bear — it signals surrender to a predatory animal.',
  },
  {
    bear: 'Grizzly — Defensive Attack',
    tactic: 'PLAY DEAD',
    color: 'border-orange-500/40 bg-orange-900/20',
    badge: 'bg-orange-500/30 text-orange-200',
    steps: [
      { icon: '👁️', text: 'Avoid direct eye contact during approach — it reads as a challenge.' },
      { icon: '🗣️', text: 'Speak in a low, calm voice. Wave arms slowly to identify yourself.' },
      { icon: '↩️', text: 'Back away slowly — do not run.' },
      { icon: '🧴', text: 'Deploy bear spray at 60 feet as the bear charges.' },
      { icon: '😴', text: 'If contact occurs: fall face down, hands laced behind neck, legs spread wide (harder to flip).' },
      { icon: '🤫', text: 'Remain absolutely still and silent until the bear leaves the area completely.' },
      { icon: '👊', text: 'If the bear resumes after you are still: switch immediately to fighting back.' },
    ],
    warning: '⚠️ Playing dead only works for defensive (surprised) Grizzly attacks — not predatory ones.',
  },
  {
    bear: 'Grizzly — Predatory Attack',
    tactic: 'FIGHT BACK',
    color: 'border-red-500/40 bg-red-900/20',
    badge: 'bg-red-500/30 text-red-200',
    steps: [
      { icon: '🌙', text: 'Predatory = attack happens at night while you are in your tent.' },
      { icon: '🎯', text: 'Predatory = bear was silently stalking/following you before attacking.' },
      { icon: '🔁', text: 'Predatory = attack continues after you played dead.' },
      { icon: '👊', text: 'Fight back with everything: rocks, sticks, trekking poles, fists.' },
      { icon: '🎯', text: 'Target the eyes and nose — the most sensitive points.' },
      { icon: '📣', text: 'Make as much noise as possible to attract help and disorient the bear.' },
      { icon: '🧴', text: 'Bear spray is still highly effective even at very short range.' },
    ],
    warning: '🚨 Switch from playing dead to fighting the moment a Grizzly resumes a paused attack.',
  },
  {
    bear: 'Polar Bear',
    tactic: 'FIGHT BACK (ALWAYS)',
    color: 'border-red-600/50 bg-red-950/30',
    badge: 'bg-red-600/30 text-red-200',
    steps: [
      { icon: '🚫', text: 'NEVER play dead — Polar Bears are active hunters. Playing dead is lethal.' },
      { icon: '📣', text: 'Make extreme noise — shout, bang metal, use air horns.' },
      { icon: '🔥', text: 'Fire flare guns at the bear\'s face if available.' },
      { icon: '🧴', text: 'Deploy bear spray at maximum range.' },
      { icon: '👊', text: 'Fight back with every tool and weapon available.' },
      { icon: '🎯', text: 'Target the nose and eyes above all else.' },
      { icon: '🔫', text: 'In Polar Bear habitat, carry a high-caliber firearm — it is the only reliable deterrent.' },
    ],
    warning: '🚨 Polar Bears have no defensive motivation — every interaction is predatory. Your only option is deterrence or all-out resistance.',
  },
]

const GEAR = [
  {
    name: 'UDAP Bear Spray',
    desc: 'The gold standard in bear deterrents. 2% capsaicin formula with a 30-foot deployment range. 7.9 oz can, EPA-certified. Required equipment in many national parks. 92% effective when deployed correctly — more reliable than firearms.',
    price: '$39.99',
    badge: 'Best Seller',
    badgeColor: 'bg-[#FF4C00]',
    img: 'https://images.unsplash.com/photo-1620706857370-e1b9770e8bb1?w=400&q=80',
    url: 'https://www.amazon.com/s?k=UDAP+bear+spray&tag=runbears-20',
    bullets: ['2% capsaicin concentration', '30-foot effective range', 'EPA certified formula', '7.9 oz canister'],
  },
  {
    name: 'BearVault BV500 Canister',
    desc: 'Clear polycarbonate container holds 700 cubic inches of food with no tools required for opening. Bear-proof certified by the Interagency Grizzly Bear Committee. Required by regulation in Yosemite, Sequoia, and dozens of wilderness areas.',
    price: '$89.95',
    badge: 'Park Required',
    badgeColor: 'bg-blue-600',
    img: 'https://images.unsplash.com/photo-1501706362039-c06b2d715385?w=400&q=80',
    url: 'https://www.amazon.com/s?k=BearVault+BV500+food+canister&tag=runbears-20',
    bullets: ['700 cu in capacity', 'IGBC certified', 'No tools to open', 'Fits most backpacks'],
  },
  {
    name: 'Garmin inReach Messenger',
    desc: "Two-way satellite messaging and GPS tracking that works anywhere on Earth with zero cell signal. The SOS button connects instantly to GEOS 24/7 international emergency coordination. If something goes wrong in bear country, this gets you help.",
    price: '$299.99',
    badge: 'Life Saver',
    badgeColor: 'bg-green-700',
    img: 'https://images.unsplash.com/photo-1516825295674-8d454b0e5f7e?w=400&q=80',
    url: 'https://www.amazon.com/s?k=Garmin+inReach+Messenger+satellite&tag=runbears-20',
    bullets: ['100% global coverage', 'Two-way messaging', 'SOS + GEOS response', 'GPS tracking'],
  },
]

// ─────────────────────────────────────────────────────────────────────────────
// UTILITY HELPERS
// ─────────────────────────────────────────────────────────────────────────────

const levelColor = (l) =>
  l >= 10 ? 'text-red-400' : l >= 9 ? 'text-orange-400' : l >= 7 ? 'text-yellow-400' : 'text-green-400'

const levelBorder = (l) =>
  l >= 10
    ? 'border-red-500/40 bg-red-900/20 hover:border-red-400/60'
    : l >= 9
    ? 'border-orange-500/35 bg-orange-900/15 hover:border-orange-400/55'
    : l >= 7
    ? 'border-yellow-500/30 bg-yellow-900/10 hover:border-yellow-400/50'
    : 'border-green-500/30 bg-green-900/10 hover:border-green-400/50'

const levelBadge = (l) =>
  l >= 10
    ? 'bg-red-500/25 text-red-300 border-red-500/30'
    : l >= 9
    ? 'bg-orange-500/25 text-orange-300 border-orange-500/30'
    : l >= 7
    ? 'bg-yellow-500/20 text-yellow-300 border-yellow-500/25'
    : 'bg-green-500/20 text-green-300 border-green-500/25'

const aggrDots = (aggr) =>
  Array.from({ length: 10 }).map((_, i) => (
    <div
      key={i}
      className={`w-2 h-2 rounded-full ${
        i < aggr
          ? aggr >= 9
            ? 'bg-red-500'
            : aggr >= 7
            ? 'bg-orange-500'
            : aggr >= 5
            ? 'bg-yellow-500'
            : 'bg-blue-400'
          : 'bg-gray-700'
      }`}
    />
  ))

// ─────────────────────────────────────────────────────────────────────────────
// SHARED COMPONENTS
// ─────────────────────────────────────────────────────────────────────────────

function SectionHeader({ badge, title, sub }) {
  return (
    <div className="text-center mb-10">
      <div className="inline-flex items-center gap-2 bg-[#FF4C00]/15 border border-[#FF4C00]/30 rounded-full px-4 py-1.5 text-[#FF4C00] text-xs font-bold tracking-widest mb-4">
        {badge}
      </div>
      <h2 className="text-3xl md:text-4xl font-extrabold text-white mb-3">{title}</h2>
      {sub && <p className="text-gray-400 max-w-2xl mx-auto text-base">{sub}</p>}
    </div>
  )
}

// AdSense publisher: ca-pub-7003115197472889
// To activate each unit: go to AdSense → Ads → By ad unit → Create ad unit,
// copy the data-ad-slot value, and replace the matching SLOT_ID below.
const AD_SLOTS = {
  leaderboard: 'REPLACE_LEADERBOARD_SLOT',   // 728×90  top
  rectangle:   'REPLACE_RECTANGLE_SLOT',     // 300×250 mid-page
  anchor:      'REPLACE_ANCHOR_SLOT',        // 728×90  bottom fixed
}

function AdUnit({ slotKey, w, h, className = '' }) {
  const ref = useRef(null)
  const slot = AD_SLOTS[slotKey]
  const configured = slot && !slot.startsWith('REPLACE')

  useEffect(() => {
    if (!configured) return
    try { ;(window.adsbygoogle = window.adsbygoogle || []).push({}) } catch {}
  }, [configured])

  if (!configured) {
    return (
      <div
        className={`flex items-center justify-center border border-dashed border-gray-800 bg-gray-950/40 text-gray-700 text-xs font-mono mx-auto select-none ${className}`}
        style={{ width: '100%', maxWidth: w, height: h }}
      >
        AdSense – add slot ID for {slotKey}
      </div>
    )
  }

  return (
    <div className={`mx-auto overflow-hidden ${className}`} style={{ maxWidth: w }}>
      <ins
        ref={ref}
        className="adsbygoogle"
        style={{ display: 'block', width: '100%', height: h }}
        data-ad-client="ca-pub-7003115197472889"
        data-ad-slot={slot}
        data-ad-format="auto"
        data-full-width-responsive="true"
      />
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// NAVBAR
// ─────────────────────────────────────────────────────────────────────────────

function Navbar({ openModal }) {
  const [menuOpen, setMenuOpen] = useState(false)
  const navLinks = [
    ['Danger Index', '#danger'],
    ['Pace Calc', '#pace'],
    ['Bear Bell', '#bell'],
    ['Bear Library', '#library'],
    ['How to Interact', '#interact'],
    ['Gear Store', '#gear'],
    ['Sightings', '#sightings'],
  ]
  return (
    <nav className="fixed top-0 inset-x-0 z-50 bg-[#050d05]/95 backdrop-blur-md border-b border-[#1A2E1A]">
      <div className="max-w-7xl mx-auto px-4 flex items-center justify-between h-14">
        <a href="#" className="flex items-center gap-2 font-extrabold text-xl tracking-tight text-white">
          <span className="text-2xl">🐻</span>
          RunBears<span className="text-[#FF4C00]">.com</span>
        </a>
        <div className="hidden lg:flex items-center gap-5">
          {navLinks.map(([label, href]) => (
            <a
              key={href}
              href={href}
              className="text-sm text-gray-400 hover:text-[#FF4C00] transition-colors font-medium"
            >
              {label}
            </a>
          ))}
        </div>
        <div className="hidden md:flex items-center gap-2">
          <button
            onClick={() => openModal('sighting')}
            className="border border-[#FF4C00]/60 hover:border-[#FF4C00] text-[#FF4C00] font-bold text-sm px-4 py-2 rounded-lg transition-colors hover:bg-[#FF4C00]/10"
          >
            🐾 Report Sighting
          </button>
          <a
            href="#gear"
            className="bg-[#FF4C00] hover:bg-orange-600 text-white font-bold text-sm px-4 py-2 rounded-lg transition-colors"
          >
            Get Bear Spray →
          </a>
        </div>
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="lg:hidden text-white p-2 text-xl"
          aria-label="Toggle menu"
        >
          {menuOpen ? '✕' : '☰'}
        </button>
      </div>
      {menuOpen && (
        <div className="lg:hidden bg-[#050d05] border-t border-[#1A2E1A] px-4 py-4 flex flex-col gap-4">
          {navLinks.map(([label, href]) => (
            <a
              key={href}
              href={href}
              onClick={() => setMenuOpen(false)}
              className="text-gray-300 text-sm font-medium hover:text-[#FF4C00] transition-colors"
            >
              {label}
            </a>
          ))}
          <button
            onClick={() => { setMenuOpen(false); openModal('sighting') }}
            className="text-left text-sm font-bold text-[#FF4C00] border border-[#FF4C00]/40 rounded-lg px-3 py-2 hover:bg-[#FF4C00]/10 transition-colors"
          >
            🐾 Report a Bear Sighting
          </button>
        </div>
      )}
    </nav>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// HERO
// ─────────────────────────────────────────────────────────────────────────────

function Hero({ openModal }) {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-14">
      <img
        src="https://images.unsplash.com/photo-1530595467537-0b5996c41f2d?w=1600&q=80"
        alt="Grizzly bear in wilderness"
        className="absolute inset-0 w-full h-full object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-[#050d05]/50 via-[#0a150a]/60 to-[#0a150a]" />
      <div className="relative z-10 text-center px-4 max-w-4xl mx-auto py-20">
        <div className="inline-flex items-center gap-2 bg-[#FF4C00]/20 border border-[#FF4C00]/40 rounded-full px-5 py-2 text-[#FF4C00] text-sm font-bold mb-6">
          ⚠️ LIVE BEAR SAFETY INTELLIGENCE — 2026 DATA
        </div>
        <h1 className="text-5xl sm:text-6xl md:text-7xl font-extrabold text-white leading-none mb-5 tracking-tight">
          Know the Bears.
          <br />
          <span className="text-[#FF4C00]">Survive the Trail.</span>
        </h1>
        <p className="text-lg md:text-xl text-gray-300 max-w-2xl mx-auto mb-10 leading-relaxed">
          State-by-state danger index, bear pace calculator, audio bear bell, species library, and pro
          survival gear — everything hikers and trail runners need before entering bear country.
        </p>
        <div className="flex flex-wrap gap-4 justify-center">
          <a
            href="#danger"
            className="bg-[#FF4C00] hover:bg-orange-600 text-white font-bold px-8 py-3.5 rounded-xl transition-colors text-base shadow-lg shadow-orange-900/30"
          >
            Check Your State →
          </a>
          <a
            href="#pace"
            className="bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold px-8 py-3.5 rounded-xl transition-colors text-base backdrop-blur-sm"
          >
            Can You Outrun a Bear?
          </a>
          <button
            onClick={() => openModal('sighting')}
            className="bg-white/10 hover:bg-white/20 border border-[#FF4C00]/50 hover:border-[#FF4C00] text-[#FF4C00] font-bold px-8 py-3.5 rounded-xl transition-colors text-base backdrop-blur-sm"
          >
            🐾 Report a Sighting
          </button>
        </div>
        <div className="mt-12 grid grid-cols-3 gap-6 max-w-sm mx-auto">
          {[
            ['~900K', 'Black Bears in US'],
            ['~55K', 'Grizzlies in N. America'],
            ['~26K', 'Polar Bears left'],
          ].map(([num, label]) => (
            <div key={label} className="text-center">
              <div className="text-2xl font-extrabold text-[#FF4C00]">{num}</div>
              <div className="text-xs text-gray-500 mt-0.5">{label}</div>
            </div>
          ))}
        </div>
      </div>
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 text-gray-600 animate-bounce text-sm">
        ↓ scroll
      </div>
    </section>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// DANGER INDEX
// ─────────────────────────────────────────────────────────────────────────────

function DangerIndex() {
  const [query, setQuery] = useState('')
  const filtered = STATES.filter((s) => s.name.toLowerCase().includes(query.toLowerCase()))

  return (
    <section id="danger" className="py-20 bg-[#0a150a]">
      <div className="max-w-7xl mx-auto px-4">
        <SectionHeader
          badge="LIVE DANGER INDEX"
          title="State Bear Danger Ratings"
          sub="2026 population and risk data. Click any state card to expand safety advice."
        />
        <div className="mb-6">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="🔍  Search state name..."
            className="w-full md:w-80 bg-[#1A2E1A] border border-[#2A4A2A] rounded-xl px-4 py-2.5 text-white placeholder-gray-600 focus:outline-none focus:border-[#FF4C00] transition-colors"
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((s) => (
            <StateCard key={s.name} {...s} />
          ))}
        </div>
        {filtered.length === 0 && (
          <p className="text-gray-600 text-center py-16 text-lg">No states match "{query}"</p>
        )}
        <div className="mt-8 flex flex-wrap gap-3 justify-center text-xs">
          {[
            { label: 'Level 10 — Extreme', color: 'text-red-400' },
            { label: 'Level 9 — High', color: 'text-orange-400' },
            { label: 'Level 7–8 — Elevated', color: 'text-yellow-400' },
            { label: 'Level 1–2 — Low', color: 'text-green-400' },
          ].map((l) => (
            <div key={l.label} className={`flex items-center gap-1.5 ${l.color} font-medium`}>
              <div className="w-2 h-2 rounded-full bg-current" />
              {l.label}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function StateCard({ name, level, status, pop, bears, advice }) {
  const [open, setOpen] = useState(false)
  return (
    <button
      className={`border rounded-xl p-4 text-left cursor-pointer transition-all w-full ${levelBorder(level)}`}
      onClick={() => setOpen(!open)}
    >
      <div className="flex items-start justify-between mb-2">
        <h3 className="font-bold text-white text-lg">{name}</h3>
        <div className="flex items-baseline gap-1 ml-2 flex-shrink-0">
          <span className={`text-2xl font-extrabold ${levelColor(level)}`}>{level}</span>
          <span className="text-xs text-gray-600">/10</span>
        </div>
      </div>
      <span className={`inline-block text-xs font-bold px-2 py-0.5 rounded-full border mb-3 ${levelBadge(level)}`}>
        {status}
      </span>
      <div className="space-y-1">
        <p className="text-xs text-gray-400">
          <span className="text-gray-600">Est. Population: </span>
          {pop}
        </p>
        <p className="text-xs text-gray-400">
          <span className="text-gray-600">Species Present: </span>
          {bears}
        </p>
      </div>
      {open && (
        <div className="mt-3 pt-3 border-t border-white/10">
          <p className="text-xs font-bold text-[#FF4C00] mb-1.5">📋 CURRENT STATUS & SAFETY ADVICE</p>
          <p className="text-sm text-gray-200 leading-relaxed">{advice}</p>
        </div>
      )}
      <p className="text-xs text-[#FF4C00] mt-2.5 font-medium">
        {open ? '▲ Close' : '▼ Safety Advice'}
      </p>
    </button>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// PACE CALCULATOR
// ─────────────────────────────────────────────────────────────────────────────

const BEAR_SPEEDS = [
  { name: 'Black Bear', mph: 30, emoji: '🐻', color: 'bg-blue-900/30 border-blue-500/30', caught: 'text-red-400', safe: 'text-green-400' },
  { name: 'Grizzly Bear', mph: 35, emoji: '🐻', color: 'bg-orange-900/30 border-orange-500/30', caught: 'text-red-400', safe: 'text-green-400' },
  { name: 'Polar Bear', mph: 40, emoji: '🐻‍❄️', color: 'bg-red-900/30 border-red-500/30', caught: 'text-red-400', safe: 'text-green-400' },
]

const REFERENCE_RUNNERS = [
  { label: 'Average Hiker', time: '25.0', mph: '8.8' },
  { label: 'Casual Runner', time: '17.0', mph: '13.1' },
  { label: 'Trained Runner', time: '13.0', mph: '17.1' },
  { label: 'Usain Bolt', time: '9.58', mph: '23.4' },
]

function PaceCalc() {
  const [time, setTime] = useState('')
  const [result, setResult] = useState(null)

  const calculate = () => {
    const t = parseFloat(time)
    if (!t || t <= 0 || t > 120) return
    const userMps = 100 / t
    const userMph = userMps * 2.23694
    const HEAD_START = 50 // metres

    const outcomes = BEAR_SPEEDS.map((b) => {
      const bearMps = b.mph * 0.44704
      const relSpeed = bearMps - userMps
      if (relSpeed <= 0) {
        return { ...b, caught: false, secs: null, msg: `🎉 You can actually outrun a ${b.name}! (You: ${userMph.toFixed(1)} mph vs Bear: ${b.mph} mph) — still carry spray, though.` }
      }
      const secs = HEAD_START / relSpeed
      const msg =
        secs < 4
          ? `You'd be a snack in ${secs.toFixed(1)}s 😱 — that's faster than most people can even react. Carry spray and USE it.`
          : secs < 8
          ? `${secs.toFixed(1)} seconds until contact. Your spray has a 30-foot range — deploy it NOW.`
          : secs < 15
          ? `${secs.toFixed(1)}s head start — enough time to get your spray out if you start deploying immediately.`
          : `The ${b.name} closes your 50m gap in ${secs.toFixed(1)}s. Bear spray buys precious reaction time — it's 92% effective.`
      return { ...b, caught: true, secs, msg }
    })
    setResult({ userMph: userMph.toFixed(1), outcomes })
  }

  return (
    <section id="pace" className="py-20 bg-[#0d1f0d]">
      <div className="max-w-3xl mx-auto px-4">
        <SectionHeader
          badge="PACE CALCULATOR"
          title="Can You Outrun a Bear?"
          sub="Enter your 100m dash time. We'll tell you exactly how long before each species wins. Spoiler: they all win."
        />
        <div className="bg-[#1A2E1A] border border-[#2A4A2A] rounded-2xl p-6 md:p-8">
          {/* Input row */}
          <div className="flex gap-3 mb-5">
            <div className="flex-1">
              <label className="block text-sm text-gray-500 mb-1.5 font-medium">Your 100m Dash Time (seconds)</label>
              <input
                type="number"
                value={time}
                onChange={(e) => { setTime(e.target.value); setResult(null) }}
                onKeyDown={(e) => e.key === 'Enter' && calculate()}
                placeholder="e.g. 15.5"
                min="9"
                max="120"
                step="0.1"
                className="w-full bg-[#0d1f0d] border border-[#2A4A2A] rounded-xl px-4 py-3 text-white text-lg font-mono focus:outline-none focus:border-[#FF4C00] transition-colors"
              />
            </div>
            <div className="flex items-end">
              <button
                onClick={calculate}
                className="bg-[#FF4C00] hover:bg-orange-600 active:bg-orange-700 text-white font-bold px-6 py-3 rounded-xl transition-colors text-base"
              >
                Run →
              </button>
            </div>
          </div>

          {/* Reference presets */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-6">
            {REFERENCE_RUNNERS.map((r) => (
              <button
                key={r.label}
                onClick={() => { setTime(r.time); setResult(null) }}
                className={`bg-[#0d1f0d] hover:bg-[#1A2E1A] border rounded-xl p-2.5 text-center transition-colors ${time === r.time ? 'border-[#FF4C00]/60 bg-[#1A2E1A]' : 'border-[#2A4A2A]'}`}
              >
                <div className="text-xs text-gray-500 mb-0.5">{r.label}</div>
                <div className="text-white font-mono font-bold">{r.time}s</div>
                <div className="text-xs text-gray-500">{r.mph} mph</div>
              </button>
            ))}
          </div>

          {/* Results */}
          {result && (
            <div className="space-y-3 pt-6 border-t border-[#2A4A2A]">
              <p className="text-gray-500 text-sm">
                Your speed:{' '}
                <span className="text-white font-bold font-mono">{result.userMph} mph</span>{' '}
                <span className="text-gray-600">
                  — World record: 27.8 mph (Usain Bolt). Every bear beats every human.
                </span>
              </p>
              {result.outcomes.map((o) => (
                <div key={o.name} className={`rounded-xl p-4 border ${o.color}`}>
                  <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                    <span className="text-2xl">{o.emoji}</span>
                    <span className="font-bold text-white">{o.name}</span>
                    <span className="text-gray-500 text-sm">{o.mph} mph</span>
                    {o.caught ? (
                      <span className="ml-auto text-sm font-bold text-red-400">CAUGHT 🚨</span>
                    ) : (
                      <span className="ml-auto text-sm font-bold text-green-400">ESCAPED 🎉</span>
                    )}
                  </div>
                  <p className="text-gray-200 text-sm leading-relaxed">{o.msg}</p>
                </div>
              ))}
              <div className="bg-[#FF4C00]/10 border border-[#FF4C00]/30 rounded-xl p-4">
                <p className="text-[#FF4C00] text-sm font-bold leading-relaxed">
                  🐻 Bottom Line: No human on Earth can outrun any bear species. Even Usain Bolt would be
                  caught by a Black Bear in under 2 seconds. Your only viable strategy: bear spray
                  (92% effective), noise-making, and knowing your bear.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// BEAR BELL
// ─────────────────────────────────────────────────────────────────────────────

function BearBell() {
  const [active, setActive] = useState(false)
  const [ringing, setRinging] = useState(false)
  const audioCtxRef = useRef(null)
  const intervalRef = useRef(null)

  const ringBell = useCallback(() => {
    try {
      if (!audioCtxRef.current || audioCtxRef.current.state === 'closed') {
        audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)()
      }
      const ctx = audioCtxRef.current
      if (ctx.state === 'suspended') ctx.resume()

      // Two-tone synthesised bell clang
      const tones = [
        { freq: 2637, delay: 0, dur: 0.7 },
        { freq: 3136, delay: 0.05, dur: 0.6 },
        { freq: 2093, delay: 0.15, dur: 0.5 },
      ]
      tones.forEach(({ freq, delay, dur }) => {
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        osc.connect(gain)
        gain.connect(ctx.destination)
        osc.type = 'sine'
        osc.frequency.setValueAtTime(freq, ctx.currentTime + delay)
        osc.frequency.exponentialRampToValueAtTime(freq * 0.4, ctx.currentTime + delay + dur)
        gain.gain.setValueAtTime(0.25, ctx.currentTime + delay)
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + dur)
        osc.start(ctx.currentTime + delay)
        osc.stop(ctx.currentTime + delay + dur + 0.05)
      })
      setRinging(true)
      setTimeout(() => setRinging(false), 600)
    } catch {
      // AudioContext unavailable
    }
  }, [])

  useEffect(() => {
    if (active) {
      ringBell()
      intervalRef.current = setInterval(ringBell, 3000)
    } else {
      clearInterval(intervalRef.current)
    }
    return () => clearInterval(intervalRef.current)
  }, [active, ringBell])

  return (
    <section id="bell" className="py-20 bg-[#0a150a]">
      <div className="max-w-2xl mx-auto px-4 text-center">
        <SectionHeader
          badge="BEAR BELL"
          title="Active Bear Bell"
          sub="Toggle ON to emit a repeating synthesized bell tone every 3 seconds. Use on trails to alert bears to your presence before you surprise them."
        />
        <div className="flex flex-col items-center gap-8">
          {/* Main bell button */}
          <div className="relative">
            {active && (
              <div className="absolute inset-0 rounded-full bg-[#FF4C00]/20 animate-ping scale-125" />
            )}
            <button
              onClick={() => setActive(!active)}
              className={`relative w-48 h-48 rounded-full font-extrabold text-xl transition-all duration-300 flex flex-col items-center justify-center gap-2 ${
                active
                  ? 'bg-[#FF4C00] text-white shadow-2xl glow-active scale-110'
                  : 'bg-[#1A2E1A] border-4 border-[#FF4C00] text-[#FF4C00] hover:scale-105 shadow-lg'
              }`}
            >
              <span className={`text-6xl block transition-transform ${ringing ? 'bell-ring' : ''}`}>
                🔔
              </span>
              <span className="text-lg font-black tracking-wider">
                {active ? 'ACTIVE' : 'ACTIVATE'}
              </span>
            </button>
          </div>

          {/* Status pill */}
          <div
            className={`px-6 py-3 rounded-full text-sm font-bold border transition-all ${
              active
                ? 'bg-[#FF4C00]/15 text-[#FF4C00] border-[#FF4C00]/40'
                : 'bg-gray-900/60 text-gray-500 border-gray-800'
            }`}
          >
            {active
              ? '🔊 Ringing every 3 seconds — audible to bears 300+ feet away'
              : '🔇 Bell is OFF — tap to activate'}
          </div>

          {/* Info grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full">
            {[
              { icon: '📡', label: 'Detection Range', val: '300–500 feet in typical forest conditions' },
              { icon: '🐾', label: 'Best Situations', val: 'Blind corners, dense brush, stream crossings' },
              { icon: '⚠️', label: 'Important', val: 'Supplement with bear spray — not a substitute for spray' },
            ].map((c) => (
              <div key={c.label} className="bg-[#1A2E1A] border border-[#2A4A2A] rounded-xl p-4 text-left">
                <div className="text-2xl mb-2">{c.icon}</div>
                <div className="text-xs text-gray-600 font-medium mb-1">{c.label}</div>
                <div className="text-sm text-gray-300">{c.val}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// BEAR LIBRARY
// ─────────────────────────────────────────────────────────────────────────────

function BearLibrary() {
  const [expanded, setExpanded] = useState(null)
  return (
    <section id="library" className="py-20 bg-[#0d1f0d]">
      <div className="max-w-7xl mx-auto px-4">
        <SectionHeader
          badge="BEAR LIBRARY"
          title="North American Bear Species"
          sub="Six species — six distinct response strategies. Misidentifying a bear in an encounter can be fatal."
        />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {BEARS.map((bear, i) => (
            <BearCard
              key={bear.name}
              bear={bear}
              open={expanded === i}
              onToggle={() => setExpanded(expanded === i ? null : i)}
            />
          ))}
        </div>
      </div>
    </section>
  )
}

function BearCard({ bear, open, onToggle }) {
  return (
    <div className="bg-[#1A2E1A] border border-[#2A4A2A] rounded-2xl overflow-hidden transition-all hover:border-[#FF4C00]/30 flex flex-col">
      {/* Image */}
      <div className="relative h-48 overflow-hidden flex-shrink-0">
        <img
          src={bear.img}
          alt={bear.name}
          className="w-full h-full object-cover"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#1A2E1A] via-[#1A2E1A]/20 to-transparent" />
        <div className="absolute bottom-3 left-3">
          <div className="flex gap-1 mb-1">{aggrDots(bear.aggr)}</div>
          <span className="text-xs text-gray-400 font-medium">
            Aggression {bear.aggr}/10
          </span>
        </div>
        <div className="absolute top-3 right-3 bg-[#0a150a]/80 rounded-lg px-2 py-1 text-xs font-bold text-[#FF4C00]">
          {bear.speed} mph
        </div>
      </div>

      {/* Content */}
      <div className="p-5 flex flex-col flex-1">
        <h3 className="font-extrabold text-white text-lg leading-tight">{bear.name}</h3>
        <p className="text-xs text-gray-600 italic mb-3">{bear.sci}</p>

        <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 text-xs mb-4">
          {[
            ['Weight', bear.weight],
            ['Population', bear.pop],
            ['Color', bear.color],
            ['Habitat', bear.habitat],
          ].map(([k, v]) => (
            <div key={k}>
              <span className="text-gray-600">{k}: </span>
              <span className="text-gray-300">{v}</span>
            </div>
          ))}
        </div>

        <p className="text-sm text-gray-300 leading-relaxed flex-1">{bear.desc}</p>

        <button
          onClick={onToggle}
          className="mt-4 w-full text-left text-xs font-bold text-[#FF4C00] hover:text-orange-400 transition-colors py-1"
        >
          {open ? '▲ Hide interaction guide' : '▼ Triggers & interaction guide'}
        </button>

        {open && (
          <div className="mt-3 pt-3 border-t border-[#2A4A2A] space-y-3">
            <div>
              <p className="text-xs font-bold text-yellow-400 mb-1.5">⚠️ Aggression Triggers</p>
              <p className="text-xs text-gray-300 leading-relaxed">{bear.triggers}</p>
            </div>
            <div>
              <p className="text-xs font-bold text-[#FF4C00] mb-1.5">🛡️ How to Respond</p>
              <p className="text-xs text-gray-300 leading-relaxed">{bear.interact}</p>
            </div>
            <div className="bg-red-900/20 border border-red-500/25 rounded-lg px-3 py-2">
              <p className="text-xs text-red-300 font-medium">{bear.neverDo}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// BEHAVIOR TRIGGERS ACCORDION
// ─────────────────────────────────────────────────────────────────────────────

function BehaviorTriggers() {
  const [open, setOpen] = useState(null)
  return (
    <section className="py-20 bg-[#0a150a]">
      <div className="max-w-4xl mx-auto px-4">
        <SectionHeader
          badge="BEHAVIORAL SCIENCE"
          title="What Triggers Bear Aggression"
          sub="Time of year, family status, hunger level, and a dozen other factors determine whether that bear is a problem. Know them all."
        />
        <div className="space-y-3">
          {TRIGGERS.map((t, i) => (
            <div
              key={t.title}
              className={`border rounded-2xl overflow-hidden transition-all ${
                t.severity === 'Extreme'
                  ? 'border-red-500/40 bg-red-900/15'
                  : t.severity === 'High'
                  ? 'border-orange-500/30 bg-orange-900/10'
                  : 'border-yellow-500/25 bg-yellow-900/8'
              }`}
            >
              <button
                className="w-full flex items-center gap-4 p-4 text-left"
                onClick={() => setOpen(open === i ? null : i)}
              >
                <span className="text-3xl flex-shrink-0">{t.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="font-bold text-white text-base">{t.title}</span>
                    <span
                      className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                        t.severity === 'Extreme'
                          ? 'bg-red-500/25 text-red-300'
                          : t.severity === 'High'
                          ? 'bg-orange-500/25 text-orange-300'
                          : 'bg-yellow-500/20 text-yellow-300'
                      }`}
                    >
                      {t.severity}
                    </span>
                  </div>
                </div>
                <span className="text-gray-600 flex-shrink-0">{open === i ? '▲' : '▼'}</span>
              </button>
              {open === i && (
                <div className="px-4 pb-5 pl-[72px]">
                  <p className="text-gray-300 text-sm leading-relaxed mb-4">{t.desc}</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {t.tips.map((tip, j) => (
                      <div key={j} className="flex gap-2 text-sm">
                        <span className="text-[#FF4C00] flex-shrink-0 mt-0.5">•</span>
                        <span className="text-gray-300">{tip}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// HOW TO INTERACT (DEDICATED SECTION)
// ─────────────────────────────────────────────────────────────────────────────

function HowToInteract() {
  const [active, setActive] = useState(0)
  const guide = INTERACTION_GUIDE[active]

  return (
    <section id="interact" className="py-20 bg-[#0d1f0d]">
      <div className="max-w-5xl mx-auto px-4">
        <SectionHeader
          badge="SURVIVAL PROTOCOL"
          title="How to Interact With Each Bear"
          sub="The wrong response can turn a non-fatal encounter fatal. Know the exact protocol for every species before you're standing in front of one."
        />

        {/* Tab bar */}
        <div className="flex flex-wrap gap-2 mb-8 justify-center">
          {INTERACTION_GUIDE.map((g, i) => (
            <button
              key={g.bear}
              onClick={() => setActive(i)}
              className={`px-4 py-2 rounded-xl text-sm font-bold transition-all border ${
                active === i
                  ? 'bg-[#FF4C00] border-[#FF4C00] text-white'
                  : 'bg-[#1A2E1A] border-[#2A4A2A] text-gray-400 hover:text-white hover:border-[#FF4C00]/40'
              }`}
            >
              {g.bear}
            </button>
          ))}
        </div>

        {/* Active guide card */}
        <div className={`border rounded-2xl overflow-hidden ${guide.color}`}>
          <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between flex-wrap gap-3">
            <div>
              <h3 className="text-xl font-extrabold text-white">{guide.bear}</h3>
              <p className="text-sm text-gray-400 mt-0.5">Recommended response strategy</p>
            </div>
            <span className={`px-4 py-1.5 rounded-full text-sm font-extrabold tracking-wider ${guide.badge}`}>
              {guide.tactic}
            </span>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-5">
              {guide.steps.map((step, i) => (
                <div key={i} className="flex gap-3 bg-[#0d1f0d]/60 rounded-xl px-4 py-3">
                  <span className="text-xl flex-shrink-0">{step.icon}</span>
                  <span className="text-sm text-gray-200 leading-relaxed">{step.text}</span>
                </div>
              ))}
            </div>
            {guide.warning && (
              <div className="bg-red-900/30 border border-red-500/30 rounded-xl px-5 py-3.5">
                <p className="text-sm text-red-200 font-bold">{guide.warning}</p>
              </div>
            )}
          </div>
        </div>

        {/* Bear spray reminder */}
        <div className="mt-6 bg-[#FF4C00]/10 border border-[#FF4C00]/30 rounded-2xl px-6 py-5 flex gap-4 items-start">
          <span className="text-4xl flex-shrink-0">🧴</span>
          <div>
            <p className="font-bold text-white mb-1">Bear Spray: The Universal First Response</p>
            <p className="text-sm text-gray-300 leading-relaxed">
              Regardless of species, bear spray deployed correctly is{' '}
              <strong className="text-[#FF4C00]">92% effective at stopping bear attacks</strong> —
              compared to 67% for firearms. Keep it on your hip (not your pack), practice drawing it, and
              deploy in a wide cloud at 60 feet when a bear charges. The cloud lingers and deters even after
              the bear passes through it.
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// GEAR STORE (AFFILIATE)
// ─────────────────────────────────────────────────────────────────────────────

function GearStore() {
  return (
    <section id="gear" className="py-20 bg-[#0a150a]">
      <div className="max-w-7xl mx-auto px-4">
        <SectionHeader
          badge="PRO SURVIVAL GEAR"
          title="Bear Safety Essentials"
          sub="Gear tested and trusted by backcountry professionals. Don't enter bear country without these three items."
        />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-4">
          {GEAR.map((g) => (
            <GearCard key={g.name} gear={g} />
          ))}
        </div>
        <p className="text-center text-xs text-gray-700">
          *Prices shown are approximate. As an Amazon Associate, RunBears.com earns from qualifying
          purchases. This does not affect our editorial recommendations.
        </p>
      </div>
    </section>
  )
}

function GearCard({ gear: g }) {
  return (
    <div className="bg-[#1A2E1A] border border-[#2A4A2A] rounded-2xl overflow-hidden hover:border-[#FF4C00]/40 transition-all flex flex-col group">
      <div className="relative h-52 overflow-hidden">
        <img
          src={g.img}
          alt={g.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#1A2E1A] via-transparent" />
        <div className="absolute top-3 left-3">
          <span className={`${g.badgeColor} text-white text-xs font-extrabold px-2.5 py-1 rounded-full`}>
            {g.badge}
          </span>
        </div>
      </div>
      <div className="p-5 flex flex-col flex-1">
        <h3 className="font-extrabold text-white text-xl mb-2">{g.name}</h3>
        <p className="text-sm text-gray-400 leading-relaxed flex-1 mb-4">{g.desc}</p>
        <div className="grid grid-cols-2 gap-1.5 mb-5">
          {g.bullets.map((b) => (
            <div key={b} className="flex gap-1.5 text-xs text-gray-400">
              <span className="text-[#FF4C00] flex-shrink-0">✓</span>
              {b}
            </div>
          ))}
        </div>
        <div className="flex items-center justify-between">
          <span className="text-2xl font-extrabold text-[#FF4C00]">{g.price}</span>
          <a
            href={g.url}
            target="_blank"
            rel="noopener noreferrer nofollow"
            className="bg-[#FF4C00] hover:bg-orange-600 active:bg-orange-700 text-white font-bold px-5 py-2.5 rounded-xl text-sm transition-colors"
          >
            View on Amazon →
          </a>
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// MODALS
// ─────────────────────────────────────────────────────────────────────────────

function Modal({ title, onClose, children }) {
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-[#1A2E1A] border border-[#2A4A2A] rounded-2xl max-w-2xl w-full max-h-[88vh] overflow-y-auto shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#2A4A2A] sticky top-0 bg-[#1A2E1A] z-10">
          <h2 className="text-lg font-extrabold text-white">{title}</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-white text-2xl leading-none w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/10 transition-colors"
          >
            ×
          </button>
        </div>
        <div className="px-6 py-5 text-gray-300 text-sm leading-relaxed space-y-4">{children}</div>
      </div>
    </div>
  )
}

function AboutModal({ onClose }) {
  return (
    <Modal title="About RunBears.com" onClose={onClose}>
      <p className="text-lg text-white font-bold">Why We Built This</p>
      <p>
        RunBears.com was born from a close call on a trail in Glacier National Park that could have been
        prevented with better real-time information. We're a team of trail runners, ultra-distance hikers,
        and outdoor safety advocates who believe that the vast majority of bear attacks are entirely
        preventable — when you know what you're doing.
      </p>
      <p>
        Our mission: give every person who enters bear country access to the best, most current safety
        data, practical tools, and trusted gear recommendations — completely free.
      </p>
      <p className="text-white font-bold">Our Tools</p>
      <ul className="space-y-2">
        {[
          'Live state-by-state danger index updated with 2026 wildlife population data',
          'Bear Pace Calculator that illustrates concretely why avoidance is your only real strategy',
          'Synthesized Web Audio API bear bell for active trail use — no app required',
          'Full species library with aggression profiles and species-specific interaction guides',
          'Curated survival gear recommendations from field-tested products',
        ].map((item) => (
          <li key={item} className="flex gap-2">
            <span className="text-[#FF4C00] flex-shrink-0">•</span>
            {item}
          </li>
        ))}
      </ul>
      <p className="text-white font-bold">Disclaimer</p>
      <p className="text-gray-400 text-xs">
        Information on this site is for general educational purposes only and does not replace
        professional wildlife safety training or certification. Always check current local park conditions
        and regulations before entering bear habitat. In an emergency, call 911.
      </p>
    </Modal>
  )
}

function ContactModal({ onClose }) {
  const [sent, setSent] = useState(false)
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' })

  const handleSubmit = (e) => {
    e.preventDefault()
    setSent(true)
  }

  if (sent) {
    return (
      <Modal title="Contact Us" onClose={onClose}>
        <div className="text-center py-10">
          <div className="text-6xl mb-4">✅</div>
          <p className="text-xl font-bold text-white mb-2">Message Received!</p>
          <p className="text-gray-400">Thanks for reaching out. We'll respond within 48 hours.</p>
        </div>
      </Modal>
    )
  }

  return (
    <Modal title="Contact Us" onClose={onClose}>
      <p className="text-gray-400">
        Questions, safety data corrections, partnership inquiries, or gear recommendations? Reach out below.
      </p>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            { id: 'name', label: 'Your Name', type: 'text', placeholder: 'John Muir' },
            { id: 'email', label: 'Email Address', type: 'email', placeholder: 'you@trails.com' },
          ].map((f) => (
            <div key={f.id}>
              <label className="block text-xs text-gray-500 mb-1.5 font-medium uppercase tracking-wide">
                {f.label}
              </label>
              <input
                type={f.type}
                value={form[f.id]}
                onChange={(e) => setForm({ ...form, [f.id]: e.target.value })}
                placeholder={f.placeholder}
                required
                className="w-full bg-[#0d1f0d] border border-[#2A4A2A] rounded-xl px-4 py-2.5 text-white placeholder-gray-700 focus:outline-none focus:border-[#FF4C00] transition-colors"
              />
            </div>
          ))}
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1.5 font-medium uppercase tracking-wide">
            Subject
          </label>
          <input
            type="text"
            value={form.subject}
            onChange={(e) => setForm({ ...form, subject: e.target.value })}
            placeholder="e.g. Data correction for Montana"
            required
            className="w-full bg-[#0d1f0d] border border-[#2A4A2A] rounded-xl px-4 py-2.5 text-white placeholder-gray-700 focus:outline-none focus:border-[#FF4C00] transition-colors"
          />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1.5 font-medium uppercase tracking-wide">
            Message
          </label>
          <textarea
            value={form.message}
            onChange={(e) => setForm({ ...form, message: e.target.value })}
            placeholder="Tell us what's on your mind..."
            required
            rows={5}
            className="w-full bg-[#0d1f0d] border border-[#2A4A2A] rounded-xl px-4 py-2.5 text-white placeholder-gray-700 focus:outline-none focus:border-[#FF4C00] transition-colors resize-none"
          />
        </div>
        <button
          type="submit"
          className="w-full bg-[#FF4C00] hover:bg-orange-600 text-white font-bold py-3 rounded-xl transition-colors"
        >
          Send Message
        </button>
      </form>
    </Modal>
  )
}

function PrivacyModal({ onClose }) {
  return (
    <Modal title="Privacy Policy" onClose={onClose}>
      <p className="text-xs text-gray-600">Last updated: April 24, 2026</p>

      {[
        {
          heading: '1. Introduction',
          body: 'RunBears.com ("we," "us," "our") operates this website. This Privacy Policy explains how we collect, use, disclose, and protect your information when you visit our site.',
        },
        {
          heading: '2. Information We Collect',
          body: 'We collect information you voluntarily provide (e.g., via our contact form: name, email address, and message). We also automatically collect usage data including IP addresses, browser type, referring URLs, pages visited, and time on page via cookies and analytics tools (Google Analytics).',
        },
        {
          heading: '3. Cookies',
          body: 'We use cookies to analyze site traffic, remember user preferences, and serve personalized advertisements. By continuing to use this site, you consent to our use of cookies. You can disable cookies in your browser settings, though some site features may not function correctly.',
        },
        {
          heading: '4. Google AdSense & Advertising',
          body: 'We use Google AdSense to display third-party advertisements. Google may use cookies (including the DoubleClick cookie) to serve ads based on your prior visits to this website and other websites across the Internet. You can opt out of personalized advertising by visiting Google Ad Settings at google.com/settings/ads.',
        },
        {
          heading: '5. Amazon Affiliate Disclosure',
          body: 'RunBears.com participates in the Amazon Services LLC Associates Program, an affiliate advertising program designed to provide a means for sites to earn advertising fees by advertising and linking to Amazon.com. As an Amazon Associate, we earn from qualifying purchases. Affiliate links on this site are clearly identified.',
        },
        {
          heading: '6. Data Sharing',
          body: 'We do not sell your personal information to third parties. We may share data with service providers (Google Analytics, Google AdSense, hosting providers) solely to operate this website.',
        },
        {
          heading: '7. Data Security',
          body: 'We implement reasonable technical and organizational measures to protect your personal information. However, no method of internet transmission is 100% secure.',
        },
        {
          heading: '8. Contact',
          body: 'For privacy questions or data deletion requests, please contact us through the Contact form on this site.',
        },
      ].map(({ heading, body }) => (
        <div key={heading}>
          <p className="font-bold text-white">{heading}</p>
          <p>{body}</p>
        </div>
      ))}
    </Modal>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// FOOTER
// ─────────────────────────────────────────────────────────────────────────────

function Footer({ openModal }) {
  return (
    <footer className="bg-[#050d05] border-t border-[#1A2E1A] pt-10 pb-6 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 mb-8">
          <div>
            <div className="flex items-center gap-2 text-white font-extrabold text-2xl mb-2">
              <span>🐻</span>
              RunBears<span className="text-[#FF4C00]">.com</span>
            </div>
            <p className="text-xs text-gray-600 max-w-xs">
              Bear safety intelligence for hikers, trail runners, and backcountry travelers.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-4 sm:gap-8">
            <div>
              <p className="text-xs text-gray-600 font-bold uppercase tracking-widest mb-2">Company</p>
              <div className="flex flex-col gap-1.5">
                <button
                  onClick={() => openModal('about')}
                  className="text-sm text-gray-400 hover:text-[#FF4C00] transition-colors text-left"
                >
                  About Us
                </button>
                <button
                  onClick={() => openModal('contact')}
                  className="text-sm text-gray-400 hover:text-[#FF4C00] transition-colors text-left"
                >
                  Contact
                </button>
                <button
                  onClick={() => openModal('privacy')}
                  className="text-sm text-gray-400 hover:text-[#FF4C00] transition-colors text-left"
                >
                  Privacy Policy
                </button>
              </div>
            </div>
            <div>
              <p className="text-xs text-gray-600 font-bold uppercase tracking-widest mb-2">Tools</p>
              <div className="flex flex-col gap-1.5">
                {[
                  ['Danger Index', '#danger'],
                  ['Pace Calculator', '#pace'],
                  ['Bear Bell', '#bell'],
                  ['Bear Library', '#library'],
                ].map(([label, href]) => (
                  <a
                    key={href}
                    href={href}
                    className="text-sm text-gray-400 hover:text-[#FF4C00] transition-colors"
                  >
                    {label}
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-[#1A2E1A] pt-5 space-y-2 text-center">
          <p className="text-xs text-gray-600">
            <strong className="text-gray-500">Affiliate Disclosure:</strong> As an Amazon Associate,
            RunBears.com earns from qualifying purchases. Affiliate links are clearly identified and do not
            affect our editorial recommendations.
          </p>
          <p className="text-xs text-gray-700">
            Information on this site is for educational purposes only and does not replace professional
            wildlife safety training. Always consult local park regulations. In an emergency, call 911.
          </p>
          <p className="text-xs text-gray-700">
            © 2026 RunBears.com · All rights reserved · Built for hikers, by hikers.
          </p>
        </div>
      </div>
    </footer>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// ANCHOR AD (fixed bottom)
// ─────────────────────────────────────────────────────────────────────────────

function AnchorAd({ dismissed, onDismiss }) {
  if (dismissed) return null
  return (
    <div className="fixed bottom-0 inset-x-0 z-40 flex items-center justify-center bg-[#050d05]/95 border-t border-[#1A2E1A] backdrop-blur-sm py-2 px-4">
      <AdUnit slotKey="anchor" w={728} h={90} />
      <button
        onClick={onDismiss}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-600 hover:text-gray-400 text-xs px-2 py-1 hover:bg-white/5 rounded transition-colors"
        aria-label="Dismiss ad"
      >
        ✕
      </button>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// SIGHTING MODAL
// ─────────────────────────────────────────────────────────────────────────────

const SIGHTING_SPECIES = [
  'American Black Bear',
  'Grizzly Bear',
  'Polar Bear',
  'Kodiak Brown Bear',
  'Spirit Bear (Kermode)',
  'Florida Black Bear',
  'Unknown / Not Sure',
]

const SIGHTING_BEHAVIORS = [
  'Passing through / not interested',
  'Foraging nearby',
  'Approaching curiously',
  'Bluff charging',
  'Full charge / attack',
  'With cubs',
  'Defending food cache',
  'Injured or sick',
]

const BLANK_FORM = {
  species: '',
  state: '',
  location: '',
  datetime: '',
  behavior: '',
  distance: '',
  notes: '',
}

function SightingModal({ onClose }) {
  const [form, setForm] = useState(BLANK_FORM)
  const [submitted, setSubmitted] = useState(false)
  const [saving, setSaving]       = useState(false)
  const [errors, setErrors]       = useState({})

  const set = (key, val) => {
    setForm((f) => ({ ...f, [key]: val }))
    setErrors((e) => ({ ...e, [key]: undefined }))
  }

  const validate = () => {
    const e = {}
    if (!form.species)  e.species  = 'Select a species'
    if (!form.state)    e.state    = 'Select a state'
    if (!form.location) e.location = 'Enter a location'
    if (!form.datetime) e.datetime = 'Enter date & time'
    return e
  }

  const handleSubmit = async (ev) => {
    ev.preventDefault()
    const e = validate()
    if (Object.keys(e).length) { setErrors(e); return }
    setSaving(true)
    if (supabase) {
      try {
        await supabase.from('sightings').insert({
          species:           form.species,
          state:             form.state,
          location:          form.location,
          sighting_datetime: form.datetime,
          distance:          form.distance  || null,
          behavior:          form.behavior  || null,
          notes:             form.notes     || null,
        })
      } catch { /* fail silently — still show success confirmation */ }
    }
    setSaving(false)
    setSubmitted(true)
  }

  if (submitted) {
    return (
      <Modal title="Report a Bear Sighting" onClose={onClose}>
        <div className="text-center py-10">
          <div className="text-6xl mb-4">🐾</div>
          <p className="text-xl font-bold text-white mb-2">Sighting Reported!</p>
          <p className="text-gray-400 mb-2">
            Thanks for helping build the live danger index. Your report for a{' '}
            <span className="text-[#FF4C00] font-semibold">{form.species}</span> near{' '}
            <span className="text-white font-semibold">{form.location}, {form.state}</span> has been
            logged.
          </p>
          <p className="text-xs text-gray-600 mt-4">
            Community sightings help us keep the danger index accurate. Stay safe out there.
          </p>
          <button
            onClick={onClose}
            className="mt-6 bg-[#FF4C00] hover:bg-orange-600 text-white font-bold px-8 py-2.5 rounded-xl transition-colors"
          >
            Close
          </button>
        </div>
      </Modal>
    )
  }

  const field = 'w-full bg-[#0d1f0d] border rounded-xl px-4 py-2.5 text-white placeholder-gray-700 focus:outline-none transition-colors'
  const ok    = 'border-[#2A4A2A] focus:border-[#FF4C00]'
  const bad   = 'border-red-500/60 focus:border-red-400'

  return (
    <Modal title="🐾 Report a Bear Sighting" onClose={onClose}>
      <p className="text-gray-400 text-sm mb-1">
        Help keep the community danger index accurate. Required fields are marked *.
      </p>

      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        {/* Species + State row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-gray-500 font-bold uppercase tracking-wide mb-1.5">
              Species *
            </label>
            <select
              value={form.species}
              onChange={(e) => set('species', e.target.value)}
              className={`${field} ${errors.species ? bad : ok}`}
            >
              <option value="">Select species...</option>
              {SIGHTING_SPECIES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
            {errors.species && <p className="text-red-400 text-xs mt-1">{errors.species}</p>}
          </div>

          <div>
            <label className="block text-xs text-gray-500 font-bold uppercase tracking-wide mb-1.5">
              State *
            </label>
            <select
              value={form.state}
              onChange={(e) => set('state', e.target.value)}
              className={`${field} ${errors.state ? bad : ok}`}
            >
              <option value="">Select state...</option>
              {STATES.map((s) => (
                <option key={s.name} value={s.name}>{s.name}</option>
              ))}
              <option value="Other / Canada">Other / Canada</option>
            </select>
            {errors.state && <p className="text-red-400 text-xs mt-1">{errors.state}</p>}
          </div>
        </div>

        {/* Location */}
        <div>
          <label className="block text-xs text-gray-500 font-bold uppercase tracking-wide mb-1.5">
            Location Description *
          </label>
          <input
            type="text"
            value={form.location}
            onChange={(e) => set('location', e.target.value)}
            placeholder="e.g. Glacier National Park, Going-to-the-Sun Road trailhead"
            className={`${field} ${errors.location ? bad : ok}`}
          />
          {errors.location && <p className="text-red-400 text-xs mt-1">{errors.location}</p>}
        </div>

        {/* Date/Time + Distance row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-gray-500 font-bold uppercase tracking-wide mb-1.5">
              Date & Time *
            </label>
            <input
              type="datetime-local"
              value={form.datetime}
              onChange={(e) => set('datetime', e.target.value)}
              className={`${field} ${errors.datetime ? bad : ok} [color-scheme:dark]`}
            />
            {errors.datetime && <p className="text-red-400 text-xs mt-1">{errors.datetime}</p>}
          </div>

          <div>
            <label className="block text-xs text-gray-500 font-bold uppercase tracking-wide mb-1.5">
              Approx. Distance from Bear
            </label>
            <select
              value={form.distance}
              onChange={(e) => set('distance', e.target.value)}
              className={`${field} ${ok}`}
            >
              <option value="">Select distance...</option>
              {['< 10 feet', '10–30 feet', '30–100 feet', '100–300 feet', '300+ feet'].map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Behavior */}
        <div>
          <label className="block text-xs text-gray-500 font-bold uppercase tracking-wide mb-1.5">
            Bear Behavior Observed
          </label>
          <select
            value={form.behavior}
            onChange={(e) => set('behavior', e.target.value)}
            className={`${field} ${ok}`}
          >
            <option value="">Select behavior...</option>
            {SIGHTING_BEHAVIORS.map((b) => (
              <option key={b} value={b}>{b}</option>
            ))}
          </select>
        </div>

        {/* Notes */}
        <div>
          <label className="block text-xs text-gray-500 font-bold uppercase tracking-wide mb-1.5">
            Additional Notes
          </label>
          <textarea
            value={form.notes}
            onChange={(e) => set('notes', e.target.value)}
            placeholder="Any other details — number of bears, cubs present, trail conditions, what deterred it..."
            rows={3}
            className={`${field} ${ok} resize-none`}
          />
        </div>

        {/* Disclaimer + Submit */}
        <div className="bg-[#1A2E1A] border border-[#2A4A2A] rounded-xl px-4 py-3 text-xs text-gray-500">
          ⚠️ For life-threatening emergencies, call 911. Do not use this form to report an active attack.
        </div>

        <button
          type="submit"
          disabled={saving}
          className={`w-full font-bold py-3 rounded-xl transition-colors text-base text-white ${saving ? 'bg-orange-900 cursor-not-allowed' : 'bg-[#FF4C00] hover:bg-orange-600 active:bg-orange-700'}`}
        >
          {saving ? '⏳ Saving...' : 'Submit Sighting Report'}
        </button>
      </form>
    </Modal>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// RECENT SIGHTINGS TABLE
// ─────────────────────────────────────────────────────────────────────────────

const AGO = (ts) => {
  const m = Math.round((Date.now() - new Date(ts)) / 60000)
  if (m < 1)    return 'just now'
  if (m < 60)   return `${m}m ago`
  if (m < 1440) return `${Math.floor(m / 60)}h ago`
  return `${Math.floor(m / 1440)}d ago`
}

function RecentSightings() {
  const [rows, setRows]       = useState([])
  const [loading, setLoading] = useState(true)
  const [stateFilter, setStateFilter] = useState('')

  const load = useCallback(async () => {
    if (!supabase) { setLoading(false); return }
    setLoading(true)
    const { data } = await supabase
      .from('sightings')
      .select('id, created_at, species, state, location, sighting_datetime, distance, behavior')
      .order('created_at', { ascending: false })
      .limit(50)
    setRows(data || [])
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  const displayed = stateFilter
    ? rows.filter((r) => r.state === stateFilter)
    : rows

  const speciesBadge = (s) => {
    if (s?.includes('Grizzly')) return 'text-orange-400'
    if (s?.includes('Polar'))   return 'text-blue-300'
    if (s?.includes('Kodiak'))  return 'text-yellow-400'
    return 'text-green-400'
  }

  return (
    <section id="sightings" className="py-20 bg-[#0d1f0d]">
      <div className="max-w-7xl mx-auto px-4">
        <SectionHeader
          badge="LIVE SIGHTINGS FEED"
          title="Community Bear Sightings"
          sub="Real-time reports submitted by hikers and trail runners. Use the 🐾 Report Sighting button to add yours."
        />

        {/* Controls */}
        <div className="flex flex-wrap gap-3 mb-6 items-center justify-between">
          <select
            value={stateFilter}
            onChange={(e) => setStateFilter(e.target.value)}
            className="bg-[#1A2E1A] border border-[#2A4A2A] rounded-xl px-4 py-2 text-white text-sm focus:outline-none focus:border-[#FF4C00] transition-colors"
          >
            <option value="">All states</option>
            {STATES.map((s) => (
              <option key={s.name} value={s.name}>{s.name}</option>
            ))}
          </select>
          <button
            onClick={load}
            className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-[#FF4C00] transition-colors font-medium"
          >
            ↻ Refresh
          </button>
        </div>

        {/* States */}
        {!supabase ? (
          <div className="bg-[#1A2E1A] border border-[#2A4A2A] rounded-2xl p-12 text-center">
            <p className="text-3xl mb-3">⚙️</p>
            <p className="text-gray-400 font-bold mb-1">Supabase Not Yet Configured</p>
            <p className="text-gray-600 text-sm">
              Add <code className="bg-[#0d1f0d] px-1 rounded text-gray-400">VITE_SUPABASE_URL</code> and{' '}
              <code className="bg-[#0d1f0d] px-1 rounded text-gray-400">VITE_SUPABASE_ANON_KEY</code> to your{' '}
              <code className="bg-[#0d1f0d] px-1 rounded text-gray-400">.env</code> file — see setup instructions below.
            </p>
          </div>
        ) : loading ? (
          <div className="bg-[#1A2E1A] border border-[#2A4A2A] rounded-2xl p-12 text-center">
            <div className="text-4xl mb-3 animate-pulse">🐾</div>
            <p className="text-gray-500">Loading sightings...</p>
          </div>
        ) : displayed.length === 0 ? (
          <div className="bg-[#1A2E1A] border border-[#2A4A2A] rounded-2xl p-12 text-center">
            <p className="text-3xl mb-3">🔭</p>
            <p className="text-gray-400 font-bold mb-1">
              {stateFilter ? `No sightings in ${stateFilter} yet` : 'No sightings yet'}
            </p>
            <p className="text-gray-600 text-sm">Be the first to report one — use the 🐾 button in the nav.</p>
          </div>
        ) : (
          <div className="bg-[#1A2E1A] border border-[#2A4A2A] rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#2A4A2A] bg-[#0a150a]">
                    {['Species', 'State', 'Location', 'Sighting Time', 'Behavior', 'Distance', 'Reported'].map(
                      (h) => (
                        <th
                          key={h}
                          className="text-left px-4 py-3 text-xs text-gray-600 font-bold uppercase tracking-wide whitespace-nowrap"
                        >
                          {h}
                        </th>
                      )
                    )}
                  </tr>
                </thead>
                <tbody>
                  {displayed.map((r, i) => (
                    <tr
                      key={r.id}
                      className={`border-b border-[#2A4A2A]/40 hover:bg-[#243324] transition-colors ${
                        i % 2 === 1 ? 'bg-[#0d1f0d]/40' : ''
                      }`}
                    >
                      <td className={`px-4 py-3 font-bold whitespace-nowrap ${speciesBadge(r.species)}`}>
                        {r.species}
                      </td>
                      <td className="px-4 py-3 text-gray-300 whitespace-nowrap">{r.state}</td>
                      <td
                        className="px-4 py-3 text-gray-400 max-w-[180px] truncate"
                        title={r.location}
                      >
                        {r.location}
                      </td>
                      <td className="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">
                        {r.sighting_datetime
                          ? new Date(r.sighting_datetime).toLocaleString(undefined, {
                              month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
                            })
                          : '—'}
                      </td>
                      <td className="px-4 py-3 text-gray-500 text-xs max-w-[140px] truncate" title={r.behavior || ''}>
                        {r.behavior || '—'}
                      </td>
                      <td className="px-4 py-3 text-gray-600 text-xs whitespace-nowrap">
                        {r.distance || '—'}
                      </td>
                      <td className="px-4 py-3 text-gray-600 text-xs whitespace-nowrap">
                        {AGO(r.created_at)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="px-4 py-3 flex items-center justify-between border-t border-[#2A4A2A]">
              <p className="text-xs text-gray-600">
                {displayed.length} sighting{displayed.length !== 1 ? 's' : ''}{stateFilter ? ` in ${stateFilter}` : ''}
              </p>
              <p className="text-xs text-gray-700">Community-sourced · not verified by wildlife authorities</p>
            </div>
          </div>
        )}
      </div>
    </section>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// APP ROOT
// ─────────────────────────────────────────────────────────────────────────────

export default function App() {
  const [modal, setModal] = useState(null)
  const [anchorDismissed, setAnchorDismissed] = useState(false)

  return (
    <div className="min-h-screen bg-[#0a150a] text-white" style={{ paddingBottom: anchorDismissed ? 0 : 106 }}>
      <Navbar openModal={setModal} />

      <main>
        <Hero openModal={setModal} />

        {/* Leaderboard Ad */}
        <div className="py-4 bg-[#0a150a] px-4">
          <AdUnit slotKey="leaderboard" w={728} h={90} />
        </div>

        <DangerIndex />
        <PaceCalc />
        <BearBell />
        <BearLibrary />
        <BehaviorTriggers />
        <HowToInteract />

        {/* In-content Rectangle Ad */}
        <div className="py-8 bg-[#0a150a] flex justify-center px-4">
          <AdUnit slotKey="rectangle" w={300} h={250} />
        </div>

        <GearStore />
        <RecentSightings />
      </main>

      <Footer openModal={setModal} />
      <AnchorAd dismissed={anchorDismissed} onDismiss={() => setAnchorDismissed(true)} />

      {modal === 'about'    && <AboutModal    onClose={() => setModal(null)} />}
      {modal === 'contact'  && <ContactModal  onClose={() => setModal(null)} />}
      {modal === 'privacy'  && <PrivacyModal  onClose={() => setModal(null)} />}
      {modal === 'sighting' && <SightingModal onClose={() => setModal(null)} />}
    </div>
  )
}
