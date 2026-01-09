"use strict";

const { redisClient } = require("../../../services/redis-client");

const CACHE_TTL_SECONDS = 60 * 60 * 24 * 7; // 7 days
const FALLBACK_VERSION_CODES = ["TS2009", "YS", "KJV"];

function normalizeTranslationCode(input) {
  if (!input) return null;
  const raw = String(input).trim();
  if (!raw) return null;

  const upper = raw.toUpperCase();
  if (upper === "YAH" || upper === "YAH SCRIPTURES" || upper === "YAH-SCRIPTURES") return "YS";
  if (upper === "YAH_SCRIPTURES") return "YS";

  return upper;
}

function parseOsis(osis) {
  const raw = String(osis ?? "").trim();
  if (!raw) return null;

  const parts = raw.split(".");
  if (parts.length !== 3) return null;

  const [book, chapterRaw, verseRaw] = parts;
  const chapter = Number.parseInt(chapterRaw, 10);
  const verse = Number.parseInt(verseRaw, 10);

  if (!book || !Number.isFinite(chapter) || !Number.isFinite(verse)) return null;
  if (chapter <= 0 || verse <= 0) return null;

  return { osis: raw, book, chapter, verse };
}

function formatReference(bookName, chapter, verse) {
  const name = bookName || "Unknown";
  return `${name} ${chapter}:${verse}`;
}

async function ensureRedis() {
  try {
    await redisClient.connect();
  } catch {
    // ignore; graceful fallback
  }
}

async function findPublicVersionByCode(versionCode) {
  if (!versionCode) return null;

  const versions = await strapi.entityService.findMany("api::scripture-version.scripture-version", {
    filters: {
      versionCode: { $eq: versionCode },
    },
    limit: 1,
  });

  const version = Array.isArray(versions) ? versions[0] : versions;
  if (!version) return null;
  if (!version.isPublic) return { version, allowedToDisplay: false };

  return { version, allowedToDisplay: true };
}

async function chooseVersionForDisplay(translationRequested) {
  const requestedCode = normalizeTranslationCode(translationRequested);

  // NEW: Check if YS is requested and canonical library has it
  if (requestedCode === 'YS') {
    try {
      const db = strapi.db.connection;
      strapi.log.debug('[YS Canon] Looking for YahScriptures document...');
      const ysDoc = await db('library_documents')
        .where('document_key', 'doc:scripture:yahscriptures')
        .first();

      if (ysDoc) {
        strapi.log.debug('[YS Canon] Found YahScriptures document, returning YS version');
        return {
          requestedCode,
          servedCode: 'YS',
          allowedToDisplay: true,
          version: {
            versionCode: 'YS',
            copyright: 'Public Domain',
          },
        };
      } else {
        strapi.log.warn('[YS Canon] YahScriptures document not found in library_documents');
      }
    } catch (error) {
      strapi.log.error('[YS Canon] Error checking canonical library for YS:', error);
    }
  }

  if (requestedCode) {
    const requested = await findPublicVersionByCode(requestedCode);
    if (requested?.allowedToDisplay) {
      return {
        requestedCode,
        servedCode: requestedCode,
        allowedToDisplay: true,
        version: requested.version,
      };
    }
  }

  for (const code of FALLBACK_VERSION_CODES) {
    const candidate = await findPublicVersionByCode(code);
    if (candidate?.allowedToDisplay) {
      return {
        requestedCode,
        servedCode: code,
        allowedToDisplay: true,
        version: candidate.version,
      };
    }
  }

  return {
    requestedCode,
    servedCode: null,
    allowedToDisplay: false,
    version: null,
  };
}

