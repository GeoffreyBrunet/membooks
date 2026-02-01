import { Link } from "@tanstack/react-router";
import { usePageTitle } from "../hooks/usePageTitle";

export function TermsPage() {
  usePageTitle("Terms of Service");
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
          <h1 className="font-title text-3xl text-gray-900 mb-2">Terms of Service</h1>
          <p className="text-sm text-gray-500 mb-8">Last updated: February 1, 2025</p>

          <div className="space-y-8 text-gray-700 leading-relaxed">
            <section>
              <h2 className="font-title text-xl text-gray-900 mb-3">1. Acceptance of Terms</h2>
              <p>
                By creating an account or using Membooks ("the Service"), you agree to be
                bound by these Terms of Service. If you do not agree, you may not use the
                Service.
              </p>
            </section>

            <section>
              <h2 className="font-title text-xl text-gray-900 mb-3">2. Description of the Service</h2>
              <p>
                Membooks is a personal book collection management application available as
                a web application and mobile app. The Service allows you to:
              </p>
              <ul className="list-disc ml-6 mt-2 space-y-1">
                <li>Catalog and organize your book collection</li>
                <li>Track your reading progress</li>
                <li>Search for books via the Open Library catalog</li>
                <li>Manage book series and wishlists</li>
                <li>View reading statistics</li>
              </ul>
            </section>

            <section>
              <h2 className="font-title text-xl text-gray-900 mb-3">3. Account Registration</h2>
              <p>To use the Service, you must create an account by providing:</p>
              <ul className="list-disc ml-6 mt-2 space-y-1">
                <li>A valid email address</li>
                <li>A unique username (3-30 characters)</li>
                <li>A password (minimum 8 characters)</li>
              </ul>
              <p className="mt-2">
                You are responsible for maintaining the confidentiality of your account
                credentials and for all activities under your account.
              </p>
            </section>

            <section>
              <h2 className="font-title text-xl text-gray-900 mb-3">4. Premium Subscription</h2>

              <h3 className="font-semibold text-gray-900 mt-4 mb-2">4.1 Pricing and Billing</h3>
              <p>
                Membooks offers a Premium subscription with additional features. Payment
                is processed securely through Stripe. Subscription prices are displayed
                before purchase and may be updated with prior notice.
              </p>

              <h3 className="font-semibold text-gray-900 mt-4 mb-2">4.2 Cancellation</h3>
              <p>
                You may cancel your Premium subscription at any time from your account
                settings. Upon cancellation, you retain Premium access until the end of
                the current billing period. No prorated refunds are provided for partial
                billing periods.
              </p>

              <h3 className="font-semibold text-gray-900 mt-4 mb-2">4.3 Reactivation</h3>
              <p>
                If you cancel your subscription, you may reactivate it before the end of
                the current billing period to maintain uninterrupted access.
              </p>
            </section>

            <section>
              <h2 className="font-title text-xl text-gray-900 mb-3">5. User Content</h2>
              <p>
                Your book library data (book titles, notes, reading status) is stored
                locally on your device. You retain full ownership of this data. We do not
                access, use, or share your library content.
              </p>
            </section>

            <section>
              <h2 className="font-title text-xl text-gray-900 mb-3">6. Acceptable Use</h2>
              <p>You agree not to:</p>
              <ul className="list-disc ml-6 mt-2 space-y-1">
                <li>Use the Service for any unlawful purpose</li>
                <li>Attempt to gain unauthorized access to the Service or its systems</li>
                <li>Interfere with or disrupt the Service</li>
                <li>Create multiple accounts to abuse free or premium features</li>
                <li>Use automated tools to scrape or extract data from the Service</li>
              </ul>
              <p className="mt-2">
                Violation of these terms may result in immediate account suspension or
                termination.
              </p>
            </section>

            <section>
              <h2 className="font-title text-xl text-gray-900 mb-3">7. Third-Party Services</h2>
              <p>
                The Service integrates with third-party services subject to their own
                terms:
              </p>
              <ul className="list-disc ml-6 mt-2 space-y-1">
                <li>
                  <strong>Stripe</strong> — for payment processing (
                  <a
                    href="https://stripe.com/legal"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-coral hover:underline"
                  >
                    Stripe Terms
                  </a>
                  )
                </li>
                <li>
                  <strong>Open Library</strong> — for book search and cover images (
                  <a
                    href="https://openlibrary.org/terms"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-coral hover:underline"
                  >
                    Open Library Terms
                  </a>
                  )
                </li>
              </ul>
            </section>

            <section>
              <h2 className="font-title text-xl text-gray-900 mb-3">8. Account Deletion</h2>
              <p>
                You may delete your account at any time from the Profile page. Account
                deletion is permanent and will:
              </p>
              <ul className="list-disc ml-6 mt-2 space-y-1">
                <li>Remove all your personal data from our servers</li>
                <li>Cancel any active Premium subscription</li>
                <li>Revoke access to the Service</li>
              </ul>
              <p className="mt-2">
                Book library data stored locally on your device will not be affected by
                account deletion.
              </p>
            </section>

            <section>
              <h2 className="font-title text-xl text-gray-900 mb-3">9. Limitation of Liability</h2>
              <p>
                The Service is provided "as is" without warranties of any kind, express or
                implied. We are not liable for any loss of data, including locally stored
                book library data. We recommend regularly backing up your data.
              </p>
            </section>

            <section>
              <h2 className="font-title text-xl text-gray-900 mb-3">10. Changes to These Terms</h2>
              <p>
                We reserve the right to modify these Terms at any time. Significant
                changes will be communicated via email or in-app notification. Continued
                use of the Service after changes constitutes acceptance of the updated
                terms.
              </p>
            </section>

            <section>
              <h2 className="font-title text-xl text-gray-900 mb-3">11. Governing Law</h2>
              <p>
                These Terms are governed by the laws of France. Any disputes will be
                subject to the exclusive jurisdiction of the French courts.
              </p>
            </section>

            <section>
              <h2 className="font-title text-xl text-gray-900 mb-3">12. Contact</h2>
              <p>
                For any questions regarding these Terms, please contact us at:{" "}
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
