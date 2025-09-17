import type { NavigationItem } from "../client/components/NavBar/NavBar";
import { routes } from "wasp/client/router";
import { DocsUrl, BlogUrl } from "../shared/common";
import daBoiAvatar from "../client/static/da-boi.webp";
import avatarPlaceholder from "../client/static/avatar-placeholder.webp";
// Avatar images from public directory
const bryanAvatar = "/bryan.JPG";
const vincentAvatar = "/vincent.jpeg";
const wendyAvatar = "/wendy.jpeg";

export const landingPageNavigationItems: NavigationItem[] = [
  { name: "Features", to: "#features" },
  { name: "Pricing", to: routes.PricingPageRoute.to },
  { name: "Blog", to: BlogUrl },
  { name: "Contact us", to: "/contact-us" },
];
export const features = [
  {
    name: "AI-Powered Resume Enhancement",
    description:
      "Optimizes resume for specific job descriptions with ATS keyword matching",
    icon: "🤖",
    href: DocsUrl,
  },
  {
    name: "Intelligent editor",
    description:
      "Smart editing tools with real-time suggestions and formatting assistance",
    icon: "✏️",
    href: DocsUrl,
  },
  {
    name: "Document Parser",
    description:
      "Extracts and parses content from uploaded documents automatically",
    icon: "📜",
    href: DocsUrl,
  },
  {
    name: "One-Click PDF Download",
    description: "Download your resume as a PDF with one click",
    icon: "📥",
    href: DocsUrl,
  },
];
export const testimonials = [
  {
    name: "Bryan",
    role: "Intern",
    avatarSrc: bryanAvatar,
    socialUrl: "https://twitter.com/wasplang",
    quote: "Stacking interviews like I'm Thanos with the infinity gauntlet 😹",
  },
  {
    name: "Vincent",
    role: "Developer Intern",
    avatarSrc: vincentAvatar,
    socialUrl: "",
    quote: "Finessed my way into a new job with this tool 😈",
  },
  {
    name: "Wendy",
    role: "Finance Administrator",
    avatarSrc: wendyAvatar,
    socialUrl: "#",
    quote: "Mass applying like a mf",
  },
];

export const faqs = [
  {
    id: 1,
    question:
      "Shortcut or cheating? What if someone uses this to make their resume seem better than they really are?",
    answer:
      "Let’s be real 🤷 Recruiters barely glance at resumes, no matter how many hours you slave over them. This tool levels the field by cutting out pointless busywork. We make applying effortless so candidates can spend their energy on what actually matters: proving they can do the job.",
  },
  {
    id: 2,
    question: "How does the AI-powered resume enhancement work?",
    answer:
      "Our AI analyzes your resume and suggests improvements based on job descriptions. It highlights relevant skills, formats your resume for ATS compatibility, and ensures your resume is ATS-friendly.",
  },
  {
    id: 3,
    question: "Can I customize my resume?",
    answer:
      "Yes! You can customize colors,layout sections, and content. Our inline editor allows you to edit your resume text content and modify it as you see fit.",
  },
  {
    id: 4,
    question: "Is my data secure?",
    answer:
      "Absolutely. We use industry-standard encryption and security practices to protect your personal information. Your data is never shared with third parties and you can delete your account and data at any time.",
  },
];
export const footerNavigation = {
  app: [
    { name: "Documentation", href: DocsUrl },
    { name: "Blog", href: BlogUrl },
  ],
  company: [
    { name: "About", href: "https://wasp.sh" },
    { name: "Privacy", href: "#" },
    { name: "Terms of Service", href: "#" },
  ],
};

export const footerContent = {
  companyDescription:
    "Effortlessly mass-apply with resumes that stay perfectly accurate, relevant, and tailored to every job",
  copyright: "Copyright 2025 © Applify. All Right Reserved.",
  copyrightUrl: "https://prebuiltui.com",
  resources: [
    { name: "Documentation", href: "#" },
    { name: "Tutorials", href: "#" },
    { name: "Blog", href: "#" },
  ],
  company: [
    { name: "About", href: "#" },
    { name: "Privacy", href: "#" },
    { name: "Terms", href: "#" },
  ],
  socialLinks: [
    { name: "Twitter", href: "#", icon: "twitter" },
    { name: "GitHub", href: "#", icon: "github" },
    { name: "LinkedIn", href: "#", icon: "linkedin" },
  ],
};
