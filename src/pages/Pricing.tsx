import { useState } from 'react';
import { Lock, ShieldCheck, CreditCard, Spinner } from '@phosphor-icons/react';
import { Check, X } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Accordion, 
  AccordionContent, 
  AccordionItem, 
  AccordionTrigger 
} from '@/components/ui/accordion';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import dividerImage from '@/assets/divider.png';
import pricingIcon from '@/assets/pricing-icon.webp';

export default function Pricing() {
  const [isLoading, setIsLoading] = useState(false);

  const handlePayment = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-checkout');
      
      if (error) {
        throw new Error(error.message);
      }

      if (data?.url) {
        window.location.href = data.url;
      } else {
        throw new Error('Nie udało się utworzyć sesji płatności');
      }
    } catch (err) {
      console.error('Payment error:', err);
      toast.error('Wystąpił błąd podczas inicjowania płatności. Spróbuj ponownie.');
      setIsLoading(false);
    }
  };

  const benefits = [
    'Pełny dostęp do wszystkich funkcji',
    'Dostęp bez limitu czasu (lifetime)',
    'Dane zostają zachowane',
    'Darmowe aktualizacje',
    'Pomoc techniczna',
  ];

  const exclusions = [
    'Brak subskrypcji',
    'Brak cyklicznych opłat',
    'Brak ukrytych kosztów',
  ];

  const faqItems = [
    {
      id: 'subscription',
      question: 'Czy to subskrypcja?',
      answer: 'Nie. To jednorazowa opłata 59 zł. Nie ma żadnych cyklicznych płatności.',
    },
    {
      id: 'data',
      question: 'Co z danymi jeśli nie zapłacę?',
      answer: 'Wszystkie Twoje dane zostają zachowane. Dostęp do aplikacji zostanie zablokowany do momentu dokonania płatności.',
    },
    {
      id: 'later',
      question: 'Czy mogę zapłacić później?',
      answer: 'Tak. Po zakończeniu triala dostęp do aplikacji będzie zablokowany do momentu płatności, ale wszystkie Twoje dane zostaną zachowane.',
    },
  ];

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Botanical background decoration */}
      <div 
        className="absolute top-0 left-0 w-full h-64 bg-cover bg-top opacity-30 pointer-events-none"
        style={{ backgroundImage: `url('/lovable-uploads/7238c2ee-740c-44af-b1a5-e7f0f6131661.png')` }}
      />

      {/* Main content */}
      <div className="relative z-10 max-w-lg mx-auto px-6 pt-20 pb-12">
        {/* Hero Section */}
        <div className="text-center mb-8">
          <img 
            src={pricingIcon} 
            alt="" 
            className="w-24 h-24 mx-auto mb-6 object-contain"
          />
          <h1 className="text-3xl md:text-4xl font-cormorant font-bold text-foreground mb-3">
            Odblokuj pełny dostęp<br />do planera ślubnego
          </h1>
          <p className="text-primary font-barlow font-medium mb-4">
            Jednorazowa opłata. Dostęp na zawsze. Bez subskrypcji.
          </p>
          <p className="text-muted-foreground font-barlow text-sm leading-relaxed">
            Twój 5-dniowy okres próbny dobiega końca. Zachowaj wszystkie dane 
            i planuj dalej bez ograniczeń.
          </p>
        </div>

        {/* Divider */}
        <div className="flex justify-center mb-8">
          <img src={dividerImage} alt="" className="w-24 opacity-60" />
        </div>

        {/* Price Card */}
        <Card className="p-6 rounded-2xl shadow-card mb-6">
          {/* Price */}
          <div className="text-center mb-6">
            <span className="text-5xl font-cormorant font-bold text-primary">59 zł</span>
            <p className="text-muted-foreground font-barlow text-sm mt-1">jednorazowo</p>
          </div>

          {/* Benefits */}
          <div className="space-y-3 mb-6">
            {benefits.map((benefit, index) => (
              <div key={index} className="flex items-center gap-3">
                <div className="flex-shrink-0 w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center">
                  <Check className="w-3 h-3 text-primary" />
                </div>
                <span className="text-foreground font-barlow text-sm">{benefit}</span>
              </div>
            ))}
          </div>

          {/* Divider line */}
          <div className="border-t border-border my-6" />

          {/* Exclusions */}
          <div className="space-y-3">
            {exclusions.map((exclusion, index) => (
              <div key={index} className="flex items-center gap-3">
                <div className="flex-shrink-0 w-5 h-5 rounded-full bg-muted flex items-center justify-center">
                  <X className="w-3 h-3 text-muted-foreground" />
                </div>
                <span className="text-muted-foreground font-barlow text-sm">{exclusion}</span>
              </div>
            ))}
          </div>
        </Card>

        {/* CTA Button */}
        <Button
          onClick={handlePayment}
          disabled={isLoading}
          className="w-full h-14 rounded-2xl text-base font-barlow font-medium mb-4"
        >
          {isLoading ? (
            <>
              <Spinner className="mr-2 h-5 w-5 animate-spin" />
              Przekierowuję do płatności...
            </>
          ) : (
            'Zapłać 59 zł i odblokuj dostęp'
          )}
        </Button>

        {/* Payment security text */}
        <p className="text-center text-muted-foreground font-barlow text-xs mb-8">
          Bezpieczna płatność obsługiwana przez Stripe (karta / BLIK)
        </p>

        {/* Security Section */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="flex flex-col items-center text-center">
            <Lock className="w-6 h-6 text-primary mb-2" />
            <span className="text-muted-foreground font-barlow text-xs leading-tight">
              Dane karty nie trafiają do aplikacji
            </span>
          </div>
          <div className="flex flex-col items-center text-center">
            <ShieldCheck className="w-6 h-6 text-primary mb-2" />
            <span className="text-muted-foreground font-barlow text-xs leading-tight">
              Szyfrowanie SSL
            </span>
          </div>
          <div className="flex flex-col items-center text-center">
            <CreditCard className="w-6 h-6 text-primary mb-2" />
            <span className="text-muted-foreground font-barlow text-xs leading-tight">
              Stripe Payments
            </span>
          </div>
        </div>

        {/* Divider */}
        <div className="flex justify-center mb-8">
          <img src={dividerImage} alt="" className="w-24 opacity-60" />
        </div>

        {/* FAQ Section */}
        <div className="mb-8">
          <h2 className="text-xl font-cormorant font-bold text-foreground text-center mb-4">
            Najczęstsze pytania
          </h2>
          <Accordion type="single" collapsible className="space-y-2">
            {faqItems.map((item) => (
              <AccordionItem 
                key={item.id} 
                value={item.id}
                className="border border-border rounded-xl px-4 bg-card"
              >
                <AccordionTrigger className="text-foreground font-barlow text-sm hover:no-underline py-4">
                  {item.question}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground font-barlow text-sm pb-4">
                  {item.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </div>
  );
}
