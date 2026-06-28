import { useState, useEffect, useMemo } from 'react';
import { createFileRoute, useNavigate, Outlet, useSearch } from '@tanstack/react-router';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, File, X } from 'lucide-react'; // Assuming these icons are used
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { supabase } from '#/utils/supabaseClient'; // Assuming this path
import { toast } from 'sonner';
import { cn } from '#/utils/cn';
import { OptionCard } from '#/components/molecules/OptionCard';
import { DayCard } from '#/components/molecules/DayCard';
import { ActivityRow } from '#/components/molecules/ActivityRow';
import { LoadingScreen } from '#/components/organisms/LoadingScreen';
import { DateRangeField, type DateRange } from '#/components/organisms/DateRangeField';
import { HotelMapPicker, type HotelSelection } from '#/components/organisms/HotelMapPicker';
import { TimeField } from '#/components/organisms/TimeField';

export const Route = createFileRoute('/_authenticated/onboarding')({
  component: OnboardingPage,
});

// Mock definitions for missing types/constants for compilation
// In a real scenario, these would be imported.

const ALL_STEPS = [
  { id: 0, label: 'Destination', icon: File },
  { id: 1, label: 'Dates', icon: Camera },
  { id: 2, label: 'Budget', icon: File },
  { id: 3, label: 'Activities', icon: Camera },
  { id: 4, label: 'Preferences', icon: File },
  { id: 5, label: 'Review', icon: Camera },
];
const STEP_TRANSITIONS = {
  0: { next: 1 },
  1: { next: 2, prev: 0 },
  2: { next: 3, prev: 1 },
  3: { next: 4, prev: 2 },
  4: { next: 5, prev: 3 },
  5: { prev: 4 },
};

const MAX_STEPS = ALL_STEPS.length;

// Zod Schema for form data
const formSchema = z.object({
  destination: z.string().min(1, "Destination is required"),
  tripTypes: z.array(z.string()).min(1, "At least one trip type is required"),
  avoid: z.string().optional(),
  budget: z.number().min(0, "Budget must be non-negative"),
  startDate: z.date().nullable(),
  endDate: z.date().nullable(),
});

type FormData = z.infer<typeof formSchema>;

// Placeholder for prefill data that might come from route search params
const getPrefilledData = () => ({
  destination: 'Default Destination',
  nDays: 7,
  prefilledTripTypes: ['culture', 'romance'],
  budget: 1000,
});

// Dummy placeholder for Route and its component
// In a real app, this would be defined elsewhere and imported.
// For this context, we assume OnboardingPage is the component for this route.
// export const Route = createFileRoute('/_authenticated/onboarding')({});

// Mock Route object if it's not defined (e.g., running outside of TanStack Router context)


