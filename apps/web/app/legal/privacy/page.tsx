export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 md:py-20">
      <h1 className="mb-8 text-4xl font-bold tracking-tight-h1">Privacy Policy</h1>
      <div className="space-y-8">
        <p className="text-sm text-muted-foreground">Last updated: February 2026</p>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold tracking-tight-h2">1. Information We Collect</h2>
          <p className="text-sm leading-relaxed text-muted-foreground">
            <strong className="text-foreground">Account information:</strong> When you create an
            account, we collect your name, email address, and encrypted password.
          </p>
          <p className="text-sm leading-relaxed text-muted-foreground">
            <strong className="text-foreground">Usage data:</strong> We collect information about
            your file conversions, including file formats and sizes (but not file contents),
            timestamps, and IP addresses.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold tracking-tight-h2">
            2. How We Use Your Information
          </h2>
          <ul className="list-disc space-y-1 pl-6 text-sm leading-relaxed text-muted-foreground">
            <li>To provide and maintain the file conversion service</li>
            <li>To manage your account and subscription</li>
            <li>To enforce usage limits and prevent abuse</li>
            <li>To send service-related emails (verification, password reset)</li>
            <li>To improve the Service</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold tracking-tight-h2">3. File Privacy</h2>
          <p className="text-sm leading-relaxed text-muted-foreground">
            FluxFile operates on a zero-knowledge principle for file contents. Your uploaded files
            are:
          </p>
          <ul className="list-disc space-y-1 pl-6 text-sm leading-relaxed text-muted-foreground">
            <li>Processed only for the purpose of conversion</li>
            <li>Stored temporarily in encrypted cloud storage (Cloudflare R2)</li>
            <li>Automatically deleted after 24 hours</li>
            <li>Never analyzed, shared, or used for any other purpose</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold tracking-tight-h2">4. Data Storage</h2>
          <p className="text-sm leading-relaxed text-muted-foreground">
            Your account data is stored in a PostgreSQL database. Files are stored in Cloudflare R2
            (S3-compatible object storage). All data is transmitted over encrypted connections
            (HTTPS/TLS).
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold tracking-tight-h2">5. Data Retention</h2>
          <ul className="list-disc space-y-1 pl-6 text-sm leading-relaxed text-muted-foreground">
            <li>Uploaded files: 24 hours</li>
            <li>Converted files: 24 hours</li>
            <li>Account data: Until account deletion</li>
            <li>Conversion logs: 90 days</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold tracking-tight-h2">6. Third-Party Services</h2>
          <p className="text-sm leading-relaxed text-muted-foreground">
            We use the following third-party services:
          </p>
          <ul className="list-disc space-y-1 pl-6 text-sm leading-relaxed text-muted-foreground">
            <li>
              <strong className="text-foreground">Cloudflare R2:</strong> File storage
            </li>
            <li>
              <strong className="text-foreground">Resend:</strong> Transactional emails
            </li>
            <li>
              <strong className="text-foreground">Stripe:</strong> Payment processing
            </li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold tracking-tight-h2">7. Your Rights</h2>
          <p className="text-sm leading-relaxed text-muted-foreground">
            You have the right to access, modify, or delete your personal data. To exercise these
            rights, contact us at{' '}
            <a href="mailto:admin@fluxfile.aspekts.dev" className="text-primary hover:underline">
              admin@fluxfile.aspekts.dev
            </a>
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold tracking-tight-h2">8. Contact</h2>
          <p className="text-sm leading-relaxed text-muted-foreground">
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
