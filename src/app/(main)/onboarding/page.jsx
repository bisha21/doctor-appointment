'use client';
import useFetch from '@/app/hooks/useFetch';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { doctorFormSchema } from '@/lib/schema';
import { setUserRoles } from 'actions/onboarding';
import { Loader2, Loader2Icon, Stethoscope, User } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger,SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { SPECIALTIES } from '@/lib/specialities';
import { Textarea } from '@/components/ui/textarea';
export const Onboarding = () => {
  const [step, setStep] = useState('choose-role');
  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
  } = useForm({
    resolver: zodResolver(doctorFormSchema),
    defaultValues: {
      specialty: '',
      experience: undefined,
      credentialUrl: '',
      description: '',
    },
  });
  const {
    fn: submitUserRole,
    loading,
    error,
    setData,
    data,
  } = useFetch(setUserRoles);

  const specialtyValue = watch('specialty');

  const handlePatientSelection = async () => {
    if (loading) return;
    const formData = new FormData();
    formData.append('role', 'PATIENT');
    await submitUserRole(formData);
  };

  const onDoctorSubmit = async (data) => {
    if (loading) return;

    const formData = new FormData();
    formData.append('role', 'DOCTOR');
    formData.append('specialty', data.specialty);
    formData.append('experience', data.experience.toString());
    formData.append('credentialUrl', data.credentialUrl);
    formData.append('description', data.description);

    await submitUserRole(formData);
  };

  if (step === 'choose-role') {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card
          className="border-emerald-900/30 cursor-pointer hover:border-emerald-700/30 transition-all
    "
          onClick={() => !loading && handlePatientSelection()}
        >
          <CardContent className="py-6 flex flex-col items-center text-center">
            <div className="p-4 bg-emerald-900/20 rounded-full mb-4">
              <User className=" h-8 w-8 text-emerald-400" />
            </div>
            <CardTitle className="text-xl font-semibold text-white mb-4">
              Join as a Patient
            </CardTitle>
            <CardDescription>
              Book appointments, consult with doctors, and manage your
              healthcare journey
            </CardDescription>
          </CardContent>
          <Button
            className="bg-emerald-600 hover:bg-emerald-700 mt-2 w-full"
            disabled={loading}
            onClick={handlePatientSelection}
          >
            {loading ? (
              <>
                <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              'Contiue as Patient'
            )}
          </Button>
        </Card>
        <Card
          className="border-emerald-900/30 cursor-pointer hover:border-emerald-700/30 transition-all "
          onClick={() => !loading && setStep('doctor-form')}
        >
          <CardContent className="py-6 flex flex-col items-center text-center">
            <div className="p-4 bg-emerald-900/20 rounded-full mb-4">
              <Stethoscope className=" h-8 w-8 text-emerald-400" />
            </div>
            <CardTitle className="text-xl font-semibold text-white mb-4">
              Join as a Doctor
            </CardTitle>
            <CardDescription>
              Create your professional profile, set your availability, and
              provide consultations
            </CardDescription>
          </CardContent>
          <Button className="bg-emerald-600 hover:bg-emerald-700 mt-2 w-full">
            Join as Doctor
          </Button>
        </Card>
      </div>
    );
  }

  if (step === 'doctor-form') {
    return (
      <Card className="border-emerald-900/20">
        <CardContent className="pt-6">
          <div className="mb-6">
            <CardTitle className="text-2xl font-bold text-white mb-2">
              Complete Your Doctor Profile
            </CardTitle>
            <CardDescription>
              Please provide your professional details for verification
            </CardDescription>
          </div>

          <form onSubmit={handleSubmit(onDoctorSubmit)} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="specialty">Medical Specialty</Label>
              <Select
                value={specialtyValue}
                onValueChange={(value) => setValue('specialty', value)}
              >
                <SelectTrigger id="specialty">
                  <SelectValue placeholder="Select your specialty" />
                </SelectTrigger>
                <SelectContent>
                  {SPECIALTIES.map((spec) => (
                    <SelectItem
                      key={spec.name}
                      value={spec.name}
                      className="flex items-center gap-2"
                    >
                      <span className="text-emerald-400">{spec.icon}</span>
                      {spec.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.specialty && (
                <p className="text-sm font-medium text-red-500 mt-1">
                  {errors.specialty.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="experience">Years of Experience</Label>
              <Input
                id="experience"
                type="number"
                placeholder="e.g. 5"
                {...register('experience', { valueAsNumber: true })}
              />
              {errors.experience && (
                <p className="text-sm font-medium text-red-500 mt-1">
                  {errors.experience.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="credentialUrl">Link to Credential Document</Label>
              <Input
                id="credentialUrl"
                type="url"
                placeholder="https://example.com/my-medical-degree.pdf"
                {...register('credentialUrl')}
              />
              {errors.credentialUrl && (
                <p className="text-sm font-medium text-red-500 mt-1">
                  {errors.credentialUrl.message}
                </p>
              )}
              <p className="text-sm text-muted-foreground">
                Please provide a link to your medical degree or certification
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description of Your Services</Label>
              <Textarea
                id="description"
                placeholder="Describe your expertise, services, and approach to patient care..."
                rows="4"
                {...register('description')}
              />
              {errors.description && (
                <p className="text-sm font-medium text-red-500 mt-1">
                  {errors.description.message}
                </p>
              )}
            </div>

            <div className="pt-2 flex items-center justify-between">
              <Button
                type="button"
                variant="outline"
                onClick={() => setStep('choose-role')}
                className="border-emerald-900/30"
                disabled={loading}
              >
                Back
              </Button>
              <Button
                type="submit"
                className="bg-emerald-600 hover:bg-emerald-700"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  'Submit for Verification'
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    );
  }
};

export default Onboarding;
