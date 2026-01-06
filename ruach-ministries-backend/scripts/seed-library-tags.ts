/**
 * Seed Library Tags
 *
 * Populates the database with initial tags for:
 * - Themes (theology)
 * - Writing craft (style, structure, clarity)
 * - Scripture topics (biblical themes)
 *
 * Usage: npx tsx scripts/seed-library-tags.ts
 */

import Strapi from "@strapi/strapi";

const LIBRARY_TAGS = [
  // ========================================================================
  // THEMES (Theological)
  // ========================================================================
  {
    name: "Grace",
    slug: "grace",
    tagType: "theme",
    description: "Unmerited favor and divine kindness",
  },
  {
    name: "Covenant",
    slug: "covenant",
    tagType: "theme",
    description: "Divine agreements and promises",
  },
  {
    name: "Justification by Faith",
    slug: "justification-by-faith",
    tagType: "theme",
    description: "Righteousness through faith alone",
  },
  {
    name: "Sovereignty of God",
    slug: "sovereignty-of-god",
    tagType: "theme",
    description: "God's supreme authority and control",
  },
  {
    name: "Sanctification",
    slug: "sanctification",
    tagType: "theme",
    description: "Process of becoming holy",
  },
  {
    name: "Redemption",
    slug: "redemption",
    tagType: "theme",
    description: "Deliverance from sin through Christ",
  },
  {
    name: "Bride Theology",
    slug: "bride-theology",
    tagType: "theme",
    description: "Church as the Bride of Christ",
  },

  // ========================================================================
  // WRITING CRAFT
  // ========================================================================
  {
    name: "Clarity",
    slug: "clarity",
    tagType: "writing_craft",
    description: "Clear, unambiguous communication",
  },
  {
    name: "Conciseness",
    slug: "conciseness",
    tagType: "writing_craft",
    description: "Brevity and economy of words",
  },
  {
    name: "Active Voice",
    slug: "active-voice",
    tagType: "writing_craft",
    description: "Direct, vigorous sentence construction",
  },
  {
    name: "Sentence Structure",
    slug: "sentence-structure",
    tagType: "writing_craft",
    description: "Syntax and grammatical composition",
  },
  {
    name: "Paragraph Flow",
    slug: "paragraph-flow",
    tagType: "writing_craft",
    description: "Logical progression and cohesion",
  },
  {
    name: "Rhetorical Devices",
    slug: "rhetorical-devices",
    tagType: "writing_craft",
    description: "Persuasive and stylistic techniques",
  },
  {
    name: "Storytelling",
    slug: "storytelling",
    tagType: "writing_craft",
    description: "Narrative structure and arc",
  },
  {
    name: "Tone and Voice",
    slug: "tone-and-voice",
    tagType: "writing_craft",
    description: "Author's attitude and personality",
  },
  {
    name: "Imagery",
    slug: "imagery",
    tagType: "writing_craft",
    description: "Vivid descriptive language",
  },
  {
    name: "Call to Action",
    slug: "call-to-action",
    tagType: "writing_craft",
    description: "Compelling reader engagement",
  },

  // ========================================================================
  // SCRIPTURE TOPICS
  // ========================================================================
  {
    name: "Messianic Prophecy",
    slug: "messianic-prophecy",
    tagType: "scripture_topic",
    description: "Prophetic references to the Messiah",
  },
  {
    name: "Law and Gospel",
    slug: "law-and-gospel",
    tagType: "scripture_topic",
    description: "Distinction between law and grace",
  },
  {
    name: "New Covenant",
    slug: "new-covenant",
    tagType: "scripture_topic",
    description: "New covenant in Christ's blood",
  },
  {
    name: "End Times",
    slug: "end-times",
    tagType: "scripture_topic",
    description: "Eschatology and last days",
  },
  {
    name: "Kingdom of God",
    slug: "kingdom-of-god",
    tagType: "scripture_topic",
    description: "God's reign and rule",
  },
  {
    name: "Holiness",
    slug: "holiness",
    tagType: "scripture_topic",
    description: "Set apart for God's purposes",
  },
  {
    name: "Repentance",
    slug: "repentance",
    tagType: "scripture_topic",
    description: "Turning from sin to God",
  },
  {
    name: "Fear of the Lord",
    slug: "fear-of-the-lord",
    tagType: "scripture_topic",
    description: "Reverent awe and respect for God",
  },
  {
    name: "Authority",
    slug: "authority",
    tagType: "scripture_topic",
    description: "Divine and delegated authority",
  },
  {
    name: "Babylon System",
    slug: "babylon-system",
    tagType: "scripture_topic",
    description: "Worldly systems opposed to God",
  },

  // ========================================================================
  // SPIRITUAL DISCIPLINES
  // ========================================================================
  {
    name: "Prayer",
    slug: "prayer",
    tagType: "spiritual_discipline",
    description: "Communication with God",
  },
  {
    name: "Fasting",
    slug: "fasting",
    tagType: "spiritual_discipline",
    description: "Abstaining for spiritual focus",
  },
  {
    name: "Meditation",
    slug: "meditation",
    tagType: "spiritual_discipline",
    description: "Deep contemplation on Scripture",
  },
  {
    name: "Worship",
    slug: "worship",
    tagType: "spiritual_discipline",
    description: "Adoration and praise of God",
  },
  {
    name: "Service",
    slug: "service",
    tagType: "spiritual_discipline",
    description: "Ministry to others",
  },
];

async function main() {
  const strapi = await Strapi().load();

  console.log("🌱 Seeding library tags...");

  let created = 0;
  let skipped = 0;

  for (const tag of LIBRARY_TAGS) {
    try {
      // Check if tag already exists
      const existing = await strapi.db.query("api::tag.tag").findOne({
        where: { slug: tag.slug },
      });

      if (existing) {
        console.log(`⏭️  Skipping existing tag: ${tag.name}`);
        skipped++;
        continue;
      }

      // Create tag
      await strapi.db.query("api::tag.tag").create({
        data: tag,
      });

      console.log(`✅ Created tag: ${tag.name} (${tag.tagType})`);
      created++;
    } catch (error) {
      console.error(`❌ Failed to create tag ${tag.name}:`, error);
    }
  }

  console.log(`\n📊 Summary:`);
  console.log(`   Created: ${created}`);
  console.log(`   Skipped: ${skipped}`);
  console.log(`   Total: ${LIBRARY_TAGS.length}`);

  await strapi.destroy();
}

main().catch((error) => {
  console.error("❌ Seed script failed:", error);
  process.exit(1);
});
