import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RSVPStatusChip } from '@/components/ui/rsvp-status-chip';
import { Separator } from '@/components/ui/separator';
import { Guest, guestGroupLabels, useGuests } from '@/context/GuestContext';
import { Bed, Utensils, Baby, Briefcase, Tag, Mail, Phone, Edit, Trash2, Users as GuestCompanion } from 'lucide-react';
import { Car, Plus } from '@phosphor-icons/react';
import { useState } from 'react';
import { GuestFormModal } from './guest-form-modal';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { maskEmail, maskPhone, logSensitiveDataAccess, sanitizeGuestData } from '@/lib/security';
import { useAuth } from '@/context/AuthContext';
import React from 'react';

interface GuestDetailModalProps {
  guest: Guest | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function GuestDetailModal({ guest, open, onOpenChange }: GuestDetailModalProps) {
  const { deleteGuest, updateRSVP, guests } = useGuests();
  const { toast } = useToast();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [editModalOpen, setEditModalOpen] = useState(false);
  
  // Sanitize guest data for security
  const sanitizedGuest = guest ? sanitizeGuestData(guest) : null;
  
  // Find if this guest has a companion or if this guest is a companion
  const companionGuest = guests.find(g => g.companionOfGuestId === guest?.id);
  const mainGuest = guest?.companionOfGuestId ? guests.find(g => g.id === guest.companionOfGuestId) : null;
  
  // Log sensitive data access when modal opens
  React.useEffect(() => {
    if (open && guest && user) {
      logSensitiveDataAccess('view_guest_details', guest.id, user.id);
    }
  }, [open, guest, user]);

  const handleEditComplete = () => {
    setEditModalOpen(false);
    onOpenChange(false);
    navigate('/guests');
  };

  if (!guest || !sanitizedGuest) return null;

  const handleDelete = () => {
    deleteGuest(guest.id);
    onOpenChange(false);
  };

  const handleRSVPChange = async (status: Guest['rsvpStatus']) => {
    try {
      console.log('🎯 User requested RSVP change:', { guestId: guest.id, fromStatus: guest.rsvpStatus, toStatus: status });
      await updateRSVP(guest.id, status);
      onOpenChange(false);
    } catch (error) {
      console.error('❌ Failed to update RSVP:', error);
      toast({
        title: "Błąd aktualizacji RSVP",
        description: error instanceof Error ? error.message : "Nie udało się zaktualizować statusu RSVP",
        variant: "destructive"
      });
    }
  };

  const handleAddCompanion = () => {
    onOpenChange(false);
    navigate(`/guests/new?companionOf=${guest.id}`);
  };


  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-cormorant text-xl">
              {sanitizedGuest.firstName} {sanitizedGuest.lastName || ''}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* Basic Info */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Grupa</span>
                <Badge variant="outline">{guestGroupLabels[guest.group]}</Badge>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Status</span>
                <Badge variant={guest.status === 'child' ? 'secondary' : 'outline'}>
                  {guest.status === 'child' ? 'Dziecko' : 'Dorosły'}
                </Badge>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">RSVP</span>
                <RSVPStatusChip status={guest.rsvpStatus} />
              </div>
            </div>

            {/* Contact Info */}
            {(sanitizedGuest.email || sanitizedGuest.phone) && (
              <>
                <Separator />
                <div className="space-y-3">
                  <h4 className="font-medium text-sm">Kontakt</h4>
                  {sanitizedGuest.email && (
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{maskEmail(sanitizedGuest.email)}</span>
                    </div>
                  )}
                  {sanitizedGuest.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{maskPhone(sanitizedGuest.phone)}</span>
                    </div>
                  )}
                </div>
              </>
            )}

            {/* Attributes */}
            <Separator />
              <div className="space-y-3">
                <h4 className="font-medium text-sm">Atrybuty</h4>
                
                {/* Special tags and relationships */}
                {guest.companionOfGuestId && mainGuest && (
                  <div className="bg-primary/10 border border-primary/20 rounded-lg p-3 mb-3">
                      <div className="flex items-center gap-2">
                        <GuestCompanion className="h-4 w-4 text-primary" />
                        <span className="text-sm font-medium text-primary">
                          Osoba towarzysząca: {mainGuest.firstName} {mainGuest.lastName || ''}
                        </span>
                      </div>
                  </div>
                )}
                
