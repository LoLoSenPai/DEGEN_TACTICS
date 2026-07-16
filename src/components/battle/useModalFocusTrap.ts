"use client";

import { useEffect, useRef } from "react";

const MODAL_FOCUSABLE_SELECTOR = [
  "button:not([disabled])",
  "[href]",
  "[tabindex]:not([tabindex='-1'])",
].join(",");

export function useModalFocusTrap(active = true) {
  const dialogRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!active) return;
    const dialog = dialogRef.current;
    if (!dialog) return;
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const siblings = dialog.parentElement
      ? [...dialog.parentElement.children].filter((element): element is HTMLElement => element instanceof HTMLElement && element !== dialog)
      : [];
    const siblingState = siblings.map((element) => ({
      element,
      inert: element.inert,
      ariaHidden: element.getAttribute("aria-hidden"),
    }));
    for (const sibling of siblings) {
      sibling.inert = true;
      sibling.setAttribute("aria-hidden", "true");
    }
    const focusables = () => [...dialog.querySelectorAll<HTMLElement>(MODAL_FOCUSABLE_SELECTOR)]
      .filter((element) => element.getClientRects().length > 0);
    const initialFocus = dialog.querySelector<HTMLElement>("[autofocus]") ?? focusables()[0] ?? dialog;
    initialFocus.focus();

    const trapFocus = (event: KeyboardEvent) => {
      if (event.key !== "Tab") return;
      const available = focusables();
      if (available.length === 0) {
        event.preventDefault();
        dialog.focus();
        return;
      }
      const first = available[0];
      const last = available[available.length - 1];
      const focused = document.activeElement;
      if (event.shiftKey && (focused === first || !dialog.contains(focused))) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && (focused === last || !dialog.contains(focused))) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", trapFocus);
    return () => {
      document.removeEventListener("keydown", trapFocus);
      for (const previous of siblingState) {
        previous.element.inert = previous.inert;
        if (previous.ariaHidden === null) previous.element.removeAttribute("aria-hidden");
        else previous.element.setAttribute("aria-hidden", previous.ariaHidden);
      }
      previousFocus?.focus();
    };
  }, [active]);

  return dialogRef;
}
