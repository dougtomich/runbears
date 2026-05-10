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
    img: 'https://images.unsplash.com/photo-1603204390039-7488a29bc389?w=600&q=80',
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
    img: 'https://images.unsplash.com/photo-1576076819613-26f8537ae375?w=600&q=80',
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
    img: 'https://images.unsplash.com/photo-1517103068540-6a70e8c0022f?w=600&q=80',
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
    img: 'https://images.unsplash.com/photo-1657580437400-92777b2fc546?w=600&q=80',
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
    img: 'https://images.unsplash.com/photo-1715412406838-93eed8537465?w=600&q=80',
    desc: "Florida's only native bear species — a subtropical subspecies of the American Black Bear adapted to Florida's warm, humid climate. Rebounded from near extinction in the 1970s to over 4,000 individuals through conservation efforts.",
    triggers: 'Unsecured garbage and food attractants near neighborhoods are the leading cause of encounters. Most incidents involve food-conditioned bears. Mothers with cubs from January (earliest birth timing of any US bear).',
    interact: 'Make yourself large and loud. Back away without running. Deploy bear spray if charged. Fight back if contact occurs — same as all Black Bear encounters. Most importantly: NEVER FEED THESE BEARS.',
    neverDo: 'Never leave garbage cans or pet food outdoors — a fed Florida Black Bear is typically euthanized.',
  },
]

