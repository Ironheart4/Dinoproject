import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Plus, MessageSquare, Eye, Pin, Lock, Clock } from "lucide-react";
import MasterLayout from "../components/MasterLayout";
import { api } from "../lib/api";
import { useAuth } from "../lib/auth";

interface Post {
  id: number;
  title: string;
  content: string;
  views: number;
  isPinned: boolean;
  isLocked: boolean;
  createdAt: string;
  user: { id: number; name: string; role: string };
  _count: { replies: number };
}

interface Category {
  id: number;
  name: string;
  description: string;
  slug: string;
  posts: Post[];
}

export default function ForumCategory() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [category, setCategory] = useState<Category | null>(null);
  const [loading, setLoading] = useState(true);
  const [showNewPost, setShowNewPost] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newContent, setNewContent] = useState("");
  const [posting, setPosting] = useState(false);

  useEffect(() => {
    fetchCategory();
  }, [slug]);

  const fetchCategory = async () => {
    try {
      const res = await api.get(`/api/forum/categories/${slug}/posts`);
      setCategory(res.data);
    } catch (error) {
      console.error("Failed to fetch category:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleNewPost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newContent.trim() || !category) return;
    
    setPosting(true);
    try {
      await api.post("/api/forum/posts", {
        title: newTitle,
        content: newContent,
        categoryId: category.id
      });
      setNewTitle("");
      setNewContent("");
      setShowNewPost(false);
      fetchCategory();
    } catch (error) {
      console.error("Failed to create post:", error);
      alert("Failed to create post. Please try again.");
    } finally {
      setPosting(false);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  if (loading) {
    return (
      <MasterLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
        </div>
      </MasterLayout>
    );
  }

  if (!category) {
    return (
      <MasterLayout>
        <div className="max-w-4xl mx-auto px-4 py-8 text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Category Not Found</h1>
          <Link to="/forum" className="text-green-600 hover:underline">Back to Forum</Link>
        </div>
      </MasterLayout>
    );
  }

  return (
    <MasterLayout>
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <Link
          to="/forum"
          className="inline-flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-green-600 mb-6"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Forum
        </Link>

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              {category.name}
            </h1>
            <p className="text-gray-600 dark:text-gray-400">{category.description}</p>
          </div>
          
          {user && (
            <button
              onClick={() => setShowNewPost(!showNewPost)}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
            >
              <Plus className="w-4 h-4" /> New Post
            </button>
          )}
        </div>

        {/* New Post Form */}
        {showNewPost && (
          <form onSubmit={handleNewPost} className="bg-white dark:bg-gray-800 rounded-lg p-6 mb-6 border border-gray-200 dark:border-gray-700">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Create New Post</h3>
            <input
              type="text"
              placeholder="Post title..."
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              className="w-full px-4 py-2 mb-4 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 outline-none"
              required
            />
            <textarea
              placeholder="Write your post content..."
              value={newContent}
              onChange={(e) => setNewContent(e.target.value)}
              rows={5}
              className="w-full px-4 py-2 mb-4 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 outline-none resize-none"
              required
            />
            <div className="flex gap-3">
              <button
                type="submit"
                disabled={posting}
                className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg disabled:opacity-50"
              >
                {posting ? "Posting..." : "Post"}
              </button>
              <button
                type="button"
                onClick={() => setShowNewPost(false)}
                className="px-6 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600"
              >
                Cancel
              </button>
            </div>
          </form>
        )}

        {/* Not logged in prompt */}
        {!user && (
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 mb-6">
            <p className="text-yellow-800 dark:text-yellow-200">
              <Link to="/login" className="font-semibold underline">Log in</Link> to create posts and join the discussion!
            </p>
          </div>
        )}

        {/* Posts List */}
        <div className="space-y-3">
          {category.posts.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 rounded-lg p-8 text-center">
              <MessageSquare className="w-12 h-12 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-500 dark:text-gray-400">
                No posts in this category yet. Be the first to start a discussion!
              </p>
            </div>
          ) : (
            category.posts.map((post) => (
              <Link
                key={post.id}
                to={`/forum/post/${post.id}`}
                className="block bg-white dark:bg-gray-800 rounded-lg p-4 hover:shadow-md transition-shadow border border-gray-200 dark:border-gray-700"
              >
                <div className="flex items-start gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      {post.isPinned && (
                        <Pin className="w-4 h-4 text-yellow-500" />
                      )}
                      {post.isLocked && (
                        <Lock className="w-4 h-4 text-red-500" />
                      )}
                      <h3 className="font-semibold text-gray-900 dark:text-white">
                        {post.title}
                      </h3>
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2 mb-2">
                      {post.content}
                    </p>
                    <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                      <span>by <strong>{post.user.name}</strong></span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {formatDate(post.createdAt)}
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-col items-center gap-2 text-gray-500 dark:text-gray-400 text-sm">
                    <div className="flex items-center gap-1">
                      <MessageSquare className="w-4 h-4" />
                      <span>{post._count.replies}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Eye className="w-4 h-4" />
                      <span>{post.views}</span>
                    </div>
                  </div>
                </div>
              </Link>
            ))
          )}
        </div>
      </div>
    </MasterLayout>
  );
}
