import type { SocialProvider } from '~/types/components';

export function useAuthModal() {
  const socialProviders: SocialProvider[] = [
    { icon: 'logos:google-icon', label: 'Google' },
    { icon: 'simple-icons:apple', label: 'Apple' },
    { icon: 'logos:microsoft-icon', label: 'Microsoft' },
    { icon: 'simple-icons:github', label: 'Github' },
    { icon: 'logos:twitter', label: 'Twitter' },
  ];

  function staggeredEntry(index: number) {
    return {
      initial: { opacity: 0, y: 20 },
      animate: { opacity: 1, y: 0 },
      transition: { duration: 0.3, delay: 0.1 + index * 0.05 },
    };
  }

  return { socialProviders, staggeredEntry };
}
