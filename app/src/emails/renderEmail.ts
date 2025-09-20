import React from 'react';
import { render } from '@react-email/components';

/**
 * Renders a React Email component to HTML string
 * @param component React Email component
 * @returns HTML string
 */
export async function renderEmailToHtml(component: React.ReactElement): Promise<string> {
  return render(component);
}

/**
 * Renders a React Email component to plain text
 * @param component React Email component
 * @returns Plain text string
 */
export async function renderEmailToText(component: React.ReactElement): Promise<string> {
  return render(component, { plainText: true });
}