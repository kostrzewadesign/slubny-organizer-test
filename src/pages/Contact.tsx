import { ArrowLeft, Envelope } from '@phosphor-icons/react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import dividerImage from '@/assets/divider.png';

export default function Contact() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-white relative overflow-hidden">
      {/* Botanical background - same as /settings */}
      <div 
        className="absolute top-0 left-0 right-0 h-64 bg-no-repeat bg-top bg-cover pointer-events-none" 
        style={{ backgroundImage: 'url(/lovable-uploads/7238c2ee-740c-44af-b1a5-e7f0f6131661.png)' }}
      />

      {/* Back button */}
      <div className="relative z-10 p-4">
        <button
          onClick={() => navigate(-1)}
          className="w-10 h-10 flex items-center justify-center bg-primary rounded-lg md:w-12 md:h-12 md:rounded-xl md:shadow-sm"
        >
          <ArrowLeft size={24} weight="light" color="#FFFFFF" />
        </button>
      </div>

      {/* Main content */}
      <div className="relative z-10 max-w-lg mx-auto px-6 pt-4 pb-12">
        {/* Header */}
        <div className="text-center space-y-3 mb-6">
          <h1 className="text-4xl md:text-5xl font-cormorant font-bold text-[#1E1E1E]">
            Kontakt i pomoc
          </h1>
          <p className="text-base text-muted-foreground font-barlow">
            Potrzebujesz pomocy lub masz sugestię?
          </p>
        </div>

        {/* Decorative divider */}
        <div className="flex justify-center mb-8">
          <img src={dividerImage} alt="" className="h-6 opacity-60" />
        </div>

        {/* Contact Section */}
        <div className="text-center space-y-6">
          <p className="text-lg text-[#1E1E1E] font-barlow">
            Daj nam znać:
          </p>

          {/* Email Icon */}
          <div className="flex justify-center py-4">
            <Envelope 
              weight="light" 
              className="h-16 w-16 text-primary" 
              style={{ strokeWidth: '2px' }} 
            />
          </div>

          {/* Email Link */}
          <a 
            href="mailto:kontakt@slubnyorganizer.pl"
            className="inline-block font-barlow text-xl md:text-2xl text-primary hover:text-primary-dark transition-wedding underline decoration-2 underline-offset-4"
          >
            kontakt@slubnyorganizer.pl
          </a>
        </div>

        {/* Bottom Decorative divider */}
        <div className="flex justify-center mt-12">
          <img src={dividerImage} alt="" className="h-6 opacity-60" />
        </div>
      </div>
    </div>
  );
}
