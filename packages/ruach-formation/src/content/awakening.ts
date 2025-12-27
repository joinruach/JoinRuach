/**
 * Awakening Phase Content
 *
 * Phase 1 of the Remnant Guidebook formation journey.
 * Theme: Reorient belief around Scripture as authority.
 *
 * This is the foundational phase that creates holy tension,
 * resets epistemology, and invites submission to formation.
 */

import { FormationPhase, FormationSection, FormationPhaseMetadata } from '../types/phase';
import { Checkpoint } from '../types/checkpoint';

// ============================================================================
// PHASE METADATA
// ============================================================================

export const AwakeningPhaseMetadata: FormationPhaseMetadata = {
  phase: FormationPhase.Awakening,
  title: 'Awakening',
  description:
    'Reorient your beliefs around Scripture as the ultimate authority. This phase creates holy tension, inviting you to test your foundations and submit to formation rather than consumption.',
  expectedDurationDays: 30, // Suggested minimum: 30 days
  requiredCheckpoints: 3, // One per section
  canonReferences: [
    '1', // Axiom 1: Scripture alone is the final authority
    '3', // Axiom 3: Not all who claim Christ know Him
  ],
};

// ============================================================================
// SECTION 1: DISORIENTATION
// ============================================================================

export const AwakeningSection1: FormationSection = {
  id: 'awakening-1',
  phase: FormationPhase.Awakening,
  order: 1,
  slug: 'disorientation',
  title: 'Disorientation',
  content: `# Disorientation

What if parts of your foundation are misaligned?

This is not a question designed to unsettle you for its own sake. It is an invitation to test what you've been taught against what Scripture actually says. Most believers inherit their theology secondhand—from pastors, books, conferences, worship songs—without ever checking if it aligns with the Word.

The Bereans in Acts 17:11 were commended for this very practice:

> *"Now these Jews were more noble than those in Thessalonica; they received the word with all eagerness, examining the Scriptures daily to see if these things were so."* (Acts 17:11, ESV)

They did not accept Paul's teaching at face value, even though he was an apostle. They tested it against Scripture. This is the posture we are cultivating: **eager receptivity paired with discerning examination**.

## The Holy Tension

If you have been walking with the Lord for any length of time, you have likely encountered teachings that felt compelling in the moment but left you uneasy upon reflection. Or perhaps you've noticed contradictions—pastors who preach grace but operate in control, prophets who claim new revelation but contradict the written Word, movements that emphasize power but lack fruit.

This disorientation is not a crisis. It is a gift.

It means the Spirit is inviting you to rebuild on firmer ground.

## The Question You Must Answer

Before proceeding, sit with this:

**Where did you first learn what you believe about God—and who taught you?**

Was it your parents? A pastor? A popular author? A movement? A mystical experience?

And more importantly: **Have you ever tested those beliefs against Scripture for yourself?**

This is not about rejecting all you've been taught. It is about taking responsibility for what you believe. If your faith cannot withstand scrutiny, it is not yet faith—it is borrowed certainty.

---

*Proceed only when you are ready to acknowledge that your foundations may need testing.*`,
  scriptureAnchors: [
    {
      book: 'Acts',
      chapter: 17,
      verseStart: 11,
      translation: 'ESV',
    },
    {
      book: '1 Thessalonians',
      chapter: 5,
      verseStart: 21,
      translation: 'ESV',
    },
  ],
  estimatedReadingMinutes: 5,
  checkpointIds: ['awakening-checkpoint-1'],
};

export const AwakeningCheckpoint1: Checkpoint = {
  id: 'awakening-checkpoint-1',
  sectionId: 'awakening-1',
  phase: FormationPhase.Awakening,
  order: 1,
  prompt:
    'Where did you first learn what you believe about God—and who taught you? Have you ever tested those beliefs against Scripture for yourself?',
  context:
    'This checkpoint invites you to examine the sources of your theology. Formation requires honest self-assessment, not performance. Take your time.',
  requiresReflection: true,
  minimumDwellSeconds: 180, // 3 minutes minimum
  createdAt: new Date('2025-12-26'),
};

// ============================================================================
// SECTION 2: AUTHORITY RESET
// ============================================================================

