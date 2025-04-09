import { useTranslation } from 'react-i18next'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { AppRoutes } from '@/enums/AppRoutes'
import { useNavigate } from 'react-router-dom'
import useUserRole from '@/hooks/useUserRole'
import {
  GraduationCap,
  BookOpen,
  Laptop,
  Settings,
  ChevronRight,
  ArrowRight,
  BookMarked,
  Users,
  Terminal,
} from 'lucide-react'
import { ScrollArea } from '@/components/ui/scroll-area'

function Home() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const isAdmin = useUserRole()

  const features = [
    {
      title: t('Subjects'),
      description: t(
        'View your subjects and request access to virtual machines'
      ),
      icon: <BookOpen className="h-6 w-6" />,
      route: AppRoutes.SUBJECTS,
    },
    {
      title: t('My Labs'),
      description: t('Manage your virtual machines and lab environments'),
      icon: <Laptop className="h-6 w-6" />,
      route: AppRoutes.MYLABS,
    },
  ]

  const guideSteps = [
    {
      title: t('Getting Started with Virtual Labs'),
      description: t('Follow these steps to begin using your virtual machines'),
      icon: <GraduationCap className="h-6 w-6" />,
      steps: [
        {
          title: t('Step 1: Access Your Subjects'),
          description: t(
            'Navigate to the Subjects section to view your enrolled courses'
          ),
          icon: <BookMarked className="h-5 w-5" />,
        },
        {
          title: t('Step 2: Request Lab Access'),
          description: t(
            'For each subject, request access to the virtual machines you need'
          ),
          icon: <Terminal className="h-5 w-5" />,
        },
        {
          title: t('Step 3: Wait for Approval'),
          description: t(
            'Your professor will review and approve your access request'
          ),
          icon: <Users className="h-5 w-5" />,
        },
        {
          title: t('Step 4: Access Your Labs'),
          description: t(
            'Once approved, manage your virtual machines in the My Labs section'
          ),
          icon: <Laptop className="h-5 w-5" />,
        },
      ],
    },
    {
      title: t('Managing Your Virtual Machines'),
      description: t('Learn how to effectively use your virtual machines'),
      icon: <Laptop className="h-6 w-6" />,
      steps: [
        {
          title: t('Connecting to Your VM'),
          description: t(
            'Use the provided configuration to connect to your virtual machine'
          ),
          icon: <Terminal className="h-5 w-5" />,
        },
        {
          title: t('Saving Your Work'),
          description: t(
            'Regularly save your work and use the provided storage space'
          ),
          icon: <BookMarked className="h-5 w-5" />,
        },
        {
          title: t('Collaborating with Classmates'),
          description: t('Share your progress and work together on projects'),
          icon: <Users className="h-5 w-5" />,
        },
      ],
    },
  ]

  return (
    <div className="container mx-auto py-8">
      <div className="mb-12 text-center">
        <h1 className="mb-4 text-4xl font-bold">
          {t('Welcome to Remote VMs')}
        </h1>
        <p className="text-xl text-muted-foreground">
          {t(
            'Your platform for managing virtual machines and lab environments'
          )}
        </p>
      </div>

      <div className="mb-12">
        <h2 className="mb-6 text-2xl font-semibold">{t('Quick Access')}</h2>
        <div className="grid gap-6 md:grid-cols-2">
          {features.map((feature) => (
            <Card
              key={feature.title}
              className="group cursor-pointer transition-all hover:shadow-lg"
              onClick={() => navigate(feature.route)}
            >
              <CardHeader>
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 group-hover:bg-primary/20">
                  {feature.icon}
                </div>
                <CardTitle>{feature.title}</CardTitle>
                <CardDescription>{feature.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <Button className="w-full" variant="outline">
                  {t('Access')} <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <div className="mb-12">
        <h2 className="mb-6 text-2xl font-semibold">{t('User Guide')}</h2>
        <ScrollArea className="h-[500px] rounded-md border p-4">
          <div className="space-y-12">
            {guideSteps.map((section, index) => (
              <div key={index} className="space-y-6">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                    {section.icon}
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold">{section.title}</h3>
                    <p className="text-muted-foreground">
                      {section.description}
                    </p>
                  </div>
                </div>
                <div className="ml-16 space-y-6">
                  {section.steps.map((step, stepIndex) => (
                    <div key={stepIndex} className="flex items-start gap-4">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/5">
                        {step.icon}
                      </div>
                      <div>
                        <h4 className="font-medium">{step.title}</h4>
                        <p className="text-muted-foreground">
                          {step.description}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </div>

      <div className="rounded-lg bg-primary/5 p-8 text-center">
        <GraduationCap className="mx-auto mb-4 h-12 w-12 text-primary" />
        <h2 className="mb-4 text-2xl font-bold">
          {t('Ready to Get Started?')}
        </h2>
        <p className="mb-6 text-muted-foreground">
          {t(
            'Start by accessing your subjects and requesting your virtual machines'
          )}
        </p>
        <Button size="lg" onClick={() => navigate(AppRoutes.SUBJECTS)}>
          {t('Go to Subjects')} <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}

export default Home
