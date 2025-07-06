'use client';

import { useEffect } from 'react';
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/next';
import { onCLS, onFCP, onLCP, type Metric } from 'web-vitals';

declare global {
  interface Window {
    gtag: (command: string, eventName: string, params: any) => void;
  }
}

function reportWebVitals(metric: Metric) {
  console.log(metric);
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', metric.name, {
      value: Math.round(metric.value * 1000),
      metric_id: metric.id,
      metric_value: metric.value,
      metric_delta: metric.delta,
    });
  }
}

export function AnalyticsWrapper({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    onCLS(reportWebVitals);
    onFCP(reportWebVitals);
    onLCP(reportWebVitals);
  }, []);

  return (
    <>
      {children}
      <Analytics />
      <SpeedInsights />
    </>
  );
} 