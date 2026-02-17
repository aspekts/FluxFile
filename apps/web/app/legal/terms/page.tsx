export default function TermsPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 md:py-20">
      <h1 className="mb-8 text-4xl font-bold tracking-tight-h1">Terms of Service</h1>
      <div className="space-y-8">
        <p className="text-sm text-muted-foreground">Last updated: February 2026</p>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold tracking-tight-h2">1. Acceptance of Terms</h2>
          <p className="text-sm leading-relaxed text-muted-foreground">
            By accessing and using FluxFile (&quot;the Service&quot;), you agree to be bound by
            these Terms of Service. If you do not agree to these terms, please do not use the
            Service.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold tracking-tight-h2">2. Description of Service</h2>
          <p className="text-sm leading-relaxed text-muted-foreground">
            FluxFile is a file conversion service that allows users to convert files between various
            formats including audio, video, document, and image files. The Service is provided on an
            &quot;as is&quot; basis.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold tracking-tight-h2">3. User Accounts</h2>
          <p className="text-sm leading-relaxed text-muted-foreground">
            You may use the Service without an account for limited functionality. Creating an
            account provides access to additional features. You are responsible for maintaining the
            security of your account credentials.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold tracking-tight-h2">4. Acceptable Use</h2>
          <p className="text-sm leading-relaxed text-muted-foreground">You agree not to:</p>
          <ul className="list-disc space-y-1 pl-6 text-sm leading-relaxed text-muted-foreground">
            <li>Upload malware, viruses, or malicious files</li>
            <li>Use the Service for illegal purposes</li>
            <li>Attempt to circumvent usage limits</li>
            <li>Abuse the Service in any way that impacts other users</li>
            <li>Upload content that infringes on intellectual property rights</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold tracking-tight-h2">5. File Handling</h2>
          <p className="text-sm leading-relaxed text-muted-foreground">
            Files uploaded to FluxFile are processed temporarily and are automatically deleted after
            24 hours. We do not store, analyze, or share the content of your files beyond what is
            necessary for conversion.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold tracking-tight-h2">6. Limitation of Liability</h2>
          <p className="text-sm leading-relaxed text-muted-foreground">
            FluxFile is provided without warranty. We are not liable for any data loss, file
            corruption, or service interruptions. Always maintain backups of your original files.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold tracking-tight-h2">7. Contact</h2>
          <p className="text-sm leading-relaxed text-muted-foreground">
            For questions about these terms, contact us at{' '}
            <a href="mailto:admin@fluxfile.aspekts.dev" className="text-primary hover:underline">
              admin@fluxfile.aspekts.dev
            </a>
          </p>
        </section>
      </div>
    </div>
  );
}
