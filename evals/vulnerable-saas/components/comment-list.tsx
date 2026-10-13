import { marked } from 'marked';

type Comment = { id: string; body_md: string; created_at: string };

export function CommentList({ comments }: { comments: Comment[] }) {
  return (
    <ul>
      {comments.map((c) => (
        <li key={c.id}>
          <div dangerouslySetInnerHTML={{ __html: marked.parse(c.body_md, { async: false }) }} />
          <time>{new Date(c.created_at).toLocaleString('en-GB')}</time>
        </li>
      ))}
    </ul>
  );
}
