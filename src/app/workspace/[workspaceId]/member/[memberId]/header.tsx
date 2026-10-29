'use client';

import { Film, MessageSquare } from 'lucide-react';
import { FaChevronDown } from 'react-icons/fa';

import { AvailabilityDot, type Availability } from '@/components/availability-dot';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface HeaderProps {
  memberName?: string;
  memberImage?: string;
  availability?: Availability | null;
  onClick?: () => void;
  activeTab?: 'messages' | 'reels';
  onTabChange?: (tab: 'messages' | 'reels') => void;
  reelsCount?: number;
}

export const Header = ({
  memberName = 'Member',
  memberImage,
  availability,
  onClick,
  activeTab = 'messages',
  onTabChange,
  reelsCount,
}: HeaderProps) => {
  const avatarFallback = memberName.charAt(0).toUpperCase();

  return (
    <div className="flex h-[49px] shrink-0 items-center justify-between border-b bg-background px-3 sm:px-4">
      <div className="flex h-full min-w-0 items-center gap-x-1 sm:gap-x-2">
        <Button variant="ghost" className="w-auto overflow-hidden px-1.5 sm:px-2 text-base sm:text-lg font-semibold" size="sm" onClick={onClick}>
          <div className="relative mr-2 shrink-0">
            <Avatar className="size-6">
              <AvatarImage src={memberImage} />
              <AvatarFallback>{avatarFallback}</AvatarFallback>
            </Avatar>
            <span className="absolute -bottom-0.5 -right-0.5">
              <AvailabilityDot availability={availability} size="sm" borderColor="border-background" />
            </span>
          </div>

          <span className="truncate">{memberName}</span>
          <FaChevronDown className="ml-1.5 sm:ml-2 size-2.5 shrink-0" />
        </Button>

        {onTabChange && (
          <div className="ml-1 sm:ml-3 flex h-full items-center">
            <button
              type="button"
              onClick={() => onTabChange('messages')}
              className={cn(
                'flex h-full items-center gap-x-1 sm:gap-x-1.5 border-b-2 px-2 sm:px-3 text-xs sm:text-sm font-medium transition-colors select-none',
                activeTab === 'messages'
                  ? 'border-primary text-foreground'
                  : 'border-transparent text-muted-foreground hover:text-foreground',
              )}
            >
              <MessageSquare className="size-3.5 sm:size-4" />
              <span>Messages</span>
            </button>

            <button
              type="button"
              onClick={() => onTabChange('reels')}
              className={cn(
                'flex h-full items-center gap-x-1 sm:gap-x-1.5 border-b-2 px-2 sm:px-3 text-xs sm:text-sm font-medium transition-colors select-none',
                activeTab === 'reels'
                  ? 'border-pink-500 text-pink-600 font-semibold dark:text-pink-400'
                  : 'border-transparent text-muted-foreground hover:text-foreground',
              )}
            >
              <Film className="size-3.5 sm:size-4 text-pink-500" />
              <span>Reels</span>
              {reelsCount !== undefined && reelsCount > 0 && (
                <span className="ml-0.5 rounded-full bg-pink-500/10 px-1.5 py-0.2 text-[10px] font-semibold text-pink-500">
                  {reelsCount}
                </span>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
