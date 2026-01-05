-- ============================================================================
-- Lightning Round Questions Seed Data
-- 150+ rapid-fire questions across 4 types and 4 difficulty levels
-- ============================================================================

-- Clear existing questions (if re-seeding)
TRUNCATE TABLE public.lightning_round_questions;

-- ============================================================================
-- GENERAL KNOWLEDGE (40 questions)
-- ============================================================================

-- EASY (10 questions)
INSERT INTO public.lightning_round_questions (id, question, correct_answer, explanation, question_type, difficulty) VALUES
('gk_easy_1', 'What is the capital of France?', 'Paris', 'Paris has been the capital of France since 987 AD.', 'general_knowledge', 'easy'),
('gk_easy_2', 'How many continents are there?', '7', 'The seven continents are: Africa, Antarctica, Asia, Europe, North America, Oceania, and South America.', 'general_knowledge', 'easy'),
('gk_easy_3', 'What does HTTP stand for?', 'Hypertext Transfer Protocol', 'HTTP is the foundation of data communication for the World Wide Web.', 'general_knowledge', 'easy'),
('gk_easy_4', 'What year did World War II end?', '1945', 'WWII ended in 1945 with Germany''s surrender in May and Japan''s in September.', 'general_knowledge', 'easy'),
('gk_easy_5', 'What is the largest ocean on Earth?', 'Pacific Ocean', 'The Pacific Ocean covers about 46% of Earth''s water surface.', 'general_knowledge', 'easy'),
('gk_easy_6', 'How many days are in a leap year?', '366', 'Leap years have an extra day (February 29) added every 4 years.', 'general_knowledge', 'easy'),
('gk_easy_7', 'What is the speed of light (in km/s)?', '300000', 'The speed of light in a vacuum is approximately 299,792 km/s, commonly rounded to 300,000.', 'general_knowledge', 'easy'),
('gk_easy_8', 'Who painted the Mona Lisa?', 'Leonardo da Vinci', 'Da Vinci painted the Mona Lisa in the early 16th century.', 'general_knowledge', 'easy'),
('gk_easy_9', 'What does CPU stand for?', 'Central Processing Unit', 'The CPU is often called the "brain" of a computer.', 'general_knowledge', 'easy'),
('gk_easy_10', 'How many sides does a hexagon have?', '6', 'Hexagons are 6-sided polygons commonly found in nature (e.g., honeycomb).', 'general_knowledge', 'easy');

-- INTERMEDIATE (10 questions)
INSERT INTO public.lightning_round_questions (id, question, correct_answer, explanation, question_type, difficulty) VALUES
('gk_int_1', 'What is the smallest prime number?', '2', '2 is the only even prime number and the smallest prime.', 'general_knowledge', 'intermediate'),
('gk_int_2', 'In what year was the first iPhone released?', '2007', 'Steve Jobs unveiled the first iPhone on January 9, 2007.', 'general_knowledge', 'intermediate'),
('gk_int_3', 'What is the chemical symbol for gold?', 'Au', 'Au comes from the Latin "aurum" meaning gold.', 'general_knowledge', 'intermediate'),
('gk_int_4', 'How many strings does a standard guitar have?', '6', 'Standard guitars have 6 strings tuned to E-A-D-G-B-E.', 'general_knowledge', 'intermediate'),
('gk_int_5', 'What does API stand for in programming?', 'Application Programming Interface', 'APIs allow different software applications to communicate with each other.', 'general_knowledge', 'intermediate'),
('gk_int_6', 'What is the tallest mountain on Earth?', 'Mount Everest', 'Mount Everest stands at 8,849 meters (29,032 feet) above sea level.', 'general_knowledge', 'intermediate'),
('gk_int_7', 'Who wrote "1984"?', 'George Orwell', 'George Orwell published "1984" in 1949, depicting a dystopian totalitarian society.', 'general_knowledge', 'intermediate'),
('gk_int_8', 'What is the currency of Japan?', 'Yen', 'The Japanese Yen (¥) is one of the most traded currencies in the world.', 'general_knowledge', 'intermediate'),
('gk_int_9', 'How many bones are in the adult human body?', '206', 'Adults have 206 bones, while babies are born with around 270 that fuse over time.', 'general_knowledge', 'intermediate'),
('gk_int_10', 'What does DNA stand for?', 'Deoxyribonucleic Acid', 'DNA carries genetic instructions for the development and functioning of living organisms.', 'general_knowledge', 'intermediate');

