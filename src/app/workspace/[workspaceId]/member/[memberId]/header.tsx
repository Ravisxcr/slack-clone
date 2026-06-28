'use client';

'use client';

import { FaChevronDown } from 'react-icons/fa';

import { AvailabilityDot, type Availability } from '@/components/availability-dot';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';

interface HeaderProps {
  memberName?: string;
  memberImage?: string;
  availability?: Availability | null;
  onClick?: () => void;
}

export const Header = ({ memberName = 'Member', memberImage, availability, onClick }: HeaderProps) => {
  const avatarFallback = memberName.charAt(0).toUpperCase();

  return (
    <div className="flex h-[49px] items-center overflow-hidden border-b bg-background px-4">
      <Button variant="ghost" className="w-auto overflow-hidden px-2 text-lg font-semibold" size="sm" onClick={onClick}>
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
        <FaChevronDown className="ml-2 size-2.5" />
      </Button>
    </div>
  );
};
