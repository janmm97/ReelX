import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Contact — Reelsy',
  description: 'Get in touch with the Reelsy support team.',
}

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return children
}
