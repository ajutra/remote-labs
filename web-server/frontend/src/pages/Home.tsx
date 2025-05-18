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
  Key,
  Shield,
  Download,
  Globe,
} from 'lucide-react'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'

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
    {
      title: t('Profile Settings'),
      description: t('Manage your SSH keys and account settings'),
      icon: <Settings className="h-6 w-6" />,
      route: AppRoutes.USER_SETTINGS,
    },
  ]

  const guideSteps = [
    {
      title: t('Getting Started with Virtual Labs'),
      description: t('Follow these steps to begin using your virtual machines'),
      icon: <GraduationCap className="h-6 w-6" />,
      steps: [
        {
          title: t('Step 1: Add Your SSH Key'),
          description: t(
            'Generate and add your SSH key in the profile settings to access virtual machines'
          ),
          icon: <Key className="h-5 w-5" />,
        },
        {
          title: t('Step 2: Access Your Subjects'),
          description: t(
            'Navigate to the Subjects section to view your enrolled courses'
          ),
          icon: <BookMarked className="h-5 w-5" />,
        },
        {
          title: t('Step 3: Request Lab Access'),
          description: t(
            'For each subject, request access to the virtual machines you need'
          ),
          icon: <Terminal className="h-5 w-5" />,
        },
        {
          title: t('Step 4: Connect via WireGuard'),
          description: t(
            'Download and configure WireGuard to securely access your virtual machines'
          ),
          icon: <Shield className="h-5 w-5" />,
        },
      ],
    },
  ]

  const sshKeyGuide = {
    title: t('SSH Key Guide'),
    description: t('Learn how to generate SSH keys and connect to your virtual machines'),
    icon: <Key className="h-6 w-6" />,
    warning: t('Only share your PUBLIC key (.pub file). Never share your private key!'),
    sections: [
      {
        title: t('Generating SSH Keys'),
        steps: [
          {
            title: t('Linux & macOS'),
            description: t(
              'Open Terminal and run: ssh-keygen -t ed25519 -C "your_email@example.com"'
            ),
            details: t(
              'Press Enter to accept the default file location. Optionally set a passphrase for extra security.\n\nYour keys will be saved in:\n- Private key: ~/.ssh/id_ed25519\n- Public key: ~/.ssh/id_ed25519.pub\n\nNote: Only share the .pub file (public key) in your profile settings.'
            ),
            icon: <Terminal className="h-5 w-5" />,
          },
          {
            title: t('Windows'),
            description: t(
              'Use Git Bash or PowerShell and run: ssh-keygen -t ed25519 -C "your_email@example.com"'
            ),
            details: t(
              'Press Enter to accept the default file location. Optionally set a passphrase for extra security.\n\nYour keys will be saved in:\n- Private key: C:\\Users\\YourUsername\\.ssh\\id_ed25519\n- Public key: C:\\Users\\YourUsername\\.ssh\\id_ed25519.pub\n\nNote: Only share the .pub file (public key) in your profile settings.'
            ),
            icon: <Terminal className="h-5 w-5" />,
          },
        ],
      },
      {
        title: t('Connecting via SSH'),
        steps: [
          {
            title: t('Linux & macOS'),
            description: t('Open Terminal and use the following command:'),
            details: t(
              'ssh username@your-vm-ip\n\nReplace:\n- username: with your VM username\n- your-vm-ip: with the IP address provided in your VM details'
            ),
            icon: <Terminal className="h-5 w-5" />,
          },
          {
            title: t('Windows'),
            description: t('Using Git Bash or PowerShell:'),
            details: t(
              'ssh username@your-vm-ip\n\nOr using PuTTY:\n1. Download and install PuTTY\n2. Open PuTTY\n3. Enter your-vm-ip in the Host Name field\n4. Navigate to Connection > SSH > Auth\n5. Click Browse and select your private key file\n6. Click Open to connect'
            ),
            icon: <Terminal className="h-5 w-5" />,
          },
        ],
      },
    ],
  }

  const wireguardInfo = {
    title: t('WireGuard VPN'),
    description: t(
      'WireGuard is a modern, fast, and secure VPN protocol that provides encrypted access to your virtual machines'
    ),
    icon: <Shield className="h-6 w-6" />,
    downloadLink: 'https://www.wireguard.com/install/',
    features: [
      t('Fast and efficient VPN protocol'),
      t('Secure encrypted connection'),
      t('Easy to configure'),
      t('Available for all major platforms'),
    ],
    importantNotes: [
      t('Remember to disconnect from WireGuard when you finish using your virtual machines'),
      t('Your internet traffic will be routed through the VPN while connected'),
      t('You can have multiple WireGuard configurations for different virtual machines'),
      t('Keep your WireGuard configuration files secure'),
    ],
  }

  return (
    <div className="container mx-auto py-8">
      <div className="mb-12 text-center">
        <h1 className="mb-4 text-4xl font-bold">
          {t('Welcome to RemoteLabs')}
        </h1>
        <p className="text-xl text-muted-foreground">
          {t(
            'Your academic platform for remote virtual laboratories. Access your lab environments from anywhere, anytime, with a seamless experience for students and educators.'
          )}
        </p>
      </div>

      <div className="mb-12">
        <h2 className="mb-6 text-2xl font-semibold">{t('Quick Access')}</h2>
        <div className="grid gap-6 md:grid-cols-3">
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
        <h2 className="mb-6 text-2xl font-semibold">{t('Getting Started')}</h2>
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

      <div className="mb-12">
        <h2 className="mb-6 text-2xl font-semibold">{t('Essential Guides')}</h2>
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                {sshKeyGuide.icon}
              </div>
              <CardTitle>{sshKeyGuide.title}</CardTitle>
              <CardDescription>{sshKeyGuide.description}</CardDescription>
              <div className="mt-2 rounded-md bg-primary/5 p-3 text-primary">
                <p className="flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  {sshKeyGuide.warning}
                </p>
              </div>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible className="w-full">
                {sshKeyGuide.sections.map((section, sectionIndex) => (
                  <AccordionItem key={sectionIndex} value={`section-${sectionIndex}`}>
                    <AccordionTrigger className="text-lg font-semibold">
                      {section.title}
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-6">
                        {section.steps.map((step, stepIndex) => (
                          <div key={stepIndex} className="space-y-2">
                            <div className="flex items-start gap-4">
                              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/5">
                                {step.icon}
                              </div>
                              <div>
                                <h4 className="font-medium">{step.title}</h4>
                                <p className="text-muted-foreground">
                                  {step.description}
                                </p>
                                <div className="mt-2 whitespace-pre-line rounded-md bg-muted p-3">
                                  <code className="text-sm">{step.details}</code>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                {wireguardInfo.icon}
              </div>
              <CardTitle>{wireguardInfo.title}</CardTitle>
              <CardDescription>{wireguardInfo.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-6 space-y-2">
                <h4 className="font-semibold">{t('Features')}</h4>
                <ul className="space-y-2">
                  {wireguardInfo.features.map((feature, index) => (
                    <li key={index} className="flex items-center gap-2">
                      <Shield className="h-4 w-4 text-primary" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="mb-6 space-y-2">
                <h4 className="font-semibold">{t('Important Notes')}</h4>
                <ul className="space-y-2">
                  {wireguardInfo.importantNotes.map((note, index) => (
                    <li key={index} className="flex items-start gap-2 text-muted-foreground">
                      <Shield className="mt-1 h-4 w-4 text-primary" />
                      <span>{note}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <Button
                className="w-full"
                onClick={() => window.open(wireguardInfo.downloadLink, '_blank')}
              >
                <Download className="mr-2 h-4 w-4" />
                {t('Download WireGuard')}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="rounded-lg bg-primary/5 p-8 text-center">
        <Globe className="mx-auto mb-4 h-12 w-12 text-primary" />
        <h2 className="mb-4 text-2xl font-bold">
          {t('Ready to Get Started?')}
        </h2>
        <p className="mb-6 text-muted-foreground">
          {t(
            'Start by adding your SSH key and accessing your subjects to request virtual machines'
          )}
        </p>
        <div className="flex justify-center gap-4">
          <Button size="lg" onClick={() => navigate(AppRoutes.USER_SETTINGS)}>
            {t('Add SSH Key')} <Key className="ml-2 h-4 w-4" />
          </Button>
          <Button size="lg" onClick={() => navigate(AppRoutes.SUBJECTS)}>
            {t('Go to Subjects')} <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}

export default Home