-- ADVANCED (10 questions)
INSERT INTO public.lightning_round_questions (id, question, correct_answer, explanation, question_type, difficulty) VALUES
('gk_adv_1', 'What is the Planck constant (approximate, in J·s)?', '6.626e-34', 'Planck''s constant is a fundamental physical constant denoted by h.', 'general_knowledge', 'advanced'),
('gk_adv_2', 'In what year was the Turing Test proposed?', '1950', 'Alan Turing proposed the test in his 1950 paper "Computing Machinery and Intelligence."', 'general_knowledge', 'advanced'),
('gk_adv_3', 'What is the rarest blood type?', 'AB negative', 'AB negative occurs in less than 1% of the population.', 'general_knowledge', 'advanced'),
('gk_adv_4', 'How many time zones does Russia span?', '11', 'Russia spans 11 time zones, more than any other country.', 'general_knowledge', 'advanced'),
('gk_adv_5', 'What is the half-life of Carbon-14 (in years)?', '5730', 'Carbon-14 has a half-life of 5,730 years, making it useful for dating organic materials.', 'general_knowledge', 'advanced'),
('gk_adv_6', 'Who invented the World Wide Web?', 'Tim Berners-Lee', 'Tim Berners-Lee invented the WWW in 1989 while at CERN.', 'general_knowledge', 'advanced'),
('gk_adv_7', 'What is the most abundant gas in Earth''s atmosphere?', 'Nitrogen', 'Nitrogen makes up about 78% of Earth''s atmosphere, followed by oxygen at 21%.', 'general_knowledge', 'advanced'),
('gk_adv_8', 'How many keys are on a standard piano?', '88', 'Modern pianos have 88 keys: 52 white keys and 36 black keys.', 'general_knowledge', 'advanced'),
('gk_adv_9', 'What is the SI unit of electric charge?', 'Coulomb', 'The coulomb (C) is the SI unit of electric charge, named after Charles-Augustin de Coulomb.', 'general_knowledge', 'advanced'),
('gk_adv_10', 'In what year was Bitcoin created?', '2009', 'Bitcoin was created by Satoshi Nakamoto and launched on January 3, 2009.', 'general_knowledge', 'advanced');

-- INSANE (10 questions)
INSERT INTO public.lightning_round_questions (id, question, correct_answer, explanation, question_type, difficulty) VALUES
('gk_ins_1', 'What is the 42nd digit of Pi?', '5', 'The 42nd decimal digit of Pi is 5 (a nod to "The Hitchhiker''s Guide to the Galaxy").', 'general_knowledge', 'insane'),
('gk_ins_2', 'How many moves does it take to solve a Rubik''s Cube in "God''s Number"?', '20', 'God''s Number is 20: the maximum number of moves needed to solve any Rubik''s Cube from any position.', 'general_knowledge', 'insane'),
('gk_ins_3', 'What is the atomic number of Ununennium?', '119', 'Ununennium is the temporary name for the undiscovered element with atomic number 119.', 'general_knowledge', 'insane'),
('gk_ins_4', 'How many seconds are in a non-leap year?', '31536000', '365 days × 24 hours × 60 minutes × 60 seconds = 31,536,000 seconds.', 'general_knowledge', 'insane'),
('gk_ins_5', 'What is the ISBN-13 checksum digit calculation base?', '10', 'ISBN-13 uses modulo 10 for checksum calculation with alternating weights of 1 and 3.', 'general_knowledge', 'insane'),
('gk_ins_6', 'How many legal chess positions exist (approximate)?', '10^43', 'Shannon estimated there are approximately 10^43 possible legal chess positions.', 'general_knowledge', 'insane'),
('gk_ins_7', 'What is the largest known prime number (as of 2024, in Mersenne form)?', '2^82589933-1', 'The largest known prime is 2^82,589,933 − 1, discovered in 2018 with 24,862,048 digits.', 'general_knowledge', 'insane'),
('gk_ins_8', 'How many possible IPv6 addresses are there?', '340282366920938463463374607431768211456', '2^128 possible IPv6 addresses (approximately 340 undecillion).', 'general_knowledge', 'insane'),
('gk_ins_9', 'What is the Avogadro constant (exact value)?', '6.02214076e23', 'Avogadro''s constant is exactly 6.02214076 × 10^23 mol^−1 as of the 2019 redefinition.', 'general_knowledge', 'insane'),
('gk_ins_10', 'How many degrees of freedom does a diatomic molecule have?', '5', 'A diatomic molecule has 5 degrees of freedom: 3 translational + 2 rotational.', 'general_knowledge', 'insane');

