import { useCallback } from "react";
import { atom, useAtom } from "jotai";

const commandPaletteAtom = atom(false);

export function useCommandPalette() {
  const [isOpen, setIsOpen] = useAtom(commandPaletteAtom);

  const toggle = useCallback(() => {
    setIsOpen((prev) => !prev);
  }, [setIsOpen]);

  return {
    isOpen,
    setIsOpen,
    toggle,
  };
}
