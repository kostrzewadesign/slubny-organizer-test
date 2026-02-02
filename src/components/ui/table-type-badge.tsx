import { Badge } from "@/components/ui/badge";
import { Heart } from "lucide-react";

interface TableTypeBadgeProps {
  tableType: 'main_couple' | 'regular';
  className?: string;
}

export function TableTypeBadge({ tableType, className }: TableTypeBadgeProps) {
  if (tableType === 'main_couple') {
    return (
      <Badge variant="secondary" className={`bg-primary-light text-primary-dark ${className}`}>
        <Heart className="w-3 h-3 mr-1" />
        Stół Pary Młodej
      </Badge>
    );
  }

  return null;
}