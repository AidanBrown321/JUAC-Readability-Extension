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

  // event handlers
  document.getElementById("define-button").addEventListener("click", () => {
    const word = document.getElementById("word-input").value;
    if (word.trim()) {
      document.getElementById(
        "definition-display"
      ).textContent = `Looking up definition for "${word}"...`;
    }
  });

  // extract text content
  const pTags = document.querySelectorAll("p");
  const pTexts = Array.from(pTags).map(p => p.textContent);

  // function to tokenize text content, returns array of words and punctuation
  function tokenize(text, regex) {
    const tokens = [];
    let match;
    while ((match = regex.exec(text)) !== null) {
      tokens.push(match[0]);
    }
    return tokens;
  }
  
  // regular expression using in tokenization
  const regex = /\b\w+\b|[^a-zA-Z0-9\s]/g;

  // variables to keep track of for calculation
  var num_words = 0;
  var num_sentences = 0;
  var num_spache_complex = 0;

  // loop through the tokens to count words, sentences, and check word complexity
  for (const input of pTexts) {
    const tokens = tokenize(input, regex);
    for (const t of tokens) {
      // increment words
      num_words += 1
      // increment sentences at periods
      if (t == ".") {
        num_sentences += 1;
      }
      // check text complexity
      for (const e of easy_words) {
        if (t == e) {
          num_spache_complex += 1;
        }
      }
    }
  }

  avg_sentence_len = num_words / num_sentences;
  percent_difficult_words = num_spache_complex / num_words * 100;
  
  // Spache-Allen Readability Formula
  const score = Math.round((0.141 * avg_sentence_len) + (0.086 * percent_difficult_words) + 0.839);
  console.log(score);

  // display reading grade level
  document.getElementById("grade-level").innerHTML = score;
}

// Initialize message listener when content script loads
console.log("Readability extension content script loaded");

// toggles the sidebar after the extension icon is clicked
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log("Message received in content script:", message);
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

// to auto load the sidebar when the page loads, uncomment the line below
// createSidebar();

