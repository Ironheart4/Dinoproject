import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { MessageSquare, Users, Clock, ChevronRight, TrendingUp, Plus, Send, X } from "lucide-react";
import { api } from "../lib/api";
import { useDocumentTitle } from "../lib/useDocumentTitle";
import { useAuth } from "../lib/auth";

interface Category {
  id: number;
  name: string;
  description: string;
  slug: string;
  _count: { posts: number };
}

interface RecentPost {
  id: number;
  title: string;
  createdAt: string;
  viewCount: number;
  user: { id: string; name: string; role: string };
  category: { id: number; name: string; slug: string };
  _count: { replies: number };
}

export default function Forum() {
  useDocumentTitle('Community Forum');
  const { user } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [recentPosts, setRecentPosts] = useState<RecentPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewPost, setShowNewPost] = useState(false);
  const [newPost, setNewPost] = useState({ categoryId: "", title: "", content: "" });
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState("");

  const fetchData = async () => {
    try {
      const [catRes, postsRes] = await Promise.all([
        api.get("/api/forum/categories"),
        api.get("/api/forum/posts/recent")
      ]);
      setCategories(catRes.data);
      setRecentPosts(postsRes.data);
    } catch (error) {
      console.error("Failed to fetch forum data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

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

  const getCategoryIcon = (slug: string) => {
    switch (slug) {
      case "general": return <MessageSquare className="w-6 h-6" />;
      case "questions": return <Users className="w-6 h-6" />;
      case "show-and-tell": return <TrendingUp className="w-6 h-6" />;
      default: return <MessageSquare className="w-6 h-6" />;
    }
  };

  const handleSubmitPost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      setError("You must be logged in to post");
      return;
    }
    if (!newPost.categoryId || !newPost.title || !newPost.content) {
      setError("Please fill in all fields");
      return;
    }

    setPosting(true);
    setError("");

    try {
      const token = localStorage.getItem("sb_token");
      await api.post("/api/forum/posts", newPost, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setNewPost({ categoryId: "", title: "", content: "" });
      setShowNewPost(false);
      fetchData(); // Refresh posts
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to create post");
    } finally {
      setPosting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">
            🦖 Dino Community Forum
          </h1>
          <p className="text-gray-400">
            Connect with fellow dinosaur enthusiasts, ask questions, and share discoveries!
          </p>
        </div>
        
        {user ? (
          <button
            onClick={() => setShowNewPost(true)}
            className="px-6 py-3 bg-green-600 hover:bg-green-500 text-white font-semibold rounded-lg flex items-center gap-2 transition"
          >
            <Plus size={20} /> New Post
          </button>
        ) : (
          <Link
            to="/login"
            className="px-6 py-3 bg-green-600 hover:bg-green-500 text-white font-semibold rounded-lg flex items-center gap-2 transition"
          >
            Login to Post
          </Link>
        )}
      </div>

      {/* New Post Modal */}
      {showNewPost && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-xl max-w-2xl w-full p-6 border border-gray-700">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white">Create New Post</h2>
              <button onClick={() => setShowNewPost(false)} className="text-gray-400 hover:text-white">
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmitPost} className="space-y-4">
              <div>
                <label className="block text-sm text-gray-300 mb-2">Category</label>
                <select
                  value={newPost.categoryId}
                  onChange={(e) => setNewPost({ ...newPost, categoryId: e.target.value })}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg p-3 text-white"
                  required
                >
                  <option value="">Select a category...</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm text-gray-300 mb-2">Title</label>
                <input
                  type="text"
                  value={newPost.title}
                  onChange={(e) => setNewPost({ ...newPost, title: e.target.value })}
                  placeholder="What's your post about?"
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg p-3 text-white placeholder-gray-400"
                  required
                />
              </div>

              <div>
                <label className="block text-sm text-gray-300 mb-2">Content</label>
                <textarea
                  value={newPost.content}
                  onChange={(e) => setNewPost({ ...newPost, content: e.target.value })}
                  placeholder="Share your thoughts, questions, or discoveries..."
                  rows={6}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg p-3 text-white placeholder-gray-400 resize-none"
                  required
                />
              </div>

              {error && (
                <p className="text-red-400 text-sm">{error}</p>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  disabled={posting}
                  className="flex-1 px-6 py-3 bg-green-600 hover:bg-green-500 disabled:bg-gray-600 text-white font-semibold rounded-lg flex items-center justify-center gap-2 transition"
                >
                  {posting ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-white" />
                  ) : (
                    <>
                      <Send size={18} /> Post
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setShowNewPost(false)}
                  className="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Categories */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-xl font-semibold text-white mb-4">
            Categories
          </h2>
          
          {categories.length === 0 ? (
            <div className="bg-gray-800 rounded-lg p-8 text-center border border-gray-700">
              <MessageSquare className="w-12 h-12 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-400">
                No categories yet. Check back soon!
              </p>
            </div>
          ) : (
            categories.map((cat) => (
              <Link
                key={cat.id}
                to={`/forum/category/${cat.slug}`}
                className="block bg-gray-800 rounded-lg p-5 hover:bg-gray-750 hover:border-green-500/50 transition border border-gray-700"
              >
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-green-900/30 text-green-400 rounded-lg">
                    {getCategoryIcon(cat.slug)}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-white">
                      {cat.name}
                    </h3>
                    <p className="text-sm text-gray-400">
                      {cat.description}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-2xl font-bold text-green-400">
                      {cat._count.posts}
                    </span>
                    <p className="text-xs text-gray-400">posts</p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400" />
                </div>
              </Link>
            ))
          )}
        </div>

        {/* Recent Activity Sidebar */}
        <div>
          <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5" /> Recent Activity
          </h2>
          
          <div className="bg-gray-800 rounded-lg border border-gray-700 divide-y divide-gray-700">
            {recentPosts.length === 0 ? (
              <div className="p-6 text-center text-gray-400">
                No posts yet. Be the first to post!
              </div>
            ) : (
              recentPosts.slice(0, 8).map((post) => (
                <Link
                  key={post.id}
                  to={`/forum/post/${post.id}`}
                  className="block p-4 hover:bg-gray-700/50 transition-colors"
                >
                  <h4 className="font-medium text-white text-sm line-clamp-2 mb-1">
                    {post.title}
                  </h4>
                  <div className="flex items-center justify-between text-xs text-gray-400">
                    <span>by {post.user.name}</span>
                    <span>{formatDate(post.createdAt)}</span>
                  </div>
                  <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
                    <span className="bg-gray-700 px-2 py-0.5 rounded">
                      {post.category.name}
                    </span>
                    <span>{post._count.replies} replies</span>
                  </div>
                </Link>
              ))
            )}
          </div>

          {/* Community Stats */}
          <div className="mt-6 bg-gradient-to-br from-green-600 to-emerald-700 rounded-lg p-5 text-white">
            <h3 className="font-semibold mb-3">📊 Community Stats</h3>
            <div className="grid grid-cols-2 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold">{categories.reduce((a, c) => a + c._count.posts, 0)}</p>
                <p className="text-xs text-green-100">Total Posts</p>
              </div>
              <div>
                <p className="text-2xl font-bold">{categories.length}</p>
                <p className="text-xs text-green-100">Categories</p>
              </div>
            </div>
          </div>

          {/* Call to Action */}
          {!user && (
            <div className="mt-6 bg-gray-800 rounded-lg p-5 border border-gray-700 text-center">
              <p className="text-gray-300 mb-3">Join the conversation!</p>
              <Link
                to="/login"
                className="inline-block px-6 py-2 bg-green-600 hover:bg-green-500 text-white font-semibold rounded-lg transition"
              >
                Login to Participate
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
