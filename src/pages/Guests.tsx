import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { RSVPStatusChip } from '@/components/ui/rsvp-status-chip'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { CategoryEditModal } from '@/components/ui/category-edit-modal'
import { Users, UserCheck, UserX, Heart } from 'lucide-react'
import { ArrowLeft, Plus, CaretDown, CheckCircle, XCircle, Question, Car } from '@phosphor-icons/react'
import divider from '@/assets/divider.png'
import { Bed, Utensils, Baby, Briefcase, Tag, Users as GuestCompanion, Percent, Gift } from 'lucide-react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useState, useEffect, useMemo } from 'react'
import { useGuests, Guest, guestGroupLabels, GuestGroup } from '@/context/GuestContext'
import { useToast } from '@/hooks/use-toast'
import { createMaskedGuestData } from '@/utils/data-masking'
import { useAuth } from '@/context/AuthContext'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'


export default function Guests() {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const { user } = useAuth();
  const { 
    guests, 
    totalInvited, 
    confirmedCount, 
    declinedCount, 
    pendingCount,
    guestsByGroup,
    groupCounts,
    availableGroups,
    adultsCount,
    childrenCount,
    serviceProvidersCount,
    transportCount,
    accommodationCount,
    dietaryRestrictionsCount,
    companionsCount,
    discountCount,
    freeCount,
    totalDiscountedCount,
    confirmedAdultsCount,
    confirmedChildrenCount,
    confirmedServiceProvidersCount,
    confirmedAccommodationCount,
    confirmedTransportCount,
    confirmedDietaryRestrictionsCount,
    confirmedDiscountCount,
    adultsCountWithoutDeclined,
    childrenCountWithoutDeclined,
    serviceProvidersCountWithoutDeclined,
    accommodationCountWithoutDeclined,
    transportCountWithoutDeclined,
    dietaryRestrictionsCountWithoutDeclined,
    discountCountWithoutDeclined,
    editGroupName
  } = useGuests();
  
  const [editingGroup, setEditingGroup] = useState<string | null>(null);
  const [expandedSections, setExpandedSections] = useState<string[]>([]);

  // Scroll to guest after edit
  useEffect(() => {
    const scrollToId = location.state?.scrollToId;
    if (scrollToId && guests.length > 0) {
      // Find the guest and their group
      const guest = guests.find(g => g.id === scrollToId);
      
      if (guest) {
        // Open the accordion section if not already open
        const guestGroup = guest.group || 'friends';
        if (!expandedSections.includes(guestGroup)) {
          const newSections = [...expandedSections, guestGroup];
          setExpandedSections(newSections);
          localStorage.setItem('guests-expanded-sections', JSON.stringify(newSections));
        }
        
        // Wait for DOM to render and scroll
        setTimeout(() => {
          const element = document.getElementById(`guest-${scrollToId}`);
          if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
            element.classList.add('highlight-flash');
            setTimeout(() => element.classList.remove('highlight-flash'), 2000);
          }
        }, 150);
      }
      
      // Clear state
      window.history.replaceState({}, document.title);
    }
  }, [location.state, guests, expandedSections]);

  // Diagnostic logging removed to reduce console noise
  // useEffect(() => {
  //   console.log('🔍 [Guests] Live stats (without declined):', { ... });
  // }, [guests, ...]);

  const handleGuestClick = (guestId: string) => {
    navigate(`/guests/edit/${guestId}`, { state: { scrollToId: guestId } });
  };

  const handleEditGroup = (newGroupLabel: string) => {
    if (editingGroup) {
      try {
        editGroupName(editingGroup, newGroupLabel);
      } catch (error) {
        console.error('Error editing group:', error);
        toast({
          title: "Błąd podczas edycji grupy",
          variant: "destructive",
          duration: 3000,
        });
      }
    }
  };

  const getGuestAttributes = (guest: Guest) => {
    const attributes = [];
    if (guest.accommodation) attributes.push(<Bed key="bed" size={16} className="text-primary" />);
    if (guest.transport) attributes.push(<Car key="car" size={20} weight="light" className="text-primary" />);
    if (guest.dietaryRestrictions) attributes.push(<Utensils key="utensils" size={16} className="text-primary" />);
    if (guest.status === 'child') attributes.push(<Baby key="baby" size={16} className="text-primary" />);
    if (guest.isServiceProvider) attributes.push(<Briefcase key="briefcase" size={16} className="text-primary" />);
    if (guest.discountType !== 'none') attributes.push(<Tag key="tag" size={16} className="text-primary" />);
    if (guest.companionOfGuestId) attributes.push(<GuestCompanion key="companion" size={16} className="text-primary" />);
    return attributes;
  };

  // Set default expanded section on first load - only "Para Młoda" category
  useEffect(() => {
    const saved = localStorage.getItem('guests-expanded-sections');
    if (saved) {
      try {
        setExpandedSections(JSON.parse(saved));
      } catch {
        // Migration from old string format
        setExpandedSections([saved]);
      }
    } else {
      // Default to only "Para Młoda" (couple) expanded on first visit
      const categories = Object.keys(guestsByGroup);
      const defaultCategory = categories.includes('couple') ? 
        ['couple'] : 
        categories.length > 0 ? [categories[0]] : [];
      setExpandedSections(defaultCategory);
    }
  }, [guestsByGroup]);

  const handleAccordionChange = (values: string[]) => {
    setExpandedSections(values);
    localStorage.setItem('guests-expanded-sections', JSON.stringify(values));
  };

  
  return (
    <div className="min-h-screen bg-white relative overflow-hidden">
      {/* Mobile header with botanical background */}
      <div className="md:hidden relative">
        <div 
          className="absolute top-0 left-0 right-0 h-64 bg-no-repeat bg-top bg-cover pointer-events-none animate-float"
          style={{
            backgroundImage: `url(/lovable-uploads/7238c2ee-740c-44af-b1a5-e7f0f6131661.png)`,
          }}
        />
        
        {/* Navigation icons */}
        <div className="relative z-10 flex items-center justify-between p-4">
          <Link 
            to="/dashboard" 
            className="w-10 h-10 flex items-center justify-center bg-primary rounded-lg transition-colors transition-transform duration-200 active:scale-95"
          >
            <ArrowLeft size={24} weight="light" color="#FFFFFF" />
          </Link>
          
          <button 
            onClick={() => navigate('/guests/new')}
            className="w-10 h-10 flex items-center justify-center bg-primary rounded-lg transition-colors transition-transform duration-200 active:scale-95"
          >
            <Plus size={24} weight="light" color="#FFFFFF" />
          </button>
        </div>
        
        {/* Centered title section */}
        <div className="relative z-10 text-center px-4 pb-8">
          <h1 className="text-4xl font-cormorant font-bold text-[#1E1E1E] mb-3 animate-fade-in">Lista gości</h1>
          <p className="text-muted-foreground font-barlow text-lg animate-fade-in">Zarządzajcie zaproszonymi osobami</p>
        </div>
      </div>

      {/* Desktop header */}
      <div className="hidden md:block">
        <div 
          className="absolute top-0 left-0 right-0 h-80 opacity-30 bg-no-repeat bg-center bg-cover pointer-events-none"
          style={{
            backgroundImage: `url(/lovable-uploads/7238c2ee-740c-44af-b1a5-e7f0f6131661.png)`,
          }}
        />
        
        {/* Navigation icons */}
        <div className="relative z-10 flex items-center justify-between p-4">
          <Link 
            to="/dashboard" 
            className="w-12 h-12 flex items-center justify-center rounded-xl bg-[#A3B368] shadow-sm"
          >
            <ArrowLeft size={24} weight="light" color="#FFFFFF" />
          </Link>
          
          <button 
            onClick={() => navigate('/guests/new')}
            className="w-12 h-12 flex items-center justify-center rounded-xl bg-[#A3B368] shadow-sm"
          >
            <Plus size={24} weight="light" color="#FFFFFF" />
          </button>
        </div>
        
        {/* Centered title section */}
        <div className="relative z-10 text-center px-4 pb-8">
          <h1 className="text-4xl font-cormorant font-bold text-[#1E1E1E] mb-3">Lista gości</h1>
          <p className="text-muted-foreground font-barlow text-lg">Zarządzajcie zaproszonymi osobami</p>
        </div>
      </div>

      <div className="relative z-10 container mx-auto px-4 space-y-6">

        {/* Guest Summary - Combined RSVP and Attributes */}
        {/* Mobile Summary Card */}
        <div className="md:hidden bg-transparent mb-8">
          <div className="pb-4 text-center">
            <p className="text-sm font-barlow text-muted-foreground mb-1">Zaproszono</p>
            <h3 className="text-4xl font-cormorant text-foreground font-bold">
              {totalInvited} osób
            </h3>
          </div>
          <div className="pt-0 space-y-6">
            {/* RSVP Status */}
            <div className="flex justify-between items-center">
              {/* Potwierdzili */}
              <div className="flex flex-col items-center flex-1 text-center">
                <div className="text-3xl font-cormorant font-bold text-success">{confirmedCount}</div>
                <div className="text-xs font-barlow text-muted-foreground">Potwierdziło</div>
              </div>
              
              {/* Separator */}
              <div className="w-px h-12 bg-border mx-3"></div>
              
              {/* Odmówili */}
              <div className="flex flex-col items-center flex-1 text-center">
                <div className="text-3xl font-cormorant font-bold text-destructive">{declinedCount}</div>
                <div className="text-xs font-barlow text-muted-foreground">Odmówiło</div>
              </div>
              
              {/* Separator */}
              <div className="w-px h-12 bg-border mx-3"></div>
              
              {/* Bez odpowiedzi */}
              <div className="flex flex-col items-center flex-1 text-center">
                <div className="text-3xl font-cormorant font-bold text-warning">{pendingCount}</div>
                <div className="text-xs font-barlow text-muted-foreground">Oczekuje</div>
              </div>
            </div>

          </div>
        </div>

        {/* Desktop Summary - Combined Grid */}
        <div className="hidden md:space-y-6 mb-8">
          {/* RSVP Stats - 4 cards */}
          <div className="grid grid-cols-4 gap-4">
            <Card className="shadow-card">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium font-barlow text-foreground">Zaproszeni</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold font-cormorant text-foreground">{totalInvited}</div>
              </CardContent>
            </Card>

            <Card className="shadow-card">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium font-barlow text-foreground">Potwierdzili</CardTitle>
                <UserCheck className="h-4 w-4 text-success" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold font-cormorant text-success">{confirmedCount}</div>
              </CardContent>
            </Card>

            <Card className="shadow-card">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium font-barlow text-foreground">Odmówili</CardTitle>
                <UserX className="h-4 w-4 text-destructive" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold font-cormorant text-destructive">{declinedCount}</div>
              </CardContent>
            </Card>

            <Card className="shadow-card">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium font-barlow text-foreground">Bez odpowiedzi</CardTitle>
                <Users className="h-4 w-4 text-warning" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold font-cormorant text-warning">{pendingCount}</div>
              </CardContent>
            </Card>
          </div>

          {/* Guest Attributes - Grid Cards */}
          {(adultsCount > 0 || childrenCount > 0 || transportCount > 0 || accommodationCount > 0 || dietaryRestrictionsCount > 0 || serviceProvidersCount > 0 || companionsCount > 0 || discountCount > 0 || freeCount > 0) && (
            <div className="grid grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-4">
              {adultsCount > 0 && (
                <Card className="shadow-card">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium font-barlow text-foreground">Dorośli</CardTitle>
                    <Users className="h-4 w-4 text-primary" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold font-cormorant text-foreground">{adultsCount}</div>
                  </CardContent>
                </Card>
              )}

              {childrenCount > 0 && (
                <Card className="shadow-card">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium font-barlow text-foreground">Dzieci</CardTitle>
                    <Baby className="h-4 w-4 text-primary" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold font-cormorant text-foreground">{childrenCount}</div>
                  </CardContent>
                </Card>
              )}

              {transportCount > 0 && (
                <Card className="shadow-card">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium font-barlow text-foreground">Transport</CardTitle>
                    <Car size={16} weight="light" className="text-primary" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold font-cormorant text-foreground">{transportCount}</div>
                  </CardContent>
                </Card>
              )}

              {accommodationCount > 0 && (
                <Card className="shadow-card">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium font-barlow text-foreground">Nocleg</CardTitle>
                    <Bed className="h-4 w-4 text-primary" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold font-cormorant text-foreground">{accommodationCount}</div>
                  </CardContent>
                </Card>
              )}

              {dietaryRestrictionsCount > 0 && (
                <Card className="shadow-card">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium font-barlow text-foreground">Diety specjalne</CardTitle>
                    <Utensils className="h-4 w-4 text-primary" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold font-cormorant text-foreground">{dietaryRestrictionsCount}</div>
                  </CardContent>
                </Card>
              )}

              {serviceProvidersCount > 0 && (
                <Card className="shadow-card">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium font-barlow text-foreground">Usługodawcy</CardTitle>
                    <Briefcase className="h-4 w-4 text-primary" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold font-cormorant text-foreground">{serviceProvidersCount}</div>
                  </CardContent>
                </Card>
              )}

              {companionsCount > 0 && (
                <Card className="shadow-card">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium font-barlow text-foreground">Towarzyszący</CardTitle>
                    <GuestCompanion className="h-4 w-4 text-primary" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold font-cormorant text-foreground">{companionsCount}</div>
                  </CardContent>
                </Card>
              )}

              {discountCount > 0 && (
                <Card className="shadow-card">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium font-barlow text-foreground">Zniżka</CardTitle>
                    <Percent className="h-4 w-4 text-primary" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold font-cormorant text-foreground">{discountCount}</div>
                  </CardContent>
                </Card>
              )}

              {freeCount > 0 && (
                <Card className="shadow-card">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium font-barlow text-foreground">Bezpłatni</CardTitle>
                    <Gift className="h-4 w-4 text-primary" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold font-cormorant text-foreground">{freeCount}</div>
                  </CardContent>
                </Card>
              )}
            </div>
           )}
         </div>

        {/* Divider */}
        <div className="flex justify-center my-8">
          <img src={divider} alt="" className="w-full max-w-md" />
        </div>

        {/* Guest List */}
        <Accordion 
          type="multiple"
          value={expandedSections}
          onValueChange={handleAccordionChange}
          className="space-y-6"
        >
          {Object.entries(availableGroups)
            .filter(([groupKey]) => groupKey !== 'declined-guests') // Exclude declined-guests category from main list
            .sort(([keyA], [keyB]) => {
              // Para Młoda zawsze pierwsza
              if (keyA === 'couple') return -1;
              if (keyB === 'couple') return 1;
              return 0; // reszta w domyślnej kolejności
            })
            .map(([groupKey, groupLabel]) => {
            const group = groupKey as GuestGroup;
            const groupGuests = (guestsByGroup[group] || []).sort((a, b) => {
              // W kategorii "couple" - bride pierwsza, potem groom
              if (groupKey === 'couple') {
                if (a.role === 'bride') return -1;
                if (b.role === 'bride') return 1;
                if (a.role === 'groom') return -1;
                if (b.role === 'groom') return 1;
              }
              return 0;
            });
            const count = groupCounts[group] || 0;
            
            // Show all categories, even if empty, for template consistency

            // Use regular event handlers instead of hooks inside map
            const handleGroupLongPress = () => setEditingGroup(groupKey);
            
            return (
              <AccordionItem key={group} value={group} className="border-none">
                <AccordionTrigger className="hover:no-underline p-0 [&>svg]:hidden">
                  <div className="flex items-center justify-between w-full pr-4">
                     <h2 
                       className="text-xl font-cormorant font-semibold text-left text-foreground flex items-center gap-2"
                       onContextMenu={(e) => {
                         e.preventDefault();
                         handleGroupLongPress();
                       }}
                       onTouchStart={(e) => {
                         const timer = setTimeout(() => {
                           handleGroupLongPress();
                         }, 500);
                         
                         const cleanup = () => {
                           clearTimeout(timer);
                           document.removeEventListener('touchend', cleanup);
                           document.removeEventListener('touchcancel', cleanup);
                         };
                         
                         document.addEventListener('touchend', cleanup);
                         document.addEventListener('touchcancel', cleanup);
                       }}
                     >
                       {groupKey === 'couple' && <Heart className="w-5 h-5 text-primary" />}
                       {groupLabel}
                     </h2>
                    <div className="flex items-center space-x-3">
                      <span className="text-sm font-barlow text-muted-foreground">
                        {count}
                      </span>
                      <CaretDown 
                        size={20} 
                        weight="light" 
                        className="text-muted-foreground transition-transform duration-200 group-data-[state=open]:rotate-180" 
                      />
                    </div>
                  </div>
                </AccordionTrigger>
                
                <AccordionContent className="pt-3 pb-0 px-0">
                  {groupGuests.length === 0 ? (
                    <div className="text-center py-4 text-muted-foreground">
                      <p className="font-barlow text-sm">Brak gości w tej kategorii</p>
                    </div>
                  ) : (
                    <div className="space-y-2 mb-2">
                       {groupGuests.map((guest) => {
                       return (
                        <Card 
                         key={guest.id}
                         id={`guest-${guest.id}`}
                         className={`cursor-pointer transition-all duration-200 ${
                           guest.rsvpStatus === 'confirmed' 
                             ? '!shadow-none !border-0 border-transparent' 
                             : 'shadow-card hover:shadow-card-hover'
                         }`}
                         style={guest.rsvpStatus === 'confirmed' ? { backgroundColor: 'hsla(73, 51%, 94%, 0.4)' } : undefined}
                         onClick={() => handleGuestClick(guest.id)}
                         onContextMenu={(e) => {
                           e.preventDefault();
                           handleGuestClick(guest.id);
                         }}
                         onTouchStart={(e) => {
                           const timer = setTimeout(() => {
                             handleGuestClick(guest.id);
                           }, 500);
                           
                           const cleanup = () => {
                             clearTimeout(timer);
                             document.removeEventListener('touchend', cleanup);
                             document.removeEventListener('touchcancel', cleanup);
                           };
                           
                           document.addEventListener('touchend', cleanup);
                           document.addEventListener('touchcancel', cleanup);
                         }}
                        >
                         <CardContent className="p-4">
                           <div className="flex items-center justify-between">
                             <div className="flex-1">
                              <div className="flex items-center space-x-2 mb-2">
                                 <span className="font-barlow text-base text-foreground">
                                   {(guest.role === 'bride' || guest.role === 'groom') && '❤️ '}
                                   {guest.firstName}{guest.lastName ? ` ${guest.lastName}` : ''}
                                 </span>
                               </div>
                               
                               {getGuestAttributes(guest).length > 0 && (
                                 <div className="flex items-center space-x-2">
                                   {getGuestAttributes(guest).map((icon, index) => (
                                     <span key={index} className="text-muted-foreground">
                                       {icon}
                                     </span>
                                   ))}
                                 </div>
                               )}
                             </div>
                             
                             <RSVPStatusChip status={guest.rsvpStatus} />
                           </div>
                         </CardContent>
                        </Card>
                        );
                      })}
                    </div>
                  )}
                   
                   {/* Add guest button - hidden for "Para Młoda" category */}
                   {groupKey !== 'couple' && (
                    <Card 
                      className="cursor-pointer transition-all duration-200 !shadow-none !border-0 border-transparent bg-transparent"
                      onClick={() => navigate(`/guests/new?group=${groupKey}`)}
                    >
                      <CardContent className="p-2">
                        <div className="flex items-center justify-center space-x-2 text-primary">
                          <Plus size={18} weight="light" />
                          <span className="font-barlow text-sm">
                            Dodaj gościa
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </AccordionContent>
              </AccordionItem>
            );
          })}
        </Accordion>

        {/* Divider */}
        <div className="flex justify-center my-8">
          <img src={divider} alt="" className="w-full max-w-md" />
        </div>

        {/* Podsumowanie Gości Section - Based on Confirmed */}
        <div className="pb-8">
          <h2 className="text-2xl font-cormorant font-bold text-center text-foreground mb-2">
            Podsumowanie Gości
          </h2>
          <p className="text-sm font-barlow text-muted-foreground text-center mb-6">
            Poniżej przedstawiono szczegółowe dane gości, z wyłączeniem osób, które odmówiły udziału.
          </p>

          {/* Summary Grid - Mobile */}
          <div className="md:hidden space-y-8">
            {/* Row 1 - 3 columns with separators */}
            <div className="grid grid-cols-[1fr_1px_1fr_1px_1fr] gap-0">
              <div className="flex flex-col items-center justify-center px-2">
              <Users size={32} className="text-[#A3B368] mb-3" strokeWidth={1.5} />
                <span className="text-sm font-barlow text-muted-foreground text-center mb-2">Dorośli</span>
                <span className="text-sm font-barlow font-bold text-foreground">{adultsCountWithoutDeclined} osób</span>
              </div>

              <div className="w-px bg-border self-stretch" />

              <div className="flex flex-col items-center justify-center px-2">
                <Baby size={32} className="text-[#A3B368] mb-3" strokeWidth={1.5} />
                <span className="text-sm font-barlow text-muted-foreground text-center mb-2">Dzieci</span>
                <span className="text-sm font-barlow font-bold text-foreground">{childrenCountWithoutDeclined} osób</span>
              </div>

              <div className="w-px bg-border self-stretch" />

              <div className="flex flex-col items-center justify-center px-2">
                <Briefcase size={32} className="text-[#A3B368] mb-3" strokeWidth={1.5} />
                <span className="text-sm font-barlow text-muted-foreground text-center mb-2">Usługodawca</span>
                <span className="text-sm font-barlow font-bold text-foreground">{serviceProvidersCountWithoutDeclined} osób</span>
              </div>
            </div>

            {/* Row 2 - 3 columns with separators */}
            <div className="grid grid-cols-[1fr_1px_1fr_1px_1fr] gap-0">
              <div className="flex flex-col items-center justify-center px-2">
                <Bed size={32} className="text-[#A3B368] mb-3" strokeWidth={1.5} />
                <span className="text-sm font-barlow text-muted-foreground text-center mb-2">Nocleg</span>
                <span className="text-sm font-barlow font-bold text-foreground">{accommodationCountWithoutDeclined} osób</span>
              </div>

              <div className="w-px bg-border self-stretch" />

              <div className="flex flex-col items-center justify-center px-2">
                <Car size={32} weight="light" className="text-[#A3B368] mb-3" style={{ strokeWidth: '1.5px' }} />
                <span className="text-sm font-barlow text-muted-foreground text-center mb-2">Transport</span>
                <span className="text-sm font-barlow font-bold text-foreground">{transportCountWithoutDeclined} osób</span>
              </div>

              <div className="w-px bg-border self-stretch" />

              <div className="flex flex-col items-center justify-center px-2">
                <Utensils size={32} className="text-[#A3B368] mb-3" strokeWidth={1.5} />
                <span className="text-sm font-barlow text-muted-foreground text-center mb-2">Dieta</span>
                <span className="text-sm font-barlow font-bold text-foreground">{dietaryRestrictionsCountWithoutDeclined} osób</span>
              </div>
            </div>

            {/* Row 3 - Centered single column */}
            <div className="flex justify-center">
              <div className="flex flex-col items-center justify-center px-2">
                <Percent size={32} className="text-[#A3B368] mb-3" strokeWidth={1.5} />
                <span className="text-sm font-barlow text-muted-foreground text-center mb-2">Zniżka</span>
                <span className="text-sm font-barlow font-bold text-foreground">{discountCountWithoutDeclined} osób</span>
              </div>
            </div>
          </div>

          {/* Summary Grid - Desktop (7 columns) */}
          <div className="hidden md:grid md:grid-cols-4 lg:grid-cols-7 gap-4">
            <div className="flex flex-col items-center p-6">
              <Users size={28} className="text-primary mb-3" strokeWidth={1.5} />
              <span className="text-sm font-barlow text-muted-foreground text-center mb-2">Dorośli</span>
              <span className="text-2xl font-barlow font-bold text-foreground">{adultsCountWithoutDeclined}</span>
            </div>

            <div className="flex flex-col items-center p-6">
              <Baby size={28} className="text-primary mb-3" strokeWidth={1.5} />
              <span className="text-sm font-barlow text-muted-foreground text-center mb-2">Dzieci</span>
              <span className="text-2xl font-barlow font-bold text-foreground">{childrenCountWithoutDeclined}</span>
            </div>

            <div className="flex flex-col items-center p-6">
              <Briefcase size={28} className="text-primary mb-3" strokeWidth={1.5} />
              <span className="text-sm font-barlow text-muted-foreground text-center mb-2">Usługodawca</span>
              <span className="text-2xl font-barlow font-bold text-foreground">{serviceProvidersCountWithoutDeclined}</span>
            </div>

            <div className="flex flex-col items-center p-6">
              <Bed size={28} className="text-primary mb-3" strokeWidth={1.5} />
              <span className="text-sm font-barlow text-muted-foreground text-center mb-2">Nocleg</span>
              <span className="text-2xl font-barlow font-bold text-foreground">{accommodationCountWithoutDeclined}</span>
            </div>

            <div className="flex flex-col items-center p-6">
              <Car size={28} weight="light" className="text-primary mb-3" style={{ strokeWidth: '1.5px' }} />
              <span className="text-sm font-barlow text-muted-foreground text-center mb-2">Transport</span>
              <span className="text-2xl font-barlow font-bold text-foreground">{transportCountWithoutDeclined}</span>
            </div>

            <div className="flex flex-col items-center p-6">
              <Utensils size={28} className="text-primary mb-3" strokeWidth={1.5} />
              <span className="text-sm font-barlow text-muted-foreground text-center mb-2">Dieta</span>
              <span className="text-2xl font-barlow font-bold text-foreground">{dietaryRestrictionsCountWithoutDeclined}</span>
            </div>

            <div className="flex flex-col items-center p-6">
              <Percent size={28} className="text-primary mb-3" strokeWidth={1.5} />
              <span className="text-sm font-barlow text-muted-foreground text-center mb-2">Zniżka</span>
              <span className="text-2xl font-barlow font-bold text-foreground">{discountCountWithoutDeclined}</span>
          </div>
        </div>

        {/* Declined Guests Section - After Podsumowanie Gości */}
        {/* Always visible, even if empty */}
        <>
          {/* Divider */}
          <div className="flex justify-center my-8">
            <img src={divider} alt="" className="w-full max-w-md" />
          </div>

          {/* Declined Category */}
          <div className="pb-8">
            <Accordion 
              type="multiple" 
              defaultValue={[]}
              className="space-y-6"
            >
              <AccordionItem value="declined-guests" className="border-none">
                <AccordionTrigger className="hover:no-underline p-0 [&>svg]:hidden">
                  <div className="flex items-center justify-between w-full pr-4">
                    <h2 className="text-xl font-cormorant font-semibold text-left text-foreground">
                      {availableGroups['declined-guests'] || 'Odmówili udziału'}
                    </h2>
                    <div className="flex items-center space-x-3">
                      <span className="text-sm font-barlow text-muted-foreground">
                        {groupCounts['declined-guests'] || 0}
                      </span>
                      <CaretDown 
                        size={20} 
                        weight="light" 
                        className="text-muted-foreground transition-transform duration-200 group-data-[state=open]:rotate-180" 
                      />
                    </div>
                  </div>
                </AccordionTrigger>
                
                <AccordionContent className="pt-3 pb-0 px-0">
                  {!guestsByGroup['declined-guests'] || guestsByGroup['declined-guests'].length === 0 ? (
                    <div className="text-center py-4 text-muted-foreground">
                      <p className="font-barlow text-sm">Brak gości w tej kategorii</p>
                    </div>
                  ) : (
                    <div className="space-y-2 mb-2">
                      {guestsByGroup['declined-guests'].map((guest) => {
                        return (
                          <Card 
                            key={guest.id} 
                            className="cursor-pointer transition-all duration-200 shadow-card hover:shadow-card-hover"
                            onClick={() => handleGuestClick(guest.id)}
                            onContextMenu={(e) => {
                              e.preventDefault();
                              handleGuestClick(guest.id);
                            }}
                            onTouchStart={(e) => {
                              const timer = setTimeout(() => {
                                handleGuestClick(guest.id);
                              }, 500);
                              
                              const cleanup = () => {
                                clearTimeout(timer);
                                document.removeEventListener('touchend', cleanup);
                                document.removeEventListener('touchcancel', cleanup);
                              };
                              
                              document.addEventListener('touchend', cleanup);
                              document.addEventListener('touchcancel', cleanup);
                            }}
                          >
                            <CardContent className="p-4">
                              <div className="flex items-center justify-between">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-2">
                                    <span className="font-barlow text-base text-foreground">
                                      {guest.firstName} {guest.lastName}
                                    </span>
                                  </div>
                                  
                                  {getGuestAttributes(guest).length > 0 && (
                                    <div className="flex items-center space-x-2">
                                      {getGuestAttributes(guest).map((icon, index) => (
                                        <span key={index} className="text-muted-foreground">
                                          {icon}
                                        </span>
                                      ))}
                                    </div>
                                  )}
                                </div>
                                
                                <RSVPStatusChip status={guest.rsvpStatus} />
                              </div>
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                  )}
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        </>
      </div>
      </div>

      {/* Group Edit Modal */}
      <CategoryEditModal
        isOpen={!!editingGroup}
        onClose={() => setEditingGroup(null)}
        onSave={handleEditGroup}
        currentName={availableGroups[editingGroup || ''] || ''}
        title="Edytuj grupę gości"
      />
    </div>
  )
}