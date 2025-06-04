import React from 'react';
import { Mail, GraduationCap, Users, Lightbulb, Globe, Code, Building2, BookOpen, ExternalLink } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

const AboutUs: React.FC = () => {
  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex flex-col items-center space-y-2 text-center">
        <h1 className="text-3xl font-bold tracking-tight">About RemoteLabs</h1>
        <p className="text-muted-foreground">Empowering Education Through Virtual Labs</p>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="mt-2">
            <Building2 className="mr-2 h-4 w-4" />
            TecnoCampus Mataró
          </Badge>
          <Button variant="ghost" size="sm" asChild>
            <a 
              href="https://www.tecnocampus.cat/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center gap-1"
            >
              Visit Website
              <ExternalLink className="h-3 w-3" />
            </a>
          </Button>
        </div>
      </div>

      <Separator />

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <GraduationCap className="h-5 w-5" />
              Our Story
            </CardTitle>
            <CardDescription>Born from Innovation and Education</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              RemoteLabs was born from two final degree projects (TFG) developed by Computer Engineering students at TecnoCampus Mataró, a leading institution in technology and innovation education. Our platform bridges the gap between theoretical knowledge and hands-on experience, making virtual labs accessible to everyone regardless of their device capabilities.
            </p>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <BookOpen className="h-4 w-4" />
              <span>Final Degree Projects in Computer Engineering</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lightbulb className="h-5 w-5" />
              Our Vision
            </CardTitle>
            <CardDescription>Transforming Education Through Technology</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              We believe in creating equal opportunities for all students and educators. By providing an automated remote laboratory service, we eliminate the barriers of hardware limitations and geographical constraints, ensuring that quality education is accessible to all.
            </p>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Globe className="h-4 w-4" />
              <span>Making Education Accessible Worldwide</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Code className="h-5 w-5" />
            Our Mission
          </CardTitle>
          <CardDescription>Empowering Educational Institutions</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            Our mission is to transform educational institutions by providing an automated, self-managed remote laboratory service. We aim to enhance the learning experience by offering:
          </p>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="flex items-start gap-2">
              <div className="mt-1 rounded-full bg-primary/10 p-1">
                <Users className="h-4 w-4 text-primary" />
              </div>
              <div>
                <h4 className="font-medium">Equal Access</h4>
                <p className="text-sm text-muted-foreground">Ensuring all students have the same learning opportunities</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <div className="mt-1 rounded-full bg-primary/10 p-1">
                <Code className="h-4 w-4 text-primary" />
              </div>
              <div>
                <h4 className="font-medium">Virtual Labs</h4>
                <p className="text-sm text-muted-foreground">Seamless access to practical learning environments</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <div className="mt-1 rounded-full bg-primary/10 p-1">
                <Building2 className="h-4 w-4 text-primary" />
              </div>
              <div>
                <h4 className="font-medium">Institutional Support</h4>
                <p className="text-sm text-muted-foreground">Comprehensive solutions for educational institutions</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <div className="mt-1 rounded-full bg-primary/10 p-1">
                <GraduationCap className="h-4 w-4 text-primary" />
              </div>
              <div>
                <h4 className="font-medium">Enhanced Learning</h4>
                <p className="text-sm text-muted-foreground">Improved practical learning experiences</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Contact Us
          </CardTitle>
          <CardDescription>Get in Touch with Our Team</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            Have questions, suggestions, or feedback? We'd love to hear from you! Reach out to us at:
          </p>
          <div className="flex items-center justify-center space-x-2">
            <Avatar className="h-8 w-8">
              <AvatarImage src="/logo.png" alt="RemoteLabs" />
              <AvatarFallback>RL</AvatarFallback>
            </Avatar>
            <a 
              href="mailto:remotelabstecnocampus@gmail.com" 
              className="text-primary hover:text-primary/80 font-medium"
            >
              remotelabstecnocampus@gmail.com
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AboutUs; 