'use client';

import { atom, useAtom } from 'jotai';

interface ReelsFeedModalState {
  isOpen: boolean;
  initialVideoUrl?: string;
  channelId?: string;
}

const reelsFeedModalAtom = atom<ReelsFeedModalState>({
  isOpen: false,
});

export const useReelsFeedModal = () => {
  const [state, setState] = useAtom(reelsFeedModalAtom);

  const openReelsFeed = (initialVideoUrl?: string, channelId?: string) => {
    setState({
      isOpen: true,
      initialVideoUrl,
      channelId,
    });
  };

  const closeReelsFeed = () => {
    setState({
      isOpen: false,
    });
  };

  return {
    isOpen: state.isOpen,
    initialVideoUrl: state.initialVideoUrl,
    channelId: state.channelId,
    openReelsFeed,
    closeReelsFeed,
  };
};

