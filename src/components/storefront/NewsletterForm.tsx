"use client";

// TODO: connect to an email provider — submissions are not stored yet.
export function NewsletterForm() {
  return (
    <form className="flex gap-2" onSubmit={(e) => e.preventDefault()}>
      <input
        type="email"
        placeholder="Enter your email"
        aria-label="Email address"
        className="flex-1 min-w-0 bg-asur-graphite border border-asur-iron px-4 py-3 text-body-md text-asur-white placeholder:text-asur-slate focus:outline-none focus:border-asur-silver"
        required
      />
      <button
        type="submit"
        className="bg-asur-white text-asur-black px-6 py-3 text-body-sm font-medium uppercase tracking-wider hover:bg-asur-bone transition-colors whitespace-nowrap"
      >
        Subscribe
      </button>
    </form>
  );
}
