"use client";

import React, { useState, useCallback } from "react";
import { Player } from "@remotion/player";
import { useSession } from "next-auth/react";
import { useParams } from "next/navigation";

// Video template types
type TemplateType = "scripture" | "quote" | "testimony" | "declaration" | "daily";

interface RenderJob {
  renderId: string;
  status: "queued" | "rendering" | "completed" | "failed";
  progress: number;
  outputUrl?: string;
}

export default function VideoStudioPage() {
  const { data: session } = useSession();
  const params = useParams();
  const locale = params?.locale as string;

  const [activeTemplate, setActiveTemplate] = useState<TemplateType>("scripture");
  const [renderJob, setRenderJob] = useState<RenderJob | null>(null);
  const [isRendering, setIsRendering] = useState(false);

  // Scripture form state
  const [scriptureForm, setScriptureForm] = useState({
    reference: "John 3:16",
    text: "For God so loved the world that he gave his one and only Son, that whoever believes in him shall not perish but have eternal life.",
    translation: "NIV",
    theme: "dark",
    animationStyle: "typewriter",
  });

  // Quote form state
  const [quoteForm, setQuoteForm] = useState({
    quote: "",
    author: "",
    source: "",
    theme: "elegant",
  });

  // Declaration form state
  const [declarationForm, setDeclarationForm] = useState({
    declarations: [
      { text: "I am a child of God", emphasis: ["child", "God"] },
      { text: "His Spirit lives in me", emphasis: ["Spirit"] },
      { text: "I walk in His light", emphasis: ["light"] },
    ],
    style: "prophetic",
    typography: "bold",
  });

  // Daily form state
  const [dailyForm, setDailyForm] = useState({
    reference: "",
    text: "",
    reflection: "",
    theme: "morning",
  });

  const templates = [
    {
      id: "scripture" as const,
      name: "Scripture Overlay",
      description: "Animated Bible verses with beautiful backgrounds",
      icon: "📖",
    },
    {
      id: "quote" as const,
      name: "Quote Reel",
      description: "Inspiring quotes with elegant typography",
      icon: "💬",
    },
    {
      id: "declaration" as const,
      name: "Declaration",
      description: "Spoken declarations with kinetic typography",
      icon: "🔥",
    },
    {
      id: "daily" as const,
      name: "Daily Scripture",
      description: "Automated daily verse videos",
      icon: "☀️",
    },
  ];

  const handleRender = useCallback(async () => {
    setIsRendering(true);

    // Check authentication
    if (!session?.strapiJwt) {
      alert("Authentication required. Please log in.");
      setIsRendering(false);
      return;
    }

    try {
      let endpoint = "/api/video-renders";
      let body: Record<string, unknown> = {};

      switch (activeTemplate) {
        case "scripture":
          endpoint = "/api/video-renders/scripture";
          body = scriptureForm;
          break;
        case "quote":
          endpoint = "/api/video-renders/quote";
          body = quoteForm;
          break;
        case "declaration":
          endpoint = "/api/video-renders/declaration";
          body = declarationForm;
          break;
        case "daily":
          endpoint = "/api/video-renders/daily";
          body = dailyForm;
          break;
      }

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session.strapiJwt}`,
        },
        body: JSON.stringify(body),
      });

      if (response.status === 401) {
        alert("Session expired. Please log in again.");
        window.location.href = `/${locale}/login?callbackUrl=${window.location.pathname}`;
        return;
      }

      if (response.status === 429) {
        const data = await response.json();
        alert(`Rate limit exceeded. ${data.error || "Please try again later."}`);
        setIsRendering(false);
        return;
      }

      if (!response.ok) {
        throw new Error("Failed to queue render");
      }

      const data = await response.json();
      setRenderJob({
        renderId: data.data.renderId,
        status: "queued",
        progress: 0,
      });

      // Start polling for status
      pollRenderStatus(data.data.renderId);
    } catch (error) {
      console.error("Render error:", error);
      setIsRendering(false);
    }
  }, [activeTemplate, scriptureForm, quoteForm, declarationForm, dailyForm, session, locale]);

  const pollRenderStatus = async (renderId: string) => {
    const poll = async () => {
      if (!session?.strapiJwt) {
        setIsRendering(false);
        return;
      }

      try {
        const response = await fetch(`/api/video-renders/${renderId}/status`, {
          headers: {
            "Authorization": `Bearer ${session.strapiJwt}`,
          },
        });

        if (response.status === 401 || response.status === 404) {
          setIsRendering(false);
          return;
        }

        const data = await response.json();

        setRenderJob({
          renderId,
          status: data.data.status,
          progress: data.data.progress,
          outputUrl: data.data.outputUrl,
        });

        if (data.data.status === "completed" || data.data.status === "failed") {
          setIsRendering(false);
          return;
        }

        // Continue polling
        setTimeout(poll, 2000);
      } catch (error) {
        console.error("Poll error:", error);
        setIsRendering(false);
      }
    };

    poll();
  };

  const renderScriptureForm = () => (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-1">
          Scripture Reference
        </label>
        <input
          type="text"
          value={scriptureForm.reference}
          onChange={(e) =>
            setScriptureForm({ ...scriptureForm, reference: e.target.value })
          }
          className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-amber-500 focus:border-transparent"
          placeholder="e.g., John 3:16"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-1">
          Scripture Text
        </label>
        <textarea
          value={scriptureForm.text}
          onChange={(e) =>
            setScriptureForm({ ...scriptureForm, text: e.target.value })
          }
          rows={4}
          className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-amber-500 focus:border-transparent"
          placeholder="Enter the scripture text..."
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">
            Translation
          </label>
          <select
            value={scriptureForm.translation}
            onChange={(e) =>
              setScriptureForm({ ...scriptureForm, translation: e.target.value })
            }
            className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-amber-500"
          >
            <option value="NIV">NIV</option>
            <option value="KJV">KJV</option>
            <option value="ESV">ESV</option>
            <option value="NKJV">NKJV</option>
            <option value="NLT">NLT</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">
            Theme
          </label>
          <select
            value={scriptureForm.theme}
            onChange={(e) =>
              setScriptureForm({ ...scriptureForm, theme: e.target.value })
            }
            className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-amber-500"
          >
            <option value="dark">Dark</option>
            <option value="gold">Gold</option>
            <option value="cosmic">Cosmic</option>
            <option value="nature">Nature</option>
            <option value="morning">Morning</option>
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-1">
          Animation Style
        </label>
        <select
          value={scriptureForm.animationStyle}
          onChange={(e) =>
            setScriptureForm({ ...scriptureForm, animationStyle: e.target.value })
          }
          className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-amber-500"
        >
          <option value="typewriter">Typewriter</option>
          <option value="fade">Fade</option>
          <option value="slide">Slide</option>
          <option value="kinetic">Kinetic</option>
          <option value="word-by-word">Word by Word</option>
        </select>
      </div>
    </div>
  );

  const renderQuoteForm = () => (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-1">Quote</label>
        <textarea
          value={quoteForm.quote}
          onChange={(e) => setQuoteForm({ ...quoteForm, quote: e.target.value })}
          rows={3}
          className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-amber-500 focus:border-transparent"
          placeholder="Enter the quote..."
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">
            Author
          </label>
          <input
            type="text"
            value={quoteForm.author}
            onChange={(e) => setQuoteForm({ ...quoteForm, author: e.target.value })}
            className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-amber-500 focus:border-transparent"
            placeholder="e.g., Ellen White"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">
            Source (optional)
          </label>
          <input
            type="text"
            value={quoteForm.source}
            onChange={(e) => setQuoteForm({ ...quoteForm, source: e.target.value })}
            className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-amber-500 focus:border-transparent"
            placeholder="e.g., Steps to Christ"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-1">Theme</label>
        <select
          value={quoteForm.theme}
          onChange={(e) => setQuoteForm({ ...quoteForm, theme: e.target.value })}
          className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-amber-500"
        >
          <option value="elegant">Elegant</option>
          <option value="bold">Bold</option>
          <option value="minimal">Minimal</option>
          <option value="dramatic">Dramatic</option>
        </select>
      </div>
    </div>
  );

  const renderDeclarationForm = () => (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Declarations
        </label>
        {declarationForm.declarations.map((decl, index) => (
          <div key={index} className="flex gap-2 mb-2">
            <input
              type="text"
              value={decl.text}
              onChange={(e) => {
                const newDeclarations = [...declarationForm.declarations];
                newDeclarations[index] = { ...decl, text: e.target.value };
                setDeclarationForm({ ...declarationForm, declarations: newDeclarations });
              }}
              className="flex-1 px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              placeholder={`Declaration ${index + 1}`}
            />
            <button
              onClick={() => {
                const newDeclarations = declarationForm.declarations.filter(
                  (_, i) => i !== index
                );
                setDeclarationForm({ ...declarationForm, declarations: newDeclarations });
              }}
              className="px-3 py-2 bg-red-600 hover:bg-red-700 rounded-lg text-white"
            >
              ×
            </button>
          </div>
        ))}
        <button
          onClick={() => {
            setDeclarationForm({
              ...declarationForm,
              declarations: [...declarationForm.declarations, { text: "", emphasis: [] }],
            });
          }}
          className="w-full py-2 border-2 border-dashed border-gray-600 rounded-lg text-gray-400 hover:border-amber-500 hover:text-amber-500 transition"
        >
          + Add Declaration
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">Style</label>
          <select
            value={declarationForm.style}
            onChange={(e) =>
              setDeclarationForm({ ...declarationForm, style: e.target.value })
            }
            className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-amber-500"
          >
            <option value="prophetic">Prophetic</option>
            <option value="prayerful">Prayerful</option>
            <option value="meditative">Meditative</option>
            <option value="bold">Bold</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">
            Typography
          </label>
          <select
            value={declarationForm.typography}
            onChange={(e) =>
              setDeclarationForm({ ...declarationForm, typography: e.target.value })
            }
            className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-amber-500"
          >
            <option value="bold">Bold</option>
            <option value="elegant">Elegant</option>
            <option value="minimal">Minimal</option>
            <option value="dramatic">Dramatic</option>
          </select>
        </div>
      </div>
    </div>
  );

  const renderDailyForm = () => (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-1">
          Scripture Reference
        </label>
        <input
          type="text"
          value={dailyForm.reference}
          onChange={(e) => setDailyForm({ ...dailyForm, reference: e.target.value })}
          className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-amber-500 focus:border-transparent"
          placeholder="e.g., Psalm 23:1"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-1">
          Scripture Text
        </label>
        <textarea
          value={dailyForm.text}
          onChange={(e) => setDailyForm({ ...dailyForm, text: e.target.value })}
          rows={3}
          className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-amber-500 focus:border-transparent"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-1">
          Reflection (optional)
        </label>
        <textarea
          value={dailyForm.reflection}
          onChange={(e) => setDailyForm({ ...dailyForm, reflection: e.target.value })}
          rows={2}
          className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-amber-500 focus:border-transparent"
          placeholder="A brief thought or application..."
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-1">Theme</label>
        <select
          value={dailyForm.theme}
          onChange={(e) => setDailyForm({ ...dailyForm, theme: e.target.value })}
          className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-amber-500"
        >
          <option value="morning">Morning</option>
          <option value="evening">Evening</option>
          <option value="sabbath">Sabbath</option>
          <option value="worship">Worship</option>
        </select>
      </div>
    </div>
  );

  const getFormContent = () => {
    switch (activeTemplate) {
      case "scripture":
        return renderScriptureForm();
      case "quote":
        return renderQuoteForm();
      case "declaration":
        return renderDeclarationForm();
      case "daily":
        return renderDailyForm();
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Header */}
      <header className="border-b border-gray-800 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Video Studio</h1>
            <p className="text-gray-400 text-sm">Create videos programmatically with Remotion</p>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar - Templates */}
        <aside className="w-72 border-r border-gray-800 p-4 min-h-[calc(100vh-73px)]">
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">
            Templates
          </h2>
          <div className="space-y-2">
            {templates.map((template) => (
              <button
                key={template.id}
                onClick={() => setActiveTemplate(template.id)}
                className={`w-full text-left p-3 rounded-lg transition ${
                  activeTemplate === template.id
                    ? "bg-amber-600/20 border border-amber-500/50"
                    : "bg-gray-800/50 hover:bg-gray-800 border border-transparent"
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{template.icon}</span>
                  <div>
                    <div className="font-medium">{template.name}</div>
                    <div className="text-xs text-gray-400">{template.description}</div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-6">
          <div className="grid grid-cols-2 gap-8">
            {/* Form Panel */}
            <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
              <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
                <span className="text-2xl">
                  {templates.find((t) => t.id === activeTemplate)?.icon}
                </span>
                {templates.find((t) => t.id === activeTemplate)?.name}
              </h3>

              {getFormContent()}

              <div className="mt-6 pt-6 border-t border-gray-800">
                <button
                  onClick={handleRender}
                  disabled={isRendering}
                  className={`w-full py-3 rounded-lg font-semibold transition ${
                    isRendering
                      ? "bg-gray-700 text-gray-400 cursor-not-allowed"
                      : "bg-amber-600 hover:bg-amber-500 text-white"
                  }`}
                >
                  {isRendering ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                          fill="none"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        />
                      </svg>
                      {renderJob?.status === "rendering"
                        ? `Rendering... ${Math.round(renderJob.progress)}%`
                        : "Queued..."}
                    </span>
                  ) : (
                    "Generate Video"
                  )}
                </button>
              </div>
            </div>

            {/* Preview Panel */}
            <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
              <h3 className="text-lg font-semibold mb-4">Preview</h3>

              <div className="aspect-[9/16] bg-gray-950 rounded-lg overflow-hidden border border-gray-800 flex items-center justify-center">
                {renderJob?.status === "completed" && renderJob.outputUrl ? (
                  <video
                    src={renderJob.outputUrl}
                    controls
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <div className="text-center text-gray-500">
                    <div className="text-4xl mb-2">🎬</div>
                    <p>Preview will appear here after rendering</p>
                  </div>
                )}
              </div>

              {/* Render Status */}
              {renderJob && (
                <div className="mt-4 p-4 bg-gray-800 rounded-lg">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-400">Status:</span>
                    <span
                      className={`font-medium ${
                        renderJob.status === "completed"
                          ? "text-green-400"
                          : renderJob.status === "failed"
                          ? "text-red-400"
                          : "text-amber-400"
                      }`}
                    >
                      {renderJob.status.charAt(0).toUpperCase() + renderJob.status.slice(1)}
                    </span>
                  </div>

                  {renderJob.status === "rendering" && (
                    <div className="mt-2">
                      <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-amber-500 transition-all duration-300"
                          style={{ width: `${renderJob.progress}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {renderJob.status === "completed" && renderJob.outputUrl && (
                    <a
                      href={renderJob.outputUrl}
                      download
                      className="mt-3 block w-full py-2 text-center bg-green-600 hover:bg-green-500 rounded-lg font-medium transition"
                    >
                      Download Video
                    </a>
                  )}
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