-- ============================================================================
-- BRAIN TEASERS (40 questions)
-- ============================================================================

-- EASY (10 questions)
INSERT INTO public.lightning_round_questions (id, question, correct_answer, explanation, question_type, difficulty) VALUES
('bt_easy_1', 'I speak without a mouth and hear without ears. I have no body, but I come alive with wind. What am I?', 'Echo', 'An echo is a sound reflection that fits all these clues.', 'brain_teaser', 'easy'),
('bt_easy_2', 'What has keys but no locks, space but no room, and you can enter but can''t go inside?', 'Keyboard', 'A computer keyboard has keys, a space bar, and an enter key.', 'brain_teaser', 'easy'),
('bt_easy_3', 'What comes once in a minute, twice in a moment, but never in a thousand years?', 'The letter M', 'The letter M appears once in "minute", twice in "moment", and not at all in "thousand years".', 'brain_teaser', 'easy'),
('bt_easy_4', 'If you have me, you want to share me. If you share me, you don''t have me. What am I?', 'Secret', 'A secret is only valuable when kept, and ceases to be yours when shared.', 'brain_teaser', 'easy'),
('bt_easy_5', 'What gets wetter the more it dries?', 'Towel', 'A towel gets wetter as it dries other things.', 'brain_teaser', 'easy'),
('bt_easy_6', 'What has hands but cannot clap?', 'Clock', 'A clock has hands (hour and minute hands) but cannot clap.', 'brain_teaser', 'easy'),
('bt_easy_7', 'The more you take, the more you leave behind. What am I?', 'Footsteps', 'Each step you take leaves a footprint behind.', 'brain_teaser', 'easy'),
('bt_easy_8', 'What can travel around the world while staying in a corner?', 'Stamp', 'A postage stamp sits in the corner of an envelope and travels worldwide.', 'brain_teaser', 'easy'),
('bt_easy_9', 'What has a head and a tail but no body?', 'Coin', 'A coin has heads and tails sides but no body.', 'brain_teaser', 'easy'),
('bt_easy_10', 'What building has the most stories?', 'Library', 'A library has the most stories (books).', 'brain_teaser', 'easy');

-- INTERMEDIATE (10 questions)
INSERT INTO public.lightning_round_questions (id, question, correct_answer, explanation, question_type, difficulty) VALUES
('bt_int_1', 'I am taken from a mine and shut up in a wooden case, from which I am never released. What am I?', 'Pencil lead', 'Graphite (pencil lead) is mined and encased in wood.', 'brain_teaser', 'intermediate'),
('bt_int_2', 'A man pushes his car to a hotel and tells the owner he''s bankrupt. Why?', 'Playing Monopoly', 'He''s playing the board game Monopoly.', 'brain_teaser', 'intermediate'),
('bt_int_3', 'What disappears as soon as you say its name?', 'Silence', 'Saying "silence" breaks the silence.', 'brain_teaser', 'intermediate'),
('bt_int_4', 'A woman shoots her husband, holds him underwater for 5 minutes, then hangs him. Later they go to dinner. How?', 'She''s a photographer', 'She shot a photo, developed it in water, and hung it to dry.', 'brain_teaser', 'intermediate'),
('bt_int_5', 'What can run but never walks, has a mouth but never talks?', 'River', 'A river runs, has a mouth (where it meets the sea), but doesn''t walk or talk.', 'brain_teaser', 'intermediate'),
('bt_int_6', 'The person who makes it doesn''t need it. The person who buys it doesn''t use it. What is it?', 'Coffin', 'Coffin makers don''t need coffins for themselves, buyers don''t use them (they''re dead).', 'brain_teaser', 'intermediate'),
('bt_int_7', 'What word becomes shorter when you add two letters to it?', 'Short', 'Add "er" to "short" to make "shorter".', 'brain_teaser', 'intermediate'),
('bt_int_8', 'I have cities but no houses, forests but no trees, water but no fish. What am I?', 'Map', 'A map shows cities, forests, and water but doesn''t contain actual physical objects.', 'brain_teaser', 'intermediate'),
('bt_int_9', 'What can fill a room but takes up no space?', 'Light', 'Light fills a room but has no mass and occupies no physical space.', 'brain_teaser', 'intermediate'),
('bt_int_10', 'A man dies of old age on his 25th birthday. How?', 'Born on February 29', 'He was born on a leap day (February 29) and only had 25 actual birthdays.', 'brain_teaser', 'intermediate');

