/**
 * PromptEngine.js
 * Manages kana prompts using a spaced repetition algorithm
 */

// Prefix for all asset paths to handle both development and production environments
const BASE_PATH = import.meta.env.BASE_URL;

// Hiragana basic set
const HIRAGANA = [
  { kana: 'あ', romaji: 'a', audio: `${BASE_PATH}assets/audio/hiragana/a.ogg` },
  { kana: 'い', romaji: 'i', audio: `${BASE_PATH}assets/audio/hiragana/i.ogg` },
  { kana: 'う', romaji: 'u', audio: `${BASE_PATH}assets/audio/hiragana/u.ogg` },
  { kana: 'え', romaji: 'e', audio: `${BASE_PATH}assets/audio/hiragana/e.ogg` },
  { kana: 'お', romaji: 'o', audio: `${BASE_PATH}assets/audio/hiragana/o.ogg` },
  { kana: 'か', romaji: 'ka', audio: `${BASE_PATH}assets/audio/hiragana/ka.ogg` },
  { kana: 'き', romaji: 'ki', audio: `${BASE_PATH}assets/audio/hiragana/ki.ogg` },
  { kana: 'く', romaji: 'ku', audio: `${BASE_PATH}assets/audio/hiragana/ku.ogg` },
  { kana: 'け', romaji: 'ke', audio: `${BASE_PATH}assets/audio/hiragana/ke.ogg` },
  { kana: 'こ', romaji: 'ko', audio: `${BASE_PATH}assets/audio/hiragana/ko.ogg` },
  { kana: 'さ', romaji: 'sa', audio: `${BASE_PATH}assets/audio/hiragana/sa.ogg` },
  { kana: 'し', romaji: 'shi', audio: `${BASE_PATH}assets/audio/hiragana/shi.ogg` },
  { kana: 'す', romaji: 'su', audio: `${BASE_PATH}assets/audio/hiragana/su.ogg` },
  { kana: 'せ', romaji: 'se', audio: `${BASE_PATH}assets/audio/hiragana/se.ogg` },
  { kana: 'そ', romaji: 'so', audio: `${BASE_PATH}assets/audio/hiragana/so.ogg` },
  { kana: 'た', romaji: 'ta', audio: `${BASE_PATH}assets/audio/hiragana/ta.ogg` },
  { kana: 'ち', romaji: 'chi', audio: `${BASE_PATH}assets/audio/hiragana/chi.ogg` },
  { kana: 'つ', romaji: 'tsu', audio: `${BASE_PATH}assets/audio/hiragana/tsu.ogg` },
  { kana: 'て', romaji: 'te', audio: `${BASE_PATH}assets/audio/hiragana/te.ogg` },
  { kana: 'と', romaji: 'to', audio: `${BASE_PATH}assets/audio/hiragana/to.ogg` },
  { kana: 'な', romaji: 'na', audio: `${BASE_PATH}assets/audio/hiragana/na.ogg` },
  { kana: 'に', romaji: 'ni', audio: `${BASE_PATH}assets/audio/hiragana/ni.ogg` },
  { kana: 'ぬ', romaji: 'nu', audio: `${BASE_PATH}assets/audio/hiragana/nu.ogg` },
  { kana: 'ね', romaji: 'ne', audio: `${BASE_PATH}assets/audio/hiragana/ne.ogg` },
  { kana: 'の', romaji: 'no', audio: `${BASE_PATH}assets/audio/hiragana/no.ogg` },
  { kana: 'は', romaji: 'ha', audio: `${BASE_PATH}assets/audio/hiragana/ha.ogg` },
  { kana: 'ひ', romaji: 'hi', audio: `${BASE_PATH}assets/audio/hiragana/hi.ogg` },
  { kana: 'ふ', romaji: 'fu', audio: `${BASE_PATH}assets/audio/hiragana/fu.ogg` },
  { kana: 'へ', romaji: 'he', audio: `${BASE_PATH}assets/audio/hiragana/he.ogg` },
  { kana: 'ほ', romaji: 'ho', audio: `${BASE_PATH}assets/audio/hiragana/ho.ogg` },
  { kana: 'ま', romaji: 'ma', audio: `${BASE_PATH}assets/audio/hiragana/ma.ogg` },
  { kana: 'み', romaji: 'mi', audio: `${BASE_PATH}assets/audio/hiragana/mi.ogg` },
  { kana: 'む', romaji: 'mu', audio: `${BASE_PATH}assets/audio/hiragana/mu.ogg` },
  { kana: 'め', romaji: 'me', audio: `${BASE_PATH}assets/audio/hiragana/me.ogg` },
  { kana: 'も', romaji: 'mo', audio: `${BASE_PATH}assets/audio/hiragana/mo.ogg` },
  { kana: 'や', romaji: 'ya', audio: `${BASE_PATH}assets/audio/hiragana/ya.ogg` },
  { kana: 'ゆ', romaji: 'yu', audio: `${BASE_PATH}assets/audio/hiragana/yu.ogg` },
  { kana: 'よ', romaji: 'yo', audio: `${BASE_PATH}assets/audio/hiragana/yo.ogg` },
  { kana: 'ら', romaji: 'ra', audio: `${BASE_PATH}assets/audio/hiragana/ra.ogg` },
  { kana: 'り', romaji: 'ri', audio: `${BASE_PATH}assets/audio/hiragana/ri.ogg` },
  { kana: 'る', romaji: 'ru', audio: `${BASE_PATH}assets/audio/hiragana/ru.ogg` },
  { kana: 'れ', romaji: 're', audio: `${BASE_PATH}assets/audio/hiragana/re.ogg` },
  { kana: 'ろ', romaji: 'ro', audio: `${BASE_PATH}assets/audio/hiragana/ro.ogg` },
  { kana: 'わ', romaji: 'wa', audio: `${BASE_PATH}assets/audio/hiragana/wa.ogg` },
  { kana: 'を', romaji: 'wo', audio: `${BASE_PATH}assets/audio/hiragana/wo.ogg` },
  { kana: 'ん', romaji: 'n', audio: `${BASE_PATH}assets/audio/hiragana/n.ogg` },
];

