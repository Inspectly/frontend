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
}

const Comments: React.FC<CommentsProps> = ({ issueId }) => {
  const { data: comments, error, isLoading } = useGetCommentsQuery();
  const [createAttachment] = useCreateCommentMutation();

  const [commentsOpen, setCommentsOpen] = useState(true);
  const [newComment, setNewComment] = useState("");

  const issueComments = useMemo(() => {
    return comments?.filter((comment) => comment.issue_id === issueId) || [];
  }, [comments, issueId]);

  const addComment = async () => {
    if (newComment.trim() && issueId) {
      try {
        await createAttachment({
          issueId,
          comment: newComment,
          userId: 48,
        }).unwrap();
        setNewComment("");
      } catch (error) {
        console.log(error);
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
        <div className="mt-4">
          {/* Comments List */}
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

          {/* Add New Comment */}
          <div className="mt-4">
            <input
              type="text"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Add a comment"
              className="border border-gray-300 px-3 py-2 rounded-lg mb-2 w-full"
            />
            <div className="flex justify-end">
              <button
                onClick={addComment}
                className="bg-blue-400 hover:bg-blue-500 text-white px-4 py-2 rounded-lg"
                disabled={!newComment.trim()}
              >
                Comment
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Comments;
