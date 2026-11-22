import Form from "next/form";
import { SearchIcon } from "@/components/ui/icons";
import { SEARCH_QUERY_MAX } from "@/lib/catalog";

/** GET form that navigates to `/search?q=…` client-side (plain submit without JS). */
export function SearchForm({ query = "" }: { query?: string }) {
  return (
    <Form action="/search" role="search" className="relative">
      <label htmlFor="search-q" className="sr-only">
        Search products
      </label>
      <input
        id="search-q"
        type="search"
        name="q"
        defaultValue={query}
        maxLength={SEARCH_QUERY_MAX}
        autoFocus={!query}
        autoComplete="off"
        enterKeyHint="search"
        placeholder="What are you looking for?"
        className="field min-h-14 pr-12 [&::-webkit-search-cancel-button]:appearance-none text-heading font-extralight lg:min-h-18 lg:text-display lg:font-extralight"
      />
      <button
        type="submit"
        aria-label="Search"
        className="btn-icon absolute top-1/2 right-0 -translate-y-1/2"
      >
        <SearchIcon />
      </button>
    </Form>
  );
}