// Katakana basic set
const KATAKANA = [
  { kana: 'ア', romaji: 'a', audio: `${BASE_PATH}assets/audio/katakana/a.ogg` },
  { kana: 'イ', romaji: 'i', audio: `${BASE_PATH}assets/audio/katakana/i.ogg` },
  { kana: 'ウ', romaji: 'u', audio: `${BASE_PATH}assets/audio/katakana/u.ogg` },
  { kana: 'エ', romaji: 'e', audio: `${BASE_PATH}assets/audio/katakana/e.ogg` },
  { kana: 'オ', romaji: 'o', audio: `${BASE_PATH}assets/audio/katakana/o.ogg` },
  { kana: 'カ', romaji: 'ka', audio: `${BASE_PATH}assets/audio/katakana/ka.ogg` },
  { kana: 'キ', romaji: 'ki', audio: `${BASE_PATH}assets/audio/katakana/ki.ogg` },
  { kana: 'ク', romaji: 'ku', audio: `${BASE_PATH}assets/audio/katakana/ku.ogg` },
  { kana: 'ケ', romaji: 'ke', audio: `${BASE_PATH}assets/audio/katakana/ke.ogg` },
  { kana: 'コ', romaji: 'ko', audio: `${BASE_PATH}assets/audio/katakana/ko.ogg` },
  { kana: 'サ', romaji: 'sa', audio: `${BASE_PATH}assets/audio/katakana/sa.ogg` },
  { kana: 'シ', romaji: 'shi', audio: `${BASE_PATH}assets/audio/katakana/shi.ogg` },
  { kana: 'ス', romaji: 'su', audio: `${BASE_PATH}assets/audio/katakana/su.ogg` },
  { kana: 'セ', romaji: 'se', audio: `${BASE_PATH}assets/audio/katakana/se.ogg` },
  { kana: 'ソ', romaji: 'so', audio: `${BASE_PATH}assets/audio/katakana/so.ogg` },
  { kana: 'タ', romaji: 'ta', audio: `${BASE_PATH}assets/audio/katakana/ta.ogg` },
  { kana: 'チ', romaji: 'chi', audio: `${BASE_PATH}assets/audio/katakana/chi.ogg` },
  { kana: 'ツ', romaji: 'tsu', audio: `${BASE_PATH}assets/audio/katakana/tsu.ogg` },
  { kana: 'テ', romaji: 'te', audio: `${BASE_PATH}assets/audio/katakana/te.ogg` },
  { kana: 'ト', romaji: 'to', audio: `${BASE_PATH}assets/audio/katakana/to.ogg` },
  { kana: 'ナ', romaji: 'na', audio: `${BASE_PATH}assets/audio/katakana/na.ogg` },
  { kana: 'ニ', romaji: 'ni', audio: `${BASE_PATH}assets/audio/katakana/ni.ogg` },
  { kana: 'ヌ', romaji: 'nu', audio: `${BASE_PATH}assets/audio/katakana/nu.ogg` },
  { kana: 'ネ', romaji: 'ne', audio: `${BASE_PATH}assets/audio/katakana/ne.ogg` },
  { kana: 'ノ', romaji: 'no', audio: `${BASE_PATH}assets/audio/katakana/no.ogg` },
  { kana: 'ハ', romaji: 'ha', audio: `${BASE_PATH}assets/audio/katakana/ha.ogg` },
  { kana: 'ヒ', romaji: 'hi', audio: `${BASE_PATH}assets/audio/katakana/hi.ogg` },
  { kana: 'フ', romaji: 'fu', audio: `${BASE_PATH}assets/audio/katakana/fu.ogg` },
  { kana: 'ヘ', romaji: 'he', audio: `${BASE_PATH}assets/audio/katakana/he.ogg` },
  { kana: 'ホ', romaji: 'ho', audio: `${BASE_PATH}assets/audio/katakana/ho.ogg` },
  { kana: 'マ', romaji: 'ma', audio: `${BASE_PATH}assets/audio/katakana/ma.ogg` },
  { kana: 'ミ', romaji: 'mi', audio: `${BASE_PATH}assets/audio/katakana/mi.ogg` },
  { kana: 'ム', romaji: 'mu', audio: `${BASE_PATH}assets/audio/katakana/mu.ogg` },
  { kana: 'メ', romaji: 'me', audio: `${BASE_PATH}assets/audio/katakana/me.ogg` },
  { kana: 'モ', romaji: 'mo', audio: `${BASE_PATH}assets/audio/katakana/mo.ogg` },
  { kana: 'ヤ', romaji: 'ya', audio: `${BASE_PATH}assets/audio/katakana/ya.ogg` },
  { kana: 'ユ', romaji: 'yu', audio: `${BASE_PATH}assets/audio/katakana/yu.ogg` },
  { kana: 'ヨ', romaji: 'yo', audio: `${BASE_PATH}assets/audio/katakana/yo.ogg` },
  { kana: 'ラ', romaji: 'ra', audio: `${BASE_PATH}assets/audio/katakana/ra.ogg` },
  { kana: 'リ', romaji: 'ri', audio: `${BASE_PATH}assets/audio/katakana/ri.ogg` },
  { kana: 'ル', romaji: 'ru', audio: `${BASE_PATH}assets/audio/katakana/ru.ogg` },
  { kana: 'レ', romaji: 're', audio: `${BASE_PATH}assets/audio/katakana/re.ogg` },
  { kana: 'ロ', romaji: 'ro', audio: `${BASE_PATH}assets/audio/katakana/ro.ogg` },
  { kana: 'ワ', romaji: 'wa', audio: `${BASE_PATH}assets/audio/katakana/wa.ogg` },
  { kana: 'ヲ', romaji: 'wo', audio: `${BASE_PATH}assets/audio/katakana/wo.ogg` },
  { kana: 'ン', romaji: 'n', audio: `${BASE_PATH}assets/audio/katakana/n.ogg` },
];

