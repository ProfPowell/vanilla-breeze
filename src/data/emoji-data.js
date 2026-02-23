/**
 * emoji-data: Curated emoji dataset for Vanilla Breeze
 *
 * ~200–250 commonly used emoji organized by group.
 * Shared by emoji-init.js (shortcode replacement) and emoji-picker (browsing).
 *
 * @example
 * import { resolveEmoji, searchEmoji, getByGroup } from './emoji-data.js';
 * resolveEmoji('smile')       // { shortcode: 'smile', emoji: '😄', ... }
 * searchEmoji('rock')         // [{ shortcode: 'rocket', ... }, ...]
 * getByGroup('smileys')       // [...]
 */

const ENTRIES = [
  // ── Smileys (~40) ──────────────────────────────────────────────────
  { shortcode: 'smile', emoji: '😄', name: 'Smiling Face with Open Mouth', keywords: ['happy', 'joy', 'laugh'], group: 'smileys' },
  { shortcode: 'grinning', emoji: '😀', name: 'Grinning Face', keywords: ['happy', 'smile'], group: 'smileys' },
  { shortcode: 'laughing', emoji: '😆', name: 'Grinning Squinting Face', keywords: ['happy', 'laugh'], group: 'smileys' },
  { shortcode: 'sweat_smile', emoji: '😅', name: 'Grinning Face with Sweat', keywords: ['hot', 'relief'], group: 'smileys' },
  { shortcode: 'rofl', emoji: '🤣', name: 'Rolling on the Floor Laughing', keywords: ['lol', 'funny'], group: 'smileys' },
  { shortcode: 'joy', emoji: '😂', name: 'Face with Tears of Joy', keywords: ['happy', 'cry', 'laugh'], group: 'smileys' },
  { shortcode: 'slightly_smiling_face', emoji: '🙂', name: 'Slightly Smiling Face', keywords: ['smile'], group: 'smileys' },
  { shortcode: 'upside_down_face', emoji: '🙃', name: 'Upside-Down Face', keywords: ['sarcasm', 'silly'], group: 'smileys' },
  { shortcode: 'wink', emoji: '😉', name: 'Winking Face', keywords: ['flirt', 'joke'], group: 'smileys' },
  { shortcode: 'blush', emoji: '😊', name: 'Smiling Face with Smiling Eyes', keywords: ['happy', 'shy'], group: 'smileys' },
  { shortcode: 'innocent', emoji: '😇', name: 'Smiling Face with Halo', keywords: ['angel', 'good'], group: 'smileys' },
  { shortcode: 'heart_eyes', emoji: '😍', name: 'Smiling Face with Heart-Eyes', keywords: ['love', 'crush'], group: 'smileys' },
  { shortcode: 'star_struck', emoji: '🤩', name: 'Star-Struck', keywords: ['wow', 'amazing'], group: 'smileys' },
  { shortcode: 'kissing_heart', emoji: '😘', name: 'Face Blowing a Kiss', keywords: ['love', 'kiss'], group: 'smileys' },
  { shortcode: 'yum', emoji: '😋', name: 'Face Savoring Food', keywords: ['delicious', 'tasty'], group: 'smileys' },
  { shortcode: 'stuck_out_tongue', emoji: '😛', name: 'Face with Tongue', keywords: ['playful', 'silly'], group: 'smileys' },
  { shortcode: 'stuck_out_tongue_winking_eye', emoji: '😜', name: 'Winking Face with Tongue', keywords: ['silly', 'playful'], group: 'smileys' },
  { shortcode: 'zany_face', emoji: '🤪', name: 'Zany Face', keywords: ['crazy', 'wild'], group: 'smileys' },
  { shortcode: 'hugs', emoji: '🤗', name: 'Hugging Face', keywords: ['hug', 'warm'], group: 'smileys' },
  { shortcode: 'thinking', emoji: '🤔', name: 'Thinking Face', keywords: ['hmm', 'consider'], group: 'smileys' },
  { shortcode: 'shushing_face', emoji: '🤫', name: 'Shushing Face', keywords: ['quiet', 'secret'], group: 'smileys' },
  { shortcode: 'smirk', emoji: '😏', name: 'Smirking Face', keywords: ['sly', 'suggestive'], group: 'smileys' },
  { shortcode: 'unamused', emoji: '😒', name: 'Unamused Face', keywords: ['bored', 'unimpressed'], group: 'smileys' },
  { shortcode: 'roll_eyes', emoji: '🙄', name: 'Face with Rolling Eyes', keywords: ['annoyed', 'whatever'], group: 'smileys' },
  { shortcode: 'grimacing', emoji: '😬', name: 'Grimacing Face', keywords: ['awkward', 'nervous'], group: 'smileys' },
  { shortcode: 'relieved', emoji: '😌', name: 'Relieved Face', keywords: ['calm', 'peaceful'], group: 'smileys' },
  { shortcode: 'pensive', emoji: '😔', name: 'Pensive Face', keywords: ['sad', 'thoughtful'], group: 'smileys' },
  { shortcode: 'sleepy', emoji: '😪', name: 'Sleepy Face', keywords: ['tired', 'sleep'], group: 'smileys' },
  { shortcode: 'sleeping', emoji: '😴', name: 'Sleeping Face', keywords: ['zzz', 'sleep'], group: 'smileys' },
  { shortcode: 'mask', emoji: '😷', name: 'Face with Medical Mask', keywords: ['sick', 'health'], group: 'smileys' },
  { shortcode: 'nerd_face', emoji: '🤓', name: 'Nerd Face', keywords: ['geek', 'smart'], group: 'smileys' },
  { shortcode: 'sunglasses', emoji: '😎', name: 'Smiling Face with Sunglasses', keywords: ['cool', 'chill'], group: 'smileys' },
  { shortcode: 'confused', emoji: '😕', name: 'Confused Face', keywords: ['puzzled', 'unsure'], group: 'smileys' },
  { shortcode: 'worried', emoji: '😟', name: 'Worried Face', keywords: ['anxious', 'concern'], group: 'smileys' },
  { shortcode: 'cry', emoji: '😢', name: 'Crying Face', keywords: ['sad', 'tear'], group: 'smileys' },
  { shortcode: 'sob', emoji: '😭', name: 'Loudly Crying Face', keywords: ['sad', 'cry'], group: 'smileys' },
  { shortcode: 'angry', emoji: '😠', name: 'Angry Face', keywords: ['mad', 'annoyed'], group: 'smileys' },
  { shortcode: 'rage', emoji: '🤬', name: 'Face with Symbols on Mouth', keywords: ['angry', 'swear'], group: 'smileys' },
  { shortcode: 'exploding_head', emoji: '🤯', name: 'Exploding Head', keywords: ['mind blown', 'shocked'], group: 'smileys' },
  { shortcode: 'flushed', emoji: '😳', name: 'Flushed Face', keywords: ['embarrassed', 'shocked'], group: 'smileys' },
  { shortcode: 'scream', emoji: '😱', name: 'Face Screaming in Fear', keywords: ['scared', 'horror'], group: 'smileys' },
  { shortcode: 'skull', emoji: '💀', name: 'Skull', keywords: ['dead', 'death'], group: 'smileys' },
  { shortcode: 'clown_face', emoji: '🤡', name: 'Clown Face', keywords: ['joke', 'funny'], group: 'smileys' },
  { shortcode: 'ghost', emoji: '👻', name: 'Ghost', keywords: ['halloween', 'spooky'], group: 'smileys' },

  // ── People (~25) ───────────────────────────────────────────────────
  { shortcode: 'wave', emoji: '👋', name: 'Waving Hand', keywords: ['hello', 'goodbye'], group: 'people' },
  { shortcode: 'raised_hand', emoji: '✋', name: 'Raised Hand', keywords: ['stop', 'high five'], group: 'people' },
  { shortcode: 'ok_hand', emoji: '👌', name: 'OK Hand', keywords: ['perfect', 'nice'], group: 'people' },
  { shortcode: 'thumbsup', emoji: '👍', name: 'Thumbs Up', keywords: ['approve', 'good', 'yes'], group: 'people' },
  { shortcode: 'thumbsdown', emoji: '👎', name: 'Thumbs Down', keywords: ['disapprove', 'bad', 'no'], group: 'people' },
  { shortcode: 'clap', emoji: '👏', name: 'Clapping Hands', keywords: ['applause', 'bravo'], group: 'people' },
  { shortcode: 'raised_hands', emoji: '🙌', name: 'Raising Hands', keywords: ['celebration', 'hooray'], group: 'people' },
  { shortcode: 'pray', emoji: '🙏', name: 'Folded Hands', keywords: ['thanks', 'please', 'hope'], group: 'people' },
  { shortcode: 'handshake', emoji: '🤝', name: 'Handshake', keywords: ['deal', 'agreement'], group: 'people' },
  { shortcode: 'point_up', emoji: '☝️', name: 'Index Pointing Up', keywords: ['attention', 'important'], group: 'people' },
  { shortcode: 'point_right', emoji: '👉', name: 'Backhand Index Pointing Right', keywords: ['direction', 'this'], group: 'people' },
  { shortcode: 'point_left', emoji: '👈', name: 'Backhand Index Pointing Left', keywords: ['direction', 'that'], group: 'people' },
  { shortcode: 'point_down', emoji: '👇', name: 'Backhand Index Pointing Down', keywords: ['direction', 'below'], group: 'people' },
  { shortcode: 'v', emoji: '✌️', name: 'Victory Hand', keywords: ['peace', 'two'], group: 'people' },
  { shortcode: 'crossed_fingers', emoji: '🤞', name: 'Crossed Fingers', keywords: ['luck', 'hope'], group: 'people' },
  { shortcode: 'muscle', emoji: '💪', name: 'Flexed Biceps', keywords: ['strong', 'power'], group: 'people' },
  { shortcode: 'writing_hand', emoji: '✍️', name: 'Writing Hand', keywords: ['write', 'note'], group: 'people' },
  { shortcode: 'eyes', emoji: '👀', name: 'Eyes', keywords: ['look', 'see', 'watch'], group: 'people' },
  { shortcode: 'brain', emoji: '🧠', name: 'Brain', keywords: ['smart', 'think', 'mind'], group: 'people' },
  { shortcode: 'speaking_head', emoji: '🗣️', name: 'Speaking Head', keywords: ['talk', 'announce'], group: 'people' },
  { shortcode: 'baby', emoji: '👶', name: 'Baby', keywords: ['child', 'newborn'], group: 'people' },
  { shortcode: 'person_shrugging', emoji: '🤷', name: 'Person Shrugging', keywords: ['dunno', 'whatever'], group: 'people' },
  { shortcode: 'person_facepalming', emoji: '🤦', name: 'Person Facepalming', keywords: ['frustration', 'disbelief'], group: 'people' },
  { shortcode: 'person_raising_hand', emoji: '🙋', name: 'Person Raising Hand', keywords: ['question', 'volunteer'], group: 'people' },
  { shortcode: 'ninja', emoji: '🥷', name: 'Ninja', keywords: ['stealth', 'hidden'], group: 'people' },

  // ── Animals (~20) ──────────────────────────────────────────────────
  { shortcode: 'dog', emoji: '🐶', name: 'Dog Face', keywords: ['puppy', 'pet'], group: 'animals' },
  { shortcode: 'cat', emoji: '🐱', name: 'Cat Face', keywords: ['kitten', 'pet'], group: 'animals' },
  { shortcode: 'mouse', emoji: '🐭', name: 'Mouse Face', keywords: ['rodent'], group: 'animals' },
  { shortcode: 'rabbit', emoji: '🐰', name: 'Rabbit Face', keywords: ['bunny', 'easter'], group: 'animals' },
  { shortcode: 'fox', emoji: '🦊', name: 'Fox', keywords: ['clever', 'sly'], group: 'animals' },
  { shortcode: 'bear', emoji: '🐻', name: 'Bear', keywords: ['teddy', 'nature'], group: 'animals' },
  { shortcode: 'unicorn', emoji: '🦄', name: 'Unicorn', keywords: ['magic', 'fantasy'], group: 'animals' },
  { shortcode: 'bee', emoji: '🐝', name: 'Honeybee', keywords: ['honey', 'buzz'], group: 'animals' },
  { shortcode: 'butterfly', emoji: '🦋', name: 'Butterfly', keywords: ['pretty', 'nature'], group: 'animals' },
  { shortcode: 'turtle', emoji: '🐢', name: 'Turtle', keywords: ['slow', 'shell'], group: 'animals' },
  { shortcode: 'snake', emoji: '🐍', name: 'Snake', keywords: ['reptile'], group: 'animals' },
  { shortcode: 'whale', emoji: '🐳', name: 'Spouting Whale', keywords: ['ocean', 'sea'], group: 'animals' },
  { shortcode: 'dolphin', emoji: '🐬', name: 'Dolphin', keywords: ['ocean', 'smart'], group: 'animals' },
  { shortcode: 'eagle', emoji: '🦅', name: 'Eagle', keywords: ['bird', 'freedom'], group: 'animals' },
  { shortcode: 'owl', emoji: '🦉', name: 'Owl', keywords: ['wise', 'night'], group: 'animals' },
  { shortcode: 'penguin', emoji: '🐧', name: 'Penguin', keywords: ['cold', 'linux'], group: 'animals' },
  { shortcode: 'octopus', emoji: '🐙', name: 'Octopus', keywords: ['ocean', 'tentacle'], group: 'animals' },
  { shortcode: 'seedling', emoji: '🌱', name: 'Seedling', keywords: ['plant', 'grow'], group: 'animals' },
  { shortcode: 'evergreen_tree', emoji: '🌲', name: 'Evergreen Tree', keywords: ['nature', 'pine'], group: 'animals' },
  { shortcode: 'sunflower', emoji: '🌻', name: 'Sunflower', keywords: ['flower', 'yellow'], group: 'animals' },
  { shortcode: 'rose', emoji: '🌹', name: 'Rose', keywords: ['flower', 'love'], group: 'animals' },

  // ── Food (~20) ─────────────────────────────────────────────────────
  { shortcode: 'apple', emoji: '🍎', name: 'Red Apple', keywords: ['fruit', 'healthy'], group: 'food' },
  { shortcode: 'banana', emoji: '🍌', name: 'Banana', keywords: ['fruit', 'yellow'], group: 'food' },
  { shortcode: 'grapes', emoji: '🍇', name: 'Grapes', keywords: ['fruit', 'wine'], group: 'food' },
  { shortcode: 'watermelon', emoji: '🍉', name: 'Watermelon', keywords: ['fruit', 'summer'], group: 'food' },
  { shortcode: 'avocado', emoji: '🥑', name: 'Avocado', keywords: ['guacamole', 'healthy'], group: 'food' },
  { shortcode: 'pizza', emoji: '🍕', name: 'Pizza', keywords: ['food', 'italian'], group: 'food' },
  { shortcode: 'hamburger', emoji: '🍔', name: 'Hamburger', keywords: ['burger', 'fast food'], group: 'food' },
  { shortcode: 'taco', emoji: '🌮', name: 'Taco', keywords: ['mexican', 'food'], group: 'food' },
  { shortcode: 'sushi', emoji: '🍣', name: 'Sushi', keywords: ['japanese', 'fish'], group: 'food' },
  { shortcode: 'cookie', emoji: '🍪', name: 'Cookie', keywords: ['sweet', 'biscuit'], group: 'food' },
  { shortcode: 'cake', emoji: '🎂', name: 'Birthday Cake', keywords: ['birthday', 'celebration'], group: 'food' },
  { shortcode: 'ice_cream', emoji: '🍦', name: 'Soft Ice Cream', keywords: ['dessert', 'cold'], group: 'food' },
  { shortcode: 'chocolate_bar', emoji: '🍫', name: 'Chocolate Bar', keywords: ['sweet', 'candy'], group: 'food' },
  { shortcode: 'popcorn', emoji: '🍿', name: 'Popcorn', keywords: ['movie', 'snack'], group: 'food' },
  { shortcode: 'coffee', emoji: '☕', name: 'Hot Beverage', keywords: ['tea', 'drink', 'morning'], group: 'food' },
  { shortcode: 'beer', emoji: '🍺', name: 'Beer Mug', keywords: ['drink', 'bar'], group: 'food' },
  { shortcode: 'wine_glass', emoji: '🍷', name: 'Wine Glass', keywords: ['drink', 'alcohol'], group: 'food' },
  { shortcode: 'cocktail', emoji: '🍸', name: 'Cocktail Glass', keywords: ['drink', 'martini'], group: 'food' },
  { shortcode: 'hot_pepper', emoji: '🌶️', name: 'Hot Pepper', keywords: ['spicy', 'chili'], group: 'food' },
  { shortcode: 'egg', emoji: '🥚', name: 'Egg', keywords: ['breakfast', 'food'], group: 'food' },

  // ── Travel (~20) ───────────────────────────────────────────────────
  { shortcode: 'earth_americas', emoji: '🌎', name: 'Globe Americas', keywords: ['world', 'planet'], group: 'travel' },
  { shortcode: 'earth_europe', emoji: '🌍', name: 'Globe Europe-Africa', keywords: ['world', 'planet'], group: 'travel' },
  { shortcode: 'sun', emoji: '☀️', name: 'Sun', keywords: ['weather', 'bright', 'warm'], group: 'travel' },
  { shortcode: 'moon', emoji: '🌙', name: 'Crescent Moon', keywords: ['night', 'sleep'], group: 'travel' },
  { shortcode: 'star', emoji: '⭐', name: 'Star', keywords: ['favorite', 'rating'], group: 'travel' },
  { shortcode: 'star2', emoji: '🌟', name: 'Glowing Star', keywords: ['sparkle', 'shine'], group: 'travel' },
  { shortcode: 'cloud', emoji: '☁️', name: 'Cloud', keywords: ['weather', 'sky'], group: 'travel' },
  { shortcode: 'rainbow', emoji: '🌈', name: 'Rainbow', keywords: ['colorful', 'weather'], group: 'travel' },
  { shortcode: 'snowflake', emoji: '❄️', name: 'Snowflake', keywords: ['cold', 'winter'], group: 'travel' },
  { shortcode: 'zap', emoji: '⚡', name: 'High Voltage', keywords: ['lightning', 'electric', 'fast'], group: 'travel' },
  { shortcode: 'fire', emoji: '🔥', name: 'Fire', keywords: ['hot', 'flame', 'lit'], group: 'travel' },
  { shortcode: 'ocean', emoji: '🌊', name: 'Water Wave', keywords: ['sea', 'wave', 'surf'], group: 'travel' },
  { shortcode: 'airplane', emoji: '✈️', name: 'Airplane', keywords: ['travel', 'flight'], group: 'travel' },
  { shortcode: 'rocket', emoji: '🚀', name: 'Rocket', keywords: ['launch', 'space', 'fast'], group: 'travel' },
  { shortcode: 'car', emoji: '🚗', name: 'Automobile', keywords: ['drive', 'vehicle'], group: 'travel' },
  { shortcode: 'house', emoji: '🏠', name: 'House', keywords: ['home', 'building'], group: 'travel' },
  { shortcode: 'tent', emoji: '⛺', name: 'Tent', keywords: ['camping', 'outdoor'], group: 'travel' },
  { shortcode: 'mountain', emoji: '⛰️', name: 'Mountain', keywords: ['nature', 'hike'], group: 'travel' },
  { shortcode: 'desert_island', emoji: '🏝️', name: 'Desert Island', keywords: ['beach', 'vacation'], group: 'travel' },
  { shortcode: 'volcano', emoji: '🌋', name: 'Volcano', keywords: ['eruption', 'nature'], group: 'travel' },

  // ── Activities (~15) ───────────────────────────────────────────────
  { shortcode: 'soccer', emoji: '⚽', name: 'Soccer Ball', keywords: ['football', 'sport'], group: 'activities' },
  { shortcode: 'basketball', emoji: '🏀', name: 'Basketball', keywords: ['sport', 'hoop'], group: 'activities' },
  { shortcode: 'tennis', emoji: '🎾', name: 'Tennis', keywords: ['sport', 'ball'], group: 'activities' },
  { shortcode: 'video_game', emoji: '🎮', name: 'Video Game', keywords: ['gaming', 'controller'], group: 'activities' },
  { shortcode: 'dart', emoji: '🎯', name: 'Bullseye', keywords: ['target', 'goal'], group: 'activities' },
  { shortcode: 'trophy', emoji: '🏆', name: 'Trophy', keywords: ['winner', 'champion'], group: 'activities' },
  { shortcode: 'medal', emoji: '🥇', name: 'Gold Medal', keywords: ['first', 'winner'], group: 'activities' },
  { shortcode: 'tada', emoji: '🎉', name: 'Party Popper', keywords: ['celebration', 'party'], group: 'activities' },
  { shortcode: 'confetti_ball', emoji: '🎊', name: 'Confetti Ball', keywords: ['party', 'celebration'], group: 'activities' },
  { shortcode: 'balloon', emoji: '🎈', name: 'Balloon', keywords: ['party', 'birthday'], group: 'activities' },
  { shortcode: 'art', emoji: '🎨', name: 'Artist Palette', keywords: ['paint', 'creative'], group: 'activities' },
  { shortcode: 'musical_note', emoji: '🎵', name: 'Musical Note', keywords: ['music', 'song'], group: 'activities' },
  { shortcode: 'microphone', emoji: '🎤', name: 'Microphone', keywords: ['sing', 'karaoke'], group: 'activities' },
  { shortcode: 'guitar', emoji: '🎸', name: 'Guitar', keywords: ['music', 'rock'], group: 'activities' },
  { shortcode: 'dice', emoji: '🎲', name: 'Game Die', keywords: ['chance', 'random'], group: 'activities' },

  // ── Objects (~25) ──────────────────────────────────────────────────
  { shortcode: 'bulb', emoji: '💡', name: 'Light Bulb', keywords: ['idea', 'bright'], group: 'objects' },
  { shortcode: 'computer', emoji: '💻', name: 'Laptop', keywords: ['tech', 'work'], group: 'objects' },
  { shortcode: 'keyboard', emoji: '⌨️', name: 'Keyboard', keywords: ['type', 'computer'], group: 'objects' },
  { shortcode: 'phone', emoji: '📱', name: 'Mobile Phone', keywords: ['cell', 'call'], group: 'objects' },
  { shortcode: 'camera', emoji: '📷', name: 'Camera', keywords: ['photo', 'picture'], group: 'objects' },
  { shortcode: 'tv', emoji: '📺', name: 'Television', keywords: ['watch', 'screen'], group: 'objects' },
  { shortcode: 'battery', emoji: '🔋', name: 'Battery', keywords: ['charge', 'power'], group: 'objects' },
  { shortcode: 'electric_plug', emoji: '🔌', name: 'Electric Plug', keywords: ['power', 'connect'], group: 'objects' },
  { shortcode: 'mag', emoji: '🔍', name: 'Magnifying Glass Left', keywords: ['search', 'find'], group: 'objects' },
  { shortcode: 'lock', emoji: '🔒', name: 'Locked', keywords: ['security', 'private'], group: 'objects' },
  { shortcode: 'unlock', emoji: '🔓', name: 'Unlocked', keywords: ['open', 'access'], group: 'objects' },
  { shortcode: 'key', emoji: '🔑', name: 'Key', keywords: ['access', 'password'], group: 'objects' },
  { shortcode: 'hammer', emoji: '🔨', name: 'Hammer', keywords: ['tool', 'build'], group: 'objects' },
  { shortcode: 'wrench', emoji: '🔧', name: 'Wrench', keywords: ['tool', 'fix'], group: 'objects' },
  { shortcode: 'gear', emoji: '⚙️', name: 'Gear', keywords: ['settings', 'config'], group: 'objects' },
  { shortcode: 'link', emoji: '🔗', name: 'Link', keywords: ['chain', 'url'], group: 'objects' },
  { shortcode: 'paperclip', emoji: '📎', name: 'Paperclip', keywords: ['attach', 'clip'], group: 'objects' },
  { shortcode: 'scissors', emoji: '✂️', name: 'Scissors', keywords: ['cut', 'snip'], group: 'objects' },
  { shortcode: 'pen', emoji: '🖊️', name: 'Pen', keywords: ['write', 'sign'], group: 'objects' },
  { shortcode: 'pencil', emoji: '✏️', name: 'Pencil', keywords: ['write', 'draw'], group: 'objects' },
  { shortcode: 'book', emoji: '📖', name: 'Open Book', keywords: ['read', 'study'], group: 'objects' },
  { shortcode: 'memo', emoji: '📝', name: 'Memo', keywords: ['note', 'write'], group: 'objects' },
  { shortcode: 'package', emoji: '📦', name: 'Package', keywords: ['box', 'delivery'], group: 'objects' },
  { shortcode: 'mailbox', emoji: '📬', name: 'Open Mailbox with Raised Flag', keywords: ['mail', 'letter'], group: 'objects' },
  { shortcode: 'bell', emoji: '🔔', name: 'Bell', keywords: ['notification', 'alert'], group: 'objects' },

  // ── Symbols (~20) ─────────────────────────────────────────────────
  { shortcode: 'red_heart', emoji: '❤️', name: 'Red Heart', keywords: ['love', 'valentine'], group: 'symbols' },
  { shortcode: 'orange_heart', emoji: '🧡', name: 'Orange Heart', keywords: ['love'], group: 'symbols' },
  { shortcode: 'yellow_heart', emoji: '💛', name: 'Yellow Heart', keywords: ['love', 'friendship'], group: 'symbols' },
  { shortcode: 'green_heart', emoji: '💚', name: 'Green Heart', keywords: ['love', 'nature'], group: 'symbols' },
  { shortcode: 'blue_heart', emoji: '💙', name: 'Blue Heart', keywords: ['love', 'trust'], group: 'symbols' },
  { shortcode: 'purple_heart', emoji: '💜', name: 'Purple Heart', keywords: ['love'], group: 'symbols' },
  { shortcode: 'broken_heart', emoji: '💔', name: 'Broken Heart', keywords: ['sad', 'breakup'], group: 'symbols' },
  { shortcode: 'sparkles', emoji: '✨', name: 'Sparkles', keywords: ['shine', 'magic', 'new'], group: 'symbols' },
  { shortcode: 'hundred', emoji: '💯', name: 'Hundred Points', keywords: ['perfect', 'score'], group: 'symbols' },
  { shortcode: 'boom', emoji: '💥', name: 'Collision', keywords: ['explosion', 'impact'], group: 'symbols' },
  { shortcode: 'speech_balloon', emoji: '💬', name: 'Speech Balloon', keywords: ['talk', 'chat', 'message'], group: 'symbols' },
  { shortcode: 'thought_balloon', emoji: '💭', name: 'Thought Balloon', keywords: ['think', 'dream'], group: 'symbols' },
  { shortcode: 'check_mark', emoji: '✅', name: 'Check Mark Button', keywords: ['done', 'yes', 'complete'], group: 'symbols' },
  { shortcode: 'x', emoji: '❌', name: 'Cross Mark', keywords: ['no', 'wrong', 'delete'], group: 'symbols' },
  { shortcode: 'warning', emoji: '⚠️', name: 'Warning', keywords: ['caution', 'alert'], group: 'symbols' },
  { shortcode: 'no_entry', emoji: '⛔', name: 'No Entry', keywords: ['stop', 'forbidden'], group: 'symbols' },
  { shortcode: 'question', emoji: '❓', name: 'Question Mark', keywords: ['help', 'what'], group: 'symbols' },
  { shortcode: 'exclamation', emoji: '❗', name: 'Exclamation Mark', keywords: ['important', 'attention'], group: 'symbols' },
  { shortcode: 'arrow_right', emoji: '➡️', name: 'Right Arrow', keywords: ['next', 'forward'], group: 'symbols' },
  { shortcode: 'arrow_left', emoji: '⬅️', name: 'Left Arrow', keywords: ['back', 'previous'], group: 'symbols' },
  { shortcode: 'arrow_up', emoji: '⬆️', name: 'Up Arrow', keywords: ['above'], group: 'symbols' },
  { shortcode: 'arrow_down', emoji: '⬇️', name: 'Down Arrow', keywords: ['below'], group: 'symbols' },
  { shortcode: 'recycle', emoji: '♻️', name: 'Recycling Symbol', keywords: ['environment', 'green'], group: 'symbols' },
  { shortcode: 'infinity', emoji: '♾️', name: 'Infinity', keywords: ['forever', 'loop'], group: 'symbols' },

  // ── Flags (~15) ────────────────────────────────────────────────────
  { shortcode: 'checkered_flag', emoji: '🏁', name: 'Chequered Flag', keywords: ['finish', 'race'], group: 'flags' },
  { shortcode: 'triangular_flag', emoji: '🚩', name: 'Triangular Flag', keywords: ['red flag', 'warning'], group: 'flags' },
  { shortcode: 'white_flag', emoji: '🏳️', name: 'White Flag', keywords: ['surrender', 'peace'], group: 'flags' },
  { shortcode: 'rainbow_flag', emoji: '🏳️‍🌈', name: 'Rainbow Flag', keywords: ['pride', 'lgbtq'], group: 'flags' },
  { shortcode: 'pirate_flag', emoji: '🏴‍☠️', name: 'Pirate Flag', keywords: ['jolly roger', 'skull'], group: 'flags' },
  { shortcode: 'flag_us', emoji: '🇺🇸', name: 'Flag: United States', keywords: ['usa', 'america'], group: 'flags' },
  { shortcode: 'flag_gb', emoji: '🇬🇧', name: 'Flag: United Kingdom', keywords: ['uk', 'britain'], group: 'flags' },
  { shortcode: 'flag_fr', emoji: '🇫🇷', name: 'Flag: France', keywords: ['french'], group: 'flags' },
  { shortcode: 'flag_de', emoji: '🇩🇪', name: 'Flag: Germany', keywords: ['german'], group: 'flags' },
  { shortcode: 'flag_jp', emoji: '🇯🇵', name: 'Flag: Japan', keywords: ['japanese'], group: 'flags' },
  { shortcode: 'flag_kr', emoji: '🇰🇷', name: 'Flag: South Korea', keywords: ['korean'], group: 'flags' },
  { shortcode: 'flag_br', emoji: '🇧🇷', name: 'Flag: Brazil', keywords: ['brazilian'], group: 'flags' },
  { shortcode: 'flag_in', emoji: '🇮🇳', name: 'Flag: India', keywords: ['indian'], group: 'flags' },
  { shortcode: 'flag_ca', emoji: '🇨🇦', name: 'Flag: Canada', keywords: ['canadian', 'maple'], group: 'flags' },
  { shortcode: 'flag_au', emoji: '🇦🇺', name: 'Flag: Australia', keywords: ['australian'], group: 'flags' },
];

