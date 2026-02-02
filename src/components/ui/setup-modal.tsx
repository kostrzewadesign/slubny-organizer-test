import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Heart, Calendar } from 'lucide-react';

interface UserProfile {
  setup_completed: boolean;
  bride_first_name?: string;
  bride_last_name?: string;
  groom_first_name?: string;
  groom_last_name?: string;
  wedding_date?: string;
}

export function SetupModal() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);

  const { data: profile, isLoading } = useQuery({
    queryKey: ['userProfile'],
    queryFn: async (): Promise<UserProfile | null> => {
      if (!user?.id) return null;
      
      const { data, error } = await supabase
        .from('user_profiles')
        .select('setup_completed, bride_first_name, bride_last_name, groom_first_name, groom_last_name, wedding_date')
        .eq('user_id', user.id)
        .single();
      
      if (error) {
        console.error('Error fetching user profile:', error);
        return null;
      }
      
      return data;
    },
    enabled: !!user?.id,
  });

  useEffect(() => {
    if (!isLoading && profile && !profile.setup_completed) {
      setIsOpen(true);
    }
  }, [isLoading, profile]);

  const handleSetupNow = () => {
    setIsOpen(false);
    navigate('/setup');
  };

  const handleLater = () => {
    setIsOpen(false);
  };

  if (!isOpen || isLoading) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="text-center space-y-4">
          <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
            <Heart className="w-6 h-6 text-primary" />
          </div>
          <DialogTitle className="text-2xl font-cormorant font-bold text-foreground">
            Uzupełnij dane ślubu
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Te informacje pomogą spersonalizować Twój plan ślubny i lepiej zarządzać przygotowaniami.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 pt-4">
          <div className="flex items-center gap-3 p-3 bg-primary/5 rounded-lg">
            <Calendar className="w-5 h-5 text-primary" />
            <div className="text-sm text-muted-foreground">
              Dodaj datę ślubu, imiona pary i inne szczegóły
            </div>
          </div>
          
          <div className="flex flex-col gap-3 pt-2">
            <Button onClick={handleSetupNow} className="w-full">
              Uzupełnij teraz
            </Button>
            <Button 
              variant="ghost" 
              onClick={handleLater}
              className="w-full"
            >
              Zrobię to później
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}