export const AwakeningSection2: FormationSection = {
  id: 'awakening-2',
  phase: FormationPhase.Awakening,
  order: 2,
  slug: 'authority-reset',
  title: 'Authority Reset',
  content: `# Authority Reset

Scripture above systems. Scripture above teachers. Scripture above traditions.

This is the non-negotiable foundation of Reformation theology, yet it is the most frequently violated principle in modern Christianity. We say *"sola scriptura"* (Scripture alone), but in practice, we often elevate the words of charismatic leaders, popular movements, or personal experiences above the written Word.

Paul writes in 2 Timothy 3:16–17:

> *"All Scripture is breathed out by God and profitable for teaching, for reproof, for correction, and for training in righteousness, that the man of God may be complete, equipped for every good work."* (2 Timothy 3:16–17, ESV)

Notice what Paul does **not** say:

- He does not say, *"All Scripture, plus your pastor's vision."*
- He does not say, *"All Scripture, plus the latest prophetic word."*
- He does not say, *"All Scripture, plus whatever makes you feel closest to God."*

Scripture is **sufficient**. It is the final court of appeal. When a teacher contradicts it, the teacher is wrong—no matter how anointed, how popular, how convincing.

## The Authority Hierarchy

Here is the proper order of authority in the life of a believer:

1. **Scripture** — The inspired, inerrant Word of God
2. **The Holy Spirit** — Who illuminates Scripture and convicts of truth
3. **The historic creeds** — Summaries of biblical orthodoxy (Apostles' Creed, Nicene Creed)
4. **Godly counsel** — Tested against Scripture, submitted to accountability
5. **Personal experience** — Interpreted through Scripture, not the other way around

Most believers invert this order. They begin with experience (*"God told me..."*), then seek Scripture to validate it, then dismiss any biblical correction as legalism or lack of faith.

This is eisegesis (reading **into** Scripture) rather than exegesis (reading **out of** Scripture). It is spiritual subjectivism masquerading as intimacy with God.

## The Reset

If you have been taught that the Spirit gives new revelation apart from Scripture, **that is false teaching**.

If you have been told that questioning a leader's word is the same as resisting God, **that is spiritual abuse**.

If you have been conditioned to prioritize signs, wonders, and experiences over sound doctrine, **you have been discipled into emotionalism, not Christianity**.

The reset is simple but costly:

**Submit every belief, every practice, every teaching to the authority of Scripture.**

If it cannot be defended from the Word, it must be abandoned—no matter how meaningful it feels, no matter who taught it, no matter how long you've believed it.

---

*Proceed when you are ready to submit to Scripture as the final authority—even if it means letting go of cherished beliefs.*`,
  scriptureAnchors: [
    {
      book: '2 Timothy',
      chapter: 3,
      verseStart: 16,
      verseEnd: 17,
      translation: 'ESV',
    },
    {
      book: 'Isaiah',
      chapter: 8,
      verseStart: 20,
      translation: 'ESV',
    },
    {
      book: 'Psalm',
      chapter: 119,
      verseStart: 105,
      translation: 'ESV',
    },
  ],
  estimatedReadingMinutes: 6,
  checkpointIds: ['awakening-checkpoint-2'],
};

export const AwakeningCheckpoint2: Checkpoint = {
  id: 'awakening-checkpoint-2',
  sectionId: 'awakening-2',
  phase: FormationPhase.Awakening,
  order: 2,
  prompt:
    'What beliefs or practices have you held that you now recognize may not be rooted in Scripture? Are you willing to let them go?',
  context:
    'This is a test of submission. Identifying unbiblical beliefs is easier than releasing them. Be specific. Name what must be surrendered.',
  requiresReflection: true,
  minimumDwellSeconds: 240, // 4 minutes minimum
  createdAt: new Date('2025-12-26'),
};

// ============================================================================
// SECTION 3: INVITATION TO FORMATION
// ============================================================================

