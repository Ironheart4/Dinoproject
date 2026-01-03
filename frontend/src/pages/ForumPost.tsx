import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, Send, Trash2, Pin, Lock, Clock, User } from "lucide-react";
import MasterLayout from "../components/MasterLayout";
import { api } from "../lib/api";
import { useAuth } from "../lib/auth";

interface Reply {
  id: number;
  content: string;
  createdAt: string;
  user: { id: number; name: string; role: string };
}

interface Post {
  id: number;
  title: string;
  content: string;
  views: number;
  isPinned: boolean;
  isLocked: boolean;
  createdAt: string;
  user: { id: number; name: string; role: string; createdAt: string };
  category: { id: number; name: string; slug: string };
  replies: Reply[];
}

export default function ForumPost() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [replyContent, setReplyContent] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    fetchPost();
  }, [id]);

  const fetchPost = async () => {
    try {
      const res = await api.get(`/api/forum/posts/${id}`);
      setPost(res.data);
    } catch (error) {
      console.error("Failed to fetch post:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyContent.trim()) return;
    
    setSending(true);
    try {
      await api.post(`/api/forum/posts/${id}/replies`, { content: replyContent });
      setReplyContent("");
      fetchPost();
    } catch (error: any) {
      if (error.response?.data?.error) {
        alert(error.response.data.error);
      } else {
        alert("Failed to post reply.");
      }
    } finally {
      setSending(false);
    }
  };

  const handleDeleteReply = async (replyId: number) => {
    if (!confirm("Delete this reply?")) return;
    try {
      await api.delete(`/api/forum/replies/${replyId}`);
      fetchPost();
    } catch (error) {
      alert("Failed to delete reply.");
    }
  };

  const handleDeletePost = async () => {
    if (!confirm("Delete this post and all replies?")) return;
    try {
      await api.delete(`/api/forum/posts/${id}`);
      window.location.href = `/forum/category/${post?.category.slug}`;
    } catch (error) {
      alert("Failed to delete post.");
    }
  };

  const handlePin = async () => {
    try {
      await api.patch(`/api/forum/posts/${id}/pin`);
      fetchPost();
    } catch (error) {
      alert("Failed to pin/unpin post.");
    }
  };

  const handleLock = async () => {
    try {
      await api.patch(`/api/forum/posts/${id}/lock`);
      fetchPost();
    } catch (error) {
      alert("Failed to lock/unlock post.");
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  const formatMemberSince = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short"
    });
  };

  const canDeletePost = post && user && (Number(user.id) === post.user.id || user.role === "admin");
  const isAdmin = user?.role === "admin";

  if (loading) {
    return (
      <MasterLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
        </div>
      </MasterLayout>
    );
  }

  if (!post) {
    return (
      <MasterLayout>
        <div className="max-w-4xl mx-auto px-4 py-8 text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Post Not Found</h1>
          <Link to="/forum" className="text-green-600 hover:underline">Back to Forum</Link>
        </div>
      </MasterLayout>
    );
  }

  return (
    <MasterLayout>
      <div className="max-w-4xl mx-auto px-3 sm:px-4 py-6 sm:py-8">
        {/* Breadcrumb */}
        <Link
          to={`/forum/category/${post.category.slug}`}
          className="inline-flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-green-600 mb-4 sm:mb-6 text-sm sm:text-base"
        >
          <ArrowLeft className="w-4 h-4" /> Back to {post.category.name}
        </Link>

        {/* Post */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden mb-4 sm:mb-6">
          {/* Post Header */}
          <div className="p-4 sm:p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4">
              <div>
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  {post.isPinned && (
                    <span className="flex items-center gap-1 text-xs bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 px-2 py-0.5 rounded">
                      <Pin className="w-3 h-3" /> Pinned
                    </span>
                  )}
                  {post.isLocked && (
                    <span className="flex items-center gap-1 text-xs bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 px-2 py-0.5 rounded">
                      <Lock className="w-3 h-3" /> Locked
                    </span>
                  )}
                </div>
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
                  {post.title}
                </h1>
              </div>
              
              {/* Admin/Author Actions */}
              <div className="flex items-center gap-2">
                {isAdmin && (
                  <>
                    <button
                      onClick={handlePin}
                      className={`p-2 rounded-lg transition-colors ${post.isPinned ? 'bg-yellow-100 text-yellow-600' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-yellow-100 hover:text-yellow-600'}`}
                      title={post.isPinned ? "Unpin" : "Pin"}
                    >
                      <Pin className="w-4 h-4" />
                    </button>
                    <button
                      onClick={handleLock}
                      className={`p-2 rounded-lg transition-colors ${post.isLocked ? 'bg-red-100 text-red-600' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-red-100 hover:text-red-600'}`}
                      title={post.isLocked ? "Unlock" : "Lock"}
                    >
                      <Lock className="w-4 h-4" />
                    </button>
                  </>
                )}
                {canDeletePost && (
                  <button
                    onClick={handleDeletePost}
                    className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-red-100 hover:text-red-600 transition-colors"
                    title="Delete Post"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Post Content */}
          <div className="flex">
            {/* Author Sidebar - hidden on mobile */}
            <div className="w-24 sm:w-32 p-3 sm:p-4 bg-gray-50 dark:bg-gray-900/50 border-r border-gray-200 dark:border-gray-700 text-center hidden md:block">
              <div className="w-12 sm:w-16 h-12 sm:h-16 mx-auto mb-2 rounded-full bg-gradient-to-br from-green-400 to-emerald-600 flex items-center justify-center text-white text-lg sm:text-xl font-bold">
                {post.user.name.charAt(0).toUpperCase()}
              </div>
              <p className="font-semibold text-gray-900 dark:text-white text-xs sm:text-sm">{post.user.name}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">{post.user.role}</p>
              <p className="text-xs text-gray-400 mt-2 hidden sm:block">
                Member since {formatMemberSince(post.user.createdAt)}
              </p>
            </div>

            {/* Content */}
            <div className="flex-1 p-4 sm:p-6">
              <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-3 sm:mb-4 md:hidden">
                <User className="w-4 h-4" />
                <span>{post.user.name}</span>
              </div>
              <p className="text-sm sm:text-base text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{post.content}</p>
              <div className="flex flex-wrap items-center gap-3 sm:gap-4 mt-4 sm:mt-6 pt-3 sm:pt-4 border-t border-gray-200 dark:border-gray-700 text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                <span className="flex items-center gap-1">
                  <Clock className="w-4 h-4" /> {formatDate(post.createdAt)}
                </span>
                <span>{post.views} views</span>
              </div>
            </div>
          </div>
        </div>

        {/* Replies */}
        <div className="mb-4 sm:mb-6">
          <h2 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-3 sm:mb-4">
            Replies ({post.replies.length})
          </h2>
          
          {post.replies.length === 0 ? (
            <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4 sm:p-6 text-center text-sm sm:text-base text-gray-500 dark:text-gray-400">
              No replies yet. Be the first to respond!
            </div>
          ) : (
            <div className="space-y-3 sm:space-y-4">
              {post.replies.map((reply) => (
                <div
                  key={reply.id}
                  className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-3 sm:p-4"
                >
                  <div className="flex items-start gap-2 sm:gap-3">
                    <div className="w-8 sm:w-10 h-8 sm:h-10 rounded-full bg-gradient-to-br from-blue-400 to-indigo-600 flex items-center justify-center text-white font-bold flex-shrink-0 text-sm sm:text-base">
                      {reply.user.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-semibold text-gray-900 dark:text-white text-sm sm:text-base">
                            {reply.user.name}
                          </span>
                          {reply.user.role === "admin" && (
                            <span className="text-xs bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 px-2 py-0.5 rounded">
                              Admin
                            </span>
                          )}
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {formatDate(reply.createdAt)}
                          </span>
                        </div>
                        {user && (Number(user.id) === reply.user.id || user.role === "admin") && (
                          <button
                            onClick={() => handleDeleteReply(reply.id)}
                            className="text-gray-400 hover:text-red-500 transition-colors"
                            title="Delete reply"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                      <p className="text-sm sm:text-base text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                        {reply.content}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Reply Form */}
        {!post.isLocked && user ? (
          <form onSubmit={handleReply} className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-3 sm:p-4">
            <textarea
              placeholder="Write your reply..."
              value={replyContent}
              onChange={(e) => setReplyContent(e.target.value)}
              rows={3}
              className="w-full px-3 sm:px-4 py-2 mb-2 sm:mb-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 outline-none resize-none text-sm sm:text-base"
              required
            />
            <button
              type="submit"
              disabled={sending}
              className="flex items-center justify-center gap-2 px-4 sm:px-5 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg disabled:opacity-50 transition-colors w-full sm:w-auto text-sm sm:text-base"
            >
              <Send className="w-4 h-4" /> {sending ? "Sending..." : "Reply"}
            </button>
          </form>
        ) : post.isLocked ? (
          <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4 text-center text-gray-500 dark:text-gray-400">
            <Lock className="w-5 h-5 inline-block mr-2" />
            This thread is locked. No new replies can be posted.
          </div>
        ) : (
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 text-center">
            <p className="text-yellow-800 dark:text-yellow-200">
              <Link to="/login" className="font-semibold underline">Log in</Link> to reply to this thread.
            </p>
          </div>
        )}
      </div>
    </MasterLayout>
  );
}