                {companionGuest && (
                  <div className="bg-muted/50 border rounded-lg p-3 mb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <GuestCompanion className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium">
                          Osoba towarzysząca: {companionGuest.firstName} {companionGuest.lastName || ''}
                        </span>
                      </div>
                      <RSVPStatusChip status={companionGuest.rsvpStatus} />
                    </div>
                  </div>
                )}
                
                <div className="flex flex-wrap gap-2">
                  {guest.accommodation && (
                    <div className="flex items-center gap-1 text-xs bg-muted px-2 py-1 rounded">
                      <Bed className="h-3 w-3" />
                      <span>Nocleg</span>
                    </div>
                  )}
                  {guest.transport && (
                    <div className="flex items-center gap-1 text-xs bg-muted px-2 py-1 rounded">
                      <Car size={12} weight="light" />
                      <span>Transport</span>
                    </div>
                  )}
                  {guest.dietaryRestrictions && (
                    <div className="flex items-center gap-1 text-xs bg-muted px-2 py-1 rounded">
                      <Utensils className="h-3 w-3" />
                      <span>{guest.dietaryRestrictions}</span>
                    </div>
                  )}
                  {guest.status === 'child' && (
                    <div className="flex items-center gap-1 text-xs bg-muted px-2 py-1 rounded">
                      <Baby className="h-3 w-3" />
                      <span>Dziecko</span>
                    </div>
                  )}
                  {guest.isServiceProvider && (
                    <div className="flex items-center gap-1 text-xs bg-muted px-2 py-1 rounded">
                      <Briefcase className="h-3 w-3" />
                      <span>Usługodawca</span>
                    </div>
                  )}
                  {guest.discountType !== 'none' && (
                    <div className="flex items-center gap-1 text-xs bg-muted px-2 py-1 rounded">
                      <Tag className="h-3 w-3" />
                      <span>{guest.discountType === 'free' ? 'Bezpłatny' : 'Zniżka'}</span>
                    </div>
                  )}
                </div>
                
                {(!guest.accommodation && !guest.transport && !guest.dietaryRestrictions && guest.status !== 'child' && !guest.isServiceProvider && guest.discountType === 'none' && !guest.companionOfGuestId) && (
                  <p className="text-xs text-muted-foreground">Brak dodatkowych atrybutów</p>
                )}
              </div>

            {/* Notes */}
            {guest.notes && (
              <>
                <Separator />
                <div className="space-y-2">
                  <h4 className="font-medium text-sm">Notatki</h4>
                  <p className="text-sm text-muted-foreground">{guest.notes}</p>
                </div>
              </>
            )}

            {/* RSVP Actions */}
            <Separator />
            <div className="space-y-3">
              <h4 className="font-medium text-sm">Zmień status RSVP</h4>
              <div className="grid grid-cols-3 gap-2">
                <Button
                  size="sm"
                  variant={guest.rsvpStatus === 'pending' ? 'default' : 'outline'}
                  onClick={() => handleRSVPChange('pending')}
                  className="text-xs"
                >
                  Oczekuje
                </Button>
                <Button
                  size="sm"
                  variant={guest.rsvpStatus === 'confirmed' ? 'default' : 'outline'}
                  onClick={() => handleRSVPChange('confirmed')}
                  className="text-xs"
                >
                  Potwierdzone
                </Button>
                <Button
                  size="sm"
                  variant={guest.rsvpStatus === 'declined' ? 'destructive' : 'outline'}
                  onClick={() => handleRSVPChange('declined')}
                  className="text-xs"
                >
                  Odmówione
                </Button>
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-3 pt-4">
              {/* Add companion button - only show if guest doesn't have companion and isn't a companion */}
              {!companionGuest && !guest.companionOfGuestId && (
                <Button
                  variant="outline"
                  onClick={handleAddCompanion}
                  className="w-full"
                >
                  <Plus size={16} weight="light" className="mr-2" />
                  Dodaj osobę towarzyszącą
                </Button>
              )}
              
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => setEditModalOpen(true)}
                  className="flex-1"
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Edytuj
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleDelete}
                  className="flex-1"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Usuń
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <GuestFormModal
        open={editModalOpen}
        onOpenChange={setEditModalOpen}
        guest={guest}
        onEditComplete={handleEditComplete}
      />
    </>
  );
}