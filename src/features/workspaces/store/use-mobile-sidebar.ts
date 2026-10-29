'use client';

import { atom, useAtom } from 'jotai';

const mobileSidebarAtom = atom(false);

export const useMobileSidebar = () => {
  return useAtom(mobileSidebarAtom);
};