// ── Build lookup structures ──────────────────────────────────────────

/** @type {Map<string, object>} shortcode → entry */
export const EMOJI_MAP = new Map(ENTRIES.map(e => [e.shortcode, e]));

/** @type {Map<string, string>} alias → canonical shortcode */
export const EMOJI_ALIASES = new Map([
  ['+1', 'thumbsup'],
  ['-1', 'thumbsdown'],
  ['heart', 'red_heart'],
  ['thumbs_up', 'thumbsup'],
  ['thumbs_down', 'thumbsdown'],
  ['grin', 'grinning'],
  ['laughing_crying', 'joy'],
  ['lol', 'rofl'],
  ['smiley', 'smile'],
  ['cool', 'sunglasses'],
  ['nerd', 'nerd_face'],
  ['kiss', 'kissing_heart'],
  ['hug', 'hugs'],
  ['think', 'thinking'],
  ['sad', 'cry'],
  ['mad', 'angry'],
  ['shrug', 'person_shrugging'],
  ['facepalm', 'person_facepalming'],
  ['raised_fist', 'muscle'],
  ['pray_hands', 'pray'],
  ['hi', 'wave'],
  ['bye', 'wave'],
  ['lightning', 'zap'],
  ['flame', 'fire'],
  ['hot', 'fire'],
  ['bomb', 'boom'],
  ['idea', 'bulb'],
  ['laptop', 'computer'],
  ['search', 'mag'],
  ['party', 'tada'],
  ['celebrate', 'tada'],
  ['congrats', 'tada'],
  ['check', 'check_mark'],
  ['done', 'check_mark'],
  ['yes', 'check_mark'],
  ['no', 'x'],
  ['wrong', 'x'],
  ['love', 'red_heart'],
  ['star_eyes', 'star_struck'],
  ['mindblown', 'exploding_head'],
  ['poop', 'skull'],
  ['memo_pad', 'memo'],
  ['notes', 'memo'],
  ['coffee_cup', 'coffee'],
  ['tea', 'coffee'],
]);

