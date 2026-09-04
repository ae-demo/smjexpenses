import { forwardRef } from "react";
import { Link as RouterLink } from "react-router-dom";

// Adapter so every Astryx link/nav item routes through react-router instead
// of a full page load. Wired via LinkProvider in App.tsx.
export const RoutedLink = forwardRef<
  HTMLAnchorElement,
  React.AnchorHTMLAttributes<HTMLAnchorElement>
>(function RoutedLink({ href, children, ...rest }, ref) {
  return (
    <RouterLink ref={ref} to={href ?? "#"} {...rest}>
      {children}
    </RouterLink>
  );
});
