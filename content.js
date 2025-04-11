async function createSidebar() {
  const sidebar = document.createElement("div");
  sidebar.id = "readability-sidebar";

  const response = await fetch(chrome.runtime.getURL("sidebar.html"));
  const htmlContent = await response.text();
  sidebar.innerHTML = htmlContent;

  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = chrome.runtime.getURL("sidebar.css");

  document.body.appendChild(sidebar);
  document.head.appendChild(link);

  // "Define" button logic
  document.getElementById("define-button").addEventListener("click", async () => {
    const word = document.getElementById("word-input").value.trim();
    const display = document.getElementById("definition-display");

    if (!word) return;

    display.textContent = `Looking up definition for "${word}"...`;

    try {
      const res = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${word}`);
      const data = await res.json();
      if (Array.isArray(data)) {
        const definition = data[0].meanings[0].definitions[0].definition;
        display.textContent = `Definition: ${definition}`;
      } else {
        display.textContent = `Sorry, no definition found.`;
      }
    } catch (err) {
      console.error(err);
      display.textContent = "Failed to fetch definition.";
    }
  });

  // Text extraction
  const pTags = document.querySelectorAll("p");
  const pTexts = Array.from(pTags).map(p => p.textContent);
  const fullText = pTexts.join(" ");

  // Basic fallback summarizer for now
  function naiveSummary(text, count = 4) {
    const sentences = text.match(/[^.!?]+[.!?]+/g) || [];
    const sorted = sentences.sort((a, b) => b.length - a.length);
    return sorted.slice(0, count).join(" ");
  }

  const updateSummary = (count) => {
    const summary = naiveSummary(fullText, count);
    document.getElementById("summary-text").value = summary || "No summary available.";
  };

  // Summary controls
  document.getElementById("sentence-count").addEventListener("change", () => {
    const count = parseInt(document.getElementById("sentence-count").value);
    updateSummary(count);
  });

  const defaultCount = parseInt(document.getElementById("sentence-count").value);
  updateSummary(defaultCount);

  // Decrement number of sentences in summary
  document.getElementById('dec').addEventListener("click", async () => {
    let number = document.querySelector('#sentence-count');
    if (parseInt(number.value) > 0) {
      number.value = parseInt(number.value) - 1;
    }
  });
  
  // Increment number of sentences in summary
  document.getElementById('inc').addEventListener("click", async () => {
    let number = document.querySelector('#sentence-count');
    if (parseInt(number.value) > 0) {
      number.value = parseInt(number.value) + 1;
    }
  });

  // Logic for calculating "Reading Grade Level" 
  const regex = /\b\w+\b|[^a-zA-Z0-9\s]/g;
  let num_words = 0;
  let num_sentences = 0;
  let num_spache_complex = 0;
  for (const input of pTexts) {
    const tokens = tokenize(input, regex);
    for (const t of tokens) {
      num_words += 1;
      if (t === ".") num_sentences += 1;
      if (easy_words.includes(t)) num_spache_complex += 1;
    }
  }
  const avg_sentence_len = num_words / num_sentences;
  const percent_difficult_words = (num_spache_complex / num_words) * 100;

  // Spache-Allen Readability Formula
  const score = Math.round((0.141 * avg_sentence_len) + (0.086 * percent_difficult_words) + 0.839);
  document.getElementById("grade-level").innerHTML = score;

  
  // For the information buttons
  document.getElementById('grade-info').addEventListener("mouseover", () => {
    const popup = document.querySelector('#grade-popup');
    popup.style.visibility = 'visible';
    const sidebar = document.querySelector('#overlay');
    sidebar.style.opacity = '0.2';
  });

  document.getElementById('grade-info').addEventListener("mouseout", () => {
    const popup = document.querySelector('#grade-popup');
    popup.style.visibility = 'hidden';
    const sidebar = document.querySelector('#overlay');
    sidebar.style.opacity = '1';
  });

  document.getElementById('sum-info').addEventListener("mouseover", () => {
    const popup = document.querySelector('#sum-popup');
    popup.style.visibility = 'visible';
    const sidebar = document.querySelector('#overlay');
    sidebar.style.opacity = '0.2';
  });

  document.getElementById('sum-info').addEventListener("mouseout", () => {
    const popup = document.querySelector('#sum-popup');
    popup.style.visibility = 'hidden';
    const sidebar = document.querySelector('#overlay');
    sidebar.style.opacity = '1';
  });

  document.getElementById('def-info').addEventListener("mouseover", () => {
    const popup = document.querySelector('#def-popup');
    popup.style.visibility = 'visible';
    const sidebar = document.querySelector('#overlay');
    sidebar.style.opacity = '0.2';
  });

  document.getElementById('def-info').addEventListener("mouseout", () => {
    const popup = document.querySelector('#def-popup');
    popup.style.visibility = 'hidden';
    const sidebar = document.querySelector('#overlay');
    sidebar.style.opacity = '1';
  });
  
}  

// Create floating button in lower right corner
function createFloatingButton() {
  const button = document.createElement("div");
  button.id = "readability-toggle-button";
  button.innerHTML = "&#128269;"; // tried to match our icon
  button.title = "Toggle Readability Sidebar";
  button.style.position = "fixed";
  button.style.bottom = "20px";
  button.style.right = "20px";
  button.style.width = "48px";
  button.style.height = "48px";
  button.style.backgroundColor = "#0b6623";
  button.style.borderRadius = "50%";
  button.style.display = "flex";
  button.style.alignItems = "center";
  button.style.justifyContent = "center";
  button.style.color = "white";
  button.style.fontSize = "24px";
  button.style.zIndex = "10000";
  button.style.cursor = "pointer";
  button.style.boxShadow = "0 4px 12px rgba(0,0,0,0.3)";

  button.addEventListener("click", () => {
    const sidebar = document.getElementById("readability-sidebar");
    if (sidebar) {
      sidebar.remove();
      document.body.style.marginRight = "0";
    } else {
      createSidebar();
      document.body.style.marginRight = "380px";
    }
    
  
  });

  document.body.appendChild(button);
}

createFloatingButton();

// Extension icon toggle
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "toggleSidebar") {
    const sidebar = document.getElementById("readability-sidebar");
    if (sidebar) {
      sidebar.remove();
    } else {
      createSidebar();
    }
    
    sendResponse({ status: "Sidebar toggled" });
    return true;
  }
});

// Helper function for calculating grade level above
function tokenize(text, regex) {
  const tokens = [];
  let match;
  while ((match = regex.exec(text)) !== null) {
    tokens.push(match[0]);
  }
  return tokens;
}

// list of words for reading grade level calculation above
let easy_words = ['a', 'able', 'about', 'above', 'across', 'act', 'add', 'afraid', 'after', 'afternoon', 'again', 'against', 'ago', 'air', 'airplane', 'alarm', 'all', 'almost', 'alone', 'along', 'already', 'also', 'always', 'am', 'among', 'an', 'and', 'angry', 'animal', 'another', 'answer', 'any', 'anyone', 'appear', 'apple', 'are', 'arm', 'around', 'arrow', 'as', 'ask', 'asleep', 'at', 'ate', 'attention', 'aunt', 'awake', 'away', 'b', 'baby', 'back', 'bad', 'bag', 'ball', 'balloon', 'bang', 'bank', 'bark', 'barn', 'basket', 'be', 'bean', 'bear', 'beat', 'beautiful', 'became', 'because', 'become', 'bed', 'bee', 'been', 'before', 'began', 'begin', 'behind', 'believe', 'bell', 'belong', 'bend', 'bent', 'beside', 'best', 'better', 'between', 'big', 'bird', 'birthday', 'bit', 'bite', 'black', 'blanket', 'blew', 'block', 'blow', 'blue', 'board', 'boat', 'book', 'boot', 'born', 'borrow', 'both', 'bother', 'bottle', 'bottom', 'bought', 'bow', 'box', 'boy', 'branch', 'brave', 'bread', 'break', 'breakfast', 'breath', 'brick', 'bridge', 'bright', 'bring', 'broke', 'broken', 'brother', 'brought', 'brown', 'brush', 'build', 'bump', 'burn', 'bus', 'busy', 'but', 'butter', 'button', 'buy', 'by', 'c', 'cabin', 'cage', 'cake', 'call', 'came', 'camp', 'can', 'candle', 'candy', 'can\\t', 'cap', 'captain', 'car', 'card', 'care', 'careful', 'carrot', 'carry', 'case', 'castle', 'cat', 'catch', 'cattle', 'caught', 'cause', 'cent', 'certain', 'chair', 'chance', 'change', 'chase', 'chicken', 'chief', 'child', 'children', 'church', 'circle', 'circus', 'city', 'clap', 'clean', 'clever', 'cliff', 'climb', 'clock', 'close', 'cloth', 'clothes', 'clown', 'coat', 'cold', 'color', 'come', 'comfortable', 'company', 'contest', 'continue', 'cook', 'cool', 'corner', 'could', 'count', 'country', 'course', 'cover', 'cow', 'crawl', 'cream', 'cry', 'cup', 'curtain', 'cut', 'd', 'Dad', 'dance', 'danger', 'dangerous', 'dark', 'dash', 'daughter', 'day', 'dear', 'decide', 'deep', 'desk', 'did', 'didn\\t', 'die', 'different', 'dig', 'dinner', 'direction', 'disappear', 'disappoint', 'discover', 'distance', 'do', 'doctor', 'does', 'dog', 'dollar', 'done', 'don\\t', 'door', 'down', 'dragon', 'dream', 'dress', 'drink', 'drive', 'drop', 'drove', 'dry', 'duck', 'during', 'dust', 'e', 'each', 'eager', 'ear', 'early', 'earn', 'earth', 'easy', 'eat', 'edge', 'egg', 'eight', 'eighteen', 'either', 'elephant', 'else', 'empty', 'end', 'enemy', 'enough', 'enter', 'even', 'ever', 'every', 'everything', 'exact', 'except', 'excite', 'exclaim', 'explain', 'eye', 'face', 'fact', 'fair', 'fall', 'family', 'far', 'farm', 'farmer', 'farther', 'fast', 'fat', 'father', 'feather', 'feed', 'feel', 'feet', 'fell', 'fellow', 'felt', 'fence', 'few', 'field', 'fierce', 'fight', 'figure', 'fill', 'final', 'find', 'fine', 'finger', 'finish', 'fire', 'first', 'fish', 'five', 'flag', 'flash', 'flat', 'flew', 'floor', 'flower', 'fly', 'follow', 'food', 'for', 'forest', 'forget', 'forth', 'found', 'four', 'fourth', 'fox', 'fresh', 'friend', 'frighten', 'frog', 'from', 'front', 'fruit', 'full', 'fun', 'funny', 'fur', 'g', 'game', 'garden', 'gasp', 'gate', 'gave', 'get', 'giant', 'gift', 'girl', 'give', 'glad', 'glass', 'go', 'goat', 'gone', 'good', 'got', 'grandfather', 'grandmother', 'grass', 'gray', 'great', 'green', 'grew', 'grin', 'ground', 'group', 'grow', 'growl', 'guess', 'gun', 'h', 'had', 'hair', 'half', 'hall', 'hand', 'handle', 'hang', 'happen', 'happiness', 'happy', 'hard', 'harm', 'has', 'hat', 'hate', 'have', 'he', 'head', 'hear', 'heard', 'heavy', 'held', 'hello', 'help', 'hen', 'her', 'here', 'herself', 'he\\s', 'hid', 'hide', 'high', 'hill', 'him', 'himself', 'his', 'hit', 'hold', 'hole', 'holiday', 'home', 'honey', 'hop', 'horn', 'horse', 'hot', 'hour', 'house', 'how', 'howl', 'hum', 'hundred', 'hung', 'hungry', 'hunt', 'hurry', 'hurt', 'husband', 'i', 'I', 'ice', 'idea', 'if', 'I\\ll', 'I\\m', 'imagine', 'important', 'in', 'inch', 'indeed', 'inside', 'instead', 'into', 'invite', 'is', 'it', 'it\\s', 'its', 'j', 'jacket', 'jar', 'jet', 'job', 'join', 'joke', 'joy', 'jump', 'just', 'k', 'keep', 'kept', 'key', 'kick', 'kill', 'kind', 'king', 'kitchen', 'kitten', 'knee', 'knew', 'knock', 'know', 'l', 'ladder', 'lady', 'laid', 'lake', 'land', 'large', 'last', 'late', 'laugh', 'lay', 'lazy', 'lead', 'leap', 'learn', 'least', 'leave', 'left', 'leg', 'less', 'let', 'let\\s', 'letter', 'lick', 'lift', 'light', 'like', 'line', 'lion', 'list', 'listen', 'little', 'live', 'load', 'long', 'look', 'lost', 'lot', 'loud', 'love', 'low', 'luck', 'lump', 'lunch', 'm', 'machine', 'made', 'magic', 'mail', 'make', 'man', 'many', 'march', 'mark', 'market', 'master', 'matter', 'may', 'maybe', 'me', 'mean', 'meant', 'meat', 'meet', 'melt', 'men', 'merry', 'met', 'middle', 'might', 'mile', 'milk', 'milkman', 'mind', 'mine', 'minute', 'miss', 'mistake', 'moment', 'money', 'monkey', 'month', 'more', 'morning', 'most', 'mother', 'mountain', 'mouse', 'mouth', 'move', 'much', 'mud', 'music', 'must', 'my', 'n', 'name', 'near', 'neck', 'need', 'needle', 'neighbor', 'neighborhood', 'nest', 'never', 'new', 'next', 'nibble', 'nice', 'night', 'nine', 'no', 'nod', 'noise', 'none', 'north', 'nose', 'not', 'note', 'nothing', 'notice', 'now', 'number', 'o', 'ocean', 'of', 'off', 'offer', 'often', 'oh', 'old', 'on', 'once', 'one', 'only', 'open', 'or', 'orange', 'order', 'other', 'our', 'out', 'outside', 'over', 'owl', 'own', 'p', 'pack', 'paid', 'pail', 'paint', 'pair', 'palace', 'pan', 'paper', 'parade', 'parent', 'park', 'part', 'party', 'pass', 'past', 'pasture', 'path', 'paw', 'pay', 'peanut', 'peek', 'pen', 'penny', 'people', 'perfect', 'perhaps', 'person', 'pet', 'pick', 'picnic', 'picture', 'pie', 'piece', 'pig', 'pile', 'pin', 'place', 'plan', 'plant', 'play', 'pleasant', 'please', 'plenty', 'plow', 'picket', 'point', 'poke', 'pole', 'policeman', 'pond', 'poor', 'pop', 'postman', 'pot', 'potato', 'pound', 'pour', 'practice', 'prepare', 'present', 'pretend', 'pretty', 'princess', 'prize', 'probably', 'problem', 'promise', 'protect', 'proud', 'puff', 'pull', 'puppy', 'push', 'put', 'q', 'queen', 'queer', 'quick', 'quiet', 'quite', 'r', 'rabbit', 'raccoon', 'race', 'radio', 'rag', 'rain', 'raise', 'ran', 'ranch', 'rang', 'reach', 'read', 'ready', 'real', 'red', 'refuse', 'remember', 'reply', 'rest', 'return', 'reward', 'rich', 'ride', 'right', 'ring', 'river', 'road', 'roar', 'rock', 'rode', 'roll', 'roof', 'room', 'rope', 'round', 'row', 'rub', 'rule', 'run', 'rush', 's', 'sad', 'safe', 'said', 'sail', 'sale', 'salt', 'same', 'sand', 'sang', 'sat', 'save', 'saw', 'say', 'scare', 'school', 'scold', 'scratch', 'scream', 'sea', 'seat', 'second', 'secret', 'see', 'seed', 'seem', 'seen', 'sell', 'send', 'sent', 'seven', 'several', 'sew', 'shadow', 'shake', 'shall', 'shape', 'she', 'sheep', 'shell', 'shine', 'ship', 'shoe', 'shone', 'shook', 'shoot', 'shop', 'shore', 'short', 'shot', 'should', 'show', 'sick', 'side', 'sight', 'sign', 'signal', 'silent', 'silly', 'silver', 'since', 'sing', 'sister', 'sit', 'six', 'size', 'skip', 'sky', 'sled', 'sleep', 'slid', 'slide', 'slow', 'small', 'smart', 'smell', 'smile', 'smoke', 'snap', 'sniff', 'snow', 'so', 'soft', 'sold', 'some', 'something', 'sometimes', 'son', 'song', 'soon', 'sorry', 'sound', 'speak', 'special', 'spend', 'spill', 'splash', 'spoke', 'spot', 'spread', 'spring', 'squirrel', 'stand', 'star', 'start', 'station', 'stay', 'step', 'stick', 'still', 'stone', 'stood', 'stop', 'store', 'story', 'straight', 'strange', 'street', 'stretch', 'strike', 'strong', 'such', 'sudden', 'sugar', 'suit', 'summer', 'sun', 'supper', 'suppose', 'sure', 'surprise', 'swallow', 'sweet', 'swim', 'swing', 't', 'table', 'tail', 'take', 'talk', 'tall', 'tap', 'taste', 'teach', 'teacher', 'team', 'tear', 'teeth', 'telephone', 'tell', 'ten', 'tent', 'than', 'thank', 'that', 'that\\s', 'the', 'their', 'them', 'then', 'there', 'these', 'they', 'thick', 'thin', 'thing', 'think', 'third', 'this', 'those', 'though', 'thought', 'three', 'threw', 'through', 'throw', 'tie', 'tiger', 'tight', 'time', 'tiny', 'tip', 'tire', 'to', 'today', 'toe', 'together', 'told', 'tomorrow', 'too', 'took', 'tooth', 'top', 'touch', 'toward', 'tower', 'town', 'toy', 'track', 'traffic', 'train', 'trap', 'tree', 'trick', 'trip', 'trot', 'truck', 'true', 'trunk', 'try', 'turkey', 'turn', 'turtle', 'twelve', 'twin', 'two', 'u', 'ugly', 'uncle', 'under', 'unhappy', 'until', 'up', 'upon', 'upstairs', 'us', 'use', 'usual', 'v', 'valley', 'vegetable', 'very', 'village', 'visit', 'voice', 'w', 'wag', 'wagon', 'wait', 'wake', 'walk', 'want', 'war', 'warm', 'was', 'wash', 'waste', 'watch', 'water', 'wave', 'way', 'we', 'wear', 'weather', 'week', 'well', 'went', 'were', 'wet', 'what', 'wheel', 'when', 'where', 'which', 'while', 'whisper', 'whistle', 'white', 'who', 'whole', 'whose', 'why', 'wide', 'wife', 'will', 'win', 'wind', 'window', 'wing', 'wink', 'winter', 'wire', 'wise', 'wish', 'with', 'without', 'woke', 'wolf', 'woman', 'women', 'wonder', 'won\\t', 'wood', 'word', 'wore', 'work', 'world', 'worm', 'worry', 'worth', 'would', 'wrong', 'x', 'y', 'yard', 'year', 'yell', 'yellow', 'yes', 'yet', 'you', 'young', 'your', 'z', 'zoo'];