-- ADVANCED (10 questions)
INSERT INTO public.lightning_round_questions (id, question, correct_answer, explanation, question_type, difficulty) VALUES
('bt_adv_1', 'You see a boat filled with people. It has not sunk, but when you look again, you don''t see a single person. Why?', 'They were all married', 'No "single" person because they were all married (couples).', 'brain_teaser', 'advanced'),
('bt_adv_2', 'A girl has as many brothers as sisters, but each brother has only half as many brothers as sisters. How many siblings?', '4 sisters, 3 brothers', 'From the girl''s perspective: 3 sisters + 3 brothers = equal. From a brother: 2 brothers, 4 sisters = half.', 'brain_teaser', 'advanced'),
('bt_adv_3', 'A man is looking at a photograph. "Brothers and sisters I have none, but that man''s father is my father''s son." Who is he looking at?', 'His son', '"My father''s son" = himself. So "that man''s father" = himself. He''s looking at his son.', 'brain_teaser', 'advanced'),
('bt_adv_4', 'Two fathers and two sons go fishing. They catch 3 fish total, and each person gets one fish. How?', 'Grandfather, father, son', 'Three people: grandfather (father), father (son), and son. Each is both a father and a son except the extremes.', 'brain_teaser', 'advanced'),
('bt_adv_5', 'A surgeon says "I can''t operate on this boy, he''s my son!" But the surgeon is not the boy''s father. How?', 'The surgeon is his mother', 'The surgeon is the boy''s mother.', 'brain_teaser', 'advanced'),
('bt_adv_6', 'What occurs once in every minute, twice in every moment, yet never in a thousand years?', 'The letter M', 'The letter M appears once in "minute", twice in "moment", zero times in "thousand years".', 'brain_teaser', 'advanced'),
('bt_adv_7', 'I am always hungry and will die if not fed, but whatever I touch will soon turn red. What am I?', 'Fire', 'Fire is always consuming (hungry), dies without fuel, and turns things red/black (burns them).', 'brain_teaser', 'advanced'),
('bt_adv_8', 'What is so fragile that saying its name breaks it?', 'Silence', 'Saying the word "silence" breaks the silence.', 'brain_teaser', 'advanced'),
('bt_adv_9', 'A man is found dead in a circular mansion. Police find: chef cooking, maid sweeping corners, gardener planting. Who did it?', 'Maid', 'Circular mansions have no corners. The maid is lying.', 'brain_teaser', 'advanced'),
('bt_adv_10', 'How many times can you subtract 10 from 100?', 'Once', 'After the first subtraction, you''re subtracting from 90, not 100.', 'brain_teaser', 'advanced');