// list of words for reading grade level calculation above
let easy_words = ['a', 'able', 'about', 'above', 'across', 'act', 'add', 'afraid', 'after', 'afternoon', 'again', 'against', 'ago', 'air', 'airplane', 'alarm', 'all', 'almost', 'alone', 'along', 'already', 'also', 'always', 'am', 'among', 'an', 'and', 'angry', 'animal', 'another', 'answer', 'any', 'anyone', 'appear', 'apple', 'are', 'arm', 'around', 'arrow', 'as', 'ask', 'asleep', 'at', 'ate', 'attention', 'aunt', 'awake', 'away', 'b', 'baby', 'back', 'bad', 'bag', 'ball', 'balloon', 'bang', 'bank', 'bark', 'barn', 'basket', 'be', 'bean', 'bear', 'beat', 'beautiful', 'became', 'because', 'become', 'bed', 'bee', 'been', 'before', 'began', 'begin', 'behind', 'believe', 'bell', 'belong', 'bend', 'bent', 'beside', 'best', 'better', 'between', 'big', 'bird', 'birthday', 'bit', 'bite', 'black', 'blanket', 'blew', 'block', 'blow', 'blue', 'board', 'boat', 'book', 'boot', 'born', 'borrow', 'both', 'bother', 'bottle', 'bottom', 'bought', 'bow', 'box', 'boy', 'branch', 'brave', 'bread', 'break', 'breakfast', 'breath', 'brick', 'bridge', 'bright', 'bring', 'broke', 'broken', 'brother', 'brought', 'brown', 'brush', 'build', 'bump', 'burn', 'bus', 'busy', 'but', 'butter', 'button', 'buy', 'by', 'c', 'cabin', 'cage', 'cake', 'call', 'came', 'camp', 'can', 'candle', 'candy', 'can\\t', 'cap', 'captain', 'car', 'card', 'care', 'careful', 'carrot', 'carry', 'case', 'castle', 'cat', 'catch', 'cattle', 'caught', 'cause', 'cent', 'certain', 'chair', 'chance', 'change', 'chase', 'chicken', 'chief', 'child', 'children', 'church', 'circle', 'circus', 'city', 'clap', 'clean', 'clever', 'cliff', 'climb', 'clock', 'close', 'cloth', 'clothes', 'clown', 'coat', 'cold', 'color', 'come', 'comfortable', 'company', 'contest', 'continue', 'cook', 'cool', 'corner', 'could', 'count', 'country', 'course', 'cover', 'cow', 'crawl', 'cream', 'cry', 'cup', 'curtain', 'cut', 'd', 'Dad', 'dance', 'danger', 'dangerous', 'dark', 'dash', 'daughter', 'day', 'dear', 'decide', 'deep', 'desk', 'did', 'didn\\t', 'die', 'different', 'dig', 'dinner', 'direction', 'disappear', 'disappoint', 'discover', 'distance', 'do', 'doctor', 'does', 'dog', 'dollar', 'done', 'don\\t', 'door', 'down', 'dragon', 'dream', 'dress', 'drink', 'drive', 'drop', 'drove', 'dry', 'duck', 'during', 'dust', 'e', 'each', 'eager', 'ear', 'early', 'earn', 'earth', 'easy', 'eat', 'edge', 'egg', 'eight', 'eighteen', 'either', 'elephant', 'else', 'empty', 'end', 'enemy', 'enough', 'enter', 'even', 'ever', 'every', 'everything', 'exact', 'except', 'excite', 'exclaim', 'explain', 'eye', 'face', 'fact', 'fair', 'fall', 'family', 'far', 'farm', 'farmer', 'farther', 'fast', 'fat', 'father', 'feather', 'feed', 'feel', 'feet', 'fell', 'fellow', 'felt', 'fence', 'few', 'field', 'fierce', 'fight', 'figure', 'fill', 'final', 'find', 'fine', 'finger', 'finish', 'fire', 'first', 'fish', 'five', 'flag', 'flash', 'flat', 'flew', 'floor', 'flower', 'fly', 'follow', 'food', 'for', 'forest', 'forget', 'forth', 'found', 'four', 'fourth', 'fox', 'fresh', 'friend', 'frighten', 'frog', 'from', 'front', 'fruit', 'full', 'fun', 'funny', 'fur', 'g', 'game', 'garden', 'gasp', 'gate', 'gave', 'get', 'giant', 'gift', 'girl', 'give', 'glad', 'glass', 'go', 'goat', 'gone', 'good', 'got', 'grandfather', 'grandmother', 'grass', 'gray', 'great', 'green', 'grew', 'grin', 'ground', 'group', 'grow', 'growl', 'guess', 'gun', 'h', 'had', 'hair', 'half', 'hall', 'hand', 'handle', 'hang', 'happen', 'happiness', 'happy', 'hard', 'harm', 'has', 'hat', 'hate', 'have', 'he', 'head', 'hear', 'heard', 'heavy', 'held', 'hello', 'help', 'hen', 'her', 'here', 'herself', 'he\\s', 'hid', 'hide', 'high', 'hill', 'him', 'himself', 'his', 'hit', 'hold', 'hole', 'holiday', 'home', 'honey', 'hop', 'horn', 'horse', 'hot', 'hour', 'house', 'how', 'howl', 'hum', 'hundred', 'hung', 'hungry', 'hunt', 'hurry', 'hurt', 'husband', 'i', 'I', 'ice', 'idea', 'if', 'I\\ll', 'I\\m', 'imagine', 'important', 'in', 'inch', 'indeed', 'inside', 'instead', 'into', 'invite', 'is', 'it', 'it\\s', 'its', 'j', 'jacket', 'jar', 'jet', 'job', 'join', 'joke', 'joy', 'jump', 'just', 'k', 'keep', 'kept', 'key', 'kick', 'kill', 'kind', 'king', 'kitchen', 'kitten', 'knee', 'knew', 'knock', 'know', 'l', 'ladder', 'lady', 'laid', 'lake', 'land', 'large', 'last', 'late', 'laugh', 'lay', 'lazy', 'lead', 'leap', 'learn', 'least', 'leave', 'left', 'leg', 'less', 'let', 'let\\s', 'letter', 'lick', 'lift', 'light', 'like', 'line', 'lion', 'list', 'listen', 'little', 'live', 'load', 'long', 'look', 'lost', 'lot', 'loud', 'love', 'low', 'luck', 'lump', 'lunch', 'm', 'machine', 'made', 'magic', 'mail', 'make', 'man', 'many', 'march', 'mark', 'market', 'master', 'matter', 'may', 'maybe', 'me', 'mean', 'meant', 'meat', 'meet', 'melt', 'men', 'merry', 'met', 'middle', 'might', 'mile', 'milk', 'milkman', 'mind', 'mine', 'minute', 'miss', 'mistake', 'moment', 'money', 'monkey', 'month', 'more', 'morning', 'most', 'mother', 'mountain', 'mouse', 'mouth', 'move', 'much', 'mud', 'music', 'must', 'my', 'n', 'name', 'near', 'neck', 'need', 'needle', 'neighbor', 'neighborhood', 'nest', 'never', 'new', 'next', 'nibble', 'nice', 'night', 'nine', 'no', 'nod', 'noise', 'none', 'north', 'nose', 'not', 'note', 'nothing', 'notice', 'now', 'number', 'o', 'ocean', 'of', 'off', 'offer', 'often', 'oh', 'old', 'on', 'once', 'one', 'only', 'open', 'or', 'orange', 'order', 'other', 'our', 'out', 'outside', 'over', 'owl', 'own', 'p', 'pack', 'paid', 'pail', 'paint', 'pair', 'palace', 'pan', 'paper', 'parade', 'parent', 'park', 'part', 'party', 'pass', 'past', 'pasture', 'path', 'paw', 'pay', 'peanut', 'peek', 'pen', 'penny', 'people', 'perfect', 'perhaps', 'person', 'pet', 'pick', 'picnic', 'picture', 'pie', 'piece', 'pig', 'pile', 'pin', 'place', 'plan', 'plant', 'play', 'pleasant', 'please', 'plenty', 'plow', 'picket', 'point', 'poke', 'pole', 'policeman', 'pond', 'poor', 'pop', 'postman', 'pot', 'potato', 'pound', 'pour', 'practice', 'prepare', 'present', 'pretend', 'pretty', 'princess', 'prize', 'probably', 'problem', 'promise', 'protect', 'proud', 'puff', 'pull', 'puppy', 'push', 'put', 'q', 'queen', 'queer', 'quick', 'quiet', 'quite', 'r', 'rabbit', 'raccoon', 'race', 'radio', 'rag', 'rain', 'raise', 'ran', 'ranch', 'rang', 'reach', 'read', 'ready', 'real', 'red', 'refuse', 'remember', 'reply', 'rest', 'return', 'reward', 'rich', 'ride', 'right', 'ring', 'river', 'road', 'roar', 'rock', 'rode', 'roll', 'roof', 'room', 'rope', 'round', 'row', 'rub', 'rule', 'run', 'rush', 's', 'sad', 'safe', 'said', 'sail', 'sale', 'salt', 'same', 'sand', 'sang', 'sat', 'save', 'saw', 'say', 'scare', 'school', 'scold', 'scratch', 'scream', 'sea', 'seat', 'second', 'secret', 'see', 'seed', 'seem', 'seen', 'sell', 'send', 'sent', 'seven', 'several', 'sew', 'shadow', 'shake', 'shall', 'shape', 'she', 'sheep', 'shell', 'shine', 'ship', 'shoe', 'shone', 'shook', 'shoot', 'shop', 'shore', 'short', 'shot', 'should', 'show', 'sick', 'side', 'sight', 'sign', 'signal', 'silent', 'silly', 'silver', 'since', 'sing', 'sister', 'sit', 'six', 'size', 'skip', 'sky', 'sled', 'sleep', 'slid', 'slide', 'slow', 'small', 'smart', 'smell', 'smile', 'smoke', 'snap', 'sniff', 'snow', 'so', 'soft', 'sold', 'some', 'something', 'sometimes', 'son', 'song', 'soon', 'sorry', 'sound', 'speak', 'special', 'spend', 'spill', 'splash', 'spoke', 'spot', 'spread', 'spring', 'squirrel', 'stand', 'star', 'start', 'station', 'stay', 'step', 'stick', 'still', 'stone', 'stood', 'stop', 'store', 'story', 'straight', 'strange', 'street', 'stretch', 'strike', 'strong', 'such', 'sudden', 'sugar', 'suit', 'summer', 'sun', 'supper', 'suppose', 'sure', 'surprise', 'swallow', 'sweet', 'swim', 'swing', 't', 'table', 'tail', 'take', 'talk', 'tall', 'tap', 'taste', 'teach', 'teacher', 'team', 'tear', 'teeth', 'telephone', 'tell', 'ten', 'tent', 'than', 'thank', 'that', 'that\\s', 'the', 'their', 'them', 'then', 'there', 'these', 'they', 'thick', 'thin', 'thing', 'think', 'third', 'this', 'those', 'though', 'thought', 'three', 'threw', 'through', 'throw', 'tie', 'tiger', 'tight', 'time', 'tiny', 'tip', 'tire', 'to', 'today', 'toe', 'together', 'told', 'tomorrow', 'too', 'took', 'tooth', 'top', 'touch', 'toward', 'tower', 'town', 'toy', 'track', 'traffic', 'train', 'trap', 'tree', 'trick', 'trip', 'trot', 'truck', 'true', 'trunk', 'try', 'turkey', 'turn', 'turtle', 'twelve', 'twin', 'two', 'u', 'ugly', 'uncle', 'under', 'unhappy', 'until', 'up', 'upon', 'upstairs', 'us', 'use', 'usual', 'v', 'valley', 'vegetable', 'very', 'village', 'visit', 'voice', 'w', 'wag', 'wagon', 'wait', 'wake', 'walk', 'want', 'war', 'warm', 'was', 'wash', 'waste', 'watch', 'water', 'wave', 'way', 'we', 'wear', 'weather', 'week', 'well', 'went', 'were', 'wet', 'what', 'wheel', 'when', 'where', 'which', 'while', 'whisper', 'whistle', 'white', 'who', 'whole', 'whose', 'why', 'wide', 'wife', 'will', 'win', 'wind', 'window', 'wing', 'wink', 'winter', 'wire', 'wise', 'wish', 'with', 'without', 'woke', 'wolf', 'woman', 'women', 'wonder', 'won\\t', 'wood', 'word', 'wore', 'work', 'world', 'worm', 'worry', 'worth', 'would', 'wrong', 'x', 'y', 'yard', 'year', 'yell', 'yellow', 'yes', 'yet', 'you', 'young', 'your', 'z', 'zoo'];
