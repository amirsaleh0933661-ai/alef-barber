import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'سالن پیرایش الف',
    short_name: 'پیرایش الف',
    description: 'سامانه رزرواسیون آنلاین سالن پیرایش الف',
    start_url: '/',
    display: 'standalone',
    background_color: '#090d16',
    theme_color: '#090d16',
    dir: 'rtl',
    lang: 'fa',
    icons: [
      {
        src: '/icon',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  };
}