-- INSANE (10 questions)
INSERT INTO public.lightning_round_questions (id, question, correct_answer, explanation, question_type, difficulty) VALUES
('bt_ins_1', 'A man walks into a bar and asks for water. The bartender pulls out a gun. The man says "thank you" and leaves. Why?', 'Had hiccups', 'The man had hiccups. The bartender scared them away instead of giving water.', 'brain_teaser', 'insane'),
('bt_ins_2', 'A man lives on the 10th floor. Every day he takes the elevator to the ground floor. When he returns, he takes the elevator to the 7th floor and walks up 3 flights. Why?', 'He''s too short', 'He''s too short to reach the 10th floor button, so he presses 7 and walks the rest.', 'brain_teaser', 'insane'),
('bt_ins_3', 'Romeo and Juliet are found dead on the floor with water and glass around them. How did they die?', 'They were fish', 'Romeo and Juliet were pet fish whose bowl broke.', 'brain_teaser', 'insane'),
('bt_ins_4', 'A woman gives a beggar 50 cents. The woman is the beggar''s sister, but the beggar is not the woman''s brother. How?', 'The beggar is her sister', 'The beggar is her sister (female).', 'brain_teaser', 'insane'),
('bt_ins_5', 'What is the next number in this sequence: 1, 11, 21, 1211, 111221, ...?', '312211', 'Each number describes the previous: 1 is "one 1" (11), 11 is "two 1s" (21), etc. Next: "three 1s, two 2s, one 1" (312211).', 'brain_teaser', 'insane'),
('bt_ins_6', 'A man is condemned to death. He has to choose between three rooms: one full of raging fires, one full of assassins with loaded guns, and one full of lions that haven''t eaten in 3 years. Which should he choose?', 'Lions', 'Lions that haven''t eaten in 3 years are dead.', 'brain_teaser', 'insane'),
('bt_ins_7', 'You are in a dark room with a candle, wood stove, and gas lamp. You only have one match. What do you light first?', 'The match', 'You must light the match first before lighting anything else.', 'brain_teaser', 'insane'),
('bt_ins_8', 'A man was born in 1946 and died in 1947, yet he lived to be 80 years old. How?', 'Hospital room numbers', '1946 and 1947 were hospital room numbers, not years.', 'brain_teaser', 'insane'),
('bt_ins_9', 'If there are 3 apples and you take away 2, how many do you have?', '2', 'You have 2 apples because you took them.', 'brain_teaser', 'insane'),
('bt_ins_10', 'What always runs but never walks, often murmurs but never talks, has a bed but never sleeps, has a mouth but never eats?', 'River', 'A river runs, murmurs, has a riverbed and a mouth (where it meets the sea).', 'brain_teaser', 'insane');

-- ============================================================================
-- MATH PROBLEMS (40 questions)
-- ============================================================================

-- EASY (10 questions)
INSERT INTO public.lightning_round_questions (id, question, correct_answer, explanation, question_type, difficulty) VALUES
('math_easy_1', 'What is 7 × 8?', '56', '7 multiplied by 8 equals 56.', 'math', 'easy'),
('math_easy_2', 'What is 100 - 37?', '63', '100 minus 37 equals 63.', 'math', 'easy'),
('math_easy_3', 'What is 15% of 200?', '30', '15% of 200 = 0.15 × 200 = 30.', 'math', 'easy'),
('math_easy_4', 'What is the square root of 64?', '8', '8 × 8 = 64, so √64 = 8.', 'math', 'easy'),
('math_easy_5', 'What is 12 + 18?', '30', '12 plus 18 equals 30.', 'math', 'easy'),
('math_easy_6', 'What is 9 squared?', '81', '9² = 9 × 9 = 81.', 'math', 'easy'),
('math_easy_7', 'How many minutes are in 3 hours?', '180', '3 hours × 60 minutes = 180 minutes.', 'math', 'easy'),
('math_easy_8', 'What is 50% of 80?', '40', '50% of 80 = 0.5 × 80 = 40.', 'math', 'easy'),
('math_easy_9', 'What is 144 ÷ 12?', '12', '144 divided by 12 equals 12.', 'math', 'easy'),
('math_easy_10', 'What is 25 × 4?', '100', '25 multiplied by 4 equals 100.', 'math', 'easy');

-- INTERMEDIATE (10 questions)
INSERT INTO public.lightning_round_questions (id, question, correct_answer, explanation, question_type, difficulty) VALUES
('math_int_1', 'What is 13² + 5²?', '194', '13² = 169, 5² = 25, 169 + 25 = 194.', 'math', 'intermediate'),
('math_int_2', 'If a shirt costs $40 after a 20% discount, what was the original price?', '50', 'If 80% = $40, then 100% = $40 ÷ 0.8 = $50.', 'math', 'intermediate'),
('math_int_3', 'What is the sum of angles in a triangle?', '180', 'The sum of interior angles in any triangle is always 180 degrees.', 'math', 'intermediate'),
('math_int_4', 'What is 2⁸?', '256', '2⁸ = 2×2×2×2×2×2×2×2 = 256.', 'math', 'intermediate'),
('math_int_5', 'A train travels 120 km in 2 hours. What is its average speed in km/h?', '60', 'Speed = Distance ÷ Time = 120 km ÷ 2 hours = 60 km/h.', 'math', 'intermediate'),
('math_int_6', 'What is the area of a circle with radius 5? (Use π ≈ 3.14)', '78.5', 'Area = πr² = 3.14 × 5² = 3.14 × 25 = 78.5.', 'math', 'intermediate'),
('math_int_7', 'Solve: 3x + 7 = 22', '5', '3x = 22 - 7 = 15, so x = 15 ÷ 3 = 5.', 'math', 'intermediate'),
('math_int_8', 'What is 15! ÷ 14!?', '15', '15! ÷ 14! = 15 × 14! ÷ 14! = 15.', 'math', 'intermediate'),
('math_int_9', 'What is the cube root of 27?', '3', '3 × 3 × 3 = 27, so ∛27 = 3.', 'math', 'intermediate'),
('math_int_10', 'How many prime numbers are there between 1 and 10?', '4', 'The primes between 1 and 10 are: 2, 3, 5, 7.', 'math', 'intermediate');

