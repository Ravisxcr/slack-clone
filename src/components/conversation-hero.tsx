import { AvailabilityDot, type Availability } from '@/components/availability-dot';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface ConversationHeroProps {
  name?: string;
  image?: string;
  availability?: Availability | null;
}

export const ConversationHero = ({ name = 'Member', image, availability }: ConversationHeroProps) => {
  const avatarFallback = name.charAt(0).toUpperCase();

  return (
    <div className="mx-5 mb-4 mt-[88px]">
      <div className="mb-2 flex items-center gap-x-1">
        <div className="relative mr-2 shrink-0">
          <Avatar className="size-14">
            <AvatarImage src={image} />
            <AvatarFallback>{avatarFallback}</AvatarFallback>
          </Avatar>
          <span className="absolute bottom-0 right-0 translate-x-0.5 translate-y-0.5">
            <AvailabilityDot availability={availability} size="md" borderColor="border-background" />
          </span>
        </div>

        <p className="text-2xl font-bold">{name}</p>
      </div>

      <p className="mb-4 text-base font-normal text-muted-foreground">
        This conversation is just between you and <strong>{name}</strong>
      </p>
    </div>
  );
};
