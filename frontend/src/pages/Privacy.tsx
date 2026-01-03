import { Link } from "react-router-dom";
import { ArrowLeft, Shield, Cookie, Database, Mail, Lock } from "lucide-react";
import MasterLayout from "../components/MasterLayout";

export default function Privacy() {
  return (
    <MasterLayout>
      <div className="max-w-4xl mx-auto px-3 sm:px-4 py-6 sm:py-8">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-gray-400 hover:text-green-500 mb-4 sm:mb-6 text-sm sm:text-base"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Home
        </Link>

        <div className="bg-gray-800 rounded-xl p-4 sm:p-6 md:p-8 border border-gray-700">
          <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
            <Shield className="w-6 sm:w-8 h-6 sm:h-8 text-green-500" />
            <h1 className="text-2xl sm:text-3xl font-bold text-white">Privacy Policy</h1>
          </div>
          
          <p className="text-sm sm:text-base text-gray-400 mb-6 sm:mb-8">
            Last updated: {new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
          </p>

          <div className="space-y-6 sm:space-y-8 text-sm sm:text-base text-gray-300">
            {/* Introduction */}
            <section>
              <h2 className="text-lg sm:text-xl font-semibold text-white mb-2 sm:mb-3 flex items-center gap-2">
                <Lock className="w-4 sm:w-5 h-4 sm:h-5 text-green-500" /> Introduction
              </h2>
              <p>
                Welcome to DinoProject ("we," "our," or "us"). We are committed to protecting your personal information 
                and your right to privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard 
                your information when you visit our website and use our services.
              </p>
            </section>

            {/* Information We Collect */}
            <section>
              <h2 className="text-lg sm:text-xl font-semibold text-white mb-2 sm:mb-3 flex items-center gap-2">
                <Database className="w-4 sm:w-5 h-4 sm:h-5 text-green-500" /> Information We Collect
              </h2>
              <p className="mb-2 sm:mb-3">We collect information that you provide directly to us:</p>
              <ul className="list-disc list-inside space-y-1 sm:space-y-2 ml-2 sm:ml-4">
                <li><strong>Account Information:</strong> Name, email address, and password when you register</li>
                <li><strong>Profile Data:</strong> Optional bio and preferences you choose to add</li>
                <li><strong>Quiz Results:</strong> Your scores and progress on dinosaur quizzes</li>
                <li><strong>Favorites:</strong> Dinosaurs you save to your favorites list</li>
                <li><strong>Forum Posts:</strong> Content you post in our community forum</li>
                <li><strong>Payment Information:</strong> Processed securely through third-party payment providers</li>
              </ul>
            </section>

            {/* Cookies */}
            <section>
              <h2 className="text-lg sm:text-xl font-semibold text-white mb-2 sm:mb-3 flex items-center gap-2">
                <Cookie className="w-4 sm:w-5 h-4 sm:h-5 text-green-500" /> Cookies & Tracking
              </h2>
              <p className="mb-2 sm:mb-3">We use cookies and similar technologies to:</p>
              <ul className="list-disc list-inside space-y-1 sm:space-y-2 ml-2 sm:ml-4">
                <li>Keep you signed in to your account</li>
                <li>Remember your preferences (dark mode, sound settings)</li>
                <li>Understand how you interact with our site</li>
                <li>Improve our services based on usage patterns</li>
              </ul>
              <p className="mt-3">
                You can control cookies through your browser settings. Declining cookies may limit some features.
              </p>
            </section>

            {/* How We Use Your Information */}
            <section>
              <h2 className="text-lg sm:text-xl font-semibold text-white mb-2 sm:mb-3">How We Use Your Information</h2>
              <ul className="list-disc list-inside space-y-1 sm:space-y-2 ml-2 sm:ml-4">
                <li>Provide, maintain, and improve our services</li>
                <li>Process your subscriptions and payments</li>
                <li>Send you updates about your account and our services</li>
                <li>Respond to your comments and questions</li>
                <li>Monitor and analyze usage trends</li>
                <li>Protect against fraudulent or illegal activity</li>
              </ul>
            </section>

            {/* Data Sharing */}
            <section>
              <h2 className="text-lg sm:text-xl font-semibold text-white mb-2 sm:mb-3">Information Sharing</h2>
              <p className="mb-2 sm:mb-3">We do not sell your personal information. We may share data with:</p>
              <ul className="list-disc list-inside space-y-1 sm:space-y-2 ml-2 sm:ml-4">
                <li><strong>Service Providers:</strong> Companies that help us operate (hosting, payment processing)</li>
                <li><strong>Legal Requirements:</strong> When required by law or to protect our rights</li>
                <li><strong>Business Transfers:</strong> In connection with any merger or acquisition</li>
              </ul>
            </section>

            {/* Your Rights */}
            <section>
              <h2 className="text-lg sm:text-xl font-semibold text-white mb-2 sm:mb-3">Your Rights</h2>
              <p className="mb-2 sm:mb-3">You have the right to:</p>
              <ul className="list-disc list-inside space-y-1 sm:space-y-2 ml-2 sm:ml-4">
                <li>Access and receive a copy of your personal data</li>
                <li>Correct inaccurate information</li>
                <li>Request deletion of your account and data</li>
                <li>Object to processing of your data</li>
                <li>Withdraw consent at any time</li>
              </ul>
            </section>

            {/* Data Security */}
            <section>
              <h2 className="text-lg sm:text-xl font-semibold text-white mb-2 sm:mb-3">Data Security</h2>
              <p>
                We implement appropriate security measures to protect your personal information. However, 
                no method of transmission over the Internet is 100% secure, and we cannot guarantee absolute security.
              </p>
            </section>

            {/* Children's Privacy */}
            <section>
              <h2 className="text-lg sm:text-xl font-semibold text-white mb-2 sm:mb-3">Children's Privacy</h2>
              <p>
                DinoProject is designed to be educational and family-friendly. We do not knowingly collect 
                personal information from children under 13 without parental consent. If you believe we have 
                collected such information, please contact us immediately.
              </p>
            </section>

            {/* Contact */}
            <section>
              <h2 className="text-lg sm:text-xl font-semibold text-white mb-2 sm:mb-3 flex items-center gap-2">
                <Mail className="w-4 sm:w-5 h-4 sm:h-5 text-green-500" /> Contact Us
              </h2>
              <p>
                If you have questions about this Privacy Policy or your data, please contact us at:{" "}
                <a href="mailto:dinoprojectoriginal@gmail.com" className="text-green-400 hover:underline">
                  dinoprojectoriginal@gmail.com
                </a>
              </p>
            </section>
          </div>
        </div>
      </div>
    </MasterLayout>
  );
}
