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
  role: z.enum(['passenger', 'guest', 'otherVehicle'], { 
    required_error: 'Please select your role in the accident'
  }),
  rideshareUserInfo: z.string().optional(),
  
  // Step 3: Legal qualification
  filedComplaint: z.boolean().optional()
    .transform(val => val === true), // Ensure it's a true boolean
  rideshareCompany: z.enum(['uber', 'lyft'], { 
    required_error: 'Please select the rideshare company'
  }),
  hasPoliceReport: z.boolean().optional()
    .transform(val => val === true), // Ensure it's a true boolean
  accidentDate: z.string().min(1, { message: 'Accident date is required' }),
  wasAmbulanceCalled: z.boolean().optional()
    .transform(val => val === true),
  receivedMedicalTreatment48Hours: z.boolean().optional()
    .transform(val => val === true),
  receivedMedicalTreatment7Days: z.boolean().optional()
    .transform(val => val === true),
});

export type ClaimFormData = z.infer<typeof claimSchema>;

export default function ClaimForm() {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<Partial<ClaimFormData>>({});
  const [isRejected, setIsRejected] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const totalSteps = 5;

  const {
    register,
    handleSubmit,
    formState: { errors, isValid, isSubmitting },
    setValue,
    getValues,
    reset,
    trigger,
    watch,
    clearErrors,
  } = useForm<ClaimFormData>({
    resolver: zodResolver(claimSchema),
    defaultValues: formData,
    mode: 'onChange'
  });

  // Watch for changes to key fields
  const role = watch('role');
  const filedComplaint = watch('filedComplaint');
  const hasPoliceReport = watch('hasPoliceReport');
  const receivedMedicalTreatment48Hours = watch('receivedMedicalTreatment48Hours');
  const receivedMedicalTreatment7Days = watch('receivedMedicalTreatment7Days');

  // Clear errors when switching steps
  useEffect(() => {
    console.log('Current step changed to:', currentStep);
    // Reset form error when changing steps
    setFormError(null);
    
    if (currentStep === 2) {
      clearErrors('role');
    }
  }, [currentStep, clearErrors]);

  // Load saved contact data from localStorage on initial render
  useEffect(() => {
    const savedContactData = localStorage.getItem('contactFormData');
    if (savedContactData) {
      try {
        const parsedData = JSON.parse(savedContactData) as Partial<ClaimFormData>;
        
        // Ensure we're setting all fields correctly
        if (parsedData) {
          console.log("Found saved contact data:", parsedData);
          
          // Set each field individually to ensure proper validation
          if (parsedData.firstName) setValue('firstName', parsedData.firstName);
          if (parsedData.lastName) setValue('lastName', parsedData.lastName);
          if (parsedData.phone) setValue('phone', parsedData.phone);
          if (parsedData.email) setValue('email', parsedData.email);
          
          setFormData(prev => ({ ...prev, ...parsedData }));
          
          // If we have complete contact data, skip to step 2
          if (parsedData.firstName && parsedData.lastName && 
              parsedData.phone && parsedData.email) {
            console.log("Skipping to step 2 with complete contact data");
            setCurrentStep(2);
          }
        }
      } catch (e) {
        console.error('Error parsing saved contact data:', e);
      }
    }
  }, [setValue]);

  // Validate current step fields
  const validateCurrentStep = async () => {
    console.log(`Validating step ${currentStep}`);
    switch (currentStep) {
      case 1:
        return await trigger(['firstName', 'lastName', 'phone', 'email']);
      case 2:
        // For step 2, validate both role and rideshareUserInfo if role is 'guest'
        if (role === 'guest') {
          const roleValid = await trigger('role');
          const userInfoValid = await trigger('rideshareUserInfo');
          return roleValid && userInfoValid;
        }
        return await trigger('role');
      case 3:
        // Update to include validation for new fields
        return await trigger(['rideshareCompany', 'accidentDate', 'wasAmbulanceCalled', 'receivedMedicalTreatment48Hours']);
      default:
        return true;
    }
  };

  // Handle step navigation
  const handleNextStep = async () => {
    console.log(`Attempting to move from step ${currentStep} to next step`);
    
    // Log all form values for debugging
    const allValues = getValues();
    console.log('Current form values:', allValues);
    
    const isStepValid = await validateCurrentStep();
    console.log(`Step ${currentStep} validation result:`, isStepValid);
    
    if (!isStepValid) {
      console.error("Current step validation failed");
      setFormError("Please correct the errors before continuing.");
      return;
    }

    // Get current role value
    const currentRole = getValues('role');
    console.log(`Current role value: ${currentRole}`);

    if (currentStep === 2 && !currentRole) {
      console.error("No role selected, cannot proceed");
      setFormError("Please select your role in the accident.");
      return;
    }

    if (currentStep === 2 && currentRole === 'guest') {
      const guestInfo = getValues('rideshareUserInfo');
      console.log('Guest info value:', guestInfo);
      
      if (!guestInfo || guestInfo.trim() === '') {
        console.error("Guest info required but missing");
        setFormError("Please provide information about the rideshare user.");
        return;
      }
    }

    // Log current state before advancing
    console.log(`Form is valid, proceeding from step ${currentStep} to ${currentStep + 1}`);

    // Special handling for step 3
    if (currentStep === 3) {
      const noComplaint = !filedComplaint;
      const noPoliceReport = !hasPoliceReport;
      
      console.log(`Filed complaint: ${filedComplaint}, Has police report: ${hasPoliceReport}`);
      
      if (noComplaint && noPoliceReport) {
        setIsRejected(true);
        setRejectionReason('To process a rideshare claim, there must be either a rideshare report or a police report.');
        return;
      }
      
      // Process the form (simulate API call)
      setIsLoading(true);
      
      // Simulate processing time
      setTimeout(() => {
        setIsLoading(false);
        setCurrentStep(5);
      }, 5000);
      
      setCurrentStep(4);
      return;
    }

    // Save form data and move to next step
    const formValues = getValues();
    console.log(`Moving to step ${currentStep + 1} with data:`, formValues);
    setFormData(prev => ({ ...prev, ...formValues }));
    
    // Actually advance the step
    setCurrentStep(prev => {
      console.log(`Changing step from ${prev} to ${prev + 1}`);
      return prev + 1;
    });

    console.log(`Step should now be ${currentStep + 1}`);
  };

  // Add a direct form submission handler for step 2
  const submitStep2 = async () => {
    console.log("Direct submission for step 2");
    
    // Get form values
    const formValues = getValues();
    console.log("Form values for step 2:", formValues);
    
    // Make sure we have a role selected
    if (!formValues.role) {
      console.error("No role selected for step 2");
      setFormError("Please select your role in the accident.");
      return;
    }
    
    // Special handling for guest role
    if (formValues.role === 'guest' && (!formValues.rideshareUserInfo || formValues.rideshareUserInfo.trim() === '')) {
      console.error("Guest info required but missing");
      setFormError("Please provide information about the rideshare user.");
      return;
    }
    
    // Save form data
    setFormData(prev => ({ ...prev, ...formValues }));
    console.log("Advancing to step 3");
    
    // Advance to next step
    setCurrentStep(3);
  };

  // Add a direct form submission handler for step 3
  const submitStep3 = async () => {
    console.log("Direct submission for step 3");
    
    // Get form values
    const formValues = getValues();
    console.log("Form values for step 3:", formValues);
    
    // Make sure we have a rideshare company selected
    if (!formValues.rideshareCompany) {
      console.error("No rideshare company selected for step 3");
      setFormError("Please select whether you were in an Uber or Lyft.");
      return;
    }
    
    // Check if accident date is provided
    if (!formValues.accidentDate) {
      console.error("No accident date provided");
      setFormError("Please provide the date when the accident occurred.");
      return;
    }
    
    // Check if either complaint or police report is true
    const hasComplaint = formValues.filedComplaint === true;
    const hasReport = formValues.hasPoliceReport === true;
    
    console.log(`Complaint: ${hasComplaint}, Police report: ${hasReport}`);
    
    if (!hasComplaint && !hasReport) {
      console.error("Neither complaint nor police report is present");
      setIsRejected(true);
      setRejectionReason('To process a rideshare claim, there must be either a rideshare report or a police report.');
      return;
    }
    
    // Check for medical treatment
    const hadMedicalTreatment48Hours = formValues.receivedMedicalTreatment48Hours === true;
    const hadMedicalTreatment7Days = formValues.receivedMedicalTreatment7Days === true;
    
    // If they didn't receive treatment within 48 hours and we don't have info about 7 days
    if (!hadMedicalTreatment48Hours && formValues.receivedMedicalTreatment7Days === undefined) {
      console.error("Missing information about medical treatment within 7 days");
      setFormError("Please indicate if you received medical treatment within 7 days of the accident.");
      return;
    }
    
    // If neither medical treatment option is selected, reject the claim
    if (!hadMedicalTreatment48Hours && !hadMedicalTreatment7Days) {
      console.error("No medical treatment received");
      setIsRejected(true);
      setRejectionReason('To process a rideshare injury claim, you must have received medical treatment within 7 days of the accident.');
      return;
    }
    
    // Save form data
    setFormData(prev => ({ ...prev, ...formValues }));
    console.log("Form is valid, proceeding to processing");
    
    // Process the form (simulate API call)
    setIsLoading(true);
    setCurrentStep(4);
    
    // Simulate processing time
    setTimeout(() => {
      setIsLoading(false);
      setCurrentStep(5);
    }, 5000);
  };

  // Handle the form submission
  const onSubmit = async (data: ClaimFormData) => {
    try {
      console.log(`Form submitted with data:`, data);
      await handleNextStep();
    } catch (error) {
      console.error('Error in form submission:', error);
      setFormError("There was a problem submitting the form. Please try again.");
    }
  };

  // Go back to the previous step
  const goBack = () => {
    setCurrentStep(prevStep => Math.max(1, prevStep - 1));
    setFormError(null);
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

      {/* Form error message */}
      {formError && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-md">
          {formError}
        </div>
      )}

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
                watch={watch}
                setValue={setValue}
                trigger={trigger}
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
                disabled={isSubmitting}
              >
                Back
              </button>
            ) : (
              <div />
            )}
            
            {/* Special handling for step 2 */}
            {currentStep === 2 ? (
              <button
                type="button"
                onClick={submitStep2}
                className="btn-primary relative"
                disabled={isSubmitting}
              >
                Continue
              </button>
            ) : currentStep === 3 ? (
              <button
                type="button"
                onClick={submitStep3}
                className="btn-primary relative"
                disabled={isSubmitting}
              >
                Submit
              </button>
            ) : (
              <button
                type="submit"
                className="btn-primary relative"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Processing...
                  </span>
                ) : (
                  'Continue'
                )}
              </button>
            )}
          </div>
        )}

        {isRejected && (
          <div className="flex justify-center mt-8">
            <a
              href="tel:8885555555"
              className="btn-primary"
            >
              <div className="flex items-center justify-center">
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                  <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                </svg>
                Please Click to Call a Case Manager Now
              </div>
            </a>
          </div>
        )}
      </form>
    </div>
  );
} 