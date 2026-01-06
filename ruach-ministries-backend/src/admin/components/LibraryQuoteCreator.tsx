import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Textarea,
  Select,
  Option,
  MultiSelect,
  MultiSelectOption,
  Button,
  Flex,
  Field,
  FieldLabel,
  FieldHint,
  Toggle,
  Alert,
} from "@strapi/design-system";
import { Plus, Check } from "@strapi/icons";
import { useFetchClient } from "@strapi/helper-plugin";

interface Tag {
  id: number;
  name: string;
  slug: string;
  tagType: string;
}

interface LibraryQuoteCreatorProps {
  chunkId: number;
  chunkText: string;
  onSuccess?: () => void;
}

export const LibraryQuoteCreator: React.FC<LibraryQuoteCreatorProps> = ({
  chunkId,
  chunkText,
  onSuccess,
}) => {
  const { get, post } = useFetchClient();

  const [textContent, setTextContent] = useState(chunkText);
  const [commentary, setCommentary] = useState("");
  const [visibilityTier, setVisibilityTier] = useState<"basic" | "full" | "leader">("leader");
  const [selectedTags, setSelectedTags] = useState<number[]>([]);
  const [isFeatured, setIsFeatured] = useState(false);
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchTags();
  }, []);

  const fetchTags = async () => {
    try {
      const response = await get("/api/tags");
      setTags(response.data.data || []);
    } catch (err) {
      console.error("Failed to fetch tags:", err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!textContent.trim()) {
      setError("Quote text is required");
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      await post("/api/library/quotes", {
        chunkId,
        textContent,
        commentary: commentary.trim() || undefined,
        visibilityTier,
        tagIds: selectedTags,
        isFeatured,
      });

      setSuccess(true);
      setError(null);

      // Reset form
      setTimeout(() => {
        setTextContent(chunkText);
        setCommentary("");
        setSelectedTags([]);
        setIsFeatured(false);
        setSuccess(false);
        if (onSuccess) onSuccess();
      }, 2000);
    } catch (err: any) {
      setError(err.message || "Failed to create quote");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box padding={4} background="neutral100" borderRadius="4px">
      <form onSubmit={handleSubmit}>
        <Flex direction="column" alignItems="stretch" gap={4}>
          <Typography variant="beta">Create Quote</Typography>

          {/* Quote Text */}
          <Field name="text_content">
            <FieldLabel>Quote Text</FieldLabel>
            <Textarea
              value={textContent}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                setTextContent(e.target.value)
              }
              placeholder="Enter or edit the quote text..."
              rows={6}
            />
            <FieldHint>Edit the chunk text to extract the exact quote</FieldHint>
          </Field>

          {/* Commentary */}
          <Field name="commentary">
            <FieldLabel>Commentary (Optional)</FieldLabel>
            <Textarea
              value={commentary}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                setCommentary(e.target.value)
              }
              placeholder="Add commentary or notes about this quote..."
              rows={3}
            />
            <FieldHint>Your insights or teaching notes</FieldHint>
          </Field>

          {/* Visibility Tier */}
          <Field name="visibility_tier">
            <FieldLabel>Visibility Tier</FieldLabel>
            <Select
              value={visibilityTier}
              onChange={(value: string) =>
                setVisibilityTier(value as "basic" | "full" | "leader")
              }
            >
              <Option value="basic">Basic (All Members)</Option>
              <Option value="full">Full (Partner+)</Option>
              <Option value="leader">Leader (Builder+)</Option>
            </Select>
            <FieldHint>Who can see this quote</FieldHint>
          </Field>

          {/* Tags */}
          <Field name="tags">
            <FieldLabel>Tags</FieldLabel>
            <MultiSelect
              value={selectedTags.map(String)}
              onChange={(values: string[]) =>
                setSelectedTags(values.map(Number))
              }
              placeholder="Select tags..."
            >
              {tags
                .filter((tag) =>
                  ["theme", "writing_craft", "scripture_topic", "spiritual_discipline"].includes(
                    tag.tagType
                  )
                )
                .map((tag) => (
                  <MultiSelectOption key={tag.id} value={String(tag.id)}>
                    {tag.name} ({tag.tagType.replace("_", " ")})
                  </MultiSelectOption>
                ))}
            </MultiSelect>
            <FieldHint>
              Categorize by theme, writing craft, scripture topic, etc.
            </FieldHint>
          </Field>

          {/* Featured Toggle */}
          <Field name="is_featured">
            <Flex alignItems="center" gap={2}>
              <Toggle
                checked={isFeatured}
                onChange={() => setIsFeatured(!isFeatured)}
              />
              <FieldLabel>Featured Quote</FieldLabel>
            </Flex>
            <FieldHint>Highlight this quote in collections</FieldHint>
          </Field>

          {/* Success/Error Messages */}
          {success && (
            <Alert variant="success" title="Success" icon={<Check />}>
              Quote created successfully!
            </Alert>
          )}

          {error && (
            <Alert variant="danger" title="Error">
              {error}
            </Alert>
          )}

          {/* Submit Button */}
          <Button
            type="submit"
            startIcon={<Plus />}
            loading={loading}
            disabled={loading || !textContent.trim()}
          >
            Create Quote
          </Button>
        </Flex>
      </form>
    </Box>
  );
};