async function findVerse({ osis, book, chapter, verse, versionCode }) {
  // NEW: Prioritize canonical library for YS (new schema)
  if (versionCode === 'YS') {
    try {
      const db = strapi.db.connection;
      const sectionKey = `scripture:ys:${book.toLowerCase()}:${chapter}:${verse}`;

      const section = await db('library_sections')
        .where('section_key', sectionKey)
        .first();

      if (section) {
        // Format to match old schema response structure
        return {
          id: section.id,
          text: section.text,
          work: {
            canonicalName: book,
            version: {
              copyright: 'Public Domain',
              versionCode: 'YS',
            },
          },
        };
      }
    } catch (error) {
      strapi.log.warn('Error querying canonical library:', error);
    }
  }

  // OLD SCHEMA: Try to find in scripture_verse tables (if they exist)
  try {
    // Prefer direct osisRef match if present in the DB (old schema)
    const byOsis = await strapi.entityService.findMany("api::scripture-verse.scripture-verse", {
      filters: {
        osisRef: { $eq: osis },
        work: { version: { versionCode: { $eq: versionCode } } },
      },
      populate: {
        work: { populate: { version: true } },
      },
      limit: 1,
    });

    const verseRecordByOsis = Array.isArray(byOsis) ? byOsis[0] : byOsis;
    if (verseRecordByOsis) return verseRecordByOsis;

    // Fallback: resolve work by book shortCode/canonicalName, then by chapter/verse (old schema)
    const works = await strapi.entityService.findMany("api::scripture-work.scripture-work", {
      filters: {
        version: { versionCode: { $eq: versionCode } },
        $or: [{ shortCode: { $eq: book } }, { canonicalName: { $eq: book } }],
      },
      populate: { version: true },
      limit: 1,
    });
    const work = Array.isArray(works) ? works[0] : works;
    if (work) {
      const verses = await strapi.entityService.findMany("api::scripture-verse.scripture-verse", {
        filters: {
          work: { id: { $eq: work.id } },
          chapter: { $eq: chapter },
          verse: { $eq: verse },
        },
        populate: {
          work: { populate: { version: true } },
        },
        limit: 1,
      });
      const foundVerse = Array.isArray(verses) ? verses[0] : verses;
      if (foundVerse) return foundVerse;
    }
  } catch (error) {
    // Old schema tables don't exist - this is expected
    strapi.log.debug('Old scripture schema not available:', error.message);
  }

  return null;
}

async function resolveOneCitation({ osis, translation }) {
  const parsed = parseOsis(osis);
  if (!parsed) {
    return {
      osis: String(osis ?? ""),
      translationRequested: translation ?? null,
      translationServed: null,
      reference: null,
      text: null,
      copyright: null,
      sourceId: null,
      error: "Invalid OSIS reference",
    };
  }

  const translationRequested = translation ?? null;
  const versionChoice = await chooseVersionForDisplay(translationRequested);

  // Always return a reference, even if we cannot display text.
  const reference = formatReference(parsed.book, parsed.chapter, parsed.verse);

  if (!versionChoice.allowedToDisplay || !versionChoice.servedCode) {
    return {
      osis: parsed.osis,
      translationRequested,
      translationServed: null,
      reference,
      text: null,
      copyright: null,
      sourceId: null,
      notice: versionChoice.requestedCode
        ? `${versionChoice.requestedCode} requested; no displayable translation available.`
        : "No displayable translation available.",
    };
  }

  const cacheKey = `canon:${parsed.osis}:${versionChoice.servedCode}`;
  if (redisClient.isAvailable()) {
    const cached = await redisClient.get(cacheKey);
    if (cached) {
      try {
        const parsedCached = JSON.parse(cached);
        return {
          ...parsedCached,
          translationRequested,
          translationServed: versionChoice.servedCode,
        };
      } catch {
        // ignore cache parse error
      }
    }
  }

  const verseRecord = await findVerse({
    osis: parsed.osis,
    book: parsed.book,
    chapter: parsed.chapter,
    verse: parsed.verse,
    versionCode: versionChoice.servedCode,
  });

  if (!verseRecord) {
    return {
      osis: parsed.osis,
      translationRequested,
      translationServed: versionChoice.servedCode,
      reference,
      text: null,
      copyright: versionChoice.version?.copyright ?? null,
      sourceId: null,
      error: "Verse not found",
    };
  }

  const bookName = verseRecord.work?.canonicalName || parsed.book;
  const response = {
    osis: parsed.osis,
    translationServed: versionChoice.servedCode,
    reference: formatReference(bookName, parsed.chapter, parsed.verse),
    text: verseRecord.text,
    copyright: verseRecord.work?.version?.copyright ?? null,
    sourceId: verseRecord.id,
  };

  if (redisClient.isAvailable()) {
    await redisClient.set(cacheKey, JSON.stringify(response), CACHE_TTL_SECONDS);
  }

  return {
    ...response,
    translationRequested,
  };
}

module.exports = {
  async resolve(ctx) {
    await ensureRedis();

    const citations = ctx.request.body?.citations;
    if (!Array.isArray(citations) || citations.length === 0) {
      return ctx.send(
        {
          error: "Invalid request body",
          message: 'Expected JSON body: { "citations": [{ "osis": "Acts.17.11", "translation": "ESV" }] }',
        },
        400
      );
    }

    if (citations.length > 100) {
      return ctx.send({ error: "Too many citations (max 100)" }, 413);
    }

    const results = [];
    for (const cite of citations) {
      results.push(await resolveOneCitation({ osis: cite?.osis, translation: cite?.translation }));
    }

    return ctx.send({ results }, 200);
  },
};