// Function component for the page
export function OnboardingPage() {
  const navigate = useNavigate();
  // Use Route.useSearch() to get search params
  const searchParams = Route.useSearch();
  const prefillFromSearch = (searchParams as any)?.prefill ?? getPrefilledData(); // Fallback to placeholder

  const activeSteps = ALL_STEPS;
  const TOTAL_STEPS = activeSteps.length;

  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState(1);

  // *** CORRECTED PART: Only one declaration for 'loading' state ***
  // This state is used to show a loading indicator during form submission.
  const [loading, setLoading] = useState(false);

  // State for form data, initialized with prefilled values or defaults.
  const [data, setData] = useState<FormData>(() => {
    let startDate: Date | undefined;
    let endDate: Date | undefined;

    const numDays = prefillFromSearch?.nDays ?? 0; // Use provided nDays or default

    if (numDays > 0) {
      const start = new Date();
      // Start date often set to a future date + 14 days as a default
      start.setDate(start.getDate() + 14);
      startDate = start;

      // End date calculated based on start date and number of days
      const end = new Date(start);
      end.setDate(end.getDate() + Math.max(0, numDays - 1)); // Ensure end date is not before start date
      endDate = end;
    }

    // Ensure tripTypes is an array, even if prefill.prefilledTripTypes is undefined or null
    const initialTripTypes = Array.isArray(prefillFromSearch?.prefilledTripTypes)
      ? prefillFromSearch.prefilledTripTypes
      : (prefillFromSearch?.tripType ? [prefillFromSearch.tripType] : []); // Handle single tripType if provided

    return {
      destination: prefillFromSearch?.destination ?? "",
      tripTypes: initialTripTypes,
      avoid: prefillFromSearch?.avoid ?? "",
      budget: prefillFromSearch?.budget ?? 0, // Default budget
      startDate,
      endDate,
    };
  });

  const handleNextStep = () => {
    setDirection(1);
    // Ensure step does not exceed the total number of active steps
    setStep(prev => Math.min(prev + 1, TOTAL_STEPS - 1));
  };

  const handlePrevStep = () => {
    setDirection(-1);
    setStep(prev => Math.max(0, prev - 1));
  };

  const handleFinish = async () => {
    setLoading(true); // Show loading indicator
    try {
      // Simulate API call or data submission
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Example of using data and possibly submitting it
      console.log('Form Data:', data);
      toast.success('Trip plan submitted!');

      // Navigate to another page after successful submission
      // navigate({ to: '/trip/$tripId', params: { tripId: 'new' } }); // Example navigation

    } catch (error) {
      console.error('Failed to submit trip plan:', error);
      toast.error('Failed to submit your trip plan. Please try again.');
    } finally {
      setLoading(false); // Hide loading indicator
    }
  };

  // Memoize the current step component for performance
  const currentStepComponent = useMemo(() => {
    // This would typically map step index to a component
    // For demonstration, placeholder components
    switch (step) {
      case 0: return <StepShell title="Where do you want to go?" description="Enter your destination" onNext={handleNextStep} onPrev={handlePrevStep} currentStep={step} totalSteps={TOTAL_STEPS}><input type="text" value={data.destination} onChange={(e) => setData(prev => ({...prev, destination: e.target.value}))} /></StepShell>;
      case 1: return <StepShell title="When will you travel?" description="Select your travel dates" onNext={handleNextStep} onPrev={handlePrevStep} currentStep={step} totalSteps={TOTAL_STEPS}><DateRangeField startDate={data.startDate} endDate={data.endDate} onDatesChange={({ startDate: newStartDate, endDate: newEndDate }) => setData(prev => ({ ...prev, startDate: newStartDate, endDate: newEndDate }))} /></StepShell>;
      case 2: return <StepShell title="What's your budget?" description="Set your approximate budget" onNext={handleNextStep} onPrev={handlePrevStep} currentStep={step} totalSteps={TOTAL_STEPS}><input type="number" value={data.budget} onChange={(e) => setData(prev => ({...prev, budget: parseInt(e.target.value, 10) || 0}))} /></StepShell>;
      case 3: return <StepShell title="What activities do you like?" description="Choose activities" onNext={handleNextStep} onPrev={handlePrevStep} currentStep={step} totalSteps={TOTAL_STEPS}><OptionCard options={data.tripTypes} onOptionSelect={(type) => setData(prev => ({ ...prev, tripTypes: [...prev.tripTypes, type] }))} /></StepShell>;
      case 4: return <StepShell title="Any preferences?" description="Tell us your preferences" onNext={handleNextStep} onPrev={handlePrevStep} currentStep={step} totalSteps={TOTAL_STEPS}><ActivityRow details={data.avoid} onChange={(e) => setData(prev => ({ ...prev, avoid: e.target.value }))} /></StepShell>;
      case 5: return <StepShell title="Review your trip" description="Confirm details before submitting" onNext={handleFinish} onPrev={handlePrevStep} currentStep={step} totalSteps={TOTAL_STEPS}>
        <div>
          <p>Destination: {data.destination}</p>
          <p>Dates: {data.startDate?.toLocaleDateString()} - {data.endDate?.toLocaleDateString()}</p>
          <p>Budget: ${data.budget}</p>
          <p>Trip Types: {data.tripTypes.join(', ')}</p>
          <p>Avoid: {data.avoid}</p>
        </div>
      </StepShell>;
      default: return <div className="text-red-500">Error: Unknown step</div>;
    }
  }, [step, data, loading]); // Include loading in dependencies if it affects JSX rendering

  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-4">
      <AnimatePresence initial={false} custom={direction} mode="wait">
        <motion.div
          key={step}
          variants={{
            enter: (direction: number) => ({
              x: direction > 0 ? 400 : -400,
              opacity: 0,
            }),
            center: { x: 0, opacity: 1 },
            exit: (direction: number) => ({
              x: direction < 0 ? 400 : -400,
              opacity: 0,
            }),
          }}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          custom={direction}
          className="w-full max-w-lg" // Max width for the step content
        >
          {currentStepComponent}
        </motion.div>
      </AnimatePresence>

      {/* Progress indicator and navigation buttons */}
      <div className="mt-8 flex justify-center items-center w-full max-w-lg">
        <div className="flex-grow flex items-center space-x-2">
          {ALL_STEPS.map((_, index) => (
            <div
              key={index}
              className={`h-2 rounded-full flex-1 transition-all duration-300 ease-in-out ${
  index <= step ? 'bg-blue-500' : 'bg-gray-300'
}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
