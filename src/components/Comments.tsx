import React, { useMemo, useRef, useEffect, useState } from "react";
import { useGetCommentsQuery, useCreateCommentMutation } from "../features/api/commentsApi";
import { useGetUserByIdQuery } from "../features/api/usersApi";
import { useGetVendorByVendorUserIdQuery } from "../features/api/vendorsApi";
import { useGetClientByUserIdQuery } from "../features/api/clientsApi";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPaperPlane } from "@fortawesome/free-solid-svg-icons";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const getInitials = (name: string): string => {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
};

const formatShortDate = (iso: string): string => {
  try {
    return new Date(iso + "Z").toLocaleDateString("en-US", {
      month: "short", day: "numeric", year: "numeric",
    });
  } catch { return ""; }
};

// ─── Per-comment resolver ─────────────────────────────────────────────────────

const useCommentAuthor = (userId: string): { name: string; initials: string } => {
  const { data: user } = useGetUserByIdQuery(String(userId), { skip: !userId });
  const { data: vendor } = useGetVendorByVendorUserIdQuery(String(userId), {
    skip: !userId || user?.user_type !== "vendor",
  });
  const { data: client } = useGetClientByUserIdQuery(String(userId), {
    skip: !userId || user?.user_type !== "client",
  });

  return useMemo(() => {
    let name = "User";
    if (user?.user_type === "vendor" && vendor) name = vendor.name;
    else if (user?.user_type === "client" && client) name = `${client.first_name} ${client.last_name}`;
    else if (user?.user_type === "admin") name = "Admin";
    return { name, initials: getInitials(name) };
  }, [user, vendor, client]);
};

interface BubbleProps {
  comment: string;
  userId: string;
  createdAt: string;
  isMine: boolean;
  myInitials: string;
}

const CommentBubble: React.FC<BubbleProps> = ({ comment, userId, createdAt, isMine, myInitials }) => {
  const { name, initials } = useCommentAuthor(isMine ? "" : userId);
  const displayInitials = isMine ? myInitials : initials;
  const displayName = isMine ? "You" : name;

  return (
    <div className={`flex items-end gap-2 ${isMine ? "flex-row-reverse" : "flex-row"}`}>
      {/* Avatar */}
      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
        isMine ? "bg-gold text-white" : "bg-muted text-muted-foreground"
      }`}>
        {displayInitials}
      </div>

      {/* Bubble + meta */}
      <div className={`flex flex-col gap-0.5 max-w-[75%] ${isMine ? "items-end" : "items-start"}`}>
        <div className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
          isMine
            ? "bg-gold text-white rounded-br-sm"
            : "bg-muted text-foreground rounded-bl-sm"
        }`}>
          {comment}
        </div>
        <span className="text-[11px] text-muted-foreground px-1">
          {displayName} · {formatShortDate(createdAt)}
        </span>
      </div>
    </div>
  );
};

// ─── Main component ───────────────────────────────────────────────────────────

interface CommentsProps {
  issueId: number;
  userId?: number;
  myName?: string;
  onCountChange?: (count: number) => void;
}

const Comments: React.FC<CommentsProps> = ({ issueId, userId, myName = "", onCountChange }) => {
  const { data: comments, error, isLoading } = useGetCommentsQuery();
  const [createComment] = useCreateCommentMutation();
  const [newComment, setNewComment] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const issueComments = useMemo(
    () => comments?.filter((c) => c.issue_id === issueId) ?? [],
    [comments, issueId]
  );

  useEffect(() => {
    onCountChange?.(issueComments.length);
  }, [issueComments.length, onCountChange]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [issueComments.length]);

  const myInitials = useMemo(() => getInitials(myName || "U"), [myName]);

  const handleSend = async () => {
    const trimmed = newComment.trim();
    if (!trimmed || !issueId || sending) return;
    setSending(true);
    try {
      await createComment({ issueId, comment: trimmed, userId: userId ?? -1 }).unwrap();
      setNewComment("");
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown: React.KeyboardEventHandler<HTMLInputElement> = (e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  if (isLoading) return <p className="text-sm text-muted-foreground">Loading…</p>;
  if (error) return <p className="text-sm text-red-500">Error loading conversation.</p>;

  return (
    <div className="flex flex-col gap-4">
      {/* Message list */}
      <div className="flex flex-col gap-4">
        {issueComments.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">No messages yet. Start the conversation.</p>
        ) : (
          issueComments.map((c) => (
            <CommentBubble
              key={c.id}
              comment={c.comment}
              userId={c.user_id}
              createdAt={c.created_at}
              isMine={String(c.user_id) === String(userId)}
              myInitials={myInitials}
            />
          ))
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="flex items-center gap-2 pt-1 border-t border-border">
        <input
          type="text"
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type a message…"
          className="flex-1 h-10 px-3 rounded-xl border border-border bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        />
        <button
          onClick={handleSend}
          disabled={!newComment.trim() || sending}
          className="w-10 h-10 rounded-xl bg-gold text-white flex items-center justify-center hover:bg-gold/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <FontAwesomeIcon icon={faPaperPlane} className="text-sm" />
        </button>
      </div>
    </div>
  );
};

export default Comments;
