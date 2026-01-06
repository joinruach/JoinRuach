import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Tree,
  TreeItem,
  Button,
  Flex,
  Divider,
  TextButton,
} from "@strapi/design-system";
import { Book, File, ChevronRight, ChevronDown } from "@strapi/icons";
import { useFetchClient } from "@strapi/helper-plugin";

interface Anchor {
  id: number;
  anchor_id: string;
  anchor_type: string;
  title: string;
  index_number?: number;
  parent_anchor_id?: number;
  page_start?: number;
  page_end?: number;
}

interface Chunk {
  id: number;
  chunk_id: string;
  text_content: string;
  page_start?: number;
  page_end?: number;
}

interface LibraryOutlineViewerProps {
  versionId: string;
}

export const LibraryOutlineViewer: React.FC<LibraryOutlineViewerProps> = ({ versionId }) => {
  const { get } = useFetchClient();
  const [anchors, setAnchors] = useState<Anchor[]>([]);
  const [chunks, setChunks] = useState<Record<number, Chunk[]>>({});
  const [expandedAnchors, setExpandedAnchors] = useState<Set<number>>(new Set());
  const [selectedAnchor, setSelectedAnchor] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnchors();
  }, [versionId]);

  const fetchAnchors = async () => {
    try {
      setLoading(true);
      // TODO: Create endpoint to fetch anchors by version
      // For now, using direct database query via custom endpoint
      const response = await get(`/api/library/outline/${versionId}`);
      setAnchors(response.data.data || []);
    } catch (error) {
      console.error("Failed to fetch outline:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchChunksForAnchor = async (anchorId: number) => {
    if (chunks[anchorId]) return; // Already loaded

    try {
      // TODO: Create endpoint to fetch chunks by anchor
      const response = await get(`/api/library/chunks?anchorId=${anchorId}`);
      setChunks((prev) => ({
        ...prev,
        [anchorId]: response.data.data || [],
      }));
    } catch (error) {
      console.error("Failed to fetch chunks:", error);
    }
  };

  const toggleAnchor = (anchorId: number) => {
    const newExpanded = new Set(expandedAnchors);
    if (newExpanded.has(anchorId)) {
      newExpanded.delete(anchorId);
    } else {
      newExpanded.add(anchorId);
      fetchChunksForAnchor(anchorId);
    }
    setExpandedAnchors(newExpanded);
  };

  const buildTree = (parentId: number | null = null): Anchor[] => {
    return anchors.filter((anchor) =>
      parentId === null
        ? !anchor.parent_anchor_id
        : anchor.parent_anchor_id === parentId
    );
  };

  const renderAnchor = (anchor: Anchor, level: number = 0) => {
    const hasChildren = anchors.some((a) => a.parent_anchor_id === anchor.id);
    const isExpanded = expandedAnchors.has(anchor.id);
    const children = buildTree(anchor.id);
    const anchorChunks = chunks[anchor.id] || [];

    return (
      <Box key={anchor.id} marginLeft={level * 3}>
        <Flex alignItems="center" gap={2} paddingTop={2} paddingBottom={2}>
          {hasChildren && (
            <Button
              variant="ghost"
              size="S"
              onClick={() => toggleAnchor(anchor.id)}
              startIcon={isExpanded ? <ChevronDown /> : <ChevronRight />}
            />
          )}

          <Button
            variant="tertiary"
            size="S"
            startIcon={<Book />}
            onClick={() => {
              setSelectedAnchor(anchor.id);
              fetchChunksForAnchor(anchor.id);
            }}
          >
            {anchor.title}
            {anchor.page_start && (
              <Typography variant="pi" textColor="neutral600" marginLeft={2}>
                (p. {anchor.page_start}
                {anchor.page_end && anchor.page_end !== anchor.page_start
                  ? `-${anchor.page_end}`
                  : ""}
                )
              </Typography>
            )}
          </Button>
        </Flex>

        {isExpanded && (
          <Box marginLeft={4}>
            {/* Render child anchors */}
            {children.map((child) => renderAnchor(child, level + 1))}

            {/* Render chunks if selected */}
            {selectedAnchor === anchor.id && anchorChunks.length > 0 && (
              <Box marginTop={2} marginBottom={2}>
                <Divider />
                <Typography variant="sigma" marginTop={2} marginBottom={2}>
                  Chunks ({anchorChunks.length})
                </Typography>
                {anchorChunks.map((chunk) => (
                  <Box
                    key={chunk.id}
                    padding={2}
                    marginBottom={2}
                    background="neutral100"
                    borderRadius="4px"
                  >
                    <Flex justifyContent="space-between" alignItems="flex-start">
                      <Typography variant="omega" style={{ flex: 1 }}>
                        {chunk.text_content.substring(0, 200)}
                        {chunk.text_content.length > 200 ? "..." : ""}
                      </Typography>
                      {chunk.page_start && (
                        <Typography variant="pi" textColor="neutral600">
                          p. {chunk.page_start}
                        </Typography>
                      )}
                    </Flex>
                  </Box>
                ))}
              </Box>
            )}
          </Box>
        )}
      </Box>
    );
  };

  if (loading) {
    return <Typography>Loading outline...</Typography>;
  }

  if (anchors.length === 0) {
    return (
      <Box padding={4}>
        <Typography>No structure detected. This document may not have chapters or sections.</Typography>
      </Box>
    );
  }

  const rootAnchors = buildTree(null);

  return (
    <Box padding={4}>
      <Typography variant="beta" marginBottom={4}>
        Document Outline
      </Typography>

      <Box>{rootAnchors.map((anchor) => renderAnchor(anchor))}</Box>
    </Box>
  );
};
