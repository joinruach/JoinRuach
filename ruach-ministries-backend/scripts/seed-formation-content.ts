/**
 * Seed Formation Content
 * Creates initial formation phases, guidebook nodes, and canon axioms
 *
 * Usage:
 *   npx tsx scripts/seed-formation-content.ts
 */

const STRAPI_URL = process.env.STRAPI_URL || 'http://localhost:1337';
const STRAPI_API_TOKEN = process.env.STRAPI_API_TOKEN;

if (!STRAPI_API_TOKEN) {
  console.error('❌ STRAPI_API_TOKEN environment variable is required');
  process.exit(1);
}

interface FormationPhase {
  name: string;
  slug: string;
  description: string;
  order: number;
}

interface GuidebookNode {
  phase: string; // phase slug
  title: string;
  slug: string;
  description: string;
  content: string;
  order: number;
  isCheckpoint: boolean;
  checkpointPrompt?: string;
}

interface CanonAxiom {
  title: string;
  statement: string;
  bibleReferences: string[];
  explanation: string;
  requiresAffirmation: boolean;
  order: number;
}

// Formation Phases
const FORMATION_PHASES: FormationPhase[] = [
  {
    name: 'Phase 1: Awakening',
    slug: 'awakening',
    description: 'Introduction to covenant thinking and spiritual foundations',
    order: 1,
  },
  {
    name: 'Phase 2: Separation',
    slug: 'separation',
    description: 'Understanding separation from the world\'s systems',
    order: 2,
  },
  {
    name: 'Phase 3: Discernment',
    slug: 'discernment',
    description: 'Developing spiritual discernment and wisdom',
    order: 3,
  },
  {
    name: 'Phase 4: Commission',
    slug: 'commission',
    description: 'Receiving and walking in your calling',
    order: 4,
  },
  {
    name: 'Phase 5: Stewardship',
    slug: 'stewardship',
    description: 'Living as a faithful steward of God\'s kingdom',
    order: 5,
  },
];

// Awakening Phase Guidebook Nodes
const AWAKENING_NODES: GuidebookNode[] = [
  {
    phase: 'awakening',
    title: 'What is Covenant?',
    slug: 'what-is-covenant',
    description: 'Understanding the foundational concept of biblical covenant',
    content: `# What is Covenant?

A covenant is more than a contract or agreement. In the biblical sense, a covenant is a sacred bond that involves:

1. **Relationship** - Not just rules, but intimate connection
2. **Faithfulness** - Unwavering commitment through all circumstances
3. **Inheritance** - Passing down promises through generations
4. **Identity** - Who we are is shaped by the covenant we're in

## The Covenant Pattern

Throughout Scripture, we see God establishing covenants with His people:
- Noah: Covenant of preservation
- Abraham: Covenant of promise
- Moses: Covenant of law
- David: Covenant of kingship
- Jesus: New Covenant in His blood

Each covenant reveals more of God's character and His plan for humanity.

## Why Covenant Matters

Understanding covenant thinking transforms how we:
- Read Scripture
- Relate to God
- View our identity
- Engage with others
- See our purpose

The formation journey you're beginning is itself a covenant - a commitment to allow the Holy Spirit to form Christ in you.`,
    order: 1,
    isCheckpoint: false,
  },
  {
    phase: 'awakening',
    title: 'The Role of the Holy Spirit',
    slug: 'role-of-holy-spirit',
    description: 'Understanding the person and work of Ruach (the Holy Spirit)',
    content: `# The Role of the Holy Spirit

The Hebrew word **Ruach** means wind, breath, and spirit. The Holy Spirit is not an impersonal force, but the third person of the Trinity - fully God, active and personal.

## The Spirit's Work

1. **Conviction** - He reveals truth and exposes deception (John 16:8)
2. **Regeneration** - He births us into new life (John 3:5-6)
3. **Sealing** - He marks us as God's own (Ephesians 1:13)
4. **Leading** - He guides us into all truth (John 16:13)
5. **Empowering** - He equips us for service (Acts 1:8)
6. **Transforming** - He conforms us to Christ's image (2 Corinthians 3:18)

## Walking in the Spirit

To walk in the Spirit means:
- Listening to His voice
- Obeying His promptings
- Yielding to His work
- Depending on His power
- Following His lead

This formation journey is designed to help you grow in sensitivity to the Spirit's voice and movement in your life.`,
    order: 2,
    isCheckpoint: false,
  },
  {
    phase: 'awakening',
    title: 'Checkpoint: Your Covenant Commitment',
    slug: 'covenant-commitment',
    description: 'Reflect on your commitment to the formation journey',
    content: `# Checkpoint: Your Covenant Commitment

Before continuing, take time to reflect on what you've learned about covenant and the Holy Spirit.

This is your first checkpoint - a moment to pause, reflect, and submit your thoughts before moving forward.

## Reflection Questions

Consider these questions as you write your reflection:

1. What does covenant mean to you personally?
2. How has understanding covenant changed the way you see your relationship with God?
3. In what ways have you experienced the Holy Spirit's work in your life?
4. What are you hoping to gain from this formation journey?
5. What commitment are you making as you enter this covenant process?

Take your time. Write honestly. The Holy Spirit uses our reflections to deepen understanding and reveal truth.`,
    order: 3,
    isCheckpoint: true,
    checkpointPrompt: 'Reflect on your understanding of covenant and your commitment to this formation journey. What is the Holy Spirit saying to you?',
  },
];

