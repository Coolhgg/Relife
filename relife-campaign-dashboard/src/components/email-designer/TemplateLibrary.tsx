import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Search, 
  Filter, 
  Eye, 
  Copy, 
  Star, 
  Calendar,
  Users,
  BarChart3,
  Smartphone,
  Monitor,
  Clock,
  Mail,
  Zap
} from 'lucide-react';

interface EmailTemplate {
  id: string;
  name: string;
  description: string;
  category: 'welcome' | 'promotional' | 'newsletter' | 'transactional' | 'nurture' | 'retention';
  persona?: string[];
  thumbnail: string;
  previewUrl?: string;
  stats?: {
    used: number;
    avgOpenRate: number;
    avgClickRate: number;
  };
  tags: string[];
  createdAt: string;
  isCustom: boolean;
  isFavorite?: boolean;
}

interface TemplateLibraryProps {
  onSelectTemplate: (template: EmailTemplate) => void;
  onCreateNew: () => void;
  className?: string;
}

export function TemplateLibrary({ onSelectTemplate, onCreateNew, className }: TemplateLibraryProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedPersona, setSelectedPersona] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'name' | 'recent' | 'popular'>('recent');
  const [previewTemplate, setPreviewTemplate] = useState<EmailTemplate | null>(null);

  // Mock template data
  const templates: EmailTemplate[] = [
    {
      id: 'welcome-sam',
      name: 'Struggling Sam Welcome Series',
      description: 'Motivational welcome sequence for new free tier users',
      category: 'welcome',
      persona: ['struggling_sam'],
      thumbnail: 'https://via.placeholder.com/400x300/10b981/ffffff?text=Welcome+Sam',
      stats: { used: 156, avgOpenRate: 42.3, avgClickRate: 8.9 },
      tags: ['motivation', 'onboarding', 'free-tier'],
      createdAt: '2024-08-01',
      isCustom: false,
      isFavorite: true
    },
    {
      id: 'roi-ben',
      name: 'Busy Ben ROI Calculator',
      description: 'Time-saving focused campaign with ROI calculator',
      category: 'promotional',
      persona: ['busy_ben'],
      thumbnail: 'https://via.placeholder.com/400x300/3b82f6/ffffff?text=ROI+Ben',
      stats: { used: 89, avgOpenRate: 38.7, avgClickRate: 12.4 },
      tags: ['roi', 'time-saving', 'premium'],
      createdAt: '2024-07-28',
      isCustom: false
    },
    {
      id: 'premium-paula',
      name: 'Professional Paula Feature Deep-Dive',
      description: 'Advanced features showcase for power users',
      category: 'newsletter',
      persona: ['professional_paula'],
      thumbnail: 'https://via.placeholder.com/400x300/8b5cf6/ffffff?text=Premium+Paula',
      stats: { used: 234, avgOpenRate: 45.1, avgClickRate: 15.2 },
      tags: ['features', 'advanced', 'analytics'],
      createdAt: '2024-07-25',
      isCustom: false,
      isFavorite: true
    },
    {
      id: 'enterprise-emma',
      name: 'Enterprise Emma Team Demo',
      description: 'B2B focused template for enterprise prospects',
      category: 'promotional',
      persona: ['enterprise_emma'],
      thumbnail: 'https://via.placeholder.com/400x300/f59e0b/ffffff?text=Enterprise+Emma',
      stats: { used: 45, avgOpenRate: 52.8, avgClickRate: 18.9 },
      tags: ['enterprise', 'b2b', 'demo'],
      createdAt: '2024-07-22',
      isCustom: false
    },
    {
      id: 'student-sarah',
      name: 'Student Sarah Discount Campaign',
      description: 'Budget-friendly messaging with student discounts',
      category: 'promotional',
      persona: ['student_sarah'],
      thumbnail: 'https://via.placeholder.com/400x300/ef4444/ffffff?text=Student+Sarah',
      stats: { used: 167, avgOpenRate: 36.4, avgClickRate: 9.8 },
      tags: ['discount', 'student', 'budget'],
      createdAt: '2024-07-20',
      isCustom: false
    },
    {
      id: 'loyalty-larry',
      name: 'Lifetime Larry Loyalty Rewards',
      description: 'Exclusive benefits for long-term users',
      category: 'retention',
      persona: ['lifetime_larry'],
      thumbnail: 'https://via.placeholder.com/400x300/06b6d4/ffffff?text=Loyalty+Larry',
      stats: { used: 78, avgOpenRate: 58.2, avgClickRate: 22.1 },
      tags: ['loyalty', 'exclusive', 'rewards'],
      createdAt: '2024-07-18',
      isCustom: false
    },
    {
      id: 'custom-reengagement',
      name: 'Custom Re-engagement Flow',
      description: 'Personalized win-back campaign template',
      category: 'retention',
      persona: ['struggling_sam', 'busy_ben'],
      thumbnail: 'https://via.placeholder.com/400x300/64748b/ffffff?text=Re-engagement',
      stats: { used: 89, avgOpenRate: 28.7, avgClickRate: 6.2 },
      tags: ['win-back', 'custom', 'automation'],
      createdAt: '2024-07-15',
      isCustom: true
    },
    {
      id: 'generic-newsletter',
      name: 'Monthly Feature Update',
      description: 'General newsletter template for product updates',
      category: 'newsletter',
      thumbnail: 'https://via.placeholder.com/400x300/6366f1/ffffff?text=Newsletter',
      stats: { used: 312, avgOpenRate: 41.3, avgClickRate: 11.7 },
      tags: ['updates', 'features', 'monthly'],
      createdAt: '2024-07-10',
      isCustom: false,
      isFavorite: true
    }
  ];

  const categories = [
    { value: 'all', label: 'All Templates' },
    { value: 'welcome', label: 'Welcome' },
    { value: 'promotional', label: 'Promotional' },
    { value: 'newsletter', label: 'Newsletter' },
    { value: 'transactional', label: 'Transactional' },
    { value: 'nurture', label: 'Nurture' },
    { value: 'retention', label: 'Retention' }
  ];

  const personas = [
    { value: 'all', label: 'All Personas' },
    { value: 'struggling_sam', label: 'Struggling Sam' },
    { value: 'busy_ben', label: 'Busy Ben' },
    { value: 'professional_paula', label: 'Professional Paula' },
    { value: 'enterprise_emma', label: 'Enterprise Emma' },
    { value: 'student_sarah', label: 'Student Sarah' },
    { value: 'lifetime_larry', label: 'Lifetime Larry' }
  ];

  // Filter templates based on search and filters
  const filteredTemplates = templates
    .filter(template => {
      const matchesSearch = template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          template.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          template.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const matchesCategory = selectedCategory === 'all' || template.category === selectedCategory;
      
      const matchesPersona = selectedPersona === 'all' || 
                            template.persona?.includes(selectedPersona) ||
                            !template.persona; // Include templates without specific persona
      
      return matchesSearch && matchesCategory && matchesPersona;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'popular':
          return (b.stats?.used || 0) - (a.stats?.used || 0);
        case 'recent':
        default:
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
    });

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'welcome': return 'bg-green-100 text-green-800';
      case 'promotional': return 'bg-blue-100 text-blue-800';
      case 'newsletter': return 'bg-purple-100 text-purple-800';
      case 'transactional': return 'bg-gray-100 text-gray-800';
      case 'nurture': return 'bg-orange-100 text-orange-800';
      case 'retention': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPersonaColor = (persona: string) => {
    switch (persona) {
      case 'struggling_sam': return 'bg-emerald-100 text-emerald-800';
      case 'busy_ben': return 'bg-blue-100 text-blue-800';
      case 'professional_paula': return 'bg-purple-100 text-purple-800';
      case 'enterprise_emma': return 'bg-indigo-100 text-indigo-800';
      case 'student_sarah': return 'bg-amber-100 text-amber-800';
      case 'lifetime_larry': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className={className}>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                Template Library
              </CardTitle>
              <CardDescription>
                Choose from pre-built templates or create your own
              </CardDescription>
            </div>
            <Button onClick={onCreateNew}>
              <Zap className="h-4 w-4 mr-2" />
              Create New
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="templates" className="space-y-4">
            <TabsList>
              <TabsTrigger value="templates">All Templates</TabsTrigger>
              <TabsTrigger value="favorites">Favorites</TabsTrigger>
              <TabsTrigger value="custom">My Templates</TabsTrigger>
            </TabsList>

            {/* Filters */}
            <div className="flex gap-4 items-center">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search templates..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {categories.map(cat => (
                    <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={selectedPersona} onValueChange={setSelectedPersona}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {personas.map(persona => (
                    <SelectItem key={persona.value} value={persona.value}>{persona.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="recent">Recent</SelectItem>
                  <SelectItem value="popular">Popular</SelectItem>
                  <SelectItem value="name">Name</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <TabsContent value="templates" className="space-y-4">
              {/* Templates Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredTemplates.map((template) => (
                  <Card key={template.id} className="group hover:shadow-lg transition-shadow">
                    <div className="relative">
                      <img
                        src={template.thumbnail}
                        alt={template.name}
                        className="w-full h-48 object-cover rounded-t-lg"
                      />
                      {template.isFavorite && (
                        <Star className="absolute top-2 right-2 h-5 w-5 text-yellow-400 fill-current" />
                      )}
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button size="sm" variant="secondary" onClick={() => setPreviewTemplate(template)}>
                              <Eye className="h-4 w-4 mr-2" />
                              Preview
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-4xl">
                            <DialogHeader>
                              <DialogTitle>{template.name}</DialogTitle>
                              <DialogDescription>{template.description}</DialogDescription>
                            </DialogHeader>
                            <div className="grid grid-cols-2 gap-6">
                              <div>
                                <h4 className="font-medium mb-2">Desktop Preview</h4>
                                <div className="border rounded-lg p-4 bg-gray-50">
                                  <Monitor className="h-8 w-8 text-gray-400 mx-auto" />
                                  <p className="text-sm text-gray-500 text-center mt-2">Desktop preview</p>
                                </div>
                              </div>
                              <div>
                                <h4 className="font-medium mb-2">Mobile Preview</h4>
                                <div className="border rounded-lg p-4 bg-gray-50">
                                  <Smartphone className="h-8 w-8 text-gray-400 mx-auto" />
                                  <p className="text-sm text-gray-500 text-center mt-2">Mobile preview</p>
                                </div>
                              </div>
                            </div>
                            <div className="flex justify-end gap-2">
                              <Button variant="outline">
                                <Copy className="h-4 w-4 mr-2" />
                                Duplicate
                              </Button>
                              <Button onClick={() => onSelectTemplate(template)}>
                                Use Template
                              </Button>
                            </div>
                          </DialogContent>
                        </Dialog>
                        <Button size="sm" onClick={() => onSelectTemplate(template)}>
                          <Copy className="h-4 w-4 mr-2" />
                          Use
                        </Button>
                      </div>
                    </div>
                    <CardContent className="p-4">
                      <div className="space-y-3">
                        <div>
                          <h3 className="font-medium text-sm">{template.name}</h3>
                          <p className="text-xs text-gray-600">{template.description}</p>
                        </div>
                        
                        <div className="flex gap-1 flex-wrap">
                          <Badge variant="secondary" className={getCategoryColor(template.category)}>
                            {template.category}
                          </Badge>
                          {template.persona?.map(persona => (
                            <Badge key={persona} variant="outline" className={getPersonaColor(persona)}>
                              {persona.replace('_', ' ')}
                            </Badge>
                          ))}
                          {template.isCustom && (
                            <Badge variant="outline" className="border-purple-300 text-purple-700">
                              Custom
                            </Badge>
                          )}
                        </div>

                        {template.stats && (
                          <div className="grid grid-cols-3 gap-2 text-xs">
                            <div className="flex items-center gap-1">
                              <Users className="h-3 w-3 text-gray-400" />
                              <span>{template.stats.used} used</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Eye className="h-3 w-3 text-blue-500" />
                              <span>{template.stats.avgOpenRate}%</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <BarChart3 className="h-3 w-3 text-green-500" />
                              <span>{template.stats.avgClickRate}%</span>
                            </div>
                          </div>
                        )}

                        <div className="flex items-center justify-between text-xs text-gray-500">
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {new Date(template.createdAt).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {filteredTemplates.length === 0 && (
                <div className="text-center py-12">
                  <Mail className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <h3 className="font-medium text-gray-900 mb-2">No templates found</h3>
                  <p className="text-gray-500 mb-4">Try adjusting your search or filters</p>
                  <Button onClick={() => {
                    setSearchTerm('');
                    setSelectedCategory('all');
                    setSelectedPersona('all');
                  }}>
                    Clear Filters
                  </Button>
                </div>
              )}
            </TabsContent>

            <TabsContent value="favorites">
              <div className="text-center py-12">
                <Star className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <h3 className="font-medium text-gray-900 mb-2">Your Favorite Templates</h3>
                <p className="text-gray-500">
                  Templates you've starred will appear here
                </p>
              </div>
            </TabsContent>

            <TabsContent value="custom">
              <div className="text-center py-12">
                <Zap className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <h3 className="font-medium text-gray-900 mb-2">Your Custom Templates</h3>
                <p className="text-gray-500 mb-4">
                  Templates you've created will appear here
                </p>
                <Button onClick={onCreateNew}>Create Your First Template</Button>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}