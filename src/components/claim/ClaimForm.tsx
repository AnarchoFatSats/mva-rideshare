"use client";

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { motion, AnimatePresence } from 'framer-motion';
import Step1BasicInfo from './steps/Step1BasicInfo';
import Step2Involvement from './steps/Step2Involvement';
import Step3Qualification from './steps/Step3Qualification';
import Step4Processing from './steps/Step4Processing';
import Step5Final from './steps/Step5Final';

// Define the schema for all steps
const claimSchema = z.object({
  // Step 1: Basic contact information
  firstName: z.string().min(2, { message: 'First name is required' }),
  lastName: z.string().min(2, { message: 'Last name is required' }),
  phone: z.string()
    .min(10, { message: 'Phone number must be at least 10 digits' })
    .transform(val => val.replace(/\D/g, '')) // Remove non-digit characters
    .refine(val => val.length >= 10 && val.length <= 15, {
      message: 'Phone number must be between 10 and 15 digits'
    }),
  email: z.string().email({ message: 'Valid email is required' }),
  
  // Step 2: Accident involvement
  role: z.enum(['passenger', 'guest', 'otherVehicle', 'driver', 'other_vehicle'], { 
    required_error: 'Please select your role in the accident'
  }),
  rideshareUserInfo: z.string().optional(),
  
  // Step 3: Legal qualification
  filedComplaint: z.boolean().optional(),
  rideshareCompany: z.enum(['uber', 'lyft'], { 
    required_error: 'Please select the rideshare company'
  }),
  hasPoliceReport: z.boolean().optional(),
});

export type ClaimFormData = z.infer<typeof claimSchema>;

