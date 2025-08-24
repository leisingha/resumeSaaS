import type { NavigationItem } from '../client/components/NavBar/NavBar';
import { routes } from 'wasp/client/router';
import { DocsUrl, BlogUrl } from '../shared/common';
import daBoiAvatar from '../client/static/da-boi.webp';
import avatarPlaceholder from '../client/static/avatar-placeholder.webp';

export const landingPageNavigationItems: NavigationItem[] = [
  { name: 'Features', to: '#features' },
  { name: 'Pricing', to: routes.PricingPageRoute.to },
  { name: 'Documentation', to: DocsUrl },
  { name: 'Blog', to: BlogUrl },
];
export const features = [
  {
    name: 'AI-Powered Resume Enhancement',
    description: 'Optimizes resume for specific job descriptions with ATS keyword matching',
    icon: '🤖',
    href: DocsUrl,
  },
  {
    name: 'Intelligent editor',
    description: 'Smart editing tools with real-time suggestions and formatting assistance',
    icon: '✏️',
    href: DocsUrl,
  },
  {
    name: 'Document Parser',
    description: 'Extracts and parses content from uploaded documents automatically',
    icon: '📜',
    href: DocsUrl,
  },
  {
    name: 'One-Click PDF Download',
    description: 'Download your resume as a PDF with one click',
    icon: '📥',
    href: DocsUrl,
  },
];
export const testimonials = [
  {
    name: 'Bryan',
    role: 'Intern',
    avatarSrc: daBoiAvatar,
    socialUrl: 'https://twitter.com/wasplang',
    quote: "Stacking interviews like I'm Thanos with the infinity gauntlet 😹",
  },
  {
    name: 'Vincent',
    role: 'Developer Intern',
    avatarSrc: avatarPlaceholder,
    socialUrl: '',
    quote: 'Finessed my way into a new job with this tool 😭',
  },
  {
    name: 'Wendy',
    role: 'Finance Administrator',
    avatarSrc: avatarPlaceholder,
    socialUrl: '#',
    quote: 'Mass applying like a mf',
  },
];

export const faqs = [
  {
    id: 1,
    question: 'Whats the meaning of life?',
    answer: '42.',
    href: 'https://en.wikipedia.org/wiki/42_(number)',
  },
];
export const footerNavigation = {
  app: [
    { name: 'Documentation', href: DocsUrl },
    { name: 'Blog', href: BlogUrl },
  ],
  company: [
    { name: 'About', href: 'https://wasp.sh' },
    { name: 'Privacy', href: '#' },
    { name: 'Terms of Service', href: '#' },
  ],
};
