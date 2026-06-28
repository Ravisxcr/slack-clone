'use client';

import { useAuthActions } from '@convex-dev/auth/react';
import { Laptop, Loader, LogOut, Moon, SmilePlus, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { AvailabilityDot } from '@/components/availability-dot';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useGetMyPresence } from '@/features/presence/api/use-get-my-presence';
import { SetStatusModal } from '@/features/presence/components/set-status-modal';

import { useCurrentUser } from '../api/use-current-user';

export const UserButton = () => {
  const router = useRouter();
  const { signOut } = useAuthActions();
  const { data, isLoading } = useCurrentUser();
  const { setTheme, theme } = useTheme();
  const { data: myPresence } = useGetMyPresence();
  const [statusModalOpen, setStatusModalOpen] = useState(false);

  if (isLoading) {
    return <Loader className="size-4 animate-spin text-muted-foreground" />;
  }

  if (!data) {
    return null;
  }

  const { image, name } = data;

  const avatarFallback = name?.charAt(0).toUpperCase();

  return (
    <>
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger className="relative outline-none">
          <Avatar className="size-10 transition hover:opacity-75">
            <AvatarImage alt={name} src={image} />
            <AvatarFallback className="text-base">{avatarFallback}</AvatarFallback>
          </Avatar>
          <span className="absolute bottom-0 right-0 translate-x-0.5 translate-y-0.5">
            <AvailabilityDot
              availability={myPresence?.availability ?? 'active'}
              size="md"
              borderColor="border-[var(--sidebar)]"
            />
          </span>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="center" side="right" className="w-60">
          <DropdownMenuItem
            className="h-10"
            onSelect={(e) => {
              e.preventDefault();
              setStatusModalOpen(true);
            }}
          >
            <SmilePlus className="mr-2 size-4" />
            {myPresence?.customStatus ? (
              <span className="truncate text-sm">{myPresence.customStatus}</span>
            ) : (
              'Set a status'
            )}
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          <DropdownMenuSub>
            <DropdownMenuSubTrigger className="h-10">
              {theme === 'dark' ? (
                <Moon className="mr-2 size-4" />
              ) : theme === 'light' ? (
                <Sun className="mr-2 size-4" />
              ) : (
                <Laptop className="mr-2 size-4" />
              )}
              Theme
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent>
              <DropdownMenuItem onClick={() => setTheme('light')} className="h-10">
                <Sun className="mr-2 size-4" />
                Light
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTheme('dark')} className="h-10">
                <Moon className="mr-2 size-4" />
                Dark
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTheme('system')} className="h-10">
                <Laptop className="mr-2 size-4" />
                System
              </DropdownMenuItem>
            </DropdownMenuSubContent>
          </DropdownMenuSub>

          <DropdownMenuSeparator />

          <DropdownMenuItem
            onClick={async () => {
              await signOut();
              router.replace('/auth');
            }}
            className="h-10"
          >
            <LogOut className="mr-2 size-4" />
            Log out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <SetStatusModal open={statusModalOpen} onOpenChange={setStatusModalOpen} />
    </>
  );
};