// Dictionary to track user performance on each kana
const userPerformance = new Map();

/**
 * Get a weight for a kana based on user performance
 * Lower weight = higher chance of appearing
 * @param {string} kana - The kana character
 * @param {Object} stats - User performance stats
 * @returns {number} Weight value (0-10)
 */
function getKanaWeight(kana, stats) {
  if (!userPerformance.has(kana)) {
    // First time seeing this kana, high chance
    return 1;
  }

  const performance = userPerformance.get(kana);
  const correctRatio = performance.correct / (performance.attempts || 1);
  
  // Weight algorithm: difficult kanas appear more often
  // 0-3: Very common, 4-7: Medium, 8-10: Rare
  if (correctRatio < 0.3) return 0; // Very difficult, show often
  if (correctRatio < 0.5) return 2;
  if (correctRatio < 0.7) return 4;
  if (correctRatio < 0.9) return 7;
  return 10; // Very easy, show rarely
}

/**
 * Get a pool of kana based on the stage
 * @param {number} stage - Game stage
 * @param {string} kanaType - 'hiragana', 'katakana', or 'both'
 * @returns {Array} Pool of kana for this stage
 */
function getKanaPool(stage, kanaType = 'hiragana') {
  // For simplicity, we'll do some basic stage divisions
  let hiraganaPool = [];
  let katakanaPool = [];
  
  // Hiragana stages
  if (kanaType === 'hiragana' || kanaType === 'both') {
    // Stage 1: Vowels (あいうえお)
    if (stage >= 1) hiraganaPool = hiraganaPool.concat(HIRAGANA.slice(0, 5));
    
    // Stage 2: Add K-row (かきくけこ)
    if (stage >= 2) hiraganaPool = hiraganaPool.concat(HIRAGANA.slice(5, 10));
    
    // Stage 3: Add S-row (さしすせそ)
    if (stage >= 3) hiraganaPool = hiraganaPool.concat(HIRAGANA.slice(10, 15));
    
    // Stage 4: Add T-row (たちつてと)
    if (stage >= 4) hiraganaPool = hiraganaPool.concat(HIRAGANA.slice(15, 20));
    
    // Stage 5: Add N-row (なにぬねの)
    if (stage >= 5) hiraganaPool = hiraganaPool.concat(HIRAGANA.slice(20, 25));
    
    // Stage 6: Add H-row (はひふへほ)
    if (stage >= 6) hiraganaPool = hiraganaPool.concat(HIRAGANA.slice(25, 30));
    
    // Stage 7: Add M-row (まみむめも)
    if (stage >= 7) hiraganaPool = hiraganaPool.concat(HIRAGANA.slice(30, 35));
    
    // Stage 8: Add Y-row (やゆよ)
    if (stage >= 8) hiraganaPool = hiraganaPool.concat(HIRAGANA.slice(35, 38));
    
    // Stage 9: Add R-row (らりるれろ)
    if (stage >= 9) hiraganaPool = hiraganaPool.concat(HIRAGANA.slice(38, 43));
    
    // Stage 10: Add W-row and N (わをん)
    if (stage >= 10) hiraganaPool = hiraganaPool.concat(HIRAGANA.slice(43));
  }
  
  // Katakana stages
  if (kanaType === 'katakana' || kanaType === 'both') {
    // For simplicity, we'll do the same stage divisions for katakana
    // Stage 11: Vowels (アイウエオ)
    if (stage >= 11) katakanaPool = katakanaPool.concat(KATAKANA.slice(0, 5));
    
    // Stage 12: Add K-row (カキクケコ)
    if (stage >= 12) katakanaPool = katakanaPool.concat(KATAKANA.slice(5, 10));
    
    // And so on...
    if (stage >= 13) katakanaPool = katakanaPool.concat(KATAKANA.slice(10, 15));
    if (stage >= 14) katakanaPool = katakanaPool.concat(KATAKANA.slice(15, 20));
    if (stage >= 15) katakanaPool = katakanaPool.concat(KATAKANA.slice(20, 25));
    if (stage >= 16) katakanaPool = katakanaPool.concat(KATAKANA.slice(25, 30));
    if (stage >= 17) katakanaPool = katakanaPool.concat(KATAKANA.slice(30, 35));
    if (stage >= 18) katakanaPool = katakanaPool.concat(KATAKANA.slice(35, 38));
    if (stage >= 19) katakanaPool = katakanaPool.concat(KATAKANA.slice(38, 43));
    if (stage >= 20) katakanaPool = katakanaPool.concat(KATAKANA.slice(43));
  }
  
  return [...hiraganaPool, ...katakanaPool];
}