-- ADVANCED (10 questions)
INSERT INTO public.lightning_round_questions (id, question, correct_answer, explanation, question_type, difficulty) VALUES
('math_adv_1', 'What is the derivative of x³?', '3x²', 'Using the power rule: d/dx(x³) = 3x².', 'math', 'advanced'),
('math_adv_2', 'What is log₁₀(1000)?', '3', 'log₁₀(1000) = 3 because 10³ = 1000.', 'math', 'advanced'),
('math_adv_3', 'What is the sum of the first 100 positive integers?', '5050', 'Sum = n(n+1)/2 = 100(101)/2 = 5050.', 'math', 'advanced'),
('math_adv_4', 'What is sin(90°)?', '1', 'sin(90°) = 1 (the sine of 90 degrees equals 1).', 'math', 'advanced'),
('math_adv_5', 'If f(x) = 2x + 3, what is f⁻¹(11)?', '4', 'If 2x + 3 = 11, then 2x = 8, so x = 4.', 'math', 'advanced'),
('math_adv_6', 'What is the value of e (Euler''s number) to 2 decimal places?', '2.72', 'e ≈ 2.71828..., rounded to 2.72.', 'math', 'advanced'),
('math_adv_7', 'How many ways can you arrange 5 distinct objects?', '120', '5! = 5 × 4 × 3 × 2 × 1 = 120.', 'math', 'advanced'),
('math_adv_8', 'What is the integral of 1/x?', 'ln(x) + C', 'The antiderivative of 1/x is the natural logarithm: ∫(1/x)dx = ln|x| + C.', 'math', 'advanced'),
('math_adv_9', 'What is the golden ratio (φ) to 3 decimal places?', '1.618', 'φ = (1 + √5) / 2 ≈ 1.618.', 'math', 'advanced'),
('math_adv_10', 'What is the determinant of [[2,3],[4,5]]?', '-2', 'det = (2×5) - (3×4) = 10 - 12 = -2.', 'math', 'advanced');

-- INSANE (10 questions)
INSERT INTO public.lightning_round_questions (id, question, correct_answer, explanation, question_type, difficulty) VALUES
('math_ins_1', 'What is the Ramanujan number (smallest taxi-cab number)?', '1729', '1729 = 1³ + 12³ = 9³ + 10³, making it the smallest number expressible as the sum of two cubes in two different ways.', 'math', 'insane'),
('math_ins_2', 'What is the value of i⁴? (where i is the imaginary unit)', '1', 'i¹ = i, i² = -1, i³ = -i, i⁴ = 1.', 'math', 'insane'),
('math_ins_3', 'What is ∫₀^∞ e^(-x²) dx?', '√π/2', 'This is the Gaussian integral: ∫₀^∞ e^(-x²) dx = √π/2.', 'math', 'insane'),
('math_ins_4', 'How many zeros are at the end of 100!?', '24', '100! has 24 trailing zeros (count factors of 5: ⌊100/5⌋ + ⌊100/25⌋ = 20 + 4 = 24).', 'math', 'insane'),
('math_ins_5', 'What is the smallest perfect number?', '6', '6 is perfect because 6 = 1 + 2 + 3 (sum of its proper divisors).', 'math', 'insane'),
('math_ins_6', 'What is the chromatic number of a complete graph K₅?', '5', 'A complete graph with 5 vertices requires 5 colors (each vertex connected to all others).', 'math', 'insane'),
('math_ins_7', 'What is Euler''s identity? (Simplify e^(iπ) + 1)', '0', 'Euler''s identity: e^(iπ) + 1 = 0, connecting e, i, π, 1, and 0.', 'math', 'insane'),
('math_ins_8', 'How many Platonic solids exist?', '5', 'There are exactly 5 Platonic solids: tetrahedron, cube, octahedron, dodecahedron, icosahedron.', 'math', 'insane'),
('math_ins_9', 'What is the limit of (1 + 1/n)ⁿ as n approaches infinity?', 'e', 'This is the limit definition of e: lim(n→∞) (1 + 1/n)ⁿ = e.', 'math', 'insane'),
('math_ins_10', 'What is the Fourier transform of a Dirac delta function?', '1', 'The Fourier transform of δ(t) is 1 for all frequencies.', 'math', 'insane');

