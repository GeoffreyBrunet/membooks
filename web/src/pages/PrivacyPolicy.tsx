import { Link } from "@tanstack/react-router";

export function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-6">
      <div className="max-w-3xl mx-auto">
        <Link
          to="/login"
          className="inline-block mb-8 text-coral hover:text-coral/80 font-medium transition-colors"
        >
          &larr; Back
        </Link>

        <div className="bg-white border-2 border-gray-900 rounded-xl p-8 neo-shadow-md">
          <h1 className="font-title text-3xl text-gray-900 mb-2">Privacy Policy</h1>
          <p className="text-sm text-gray-500 mb-8">Last updated: February 1, 2025</p>

          <div className="space-y-8 text-gray-700 leading-relaxed">
            <section>
              <h2 className="font-title text-xl text-gray-900 mb-3">1. Introduction</h2>
              <p>
                Membooks ("we", "our", "us") is a book collection management application.
                This Privacy Policy explains how we collect, use, store, and protect your
                personal data when you use our web application and mobile app
                (collectively, the "Service").
              </p>
              <p className="mt-2">
                We are committed to complying with the General Data Protection Regulation
                (GDPR) and applicable data protection laws.
              </p>
            </section>

            <section>
              <h2 className="font-title text-xl text-gray-900 mb-3">2. Data We Collect</h2>

              <h3 className="font-semibold text-gray-900 mt-4 mb-2">2.1 Account Data</h3>
              <p>When you create an account, we collect:</p>
              <ul className="list-disc ml-6 mt-2 space-y-1">
                <li>Email address</li>
                <li>Username</li>
                <li>Password (stored as a secure bcrypt hash, never in plain text)</li>
                <li>Language preference</li>
              </ul>

              <h3 className="font-semibold text-gray-900 mt-4 mb-2">2.2 Book Library Data</h3>
              <p>
                Your book collection data (titles, authors, reading status, notes) is
                stored <strong>locally on your device</strong> (browser localStorage or
                mobile SQLite database). This data is not transmitted to our servers.
              </p>

              <h3 className="font-semibold text-gray-900 mt-4 mb-2">2.3 Payment Data</h3>
              <p>
                If you subscribe to Membooks Premium, payment processing is handled
                entirely by <strong>Stripe</strong>. We do not store your credit card
                number, billing address, or other payment details. We only store a Stripe
                customer identifier and subscription status to manage your premium access.
              </p>

              <h3 className="font-semibold text-gray-900 mt-4 mb-2">2.4 Data We Do Not Collect</h3>
              <p>We do not collect:</p>
              <ul className="list-disc ml-6 mt-2 space-y-1">
                <li>Usage analytics or activity tracking</li>
                <li>Device identifiers or advertising IDs</li>
                <li>Location data</li>
                <li>Contacts or address book data</li>
                <li>Crash reports or telemetry</li>
              </ul>
            </section>

            <section>
              <h2 className="font-title text-xl text-gray-900 mb-3">3. How We Use Your Data</h2>
              <p>We use your personal data exclusively to:</p>
              <ul className="list-disc ml-6 mt-2 space-y-1">
                <li>Authenticate you and provide access to the Service</li>
                <li>Manage your premium subscription</li>
                <li>Send transactional emails related to your account (password resets, subscription changes)</li>
              </ul>
              <p className="mt-2">
                We do not sell, rent, or share your personal data with third parties for
                marketing purposes.
              </p>
            </section>

            <section>
              <h2 className="font-title text-xl text-gray-900 mb-3">4. Third-Party Services</h2>

              <h3 className="font-semibold text-gray-900 mt-4 mb-2">4.1 Stripe</h3>
              <p>
                We use Stripe for payment processing. When you subscribe, your payment
                information is sent directly to Stripe and governed by their{" "}
                <a
                  href="https://stripe.com/privacy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-coral hover:underline"
                >
                  Privacy Policy
                </a>.
              </p>

              <h3 className="font-semibold text-gray-900 mt-4 mb-2">4.2 Open Library</h3>
              <p>
                We use the Open Library API to search for books and retrieve cover images.
                Search queries are sent anonymously — no personal data is shared with
                Open Library.
              </p>
            </section>

            <section>
              <h2 className="font-title text-xl text-gray-900 mb-3">5. Data Storage and Security</h2>
              <p>
                Your account data is stored in a PostgreSQL database. Passwords are hashed
                using bcrypt. Authentication is handled via JWT tokens with a 7-day
                expiration.
              </p>
              <p className="mt-2">
                Book library data is stored locally on your device and is not backed up
                to our servers.
              </p>
            </section>

            <section>
              <h2 className="font-title text-xl text-gray-900 mb-3">6. Your Rights (GDPR)</h2>
              <p>If you are located in the European Union, you have the right to:</p>
              <ul className="list-disc ml-6 mt-2 space-y-1">
                <li><strong>Access</strong> your personal data</li>
                <li><strong>Rectify</strong> inaccurate data (via your profile settings)</li>
                <li><strong>Delete</strong> your account and all associated data</li>
                <li><strong>Export</strong> your data in a portable format</li>
                <li><strong>Object</strong> to processing of your data</li>
              </ul>
              <p className="mt-2">
                You can delete your account at any time from the Profile page. This
                permanently removes all your data from our servers.
              </p>
            </section>

            <section>
              <h2 className="font-title text-xl text-gray-900 mb-3">7. Data Retention</h2>
              <p>
                We retain your account data for as long as your account is active. When
                you delete your account, all personal data is permanently removed from
                our systems. Stripe may retain payment records as required by financial
                regulations.
              </p>
            </section>

            <section>
              <h2 className="font-title text-xl text-gray-900 mb-3">8. Children's Privacy</h2>
              <p>
                The Service is not intended for children under 16 years of age. We do not
                knowingly collect personal data from children.
              </p>
            </section>

            <section>
              <h2 className="font-title text-xl text-gray-900 mb-3">9. Changes to This Policy</h2>
              <p>
                We may update this Privacy Policy from time to time. We will notify you
                of significant changes by email or through the Service. Your continued
                use of the Service after changes constitutes acceptance of the updated
                policy.
              </p>
            </section>

            <section>
              <h2 className="font-title text-xl text-gray-900 mb-3">10. Contact</h2>
              <p>
                For any questions about this Privacy Policy or to exercise your rights,
                please contact us at:{" "}
                <a href="mailto:contact@membooks.app" className="text-coral hover:underline">
                  contact@membooks.app
                </a>
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