/**
 * Update the performance record for a kana
 * @param {string} kana - The kana character
 * @param {boolean} wasCorrect - Whether the user got it right
 */
function updatePerformance(kana, wasCorrect) {
  if (!userPerformance.has(kana)) {
    userPerformance.set(kana, { attempts: 0, correct: 0 });
  }
  
  const performance = userPerformance.get(kana);
  performance.attempts += 1;
  if (wasCorrect) {
    performance.correct += 1;
  }
}

/**
 * Get the next kana prompt using a weighted algorithm
 * @param {number} stage - Current game stage
 * @param {Object} stats - User performance stats
 * @returns {Object} Selected kana object {kana, romaji, audio}
 */
export function nextPrompt(stage, stats = {}, kanaType = 'hiragana') {
  // Get the appropriate kana pool for this stage
  const kanaPool = getKanaPool(stage, kanaType);
  
  if (kanaPool.length === 0) {
    console.error('No kana available for stage:', stage);
    return null;
  }
  
  // Calculate weights for each kana
  const weightedPool = kanaPool.map(kana => ({
    ...kana,
    weight: getKanaWeight(kana.kana, stats)
  }));
  
  // Sort by weight (lower weights first)
  weightedPool.sort((a, b) => a.weight - b.weight);
  
  // Get a random kana, biased towards the front of the array
  // Uses a power distribution to favor difficult kana
  const power = 2; // Higher = more focus on difficult kana
  const randomIndex = Math.floor(Math.pow(Math.random(), power) * weightedPool.length);
  
  return weightedPool[randomIndex];
}

// Export functions for external use
export default {
  nextPrompt,
  updatePerformance,
  getKanaPool
};
