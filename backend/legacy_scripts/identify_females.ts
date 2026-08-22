import { prisma } from './src/prisma';

// Common Indian female first names (comprehensive list)
const FEMALE_NAMES = new Set([
    // Common Indian female names
    'priya', 'pooja', 'puja', 'sneha', 'anu', 'ananya', 'divya', 'kavya', 'lakshmi', 'laxmi',
    'deepa', 'deepika', 'meera', 'mira', 'nisha', 'sunita', 'rekha', 'radha', 'rani', 'sita',
    'geeta', 'geetha', 'suma', 'sumathi', 'sumati', 'usha', 'uma', 'parvati', 'durga', 'saraswati',
    'anitha', 'anita', 'kavitha', 'kavita', 'padma', 'padmavathi', 'vijaya', 'vijayalakshmi',
    'swathi', 'swati', 'shweta', 'swetha', 'shwetha', 'madhuri', 'malathi', 'malati', 'mangala',
    'manjula', 'manoja', 'meena', 'meenakshi', 'nalini', 'nandini', 'nirmala', 'padmini',
    'rajani', 'rajeshwari', 'rani', 'ranjitha', 'rathna', 'ratna', 'revathi', 'rohini',
    'saritha', 'sarita', 'savitha', 'savita', 'shantha', 'shanta', 'sharada', 'sharadha',
    'shobha', 'shobhana', 'sridevi', 'subhadra', 'sudha', 'sulochana', 'sumana', 'sunanda',
    'suparna', 'supriya', 'surekha', 'sushma', 'swarna', 'triveni', 'usha', 'vani', 'vanitha',
    'vanita', 'vasantha', 'vasudha', 'veena', 'vena', 'vidya', 'vijayashree', 'vimala',
    'yashodha', 'yashoda', 'yamini', 'archana', 'archna', 'aruna', 'asha', 'ashwini',
    'bhavana', 'bhavani', 'chandra', 'chandrika', 'chaitra', 'champa', 'chhaya',
    'dakshayani', 'devaki', 'devatha', 'devi', 'gayathri', 'gayatri', 'girija', 'gowri', 'gauri',
    'hamsa', 'hema', 'hemavathi', 'indira', 'indumathi', 'indira', 'jayanthi', 'jayanti',
    'jayashree', 'jyothi', 'jyoti', 'jyotsna', 'kamala', 'kamalini', 'kalyani', 'kamakshi',
    'kanchana', 'karuna', 'keerthi', 'keerti', 'kirthana', 'kirtana', 'komal', 'komala',
    'krishnaveni', 'kumari', 'kusuma', 'leela', 'leelavathi', 'leelawati', 'lilavati',
    'madhavi', 'madhumitha', 'madhumita', 'mahalakshmi', 'maheshwari', 'mamatha', 'mamta',
    'mandakini', 'mangamma', 'manorama', 'mythili', 'mythri', 'mythry',
    'nagalakshmi', 'nagaveni', 'namitha', 'namita', 'neela', 'neelima', 'neetu', 'neha',
    'nirupama', 'nithya', 'nitya', 'niveditha', 'nivedita', 'padmalatha', 'papamma',
    'pramila', 'pramodha', 'pramodini', 'prasanna', 'prathibha', 'prathiba', 'pratibha',
    'pravitha', 'preeti', 'preethi', 'prema', 'premila', 'priyadarshini', 'pushpa', 'pushpalatha',
    'radhamani', 'radhika', 'rajamma', 'rajashree', 'rajeswari', 'rajitha', 'rajkumari',
    'ranjani', 'rashmitha', 'rashmita', 'ratnamma', 'ratnabai', 'renu', 'renuka',
    'rohitha', 'roopa', 'rupa', 'rupali', 'sadhana', 'saikumari', 'sailaja', 'sarojini',
    'saroja', 'seetha', 'seeta', 'shailaja', 'shakuntala', 'shamala', 'shamili',
    'sharmila', 'sharmitha', 'sharmistha', 'sheela', 'shilpa', 'shireesha', 'shobhitha',
    'shradha', 'shraddha', 'shree', 'shreevidya', 'shruthi', 'shruti', 'shubha', 'shubhanga',
    'siri', 'siridevtha', 'sita', 'sivagami', 'soumya', 'sowmya', 'sowjanya', 'sowmyashree',
    'sreelakshmi', 'sreelatha', 'sreenivasamma', 'sreevani', 'srividya', 'sruthi',
    'subbalakshmi', 'subbamma', 'subhashini', 'subramanya', 'suhasini', 'sujakumari',
    'sukanya', 'sumalatha', 'sumanth', 'sumeera', 'suneetha', 'sunetra', 'suprabha',
    'surabhi', 'suseela', 'sushila', 'swapna', 'swarupa', 'syamala', 'tabassum', 'thara',
    'tharani', 'tharuni', 'thilaga', 'thilakavathi', 'trupti', 'tulasi', 'umamaheswari',
    'usharani', 'vasantha', 'vasanthi', 'vasumathi', 'vasumati', 'varalakshmi', 'vyjayanthi',
    'vyjayanti', 'vrinda', 'vrindha', 'yashwitha', 'yashwitha',
    // Modern/common names
    'aishwarya', 'aishwarya', 'akanksha', 'akshara', 'amrita', 'amritha', 'anjali', 'ankita',
    'anuja', 'aparna', 'aradhana', 'arathi', 'aarti', 'arti', 'ashwathy', 'avanthi', 'avani',
    'bhagyashree', 'bhavya', 'chaithra', 'charulatha', 'chethana', 'chetana', 'chithra',
    'deepthi', 'deeksha', 'deekshitha', 'diksha', 'dishita', 'disha', 'drisya', 'drishya',
    'esha', 'fathima', 'fatima', 'gauri', 'gnana', 'haritha', 'harshitha', 'harshita',
    'himabindu', 'himaja', 'hiranya', 'inchara', 'indrani', 'ishitha', 'ishita',
    'janani', 'japna', 'jasmine', 'jeevitha', 'jeevita', 'jhansi', 'karishma', 'karuna',
    'khadija', 'khushboo', 'khushbu', 'kinjal', 'kirti', 'kousalya', 'koushalya', 'kriti',
    'krithika', 'kritika', 'krupali', 'kumkum', 'lavanya', 'lekhitha', 'likhitha', 'lipika',
    'madhulika', 'mahima', 'mansi', 'manisha', 'manjiri', 'megha', 'meghana', 'meryl',
    'mithila', 'mohitha', 'monisha', 'mounika', 'mudra', 'mythreyi',
    'namratha', 'nanditha', 'nandita', 'naveena', 'navya', 'nidhi', 'niharika', 'nikitha', 'nikita',
    'nirupama', 'nithyasree', 'nitya', 'padmavathi', 'pallavi', 'poonam', 'poornima', 'prachi',
    'pragathi', 'pragati', 'prajna', 'prakriti', 'pranathi', 'pranati', 'preethi', 'priyansha',
    'rakhee', 'rakhi', 'ramya', 'ranjitha', 'rashmi', 'rathna', 'raveena', 'riya', 'roshni',
    'ruchita', 'rukmini', 'rupanwitha', 'sadhna', 'sahana', 'sahithi', 'sahiti',
    'sakshi', 'sameera', 'samiksha', 'sandhya', 'sandya', 'sangeetha', 'sangeeta',
    'sanjana', 'sankari', 'santoshi', 'saranya', 'sarojam', 'sarswati', 'sathvika',
    'sathwika', 'satvika', 'saumya', 'seema', 'shravani', 'shravanthi', 'shreyashi',
    'shreya', 'shubhangi', 'shwetlana', 'simran', 'sindhu', 'sindhuja', 'sirisha',
    'sireesha', 'snehal', 'snigdha', 'soumyashree', 'spandana', 'spurthi', 'spurthy',
    'sravani', 'sravanthi', 'sridurga', 'srilakshmi', 'srilatha', 'sriradhika', 'srirasmi',
    'srujana', 'suhasini', 'sujatha', 'sukruthi', 'sulakshana', 'sumathi', 'suneetha',
    'supreetha', 'supritha', 'surabhi', 'sushmitha', 'sushmita', 'swapna', 'swetha',
    'swethamangala', 'tanvi', 'tanvitha', 'tanvita', 'tejashwini', 'tejasvi', 'tejaswini',
    'tejaswi', 'tejasree', 'thriveni', 'trisha', 'tulasi', 'urvashi', 'urvasi',
    'vaishali', 'vaishnavi', 'vandana', 'varsha', 'varshini', 'varshitha', 'varshita',
    'vasavi', 'vathsala', 'veda', 'vedha', 'vibha', 'vijayashri', 'vimala', 'vimitha',
    'vineetha', 'vineeta', 'vishaka', 'vishalakshi', 'yashasvi', 'yashoda', 'yasmin', 'yasmine',
    'zeenath', 'zara', 'zoya',
    // Short/common names
    'anu', 'asha', 'banu', 'devi', 'gopi', 'hema', 'indu', 'jaya', 'jyoti', 'kala',
    'lata', 'leela', 'mala', 'maya', 'mini', 'minu', 'nita', 'paru', 'pavi', 'puja',
    'rani', 'renu', 'ritu', 'roja', 'roop', 'ruhi', 'sana', 'seema', 'simi', 'sona',
    'sonu', 'sree', 'sri', 'tara', 'usha', 'vani', 'venu',
]);

