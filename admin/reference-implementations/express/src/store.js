/**
 * Pluggable storage adapter. Default = in-memory (Maps); swap to a real
 * database by implementing the same shape.
 *
 * The layout mirrors the Cloudflare Worker reference implementation so
 * a backend can graduate from in-memory dev → Postgres → KV → whatever
 * without touching the route handlers.
 *
 *   notifications  — Map<id, message>
 *   subscriptions  — Map<id, subscription>
 *   feed           — Map<id, entry>
 *   newsletter     — Map<email, Set<listId>>
 *   emails         — Map<id, audit-log record>
 */

export function createInMemoryStore(seed = {}) {
  const notifications = new Map(Object.entries(seed.notifications || {}));
  const subscriptions = new Map(Object.entries(seed.subscriptions || {}));
  const feed = new Map(Object.entries(seed.feed || {}));
  const newsletter = new Map(
    Object.entries(seed.newsletter || {}).map(([email, lists]) => [email, new Set(lists)]),
  );
  const emails = new Map();

  return {
    // ── notifications ───────────────────────────────────────────
    listMessages() {
      return [...notifications.values()];
    },
    getMessage(id) {
      return notifications.get(id) ?? null;
    },
    putMessage(msg) {
      notifications.set(msg.id, msg);
    },

    // ── subscriptions ───────────────────────────────────────────
    listSubscriptions() {
      return [...subscriptions.values()];
    },
    getSubscription(id) {
      return subscriptions.get(id) ?? null;
    },
    putSubscription(sub) {
      subscriptions.set(sub.id, sub);
    },
    deleteSubscription(id) {
      return subscriptions.delete(id);
    },

    // ── feed ────────────────────────────────────────────────────
    listFeed() {
      return [...feed.values()];
    },
    putFeedEntry(entry) {
      feed.set(entry.id, entry);
    },

    // ── newsletter ──────────────────────────────────────────────
    getNewsletterSubs(email) {
      return new Set(newsletter.get(email.toLowerCase()) || []);
    },
    putNewsletterSubs(email, set) {
      const key = email.toLowerCase();
      if (set.size === 0) newsletter.delete(key);
      else newsletter.set(key, set);
    },

    // ── emails (audit log) ──────────────────────────────────────
    putEmail(record) {
      emails.set(record.id, record);
    },
    getEmail(id) {
      return emails.get(id) ?? null;
    },

    // ── debug ───────────────────────────────────────────────────
    dump() {
      return {
        notifications: [...notifications.values()],
        subscriptions: [...subscriptions.values()],
        feed: [...feed.values()],
        newsletter: Object.fromEntries([...newsletter].map(([e, s]) => [e, [...s]])),
        emails: [...emails.values()],
      };
    },
  };
}
