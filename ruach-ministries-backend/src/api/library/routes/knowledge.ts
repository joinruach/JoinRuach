export default {
  routes: [
    // ========================================================================
    // QUOTES
    // ========================================================================
    {
      method: "POST",
      path: "/library/quotes",
      handler: "knowledge.createQuote",
      config: {
        auth: {
          scope: ["create"],
        },
      },
    },
    {
      method: "GET",
      path: "/library/quotes",
      handler: "knowledge.listQuotes",
      config: {
        auth: {
          scope: ["find"],
        },
      },
    },
    {
      method: "GET",
      path: "/library/quotes/:quoteId",
      handler: "knowledge.getQuote",
      config: {
        auth: {
          scope: ["find"],
        },
      },
    },
    {
      method: "PUT",
      path: "/library/quotes/:quoteId",
      handler: "knowledge.updateQuote",
      config: {
        auth: {
          scope: ["update"],
        },
      },
    },
    {
      method: "DELETE",
      path: "/library/quotes/:quoteId",
      handler: "knowledge.deleteQuote",
      config: {
        auth: {
          scope: ["delete"],
        },
      },
    },

    // ========================================================================
    // ANNOTATIONS
    // ========================================================================
    {
      method: "POST",
      path: "/library/annotations",
      handler: "knowledge.createAnnotation",
      config: {
        auth: {
          scope: ["create"],
        },
      },
    },
    {
      method: "GET",
      path: "/library/annotations",
      handler: "knowledge.listAnnotations",
      config: {
        auth: {
          scope: ["find"],
        },
      },
    },
    {
      method: "GET",
      path: "/library/annotations/:annotationId",
      handler: "knowledge.getAnnotation",
      config: {
        auth: {
          scope: ["find"],
        },
      },
    },
    {
      method: "PUT",
      path: "/library/annotations/:annotationId",
      handler: "knowledge.updateAnnotation",
      config: {
        auth: {
          scope: ["update"],
        },
      },
    },
    {
      method: "DELETE",
      path: "/library/annotations/:annotationId",
      handler: "knowledge.deleteAnnotation",
      config: {
        auth: {
          scope: ["delete"],
        },
      },
    },

    // ========================================================================
    // WRITING PATTERNS
    // ========================================================================
    {
      method: "POST",
      path: "/library/patterns",
      handler: "knowledge.createPattern",
      config: {
        auth: {
          scope: ["create"],
        },
      },
    },
    {
      method: "GET",
      path: "/library/patterns",
      handler: "knowledge.listPatterns",
      config: {
        auth: {
          scope: ["find"],
        },
      },
    },
    {
      method: "GET",
      path: "/library/patterns/:patternId",
      handler: "knowledge.getPattern",
      config: {
        auth: {
          scope: ["find"],
        },
      },
    },
    {
      method: "PUT",
      path: "/library/patterns/:patternId",
      handler: "knowledge.updatePattern",
      config: {
        auth: {
          scope: ["update"],
        },
      },
    },
    {
      method: "DELETE",
      path: "/library/patterns/:patternId",
      handler: "knowledge.deletePattern",
      config: {
        auth: {
          scope: ["delete"],
        },
      },
    },
  ],
};
