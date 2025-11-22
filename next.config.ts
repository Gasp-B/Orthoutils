import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';
import { proxyConfig } from './proxy';

const withNextIntl = createNextIntlPlugin('./i18n/request.ts');

const nextConfig: NextConfig = {
  ...proxyConfig,
};

export default withNextIntl(nextConfig);
