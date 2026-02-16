import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
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
    <div className="container mx-auto max-w-6xl px-4 py-16">
      <div className="mb-12 text-center">
        <h1 className="mb-4 text-4xl font-bold">Simple, transparent pricing</h1>
        <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
          Choose the plan that fits your needs. All plans include access to all supported file
          formats and conversion types.
        </p>
      </div>

      <div className="grid gap-8 md:grid-cols-3">
        {plans.map((plan) => (
          <Card
            key={plan.name}
            className={`relative flex flex-col ${plan.popular ? 'border-primary shadow-lg' : ''}`}
          >
            {plan.popular && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <Badge>Most Popular</Badge>
              </div>
            )}
            <CardHeader>
              <CardTitle className="text-xl">{plan.name}</CardTitle>
              <CardDescription>{plan.description}</CardDescription>
              <div className="mt-4">
                <span className="text-4xl font-bold">{plan.price}</span>
                <span className="text-muted-foreground">{plan.period}</span>
              </div>
            </CardHeader>
            <CardContent className="flex-1">
              <ul className="space-y-3">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-primary" />
                    <span className="text-sm">{feature}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
            <CardFooter>
              <Button className="w-full" variant={plan.popular ? 'default' : 'outline'} asChild>
                <Link href={plan.href}>{plan.cta}</Link>
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}
