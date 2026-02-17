import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check } from 'lucide-react';

const plans = [
  {
    name: 'Free',
    price: '$0',
    period: '/forever',
    description: 'Perfect for occasional file conversions',
    features: [
      '25 conversions per day',
      'Max 200MB file size',
      'Batch size: 5 files',
      'Standard quality presets',
      '24h file retention',
    ],
    cta: 'Get Started',
    href: '/signup',
    popular: false,
  },
  {
    name: 'Pro',
    price: '$9',
    period: '/month',
    description: 'For power users who need more capacity',
    features: [
      '500 conversions per day',
      'Max 500MB file size',
      'Batch size: 10 files',
      'Priority queue',
      'High quality presets',
      '24h file retention',
      'Email support',
    ],
    cta: 'Upgrade to Pro',
    href: '/signup',
    popular: true,
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    period: '',
    description: 'For teams and organizations with specific needs',
    features: [
      'Unlimited conversions',
      'Up to 2GB file size',
      'Batch size: 50 files',
      'Priority queue',
      'Dedicated workers',
      'Audit logs',
      'SSO integration',
      'Custom retention',
      'SLA guarantee',
      'Dedicated support',
    ],
    cta: 'Contact Sales',
    href: 'mailto:admin@fluxfile.aspekts.dev',
    popular: false,
  },
];

export default function PricingPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 md:py-20">
      <div className="mb-12 text-center">
        <h1 className="mb-3 text-4xl font-bold tracking-tight-h1 md:text-5xl">
          Simple, transparent pricing
        </h1>
        <p className="mx-auto max-w-lg text-base text-muted-foreground">
          Choose the plan that fits your needs. All plans include access to all supported file
          formats and conversion types.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {plans.map((plan) => (
          <div
            key={plan.name}
            className={`relative flex flex-col rounded-xl border p-6 ${
              plan.popular
                ? 'border-primary bg-card shadow-lg shadow-primary/10'
                : 'border-border/60 bg-card shadow-sm'
            }`}
          >
            {plan.popular && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <Badge>Most Popular</Badge>
              </div>
            )}
            <div className="mb-4">
              <h3 className="text-sm font-semibold">{plan.name}</h3>
              <p className="mt-1 text-xs text-muted-foreground">{plan.description}</p>
              <div className="mt-4">
                <span className="font-mono text-3xl font-bold">{plan.price}</span>
                <span className="text-sm text-muted-foreground">{plan.period}</span>
              </div>
            </div>
            <ul className="mb-6 flex-1 space-y-2.5">
              {plan.features.map((feature) => (
                <li key={feature} className="flex items-start gap-2">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" strokeWidth={1.5} />
                  <span className="text-sm text-muted-foreground">{feature}</span>
                </li>
              ))}
            </ul>
            <Button className="w-full" variant={plan.popular ? 'default' : 'outline'} asChild>
              <Link href={plan.href}>{plan.cta}</Link>
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}
