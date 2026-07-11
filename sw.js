/* 사자성어 여행단 - 서비스 워커 (network-first) */
const CACHE = "idiom-quest-v80-station-path-passenger-scale";
const V18_SCENES=[
  "./assets/v18/backgrounds/interior/study-cafe-v18.png",
  "./assets/v18/backgrounds/exterior/street-v18.png","./assets/v18/backgrounds/exterior/station-v18.png","./assets/v18/backgrounds/exterior/gs25-v18.png","./assets/v18/backgrounds/exterior/school-v18.png",
  "./assets/v18/backgrounds/other/final/platform-v18.png","./assets/v18/backgrounds/other/final/subway-v18.png","./assets/v18/backgrounds/other/final/hell-v18.png",
  "./assets/v18/backgrounds/interior/gs25-interior-v18.png","./assets/v18/backgrounds/interior/dongsan-library5f-v18.png","./assets/v18/backgrounds/interior/haochi-restaurant-v18.png","./assets/v18/backgrounds/interior/sidae-academy-lobby-v18.png","./assets/v18/backgrounds/interior/sidae-classroom1-v18.png"
];
const PLAYER_IDS=["sunny","reader","artist","explorer","dongsan-boy","dongsan-girl"];
const PLAYER_IMAGES=PLAYER_IDS.flatMap(id=>[`./assets/v18/characters/players/${id}-idle-v18.png`,`./assets/v18/characters/players/${id}-wave-v18.png`]);
const NPC_IDS=["smith","mari","annie","steven","cleo","doctor","camp-manager","angela","kim-sooyoung","shin-dongyeop","jeon-gwangyong","kim-sowol","ryu-yongsu","gu-gyohun","kim-dongjun","lee-hanbin","passenger-woman","passenger-office","passenger-elder"];
const NPC_IMAGES=NPC_IDS.flatMap(id=>[`./assets/v18/characters/npcs/${id}-v18.png`,`./assets/v18/characters/npcs/${id}-action-v18.png`]);
const CREATURE_IMAGES=["shongshongi","millennium-cat","yeomra"].map(id=>`./assets/v18/characters/creatures/${id}-v18.png`);
const STATUE_IMAGES=["quiz-statue-dokkaebi","quiz-statue-owl","quiz-statue-tiger"].map(id=>`./assets/v18/characters/statues/${id}-v18.png`);
const V19_PLAYER_SEATED=PLAYER_IDS.flatMap(id=>[
  `./assets/v19/characters/seated/players/${id}-seated-v19.png`,
  `./assets/v19/characters/seated/players-back/${id}-back-seated-v19.png`
]);
const V19_STUDY_BACK=Array.from({length:5},(_,i)=>`./assets/v19/characters/seated/study-cafe/student-back-${String(i+1).padStart(2,"0")}-v19.png`);
const V19_POET_SEATED=["kim-sooyoung","shin-dongyeop","jeon-gwangyong","kim-sowol"].map(id=>`./assets/v19/characters/seated/poets/${id}-seated-v19.png`);
const V19_PASSENGER_SEATED=["passenger-woman","passenger-office","passenger-elder","smith"].map(id=>`./assets/v19/characters/seated/passengers/${id}-seated-v19.png`);
const V19_TEACHERS=["ryu-yongsu","gu-gyohun","kim-dongjun","lee-hanbin"].flatMap(id=>[
  `./assets/v19/characters/teachers/${id}-idle-v19.png`,
  `./assets/v19/characters/teachers/${id}-teach-v19.png`
]);
const V19_SPECIAL=[
  "./assets/v19/characters/special/idiom-grand-general-idle-v19.png",
  "./assets/v19/characters/special/idiom-grand-general-command-v19.png",
  "./assets/v19/characters/special/quiz-statue-dokkaebi-v19.png",
  "./assets/v19/characters/special/quiz-statue-owl-v19.png",
  "./assets/v19/characters/special/quiz-statue-tiger-v19.png"
];
const CAPTAIN_PIXEL_SCENES=Array.from({length:16},(_,i)=>`./captain-scenes-pixel/captain-scene-${String(i+1).padStart(2,"0")}-v1.png`);
const V20_ASSETS=["./assets/v20/backgrounds/study-cafe-chairless-v20.png","./assets/v20/backgrounds/street-v20.png","./assets/v20/backgrounds/haochi-chairless-v20.png","./assets/v20/furniture/study-chair-layers-v20.png","./assets/v20/characters/players/dongsan-boy-walk-v20.png","./assets/v20/characters/players/dongsan-girl-walk-v20.png","./assets/v20/characters/players/dongsan-boy-emotions-v20.png","./assets/v20/characters/champions/champion-boy-v20.png","./assets/v20/characters/champions/champion-girl-v20.png","./assets/v20/characters/npcs/smith-idle-talk-v20.png","./assets/v20/characters/npcs/smith-chair-seated-v20.png","./assets/v20/characters/npcs/mari-chair-seated-v20.png","./assets/v20/characters/npcs/annie-chair-seated-v20.png","./assets/v20/characters/npcs/steven-chair-seated-v20.png","./assets/v20/characters/authors/kim-sooyoung-idle-talk-v20.png","./assets/v20/characters/authors/shin-dongyeop-idle-talk-v20.png","./assets/v20/characters/authors/jo-sehui-idle-talk-v20.png","./assets/v20/characters/authors/jeon-gwangyong-idle-talk-v20.png","./assets/v20/characters/authors/kim-sowol-idle-talk-v20.png"];
const V21_ASSETS=["./assets/v21/backgrounds/sidae-academy-lobby-v21.png","./assets/v21/backgrounds/sidae-classroom-v21.png","./assets/v21/characters/npcs/angela-idle-talk-v21.png","./assets/v21/characters/teachers/ryu-yongsu-idle-teach-v21.png","./assets/v21/characters/teachers/gu-gyohun-idle-teach-v21.png","./assets/v21/characters/teachers/kim-dongjun-idle-teach-v21.png","./assets/v21/characters/teachers/lee-hanbin-idle-teach-v21.png"];
const V22_ASSETS=["./assets/v22/backgrounds/sidae-academy-lobby-v22.png"];
const V23_ASSETS=["./assets/v23/backgrounds/sidae-academy-lobby-v23.png"];
const V24_ASSETS=["./assets/v24/characters/players/dongsan-sleep-at-desk-v24.png"];
const V25_ASSETS=["./assets/v25/backgrounds/hanja-realm-v25.png","./assets/v25/characters/statues/quiz-statue-dokkaebi-v25.png","./assets/v25/characters/statues/quiz-statue-owl-v25.png","./assets/v25/characters/statues/quiz-statue-tiger-v25.png"];
const V26_ASSETS=["./assets/v26/characters/yeomra/yeomra-idle-v26.png","./assets/v26/characters/yeomra/yeomra-command-v26.png"];
const V27_ASSETS=[
  "./assets/v27/backgrounds/station-v27.png","./assets/v27/backgrounds/platform-v27.png","./assets/v27/backgrounds/subway-v27.png",
  ...["woman","office","elder","student"].flatMap(id=>[
    `./assets/v27/characters/passengers/passenger-${id}-standing-v27.png`,
    `./assets/v27/characters/passengers/passenger-${id}-seated-v27.png`
  ])
];
const V28_ASSETS=[
  "./assets/v28/backgrounds/convenience-exterior-v28.png","./assets/v28/backgrounds/convenience-interior-v28.png",
  "./assets/v28/characters/cleo-v28.png","./assets/v28/characters/millennium-cat-v28.png"
];
const V29_ASSETS=["./assets/v29/backgrounds/station-wayfinding-v29.png"];
const CORE = ["./","./index.html","./manifest.json","./icon-192.png","./icon-512.png","./captain-cast-v1.png","./assets/v18/characters/avatar-lineup-v18.png",...V18_SCENES,...PLAYER_IMAGES,...NPC_IMAGES,...CREATURE_IMAGES,...STATUE_IMAGES,...V19_PLAYER_SEATED,...V19_STUDY_BACK,...V19_POET_SEATED,...V19_PASSENGER_SEATED,...V19_TEACHERS,...V19_SPECIAL,...V20_ASSETS,...V21_ASSETS,...V22_ASSETS,...V23_ASSETS,...V24_ASSETS,...V25_ASSETS,...V26_ASSETS,...V27_ASSETS,...V28_ASSETS,...V29_ASSETS,...CAPTAIN_PIXEL_SCENES];
self.addEventListener("install", e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(CORE)).then(() => self.skipWaiting())); });
self.addEventListener("activate", e => { e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener("fetch", e => {
  if (e.request.method !== "GET") return;
  if (e.request.url.includes("script.google.com") || e.request.url.includes("googleusercontent.com")) return;
  e.respondWith(fetch(e.request).then(res => { if (res && res.status === 200 && (res.type === "basic" || res.type === "cors")) { const clone = res.clone(); caches.open(CACHE).then(c => c.put(e.request, clone)); } return res; }).catch(() => caches.match(e.request)));
});