/** @type {string[]} Ordered group names */
export const EMOJI_GROUPS = [
  'smileys', 'people', 'animals', 'food',
  'travel', 'activities', 'objects', 'symbols', 'flags'
];

/** Group display labels */
export const EMOJI_GROUP_LABELS = {
  smileys: 'Smileys & Emotion',
  people: 'People & Body',
  animals: 'Animals & Nature',
  food: 'Food & Drink',
  travel: 'Travel & Places',
  activities: 'Activities',
  objects: 'Objects',
  symbols: 'Symbols',
  flags: 'Flags',
};

/** Representative emoji for each group (used as tab icons) */
export const EMOJI_GROUP_ICONS = {
  smileys: '😀',
  people: '👋',
  animals: '🐶',
  food: '🍕',
  travel: '🌍',
  activities: '🎉',
  objects: '💡',
  symbols: '❤️',
  flags: '🏁',
};

// ── Extended emoji support ───────────────────────────────────────────

/** @type {object[]} Extended entries registered at runtime */
const EXTENDED_ENTRIES = [];

/**
 * Register extended emoji entries (from emoji-data-extended.js).
 * Each entry is [shortcode, emoji, name, group].
 * Skips shortcodes already in the core set.
 * @param {Array<[string, string, string, string]>} entries
 */
