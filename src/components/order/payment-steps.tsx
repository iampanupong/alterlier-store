import { CheckIcon, CloseIcon } from "@/components/ui/icons";
import { Spinner } from "@/components/ui/spinner";
import type { OrderStatus } from "@/lib/order-model";

type StepState = "done" | "confirming" | "active" | "waiting" | "upcoming" | "failed";
type Step = { label: string; state: StepState; note: string };

/** Where an order stands, derived from its stored status only. */
function stepsFor(status: OrderStatus): Step[] {
  const placed: Step = { label: "Order placed", state: "done", note: "Received" };
  switch (status) {
    case "pending":
      return [placed, { label: "Payment", state: "confirming", note: "Confirming…" }, { label: "Preparing", state: "upcoming", note: "Up next" }];
    case "processing":
      return [placed, { label: "Payment", state: "waiting", note: "Processing" }, { label: "Preparing", state: "upcoming", note: "Up next" }];
    case "paid":
      return [placed, { label: "Payment", state: "done", note: "Confirmed" }, { label: "Preparing", state: "active", note: "In progress" }];
    case "failed":
      return [placed, { label: "Payment", state: "failed", note: "Didn’t go through" }, { label: "Preparing", state: "upcoming", note: "Not started" }];
    case "expired":
    case "canceled":
      return [placed, { label: "Payment", state: "failed", note: "Not completed" }, { label: "Preparing", state: "upcoming", note: "Not started" }];
  }
}

const RULE: Record<StepState, string> = {
  done: "border-ink",
  confirming: "border-ink",
  active: "border-ink",
  waiting: "border-ink",
  upcoming: "border-line",
  failed: "border-danger",
};

/** Three hairline steps: order placed, payment, preparing. */
export function PaymentSteps({ status }: { status: OrderStatus }) {
  const steps = stepsFor(status);
  return (
    <ol aria-label="Order progress" className="grid grid-cols-3 gap-3 sm:gap-6">
      {steps.map((step) => (
        <li
          key={step.label}
          aria-current={step.state === "confirming" || step.state === "active" || step.state === "waiting" ? "step" : undefined}
          className={`border-t-2 pt-3 ${RULE[step.state]}`}
        >
          <p className={`eyebrow ${step.state === "upcoming" ? "text-muted" : ""}`}>{step.label}</p>
          <p
            className={`mt-1 flex items-center gap-1.5 text-caption ${
              step.state === "failed" ? "text-danger" : "text-muted"
            }`}
          >
            <StepMark state={step.state} />
            {step.note}
          </p>
        </li>
      ))}
    </ol>
  );
}

function StepMark({ state }: { state: StepState }) {
  if (state === "done") return <CheckIcon width={14} height={14} className="text-ink" />;
  if (state === "failed") return <CloseIcon width={14} height={14} />;
  if (state === "confirming") return <Spinner />;
  if (state === "active" || state === "waiting") {
    return <span aria-hidden="true" className="size-1.5 rounded-full bg-ink" />;
  }
  return null;
}
