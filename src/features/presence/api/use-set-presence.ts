'use client';

import { useMutation } from 'convex/react';

import { api } from '@/../convex/_generated/api';

export const useSetPresence = () => {
  return useMutation(api.presence.setPresence);
};
