import Link from 'next/link';
import { Zap } from 'lucide-react';

export function Footer() {
  return (
    <footer className="border-t bg-background">
      <div className="container mx-auto max-w-6xl px-4 py-12">
        <div className="grid gap-8 md:grid-cols-4">
          {/* Brand */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 font-bold">
              <Zap className="h-5 w-5 text-primary" />
              <span className="text-xl">FluxFile</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Universal file converter with enterprise-grade security and zero-knowledge privacy.
            </p>
          </div>

          {/* Product */}
          <div className="space-y-3">
            <h3 className="font-semibold">Product</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/" className="text-sm text-muted-foreground hover:text-primary">
                  Convert Files
                </Link>
              </li>
              <li>
                <Link href="/pricing" className="text-sm text-muted-foreground hover:text-primary">
                  Pricing
                </Link>
              </li>
            </ul>
          </div>

          {/* Account */}
          <div className="space-y-3">
            <h3 className="font-semibold">Account</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/login" className="text-sm text-muted-foreground hover:text-primary">
                  Sign In
                </Link>
              </li>
              <li>
                <Link href="/signup" className="text-sm text-muted-foreground hover:text-primary">
                  Sign Up
                </Link>
              </li>
              <li>
                <Link
                  href="/dashboard"
                  className="text-sm text-muted-foreground hover:text-primary"
                >
                  Dashboard
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div className="space-y-3">
            <h3 className="font-semibold">Legal</h3>
            <ul className="space-y-2">
              <li>
                <Link
                  href="/legal/terms"
                  className="text-sm text-muted-foreground hover:text-primary"
                >
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link
                  href="/legal/privacy"
                  className="text-sm text-muted-foreground hover:text-primary"
                >
                  Privacy Policy
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 border-t pt-8 text-center">
          <p className="text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} FluxFile. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
