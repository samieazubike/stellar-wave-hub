# TODO - URL persistence for Explore filters

- [ ] Update `web/src/app/explore/page.tsx` to read `category`, `search`, `sort`, and `page` from URL query params on mount
- [ ] Normalize/validate query param values (known categories/sort options; clamp page >= 1)
- [ ] Update the browser URL (shallow) when filter state changes
- [ ] Ensure no infinite render loop between URL->state and state->URL
- [ ] Manual testing: refresh and share URLs restore same view
