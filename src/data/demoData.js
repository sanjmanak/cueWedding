export const eventOptions = [
  { id: 'haldi', label: 'Haldi', emoji: '🟡' },
  { id: 'mehndi', label: 'Mehndi', emoji: '🌿' },
  { id: 'sangeet', label: 'Sangeet', emoji: '🎶' },
  { id: 'garba', label: 'Garba', emoji: '💃' },
  { id: 'ceremony', label: 'Ceremony', emoji: '🔥' },
  { id: 'reception', label: 'Reception', emoji: '🥂' },
  { id: 'afterparty', label: 'After Party', emoji: '🎉' },
];

export const vibeWords = [
  'Romantic', 'High Energy', 'Traditional', 'Modern',
  'Elegant', 'Party', 'Chill', 'Emotional', 'Fusion',
];

export const bollywoodEras = [
  'Classic 90s', '2000s', 'Current', 'Mix of Everything',
];

export const westernMusicOptions = [
  'Yes, lots!', 'Some sprinkled in', 'Minimal', 'None',
];

export const howMetOptions = [
  'Dating App', 'Through Friends', 'College', 'Work', 'Family Introduction', 'Other',
];

export const datingAppOptions = [
  'Dil Mil', 'Hinge', 'Bumble', 'Tinder', 'Coffee Meets Bagel', 'Other',
];

export const guestCountOptions = [
  '<100', '100-200', '200-300', '300-500', '500+',
];

export const ceremonyTraditions = [
  { id: 'baraat', label: 'Baraat (Groom\'s Procession)' },
  { id: 'milni', label: 'Milni (Family Greeting)' },
  { id: 'ganesh-puja', label: 'Ganesh Puja' },
  { id: 'kanyadaan', label: 'Kanyadaan' },
  { id: 'jai-mala', label: 'Jai Mala (Garland Exchange)' },
  { id: 'pheras', label: 'Pheras (Sacred Rounds)' },
  { id: 'sindoor', label: 'Sindoor & Mangalsutra' },
  { id: 'vidai', label: 'Vidai (Bridal Farewell)' },
];

export const timelineBlockTypes = [
  { id: 'performance', label: 'Performance', icon: '🎤', color: 'bg-purple-100 text-purple-800' },
  { id: 'speech', label: 'Speech', icon: '🎙️', color: 'bg-blue-100 text-blue-800' },
  { id: 'tradition', label: 'Tradition', icon: '🪔', color: 'bg-orange-100 text-orange-800' },
  { id: 'dance-set', label: 'Dance Set', icon: '💃', color: 'bg-pink-100 text-pink-800' },
  { id: 'dinner', label: 'Dinner', icon: '🍽️', color: 'bg-green-100 text-green-800' },
  { id: 'break', label: 'Break', icon: '⏸️', color: 'bg-stone-100 text-stone-800' },
];

export const equipmentOptions = [
  'Subwoofers', 'Wireless Microphones', 'Uplighting', 'Intelligent Lighting',
  'Fog Machine', 'Cold Sparklers', 'Monogram Projection', 'Photo Booth Lighting',
  'Dance Floor Lighting', 'Pin Spots', 'Moving Heads', 'LED Wall',
];

export const moodOptions = {
  haldi: ['Fun & Playful', 'Traditional & Warm', 'Chill & Acoustic', 'High Energy'],
  mehndi: ['Romantic & Soft', 'Bollywood Vibes', 'Chill Lounge', 'Upbeat & Fun'],
  sangeet: ['Full Party Mode', 'Bollywood Hits', 'Mix of Everything', 'Performance-Focused'],
  garba: ['Traditional Garba', 'Modern Garba Mix', 'High Energy Throughout', 'Build Up Gradually'],
  ceremony: ['Serene & Spiritual', 'Soft Instrumental', 'Traditional Mantras', 'Light Background'],
  reception: ['Elegant Dinner → Party', 'Party All Night', 'Classy Throughout', 'Bollywood to Western Mix'],
  afterparty: ['Club Vibes', 'Throwback Hits', 'Hip Hop & EDM', 'Bollywood Remixes'],
};

