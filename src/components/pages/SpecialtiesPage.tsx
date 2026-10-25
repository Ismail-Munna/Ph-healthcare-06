import React from 'react';
import {
  Heart,
  Brain,
  Activity,
  Baby,
  Bone,
  Eye,
  ShieldCheck,
  ChevronRight,
  ArrowRight,
  Sparkles,
} from 'lucide-react';

interface SpecialtiesPageProps {
  onSelectSpecialty: (specialty: string) => void;
  onNavigateDoctors: () => void;
}

export const SpecialtiesPage: React.FC<SpecialtiesPageProps> = ({
  onSelectSpecialty,
  onNavigateDoctors,
}) => {
  const specialties = [
    {
      id: 'cardiology',
      name: 'Cardiology & Cardiovascular Care',
      tag: 'Cardiology',
      icon: <Heart className="w-6 h-6 text-red-500" />,
      description:
        'Comprehensive clinical evaluation for hypertension, coronary disease, palpitations, cholesterol management, and preventive heart care.',
      symptoms: ['Chest tight or pressure', 'Shortness of breath', 'High blood pressure', 'Irregular heart beats'],
      leadDoctor: 'Dr. Sarah Jenkins, MD (Cardiologist)',
      consultationFee: '$50',
    },
    {
      id: 'internal',
      name: 'Internal Medicine & Geriatrics',
      tag: 'Internal Medicine',
      icon: <Activity className="w-6 h-6 text-teal-600" />,
      description:
        'Management of chronic adult diseases, diabetes mellitus, infectious illnesses, digestive issues, and geriatric health wellness.',
      symptoms: ['Unexplained fatigue', 'High blood sugar / Diabetes', 'Persistent fever', 'Digestive issues'],
      leadDoctor: 'Dr. Arthur J. Finn, MD (FACP)',
      consultationFee: '$45',
    },
    {
      id: 'neurology',
      name: 'Neurology & Brain Health',
      tag: 'Neurology',
      icon: <Brain className="w-6 h-6 text-purple-600" />,
      description:
        'Specialized telehealth consults for persistent migraines, neuropathies, numbness, sleep disorders, and cognitive symptoms.',
      symptoms: ['Chronic migraines & headaches', 'Numbness or tingling', 'Dizziness / Vertigo', 'Tremors'],
      leadDoctor: 'Dr. Emily Chen, MBBS (Neurologist)',
      consultationFee: '$60',
    },
    {
      id: 'pediatrics',
      name: 'Pediatrics & Adolescent Care',
      tag: 'Pediatrics',
      icon: <Baby className="w-6 h-6 text-amber-500" />,
      description:
        'Virtual consultations for infant feeding, childhood infections, allergies, vaccination advice, and developmental milestones.',
      symptoms: ['Child fever & cold', 'Skin rashes & allergies', 'Ear infections', 'Growth checkups'],
      leadDoctor: 'Dr. Marcus Vance, MD (Pediatrician)',
      consultationFee: '$40',
    },
    {
      id: 'orthopedics',
      name: 'Orthopedics & Joint Health',
      tag: 'Orthopedics',
      icon: <Bone className="w-6 h-6 text-blue-600" />,
      description:
        'Evaluation of joint pain, back strain, sports injuries, arthritis management, and post-surgery rehabilitation advice.',
      symptoms: ['Joint swelling & pain', 'Lower back stiffness', 'Sports sprains', 'Osteoarthritis'],
      leadDoctor: 'Dr. Elena Rostova, MD (Orthopedic Spec.)',
      consultationFee: '$55',
    },
    {
      id: 'preventive',
      name: 'Preventive Medicine & Lifestyle',
      tag: 'Preventive',
      icon: <ShieldCheck className="w-6 h-6 text-emerald-600" />,
      description:
        'Annual wellness screenings, diet and lifestyle counseling, smoking cessation, and metabolic risk assessments.',
      symptoms: ['Annual wellness checkup', 'Weight management', 'Lipid screening review', 'Stress & sleep'],
      leadDoctor: 'Dr. Sarah Jenkins, MD',
      consultationFee: '$45',
    },
  ];

  return (
    <div className="space-y-12 py-4">
      {/* Header Banner */}
      <div className="relative rounded-3xl bg-slate-900 text-white p-8 lg:p-12 overflow-hidden border border-slate-800">
        <div className="max-w-2xl space-y-3 relative z-10">
          <div className="flex items-center gap-2 text-teal-400 text-xs font-semibold uppercase tracking-wider">
            <Sparkles className="w-4 h-4" />
            <span>Specialized Clinical Departments</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
            Comprehensive Medical Specialties Available Online
          </h1>
          <p className="text-sm text-slate-300 leading-relaxed">
            Our network comprises board-certified specialists across critical disciplines. Choose a department below to review symptoms and connect with an active physician today.
          </p>
        </div>
      </div>

      {/* Specialties Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {specialties.map((item) => (
          <div
            key={item.id}
            className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs flex flex-col justify-between space-y-5 hover:border-teal-500 hover:shadow-md transition-all"
          >
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center">
                {item.icon}
              </div>

              <div>
                <h3 className="text-base font-bold text-slate-900">{item.name}</h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">{item.description}</p>
              </div>

              {/* Symptoms tags */}
              <div className="space-y-1.5 pt-2">
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                  Common Symptoms Treated:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {item.symptoms.map((s) => (
                    <span
                      key={s}
                      className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[11px]"
                    >
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
              <div>
                <span className="text-[11px] text-slate-400 block">Consultation Fee</span>
                <span className="font-mono font-bold text-slate-900 text-sm">{item.consultationFee} / 20 min</span>
              </div>

              <button
                onClick={() => {
                  onSelectSpecialty(item.tag);
                  onNavigateDoctors();
                }}
                className="px-3.5 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors"
              >
                <span>Find Doctors</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
