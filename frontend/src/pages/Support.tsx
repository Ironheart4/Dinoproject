// Support.tsx — Donation & Premium support page
// Notes:
// - Provides PayPal donation link and explains premium benefits
// - Shows user's subscription status and success banners after donation
import { useState, useEffect } from 'react'
import { useAuth } from '../lib/auth'
import { Link, useSearchParams } from 'react-router-dom'
import { 
  Check, Heart, Star, Crown, Sparkles, ExternalLink, Gift, Shield, Zap, Users
} from 'lucide-react'
import { useDocumentTitle } from '../lib/useDocumentTitle' 

// PayPal Logo Component - Uses external image for clean rendering
const PayPalLogo = ({ className = "h-6" }: { className?: string }) => (
  <img 
    src="https://i.postimg.cc/jd4CdRgx/paypal.png" 
    alt="PayPal" 
    className={className}
  />
)

interface FeatureItem {
  icon: React.ReactNode
  text: string
  highlight?: boolean
}

export default function Support() {
  useDocumentTitle('Support DinoProject', ' — DinoProject')
  const { user, token } = useAuth()
  const [searchParams] = useSearchParams()
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [isPremium, setIsPremium] = useState(false)

  // PayPal Payment Link - Support DinoProject (unlocks premium features)
  const PAYPAL_DONATION_LINK = 'https://www.paypal.com/ncp/payment/YDVK9Z6XNVBVY'

  useEffect(() => {
    // Check for success return from PayPal
    if (searchParams.get('success') === 'true') {
      setSuccessMessage('🎉 Thank you for your support! Your Premium access is now active.')
    }
  }, [searchParams])

  useEffect(() => {
    // Check if user has premium
    if (token) {
      fetch('http://localhost:5000/api/subscription', {
        headers: { Authorization: `Bearer ${token}` }
      })
        .then(res => res.json())
        .then(data => {
          if (data.plan === 'premium' || data.plan === 'donor') {
            setIsPremium(data.status === 'active')
          }
        })
        .catch(() => {})
    }
  }, [token])

  const handleDonate = () => {
    // Open PayPal Payment Link in new tab
    window.open(PAYPAL_DONATION_LINK, '_blank')
  }

  const premiumFeatures: FeatureItem[] = [
    { icon: <Sparkles className="text-yellow-400" size={20} />, text: 'Full 3D Model Access', highlight: true },
    { icon: <Crown className="text-purple-400" size={20} />, text: 'Unlimited Favorites' },
    { icon: <Zap className="text-blue-400" size={20} />, text: 'AI Dino Assistant' },
    { icon: <Gift className="text-pink-400" size={20} />, text: 'Download Resources' },
    { icon: <Shield className="text-green-400" size={20} />, text: 'Priority Support' },
    { icon: <Star className="text-orange-400" size={20} />, text: 'Early Access to New Features' },
  ]

  const freeFeatures = [
    'Browse all dinosaur images',
    'Unlimited quizzes',
    'Timeline explorer',
    'Video content',
    'Save up to 5 favorites',
    'Community access',
  ]

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 py-8 sm:py-12">
      <div className="max-w-4xl mx-auto px-3 sm:px-4">
        {/* Success Banner */}
        {successMessage && (
          <div className="mb-8 p-4 rounded-xl bg-gradient-to-r from-green-500 to-emerald-500 text-white text-center shadow-lg animate-pulse">
            <p className="font-semibold text-lg">{successMessage}</p>
          </div>
        )}

        {/* Header */}
        <div className="text-center mb-8 sm:mb-12">
          <div className="inline-flex items-center gap-2 bg-pink-500/20 text-pink-400 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-medium mb-4">
            <Heart size={16} /> Support Our Mission
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-heading font-bold text-white mb-3 sm:mb-4">
            Support <span className="text-primary">DinoProject</span>
          </h1>
          <p className="text-base sm:text-xl text-gray-300 max-w-2xl mx-auto px-2">
            Help us bring dinosaurs to life! Your one-time donation unlocks premium features forever.
          </p>
        </div>

        {/* Already Premium Banner */}
        {isPremium && (
          <div className="mb-6 sm:mb-8 p-4 sm:p-6 rounded-2xl bg-gradient-to-r from-yellow-500 to-orange-500 text-white text-center shadow-xl">
            <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-3 mb-2">
              <Crown size={24} className="sm:w-7 sm:h-7" />
              <span className="text-xl sm:text-2xl font-bold">You're a Premium Supporter!</span>
            </div>
            <p className="text-white/90 text-sm sm:text-base">Thank you for supporting DinoProject. You have access to all premium features!</p>
          </div>
        )}

        {/* Main Donation Card */}
        <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl sm:rounded-3xl border border-gray-700 overflow-hidden shadow-2xl mb-8 sm:mb-12">
          {/* Top Banner */}
          <div className="bg-gradient-to-r from-primary to-green-500 px-4 sm:px-6 py-3 sm:py-4 text-center">
            <span className="text-white font-bold text-sm sm:text-lg">🦕 One-Time Donation — Permanent Premium Access</span>
          </div>

          <div className="p-4 sm:p-8 md:p-10">
            <div className="grid md:grid-cols-2 gap-6 sm:gap-8">
              {/* Left - Donation Details */}
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-white mb-3 sm:mb-4 flex items-center gap-2">
                  <Gift className="text-primary" /> Make a Donation
                </h2>
                <p className="text-sm sm:text-base text-gray-300 mb-4 sm:mb-6">
                  Support DinoProject with a one-time donation of <strong className="text-primary">$5 or more</strong>. 
                  Your contribution helps us maintain and improve the platform.
                </p>

                {/* Amount Display */}
                <div className="bg-gray-700/50 rounded-xl p-4 sm:p-6 mb-4 sm:mb-6 text-center">
                  <div className="text-xs sm:text-sm text-gray-400 mb-1">Minimum Donation</div>
                  <div className="text-4xl sm:text-5xl font-bold text-white mb-1">
                    $5<span className="text-xl sm:text-2xl text-gray-400">+</span>
                  </div>
                  <div className="text-xs sm:text-sm text-gray-400">One-time payment</div>
                </div>

                {/* Donate Button */}
                {!isPremium ? (
                  <button
                    onClick={handleDonate}
                    className="w-full py-4 px-6 rounded-xl bg-[#0070BA] hover:bg-[#005C9A] text-white font-bold text-lg flex items-center justify-center gap-3 transition-all shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98]"
                  >
                    <PayPalLogo className="h-6" />
                    Donate with PayPal
                    <ExternalLink size={18} />
                  </button>
                ) : (
                  <div className="w-full py-4 px-6 rounded-xl bg-green-600 text-white font-bold text-lg flex items-center justify-center gap-3">
                    <Check size={24} />
                    Already a Supporter!
                  </div>
                )}

                <p className="text-xs text-gray-500 mt-4 text-center">
                  You'll be redirected to PayPal's secure payment page. After payment, email us at{' '}
                  <a href="mailto:dinoprojectoriginal@gmail.com" className="text-primary hover:underline">
                    dinoprojectoriginal@gmail.com
                  </a>{' '}
                  with your PayPal transaction ID to activate your premium access.
                </p>
              </div>

              {/* Right - What You Get */}
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-white mb-3 sm:mb-4 flex items-center gap-2">
                  <Sparkles className="text-yellow-400" /> What You Get
                </h2>
                <p className="text-sm sm:text-base text-gray-300 mb-4 sm:mb-6">
                  Unlock all premium features <strong className="text-green-400">permanently</strong> with a single donation:
                </p>

                <ul className="space-y-3 sm:space-y-4">
                  {premiumFeatures.map((feature, i) => (
                    <li 
                      key={i} 
                      className={`flex items-center gap-3 p-3 rounded-lg ${
                        feature.highlight 
                          ? 'bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border border-yellow-500/30' 
                          : 'bg-gray-700/30'
                      }`}
                    >
                      {feature.icon}
                      <span className="text-white font-medium">{feature.text}</span>
                      {feature.highlight && (
                        <span className="ml-auto text-xs bg-yellow-500 text-black px-2 py-0.5 rounded-full font-bold">
                          POPULAR
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Free Plan Section */}
        <div className="bg-gray-800/50 rounded-xl sm:rounded-2xl border border-gray-700 p-4 sm:p-8 mb-8 sm:mb-12">
          <h2 className="text-lg sm:text-xl font-bold text-white mb-3 sm:mb-4 flex items-center gap-2">
            <Users className="text-gray-400" /> Free Plan Features
          </h2>
          <p className="text-sm sm:text-base text-gray-400 mb-3 sm:mb-4">
            Not ready to donate? No problem! You can still enjoy these features for free:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 sm:gap-3">
            {freeFeatures.map((feature, i) => (
              <div key={i} className="flex items-center gap-2 text-sm sm:text-base text-gray-300">
                <Check size={16} className="text-gray-500 shrink-0" />
                {feature}
              </div>
            ))}
          </div>
        </div>

        {/* FAQ Section */}
        <div className="bg-gray-800/50 rounded-xl sm:rounded-2xl border border-gray-700 p-4 sm:p-8">
          <h2 className="text-lg sm:text-xl font-bold text-white mb-4 sm:mb-6">Frequently Asked Questions</h2>
          
          <div className="space-y-4 sm:space-y-6">
            <div>
              <h3 className="font-semibold text-white mb-1 sm:mb-2 text-sm sm:text-base">How do I get premium access after donating?</h3>
              <p className="text-gray-400 text-sm sm:text-base">
                After making your donation on PayPal, send an email to{' '}
                <a href="mailto:dinoprojectoriginal@gmail.com" className="text-primary hover:underline">
                  dinoprojectoriginal@gmail.com
                </a>{' '}
                with your PayPal transaction ID and the email you used on DinoProject. We'll activate your premium access within 24 hours.
              </p>
            </div>
            
            <div>
              <h3 className="font-semibold text-white mb-1 sm:mb-2 text-sm sm:text-base">Is this a subscription or one-time payment?</h3>
              <p className="text-gray-400 text-sm sm:text-base">
                This is a <strong className="text-green-400">one-time donation</strong>. There are no recurring charges, no subscriptions, 
                and no automatic billing. You pay once and get permanent premium access.
              </p>
            </div>
            
            <div>
              <h3 className="font-semibold text-white mb-1 sm:mb-2 text-sm sm:text-base">What's the minimum donation amount?</h3>
              <p className="text-gray-400 text-sm sm:text-base">
                The minimum donation is <strong className="text-primary">$5 USD</strong>. You can donate more if you'd like to 
                provide extra support for the project!
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-white mb-1 sm:mb-2 text-sm sm:text-base">What payment methods are accepted?</h3>
              <p className="text-gray-400 text-sm sm:text-base">
                We accept payments through PayPal, which supports credit cards, debit cards, and PayPal balance.
              </p>
            </div>
          </div>
        </div>

        {/* Contact */}
        <div className="text-center mt-8 sm:mt-12 text-gray-400 text-sm sm:text-base">
          <p>
            Questions? Contact us at{' '}
            <a href="mailto:dinoprojectoriginal@gmail.com" className="text-primary hover:underline">
              dinoprojectoriginal@gmail.com
            </a>
          </p>
        </div>

        {/* Not logged in prompt */}
        {!user && (
          <div className="mt-6 sm:mt-8 text-center">
            <p className="text-gray-400 mb-3 sm:mb-4 text-sm sm:text-base">
              Already donated?{' '}
              <Link to="/login" className="text-primary hover:underline">
                Log in
              </Link>{' '}
              to check your premium status.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
