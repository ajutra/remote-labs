import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import useUserRole from '@/hooks/useUserRole';

interface Tutorial {
  id: string;
  title: string;
  description: string;
  videoUrl: string;
  category: 'technical' | 'academic';
}

// Helper function to convert YouTube watch URLs to embed URLs
const getEmbedUrl = (watchUrl: string): string => {
  const videoId = watchUrl.split('v=')[1]?.split('&')[0];
  return videoId ? `https://www.youtube.com/embed/${videoId}?modestbranding=1&rel=0&origin=${window.location.origin}` : '';
};

const tutorials: Tutorial[] = [
  {
    id: '1',
    title: 'Wireguard Configuration',
    description: 'Learn how to configure and use Wireguard for secure VPN connections.',
    videoUrl: 'https://www.youtube.com/watch?v=hD3Zx0_Iw1A',
    category: 'technical'
  },
  {
    id: '2',
    title: 'SSH Connection',
    description: 'Step-by-step guide to connect to servers using SSH.',
    videoUrl: 'https://www.youtube.com/watch?v=hD3Zx0_Iw1A',
    category: 'technical'
  },
  {
    id: '3',
    title: 'Graphical Server Setup',
    description: 'How to set up and configure a graphical server on your machine.',
    videoUrl: 'https://www.youtube.com/watch?v=hD3Zx0_Iw1A',
    category: 'technical'
  },
  {
    id: '4',
    title: 'Subject Management',
    description: 'Learn how to create and manage subjects in the platform.',
    videoUrl: 'https://www.youtube.com/watch?v=hD3Zx0_Iw1A',
    category: 'academic'
  },
  {
    id: '5',
    title: 'Student Enrollment',
    description: 'Guide for professors on how to enroll students in subjects.',
    videoUrl: 'https://www.youtube.com/watch?v=hD3Zx0_Iw1A',
    category: 'academic'
  },
  {
    id: '6',
    title: 'Virtual Machine Templates',
    description: 'How to create and manage virtual machine templates for your subjects.',
    videoUrl: 'https://www.youtube.com/watch?v=hD3Zx0_Iw1A',
    category: 'academic'
  }
];

const Tutorials: React.FC = () => {
  const isProfessorOrAdmin = useUserRole();
  
  // Filter tutorials based on user role
  const filteredTutorials = tutorials.filter(tutorial => 
    tutorial.category === 'technical' || (tutorial.category === 'academic' && isProfessorOrAdmin)
  );

  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Tutorials and Guides</h1>
        <p className="text-muted-foreground">
          Learn how to use RemoteLabs platform with our step-by-step video guides.
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTutorials.map(tutorial => (
          <Card key={tutorial.id} className="hover:shadow-lg transition-shadow flex flex-col">
            <CardHeader className="flex-none">
              <div className="flex items-center gap-2">
                <span className={`px-2 py-1 text-xs rounded-full ${
                  tutorial.category === 'technical' 
                    ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                    : 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
                }`}>
                  {tutorial.category}
                </span>
              </div>
              <CardTitle className="mt-2 line-clamp-2">{tutorial.title}</CardTitle>
              <CardDescription className="line-clamp-2">{tutorial.description}</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 flex items-center">
              <div className="aspect-video bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center w-full">
                {tutorial.videoUrl ? (
                  <iframe
                    src={getEmbedUrl(tutorial.videoUrl)}
                    className="w-full h-full rounded-lg"
                    title={tutorial.title}
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    loading="lazy"
                    referrerPolicy="origin"
                  />
                ) : (
                  <p className="text-gray-500 dark:text-gray-400">Video not available</p>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default Tutorials; 