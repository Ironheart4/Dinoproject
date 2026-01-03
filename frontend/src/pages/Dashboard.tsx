import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../lib/auth'
import { useTheme } from '../lib/theme'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line
} from 'recharts'
import {
  Heart, Target, Trophy, TrendingUp, Flame, LayoutDashboard, ScrollText, User,
  BookOpen, FileText, Star, Sparkles, Moon, Sun, CreditCard, Save, Loader2, BarChart3
} from 'lucide-react'

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000'

// Default avatar SVG (blank person silhouette)
const DEFAULT_AVATAR = `data:image/svg+xml,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" fill="%23374151"/><circle cx="50" cy="35" r="18" fill="%236b7280"/><ellipse cx="50" cy="80" rx="30" ry="22" fill="%236b7280"/></svg>')}`

// Chart colors
const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899']

interface DashboardStats {
  user: {
    id: number
    name: string
    email: string
    bio: string | null
    profilePic: string | null
    createdAt: string
  }
  subscription: {
    plan: string
    status: string
  }
  stats: {
    favoritesCount: number
    quizzesCompleted: number
    highestScore: number
    averageScore: number
    activityStreak: number
  }
}

interface ChartData {
  topTypes: { type: string; count: number }[]
  diets: { diet: string; count: number }[]
  quizProgress: { date: string; score: number; quizTitle: string }[]
}

interface Activity {
  favorites: { id: number; dinosaurId: number; dinosaurName: string; date: string }[]
  quizzes: { id: number; quizId: number; quizTitle: string; score: number; date: string }[]
}