// Canon Axioms
const CANON_AXIOMS: CanonAxiom[] = [
  {
    title: 'The Authority of Scripture',
    statement: 'I affirm that the Bible is the inspired, inerrant Word of God and the final authority for faith and practice.',
    bibleReferences: ['2 Timothy 3:16-17', 'Psalm 119:89', '2 Peter 1:20-21'],
    explanation: 'Scripture is God-breathed and authoritative. We submit to its teaching and allow it to shape our beliefs and behavior.',
    requiresAffirmation: true,
    order: 1,
  },
  {
    title: 'The Trinity',
    statement: 'I affirm that God exists eternally as three persons - Father, Son, and Holy Spirit - one God in three persons.',
    bibleReferences: ['Matthew 28:19', '2 Corinthians 13:14', 'John 1:1-3'],
    explanation: 'The triune nature of God is central to Christian faith. Each person of the Trinity is fully God, eternally existing in perfect unity.',
    requiresAffirmation: true,
    order: 2,
  },
  {
    title: 'Salvation by Grace Through Faith',
    statement: 'I affirm that salvation is by grace alone, through faith alone, in Christ alone, not by human works.',
    bibleReferences: ['Ephesians 2:8-9', 'Romans 3:23-24', 'Titus 3:5'],
    explanation: 'We cannot earn salvation. It is a free gift of God received through faith in Jesus Christ\'s finished work on the cross.',
    requiresAffirmation: true,
    order: 3,
  },
  {
    title: 'The Lordship of Jesus Christ',
    statement: 'I affirm that Jesus Christ is Lord - fully God and fully man, risen from the dead, seated at the right hand of the Father.',
    bibleReferences: ['Philippians 2:9-11', 'Colossians 1:15-20', 'Acts 2:36'],
    explanation: 'Jesus is not just Savior but Lord. His lordship means total authority over our lives and all creation.',
    requiresAffirmation: true,
    order: 4,
  },
  {
    title: 'The Reality of Spiritual Warfare',
    statement: 'I affirm that we are in a real spiritual battle against principalities and powers, and that Christ has already won the victory.',
    bibleReferences: ['Ephesians 6:12', '1 John 3:8', 'Colossians 2:15'],
    explanation: 'The Christian life involves spiritual warfare. We fight not for victory but from victory, standing in Christ\'s triumph over darkness.',
    requiresAffirmation: true,
    order: 5,
  },
];

async function createPhases() {
  console.log('\n📘 Creating Formation Phases...');

  for (const phase of FORMATION_PHASES) {
    try {
      const response = await fetch(`${STRAPI_URL}/api/formation-phases`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${STRAPI_API_TOKEN}`,
        },
        body: JSON.stringify({ data: phase }),
      });

      if (response.ok) {
        console.log(`  ✅ Created phase: ${phase.name}`);
      } else {
        const error = await response.text();
        console.log(`  ⚠️  Phase ${phase.name} may already exist or error occurred: ${error}`);
      }
    } catch (error) {
      console.error(`  ❌ Error creating phase ${phase.name}:`, error);
    }
  }
}

async function createGuidebookNodes() {
  console.log('\n📖 Creating Guidebook Nodes...');

  // First, fetch phase IDs
  const phasesResponse = await fetch(`${STRAPI_URL}/api/formation-phases`, {
    headers: {
      'Authorization': `Bearer ${STRAPI_API_TOKEN}`,
    },
  });

  const phasesData = await phasesResponse.json() as { data: any[] };
  const phaseMap: Record<string, number> = {};

  phasesData.data.forEach((phase: any) => {
    phaseMap[phase.slug] = phase.id;
  });

  for (const node of AWAKENING_NODES) {
    try {
      const phaseId = phaseMap[node.phase];
      if (!phaseId) {
        console.log(`  ⚠️  Phase ${node.phase} not found, skipping node ${node.title}`);
        continue;
      }

      const response = await fetch(`${STRAPI_URL}/api/guidebook-nodes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${STRAPI_API_TOKEN}`,
        },
        body: JSON.stringify({
          data: {
            ...node,
            phase: phaseId,
          },
        }),
      });

      if (response.ok) {
        console.log(`  ✅ Created node: ${node.title}`);
      } else {
        const error = await response.text();
        console.log(`  ⚠️  Node ${node.title} may already exist or error occurred: ${error}`);
      }
    } catch (error) {
      console.error(`  ❌ Error creating node ${node.title}:`, error);
    }
  }
}

async function createCanonAxioms() {
  console.log('\n⚖️  Creating Canon Axioms...');

  for (const axiom of CANON_AXIOMS) {
    try {
      const response = await fetch(`${STRAPI_URL}/api/canon-axioms`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${STRAPI_API_TOKEN}`,
        },
        body: JSON.stringify({ data: axiom }),
      });

      if (response.ok) {
        console.log(`  ✅ Created axiom: ${axiom.title}`);
      } else {
        const error = await response.text();
        console.log(`  ⚠️  Axiom ${axiom.title} may already exist or error occurred: ${error}`);
      }
    } catch (error) {
      console.error(`  ❌ Error creating axiom ${axiom.title}:`, error);
    }
  }
}

async function main() {
  console.log('🚀 Seeding Formation Content...');
  console.log(`📍 Strapi URL: ${STRAPI_URL}`);

  await createPhases();
  await createGuidebookNodes();
  await createCanonAxioms();

  console.log('\n✅ Seeding complete!\n');
}

main().catch(error => {
  console.error('❌ Seeding failed:', error);
  process.exit(1);
});