function registerExtended(entries) {
  for (const [shortcode, emoji, name, group] of entries) {
    if (EMOJI_MAP.has(shortcode)) continue;
    const entry = { shortcode, emoji, name, keywords: [], group };
    EMOJI_MAP.set(shortcode, entry);
    EXTENDED_ENTRIES.push(entry);
  }
}

// Expose for the standalone extended module
globalThis.__vbEmojiRegister = registerExtended;

// Pick up extended data if it loaded before us
if (globalThis.__vbEmojiExtended) {
  registerExtended(globalThis.__vbEmojiExtended);
  delete globalThis.__vbEmojiExtended;
}

// ── Public API ──────────────────────────────────────────────────────

/**
 * Resolve a shortcode (canonical or alias) to its entry
 * @param {string} shortcode
 * @returns {object|null}
 */
export function resolveEmoji(shortcode) {
  const direct = EMOJI_MAP.get(shortcode);
  if (direct) return direct;

  const canonical = EMOJI_ALIASES.get(shortcode);
  if (canonical) return EMOJI_MAP.get(canonical) || null;

  return null;
}

/**
 * Get all entries in a group (core + extended)
 * @param {string} group
 * @returns {object[]}
 */
export function getByGroup(group) {
  const core = ENTRIES.filter(e => e.group === group);
  const ext = EXTENDED_ENTRIES.filter(e => e.group === group);
  return ext.length > 0 ? core.concat(ext) : core;
}

/**
 * Search entries by shortcode, name, or keywords substring match (core + extended)
 * @param {string} query
 * @returns {object[]}
 */
export function searchEmoji(query) {
  const q = query.toLowerCase().trim();
  const all = EXTENDED_ENTRIES.length > 0 ? ENTRIES.concat(EXTENDED_ENTRIES) : ENTRIES;
  if (!q) return all;

  return all.filter(e =>
    e.shortcode.includes(q) ||
    e.name.toLowerCase().includes(q) ||
    (e.keywords && e.keywords.some(k => k.includes(q)))
  );
}