export default function Dashboard() {
  const { token, isAdmin } = useAuth()
  const { theme, toggleTheme } = useTheme()

  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [charts, setCharts] = useState<ChartData | null>(null)
  const [activity, setActivity] = useState<Activity | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'overview' | 'activity' | 'profile'>('overview')

  // Profile edit state
  const [editingProfile, setEditingProfile] = useState(false)
  const [editName, setEditName] = useState('')
  const [editBio, setEditBio] = useState('')
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')

  // Fetch all dashboard data
  useEffect(() => {
    if (!token) return

    const headers = { Authorization: `Bearer ${token}` }

    Promise.all([
      fetch(`${API}/api/dashboard/stats`, { headers }).then(r => r.json()),
      fetch(`${API}/api/dashboard/charts`, { headers }).then(r => r.json()),
      fetch(`${API}/api/dashboard/activity`, { headers }).then(r => r.json()),
    ])
      .then(([statsData, chartsData, activityData]) => {
        setStats(statsData)
        setCharts(chartsData)
        setActivity(activityData)
        setEditName(statsData.user.name)
        setEditBio(statsData.user.bio || '')
      })
      .catch(err => console.error('Failed to fetch dashboard data:', err))
      .finally(() => setLoading(false))
  }, [token])

  // Handle profile save
  const handleProfileSave = async () => {
    if (!token) return
    setSaveStatus('saving')

    try {
      const res = await fetch(`${API}/api/user/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name: editName, bio: editBio }),
      })
      const data = await res.json()
      if (res.ok && stats) {
        setStats({
          ...stats,
          user: { ...stats.user, name: data.name, bio: data.bio },
        })
        setSaveStatus('saved')
        setEditingProfile(false)
        setTimeout(() => setSaveStatus('idle'), 2000)
      } else {
        setSaveStatus('error')
      }
    } catch (err) {
      console.error('Save error:', err)
      setSaveStatus('error')
    }
  }

  // Download stats as PDF (Premium/Donor feature)
  const handleDownloadPDF = () => {
    if (!stats || !charts) return

    // Create PDF content using browser print
    const printWindow = window.open('', '_blank')
    if (!printWindow) {
      alert('Please allow popups to download PDF')
      return
    }

    const content = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>DinoProject - ${stats.user.name}'s Statistics</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 40px; background: #fff; color: #333; }
          h1 { color: #10b981; border-bottom: 2px solid #10b981; padding-bottom: 10px; }
          h2 { color: #374151; margin-top: 30px; }
          .stats-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px; margin: 20px 0; }
          .stat-card { background: #f3f4f6; padding: 20px; border-radius: 8px; text-align: center; }
          .stat-value { font-size: 32px; font-weight: bold; color: #10b981; }
          .stat-label { color: #6b7280; margin-top: 5px; }
          .info-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #e5e7eb; }
          .footer { margin-top: 40px; text-align: center; color: #9ca3af; font-size: 12px; }
          @media print { body { padding: 20px; } }
        </style>
      </head>
      <body>
        <h1>🦖 DinoProject Statistics Report</h1>
        <p><strong>Generated for:</strong> ${stats.user.name}</p>
        <p><strong>Email:</strong> ${stats.user.email}</p>
        <p><strong>Plan:</strong> ${stats.subscription.plan.charAt(0).toUpperCase() + stats.subscription.plan.slice(1)}</p>
        <p><strong>Member since:</strong> ${formatDate(stats.user.createdAt)}</p>
        <p><strong>Report date:</strong> ${new Date().toLocaleDateString()}</p>

        <h2>Your Statistics</h2>
        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-value">${stats.stats.favoritesCount}</div>
            <div class="stat-label">❤️ Favorites</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">${stats.stats.quizzesCompleted}</div>
            <div class="stat-label">🎯 Quizzes Completed</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">${stats.stats.highestScore}%</div>
            <div class="stat-label">🏆 Highest Score</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">${stats.stats.averageScore}%</div>
            <div class="stat-label">📈 Average Score</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">${stats.stats.activityStreak}</div>
            <div class="stat-label">🔥 Days Active</div>
          </div>
        </div>

        ${charts.topTypes.length > 0 ? `
        <h2>🦕 Favorite Dinosaur Types</h2>
        <ul>
          ${charts.topTypes.map(t => `<li>${t.type}: ${t.count} dinosaurs</li>`).join('')}
        </ul>
        ` : ''}

        ${charts.quizProgress.length > 0 ? `
        <h2>📝 Recent Quiz Scores</h2>
        <ul>
          ${charts.quizProgress.slice(-5).map(q => `<li>${q.quizTitle}: ${q.score}% (${q.date})</li>`).join('')}
        </ul>
        ` : ''}

        <div class="footer">
          <p>Generated by DinoProject • dinoprojectoriginal@gmail.com</p>
          <p>Thank you for being a premium member! 🦖</p>
        </div>
      </body>
      </html>
    `

    printWindow.document.write(content)
    printWindow.document.close()
    printWindow.onload = () => {
      printWindow.print()
    }
  }

  // Format date
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-gray-400">Loading your dashboard...</p>
        </div>
      </div>
    )
  }

  if (!stats) {
    return (
      <div className="text-center py-12">
        <p className="text-red-400">Failed to load dashboard data.</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-4 px-4 py-2 bg-primary text-white rounded hover:bg-green-600"
        >
          Retry
        </button>
      </div>
    )
  }

  // Admins get premium access for testing purposes
  const isPremium = stats.subscription.plan === 'premium' || isAdmin

  return (
    <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6">
      {/* Header Section */}
      <div className="bg-gradient-to-r from-green-900/50 to-blue-900/50 rounded-xl p-4 sm:p-6 border border-gray-700">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3 sm:gap-4">
            {/* Profile Avatar - User Initial */}
            <div className="w-14 h-14 sm:w-20 sm:h-20 rounded-full bg-gradient-to-br from-primary to-green-600 border-4 border-primary flex items-center justify-center">
              <span className="text-xl sm:text-3xl font-bold text-white">
                {stats.user.name.charAt(0).toUpperCase()}
              </span>
            </div>

            <div>
              <h1 className="text-lg sm:text-2xl font-bold text-white">
                Welcome back, {stats.user.name}!
              </h1>
              <p className="text-gray-400 text-xs sm:text-sm">
                Member since {formatDate(stats.user.createdAt)}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span
              className={`px-3 py-1.5 rounded-full text-sm font-medium ${
                isPremium
                  ? 'bg-gradient-to-r from-yellow-500 to-orange-500 text-white'
                  : 'bg-gray-700 text-gray-300'
              }`}
            >
              {isPremium ? <><Star size={14} className="inline mr-1" /> Premium</> : 'Free Plan'}
            </span>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-1 sm:gap-2 border-b border-gray-700 pb-2 overflow-x-auto">
        {(['overview', 'activity', 'profile'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-3 sm:px-4 py-2 rounded-t-lg font-medium transition whitespace-nowrap text-sm sm:text-base ${
              activeTab === tab
                ? 'bg-primary text-white'
                : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
            }`}
          >
            {tab === 'overview' && <><LayoutDashboard size={16} className="inline mr-1" /> Overview</>}
            {tab === 'activity' && <><ScrollText size={16} className="inline mr-1" /> Activity</>}
            {tab === 'profile' && <><User size={16} className="inline mr-1" /> Profile</>}
          </button>
        ))}
      </div>

      {/* OVERVIEW TAB */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Quick Stats Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <div className="bg-gray-800 rounded-xl p-3 sm:p-5 border border-gray-700">
              <Heart className="w-6 h-6 sm:w-8 sm:h-8 text-red-500 mb-1 sm:mb-2" />
              <div className="text-xl sm:text-3xl font-bold text-white">{stats.stats.favoritesCount}</div>
              <div className="text-xs sm:text-sm text-gray-400">Favorites</div>
            </div>
            <div className="bg-gray-800 rounded-xl p-3 sm:p-5 border border-gray-700">
              <Target className="w-6 h-6 sm:w-8 sm:h-8 text-blue-500 mb-1 sm:mb-2" />
              <div className="text-xl sm:text-3xl font-bold text-white">{stats.stats.quizzesCompleted}</div>
              <div className="text-xs sm:text-sm text-gray-400">Quizzes</div>
            </div>
            <div className="bg-gray-800 rounded-xl p-3 sm:p-5 border border-gray-700">
              <Trophy className="w-6 h-6 sm:w-8 sm:h-8 text-yellow-500 mb-1 sm:mb-2" />
              <div className="text-xl sm:text-3xl font-bold text-white">{stats.stats.highestScore}%</div>
              <div className="text-xs sm:text-sm text-gray-400">Best Score</div>
            </div>
            <div className="bg-gray-800 rounded-xl p-3 sm:p-5 border border-gray-700">
              <Flame className="w-6 h-6 sm:w-8 sm:h-8 text-orange-500 mb-1 sm:mb-2" />
              <div className="text-xl sm:text-3xl font-bold text-white">{stats.stats.activityStreak}</div>
              <div className="text-xs sm:text-sm text-gray-400">Days Active</div>
            </div>
          </div>

          {/* Charts Section */}
          {charts && (
            <div className="grid grid-cols-1 gap-6">
              {/* Bar Chart: Top Dinosaur Types */}
              <div className="bg-gray-800 rounded-xl p-5 border border-gray-700">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2"><BarChart3 size={20} /> Top Dinosaur Types</h3>
                {charts.topTypes.length > 0 ? (
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={charts.topTypes}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                      <XAxis dataKey="type" stroke="#9ca3af" fontSize={12} />
                      <YAxis stroke="#9ca3af" fontSize={12} />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151' }}
                        labelStyle={{ color: '#fff' }}
                      />
                      <Bar dataKey="count" fill="#10b981" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[250px] flex items-center justify-center text-gray-500">
                    <p>Add some favorites to see stats!</p>
                  </div>
                )}
              </div>

              {/* Line Chart: Quiz Progress */}
              <div className="bg-gray-800 rounded-xl p-5 border border-gray-700 lg:col-span-2">
                <h3 className="text-lg font-semibold text-white mb-4">📈 Quiz Progress Over Time</h3>
                {charts.quizProgress.length > 0 ? (
                  <ResponsiveContainer width="100%" height={250}>
                    <LineChart data={charts.quizProgress}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                      <XAxis dataKey="date" stroke="#9ca3af" fontSize={12} />
                      <YAxis stroke="#9ca3af" fontSize={12} domain={[0, 100]} />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151' }}
                        labelStyle={{ color: '#fff' }}
                        formatter={(value: number) => [`${value}%`, 'Score']}
                      />
                      <Line
                        type="monotone"
                        dataKey="score"
                        stroke="#3b82f6"
                        strokeWidth={2}
                        dot={{ fill: '#3b82f6' }}
                        activeDot={{ r: 6 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[250px] flex items-center justify-center text-gray-500">
                    <p>Take some quizzes to track your progress!</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Quick Actions */}
          <div className="bg-gray-800 rounded-xl p-5 border border-gray-700">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2"><Sparkles size={20} /> Quick Actions</h3>
            <div className="flex flex-wrap gap-3">
              <Link
                to="/encyclopedia"
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition flex items-center gap-2"
              >
                <BookOpen size={16} /> Explore Dinosaurs
              </Link>
              <Link
                to="/quiz"
                className="px-4 py-2 bg-primary hover:bg-green-600 text-white rounded-lg transition flex items-center gap-2"
              >
                <Target size={16} /> Take a Quiz
              </Link>
              {isPremium && (
                <button
                  onClick={handleDownloadPDF}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition flex items-center gap-2"
                >
                  <FileText size={16} /> Download Stats PDF
                </button>
              )}
              {!isPremium && (
                <Link
                  to="/support"
                  className="px-4 py-2 bg-gradient-to-r from-pink-500 to-red-500 hover:from-pink-600 hover:to-red-600 text-white rounded-lg transition flex items-center gap-2"
                >
                  <Heart size={16} /> Support Us
                </Link>
              )}
            </div>
          </div>

          {/* Premium Promo for Free Users */}
          {!isPremium && (
            <div className="bg-gradient-to-r from-purple-900/50 to-pink-900/50 rounded-xl p-6 border border-purple-700">
              <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                <div>
                  <h3 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
                    <Sparkles className="text-yellow-400" /> Unlock Premium Features
                  </h3>
                  <p className="text-gray-300">
                    Get access to the AI Dino Assistant, exclusive content, and more!
                  </p>
                  <ul className="mt-2 text-sm text-gray-400 space-y-1">
                    <li>✓ AI-powered dinosaur assistant</li>
                    <li>✓ Unlimited quiz attempts</li>
                    <li>✓ Exclusive content & early access</li>
                    <li>✓ Ad-free experience</li>
                  </ul>
                </div>
                <Link
                  to="/support"
                  className="px-6 py-3 bg-gradient-to-r from-pink-500 to-red-500 text-white font-bold rounded-lg hover:from-pink-600 hover:to-red-600 transition whitespace-nowrap"
                >
                  Support Us →
                </Link>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ACTIVITY TAB */}
      {activeTab === 'activity' && activity && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Favorite Dinosaurs */}
          <div className="bg-gray-800 rounded-xl p-5 border border-gray-700">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2"><Heart size={20} className="text-red-500" /> Favorite Dinosaurs</h3>
            {activity.favorites.length > 0 ? (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {activity.favorites.map((fav) => (
                  <Link
                    key={fav.id}
                    to={`/dino/${fav.dinosaurId}`}
                    className="flex items-center justify-between p-3 bg-gray-700/50 rounded-lg hover:bg-gray-700 transition"
                  >
                    <span className="text-white font-medium flex items-center gap-2"><BookOpen size={16} className="text-primary" /> {fav.dinosaurName}</span>
                    <span className="text-gray-400 text-sm">{formatDate(fav.date)}</span>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">
                No favorites yet. Start exploring dinosaurs!
              </p>
            )}
          </div>

          {/* Quiz History */}
          <div className="bg-gray-800 rounded-xl p-5 border border-gray-700">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2"><Target size={20} className="text-blue-500" /> Quiz History</h3>
            {activity.quizzes.length > 0 ? (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {activity.quizzes.map((quiz) => (
                  <div
                    key={quiz.id}
                    className="flex items-center justify-between p-3 bg-gray-700/50 rounded-lg"
                  >
                    <div>
                      <span className="text-white font-medium">{quiz.quizTitle}</span>
                      <div className="text-gray-400 text-sm">{formatDate(quiz.date)}</div>
                    </div>
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-bold ${
                        quiz.score >= 80
                          ? 'bg-green-900 text-green-300'
                          : quiz.score >= 60
                          ? 'bg-yellow-900 text-yellow-300'
                          : 'bg-red-900 text-red-300'
                      }`}
                    >
                      {quiz.score}%
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">
                No quizzes taken yet. Test your knowledge!
              </p>
            )}
          </div>
        </div>
      )}

      {/* PROFILE TAB */}
      {activeTab === 'profile' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Profile Info */}
          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2"><User size={20} /> Profile Information</h3>
              {!editingProfile && (
                <button
                  onClick={() => setEditingProfile(true)}
                  className="px-3 py-1 text-sm bg-gray-700 hover:bg-gray-600 rounded transition"
                >
                  Edit
                </button>
              )}
            </div>

            {editingProfile ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Display Name</label>
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full p-3 bg-gray-700 rounded-lg border border-gray-600 focus:border-primary focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Bio</label>
                  <textarea
                    value={editBio}
                    onChange={(e) => setEditBio(e.target.value)}
                    placeholder="Tell us about yourself..."
                    rows={4}
                    className="w-full p-3 bg-gray-700 rounded-lg border border-gray-600 focus:border-primary focus:outline-none resize-none"
                  />
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={handleProfileSave}
                    disabled={saveStatus === 'saving'}
                    className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-green-600 transition disabled:opacity-50"
                  >
                    {saveStatus === 'saving' ? <><Loader2 size={16} className="animate-spin" /> Saving...</> : <><Save size={16} /> Save Changes</>}
                  </button>
                  <button
                    onClick={() => {
                      setEditingProfile(false)
                      setEditName(stats.user.name)
                      setEditBio(stats.user.bio || '')
                    }}
                    className="px-4 py-2 bg-gray-700 rounded-lg hover:bg-gray-600 transition"
                  >
                    Cancel
                  </button>
                </div>
                {saveStatus === 'saved' && (
                  <p className="text-green-400 text-sm">✓ Profile saved successfully!</p>
                )}
                {saveStatus === 'error' && (
                  <p className="text-red-400 text-sm">✗ Failed to save. Please try again.</p>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <span className="text-sm text-gray-400">Name</span>
                  <p className="text-white font-medium">{stats.user.name}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-400">Email</span>
                  <p className="text-white">{stats.user.email}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-400">Bio</span>
                  <p className="text-white">{stats.user.bio || 'No bio yet'}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-400">Member Since</span>
                  <p className="text-white">{formatDate(stats.user.createdAt)}</p>
                </div>
              </div>
            )}
          </div>

          {/* Preferences & Settings */}
          <div className="space-y-6">
            {/* Theme Preference */}
            <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2"><Sun size={20} /> Preferences</h3>
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-white">Theme</span>
                  <p className="text-gray-400 text-sm">Choose light or dark mode</p>
                </div>
                <button
                  onClick={toggleTheme}
                  className="px-4 py-2 bg-gray-700 rounded-lg hover:bg-gray-600 transition flex items-center gap-2"
                >
                  {theme === 'dark' ? <><Moon size={16} /> Dark</> : <><Sun size={16} /> Light</>}
                </button>
              </div>
            </div>

            {/* Subscription Status */}
            <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2"><CreditCard size={20} /> Subscription</h3>
              <div className="flex items-center justify-between">
                <div>
                  <span
                    className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                      isPremium
                        ? 'bg-gradient-to-r from-yellow-500 to-orange-500 text-white'
                        : 'bg-gray-700 text-gray-300'
                    }`}
                  >
                    {isPremium ? <><Star size={14} className="inline mr-1" /> Premium</> : 'Free Plan'}
                  </span>
                  <p className="text-gray-400 text-sm mt-2">
                    Status: {stats.subscription.status}
                  </p>
                </div>
                {!isPremium && (
                  <Link
                    to="/support"
                    className="px-4 py-2 bg-gradient-to-r from-pink-500 to-red-500 text-white rounded-lg hover:from-pink-600 hover:to-red-600 transition"
                  >
                    Support Us
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
