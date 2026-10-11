import type { CardVisualLore } from "./visual-lore";

/**
 * 1909 imagery notes in English — the twin of `visual-lore.ts` (ISSUE-055)
 * --------------------------------------------------------------------------
 * ใช้ใน prompt ภาษาอังกฤษ (/en) และแชทต่อภาษาอังกฤษ แทนบันทึกภาษาไทยที่เคยส่งไปพร้อมป้าย "ห้ามคัดลอกคำไทย"
 * และใช้เทียบ `visualAnchor` ของคำอ่านอังกฤษ (`consistency.ts`) — เดิมเทียบกับไทยอย่างเดียว คำอ่านอังกฤษจึงโดนเตือนทุกครั้ง
 *
 * ⚠️ แก้ไฟล์ไทยแล้วต้องแก้ไฟล์นี้ให้ตรงกันเสมอ · ห้ามกุภาพหรือสัญลักษณ์ที่ไม่มีบนไพ่ 1909 จริง
 *    ด่าน `scripts/qa/test-ai-reading-golden.ts` ตรวจว่าครบ 78 ใบ ทุกช่องไม่ว่าง และไม่มีอักษรไทย
 */
export const CARD_VISUAL_LORE_EN: Record<string, CardVisualLore> = {
  // ==========================================
  // MAJOR ARCANA (00 - 21)
  // ==========================================
  "major-00": {
    scene1909: "A young man in a flower-patterned tunic stands at the very edge of a steep cliff, face tilted joyfully to the sky. He holds a white rose and a staff with a small bundle tied to it, while a little white dog leaps beside his feet as if in warning. Icy mountains rise behind him.",
    symbols: ["White rose (pure innocence)", "White dog (instinct that warns and stays loyal)", "Steep cliff (the leap of faith)", "Small bundle (lessons carried from the past)"],
    archetype: "The Innocent / The Divine Child — the newcomer who is ready to begin the adventure",
    shadow: "Carelessness, denying reality, or fear of growing up",
    powerQuestion: "If failure did not exist, what first step would you leap into today?",
  },
  "major-01": {
    scene1909: "A young man in a red robe over white stands tall, his right hand raising a wand to the sky and his left pointing to the earth (as above, so below). An infinity sign floats above his head, and the tools of all four elements lie on the table before him, framed by roses and lilies.",
    symbols: ["Infinity sign (limitless power of mind)", "One hand to the sky, one to the earth (turning intention into reality)", "Tools of the four elements (every resource at hand)", "Red roses and white lilies (desire and pure intention)"],
    archetype: "The Magus / The Alchemist — the one who creates and transforms energy",
    shadow: "Cunning manipulation, smooth-talking deception, or talent without responsibility",
    powerQuestion: "Which resources and abilities are already in your hands that you have not yet put to serious use?",
  },
  "major-02": {
    scene1909: "A woman sits in calm stillness between a black and a white pillar marked B and J. She wears a crown of the triple moon with a crescent moon at her feet, and holds a scroll marked TORA in her lap. Behind her a veil patterned with pomegranates screens off deep blue water.",
    symbols: ["Pillars Boaz and Jachin (duality: conscious and unconscious mind)", "TORA scroll (hidden wisdom)", "Pomegranates and palms (feminine power and hidden abundance)", "Crescent moon (natural cycles and intuition)"],
    archetype: "The High Priestess / The Anima — keeper of secrets and inner knowing",
    shadow: "Emotional coldness, secrets kept until they turn toxic, or getting lost in a world of imagination",
    powerQuestion: "What is the quiet voice of your intuition repeating that you keep pretending not to hear?",
  },
  "major-03": {
    scene1909: "A graceful woman in a robe patterned with pomegranates reclines on red velvet cushions. Her crown bears twelve stars and she holds a sceptre. Beside her throne rests a heart-shaped shield marked with the sign of Venus, and around her lie golden fields of wheat and a waterfall.",
    symbols: ["Crown of twelve stars (the cosmic cycle)", "Golden wheat field (abundance and harvest)", "Venus shield (love and embrace)", "Waterfall and stream (the flow of life and creativity)"],
    archetype: "The Great Mother — the earth mother who gives life and nourishes",
    shadow: "Smothering care, self-indulgence that turns lazy, or neglecting yourself to please others",
    powerQuestion: "Who or what in your life, including yourself, is longing most for gentle care right now?",
  },
  "major-04": {
    scene1909: "An elderly emperor with a white beard sits upright on a stone throne carved with rams' heads. He wears armour beneath a red robe, holds an ankh sceptre in his right hand and a golden orb in his left. Tall red-orange rock mountains rise behind him.",
    symbols: ["Stone throne with rams' heads (Aries: pioneering drive and firm principles)", "Iron armour (readiness and protection)", "Ankh sceptre (life and rightful authority)", "Rocky mountains (rules, structure and clear boundaries)"],
    archetype: "The Emperor / The Father — the founder of order, discipline and leadership",
    shadow: "Tyranny, rigidity, inflexibility, or trying to control everything out of fear",
    powerQuestion: "What boundary or discipline do you need to build to protect your peace and your progress?",
  },
  "major-05": {
    scene1909: "A high priest sits on a sacred throne between stone pillars, wearing a triple crown. His right hand is raised in blessing and his left holds a triple cross. Crossed gold and silver keys lie at his feet, and two followers kneel before him to receive his teaching.",
    symbols: ["Crossed gold and silver keys (keys to worldly and spiritual truth)", "Triple crown and triple cross (mind, spirit and body)", "Twin temple pillars (institutions and established order)", "Two followers (teaching passed on and learned)"],
    archetype: "The Hierophant / The Mentor — the teacher, spiritual guide and keeper of tradition",
    shadow: "Clinging to convention, narrow thinking, blind belief, or judging others by your own standards",
    powerQuestion: "Which inherited belief are you holding that it is time to check against your real life?",
  },
  "major-06": {
    scene1909: "A naked man and woman stand in a beautiful landscape. Behind the woman stands the Tree of Knowledge with a serpent coiled around it; behind the man, the Tree of Life with twelve flames. Above them the angel Raphael spreads purple wings in blessing beneath a golden sun.",
    symbols: ["Angel Raphael (healing and guidance through pure love)", "Tree of Knowledge and the serpent (a moral test and the chance to grow)", "Tree of Life with twelve flames (drive and desire)", "Mountain between them (a relationship that lifts the spirit)"],
    archetype: "The Lovers / The Sacred Union — love, the joining of opposites, and a crossroads of choice",
    shadow: "Wavering between two minds, depending on others until you lose yourself, or betraying your own values",
    powerQuestion: "At the crossroads you face now, which choice best reflects your heart and your true values?",
  },
  "major-07": {
    scene1909: "A young warrior in armour stands in a chariot under a star-patterned canopy, crescent moons on his shoulders. He holds a wand but no reins. A white and a black sphinx crouch before the chariot, and a walled city stands by the river behind him.",
    symbols: ["White and black sphinxes (opposing drives: emotion and reason)", "Wand with no reins (control through willpower and focus)", "Starry canopy (connection to a higher purpose)", "City walls behind (leaving the safe zone to win the goal)"],
    archetype: "The Charioteer / The Hero — the determined warrior who wins through discipline and will",
    shadow: "Aggression, recklessness, arrogance, or trampling others to reach the finish line",
    powerQuestion: "Two forces are pulling at you; how can you steer them toward one goal?",
  },
  "major-08": {
    scene1909: "A gentle young woman in white, garlanded with flowers, calmly closes the jaws of a fierce lion with her bare hands, and the lion yields to her touch. An infinity sign floats above her head over a green meadow.",
    symbols: ["Woman closing the lion's jaws (taming raw instinct with compassion and awareness)", "Infinity sign (endless spiritual strength)", "Flower garland (gentleness that binds what is harsh)", "Red lion (lust, anger and wild instinct)"],
    archetype: "Strength / The Gentle Master — inner strength, compassion, and embracing your instincts",
    shadow: "Bottling up feelings until they explode, timid surrender, or becoming a victim again and again",
    powerQuestion: "Which anger or fear inside you needs no fight at all, only acceptance and calm comfort?",
  },
  "major-09": {
    scene1909: "An old man with a long beard, wrapped in a grey cloak, stands alone on a snowy peak. His right hand raises a lantern holding a shining six-pointed star, his left leans on a staff, and he looks down in quiet calm.",
    symbols: ["Lantern with a six-pointed star (wisdom that lights one step at a time)", "Staff (experience and staying grounded in reality)", "Snowy peak (solitude and a mind lifted above the noise)", "Grey cloak (humility and moving unseen in search of truth)"],
    archetype: "The Hermit / The Wise Old Sage — the solitary seeker of inner truth",
    shadow: "Cutting yourself off from people, bitter loneliness, or believing you are above everyone else",
    powerQuestion: "If you stepped away from the noise for a while, what is the real answer you are searching for inside?",
  },
  "major-10": {
    scene1909: "A great wheel floats in the sky, marked with the letters TARO. A blue sphinx holding a sword sits on top, an orange snake slides down the left side, and a red Anubis carries the wheel up from below. In the four corners, four winged sacred creatures read their books.",
    symbols: ["Turning wheel (the cycle of change; nothing lasts)", "Sphinx still at the top (a centre of awareness amid change)", "Four sacred creatures (the four elements steady while learning the truth)", "Snake and Anubis (falling and rising again)"],
    archetype: "Wheel of Fortune / Destiny — fate, timing and the cycles of life",
    shadow: "Drifting with whatever comes, blaming fate, or panicking when life turns",
    powerQuestion: "In the change beyond your control right now, which attitude can you still fully choose?",
  },
  "major-11": {
    scene1909: "A powerful woman sits on a throne between stone pillars, wearing a red robe and a crown with a square jewel. Her right hand holds a double-edged sword straight up and her left holds golden scales in perfect balance. She looks straight ahead without blinking.",
    symbols: ["Upright sword (judgement through clear truth and reason)", "Balanced scales (weighing consequences and facts)", "Pillars and purple veil (fairness in a sacred space)", "Square jewel in the crown (order and law)"],
    archetype: "Justice / The Objective Arbiter — the fair judge, truth and accountability",
    shadow: "Cold judgement without compassion, following rules until you forget the human side, or fault-finding",
    powerQuestion: "If you set aside every hurt feeling, what is the fair truth of this situation?",
  },
  "major-12": {
    scene1909: "A young man hangs upside down from a T-shaped tree, one leg crossed behind the other to form the figure 4. His face is calm, without suffering, and a bright golden halo shines around his head as if he is awakening.",
    symbols: ["Hanging upside down (seeing the world from the opposite angle)", "Golden halo (insight and spiritual awakening)", "Leaves sprouting on the beam (a sacrifice that brings living growth)", "Legs crossed in a 4 (pausing in order to adjust)"],
    archetype: "The Hanged Man / The Enlightened Surrender — surrender that awakens, and the reversed view",
    shadow: "Feeling like a victim, enduring pain for no purpose, or endless procrastination",
    powerQuestion: "What do you need to let go of, or stop struggling against, so the situation can open up in a new light?",
  },
  "major-13": {
    scene1909: "A skeleton in black armour rides a white horse, carrying a banner with a five-petalled white rose. He passes a fallen king, a kneeling bishop, and a young woman and child who turn to look. Far behind, a golden sun rises between two towers.",
    symbols: ["White horse and black armour (the unavoidable force of renewal)", "Five-petalled white rose (new life after purification)", "Sun between the towers (a new dawn after an ending)", "River behind (a current of change that never flows back)"],
    archetype: "Death / Transformation — shedding the old, closing a cycle, and rebirth",
    shadow: "Clinging to the remains of the past out of fear, denying loss, or holding on to what has already died",
    powerQuestion: "What in your life has run its course, ready to be thanked and truly let go?",
  },
  "major-14": {
    scene1909: "A red-winged angel pours water between two golden cups, one foot on the ground and the other dipped in a clear pool. A triangle within a square marks the chest, and behind, a winding path leads to the mountains where a golden crown of light glows.",
    symbols: ["Water poured between cups (blending and transforming feelings)", "One foot in water, one on land (balance between the unconscious and everyday reality)", "Yellow irises (hope and healing)", "Crown of light on the peak (the highest goal of peace)"],
    archetype: "Temperance / The Inner Alchemist — keeper of balance, moderation and harmony",
    shadow: "Inertia, compromising until you lose your stance, or fear of committing to real action",
    powerQuestion: "How can you blend two things in your life that seem opposite, such as duty and joy, or dreams and reality?",
  },
  "major-15": {
    scene1909: "A goat-horned demon with bat wings perches on a black half-cube altar, holding a torch turned downward. An inverted pentagram marks his forehead. Chained by the neck at the base of the altar stand a naked man and woman, yet the chains are loose enough to lift off with their own hands at any time.",
    symbols: ["Loose chains at the neck (the illusion of slavery that can always be lifted off)", "Bat wings (the dark unconscious that swallows light)", "Inverted torch (desire used in a way that burns you up)", "Black half-cube altar (obsession with the material world)"],
    archetype: "The Devil / The Shadow — the shadow self, false bondage, and the trap of craving",
    shadow: "Addiction, telling yourself you have no choice, or being ruled by fear or dark power",
    powerQuestion: "Which thought or habit do you tell yourself you cannot quit, when in truth you could choose to unlock it now?",
  },
  "major-16": {
    scene1909: "A tall stone tower on a mountain peak is struck by lightning at the top, knocking off its golden crown. Twenty-two drops of flame burst out and two people fall headlong, under a night sky full of dark storm clouds.",
    symbols: ["Lightning strike (a painful truth that breaks through suddenly)", "Falling crown (the ego's collapse and the illusion of being secure)", "Crumbling tower (a false structure built on weak foundations)", "Falling people (release from a self-made prison)"],
    archetype: "The Tower / Sudden Awakening — the collapse of illusion and a sudden waking up",
    shadow: "Stubbornly denying the truth, panic, or trying to repair what should not stay",
    powerQuestion: "Which truth have you been avoiding, and how could accepting it help you build a life on firm ground?",
  },
  "major-17": {
    scene1909: "A naked young woman kneels at the edge of a pool, pouring water from two jugs onto the land and into the water. Above her shines a great eight-pointed yellow star surrounded by seven smaller white stars, and a red ibis perches in a tree behind her.",
    symbols: ["Eight-pointed star (a guiding light of faith and connection to the universe)", "Two streams of water (nourishing the conscious and unconscious mind)", "Naked woman (sincerity without masks, and purity)", "Ibis (the wisdom that restores the mind)"],
    archetype: "The Star / The Hope Bringer — a spark of hope, faith and spiritual healing",
    shadow: "Empty hopes, dreaming without doing, or despair so deep you cannot see the light",
    powerQuestion: "What simple, pure hope in your heart still shines even on your darkest days?",
  },
  "major-18": {
    scene1909: "A full moon with a pensive face sheds drops of dew. Below, a wolf and a dog howl at it, and a crayfish crawls out of a deep pool onto a winding path that runs between two towers toward distant mountains.",
    symbols: ["Wolf and dog (wild instinct and the tame side of human nature)", "Crayfish rising from the water (fears and hidden knots surfacing from the unconscious)", "Twin towers (a gateway to unfamiliar ground)", "Pensive moon face (uncertainty and illusion)"],
    archetype: "The Moon / The Subconscious Abyss — twilight, fear, imagination and illusion",
    shadow: "Paranoia, imagining the worst, illusions, or getting lost in pointless worry",
    powerQuestion: "Is the fear you feel right now something that has really happened, or a shadow your mind is projecting?",
  },
  "major-19": {
    scene1909: "A smiling naked child rides a white horse, wearing a wreath of flowers and a red feather, and waves a large flame-red banner. Behind him a stone wall is topped with four bright yellow sunflowers, and a great sun pours down warm light.",
    symbols: ["Child on a white horse (pure joy and full awakening)", "Four sunflowers (the abundance of the four elements, and delight)", "Red banner (life force and vitality)", "Stone wall (moving beyond past limits)"],
    archetype: "The Sun / Divine Radiance — brightness, success, sincerity and vitality",
    shadow: "Optimism that turns careless, vanity, or refusing to see anything negative",
    powerQuestion: "What small thing makes your heart feel most joyful and alive today?",
  },
  "major-20": {
    scene1909: "The angel Gabriel leans from the clouds blowing a great golden trumpet hung with a red-cross banner. Below, a man, a woman and a child rise from grey coffins with arms open wide, set against blue icy mountains.",
    symbols: ["Golden trumpet (the call to awaken from sleep)", "People rising from coffins (coming back to life, released from the past)", "Open arms (accepting forgiveness and cleansing)", "Icy mountains (a truth that cannot be avoided)"],
    archetype: "Judgement / The Calling — a great awakening, forgiveness, and answering life's call",
    shadow: "Harsh judgement of yourself and others, guilt that eats away at you, or ignoring warnings",
    powerQuestion: "If you could forgive your past mistakes completely, what new life would you choose?",
  },
  "major-21": {
    scene1909: "A young woman dances inside a green laurel wreath tied with red ribbons in the shape of infinity, holding a wand in each hand. In the four corners, the four sacred creatures (a human, an eagle, a lion and a bull) rest on clouds.",
    symbols: ["Laurel wreath (victory and a cycle made whole)", "Dancing woman (peaceful joy and oneness with the universe)", "Two wands (creative power in two worlds)", "The four creatures (the sacred balance of the four elements)"],
    archetype: "The World / Wholeness — complete success, reaching the goal, and a door to a new stage",
    shadow: "Feeling never good enough, fear of closing one chapter to begin the next, or being stuck in perfectionism",
    powerQuestion: "Which important life lesson have you fully completed, ready to step proudly into your next chapter?",
  },

  // ==========================================
  // SUIT OF WANDS
  // ==========================================
  "wands-01": {
    scene1909: "A hand reaches out of a white cloud gripping a wand that is sprouting fresh green leaves, while a few loose leaves drift down through the air. Below lies a landscape with a castle on a hilltop and a winding river.",
    symbols: ["Hand from the cloud (an opportunity or spark of an idea handed down from above)", "Fresh sprouting leaves (a beginning full of life)", "Hilltop castle (the highest goal, waiting to be reached)", "A single wand (focused, undivided energy)"],
    archetype: "The Spark of Creation — the first flame of a beginning and pure inspiration",
    shadow: "A fire that burns out fast, starting without following through, or falling for ideas without acting on them",
    powerQuestion: "Which new spark or idea has just caught fire in you, and what is the very first thing you will do for it?",
  },
  "wands-02": {
    scene1909: "A man in a red cap and robe stands on the battlements of a castle, holding a small globe in his right hand and a wand in his left. A second wand is fixed to the wall by an iron ring, and his gaze travels across a wide sea to distant mountains.",
    symbols: ["Globe in his hand (vision and seeing the bigger picture)", "Two wands (security in the present and plans for the future)", "Roses and lilies carved on the wall (commitment and intention)", "Gaze into the distance (planning the next step)"],
    archetype: "The Planner / The Visionary — the strategist choosing a direction for the future",
    shadow: "Staying stuck in the comfort zone, fear of leaving the tower, or hesitating too long to decide",
    powerQuestion: "A wide world is waiting ahead of you — what must you step past to make your life bigger?",
  },
  "wands-03": {
    scene1909: "A man stands with his back to us on a cliff edge, looking out over a wide sea where ships are sailing. He grips one wand while two more stand planted in the ground beside him, under a bright golden sky.",
    symbols: ["Ships on the sea (waiting for results and partners far away)", "Three wands (a firm base and room to expand)", "Back turned to us (sending energy out into the wider world)", "Golden sky (hope and success that are on their way)"],
    archetype: "The Pioneer / Expansion — breaking new ground, widening horizons, and waiting for results",
    shadow: "Restless impatience, expanding faster than you can carry, or leaning too much on others",
    powerQuestion: "You have already sown the seeds of an opportunity — how are you preparing to receive what comes back?",
  },
  "wands-04": {
    scene1909: "A garland of flowers and fruit hangs between four wands planted in the ground. Two figures raise bouquets of flowers in welcome, and more people celebrate in front of a grand castle behind them.",
    symbols: ["Four-wand garland (a firm structure, happiness and safety)", "Raised bouquets (celebrating success together)", "Castle behind (home, community and warmth)", "Fruit and flowers (sweet results)"],
    archetype: "Celebration / Homecoming — festivity, a secure home, and peaceful happiness",
    shadow: "Getting so comfortable in happiness that growth stops, or tension hidden behind smiles",
    powerQuestion: "Which success or joy deserves a pause so you can admire it and celebrate yourself?",
  },
  "wands-05": {
    scene1909: "Five young men in clothes of different colours brandish wands at one another in a messy tussle, each holding his wand at a different angle. It looks less like a fight to the death and more like a contest or a clash of wills.",
    symbols: ["Wands pointing five ways (disagreement and jostling for position)", "Clothes of different colours (different ideas and egos)", "A fight with no bloodshed (a contest of ideas that keeps you sharp)", "Uneven ground (small obstacles)"],
    archetype: "The Competitor / Creative Friction — competition, conflict, and the push that comes from a challenge",
    shadow: "Fighting to win for the ego's sake, pointless chaos, or wasting energy on arguments",
    powerQuestion: "Is the conflict around you right now something you must win, or a chance to sharpen your thinking?",
  },
  "wands-06": {
    scene1909: "A young rider wearing a laurel wreath rides a white horse proudly through a crowd. He carries a wand topped with another laurel wreath, the horse is draped in green cloth, and the people around him raise their wands in celebration.",
    symbols: ["Laurel wreaths on his head and wand (victory, recognition and honour)", "White horse (a clear mind and graceful forward drive)", "Cheering crowd (public recognition)", "Eyes looking ahead (self-respect and pride)"],
    archetype: "The Victor / Public Acclaim — the winner, recognition, and moving forward",
    shadow: "Arrogance, getting hooked on praise and fame, or fear of losing your standing",
    powerQuestion: "How will you use the victory you have earned to inspire other people?",
  },
  "wands-07": {
    scene1909: "A young man stands his ground on a high hilltop wearing two mismatched shoes. He grips one wand with both hands to fend off six other wands rising up at him from below.",
    symbols: ["Standing on high ground (an advantage and a rightful position)", "Mismatched shoes (caught off guard and defending in a hurry)", "Six wands from below (pressure and competition from every side)", "Determined face (refusing to give up)"],
    archetype: "The Defender / Courageous Stand — holding your position and defending it with courage",
    shadow: "Feeling ganged up on, exhaustion from keeping your guard up all the time, or stubbornly refusing to listen",
    powerQuestion: "Which position or value matters enough to you that you would stand and fight for it?",
  },
  "wands-08": {
    scene1909: "Eight wands fly in parallel at great speed across an open sky, above green fields, a stream and rolling hills. Their tips point neatly down toward the ground, as if about to land.",
    symbols: ["Eight wands in flight (speed, news and swift movement)", "Cloudless sky (an open path with nothing in the way)", "Fields and stream (a goal about to land in reality)", "All pointing the same way (focus that does not scatter)"],
    archetype: "Swift Movement / Rapid Alignment — speed, quick news, and racing toward the goal",
    shadow: "Rushing in a panic, deciding without thinking it through, or mixed messages born of speed",
    powerQuestion: "As things race forward around you, are you clear-headed enough to respond in time?",
  },
  "wands-09": {
    scene1909: "A man with a bandage around his head grips a wand and watches warily. Behind him eight more wands stand in a row like a protective fence, and he keeps his eyes ahead, taking nothing for granted.",
    symbols: ["Bandaged head (wounds from past battles and lessons remembered)", "Fence of eight wands (protection and experience)", "Wary look (tired, yet ready for one last round)", "Leaning on his wand (endurance stretched to the limit)"],
    archetype: "The Resilient Warrior — the tough fighter holding on through the final stretch",
    shadow: "Suspicion beyond what the situation calls for, a guard so high it shuts you in, or stress piling up until you are nearly spent",
    powerQuestion: "The finish line is only a little further — what will give you the heart for this last stretch?",
  },
  "wands-10": {
    scene1909: "A man bends forward under the weight of ten heavy wands clutched in both arms, so loaded that he can barely see the way ahead. He trudges toward a town or house that is not far off.",
    symbols: ["Carrying ten wands (work, responsibility and pressure beyond your strength)", "Unable to see ahead (so buried in the load that the real goal is forgotten)", "Town ahead (the goal is within reach)", "Bent back (tiredness of body and mind)"],
    archetype: "The Overburdened / The Heavy Load — a crushing load, too many responsibilities, and carrying it all",
    shadow: "Refusing to share the work, wanting to be the lone hero, or burnout",
    powerQuestion: "What load are you carrying alone that you don't need to, or that it is time to hand to someone else?",
  },
  "wands-11": {
    scene1909: "A young man in a tunic patterned with salamanders and a hat with a red feather stands holding a wand, studying its tip with eager attention. Behind him stretch a desert and pyramids.",
    symbols: ["Salamander tunic (a fiery, lively spirit)", "Red feather in the hat (determination and big dreams)", "Eyes fixed on the wand (eagerness to learn)", "Pyramids behind (curiosity about ancient things, or a great goal)"],
    archetype: "Page of Wands / The Enthusiastic Learner — the messenger of fire, curiosity, and starting to explore",
    shadow: "Impatience, self-centredness, or getting excited about something new and bored soon after",
    powerQuestion: "Which news or new opportunity is setting your heart alight with excitement again?",
  },
  "wands-12": {
    scene1909: "A young knight in armour, wearing a tunic patterned with salamanders, rides a rearing orange-red horse that lunges forward at speed. He holds his wand up, ready to charge, his plume and cloak streaming behind him, with pyramids in the desert beyond.",
    symbols: ["Rearing orange-red horse (bold, fierce drive)", "Salamander tunic (passion and hunger for success)", "Lunging forward (acting at once)", "Desert (heat and a field of trial)"],
    archetype: "Knight of Wands / The Bold Adventurer — the daring pioneer, enthusiasm, and charging ahead",
    shadow: "Reckless impatience, carelessness, a hot temper, or leaving damage behind",
    powerQuestion: "Are you rushing at your goal so fast that you forget to look at the details around you?",
  },
  "wands-13": {
    scene1909: "A queen sits openly and confidently on a throne carved with lions, holding a wand in her right hand and a golden sunflower in her left. A small black cat sits calmly at her feet, with warm hills behind her.",
    symbols: ["Sunflower (joy, self-confidence and warmth)", "Black cat at her feet (instinct, a mysterious charm, and knowing the shadow side)", "Lions carved on the throne (courage and dignity)", "Open posture (sincerity and natural charm)"],
    archetype: "Queen of Wands / The Charismatic Creator — the queen of charm, confidence, warmth and creative power",
    shadow: "Demanding attention, jealousy, or taking over with dramatic emotions",
    powerQuestion: "How can you bring out your own confidence and charm so it lights up the people around you?",
  },
  "wands-14": {
    scene1909: "A king sits on a throne carved with lions and salamanders biting their own tails, wearing a flame-shaped crown and a cloak with the same salamander pattern. He holds a wand in his right hand and looks steadily into the future, while a small salamander rests beside the throne.",
    symbols: ["Salamanders biting their tails (fire mastered with skill)", "Flame-shaped crown (leadership with vision)", "Salamander cloak (the presence and warmth of authority)", "Steady gaze (looking far ahead and deciding firmly)"],
    archetype: "King of Wands / The Visionary Leader — the leader with vision, presence, decisiveness and strong drive",
    shadow: "Domineering, impatient, unable to bear people who move more slowly, or forcing everyone to revolve around him",
    powerQuestion: "As the leader of your own life, how will you inspire others and give them a clear direction they can trust?",
  },

  // ==========================================
  // SUIT OF CUPS
  // ==========================================
  "cups-01": {
    scene1909: "A hand reaches out of a cloud holding a large golden cup that overflows in five streams into a pool covered with water lilies. A white dove carrying a wafer marked with a cross dives down toward the cup, and drops of water fall like rain.",
    symbols: ["Golden cup overflowing in five streams (the five senses and love brimming over)", "Dove with the wafer (peace and love from above)", "Water lilies in the pool (purity and emotional awakening)", "Falling drops (a blessing pouring down)"],
    archetype: "Ace of Cups / The Vessel of Love — the source of love, pure feeling, and opening the heart",
    shadow: "Emotions overflowing until judgement slips, getting lost in fantasy, or emotional fragility",
    powerQuestion: "Are you ready to open your heart to the good feelings and love that are flowing into your life?",
  },
  "cups-02": {
    scene1909: "A man and a woman face each other, each holding out a golden cup to the other. Above their cups floats the staff of Hermes (the Caduceus) crowned with a winged red lion's head, and behind them stand a house and green hills.",
    symbols: ["Exchanging cups (equality, sharing feelings, and sincerity)", "Caduceus with the lion's head (healing and a powerful meeting of hearts)", "Eyes meeting (understanding without words)", "House on the hill (security in the relationship)"],
    archetype: "Two of Cups / The Soul Connection — deep friendship, mutual understanding, and a kindred soul",
    shadow: "Leaning on each other emotionally too much, or fearing conflict so much that the truth goes unsaid",
    powerQuestion: "Which relationship in your life needs honest, open-hearted words to bring you closer?",
  },
  "cups-03": {
    scene1909: "Three young women in brightly coloured dresses raise their golden cups together in a joyful circle, surrounded by flowers, bunches of grapes and a rich harvest of fruit and plants.",
    symbols: ["Three cups raised together (togetherness, friendship and celebrating success)", "Grapes and fruit (results and happiness that are growing)", "Dancing in a circle (equality and shared joy)", "Bright smiles (the good energy of true friends)"],
    archetype: "Three of Cups / Community & Sisterhood — friendship, celebrating together, and healing within a group",
    shadow: "Gossip, a third person stepping in, or partying until work and duties slide",
    powerQuestion: "Who are the true friends who support you sincerely, and have you given that love back to them?",
  },
  "cups-04": {
    scene1909: "A young man sits under a large tree with his arms folded, looking bored and indifferent. Three cups stand on the grass in front of him, and a hand from a cloud offers him a fourth cup, but he does not look at it.",
    symbols: ["Folded arms (a closed heart and boredom)", "Fourth cup from the cloud (an unexpected new opportunity being overlooked)", "Three cups on the grass (what you already have, which has lost its thrill)", "Base of the great tree (staying still in the comfort zone)"],
    archetype: "Four of Cups / Contemplation & Apathy — boredom, missed opportunities, and sinking into your own feelings",
    shadow: "Blaming fate, shutting yourself in, or being unsatisfied with what you already have",
    powerQuestion: "What opportunity or good thing is being offered right in front of you that you keep overlooking because you are stuck in boredom?",
  },
  "cups-05": {
    scene1909: "A figure in a black cloak stands with head bowed, mourning over three cups that have spilled onto the ground, without turning to see the two cups still standing upright behind. In the distance a bridge crosses a river toward a safe castle.",
    symbols: ["Three spilled cups (loss, regret and past disappointment)", "Two upright cups behind (what is still precious and the hope that remains)", "Black cloak (mourning and sorrow)", "Bridge over the river (a way out and a link to a new beginning)"],
    archetype: "Five of Cups / Grief & Lingering Regret — sorrow, regret, and being stuck in the past",
    shadow: "Dwelling on what was lost until you cannot see what remains, or casting yourself as the loser forever",
    powerQuestion: "Are you ready to turn away from the spilled cups, pick up the two that remain, and cross the bridge?",
  },
  "cups-06": {
    scene1909: "A small boy gently hands a golden cup filled with white five-pointed flowers to a little girl, in the garden of an old house or castle that feels warm and safe. In the background a guard walks away.",
    symbols: ["Giving a cup of flowers (innocence, childhood memories and a pure heart)", "Old castle (security in the past and your roots)", "White flowers in the cup (kind feelings with no harm in them)", "Guard walking away (safety that is being protected)"],
    archetype: "Six of Cups / Sweet Nostalgia — childhood memories, warmth from the past, and a return to innocence",
    shadow: "Longing for the past so much that you will not grow, being stuck in yesterday, or being so naive that you are easily fooled",
    powerQuestion: "Which good memory or simple childhood joy could you bring back to refill your heart today?",
  },
  "cups-07": {
    scene1909: "A man, seen from behind and in shadow, stands stunned before seven golden cups floating on clouds. Each cup holds something different: a human head, a castle, jewels, a laurel wreath, a dragon, a snake, and a glowing veiled figure.",
    symbols: ["Seven cups in the clouds (illusion, too many choices, and a wandering imagination)", "What fills the cups (fame, power, desire, fear and illusion)", "Standing in shadow (confusion over what to choose)", "Floating clouds (nothing yet solid)"],
    archetype: "Seven of Cups / Illusion & Wishful Thinking — illusion, daydreams, and confusing choices",
    shadow: "Flitting between things, building castles in the air, escaping reality, or never daring to choose one path",
    powerQuestion: "Among all these choices and dreams, which one is real and within reach — not just a picture you have painted?",
  },
  "cups-08": {
    scene1909: "A man in a red cloak, staff in hand, walks away from eight golden cups stacked neatly behind him. He heads up into rugged rocky mountains at night, under a moon that shows a crescent and a full moon together.",
    symbols: ["Turning his back on eight cups (the courage to leave something good that is no longer the soul's goal)", "Climbing the rocky mountain (the hard journey to find inner truth)", "Crescent and full moon together (seeing the truth more deeply)", "Red cloak (courage to start again)"],
    archetype: "Eight of Cups / Walking Away — leaving the old behind to search for deeper meaning",
    shadow: "Running from problems, abandoning duties out of boredom, or drifting from one feeling to the next",
    powerQuestion: "What do you know deep down that it is time to walk away from, so you can go toward a life of real worth?",
  },
  "cups-09": {
    scene1909: "A stout, well-dressed man in a red cap sits on a wooden bench with his arms folded and a satisfied smile. Behind him nine golden cups stand in a neat arc on a counter draped with blue cloth.",
    symbols: ["Folded arms and a satisfied smile (wishes fulfilled, self-satisfaction and contentment)", "Nine cups in a neat row (wishes that have come true in full)", "Blue cloth (peace of mind)", "Fine clothes (emotional and material wealth)"],
    archetype: "Nine of Cups / The Wish Card — wishes fulfilled, a happy heart, and contentment",
    shadow: "Self-absorption, selfishness, indulging in comfort, or not sharing",
    powerQuestion: "How many of the things you once wished for have come true, and have you fully appreciated what you have now?",
  },
  "cups-10": {
    scene1909: "A couple stands with their arms around each other, each raising a hand toward a rainbow of ten shining golden cups. Two children dance happily beside them, in front of a house by a river and green meadows.",
    symbols: ["Rainbow with ten cups (true peace, emotional fulfilment and a blessing)", "Embracing family (steady love and a real bond)", "Two dancing children (pure joy passed from one generation to the next)", "House by the river (peace in a shared life)"],
    archetype: "Ten of Cups / Emotional Wholeness — family happiness, pure love, and emotional fulfilment",
    shadow: "Painting a happy-family picture to cover up problems, or holding relationships to impossibly high ideals",
    powerQuestion: "What does 'true happiness' mean in your heart, and how are you building it with the people you love?",
  },
  "cups-11": {
    scene1909: "A young man in a tunic patterned with water flowers stands by the sea, holding a golden cup from which a small fish pokes its head out and looks back at him. Behind him the waves roll gently.",
    symbols: ["Fish rising from the cup (a message from the subconscious, a creative idea arriving unexpectedly)", "Flower-patterned tunic (an open, pure heart)", "The fish looking back (connecting with intuition)", "Gentle waves (feelings starting to stir)"],
    archetype: "Page of Cups / The Gentle Dreamer — the messenger of the heart, creative ideas, and innocent love",
    shadow: "Being overly sensitive, daydreaming instead of facing reality, or emotional self-indulgence",
    powerQuestion: "Which loving message or creative inspiration is rising up to greet you right now?",
  },
  "cups-12": {
    scene1909: "A young knight in armour, with a tunic patterned with fish and a winged helmet like that of Hermes, rides a grey horse that steps forward slowly and gracefully. He holds a golden cup out before him with care, and a stream flows gently ahead.",
    symbols: ["Offering the golden cup (offering love, an apology, or a heartfelt proposal)", "Calmly walking horse (gentleness, no rush, emotional steadiness)", "Winged helmet (imagination and delicate communication)", "Stream and river (the flow of feeling)"],
    archetype: "Knight of Cups / The Romantic Messenger — the romantic knight, messenger of love, and chaser of dreams",
    shadow: "A dreamer who never acts, a fickle charmer, or a romantic picture that is not real",
    powerQuestion: "Which feeling or message from your heart should you be brave enough to hand to someone important in your life?",
  },
  "cups-13": {
    scene1909: "A queen sits on a throne by the sea carved with water nymphs and a shell. She holds an ornate golden cup with a closed lid in both hands and gazes into it deeply, while the water laps at the shore by her feet.",
    symbols: ["Closed, lidded cup (feelings and intuition too deep to put into words)", "Throne of water nymphs (being at one with the subconscious)", "Feet at the water's edge (sensing emotions directly)", "Focused gaze (reflecting and listening to her own heart)"],
    archetype: "Queen of Cups / The Intuitive Empath — the queen of intuition, compassion and spiritual warmth",
    shadow: "Carrying other people's feelings until you drown in them, emotional swings, or quietly sulking",
    powerQuestion: "Have you set boundaries that protect your heart's energy from being swallowed by other people's emotions?",
  },
  "cups-14": {
    scene1909: "A king sits on a stone throne floating on a rough sea, wearing a blue robe and a fish-shaped pendant. He holds a golden cup in his right hand and a short sceptre in his left, while a dolphin leaps on one side and a ship sails by on the other.",
    symbols: ["Throne on a rough sea (staying calm and in control of feelings in the middle of a storm)", "Leaping dolphin (intelligence and emotional awareness)", "Sceptre and cup (balance between authority and kindness)", "Calm face (deep emotional maturity)"],
    archetype: "King of Cups / The Emotional Sovereign — the king of emotional steadiness, composure and compassion",
    shadow: "Bottling up feelings until you turn cold, using psychology to manipulate others, or quietly holding grudges",
    powerQuestion: "With so much turmoil around you, how will you keep calm and kindness in your heart?",
  },

  // ==========================================
  // SUIT OF SWORDS
  // ==========================================
  "swords-01": {
    scene1909: "A hand reaches out of a white cloud gripping a great sword that points straight up. A golden crown rests on its tip, hung with an olive branch and a palm frond, and jagged rocky mountains lie below.",
    symbols: ["Sword pointing straight up (truth, decisiveness and the power of the mind)", "Golden crown on the tip (reason winning over confusion)", "Olive branch and palm (peace and success that come from clarity)", "Jagged mountains (a truth that will not compromise)"],
    archetype: "Ace of Swords / The Breakthrough of Truth — a flash of clarity, a decisive truth, and cutting away what isn't needed",
    shadow: "Sharpness without compassion, cutting words that wound, or thinking that is far too rigid",
    powerQuestion: "Which truth do you need the courage to accept and say out loud to set your life free?",
  },
  "swords-02": {
    scene1909: "A blindfolded woman in a white robe sits on a stone bench by a quiet sea, holding two swords crossed over her chest in a balanced, guarded pose. A crescent moon hangs in the sky above her.",
    symbols: ["Blindfold (shutting out the world to listen within, or refusing to look at the truth)", "Two crossed swords (stuck between two choices you can't pick between)", "Stone bench by the sea (holding feelings still to keep a fragile balance)", "Crescent moon (a reflection of uncertainty)"],
    archetype: "Two of Swords / The Stalemate — deadlock, hesitation, and refusing to decide",
    shadow: "Avoiding the truth, pretending not to see the problem, or staying passive until the situation gets worse",
    powerQuestion: "Which decision are you putting off — and if you took off the blindfold, what truth would you see?",
  },
  "swords-03": {
    scene1909: "A large red heart floats in the air, pierced through by three swords, against a sky dark with storm clouds and heavy, pouring rain.",
    symbols: ["Heart pierced by three swords (the pain of betrayal, disappointment, and a truth that cuts deep)", "Dark clouds and rain (washing sorrow out of the heart)", "Heart hanging in the sky (pain that has to be faced and cannot be hidden)", "Symmetry of the swords (learning from a sharp truth)"],
    archetype: "Three of Swords / The Pierced Heart — the pain of truth, heartbreak, and cleansing through honesty",
    shadow: "Clinging to the pain, hurting yourself over and over, or a gloomy view that shuts out love",
    powerQuestion: "Which wound in your heart is it time to let the rain wash away, so the heart has room to heal?",
  },
  "swords-04": {
    scene1909: "The carved figure of a knight lies peacefully on a stone tomb in a church, hands joined in prayer. Three swords hang on the wall above him and a fourth is carved along the side of the tomb, while a stained-glass window shows a haloed figure blessing a kneeling supplicant.",
    symbols: ["Knight at rest with joined hands (a truce, resting mind and body after battle)", "Three swords on the wall (problems hung up for now)", "Sword beneath (ready to be taken up again when the time is right)", "Stained-glass window (healing through stillness and peace)"],
    archetype: "Four of Swords / Sanctuary & Recovery — a truce, meditation, and getting your clarity back",
    shadow: "Endlessly avoiding problems, idleness, or hiding away in isolation instead of returning to real life",
    powerQuestion: "In which part of your life are your body and mind asking for real rest?",
  },
  "swords-05": {
    scene1909: "A young man with a mocking smile gathers up swords — three in his hands, two more left on the ground — and looks toward two men walking away with heads bowed in defeat. Ragged clouds race across a windy sky.",
    symbols: ["Mocking smile (a hollow win: winning the fight but losing people's hearts)", "Swords left on the ground (losses on both sides)", "Two men walking away (division and bitterness)", "Windblown clouds (a toxic atmosphere)"],
    archetype: "Five of Swords / Hollow Victory — an empty win, a conflict no one wins, and ego that wrecks relationships",
    shadow: "Needing to win so badly that friendships break, attacking behind people's backs, or being unable to accept defeat",
    powerQuestion: "In this argument, is the victory you want worth the relationship you might lose?",
  },
  "swords-06": {
    scene1909: "A ferryman poles a boat carrying a cloaked woman and child across a river, from choppy water toward calm water and a safe shore. Six swords stand upright in the boat.",
    symbols: ["Six swords in the boat (taking your lessons and mental baggage with you)", "Choppy water to calm water (moving from turmoil toward peace)", "Cloaked figures (slowly recovering from heartache)", "Boat heading for shore (travelling toward something better)"],
    archetype: "Six of Swords / The Passage to Calmer Waters — transition, getting through a hard time, and recovery",
    shadow: "Taking old problems with you, sorrow not yet let go, or fear of change",
    powerQuestion: "What turmoil are you travelling away from, and are you ready to accept the calm of the new shore?",
  },
  "swords-07": {
    scene1909: "A man tiptoes quietly away from a military camp, five swords bundled in his arms, while two more stay planted in the ground behind him. He glances back over his shoulder warily.",
    symbols: ["Sneaking off with five swords (surviving by wits, secrecy, or a strategy outside the rules)", "Two swords left behind (not completing it 100%, or having to give something up)", "Walking on tiptoe (actions that cannot be done in the open)", "Camp behind (the system and rules being dodged)"],
    archetype: "Seven of Swords / The Strategic Escape — cleverness, unconventional strategy, and evasion",
    shadow: "Deception, dishonesty, betrayal, or trying to cut corners in ways that aren't right",
    powerQuestion: "What responsibility are you trying to sneak away from, or what should you face head-on?",
  },
  "swords-08": {
    scene1909: "A blindfolded woman, her arms loosely bound, stands surrounded by eight swords planted in the ground, with mud and pools of water at her feet and a castle on a rocky height behind her. Her feet are not tied and the way ahead is open.",
    symbols: ["Blindfold and loose ropes (the prison is really made by your own thinking)", "Eight swords all around (limiting beliefs and self-made fears)", "Open way ahead (there is always a way out if you dare to step)", "Mud (feeling emotionally stuck)"],
    archetype: "Eight of Swords / Self-Imposed Prison — a trap of the mind, feeling like a victim, and fears that aren't real",
    shadow: "Acting helpless, blaming your surroundings, and refusing to see that you are free to walk away",
    powerQuestion: "Which limit have you built to hold yourself in, and what first step would take you out of that way of thinking?",
  },
  "swords-09": {
    scene1909: "A woman sits up in bed in the dark, her face buried in her hands. Nine swords lie horizontally across the black wall above her, and her quilt is patterned with roses and astrological signs.",
    symbols: ["Face in her hands in bed (worry, nightmares and fears that grow in the mind at night)", "Nine swords on the wall (racing thoughts that keep stabbing at the mind)", "Quilt of astrological signs (suffering tied to fate and awakening)", "Darkness (fear that feels bigger than it is in the silence)"],
    archetype: "Nine of Swords / The Dark Night of the Mind — anxiety, and fears the mind has made up",
    shadow: "Thoughts looping until panic sets in, or inventing bad things in your head that haven't happened",
    powerQuestion: "How much of the worry keeping you awake is actually true, and how can you stop tormenting yourself?",
  },
  "swords-10": {
    scene1909: "A man lies face down by the shore with ten swords driven into his back, a red cloth draped over him. The sky above is pitch black, but along the horizon a golden dawn is breaking over still water.",
    symbols: ["Ten swords driven in (the very bottom of the problem: nothing can get worse than this)", "Golden light on the horizon (the dawn of a new start, the end of a long night)", "Still water (calm after a great storm)", "Red cloth (dignity that remains)"],
    archetype: "Ten of Swords / Rock Bottom & The Dawn — the lowest point, the end of suffering, and the dawn of a new beginning",
    shadow: "Staying in the role of the victim, permanent hopelessness, or turning small things into life-or-death matters",
    powerQuestion: "If this really is the lowest point, what small step could help you stand up and meet the coming dawn?",
  },
  "swords-11": {
    scene1909: "A nimble young man stands on rough, uneven ground, holding a sword up in both hands, ready for action, and glancing warily to one side. Wind-torn clouds fill the sky and birds wheel overhead.",
    symbols: ["Sword raised in both hands (a quick mind, curiosity and readiness to respond)", "Glancing sideways (caution and an eye for spotting faults)", "Windy clouds and birds (fast thoughts and news blowing in)", "Hair blown by the wind (youthful eagerness)"],
    archetype: "Page of Swords / The Inquisitive Mind — the messenger of ideas, curiosity, and searching for the truth",
    shadow: "Nosiness, fault-finding, sharp words, or jumping to conclusions",
    powerQuestion: "Which information or truth should you check carefully before you believe it or decide?",
  },
  "swords-12": {
    scene1909: "A knight in armour charges forward at full speed on a white horse, sword raised high as if to strike, through a storm whose wind drives the clouds and bends the trees.",
    symbols: ["Horse charging at full speed (determination that lets nothing stand in the way, charging in without a second thought)", "Sword pointing forward (a sharp, decisive goal)", "Storm wind (urgency and a tense atmosphere)", "Hard steel armour (blunt, uncompromising logic)"],
    archetype: "Knight of Swords / The Fierce Intellect — the warrior of the mind, decisiveness, speed, and charging at the goal",
    shadow: "Aggression, cutting words that hurt, impatience without compassion, or rashness",
    powerQuestion: "Is your decisiveness solving the problem, or hurting the people around you without your noticing?",
  },
  "swords-13": {
    scene1909: "A queen sits upright on a throne carved with butterflies and a winged cherub's head. Her right hand holds a sword straight up and her left hand reaches forward as if inviting or passing judgement. A single bird flies in a sky of low clouds.",
    symbols: ["Sword pointing straight up (fairness, clear reason, and cutting through illusion)", "Outstretched left hand (openness to the truth and straight talk)", "Butterflies on the throne (a change of mind and understanding)", "Sharp expression (wisdom that has come through painful experience)"],
    archetype: "Queen of Swords / The Clear Thinker — the queen of clarity, sharp insight, honesty and awareness",
    shadow: "Coldness, a sharp tongue, defensive walls no one can get past, or logic so strict it leaves no room for the heart",
    powerQuestion: "What in your life do you need to cut away with clear reason and resolve to keep your peace of mind?",
  },
  "swords-14": {
    scene1909: "A king sits on a stone throne with commanding presence, wearing a purple cloak over a blue robe. He holds an upright sword firmly in his right hand and looks straight ahead with a searching gaze; his throne is carved with butterflies and crescent moons.",
    symbols: ["Upright sword in his right hand (the authority to judge, truth, and firm rules)", "Searching gaze (insight that sees through lies)", "Purple cloak (mastery and full maturity)", "Steady stone throne (fairness that does not waver)"],
    archetype: "King of Swords / The Master of Intellect — the king of the mind, the highest judge, decisiveness, and proven truth",
    shadow: "Intellectual tyranny, heartlessness, using logic to crush others, or holding grudges",
    powerQuestion: "If you had to decide this important matter as the fairest judge there is, what would your ruling be?",
  },

  // ==========================================
  // SUIT OF PENTACLES
  // ==========================================
  "pentacles-01": {
    scene1909: "A hand reaches out of a white cloud holding up a large golden coin engraved with a five-pointed star. Below lies a garden of white lilies and an arch in a hedge of roses, with distant mountains seen through it.",
    symbols: ["Golden coin in the palm (the seed of wealth, a real and tangible financial opportunity)", "Garden and archway (abundance and a door opening to success)", "Mountains beyond (a steady, long-term goal)", "Hand from the cloud (a gift that rewards effort)"],
    archetype: "Ace of Pentacles / The Seed of Abundance — the seed of wealth, a tangible new opportunity, and a solid foundation",
    shadow: "Greed, clinging to material things, or letting a real opportunity slip away",
    powerQuestion: "Which new, tangible opportunity is coming into your hands, and how will you water and tend it?",
  },
  "pentacles-02": {
    scene1909: "A young man in a tall hat dances while juggling two golden coins, linked by a green ribbon looped in an infinity sign (∞). Behind him ships ride high, rolling waves.",
    symbols: ["Two coins in an infinity loop (keeping balance, managing resources, and adapting with ease)", "Ships riding the waves (life's ups and downs, handled with skill)", "Dancing (not getting tense about the situation)", "Tall hat (agility and quick wits)"],
    archetype: "Two of Pentacles / The Master of Balance — juggling, flexibility, and keeping life in balance",
    shadow: "Trying to hold too much at once, money that never stretches far enough, or stress from carrying many things together",
    powerQuestion: "Are the two important things in your life right now (such as work and personal life, or money in and money out) really in balance?",
  },
  "pentacles-03": {
    scene1909: "A young stonemason works carefully on a cathedral, standing on a bench, while a monk and a hooded figure holding the building plans stand by, talking and advising. Three golden coins are carved finely into the arch above.",
    symbols: ["Three coins in the arch (skilled work that is recognised)", "Plans in the hands of the hooded figure (planning and standards of work)", "Mason, monk and planner working together (teamwork that brings different skills together)", "Carved stone (building a foundation that lasts)"],
    archetype: "Three of Pentacles / Master Craftsmanship — skill, teamwork, and creating high-quality work",
    shadow: "Insisting on doing everything alone, ignoring advice, or sloppy work without standards",
    powerQuestion: "Which skill should you develop further, and who could be your team or mentor to help you?",
  },
  "pentacles-04": {
    scene1909: "A crowned man sits on a stone block with a city behind him. He clutches a large golden coin tightly to his chest with both arms, holds two more down under his feet, and balances a fourth on top of his crown, sitting still and refusing to move.",
    symbols: ["Clutching the coin with his whole body (miserliness, fear of loss, and clinging to security)", "Feet on the coins (blocking energy from flowing)", "City behind him (cutting yourself off from others to guard your treasure)", "Tense expression (insecurity inside)"],
    archetype: "Four of Pentacles / The Hoarder — tight-fistedness, clinging to the comfort zone, and fear of scarcity",
    shadow: "Stinginess, panic about being poor, or controlling others with money until relationships suffer",
    powerQuestion: "What are you holding too tightly out of fear, and how might letting it flow again make you feel more at ease?",
  },
  "pentacles-05": {
    scene1909: "Two poor people in ragged clothes, one on crutches with a bell around his neck, limp through a freezing snowstorm past a church's stained-glass window, where five golden coins glow with warm light.",
    symbols: ["Passing the church window (help and warmth that are close by, yet overlooked)", "Freezing snowstorm (hardship of body or money)", "Crutches (wounds and vulnerability)", "Heads bowed (feeling hopeless and alone)"],
    archetype: "Five of Pentacles / The Spiritual Poverty — hardship, a sense of lack, and overlooking help",
    shadow: "Sinking into the belief that you are poor, refusing help out of pride, or despair",
    powerQuestion: "When you feel alone or in need, which door or which person is ready to help you right now?",
  },
  "pentacles-06": {
    scene1909: "A wealthy merchant in fine clothes holds a pair of scales evenly in his left hand while his right hand drops golden coins to two poor people kneeling below, asking for help.",
    symbols: ["Scales in his left hand (fairness and balance in giving and receiving)", "Coins dropped into open hands (generosity and sharing)", "Two kneeling people (receiving help with gratitude)", "Fine clothes (standing that comes from being a giver)"],
    archetype: "Six of Pentacles / Generosity & Reciprocity — generosity, mutual support, and the balance of giving and receiving",
    shadow: "Giving to make others feel indebted, calling in favours, or letting yourself be kept beneath others because you took their money",
    powerQuestion: "In this cycle of your life, are you the giver or the receiver, and is that relationship truly balanced?",
  },
  "pentacles-07": {
    scene1909: "A young gardener leans on his hoe, tired and thoughtful, gazing at a leafy bush from which six golden coins have grown, while a seventh lies at his feet, in a garden he has worked hard to plant.",
    symbols: ["Leaning on the hoe, looking at the coins (pausing to assess the work, patiently waiting for the harvest)", "Coins growing on the bush (results growing step by step)", "Coin at his feet (part of the reward already received)", "Thoughtful face (weighing whether to press on or change the plan)"],
    archetype: "Seven of Pentacles / The Patient Cultivator — patience, reviewing your progress, and waiting for long-term results",
    shadow: "Running out of patience, giving up halfway, or putting effort into the wrong place until it goes to waste",
    powerQuestion: "For what you have poured your effort into, is it time to wait patiently, or time to change how you do it?",
  },
  "pentacles-08": {
    scene1909: "A young craftsman sits at his bench working intently, carving golden coins one by one with hammer and chisel. Six finished coins hang on display on a wooden post, another rests on the ground, and a town lies far in the distance.",
    symbols: ["Carving one coin at a time (practice, discipline and focus on detail)", "Coins hanging in a neat row (work built up through hard effort)", "Distant town (stepping away from distractions to create a masterpiece)", "Craftsman's tools (specialist skill)"],
    archetype: "Eight of Pentacles / The Dedicated Apprentice — dedication, disciplined practice, and creating value with skill",
    shadow: "Workaholism, perfectionism that won't let the work go, or getting stuck in routine and forgetting to grow",
    powerQuestion: "Which skill or duty should you repeat with discipline and focus until no one can replace your expertise?",
  },
  "pentacles-09": {
    scene1909: "A graceful, elegant woman in a flower-patterned robe stands in a rich vineyard hung with nine golden coins. A hooded falcon perches calmly on her gloved left hand, and a small snail crawls on the ground at her feet.",
    symbols: ["Falcon on her hand (trained instinct and skilful self-control)", "Vineyard and nine coins (wealth, success, and contentment earned by your own hands)", "Snail at her feet (success built slowly but surely)", "Manor house behind (financial independence)"],
    archetype: "Nine of Pentacles / Graceful Independence — independence, self-made wealth, and refined, peaceful happiness",
    shadow: "Loneliness in success, cutting yourself off from others, or fear of losing your comfort and status",
    powerQuestion: "Which success and pride should you honour yourself for, having built it with your own two hands?",
  },
  "pentacles-10": {
    scene1909: "Three generations of a family (an old man, a man, a woman and a child) gather under the stone archway of an old manor house, with two family dogs at ease beside the old man. Ten golden coins are arranged across the picture in the pattern of the Tree of Life.",
    symbols: ["Three generations and the dogs (inheritance, family warmth, and long-term security)", "Coins in the Tree of Life pattern (fullness in both the material and the spiritual world)", "Stone archway of the manor (a family foundation that will not shake)", "Patterned robe of the old man (history and honour)"],
    archetype: "Ten of Pentacles / Generational Legacy — inherited wealth, family security, and lasting success",
    shadow: "Disputes over inheritance, pressure from family expectations, or clinging to outdated traditions",
    powerQuestion: "Which valuable foundation or legacy (property, values or love) do you want to pass on to those who come after you?",
  },
  "pentacles-11": {
    scene1909: "A young man stands calmly in a green meadow, holding a golden coin up at chest height in both hands with great care, gazing at it with fascination. Behind him lie ploughed fields and a line of green trees.",
    symbols: ["Holding the coin in both hands (treasuring an opportunity, recognising its value, and eagerness to learn)", "Focused gaze (real commitment and long-term dedication)", "Meadow and green trees (abundance ready to grow)", "Distant hills (security in the future)"],
    archetype: "Page of Pentacles / The Diligent Scholar — the messenger of wealth, the hard-working student, and a golden chance to begin",
    shadow: "Slowness, lack of ambition, or planning endlessly without ever acting",
    powerQuestion: "Which knowledge, project or financial opportunity should you start studying and working on seriously today?",
  },
  "pentacles-12": {
    scene1909: "A knight in heavy armour sits perfectly still on a sturdy black horse that stands firmly on the ground. He holds a golden coin steady in his hand, and freshly ploughed fields stretch out behind him.",
    symbols: ["Black horse standing still (patience, loyalty, and steadiness like solid rock)", "Ploughed fields (hard work that takes time and consistency)", "Heavy armour (readiness to deal with any obstacle)", "Coin in his hand (a tangible goal that will not slip away)"],
    archetype: "Knight of Pentacles / The Methodical Builder — the methodical doer, persistence, and complete reliability",
    shadow: "Stubbornness, frustrating slowness, narrow thinking, or fear of risk that blocks any change",
    powerQuestion: "Which task needs you to keep going steadily, one step at a time, without giving up, for a bigger goal?",
  },
  "pentacles-13": {
    scene1909: "A queen sits calmly and warmly on a stone throne carved with fruit, cherubs and goats' heads, cradling a golden coin gently in her lap. Around her grows a rich garden of flowers and fruit under an arch of roses, and a rabbit hops beside the throne.",
    symbols: ["Coin cradled in her lap (looking after wealth with warmth and care)", "Rabbit (fertility and abundance)", "Roses and stone throne (connection to nature and to practical reality)", "Calm expression (enough-ness and complete contentment)"],
    archetype: "Queen of Pentacles / The Nurturing Provider — the queen of abundance, wise everyday management, and down-to-earth warmth",
    shadow: "Worrying about money more than the situation calls for, using money to buy love, or neglecting yourself to pamper others",
    powerQuestion: "How can you build security and real, everyday happiness in your home and daily life?",
  },
  "pentacles-14": {
    scene1909: "A king sits on a throne carved with bulls' heads, wearing a beautiful robe patterned with grapevines. He holds a sceptre in his right hand and rests a golden coin on his knee with his left; an armoured foot shows beneath his robe, and a castle and lush plants surround him.",
    symbols: ["Throne of bulls' heads (Taurus: material security, patience and wealth)", "Grapevine robe (the richest fruits of success and celebration)", "Armoured foot beneath the robe (security that no longer needs to fight)", "Castle and garden (a kingdom built through hard work)"],
    archetype: "King of Pentacles / The Financial Master — the king of wealth, the builder of business success, and a steady pillar",
    shadow: "Greed, materialism, judging people by what they own, or tight-fistedness",
    powerQuestion: "As the one in charge of your own stability, how will you manage your wealth and resources so they grow and last?",
  },
};

/** ข้อความภาพไพ่ 1909 ภาษาอังกฤษสำหรับใส่ใน prompt (/en) — คู่ของ `formatCardLoreForPrompt` */
export function formatCardLoreForPromptEn(cardId: string): string {
  const lore = CARD_VISUAL_LORE_EN[cardId];
  if (!lore) return "";
  return `  • 1909 imagery: ${lore.scene1909}
  • Key details: ${lore.symbols.join(" · ")}
  • Depth psychology: Archetype = ${lore.archetype} | Shadow = ${lore.shadow}
  • Reflection question: "${lore.powerQuestion}"`;
}