-- ============================================================================
-- NURSERY RHYME / WORD PLAY (30 questions)
-- ============================================================================

-- EASY (10 questions)
INSERT INTO public.lightning_round_questions (id, question, correct_answer, explanation, question_type, difficulty) VALUES
('nr_easy_1', 'Complete: "Twinkle twinkle little ___"', 'star', 'The nursery rhyme goes: "Twinkle twinkle little star, how I wonder what you are."', 'nursery_rhyme', 'easy'),
('nr_easy_2', 'Complete: "Mary had a little ___"', 'lamb', 'The nursery rhyme: "Mary had a little lamb, its fleece was white as snow."', 'nursery_rhyme', 'easy'),
('nr_easy_3', 'Complete: "Humpty Dumpty sat on a ___"', 'wall', 'The rhyme goes: "Humpty Dumpty sat on a wall, Humpty Dumpty had a great fall."', 'nursery_rhyme', 'easy'),
('nr_easy_4', 'Complete: "Jack and Jill went up the ___"', 'hill', 'The rhyme: "Jack and Jill went up the hill to fetch a pail of water."', 'nursery_rhyme', 'easy'),
('nr_easy_5', 'Complete: "Baa baa black sheep, have you any ___?"', 'wool', 'The rhyme asks: "Baa baa black sheep, have you any wool?"', 'nursery_rhyme', 'easy'),
('nr_easy_6', 'Complete: "Hickory dickory dock, the mouse ran up the ___"', 'clock', 'The rhyme goes: "Hickory dickory dock, the mouse ran up the clock."', 'nursery_rhyme', 'easy'),
('nr_easy_7', 'Complete: "Little Miss Muffet sat on a ___"', 'tuffet', 'The rhyme: "Little Miss Muffet sat on a tuffet, eating her curds and whey."', 'nursery_rhyme', 'easy'),
('nr_easy_8', 'Complete: "Row row row your boat, gently down the ___"', 'stream', 'The song: "Row row row your boat, gently down the stream."', 'nursery_rhyme', 'easy'),
('nr_easy_9', 'Complete: "The itsy bitsy spider climbed up the water ___"', 'spout', 'The rhyme: "The itsy bitsy spider climbed up the water spout."', 'nursery_rhyme', 'easy'),
('nr_easy_10', 'Complete: "London Bridge is falling ___"', 'down', 'The song: "London Bridge is falling down, falling down, falling down."', 'nursery_rhyme', 'easy');

