import type { Core } from "@strapi/strapi";
import type { Job } from "bullmq";
import type { TranscodingJobData } from "../../../services/media-transcoding-queue";
import TranscodeWorkerImpl from "../../../services/transcode-worker";

export default ({ strapi }: { strapi: Core.Strapi }) => ({
  async processTranscodingJob(
    job: Job<TranscodingJobData>,
    updateProgress: (progress: number, task: string) => Promise<void>
  ) {
    return TranscodeWorkerImpl.processTranscodingJob.call(
      { ...TranscodeWorkerImpl, strapi },
      job,
      updateProgress,
      strapi
    );
  },
});