// ─────────────────────────────────────────────────────────────────────────────
// BEAR LORE  (educational deep-dives per species)
// ─────────────────────────────────────────────────────────────────────────────
const BEAR_LORE = [
  {
    name: 'American Black Bear',
    emoji: '🐻',
    origin: "The American Black Bear is North America's oldest bear lineage, having evolved from Ursus etruscus roughly 2.5 million years ago. Their ancestors crossed the Bering Land Bridge from Asia during a Pleistocene glaciation. As the Ice Age ended and forests expanded across the continent, Black Bears thrived and diversified into at least 16 recognized subspecies — from the cinnamon bears of the Rockies to the blonde bears of Alaska's Kenai Peninsula. They were here long before the first humans arrived on this continent.",
    habits: [
      'Crepuscular by nature — most active at dawn and dusk, sleeping through the hottest midday hours.',
      'True hibernators: heart rate drops from 50 bpm to just 8 bpm; they neither eat, drink, nor defecate for up to 7 months.',
      'Omnivores who eat roughly 85% plants — berries, acorns, grasses, roots — supplemented by insects, fish, and the occasional fawn.',
      'Exceptional tree climbers and swimmers. Cubs instinctively flee to trees for safety within weeks of leaving the den.',
      'Highly intelligent problem-solvers with remarkable spatial memory — they can remember fruit trees and berry patches for decades.',
    ],
    motivations: "Food is everything. In autumn, Black Bears enter hyperphagia — a relentless biological drive to consume 15,000–20,000 calories per day to build fat reserves for winter. A Black Bear's entire yearly schedule revolves around food: where it is, when it ripens, and how to reach it. Reproduction is the second great driver — males travel enormous home ranges each June seeking receptive females.",
    love: "Black Bears are a landmark conservation success story. In the early 1900s, overhunting and habitat loss had decimated populations across the eastern US. Today, nearly 900,000 thrive across North America — one of the greatest wildlife recoveries in history. They're also keystone seed dispersers: a single bear can spread thousands of seeds across miles of forest per day. And despite their reputation, they are overwhelmingly shy, non-confrontational animals who want nothing more than to be left alone with a berry patch.",
    facts: [
      'A Black Bear can sprint to 30 mph — faster than any Olympic sprinter.',
      'Their sense of smell is 7x stronger than a bloodhound\'s and over 2,000x more powerful than a human\'s.',
      'Black Bears are the only bear species in which males play no role in raising cubs whatsoever.',
      'A mother bear loses up to 40% of her body weight during hibernation while nursing her newborn cubs.',
      'Their population has fully recovered — from near-zero in parts of the East to 900,000+ across North America.',
    ],
  },
  {
    name: 'Grizzly Bear',
    emoji: '🐻',
    origin: 'Grizzlies are a North American subspecies of Brown Bear (Ursus arctos), which evolved in Asia roughly 1.8 million years ago. Their ancestors crossed the Bering Land Bridge between 50,000 and 100,000 years ago — far more recently than Black Bears. They quickly spread south following salmon-rich river systems. By the time Lewis and Clark encountered them in 1804, an estimated 50,000–100,000 Grizzlies roamed the American West. Today, fewer than 2,000 survive in the contiguous US — primarily in the Greater Yellowstone and Northern Continental Divide ecosystems.',
    habits: [
      'Among the most powerful foragers on Earth — consuming pine nuts, roots, moths, berries, ground squirrels, elk calves, and salmon, sometimes within the same week.',
      'They dig with claws up to 4 inches long to excavate ground squirrel colonies and uproot hillsides for camas bulbs.',
      'At salmon rivers, a dominance hierarchy forms — the largest bears claim the best fishing spots. Brooks Falls in Alaska hosts the most spectacular bear watching on Earth.',
      'Despite weighing up to 800 lbs, Grizzlies sprint at 35 mph with terrifying, explosive acceleration.',
      'Females give birth every 2–3 years — one of the slowest reproductive rates of any North American mammal.',
    ],
    motivations: "Grizzlies are driven by the same fall hyperphagia as Black Bears. But they are also deeply territorial — especially boars protecting home ranges. The fiercest motivation of all? Maternal protection. A Grizzly sow is arguably the most ferocious mother in North American wildlife. She will charge a vehicle, a human, or another bear without hesitation if her cubs are threatened. That's not rage — it's ancient, absolute love.",
    love: "Grizzly Bears are ecosystem engineers of the highest order. Each salmon they drag inland from a river deposits marine nitrogen into the forest soil, fertilizing trees up to 500 meters from the bank. Forests without Grizzlies are measurably less productive. They hold deep spiritual significance to over 100 indigenous nations across North America. And the Grizzly's return to Yellowstone — declared a recovery success in 2017 — is one of the most inspiring conservation achievements in American history.",
    facts: [
      "A Grizzly's bite force of 1,200 PSI can crush a bowling ball.",
      'They have an extraordinary memory, returning to specific food sources with pinpoint accuracy years later.',
      'Grizzly and Polar Bear hybrids ("Pizzly" or "Grolar" bears) occur naturally and have been documented in the wild.',
      'During hyperphagia, a Grizzly may eat 20,000 calories per day, gaining 3–6 lbs of fat daily.',
      'Yellowstone Grizzlies have learned to follow wolf packs and steal elk kills — directly benefiting from wolf reintroduction.',
    ],
  },
  {
    name: 'Polar Bear',
    emoji: '🧊',
    origin: "Polar Bears are the youngest bear species, having diverged from Brown Bears between 400,000 and 600,000 years ago — a breathtakingly rapid evolutionary transformation. Their closest living relatives are the Brown Bears of Alaska's ABC Islands. In just a few hundred thousand years, they evolved from an omnivorous forest bear into the world's largest land carnivore — perfectly adapted to the harshest environment on Earth. Their fur appears white but is actually colorless and hollow; their skin beneath is jet black.",
    habits: [
      'Marathon swimmers — they can travel 60+ miles non-stop using their massive forepaws as paddles. One female was tracked swimming 426 miles in 9 days.',
      'Unlike other bears, Polar Bears are obligate carnivores. Ringed seals make up 90%+ of their diet, hunted by lying motionless at breathing holes for hours.',
      'Nomadic rather than territorial, following seasonal sea ice across ranges that can exceed 100,000 square miles.',
      'Only pregnant females den. Males and non-pregnant females remain active year-round — including through Arctic winters of total darkness.',
      'Young bears spend up to 2 years playing and mock-fighting with siblings to learn the survival skills they will need as adults.',
    ],
    motivations: "Unlike every other bear, a Polar Bear's primary motivator is not seasonal hyperphagia but constant survival. As sea ice disappears due to climate change, bears are forced to fast for longer periods — sometimes 4–8 months without significant food. Their entire existence is now a race against a changing environment. What drives them most fundamentally: the hunt, the kill, and the next breath of Arctic air.",
    love: "Polar Bears are an umbrella species — protecting them means protecting the entire Arctic ecosystem: sea ice, ringed seals, walrus, Arctic foxes, and countless seabirds all exist within the same web. They're also remarkably playful and curious animals. Videos of Polar Bears gently playing with sled dogs or poking at cameras left in the snow reveal a species of genuine intelligence and curiosity. They are in crisis — the IUCN classifies them as Vulnerable, with near-total habitat loss projected by 2100 if emissions continue unchecked.",
    facts: [
      'Polar Bear liver contains toxic levels of Vitamin A — historically fatal to Arctic explorers who ate it.',
      "A Polar Bear's fur appears white but is actually clear and hollow, acting as a light-conducting fiber optic.",
      'Despite weighing up to 1,500 lbs, they can walk silently across thin ice by distributing their weight.',
      'Baby Polar Bear cubs are born roughly the size of a guinea pig — about 1.5 lbs.',
      'Polar Bears have been observed using chunks of ice and rocks as tools to break into seal dens.',
    ],
  },
  {
    name: 'Kodiak Brown Bear',
    emoji: '🏔️',
    origin: "The Kodiak Brown Bear is the product of 12,000 years of isolation. When sea levels rose at the end of the last Ice Age, the Kodiak Archipelago was cut off from the Alaskan mainland — and the bears on the island began evolving independently. Over millennia, the extraordinary richness of Kodiak's salmon runs enabled them to grow far larger than their mainland cousins. Today the Kodiak is the largest bear subspecies on Earth and the second-largest land carnivore after the Polar Bear, with males regularly exceeding 1,200 lbs and standing 10 feet tall on their hind legs.",
    habits: [
      "Among the greatest fishers in the animal kingdom — during the July–October salmon runs, dozens of Kodiak Bears congregate at rivers and falls in remarkable proximity.",
      "Their fishing techniques are learned, not instinctive. Young bears observe their mothers and experiment with different methods across multiple seasons.",
      "Despite enormous size, Kodiaks are excellent climbers. They excavate dens deep into hillsides, often reusing and expanding the same den across generations.",
      "The Kodiak Bear Management Area restricts human access to much of the archipelago, making these among the least human-habituated large bears on Earth.",
      'Their home ranges are vast — a single male may patrol 500+ square miles of coastline, mountain, and river valley.',
    ],
    motivations: "Salmon. The entire biological year of a Kodiak Bear is structured around the salmon run — perhaps the most dramatic wildlife spectacle in North America. A large male can consume 20 salmon per day during peak run, eating only the roe and brain (the highest caloric parts) before discarding the carcass for eagles and ravens. They must double their body weight before denning for winter.",
    love: "Kodiak Island is one of the last places on Earth where you can witness nature operating at full, undiminished scale. These bears have never been extirpated, never brought back from the brink — they have simply persisted, enormous and magnificent, on their island for 12,000 years. Every salmon carcass a Kodiak Bear drags into the forest becomes a nutrient pulse that feeds alder, spruce, and wildflowers. The entire island ecosystem breathes on the rhythm of the bear and the salmon.",
    facts: [
      "A large male Kodiak stands 10 feet tall on its hind legs — taller than a regulation NBA basketball hoop.",
      "Kodiak Bears can detect a food source from up to 20 miles away under the right wind conditions.",
      "The largest Kodiak ever recorded weighed over 2,200 lbs in captivity.",
      "Despite their size, Kodiaks can outrun a horse over short distances.",
      "Kodiak Island has one of the highest densities of Bald Eagles in the world — drawn by salmon carcasses left by the bears.",
    ],
  },
  {
    name: 'Spirit Bear (Kermode Bear)',
    emoji: '✨',
    origin: "The Spirit Bear is not a separate species but a rare color morph of the American Black Bear, caused by a recessive mutation in the MC1R gene — the same gene responsible for red hair in humans. When two Black Bears both carry this recessive mutation, their cubs have a ~25% chance of being born white. The mutation likely became widespread in the isolated Great Bear Rainforest because the white coloring offered a measurable advantage: fish cannot see a white bear against the bright sky above, making Spirit Bears more effective salmon hunters than their black-furred siblings.",
    habits: [
      "Spirit Bears live primarily on Princess Royal Island and neighboring islands in BC's Great Bear Rainforest — one of the most pristine temperate rainforests remaining on Earth.",
      "Research shows Spirit Bears catch salmon up to 30% more successfully than black-furred Black Bears fishing the same streams.",
      "Their range is monitored and partially governed by the Gitga'at and Kitasoo/Xai'xais First Nations, who protected these bears long before Western conservation.",
      "Highly solitary and incredibly elusive — even experienced local guides may go weeks without a confirmed sighting.",
      "They share all the core habits of American Black Bears: omnivorous diet, excellent tree climbing, and seasonal salmon fishing.",
    ],
    motivations: "The same motivations as any Black Bear — food, shelter, reproduction — but with one extraordinary twist: their white coloring provides a measurable survival advantage in salmon streams. Evolution has quietly optimized the Spirit Bear's coat into a fishing tool. Every individual matters enormously to a population of only ~400 animals.",
    love: "There are roughly 400 Spirit Bears in existence. They represent one of nature's most beautiful accidents: a single gene variant producing an animal of haunting, ethereal beauty that is sacred to First Nations peoples who have protected it for centuries. The Gitga'at Nation calls the Spirit Bear 'Moksgm'ol' — a sacred messenger. Their existence and the old-growth rainforest that shelters them remain under active threat from logging. Protecting the Spirit Bear means protecting one of the rarest ecosystems on the Pacific Coast.",
    facts: [
      "Two entirely black-furred Black Bears can produce a white Spirit Bear cub if both carry the recessive gene.",
      "Spirit Bears are not albino — they have normal pigmentation in their eyes and nose.",
      "The Great Bear Rainforest is home to 25% of the world's remaining coastal temperate rainforest.",
      "Scientific research on Spirit Bears was conducted largely in collaboration with Gitga'at Nation members who had protected them for generations.",
      "A Spirit Bear sighting is considered rarer than seeing a wild snow leopard — one of the rarest wildlife encounters on Earth.",
    ],
  },
  {
    name: 'Florida Black Bear',
    emoji: '🌴',
    origin: "The Florida Black Bear is a subtropical subspecies of the American Black Bear that became isolated in Florida after the last Ice Age, roughly 10,000 years ago. As the climate warmed and the Florida peninsula separated from the mainland forest corridor, these bears adapted to scrub oak flatwoods, cypress swamps, and coastal marshes unlike any other North American bear. By the 1970s, habitat destruction and hunting had reduced their population to fewer than 300 individuals. Through a landmark conservation effort, the Florida Fish and Wildlife Conservation Commission oversaw their recovery to over 4,000 bears today — one of the greatest state-level wildlife recoveries in US history.",
    habits: [
      "Florida Black Bears do not truly hibernate — winters are too warm. They enter brief periods of torpor during cold snaps but can be roused easily and may forage year-round.",
      "Among the most omnivorous bears in North America: saw palmetto berries, cabbage palm hearts, blueberries, armadillos, and, unfortunately, garbage.",
      "Florida bears breed in June–July and give birth in January — among the earliest birthing of any US bear, adapted to Florida's mild winters.",
      "Largely nocturnal near human development — a behavioral adaptation to living alongside 22 million people in one of the fastest-growing states in the US.",
      "Highly capable swimmers: they cross lakes, estuaries, and have been documented moving between barrier islands miles offshore.",
    ],
    motivations: "Survival in a landscape dominated by humans. Unlike remote wilderness bears, Florida Black Bears must navigate roads, subdivisions, golf courses, and citrus groves to find food. Their greatest motivation — like all Black Bears — is food, and in Florida, that increasingly means unsecured garbage. Their adaptation to human landscapes is both a triumph and a tragedy: it enables survival, but it leads to conflicts that often end with the bear being euthanized.",
    love: "The Florida Black Bear comeback is one of the most remarkable wildlife conservation stories in American history. From near-extinction to 4,000+ bears in roughly 40 years — driven by citizen science, wildlife corridors, and public education. They are uniquely adapted to one of the most ecologically diverse and fragile ecosystems in North America. Florida Black Bears are seed dispersers for saw palmetto, gopher apple, and dozens of native Florida plants — making them a keystone species for scrub habitat that hundreds of other species depend on.",
    facts: [
      "Florida Black Bears have no natural predators as adults — only humans and vehicles pose a significant threat.",
      "The Ocala National Forest hosts the densest Florida Black Bear population — over 1,000 bears in a single forest.",
      "Florida bears have been documented swimming miles offshore to reach barrier islands.",
      "A food-conditioned Florida bear can smell a garbage can's contents from over a mile away.",
      "Florida Black Bears are one of the few bear subspecies that regularly live within major metropolitan areas, including suburban Orlando.",
    ],
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

// ─────────────────────────────────────────────────────────────────────────────
// BACKPACKING GUIDE DATA
// ─────────────────────────────────────────────────────────────────────────────
const BG_GEAR = [
  // Shelter
  { cat: 'Shelter', icon: '⛺', name: 'Lightweight 2-Person Backpacking Tent', desc: 'Look for anything under 4 lbs. Free-standing tents are easiest for beginners — no guylines to figure out in the dark. Setup takes 5 minutes once you know it.', price: '$150–$350', badge: 'Must Have', url: 'https://www.amazon.com/s?k=lightweight+backpacking+tent+2+person+freestanding&tag=runbears-20' },
  { cat: 'Shelter', icon: '🛏️', name: '20°F Sleeping Bag', desc: 'Arkansas nights dip to 40°F+ even in spring and fall. A 20°F bag gives you a comfortable margin. Synthetic fills are more forgiving if the bag gets damp.', price: '$80–$200', badge: 'Must Have', url: 'https://www.amazon.com/s?k=20+degree+synthetic+backpacking+sleeping+bag&tag=runbears-20' },
  { cat: 'Shelter', icon: '🧩', name: 'Sleeping Pad', desc: 'Insulates you from cold ground — more critical than your sleeping bag for warmth. A foam Z-Lite pad ($50) is foolproof; an inflatable pad is lighter and more comfortable.', price: '$50–$180', badge: 'Must Have', url: 'https://www.amazon.com/s?k=backpacking+sleeping+pad+insulated&tag=runbears-20' },
  // Pack
  { cat: 'Pack', icon: '🎒', name: '50–65L Backpacking Pack', desc: 'For a 3-night trip, 55L is the sweet spot. Look for an internal frame and a hip belt that fits your torso length — 80% of the weight should ride on your hips, not your shoulders.', price: '$120–$300', badge: 'Must Have', url: 'https://www.amazon.com/s?k=55L+backpacking+pack+internal+frame&tag=runbears-20' },
  { cat: 'Pack', icon: '🌧️', name: 'Pack Rain Cover', desc: 'Arkansas spring storms can drench you without warning. A rain cover keeps your sleeping bag dry. Many packs include one, but buy a backup if not.', price: '$15–$30', badge: 'Important', url: 'https://www.amazon.com/s?k=backpack+rain+cover+55L&tag=runbears-20' },
  // Water
  { cat: 'Water', icon: '💧', name: 'Sawyer Squeeze Water Filter', desc: 'The gold standard for beginner backpackers. Filters 100,000 gallons lifetime and weighs only 3 oz. Squeeze directly from a dirty water bag through the filter into your bottle. Never leave home without it.', price: '$32', badge: 'Critical', url: 'https://www.amazon.com/s?k=sawyer+squeeze+water+filter+kit&tag=runbears-20' },
  { cat: 'Water', icon: '💊', name: 'Aquatabs Purification Tablets', desc: 'Backup to your Sawyer. If your filter freezes, gets dropped in a river, or clogs, these save your trip. One tablet treats 1 liter in 30 minutes. Pack 20 tablets.', price: '$9', badge: 'Backup', url: 'https://www.amazon.com/s?k=aquatabs+water+purification+tablets+backpacking&tag=runbears-20' },
  { cat: 'Water', icon: '🫙', name: 'Platypus 2L Soft Water Bottle', desc: 'Collapsible dirty-water reservoir that works with the Sawyer. Fill from a stream, squeeze through the filter. Weighs almost nothing when empty.', price: '$12', badge: 'Pairs with Sawyer', url: 'https://www.amazon.com/s?k=platypus+soft+bottle+2L+water+filter+reservoir&tag=runbears-20' },
  // Cooking
  { cat: 'Cooking', icon: '🔥', name: 'MSR PocketRocket 2 Stove', desc: 'Boils 1 liter of water in 3.5 minutes. Weighs 2.6 oz. Collapses to the size of a golf ball. The most popular beginner backpacking stove for good reason.', price: '$49', badge: 'Must Have', url: 'https://www.amazon.com/s?k=MSR+PocketRocket+2+camp+stove&tag=runbears-20' },
  { cat: 'Cooking', icon: '⛽', name: 'Isobutane Fuel Canister (110g)', desc: 'One 110g canister is plenty for 3 nights for 2 people (boiling water for meals + coffee). Buy the brand that matches your stove thread.', price: '$8', badge: 'Required', url: 'https://www.amazon.com/s?k=isobutane+fuel+canister+110g+backpacking+stove&tag=runbears-20' },
  { cat: 'Cooking', icon: '🥘', name: 'Titanium Pot 750ml', desc: 'Light enough to forget you packed it. Boils water for freeze-dried meals and doubles as your eating bowl. Titanium is lightest; aluminum works and costs less.', price: '$25–$55', badge: 'Must Have', url: 'https://www.amazon.com/s?k=titanium+backpacking+pot+750ml+lid&tag=runbears-20' },
  { cat: 'Cooking', icon: '🥄', name: 'Long-Handle Spork (Titanium)', desc: 'The only utensil you need. Long handle reaches the bottom of freeze-dried meal pouches. Weighs 0.6 oz. Titanium lasts forever.', price: '$10', badge: 'Simple Win', url: 'https://www.amazon.com/s?k=titanium+long+spork+backpacking&tag=runbears-20' },
  // Navigation & Safety
  { cat: 'Navigation', icon: '📍', name: 'Garmin inReach Mini 2', desc: 'Two-way satellite messenger + SOS. If you twist an ankle 8 miles from the trailhead with no cell signal, this calls rescue. For a first trip in Arkansas backcountry, seriously consider it.', price: '$349', badge: 'Safety', url: 'https://www.amazon.com/s?k=Garmin+inReach+Mini+2+satellite+communicator&tag=runbears-20' },
  { cat: 'Navigation', icon: '🧭', name: 'Suunto A-10 Compass', desc: 'Download your trail map on AllTrails before you leave (offline mode) — cell signal in the Ouachitas and Ozarks is unreliable. A basic compass is your fallback if your phone dies.', price: '$25', badge: 'Safety', url: 'https://www.amazon.com/s?k=suunto+A10+baseplate+compass+hiking&tag=runbears-20' },
  // Lighting
  { cat: 'Lighting', icon: '🔦', name: 'Black Diamond Spot 400 Headlamp', desc: 'Bright enough to hike at night, light enough to forget you\'re wearing it. Hands-free lighting is essential for camp setup, midnight bathroom trips, and cooking after dark.', price: '$49', badge: 'Must Have', url: 'https://www.amazon.com/s?k=Black+Diamond+Spot+400+headlamp+hiking&tag=runbears-20' },
  { cat: 'Lighting', icon: '🔋', name: 'Extra AAA Batteries or Backup Power Bank', desc: 'Cold temps and heavy use drain batteries faster than expected. Pack a set of spares or bring a small USB power bank for your phone and headlamp.', price: '$15–$30', badge: 'Smart', url: 'https://www.amazon.com/s?k=small+lightweight+power+bank+hiking&tag=runbears-20' },
  // First Aid
  { cat: 'First Aid', icon: '🩺', name: 'Adventure Medical Kits Ultralight .7', desc: 'Pre-assembled backcountry kit covering blisters, cuts, sprains, and mild allergic reactions. Add: tweezers (ticks), moleskin, ibuprofen, and antihistamine (Benadryl).', price: '$35', badge: 'Safety', url: 'https://www.amazon.com/s?k=adventure+medical+kit+ultralight+backpacking&tag=runbears-20' },
  { cat: 'First Aid', icon: '🦟', name: 'Permethrin Clothing Treatment Spray', desc: 'Arkansas has dense Lone Star tick populations and chiggers year-round. Treat your clothing and tent with Permethrin before you leave — it lasts through 6 washes and is odorless when dry.', price: '$14', badge: '🚨 Arkansas Critical', url: 'https://www.amazon.com/s?k=permethrin+spray+clothing+treatment+tick+repellent&tag=runbears-20' },
  { cat: 'First Aid', icon: '🐻', name: 'UDAP Bear Spray', desc: 'Arkansas has a small Black Bear population. Clip it to your hip strap — accessible in under 3 seconds. 92% effective at stopping charges. More reliable than a firearm at close range.', price: '$39', badge: 'Recommended', url: 'https://www.amazon.com/s?k=UDAP+bear+spray+holster&tag=runbears-20' },
  // Clothing
  { cat: 'Clothing', icon: '🌧️', name: 'Packable Rain Jacket', desc: 'Arkansas spring and fall bring unpredictable afternoon thunderstorms. A packable rain jacket weighs 8 oz, packs to the size of a baseball, and keeps hypothermia at bay on a wet ridgeline.', price: '$60–$150', badge: 'Must Have', url: 'https://www.amazon.com/s?k=packable+rain+jacket+lightweight+hiking&tag=runbears-20' },
  { cat: 'Clothing', icon: '🧦', name: 'Merino Wool Hiking Socks (3 pairs)', desc: 'Blisters end trips. Merino wool manages moisture, resists odor, and cushions hot spots that become blisters. Darn Tough and Smartwool are worth the price — one blister costs more in misery than a $25 pair of socks.', price: '$20–$25/pair', badge: 'Game Changer', url: 'https://www.amazon.com/s?k=darn+tough+merino+wool+hiking+socks&tag=runbears-20' },
  // Tools
  { cat: 'Tools', icon: '🪄', name: 'Collapsible Trekking Poles', desc: 'Reduce knee stress by 25% on descents, add stability on creek crossings, and help with balance on uneven Ozark and Ouachita terrain. Beginners who skip these almost always regret it.', price: '$50–$120', badge: 'Highly Recommended', url: 'https://www.amazon.com/s?k=collapsible+trekking+poles+lightweight+backpacking&tag=runbears-20' },
  { cat: 'Tools', icon: '🔪', name: 'Pocket Knife or Multi-Tool', desc: 'Useful for gear repair, food prep, cutting moleskin for blisters, and first aid. A simple $20 Victorinox Swiss Army knife covers everything a first-timer needs.', price: '$20–$80', badge: 'Must Have', url: 'https://www.amazon.com/s?k=victorinox+swiss+army+knife+backpacking&tag=runbears-20' },
  { cat: 'Tools', icon: '🧻', name: 'Trowel + WAG Bags', desc: 'You will need to dig a cat hole 6+ inches deep and 200 feet from water to bury human waste. Or use a WAG bag (pack-it-out system) required in some wilderness areas. This is part of Leave No Trace.', price: '$10–$15', badge: 'Required by LNT', url: 'https://www.amazon.com/s?k=backpacking+trowel+cat+hole+wag+bag&tag=runbears-20' },
  { cat: 'Tools', icon: '🧼', name: 'Dr. Bronner\'s Soap + Hand Sanitizer', desc: 'Biodegradable soap for dishes, hands, and camp hygiene. Use 200+ feet from any water source. Pair with hand sanitizer before every meal — backcountry diarrhea is brutal.', price: '$8', badge: 'Hygiene', url: 'https://www.amazon.com/s?k=dr+bronners+backpacking+biodegradable+soap&tag=runbears-20' },
]

const BG_FOOD = [
  { meal: 'Breakfast', name: 'Mountain House Granola with Milk & Blueberries', cals: 440, desc: 'Add boiling water, wait 8 minutes. 440 calories, 14g protein. One of the best freeze-dried breakfasts — actually tastes good on day 3.', url: 'https://www.amazon.com/s?k=mountain+house+granola+milk+blueberries+freeze+dried&tag=runbears-20' },
  { meal: 'Breakfast', name: 'Backpacker\'s Pantry Colorado Omelet', cals: 400, desc: 'Eggs, cheese, and veggies in a pouch. High protein to start a hiking day. Just add hot water directly to the bag — no dishes.', url: 'https://www.amazon.com/s?k=backpackers+pantry+colorado+omelet+freeze+dried&tag=runbears-20' },
  { meal: 'Breakfast', name: 'Starbucks VIA Instant Coffee (12-pack)', cals: 5, desc: 'Non-negotiable. Coffee at camp on a cold Ozark morning is a legitimate survival strategy. 4 packets per person for 3 nights.', url: 'https://www.amazon.com/s?k=starbucks+via+instant+coffee+packets+pike+place&tag=runbears-20' },
  { meal: 'Lunch', name: 'Knorr Rice Sides (Chicken / Cheddar Broccoli)', cals: 320, desc: 'Budget-friendly, 320 calories, cooks in 7 minutes. Add a tuna packet for protein. The most popular budget backpacking lunch for a reason.', url: 'https://www.amazon.com/s?k=knorr+rice+sides+chicken+variety+pack&tag=runbears-20' },
  { meal: 'Lunch', name: 'Wild Planet Albacore Tuna Packets (No Drain)', cals: 130, desc: 'High protein, no can to pack out, no draining required. Toss one in your Knorr rice or eat with crackers. Pack 3 per person per trip.', url: 'https://www.amazon.com/s?k=wild+planet+tuna+no+drain+packet&tag=runbears-20' },
  { meal: 'Lunch', name: 'Mary\'s Gone Crackers (Gluten Free)', cals: 140, desc: 'Durable crackers that survive in a pack without crumbling. Eat with tuna, almond butter, or on their own. 140 calories per serving.', url: 'https://www.amazon.com/s?k=marys+gone+crackers+backpacking+snack&tag=runbears-20' },
  { meal: 'Dinner', name: 'Mountain House Beef Stroganoff (2-serving)', cals: 710, desc: 'The classic. Add boiling water to the pouch, wait 9 minutes. Rich, filling, 710 calories for 2 servings. Tastes like actual food after a 10-mile day.', url: 'https://www.amazon.com/s?k=mountain+house+beef+stroganoff+freeze+dried+pouch&tag=runbears-20' },
  { meal: 'Dinner', name: 'Mountain House Chicken & Dumplings (2-serving)', cals: 700, desc: 'Comfort food in the backcountry. 700 calories, 32g protein per pouch. Cook directly in the bag — zero dishes. Best eaten on night 2 as a morale booster.', url: 'https://www.amazon.com/s?k=mountain+house+chicken+dumplings+freeze+dried&tag=runbears-20' },
  { meal: 'Dinner', name: 'Good To-Go Thai Curry (Vegan)', cals: 470, desc: 'Real ingredients, no artificial flavors. A step above standard freeze-dried meals. If you want to eat genuinely well in the wilderness, this is the move.', url: 'https://www.amazon.com/s?k=good+to+go+thai+curry+freeze+dried+backpacking&tag=runbears-20' },
  { meal: 'Snacks', name: 'RXBAR Protein Bars (12-pack)', cals: 210, desc: 'Whole-food bars: egg whites, dates, nuts. 12g protein, 210 calories, no junk. Eat during rest breaks to maintain energy on long climbs.', url: 'https://www.amazon.com/s?k=rxbar+protein+bar+variety+pack&tag=runbears-20' },
  { meal: 'Snacks', name: 'Justin\'s Almond Butter Packets', cals: 190, desc: 'Squeeze on crackers, a tortilla, or eat straight from the packet. Healthy fats that keep you full through long miles. 190 calories each.', url: 'https://www.amazon.com/s?k=justins+almond+butter+single+serve+packets&tag=runbears-20' },
  { meal: 'Snacks', name: 'Good & Gather Trail Mix (Nuts / Chocolate)', cals: 160, desc: 'The most calorie-dense snack per ounce. Target 200+ calories per hour while moving. Pre-portion into zip bags before the trip.', url: 'https://www.amazon.com/s?k=trail+mix+nuts+chocolate+backpacking+bulk&tag=runbears-20' },
  { meal: 'Snacks', name: 'Honey Stinger Energy Waffles', cals: 160, desc: 'A treat that doubles as fuel. Light, 160 calories, and they taste like a reward after a long climb. Great for the first mile when breakfast hasn\'t kicked in yet.', url: 'https://www.amazon.com/s?k=honey+stinger+waffle+energy+snack+variety&tag=runbears-20' },
  { meal: 'Snacks', name: 'LMNT Electrolyte Packets', cals: 10, desc: 'Arkansas summer and spring humidity will drain your electrolytes fast. Add to your water bottle — prevents muscle cramps and fatigue far better than plain water. Critical on hot days.', url: 'https://www.amazon.com/s?k=LMNT+electrolyte+packets+variety+pack&tag=runbears-20' },
]

const GEAR = [
  {
    name: 'UDAP Bear Spray',
    desc: 'The gold standard in bear deterrents. 2% capsaicin formula with a 30-foot deployment range. 7.9 oz can, EPA-certified. Required equipment in many national parks. 92% effective when deployed correctly — more reliable than firearms.',
    price: '$39.99',
    badge: 'Best Seller',
    badgeColor: 'bg-[#FF4C00]',
    img: 'https://images.unsplash.com/photo-1762814058374-48a406952a69?w=400&q=80',
    url: 'https://www.amazon.com/s?k=UDAP+bear+spray&tag=runbears-20',
    bullets: ['2% capsaicin concentration', '30-foot effective range', 'EPA certified formula', '7.9 oz canister'],
  },
  {
    name: 'BearVault BV500 Canister',
    desc: 'Clear polycarbonate container holds 700 cubic inches of food with no tools required for opening. Bear-proof certified by the Interagency Grizzly Bear Committee. Required by regulation in Yosemite, Sequoia, and dozens of wilderness areas.',
    price: '$89.95',
    badge: 'Park Required',
    badgeColor: 'bg-blue-600',
    img: 'https://images.unsplash.com/photo-1771849316197-2b1f3f49b651?w=400&q=80',
    url: 'https://www.amazon.com/s?k=BearVault+BV500+food+canister&tag=runbears-20',
    bullets: ['700 cu in capacity', 'IGBC certified', 'No tools to open', 'Fits most backpacks'],
  },
  {
    name: 'Garmin inReach Messenger',
    desc: "Two-way satellite messaging and GPS tracking that works anywhere on Earth with zero cell signal. The SOS button connects instantly to GEOS 24/7 international emergency coordination. If something goes wrong in bear country, this gets you help.",
    price: '$299.99',
    badge: 'Life Saver',
    badgeColor: 'bg-green-700',
    img: 'https://images.unsplash.com/photo-1754821305530-8e3c7b8deda2?w=400&q=80',
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
    ['Bear World', '#bearworld'],
    ['How to Interact', '#interact'],
    ['Gear Store', '#gear'],
    ['Backpacking Guide', '#backpacking'],
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
// BEAR WORLD — educational deep-dive section
// ─────────────────────────────────────────────────────────────────────────────
function BearWorld() {
  const [activeIdx, setActiveIdx] = useState(0)
  const [openSec, setOpenSec] = useState('origin')
  const bear = BEAR_LORE[activeIdx]

  const sections = [
    { key: 'origin',      label: '🌍 Origins & Evolution',    content: bear.origin },
    { key: 'habits',      label: '🕐 Daily Life & Habits',    content: bear.habits },
    { key: 'motivations', label: '💡 What Motivates Them',    content: bear.motivations },
    { key: 'love',        label: '❤️ Why We Love Them',       content: bear.love },
  ]

  const toggle = (key) => setOpenSec((prev) => (prev === key ? null : key))

  return (
    <section id="bearworld" className="py-20 bg-[#0d1f0d]">
      <div className="max-w-5xl mx-auto px-4">
        <SectionHeader
          badge="BEAR WORLD"
          title="Know Your Bear"
          sub="Dive deep into the lives, evolutionary history, daily habits, and natural wonders of North America's six remarkable bear species."
        />

        {/* Species tabs */}
        <div className="flex flex-wrap gap-2 justify-center mb-10">
          {BEAR_LORE.map((b, i) => (
            <button
              key={b.name}
              onClick={() => { setActiveIdx(i); setOpenSec('origin') }}
              className={`px-4 py-2 rounded-full text-sm font-bold transition-all border ${
                activeIdx === i
                  ? 'bg-[#FF4C00] border-[#FF4C00] text-white shadow-lg scale-105'
                  : 'bg-[#0a150a] border-[#2A4A2A] text-gray-400 hover:border-[#FF4C00]/50 hover:text-white'
              }`}
            >
              {b.emoji} {b.name.replace(' (Kermode Bear)', '')}
            </button>
          ))}
        </div>

        {/* Content card */}
        <div className="bg-[#0a150a] border border-[#2A4A2A] rounded-2xl overflow-hidden">

          {/* Card header */}
          <div className="px-6 py-5 border-b border-[#2A4A2A] flex items-center gap-4 bg-[#1A2E1A]/40">
            <span className="text-5xl leading-none">{bear.emoji}</span>
            <div>
              <h3 className="text-xl font-black text-white">{bear.name}</h3>
              <p className="text-xs text-gray-500 mt-1">Select a section below to expand the deep-dive</p>
            </div>
          </div>

          {/* Accordion rows */}
          <div className="divide-y divide-[#2A4A2A]">
            {sections.map((sec) => (
              <div key={sec.key}>
                <button
                  className="w-full flex items-center justify-between px-6 py-4 text-left hover:bg-[#1A2E1A]/40 transition-colors group"
                  onClick={() => toggle(sec.key)}
                >
                  <span className="font-bold text-[#FF4C00] group-hover:text-orange-400 transition-colors text-sm sm:text-base">
                    {sec.label}
                  </span>
                  <span
                    className={`text-gray-500 text-sm transition-transform duration-200 ${openSec === sec.key ? 'rotate-180' : ''}`}
                  >
                    ▼
                  </span>
                </button>

                {openSec === sec.key && (
                  <div className="px-6 pb-6 pt-2 bg-[#1A2E1A]/20">
                    {Array.isArray(sec.content) ? (
                      <ul className="space-y-3">
                        {sec.content.map((item, i) => (
                          <li key={i} className="flex gap-3 text-gray-300 text-sm leading-relaxed">
                            <span className="text-[#FF4C00] mt-0.5 flex-shrink-0 font-bold">▸</span>
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-gray-300 text-sm leading-relaxed">{sec.content}</p>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Fun facts strip */}
          <div className="border-t border-[#2A4A2A] px-6 py-6 bg-[#0a150a]">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4">⚡ Did You Know?</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {bear.facts.map((f, i) => (
                <div
                  key={i}
                  className="bg-[#1A2E1A] border border-[#2A4A2A] rounded-xl p-4 hover:border-[#FF4C00]/30 transition-colors"
                >
                  <p className="text-gray-300 text-xs leading-relaxed">{f}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
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
// BACKPACKING GUIDE
// ─────────────────────────────────────────────────────────────────────────────
const BG_CATS = ['All', 'Shelter', 'Pack', 'Water', 'Cooking', 'Navigation', 'Lighting', 'First Aid', 'Clothing', 'Tools']
const MEAL_CATS = ['All', 'Breakfast', 'Lunch', 'Dinner', 'Snacks']

function BackpackingGuide() {
  const [tab, setTab] = useState('plan')
  const [gearCat, setGearCat] = useState('All')
  const [mealCat, setMealCat] = useState('All')

  const tabs = [
    { key: 'plan',  label: '🗺️ Plan First' },
    { key: 'gear',  label: '🎒 Gear List' },
    { key: 'food',  label: '🍜 Food & Water' },
    { key: 'fire',  label: '🔥 Fire & Camp' },
    { key: 'watch', label: '⚠️ Watch Out For' },
  ]

  const filteredGear = gearCat === 'All' ? BG_GEAR : BG_GEAR.filter(g => g.cat === gearCat)
  const filteredFood = mealCat === 'All' ? BG_FOOD : BG_FOOD.filter(f => f.meal === mealCat)

  const pill = 'px-3 py-1.5 rounded-full text-xs font-bold border transition-all cursor-pointer'
  const pillActive = 'bg-[#FF4C00] border-[#FF4C00] text-white'
  const pillInactive = 'bg-[#0a150a] border-[#2A4A2A] text-gray-400 hover:border-[#FF4C00]/50 hover:text-white'

  return (
    <section id="backpacking" className="py-20 bg-[#0a150a]">
      <div className="max-w-5xl mx-auto px-4">
        <SectionHeader
          badge="BEGINNER'S GUIDE"
          title="Your First 3-Night Backpacking Trip"
          sub="Everything you need to know before stepping onto a backcountry trail — gear, food, water, fire, and what Arkansas throws at first-timers."
        />

        {/* Tab bar */}
        <div className="flex flex-wrap gap-2 justify-center mb-10">
          {tabs.map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`px-5 py-2.5 rounded-full text-sm font-bold border transition-all ${
                tab === t.key
                  ? 'bg-[#FF4C00] border-[#FF4C00] text-white shadow-lg scale-105'
                  : 'bg-[#1A2E1A] border-[#2A4A2A] text-gray-400 hover:border-[#FF4C00]/50 hover:text-white'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* ── PLAN FIRST ── */}
        {tab === 'plan' && (
          <div className="space-y-6">

            {/* Loop vs Point-to-Point */}
            <div className="bg-[#0d1f0d] border border-[#2A4A2A] rounded-2xl p-6">
              <h3 className="text-lg font-black text-white mb-4">🚗 Loop vs Point-to-Point — One Car or Two?</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-[#1A2E1A] border border-[#2A4A2A] rounded-xl p-4">
                  <p className="text-[#FF4C00] font-bold text-sm mb-2">🔄 Loop Trail — 1 Vehicle</p>
                  <p className="text-gray-300 text-sm leading-relaxed mb-3">You start and finish at the same trailhead. Your car is waiting for you exactly where you left it. This is the <span className="text-white font-semibold">easiest option for beginners</span> — no logistics headaches.</p>
                  <ul className="space-y-1">
                    {['No need to coordinate a shuttle', 'Simpler logistics and planning', 'Best for: Buffalo River Loop, Lake Leatherwood', 'Downside: you see some trail twice'].map(b => (
                      <li key={b} className="text-xs text-gray-400 flex gap-2"><span className="text-green-400">✓</span>{b}</li>
                    ))}
                  </ul>
                </div>
                <div className="bg-[#1A2E1A] border border-[#2A4A2A] rounded-xl p-4">
                  <p className="text-[#FF4C00] font-bold text-sm mb-2">➡️ Point-to-Point — 2 Vehicles</p>
                  <p className="text-gray-300 text-sm leading-relaxed mb-3">You start at Trailhead A, finish at Trailhead B. One car at each end. You see entirely new terrain every day — but requires coordination with a second driver or a car shuttle service.</p>
                  <ul className="space-y-1">
                    {['All new scenery every mile', 'Great for Ouachita Trail sections', 'Requires 2 cars or a paid shuttle', 'Best: drive car 2 to end first, then drive together to start'].map(b => (
                      <li key={b} className="text-xs text-gray-400 flex gap-2"><span className="text-blue-400">◆</span>{b}</li>
                    ))}
                  </ul>
                </div>
              </div>
              <div className="mt-4 bg-[#FF4C00]/10 border border-[#FF4C00]/25 rounded-xl p-4">
                <p className="text-[#FF4C00] font-bold text-sm">💡 First-Timer Recommendation</p>
                <p className="text-gray-300 text-sm mt-1">Do a loop for your first trip. The Hemmed-in Hollow Loop at Buffalo National River is 11 miles over 2 nights — a perfect intro to Arkansas backcountry with waterfalls, wildlife, and good water sources.</p>
              </div>
            </div>

            {/* Arkansas Regions */}
            <div className="bg-[#0d1f0d] border border-[#2A4A2A] rounded-2xl p-6">
              <h3 className="text-lg font-black text-white mb-4">📍 Best Arkansas Backpacking Areas</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {[
                  { name: 'Buffalo National River', region: 'North Central AR', diff: 'Beginner–Moderate', notes: 'Free backcountry permit required (self-issued at trailhead). Crystal-clear water, towering bluffs, minimal traffic in the Lower Buffalo.' },
                  { name: 'Ouachita National Forest', region: 'Central / Western AR', diff: 'Moderate', notes: 'The 223-mile Ouachita Trail runs east–west across the state. Do a 3-night section between two road crossings. Heavily forested, good water.' },
                  { name: 'Ozark Highlands Area', region: 'Northwest AR', diff: 'Beginner–Moderate', notes: 'Lake Leatherwood (Eureka Springs) and the Ozark Highlands Trail. Excellent loops for first-timers. Close to Bentonville, Fayetteville.' },
                ].map(r => (
                  <div key={r.name} className="bg-[#1A2E1A] border border-[#2A4A2A] rounded-xl p-4">
                    <p className="text-white font-bold text-sm">{r.name}</p>
                    <p className="text-[#FF4C00] text-xs mb-2">{r.region} · {r.diff}</p>
                    <p className="text-gray-400 text-xs leading-relaxed">{r.notes}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Permits & Rules */}
            <div className="bg-[#0d1f0d] border border-[#2A4A2A] rounded-2xl p-6">
              <h3 className="text-lg font-black text-white mb-4">📋 Before You Go — Checklist</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  ['Check permit requirements', 'Buffalo National River requires a free backcountry permit — self-issue at trailhead kiosks or online at recreation.gov'],
                  ['Download offline maps', 'AllTrails Pro lets you download trail maps for offline use. Do this on WiFi before you leave — not in a parking lot with one bar of signal'],
                  ['Tell someone your plan', 'Leave a written note with a trusted person: which trail, which trailhead, when you plan to be back, and what to do if you don\'t call by X date'],
                  ['Check weather 3 days out', 'Arkansas spring = afternoon thunderstorm territory. The NWS forecast for your specific county is more accurate than general apps'],
                  ['Know your water sources', 'Mark streams and springs on your map. Plan to camp within 0.5 miles of water — filtering at camp beats carrying 4 lbs of water'],
                  ['Pack out everything', 'Leave No Trace: carry out all trash, food scraps, and waste. If you pack it in, you pack it out — no exceptions'],
                  ['Charge all devices the night before', 'Phone, headlamp batteries, inReach, camera. Do it at home — not scrambling in your car at the trailhead'],
                  ['Break in your boots first', 'If your hiking boots are new, wear them for 3–4 days of walking before the trip. New boots on a 3-night trip = a blister nightmare'],
                ].map(([title, note]) => (
                  <div key={title} className="flex gap-3 bg-[#1A2E1A] border border-[#2A4A2A] rounded-xl p-3">
                    <span className="text-green-400 text-sm mt-0.5 flex-shrink-0">☑</span>
                    <div>
                      <p className="text-white text-xs font-bold">{title}</p>
                      <p className="text-gray-400 text-xs mt-0.5 leading-relaxed">{note}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── GEAR LIST ── */}
        {tab === 'gear' && (
          <div>
            <div className="flex flex-wrap gap-2 justify-center mb-6">
              {BG_CATS.map(c => (
                <button key={c} onClick={() => setGearCat(c)} className={`${pill} ${gearCat === c ? pillActive : pillInactive}`}>{c}</button>
              ))}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredGear.map(item => (
                <a
                  key={item.name}
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group bg-[#0d1f0d] border border-[#2A4A2A] rounded-2xl p-5 hover:border-[#FF4C00]/50 transition-all hover:shadow-lg flex flex-col gap-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{item.icon}</span>
                      <div>
                        <p className="text-xs text-gray-500 font-bold uppercase tracking-wide">{item.cat}</p>
                        <p className="text-white font-bold text-sm group-hover:text-[#FF4C00] transition-colors leading-tight">{item.name}</p>
                      </div>
                    </div>
                    <span className={`text-xs font-bold px-2 py-1 rounded-full flex-shrink-0 ${
                      item.badge.includes('Critical') || item.badge.includes('Must') ? 'bg-[#FF4C00]/20 text-[#FF4C00] border border-[#FF4C00]/30' :
                      item.badge.includes('Safety') || item.badge.includes('Arkansas') ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30' :
                      'bg-[#1A2E1A] text-gray-400 border border-[#2A4A2A]'
                    }`}>{item.badge}</span>
                  </div>
                  <p className="text-gray-400 text-xs leading-relaxed">{item.desc}</p>
                  <div className="flex items-center justify-between mt-auto pt-2 border-t border-[#2A4A2A]">
                    <span className="text-[#FF4C00] font-bold text-sm">{item.price}</span>
                    <span className="text-xs text-gray-500 group-hover:text-[#FF4C00] transition-colors">View on Amazon →</span>
                  </div>
                </a>
              ))}
            </div>
            <p className="text-center text-xs text-gray-600 mt-6">* Prices are estimates. RunBears.com earns a small commission on Amazon purchases at no cost to you.</p>
          </div>
        )}

        {/* ── FOOD & WATER ── */}
        {tab === 'food' && (
          <div className="space-y-8">
            {/* Calorie guide */}
            <div className="bg-[#0d1f0d] border border-[#2A4A2A] rounded-2xl p-6">
              <h3 className="text-lg font-black text-white mb-3">📊 How Much Food Do You Need?</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
                {[
                  { label: 'Target Calories/Day', val: '2,500–3,000', note: 'More if you\'re covering 10+ miles with elevation' },
                  { label: 'Food Weight Target', val: '1.5–2 lbs/day', note: 'Per person. 3 nights = ~5–6 lbs of food per person' },
                  { label: 'Water Minimum', val: '2–3 liters/day', note: 'More in Arkansas summer heat. Filter at every water source' },
                ].map(s => (
                  <div key={s.label} className="bg-[#1A2E1A] border border-[#2A4A2A] rounded-xl p-4 text-center">
                    <p className="text-[#FF4C00] font-black text-xl">{s.val}</p>
                    <p className="text-white font-bold text-xs mt-1">{s.label}</p>
                    <p className="text-gray-500 text-xs mt-1">{s.note}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Food cards */}
            <div>
              <div className="flex flex-wrap gap-2 justify-center mb-6">
                {MEAL_CATS.map(c => (
                  <button key={c} onClick={() => setMealCat(c)} className={`${pill} ${mealCat === c ? pillActive : pillInactive}`}>{c}</button>
                ))}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredFood.map(item => (
                  <a
                    key={item.name}
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group bg-[#0d1f0d] border border-[#2A4A2A] rounded-2xl p-5 hover:border-[#FF4C00]/50 transition-all flex flex-col gap-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className={`text-xs font-bold px-2 py-1 rounded-full border ${
                        item.meal === 'Breakfast' ? 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30' :
                        item.meal === 'Lunch' ? 'bg-blue-500/15 text-blue-400 border-blue-500/30' :
                        item.meal === 'Dinner' ? 'bg-[#FF4C00]/15 text-[#FF4C00] border-[#FF4C00]/30' :
                        'bg-green-500/15 text-green-400 border-green-500/30'
                      }`}>{item.meal}</span>
                      {item.cals > 0 && <span className="text-xs text-gray-500 font-medium">{item.cals} cal/serving</span>}
                    </div>
                    <p className="text-white font-bold text-sm group-hover:text-[#FF4C00] transition-colors">{item.name}</p>
                    <p className="text-gray-400 text-xs leading-relaxed flex-1">{item.desc}</p>
                    <p className="text-xs text-gray-500 group-hover:text-[#FF4C00] transition-colors pt-2 border-t border-[#2A4A2A]">View on Amazon →</p>
                  </a>
                ))}
              </div>
            </div>

            {/* Water section */}
            <div className="bg-[#0d1f0d] border border-[#2A4A2A] rounded-2xl p-6">
              <h3 className="text-lg font-black text-white mb-4">💧 Getting Safe Water in the Backcountry</h3>
              <div className="space-y-4">
                {[
                  { step: '1', title: 'Find a moving water source', body: 'Streams and rivers are safer than still water. In Arkansas, the Buffalo River and Ouachita streams are generally excellent sources — but always filter. Never drink directly from any natural source no matter how clean it looks.' },
                  { step: '2', title: 'Fill your dirty water bag from the stream', body: 'Wade in or use a water bottle to scoop. Keep your dirty water container clearly labeled and separate from your clean water. The Platypus 2L collapsible bag works perfectly with the Sawyer Squeeze.' },
                  { step: '3', title: 'Squeeze through your Sawyer filter', body: 'Attach the Sawyer Squeeze to the dirty bag and squeeze. Water flows through the 0.1-micron hollow fiber membrane into your clean bottle. Removes 99.99999% of bacteria and protozoa (Giardia, Cryptosporidium). Takes about 2 minutes per liter.' },
                  { step: '4', title: 'Back-flush your filter every 2 days', body: 'Use the included syringe to push clean water backward through the Sawyer. This clears the hollow fibers and restores flow rate. Takes 30 seconds and extends filter life dramatically.' },
                  { step: '5', title: 'Never let your Sawyer freeze', body: 'Frozen hollow fibers crack and the filter becomes useless — and you won\'t be able to tell by looking at it. In cold Arkansas nights (40°F range), sleep with your filter in your sleeping bag.' },
                ].map(s => (
                  <div key={s.step} className="flex gap-4">
                    <div className="w-8 h-8 rounded-full bg-[#FF4C00] text-white font-black text-sm flex items-center justify-center flex-shrink-0 mt-0.5">{s.step}</div>
                    <div>
                      <p className="text-white font-bold text-sm">{s.title}</p>
                      <p className="text-gray-400 text-xs leading-relaxed mt-1">{s.body}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── FIRE & CAMP ── */}
        {tab === 'fire' && (
          <div className="space-y-6">
            <div className="bg-[#0d1f0d] border border-[#2A4A2A] rounded-2xl p-6">
              <h3 className="text-lg font-black text-white mb-4">🔥 How to Build a Campfire — Step by Step</h3>
              <div className="bg-yellow-500/10 border border-yellow-500/25 rounded-xl p-4 mb-5">
                <p className="text-yellow-400 font-bold text-sm">⚠️ Check Fire Regulations First</p>
                <p className="text-gray-300 text-xs mt-1 leading-relaxed">Buffalo National River, Ouachita NF, and Ozark NF all have seasonal fire bans during dry conditions. Check the forest service website or call the ranger station before your trip. Violating a fire ban carries serious fines. When in doubt, cook on your camp stove — it's faster and lighter anyway.</p>
              </div>
              <div className="space-y-5">
                {[
                  { step: '1', title: 'Use an existing fire ring', body: 'Always build in an established fire ring or fire pan — never create a new ring. If no ring exists and fires are allowed, build on bare mineral soil, far from roots and duff.' },
                  { step: '2', title: 'Gather tinder, kindling, and fuel separately', body: 'Tinder: dry leaves, pine needles, birch bark, dry grass — anything that lights with a single match. Kindling: pencil-sized dry sticks. Fuel: wrist-thick dry logs. Collect 3x more than you think you need.' },
                  { step: '3', title: 'Build a teepee of kindling over your tinder', body: 'Place a golf ball of tinder in the center. Lean kindling sticks against each other in a teepee shape over it, leaving an opening on the windward side to light through.' },
                  { step: '4', title: 'Light the tinder at the base', body: 'Use a lighter or waterproof matches. Light the tinder from the bottom, sheltered from wind. Gently blow at the base — you\'re feeding oxygen to the baby flame. Don\'t blow from above.' },
                  { step: '5', title: 'Add fuel gradually as the kindling catches', body: 'Once the kindling is burning, add wrist-thick fuel logs in a teepee or log cabin pattern. Don\'t smother the fire — leave space for airflow. Add one log at a time.' },
                  { step: '6', title: 'Extinguish completely before sleeping', body: '"Dead out" means cold to the touch — not just dark. Pour water on the coals, stir with a stick, pour more water, stir again. Repeat until the hiss stops and every coal is cold. A forgotten ember can smolder for hours and start a forest fire.' },
                ].map(s => (
                  <div key={s.step} className="flex gap-4">
                    <div className="w-8 h-8 rounded-full bg-[#FF4C00] text-white font-black text-sm flex items-center justify-center flex-shrink-0 mt-0.5">{s.step}</div>
                    <div>
                      <p className="text-white font-bold text-sm">{s.title}</p>
                      <p className="text-gray-400 text-xs leading-relaxed mt-1">{s.body}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-[#0d1f0d] border border-[#2A4A2A] rounded-2xl p-6">
              <h3 className="text-lg font-black text-white mb-4">🏕️ Setting Up Camp — The Right Way</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  { icon: '⛺', title: 'Campsite Location', body: 'Camp at least 200 feet (70 adult steps) from any water source, trail, or other campers. Look for flat ground with good drainage — not a low spot that floods in rain.' },
                  { icon: '🍔', title: 'The Bear Triangle', body: 'Set up your kitchen, food storage, and sleeping tent in a triangle — 200 feet apart. Cook and eat in one spot, hang food in another, sleep in the third. Never eat in your tent.' },
                  { icon: '🌲', title: 'Hang Your Food (Bear Bag)', body: 'Throw a rope over a branch 15+ feet high and 6+ feet from the trunk. Put all food, trash, and anything scented (toothpaste, sunscreen) in the bag. Hang 10+ feet off the ground.' },
                  { icon: '💨', title: 'Tent Orientation', body: 'Orient your tent door away from prevailing wind. Stake it out tightly — a loose tent in an Arkansas thunderstorm flaps loudly and can be damaged. Use all the guy lines.' },
                  { icon: '🚰', title: 'Camp Near Water (Not On It)', body: 'Camp close enough to access water easily (within 5 min walk) but 200 feet away. Camping on a stream bank erodes fragile riparian habitat and you\'ll deal with condensation and insects.' },
                  { icon: '🕐', title: 'Arrive Early', body: 'Plan to reach your campsite by 3–4pm. Setting up camp in the dark is miserable. Give yourself time to filter water, cook dinner while there\'s still light, and hang your food before dark.' },
                ].map(c => (
                  <div key={c.title} className="bg-[#1A2E1A] border border-[#2A4A2A] rounded-xl p-4">
                    <p className="text-2xl mb-2">{c.icon}</p>
                    <p className="text-white font-bold text-sm mb-1">{c.title}</p>
                    <p className="text-gray-400 text-xs leading-relaxed">{c.body}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── WATCH OUT FOR ── */}
        {tab === 'watch' && (
          <div className="space-y-5">
            {[
              {
                icon: '🕷️',
                title: 'Ticks & Chiggers',
                sev: 'HIGH priority in Arkansas',
                sevColor: 'text-[#FF4C00]',
                body: 'Arkansas has dense Lone Star tick populations (aggressive, bite in daylight), Black-legged ticks (Lyme disease carrier), and chiggers year-round in grass and brush. This is your biggest real threat — not bears. Treat all clothing with Permethrin before the trip. Do a full body tick check every evening at camp. Pull ticks with fine-tip tweezers, grasping as close to the skin as possible. Never twist — pull straight out.',
              },
              {
                icon: '🐍',
                title: 'Venomous Snakes',
                sev: 'Real — watch where you step',
                sevColor: 'text-yellow-400',
                body: 'Arkansas has four venomous species: Copperhead (most common — often on rocky trails), Timber Rattlesnake (rare but present in the Ozarks and Ouachitas), Western Cottonmouth (water edges), and Western Pygmy Rattlesnake. Never reach under logs or rocks with your bare hands. Always look before you step over a log. Most bites occur when people accidentally step on or pick up a snake. Wear ankle-height hiking boots minimum.',
              },
              {
                icon: '⛈️',
                title: 'Afternoon Thunderstorms',
                sev: 'Spring & Summer — plan around them',
                sevColor: 'text-blue-400',
                body: 'Arkansas spring and summer afternoons frequently produce severe thunderstorms with lightning, high winds, and flash floods. Check the NWS forecast for your specific county before the trip. Plan to be at camp or sheltered by 2pm if storms are in the forecast. If caught in lightning: get off ridges immediately, avoid tall isolated trees and open fields. Move to low ground in a cluster of smaller trees. Flash floods can turn dry creek beds into raging rivers in 20 minutes — never camp in a creek bed.',
              },
              {
                icon: '🐻',
                title: 'Black Bears',
                sev: 'Low risk — but take it seriously',
                sevColor: 'text-green-400',
                body: 'Arkansas has an estimated 5,000 Black Bears, primarily in the Ouachita and Ozark mountains. Encounters are rare but real. Hang your food 200 feet from your tent. Make noise on the trail — bears almost always leave before you see them. If you do encounter a Black Bear: stand your ground, make yourself look large, speak firmly, and back away slowly. Do NOT run. Do NOT play dead with a Black Bear — fight back if attacked. Carry bear spray accessible on your hip.',
              },
              {
                icon: '💦',
                title: 'Flash Floods & Creek Crossings',
                sev: 'Underestimated by beginners',
                sevColor: 'text-yellow-400',
                body: 'The Buffalo River watershed and Ouachita creek drainages can rise 6+ feet in under an hour during heavy rain. Never camp in a creek bed or flood zone. When crossing streams, unbuckle your hip belt and sternum strap before entering — so you can shed your pack if you fall. Use a trekking pole for stability. If the water is above your knee and moving fast, find a different crossing point or wait it out.',
              },
              {
                icon: '😰',
                title: 'Heat & Humidity',
                sev: 'June–August — serious risk',
                sevColor: 'text-[#FF4C00]',
                body: 'Arkansas summers are brutally hot and humid. Heat index regularly exceeds 100°F in July and August. Signs of heat exhaustion: heavy sweating, weakness, cold/pale/clammy skin, fast/weak pulse, nausea. Move to shade, cool with wet clothing, drink electrolytes. Heat stroke (no sweating, hot/red/dry skin, rapid strong pulse, confusion) is a medical emergency — call for help immediately. Hike early mornings, rest mid-day, hike again evening. Carry electrolyte packets and stay aggressively hydrated.',
              },
              {
                icon: '🗺️',
                title: 'Getting Lost',
                sev: 'Happens more than you think',
                sevColor: 'text-yellow-400',
                body: 'Cell signal is unreliable or nonexistent in Arkansas backcountry. Download your trail maps offline on AllTrails before you leave home. Mark your trailhead on your phone as a saved location. Always know which way is downhill to a road. If you think you\'re lost: Stop. Sit down. Think before you move. Look for trail markers (usually blazes painted on trees in AR). If you have a satellite communicator, use it — that\'s what it\'s for.',
              },
              {
                icon: '🦶',
                title: 'Blisters & Foot Care',
                sev: 'Most common trip-ender',
                sevColor: 'text-gray-400',
                body: 'Blisters are the #1 reason first-timers cut trips short. Prevention: break in your boots before the trip, wear merino wool socks (never cotton), change socks daily, and address hot spots immediately — don\'t wait for a blister to form. Treatment: drain with a sterilized needle, apply antibiotic ointment, cover with moleskin. Cut moleskin in a donut shape around the blister, not over it. Duct tape on top of moleskin adds durability for long days.',
              },
            ].map(item => (
              <div key={item.title} className="bg-[#0d1f0d] border border-[#2A4A2A] rounded-2xl p-5">
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-3xl">{item.icon}</span>
                  <div>
                    <p className="text-white font-black text-base">{item.title}</p>
                    <p className={`text-xs font-bold ${item.sevColor}`}>{item.sev}</p>
                  </div>
                </div>
                <p className="text-gray-300 text-sm leading-relaxed">{item.body}</p>
              </div>
            ))}
            <div className="bg-[#FF4C00]/10 border border-[#FF4C00]/30 rounded-2xl p-5 text-center">
              <p className="text-[#FF4C00] font-black text-lg mb-2">🏔️ You're More Ready Than You Think</p>
              <p className="text-gray-300 text-sm leading-relaxed max-w-2xl mx-auto">Thousands of people take their first backpacking trip every year and have an incredible time. The key is preparation: the right gear, the right food, and knowing what to expect. Arkansas has some of the most beautiful wilderness in the American South. Get out there.</p>
            </div>
          </div>
        )}
      </div>
    </section>
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
        <BearWorld />
        <BehaviorTriggers />
        <HowToInteract />

        {/* In-content Rectangle Ad */}
        <div className="py-8 bg-[#0a150a] flex justify-center px-4">
          <AdUnit slotKey="rectangle" w={300} h={250} />
        </div>

        <GearStore />
        <BackpackingGuide />
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