export const templateOptions = {
  sangeet: [
    { id: 'traditional-gujarati', label: 'Traditional Gujarati Sangeet', description: 'Garba, performances, family dances' },
    { id: 'modern-performances', label: 'Modern Sangeet with Performances', description: 'Choreographed numbers, speeches, and open floor' },
    { id: 'scratch', label: 'Start from Scratch', description: 'Build your own custom timeline' },
  ],
  reception: [
    { id: 'classic-reception', label: 'Classic Indian Reception', description: 'Grand entrance, dinner, toasts, first dance, party' },
    { id: 'cocktail-style', label: 'Cocktail Style', description: 'Mingling, short program, dance floor' },
    { id: 'scratch', label: 'Start from Scratch', description: 'Build your own custom timeline' },
  ],
  default: [
    { id: 'guided', label: 'Guided Template', description: 'Pre-built timeline you can customize' },
    { id: 'scratch', label: 'Start from Scratch', description: 'Build your own custom timeline' },
  ],
};

export const defaultDemoData = {
  // Phase 1: Your Story
  brideName: 'Alexsa',
  groomName: 'Kishan',
  weddingDate: '2026-06-20',
  howMet: 'Dating App',
  datingApp: 'Dil Mil',
  meetDetail: 'He sent a message about my love for biryani, and the rest is history!',
  selectedEvents: ['mehndi', 'sangeet', 'ceremony', 'reception'],
  eventVenues: {
    mehndi: { name: 'The Grand Estate', address: '123 Garden Lane, Houston, TX', setting: 'outdoor' },
    sangeet: { name: 'Crystal Ballroom', address: '456 Main St, Houston, TX', setting: 'indoor' },
    ceremony: { name: 'Lakeside Pavilion', address: '789 Lake Dr, Houston, TX', setting: 'both' },
    reception: { name: 'Crystal Ballroom', address: '456 Main St, Houston, TX', setting: 'indoor', linkedTo: 'sangeet' },
  },
  eventGuestCounts: {
    mehndi: '100-200',
    sangeet: '200-300',
    ceremony: '200-300',
    reception: '300-500',
  },
  vibeWords: ['Elegant', 'High Energy', 'Fusion'],
  bollywoodEra: 'Mix of Everything',
  westernMusic: 'Some sprinkled in',

  // Phase 2: Your People
  brideParents: { father: 'Raj Patel', mother: 'Priya Patel' },
  groomParents: { father: 'Vikram Shah', mother: 'Anita Shah' },
  siblings: [
    { id: '1', name: 'Nisha Patel', role: 'Maid of Honor', side: 'bride', pronunciation: false },
    { id: '2', name: 'Arjun Shah', role: 'Best Man', side: 'groom', pronunciation: true },
  ],
  keyRelatives: [
    { id: '1', name: 'Dadi Shah', role: 'Grandmother', side: 'groom', pronunciation: true },
    { id: '2', name: 'Meera Auntie', role: 'Favorite Aunt', side: 'bride', pronunciation: false },
  ],
  otherVIPs: [
    { id: '1', name: 'Rohan Mehta', role: 'MC / Best Friend', side: 'groom', pronunciation: false },
  ],
  pronunciations: {
    'Arjun Shah': 'AR-jun Shah',
    'Dadi Shah': 'DAH-dee Shah',
  },
  announcementStyles: {
    'Raj Patel': 'formal',
    'Priya Patel': 'formal',
    'Vikram Shah': 'formal',
    'Anita Shah': 'formal',
    'Nisha Patel': 'first',
    'Arjun Shah': 'first',
  },

  // Phase 3: Your Soundtrack
  mustPlaySongs: [
    { id: '1', trackId: '3Wrjm47oTz2sjIgck11l5e', name: 'Chaiyya Chaiyya', artist: 'Sukhwinder Singh', albumArt: '', event: 'sangeet' },
    { id: '2', trackId: '0habROhZbOMfS1LYrcdlnr', name: 'London Thumakda', artist: 'Labh Janjua', albumArt: '', event: 'reception' },
  ],
  doNotPlaySongs: [
    { id: '1', trackId: '', name: 'Cheap Thrills', artist: 'Sia', albumArt: '' },
  ],
  eventVibes: {
    mehndi: 'Romantic & Soft',
    sangeet: 'Full Party Mode',
    ceremony: 'Serene & Spiritual',
    reception: 'Elegant Dinner → Party',
  },
  specialMoments: {
    firstDance: { type: 'song', name: 'Perfect', artist: 'Ed Sheeran', trackId: '0tgVpDi06FyKpA1z0VMD4v' },
    fatherDaughter: { type: 'song', name: 'Mere Papa', artist: 'Tulsi Kumar', trackId: '' },
    motherSon: { type: 'skip' },
    coupleEntrance: { type: 'surprise' },
    lastSong: { type: 'dj-choice' },
  },
  customMixes: [],
  playlistUrl: '',

  // Phase 4: Your Program
  eventTemplates: {
    sangeet: 'modern-performances',
    reception: 'classic-reception',
  },
  timelines: {
    sangeet: [
      { id: '1', type: 'dance-set', label: 'Guests Arrive - Background Music', duration: 30, details: '' },
      { id: '2', type: 'speech', label: 'Welcome Speech', duration: 5, details: 'MC Rohan Mehta' },
      { id: '3', type: 'performance', label: 'Bride\'s Side Performance', duration: 5, details: '' },
      { id: '4', type: 'performance', label: 'Groom\'s Side Performance', duration: 5, details: '' },
      { id: '5', type: 'performance', label: 'Couple Performance', duration: 7, details: '' },
      { id: '6', type: 'dinner', label: 'Dinner', duration: 45, details: '' },
      { id: '7', type: 'dance-set', label: 'Open Dance Floor', duration: 60, details: '' },
    ],
    reception: [
      { id: '1', type: 'dance-set', label: 'Cocktail Hour', duration: 60, details: '' },
      { id: '2', type: 'tradition', label: 'Grand Entrance', duration: 10, details: '' },
      { id: '3', type: 'speech', label: 'Father of the Bride Toast', duration: 5, details: '' },
      { id: '4', type: 'speech', label: 'Best Man Toast', duration: 5, details: '' },
      { id: '5', type: 'dinner', label: 'Dinner Service', duration: 45, details: '' },
      { id: '6', type: 'tradition', label: 'First Dance', duration: 5, details: '' },
      { id: '7', type: 'tradition', label: 'Father-Daughter Dance', duration: 4, details: '' },
      { id: '8', type: 'dance-set', label: 'Open Dance Floor', duration: 90, details: '' },
    ],
  },
  performances: [
    { id: '1', groupName: 'Bride Squad', songName: 'Nagada Sang Dhol', duration: 5, event: 'sangeet' },
    { id: '2', groupName: 'Groom Squad', songName: 'Gallan Goodiyaan', duration: 5, event: 'sangeet' },
    { id: '3', groupName: 'Alexsa & Kishan', songName: 'Tum Hi Ho / Perfect Mashup', duration: 7, event: 'sangeet' },
  ],
  speeches: [
    { id: '1', speaker: 'Rohan Mehta', relationship: 'Best Man', afterMoment: 'Grand Entrance', event: 'reception' },
    { id: '2', speaker: 'Raj Patel', relationship: 'Father of the Bride', afterMoment: 'Grand Entrance', event: 'reception' },
  ],
  ceremonyTraditions: ['baraat', 'jai-mala', 'pheras', 'vidai'],
  ceremonySongs: {},

  // Phase 5: Final Details
  vendors: {
    planner: { name: 'Priya Events', phone: '(713) 555-0100', email: 'priya@events.com' },
    photographer: { name: 'Ravi Photography', phone: '(713) 555-0200', email: 'ravi@photo.com' },
    videographer: { name: 'Cinematic Films', phone: '(713) 555-0300', email: 'info@cinematic.com' },
    decorator: { name: 'Bloom & Drape', phone: '(713) 555-0400', email: 'hello@bloom.com' },
  },
  lightingColor: '#d97706',
  equipment: ['Subwoofers', 'Wireless Microphones', 'Uplighting', 'Cold Sparklers'],
  photoBooth: true,
  surprises: 'We want a special mashup for our couple dance that transitions from a slow song into a high-energy Bollywood number!',
  additionalNotes: 'Please coordinate with our videographer for any announcements. Also, Dadi (grandmother) will need a chair near the dance floor.',

  // Phase 6: Sign-off
  confirmed: false,
  signatureName: '',
  signatureDate: '',
};
