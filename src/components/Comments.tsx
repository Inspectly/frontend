import React, { useMemo, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faChevronUp, faChevronDown } from "@fortawesome/free-solid-svg-icons";
import {
  useGetCommentsQuery,
  useCreateCommentMutation,
} from "../features/api/commentsApi";
import UserName from "./UserName";

interface CommentsProps {
  issueId: number;
  userId?: number;
}

const Comments: React.FC<CommentsProps> = ({ issueId, userId }) => {
  const { data: comments, error, isLoading } = useGetCommentsQuery();
  const [createAttachment] = useCreateCommentMutation();

  const [commentsOpen, setCommentsOpen] = useState(true);
  const [newComment, setNewComment] = useState("");

  const issueComments = useMemo(() => {
    return comments?.filter((comment) => comment.issue_id === issueId) || [];
  }, [comments, issueId]);

  const addComment = async () => {
    const trimmed = newComment.trim();
    if (!trimmed || !issueId) return;

    try {
      await createAttachment({
        issueId,
        comment: trimmed,
        userId: userId || -1,
      }).unwrap();
      setNewComment("");
    } catch (error) {
      console.log(error);
    }
  };

  const handleKeyDown: React.KeyboardEventHandler<HTMLInputElement> = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (newComment.trim()) {
        addComment();
      }
    }
  };

  const formatDate = (isoString: string) => {
    const date = new Date(isoString + "Z");

    return date.toLocaleString("en-US", {
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone, // Auto-detects user’s time zone
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  if (isLoading) return <p>Loading...</p>;
  if (error) return <p>Error loading comments</p>;

  return (
    <div className="pb-6">
      {/* Toggle Button */}
      <div
        className="flex items-center cursor-pointer"
        onClick={() => setCommentsOpen((prev) => !prev)}
      >
        <button className="rounded bg-neutral-200 px-2 mr-2">
          {commentsOpen ? (
            <FontAwesomeIcon
              icon={faChevronUp}
              className="size-2.5 align-middle"
            />
          ) : (
            <FontAwesomeIcon
              icon={faChevronDown}
              className="size-2.5 align-middle"
            />
          )}
        </button>
        <h2 className="text-lg font-semibold">Comments</h2>
      </div>

      {commentsOpen && (
        <div className="mt-4 space-y-4">
          <div>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Add a comment"
                className="border border-gray-300 px-3 py-2 rounded-lg w-full"
              />
              <button
                onClick={addComment}
                className="bg-blue-400 hover:bg-blue-500 text-white px-4 py-2 rounded-lg whitespace-nowrap disabled:opacity-60 disabled:cursor-not-allowed"
                disabled={!newComment.trim()}
              >
                Comment
              </button>
            </div>
          </div>

          <div>
            {issueComments.length ? (
              <ul className="space-y-4">
                {issueComments.map((comment) => (
                  <li
                    key={comment.id}
                    className="border border-gray-300 rounded p-4 bg-gray-50"
                  >
                    <div className="flex justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700">
                        <UserName userId={Number(comment.user_id)} />
                      </span>
                      <span className="text-xs text-gray-500">
                        {formatDate(comment.created_at)}
                      </span>
                    </div>
                    <p className="text-gray-600">{comment.comment}</p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-500">No comments yet.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Comments;