export const AwakeningSection3: FormationSection = {
  id: 'awakening-3',
  phase: FormationPhase.Awakening,
  order: 3,
  slug: 'invitation-to-formation',
  title: 'Invitation to Formation',
  content: `# Invitation to Formation

Formation over consumption. Obedience over information.

Jesus ends the Sermon on the Mount with a parable about foundations:

> *"Everyone then who hears these words of mine and does them will be like a wise man who built his house on the rock. And the rain fell, and the floods came, and the winds blew and beat on that house, but it did not fall, because it had been founded on the rock. And everyone who hears these words of mine and does not do them will be like a foolish man who built his house on the sand. And the rain fell, and the floods came, and the winds blew and beat against that house, and it fell, and great was the fall of it."* (Matthew 7:24–27, ESV)

Notice the distinction: **hearing vs. doing**.

Both builders heard the words. Both had access to the same teaching. The difference was not knowledge—it was **obedience**.

## The Formation Invitation

This Guidebook is not a course you complete. It is a formation process you submit to.

That means:

- You will not be allowed to speed-run through content. **Depth requires time.**
- You will be asked to reflect, not just consume. **Formation is participatory.**
- You will be challenged to revisit foundations if your engagement suggests you're not ready. **Maturity is earned, not assumed.**
- You will not receive a certificate or badge at the end. **The fruit is the reward.**

If this feels restrictive, it is—intentionally. We live in an age of spiritual consumerism, where believers treat teaching like content to be binged, courses to be collected, and conferences to be attended without any expectation of transformation.

**This is the opposite of that.**

Formation is slow. It is uncomfortable. It requires submitting to a pace you did not set, to checkpoints you cannot skip, and to convictions that may cost you relationships, comfort, or certainty.

But it is the only path to becoming a house built on the rock.

## The Cost of Formation

Jesus never promised that following Him would be easy. He promised it would be *worth it*.

Formation will require you to:

- **Question what you've been taught** — even by people you respect
- **Sit with tension** — resisting the urge to resolve it prematurely
- **Submit to Scripture** — even when it contradicts your experience
- **Move slowly** — trusting that depth matters more than speed
- **Embrace correction** — from the Spirit, the Word, and godly counsel

If you are not willing to pay this cost, **choose the Resource Explorer path**. There is no shame in acknowledging you are not ready for formation. But do not mistake consumption for discipleship.

## The Invitation

If you have made it this far, you have already taken the first step.

You have acknowledged that your foundations may need testing. You have submitted to Scripture as the final authority. You have chosen formation over consumption.

Now the question is: **Will you stay?**

Will you stay when the pace feels slow? When the reflections feel invasive? When the Spirit convicts you of error? When the system refuses to let you speed ahead?

If the answer is yes, then you are ready to proceed to Phase 2: **Separation**.

But do not rush. Sit with what you have learned in Awakening. Let it settle. Let it do its work.

**Formation is not a destination. It is a posture.**

---

*Complete this checkpoint to finish the Awakening phase and unlock Separation.*`,
  scriptureAnchors: [
    {
      book: 'Matthew',
      chapter: 7,
      verseStart: 24,
      verseEnd: 27,
      translation: 'ESV',
    },
    {
      book: 'James',
      chapter: 1,
      verseStart: 22,
      translation: 'ESV',
    },
    {
      book: 'Luke',
      chapter: 6,
      verseStart: 46,
      translation: 'ESV',
    },
  ],
  estimatedReadingMinutes: 7,
  checkpointIds: ['awakening-checkpoint-3'],
};

export const AwakeningCheckpoint3: Checkpoint = {
  id: 'awakening-checkpoint-3',
  sectionId: 'awakening-3',
  phase: FormationPhase.Awakening,
  order: 3,
  prompt:
    'Reflect on your commitment to this formation journey. What will it cost you? Are you willing to stay when it becomes uncomfortable?',
  context:
    'This is the final checkpoint of Awakening. Your response here reveals whether you are ready for the deeper work of Separation. Be honest.',
  requiresReflection: true,
  minimumDwellSeconds: 300, // 5 minutes minimum
  createdAt: new Date('2025-12-26'),
};

// ============================================================================
// PHASE EXPORT
// ============================================================================

export const AwakeningPhase = {
  metadata: AwakeningPhaseMetadata,
  sections: [AwakeningSection1, AwakeningSection2, AwakeningSection3],
  checkpoints: [AwakeningCheckpoint1, AwakeningCheckpoint2, AwakeningCheckpoint3],
};