-- INTERMEDIATE (10 questions)
INSERT INTO public.lightning_round_questions (id, question, correct_answer, explanation, question_type, difficulty) VALUES
('nr_int_1', 'Complete: "Peter Piper picked a peck of pickled ___"', 'peppers', 'The tongue twister: "Peter Piper picked a peck of pickled peppers."', 'nursery_rhyme', 'intermediate'),
('nr_int_2', 'Complete: "She sells ___ by the seashore"', 'seashells', 'The tongue twister: "She sells seashells by the seashore."', 'nursery_rhyme', 'intermediate'),
('nr_int_3', 'What word is spelled incorrectly in every dictionary?', 'Incorrectly', 'The word "incorrectly" is the only word spelled "incorrectly" in the dictionary.', 'nursery_rhyme', 'intermediate'),
('nr_int_4', 'Complete: "How much wood would a woodchuck chuck if a woodchuck could chuck ___?"', 'wood', 'The tongue twister ends with "...if a woodchuck could chuck wood?"', 'nursery_rhyme', 'intermediate'),
('nr_int_5', 'Complete: "Fuzzy Wuzzy was a bear, Fuzzy Wuzzy had no ___"', 'hair', 'The rhyme: "Fuzzy Wuzzy was a bear, Fuzzy Wuzzy had no hair, Fuzzy Wuzzy wasn''t fuzzy, was he?"', 'nursery_rhyme', 'intermediate'),
('nr_int_6', 'What 5-letter word becomes shorter when you add 2 letters?', 'Short', 'Add "er" to "short" to get "shorter".', 'nursery_rhyme', 'intermediate'),
('nr_int_7', 'Complete: "Betty Botter bought some butter, but she said the butter''s ___"', 'bitter', 'The tongue twister: "Betty Botter bought some butter, but she said the butter''s bitter."', 'nursery_rhyme', 'intermediate'),
('nr_int_8', 'What begins with T, ends with T, and has T in it?', 'Teapot', 'A teapot begins and ends with T, and contains tea (T).', 'nursery_rhyme', 'intermediate'),
('nr_int_9', 'Complete: "How many times can you subtract 10 from ___?"', '100', 'The riddle asks: "How many times can you subtract 10 from 100?" (Answer: Once, then it''s 90).', 'nursery_rhyme', 'intermediate'),
('nr_int_10', 'What has 13 hearts but no other organs?', 'Deck of cards', 'A deck of cards has 13 hearts (the suit).', 'nursery_rhyme', 'intermediate');

-- ADVANCED (10 questions)
INSERT INTO public.lightning_round_questions (id, question, correct_answer, explanation, question_type, difficulty) VALUES
('nr_adv_1', 'What is the longest word in the English language without a vowel?', 'Rhythms', 'Rhythms is the longest common English word without A, E, I, O, or U.', 'nursery_rhyme', 'advanced'),
('nr_adv_2', 'What English word has three consecutive double letters?', 'Bookkeeper', 'Bookkeeper has three consecutive double letters: oo, kk, ee.', 'nursery_rhyme', 'advanced'),
('nr_adv_3', 'What is the only 15-letter word that can be spelled without repeating a letter?', 'Uncopyrightable', 'Uncopyrightable uses 15 different letters with no repeats.', 'nursery_rhyme', 'advanced'),
('nr_adv_4', 'What word is always pronounced incorrectly?', 'Incorrectly', 'The word "incorrectly" is always pronounced "incorrectly."', 'nursery_rhyme', 'advanced'),
('nr_adv_5', 'What 7-letter word contains dozens of letters?', 'Mailbox', 'A mailbox contains dozens of letters (mail).', 'nursery_rhyme', 'advanced'),
('nr_adv_6', 'What common English word has the letters "uu" in it?', 'Vacuum', 'Vacuum contains the double "uu".', 'nursery_rhyme', 'advanced'),
('nr_adv_7', 'What is the shortest complete sentence in English?', 'I am', '"I am" is a complete sentence with subject and verb (some argue "Go!" is shorter).', 'nursery_rhyme', 'advanced'),
('nr_adv_8', 'What word reads the same upside down and backwards?', 'SWIMS', 'SWIMS reads the same when rotated 180 degrees.', 'nursery_rhyme', 'advanced'),
('nr_adv_9', 'What is the only word that is both a noun and a verb and is spelled the same forwards and backwards?', 'Reviver', 'Reviver is a palindrome that functions as both noun and verb.', 'nursery_rhyme', 'advanced'),
('nr_adv_10', 'What English word has all five vowels in alphabetical order?', 'Facetious', 'Facetious contains A, E, I, O, U in order.', 'nursery_rhyme', 'advanced');

-- ============================================================================
-- Summary Statistics
-- ============================================================================

-- Total: 150 questions
-- General Knowledge: 40 (10 each difficulty)
-- Brain Teasers: 40 (10 each difficulty)
-- Math: 40 (10 each difficulty)
-- Nursery Rhyme: 30 (10 easy, 10 intermediate, 10 advanced)

-- Difficulty distribution:
-- Easy: 40 questions
-- Intermediate: 40 questions
-- Advanced: 40 questions
-- Insane: 30 questions
