export default function PrivacyPage() {
  return (
    <div className="container mx-auto max-w-3xl px-4 py-16">
      <h1 className="mb-8 text-4xl font-bold">Privacy Policy</h1>
      <div className="prose prose-neutral dark:prose-invert max-w-none space-y-6">
        <p className="text-muted-foreground">Last updated: February 2026</p>

        <section>
          <h2 className="text-2xl font-semibold">1. Information We Collect</h2>
          <p>
            <strong>Account information:</strong> When you create an account, we collect your name,
            email address, and encrypted password.
          </p>
          <p>
            <strong>Usage data:</strong> We collect information about your file conversions,
            including file formats and sizes (but not file contents), timestamps, and IP addresses.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold">2. How We Use Your Information</h2>
          <ul className="list-disc pl-6 space-y-1">
            <li>To provide and maintain the file conversion service</li>
            <li>To manage your account and subscription</li>
            <li>To enforce usage limits and prevent abuse</li>
            <li>To send service-related emails (verification, password reset)</li>
            <li>To improve the Service</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold">3. File Privacy</h2>
          <p>
            FluxFile operates on a zero-knowledge principle for file contents. Your uploaded files
            are:
          </p>
          <ul className="list-disc pl-6 space-y-1">
            <li>Processed only for the purpose of conversion</li>
            <li>Stored temporarily in encrypted cloud storage (Cloudflare R2)</li>
            <li>Automatically deleted after 24 hours</li>
            <li>Never analyzed, shared, or used for any other purpose</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold">4. Data Storage</h2>
          <p>
            Your account data is stored in a PostgreSQL database. Files are stored in Cloudflare R2
            (S3-compatible object storage). All data is transmitted over encrypted connections
            (HTTPS/TLS).
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold">5. Data Retention</h2>
          <ul className="list-disc pl-6 space-y-1">
            <li>Uploaded files: 24 hours</li>
            <li>Converted files: 24 hours</li>
            <li>Account data: Until account deletion</li>
            <li>Conversion logs: 90 days</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold">6. Third-Party Services</h2>
          <p>We use the following third-party services:</p>
          <ul className="list-disc pl-6 space-y-1">
            <li>
              <strong>Cloudflare R2:</strong> File storage
            </li>
            <li>
              <strong>Resend:</strong> Transactional emails
            </li>
            <li>
              <strong>Stripe:</strong> Payment processing
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold">7. Your Rights</h2>
          <p>
            You have the right to access, modify, or delete your personal data. To exercise these
            rights, contact us at{' '}
            <a href="mailto:admin@fluxfile.aspekts.dev" className="text-primary hover:underline">
              admin@fluxfile.aspekts.dev
            </a>
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold">8. Contact</h2>
          <p>
            For privacy-related inquiries, contact us at{' '}
            <a href="mailto:admin@fluxfile.aspekts.dev" className="text-primary hover:underline">
              admin@fluxfile.aspekts.dev
            </a>
          </p>
        </section>
      </div>
    </div>
  );
}
