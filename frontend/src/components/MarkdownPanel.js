import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export function MarkdownPanel({ children, testId }) {
  return (
    <div className="cs-md" data-testid={testId}>
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{children || ""}</ReactMarkdown>
    </div>
  );
}
