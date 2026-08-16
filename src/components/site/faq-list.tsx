import { Plus } from "lucide-react";

/**
 * Built on <details>, so it is keyboard-operable and readable with
 * JavaScript disabled — no accordion state to get out of sync.
 */
export function FaqList({
  faqs,
}: {
  faqs: { id: string; question: string; answer: string }[];
}) {
  if (faqs.length === 0) return null;

  return (
    <div className="divide-y divide-line overflow-hidden rounded-2xl border border-line bg-white">
      {faqs.map((faq) => (
        <details key={faq.id} className="group">
          <summary className="flex cursor-pointer list-none items-start justify-between gap-4 px-5 py-4 text-[0.9375rem] font-medium text-ink transition-colors hover:bg-wash [&::-webkit-details-marker]:hidden">
            <span>{faq.question}</span>
            <span
              className="mt-0.5 grid size-6 shrink-0 place-items-center rounded-full border border-line text-muted transition-transform duration-200 group-open:rotate-45 group-open:border-brand-200 group-open:text-brand-700"
              aria-hidden
            >
              <Plus className="size-3.5" />
            </span>
          </summary>
          <div className="px-5 pb-5 pt-0">
            <p className="max-w-2xl whitespace-pre-line text-sm leading-relaxed text-muted">
              {faq.answer}
            </p>
          </div>
        </details>
      ))}
    </div>
  );
}
