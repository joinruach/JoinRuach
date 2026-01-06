import React, { useEffect, useState } from "react";
import { Box, Typography, ProgressBar, Badge, Alert, Button, Flex } from "@strapi/design-system";
import { CheckCircle, CrossCircle, Refresh, Information } from "@strapi/icons";
import { useFetchClient } from "@strapi/helper-plugin";

interface IngestionStatusProps {
  versionId: string;
}

interface VersionStatus {
  version_id: string;
  status: "pending" | "processing" | "completed" | "failed";
  progress: number;
  error_message?: string;
  qa_metrics?: {
    total_blocks: number;
    total_chunks: number;
    coverage_ratio: number;
    warnings: string[];
    ocr_confidence?: number;
  };
  created_at: string;
  completed_at?: string;
}

export const LibraryIngestionStatus: React.FC<IngestionStatusProps> = ({ versionId }) => {
  const { get } = useFetchClient();
  const [status, setStatus] = useState<VersionStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStatus = async () => {
    try {
      setLoading(true);
      const response = await get(`/api/library/status/${versionId}`);
      setStatus(response.data.data);
      setError(null);
    } catch (err: any) {
      setError(err.message || "Failed to fetch status");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();

    // Poll every 3 seconds if processing
    const interval = setInterval(() => {
      if (status?.status === "processing" || status?.status === "pending") {
        fetchStatus();
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [versionId, status?.status]);

  if (loading && !status) {
    return <Typography>Loading status...</Typography>;
  }

  if (error) {
    return <Alert variant="danger" title="Error">{error}</Alert>;
  }

  if (!status) {
    return <Typography>No status available</Typography>;
  }

  const getStatusBadge = () => {
    switch (status.status) {
      case "completed":
        return <Badge icon={<CheckCircle />} variant="success">Completed</Badge>;
      case "failed":
        return <Badge icon={<CrossCircle />} variant="danger">Failed</Badge>;
      case "processing":
        return <Badge variant="secondary">Processing...</Badge>;
      case "pending":
        return <Badge variant="secondary">Pending</Badge>;
      default:
        return <Badge>{status.status}</Badge>;
    }
  };

  return (
    <Box padding={4} background="neutral100" borderRadius="4px">
      <Flex direction="column" alignItems="stretch" gap={4}>
        {/* Header */}
        <Flex justifyContent="space-between" alignItems="center">
          <Typography variant="beta">Ingestion Status</Typography>
          {getStatusBadge()}
        </Flex>

        {/* Progress Bar */}
        {(status.status === "processing" || status.status === "pending") && (
          <Box>
            <ProgressBar value={status.progress} />
            <Typography variant="pi" textColor="neutral600" marginTop={1}>
              {status.progress}% complete
            </Typography>
          </Box>
        )}

        {/* Error Message */}
        {status.status === "failed" && status.error_message && (
          <Alert variant="danger" title="Ingestion Failed">
            {status.error_message}
          </Alert>
        )}

        {/* QA Metrics */}
        {status.status === "completed" && status.qa_metrics && (
          <Box>
            <Typography variant="delta" marginBottom={2}>Quality Metrics</Typography>

            <Flex direction="column" alignItems="stretch" gap={2}>
              <Flex justifyContent="space-between">
                <Typography variant="omega">Total Blocks:</Typography>
                <Typography variant="omega" fontWeight="semiBold">
                  {status.qa_metrics.total_blocks}
                </Typography>
              </Flex>

              <Flex justifyContent="space-between">
                <Typography variant="omega">Total Chunks:</Typography>
                <Typography variant="omega" fontWeight="semiBold">
                  {status.qa_metrics.total_chunks}
                </Typography>
              </Flex>

              <Flex justifyContent="space-between">
                <Typography variant="omega">Coverage Ratio:</Typography>
                <Typography variant="omega" fontWeight="semiBold">
                  {(status.qa_metrics.coverage_ratio * 100).toFixed(1)}%
                </Typography>
              </Flex>

              {status.qa_metrics.ocr_confidence && (
                <Flex justifyContent="space-between">
                  <Typography variant="omega">OCR Confidence:</Typography>
                  <Typography variant="omega" fontWeight="semiBold">
                    {(status.qa_metrics.ocr_confidence * 100).toFixed(1)}%
                  </Typography>
                </Flex>
              )}
            </Flex>

            {/* Warnings */}
            {status.qa_metrics.warnings.length > 0 && (
              <Box marginTop={3}>
                <Alert variant="warning" title="Warnings" icon={<Information />}>
                  <ul style={{ margin: 0, paddingLeft: '1.5rem' }}>
                    {status.qa_metrics.warnings.map((warning, idx) => (
                      <li key={idx}>
                        <Typography variant="pi">{warning}</Typography>
                      </li>
                    ))}
                  </ul>
                </Alert>
              </Box>
            )}
          </Box>
        )}

        {/* Retry Button */}
        {status.status === "failed" && (
          <Button
            startIcon={<Refresh />}
            variant="secondary"
            onClick={() => {
              // TODO: Implement retry logic
              alert("Retry functionality not yet implemented");
            }}
          >
            Retry Ingestion
          </Button>
        )}

        {/* Timestamps */}
        <Box marginTop={2}>
          <Typography variant="pi" textColor="neutral600">
            Created: {new Date(status.created_at).toLocaleString()}
          </Typography>
          {status.completed_at && (
            <Typography variant="pi" textColor="neutral600">
              Completed: {new Date(status.completed_at).toLocaleString()}
            </Typography>
          )}
        </Box>
      </Flex>
    </Box>
  );
};
