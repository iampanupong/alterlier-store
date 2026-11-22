/** Small inline spinner for pending buttons. Hidden when motion is reduced. */
export function Spinner() {
  return (
    <span
      aria-hidden="true"
      className="size-3 animate-spin rounded-full border border-current border-t-transparent motion-reduce:hidden"
    />
  );
}
