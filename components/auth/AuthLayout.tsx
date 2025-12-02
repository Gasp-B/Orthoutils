import type { ReactNode } from 'react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils/cn';

interface Feature {
  title: string;
  description: string;
  icon: string;
}

interface HeroSection {
  pill: string;
  headline: string;
  subheadline: string;
  features: Feature[];
}

interface CardSection {
  title: string;
  description: string;
  content: ReactNode;
  footer?: ReactNode;
}

interface AuthLayoutProps {
  hero?: HeroSection;
  card: CardSection;
  variant?: 'full' | 'compact';
}

export function AuthLayout({ hero, card, variant = 'full' }: AuthLayoutProps) {
  const showHero = variant !== 'compact' && hero;

  return (
    <div className="min-h-[82vh] bg-gradient-to-b from-sky-50/80 via-white to-slate-50/80 py-12">
      <div
        className={cn(
          'mx-auto max-w-5xl px-4 md:px-6',
          showHero ? 'grid grid-cols-1 items-start gap-10 lg:grid-cols-[1.05fr_0.95fr]' : 'max-w-xl'
        )}
      >
        {showHero ? (
          <div className="space-y-6">
            <span className="inline-flex items-center gap-2 rounded-full bg-white/80 px-4 py-2 text-xs font-semibold uppercase tracking-[0.08em] text-sky-900 shadow-sm ring-1 ring-sky-100">
              <span
                className="h-2.5 w-2.5 rounded-full bg-gradient-to-r from-sky-500 to-cyan-400 shadow-[0_0_0_4px_rgba(14,165,233,0.18)]"
                aria-hidden
              />
              {hero.pill}
            </span>

            <div className="space-y-3">
              <h1 className="text-3xl font-bold text-slate-900 sm:text-4xl">{hero.headline}</h1>
              <p className="max-w-2xl text-base leading-relaxed text-muted-foreground">{hero.subheadline}</p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {hero.features.map((feature) => (
                <div
                  key={feature.title}
                  className="rounded-2xl border border-slate-100 bg-white/90 p-4 shadow-sm backdrop-blur"
                >
                  <div className="flex items-start gap-3">
                    <span className="text-xl" aria-hidden>
                      {feature.icon}
                    </span>
                    <div className="space-y-1.5">
                      <p className="text-sm font-semibold text-slate-900">{feature.title}</p>
                      <p className="text-sm leading-snug text-muted-foreground">{feature.description}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : null}

        <Card className="w-full border border-sky-100/80 shadow-xl shadow-sky-100/60">
          <CardHeader className="pb-3">
            <CardTitle className="text-xl text-slate-900">{card.title}</CardTitle>
            <CardDescription className="text-sm leading-relaxed text-muted-foreground">
              {card.description}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            {card.content}
            {card.footer ? (
              <>
                <Separator className="bg-slate-100" />
                <div className="text-center text-sm text-muted-foreground">{card.footer}</div>
              </>
            ) : null}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
