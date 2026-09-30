import { mockFluidStorefront } from './fluidStorefront';

// Layout fixtures belong in tests, never in the shipped storefront.
export function mockLayoutStorefront(context) {
  return mockFluidStorefront(context, {
    settings: {
      announcement: { enabled: true, message: 'Test announcement', cta: {} },
      newsletter: {
        enabled: true,
        popupEnabled: true,
        popupDelay: 180,
        heading: 'Newsletter',
        button_label: "✦ Subscribe — It's Free",
        consent_text: 'I agree to receive news and offers.',
        success_message: "✦ You're subscribed! Welcome aboard.",
        popup_heading: 'Join the newsletter',
      },
    },
  });
}