async function main() {
    const nullGenderUsers = await prisma.users.findMany({
        where: {
            OR: [
                { gender: null },
                { gender: '' }
            ]
        },
        select: {
            id: true,
            full_name: true,
            email: true,
            is_verified: true,
            created_at: true,
            age: true,
            avatar_url: true,
        },
        orderBy: { full_name: 'asc' }
    });

    console.log(`Total null/empty gender users: ${nullGenderUsers.length}\n`);

    const likelyFemale: any[] = [];
    const uncertain: any[] = [];

    for (const user of nullGenderUsers) {
        if (!user.full_name) {
            uncertain.push({ ...user, reason: 'No name' });
            continue;
        }

        const firstName = user.full_name.trim().split(/\s+/)[0].toLowerCase();

        // Remove common suffixes/prefixes that might be part of name
        const cleanName = firstName.replace(/^(ms\.?|mrs\.?|miss|dr\.?)\s*/i, '');

        if (FEMALE_NAMES.has(cleanName) || FEMALE_NAMES.has(firstName)) {
            likelyFemale.push({
                id: user.id,
                name: user.full_name,
                email: user.email,
                age: user.age,
                verified: user.is_verified,
                joined: user.created_at?.toISOString().split('T')[0],
                matchedOn: cleanName
            });
        } else {
            uncertain.push({
                id: user.id,
                name: user.full_name,
                verified: user.is_verified,
            });
        }
    }

    console.log(`\n===== LIKELY FEMALE (${likelyFemale.length} users) =====`);
    likelyFemale.forEach((u, i) => {
        console.log(`${i + 1}. ${u.name} | Age: ${u.age || 'N/A'} | Verified: ${u.verified} | Joined: ${u.joined} | ID: ${u.id}`);
    });

    console.log(`\n===== UNCERTAIN (${uncertain.length} users) =====`);
    uncertain.forEach((u, i) => {
        console.log(`${i + 1}. ${u.name || 'NO NAME'} | Verified: ${u.verified} | ID: ${u.id}`);
    });

    console.log(`\n=== SUMMARY ===`);
    console.log(`Likely Female: ${likelyFemale.length}`);
    console.log(`Uncertain (likely male or no name): ${uncertain.length}`);
    console.log(`\nFemale IDs to update:\n${likelyFemale.map(u => `'${u.id}'`).join(',\n')}`);
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
