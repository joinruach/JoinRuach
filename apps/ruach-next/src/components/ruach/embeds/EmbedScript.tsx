import { sanitizeForReact } from "@/utils/sanitize";

export default function EmbedScript({ html }:{ html: string }){ return <div dangerouslySetInnerHTML={sanitizeForReact(html)} />; }