export default function ClaimForm() {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<Partial<ClaimFormData>>({});
  const [isRejected, setIsRejected] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const totalSteps = 5;

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    getValues,
    reset,
    trigger,
    watch,
  } = useForm<ClaimFormData>({
    resolver: zodResolver(claimSchema),
    defaultValues: formData,
  });

  // Watch for changes to the role field
  const role = watch('role');
  const filedComplaint = watch('filedComplaint');
  const hasPoliceReport = watch('hasPoliceReport');

  // Clear errors when switching steps
  useEffect(() => {
    console.log('Current step changed to:', currentStep);
    // Clear any field errors that might be stale
    if (currentStep === 2) {
      // When entering step 2, make sure we clear any previous validation errors
      setValue('role', getValues('role'), { shouldValidate: false });
      setValue('rideshareUserInfo', getValues('rideshareUserInfo') || '', { shouldValidate: false });
    }
  }, [currentStep, setValue, getValues]);

  // Load saved contact data from localStorage on initial render
  useEffect(() => {
    const savedContactData = localStorage.getItem('contactFormData');
    if (savedContactData) {
      try {
        const parsedData = JSON.parse(savedContactData) as Partial<ClaimFormData>;
        Object.entries(parsedData).forEach(([key, value]) => {
          setValue(key as keyof ClaimFormData, value);
        });
        setFormData(prev => ({ ...prev, ...parsedData }));
        // If we have contact data, we can skip to step 2
        if (parsedData.firstName && parsedData.lastName && parsedData.phone && parsedData.email) {
          setCurrentStep(2);
        }
      } catch (e) {
        console.error('Error parsing saved contact data:', e);
      }
    }
  }, [setValue]);

  // Handle form submission for the current step
  const onSubmit = async (data: ClaimFormData) => {
    try {
      switch (currentStep) {
        case 1:
          // Validate step 1 fields
          const isFirstNameValid = data.firstName && data.firstName.length >= 2;
          const isLastNameValid = data.lastName && data.lastName.length >= 2;
          const isPhoneValid = data.phone && data.phone.replace(/\D/g, '').length >= 10;
          const isEmailValid = data.email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email);
          
          if (!isFirstNameValid || !isLastNameValid || !isPhoneValid || !isEmailValid) {
            // Show validation errors
            await trigger(['firstName', 'lastName', 'phone', 'email']);
            return;
          }
          
          // Save contact data to localStorage
          localStorage.setItem('contactFormData', JSON.stringify({
            firstName: data.firstName,
            lastName: data.lastName,
            phone: data.phone,
            email: data.email,
          }));
          
          // Proceed to next step
          setFormData(prev => ({ ...prev, ...data }));
          setCurrentStep(2);
          break;
          
        case 2:
          // Validate step 2 fields
          if (!data.role) {
            await trigger('role');
            return;
          }
          
          // For guest role, validate guest info
          if (data.role === 'guest') {
            if (!data.rideshareUserInfo || data.rideshareUserInfo.trim() === '') {
              await trigger('rideshareUserInfo');
              return;
            }
          }
          
          // Update form data and proceed to next step
          setFormData(prev => ({ ...prev, ...data }));
          setCurrentStep(3);
          break;
          
        case 3:
          // Validate step 3 fields
          const noComplaint = !data.filedComplaint;
          const noPoliceReport = !data.hasPoliceReport;
          
          if (noComplaint && noPoliceReport) {
            setIsRejected(true);
            setRejectionReason('To process a rideshare claim, there must be either a rideshare report or a police report.');
            return;
          }
          
          // Process the form (simulate API call)
          setFormData(prev => ({ ...prev, ...data }));
          setCurrentStep(4);
          setIsLoading(true);
          
          // Simulate processing time
          setTimeout(() => {
            setIsLoading(false);
            setCurrentStep(5);
          }, 5000);
          break;
          
        default:
          // Final step, do nothing
          break;
      }
    } catch (error) {
      console.error('Error in form submission:', error);
    }
  };

  // Go back to the previous step
  const goBack = () => {
    setCurrentStep(prevStep => Math.max(1, prevStep - 1));
  };

  // Calculate progress percentage
  const progress = ((currentStep - 1) / (totalSteps - 1)) * 100;

  return (
    <div className="max-w-3xl mx-auto">
      {/* Progress bar */}
      <div className="mb-8">
        <div className="bg-gray-200 h-2 rounded-full overflow-hidden">
          <motion.div
            className="bg-primary-600 h-full"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>
        <div className="flex justify-between mt-2 text-sm text-gray-600">
          <span>Start</span>
          <span>Processing</span>
          <span>Complete</span>
        </div>
      </div>

      {/* Step indicators */}
      <div className="flex justify-center mb-8">
        {Array.from({ length: totalSteps }).map((_, index) => (
          <div key={index} className="flex items-center">
            <div 
              className={`${
                index + 1 === currentStep
                  ? 'step-indicator-active'
                  : index + 1 < currentStep
                  ? 'bg-primary-600 text-white'
                  : 'step-indicator'
              } transition-colors duration-300`}
            >
              {index + 1}
            </div>
            {index < totalSteps - 1 && (
              <div 
                className={`h-1 w-10 mx-1 ${
                  index + 1 < currentStep ? 'bg-primary-600' : 'bg-gray-300'
                }`}
              />
            )}
          </div>
        ))}
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            {/* Step 1: Basic Info */}
            {currentStep === 1 && (
              <Step1BasicInfo 
                register={register} 
                errors={errors} 
              />
            )}

            {/* Step 2: Involvement */}
            {currentStep === 2 && (
              <Step2Involvement 
                register={register} 
                errors={errors} 
                watch={watch}
                setValue={setValue}
                trigger={trigger}
              />
            )}

            {/* Step 3: Qualification */}
            {currentStep === 3 && (
              <Step3Qualification 
                register={register} 
                errors={errors} 
                isRejected={isRejected}
                rejectionReason={rejectionReason}
              />
            )}

            {/* Step 4: Processing */}
            {currentStep === 4 && (
              <Step4Processing 
                isLoading={isLoading}
              />
            )}

            {/* Step 5: Final CTA */}
            {currentStep === 5 && (
              <Step5Final />
            )}
          </motion.div>
        </AnimatePresence>

        {/* Navigation buttons */}
        {currentStep < 4 && !isRejected && (
          <div className="flex justify-between mt-8">
            {currentStep > 1 ? (
              <button
                type="button"
                onClick={goBack}
                className="btn-outline"
              >
                Back
              </button>
            ) : (
              <div />
            )}
            <button
              type="submit"
              className="btn-primary"
            >
              {currentStep === 3 ? 'Submit' : 'Continue'}
            </button>
          </div>
        )}

        {isRejected && (
          <div className="flex justify-center mt-8">
            <a
              href="tel:8885555555"
              className="btn-primary"
            >
              Need Help? Contact us for other legal options
            </a>
          </div>
        )}
      </form>
    </div>
  );
} 