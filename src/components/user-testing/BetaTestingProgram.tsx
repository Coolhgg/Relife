import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Label } from '../ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Switch } from '../ui/switch';
import { Progress } from '../ui/progress';
import {
  Users,
  Plus,
  Send,
  Calendar,
  Target,
  CheckCircle,
  XCircle,
  Clock,
  Mail,
  UserPlus,
  Settings,
  TestTube,
  Star,
  MessageSquare,
  Download,
  Upload
} from 'lucide-react';
import UserTestingService from '../../services/user-testing';

interface BetaProgram {
  id: string;
  name: string;
  description: string;
  startDate: Date;
  endDate: Date;
  status: 'draft' | 'recruiting' | 'active' | 'completed' | 'cancelled';
  targetParticipants: number;
  currentParticipants: number;
  features: string[];
  requirements: string[];
  rewards: string[];
}

interface BetaTester {
  id: string;
  name: string;
  email: string;
  joinedDate: Date;
  status: 'invited' | 'accepted' | 'active' | 'completed' | 'dropped';
  sessionCount: number;
  feedbackCount: number;
  lastActivity: Date;
  deviceInfo: string;
  programIds: string[];
}

interface BetaFeedback {
  id: string;
  programId: string;
  testerId: string;
  testerName: string;
  type: 'feature' | 'bug' | 'suggestion' | 'general';
  title: string;
  description: string;
  rating?: number;
  timestamp: Date;
  status: 'new' | 'reviewed' | 'addressed';
}

export function BetaTestingProgram() {
  const [programs, setPrograms] = useState<BetaProgram[]>([]);
  const [testers, setTesters] = useState<BetaTester[]>([]);
  const [feedback, setFeedback] = useState<BetaFeedback[]>([]);
  const [showCreateProgram, setShowCreateProgram] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [selectedProgram, setSelectedProgram] = useState<string | null>(null);
  const [newProgram, setNewProgram] = useState({
    name: '',
    description: '',
    startDate: '',
    endDate: '',
    targetParticipants: 20,
    features: [''],
    requirements: [''],
    rewards: ['']
  });
  const [inviteEmails, setInviteEmails] = useState('');

  const userTestingService = UserTestingService.getInstance();

  useEffect(() => {
    loadBetaData();
  }, []);

  const loadBetaData = () => {
    // Mock data - in real app, load from backend
    const mockPrograms: BetaProgram[] = [
      {
        id: 'beta-1',
        name: 'Smart Alarm AI Features',
        description: 'Testing new AI-powered alarm scheduling and smart wake-up features',
        startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        endDate: new Date(Date.now() + 23 * 24 * 60 * 60 * 1000),
        status: 'active',
        targetParticipants: 50,
        currentParticipants: 32,
        features: ['AI Alarm Scheduling', 'Smart Wake-up', 'Sleep Pattern Analysis'],
        requirements: ['Use app daily', 'Provide weekly feedback', 'Have iOS/Android device'],
        rewards: ['Premium access', 'Beta tester badge', 'Early feature access']
      },
      {
        id: 'beta-2',
        name: 'Voice Integration Beta',
        description: 'Testing voice commands and voice-controlled alarm management',
        startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        endDate: new Date(Date.now() + 37 * 24 * 60 * 60 * 1000),
        status: 'recruiting',
        targetParticipants: 30,
        currentParticipants: 8,
        features: ['Voice Commands', 'Voice Alarm Creation', 'Voice Settings'],
        requirements: ['Microphone access', 'Quiet testing environment', 'Provide audio feedback'],
        rewards: ['Free premium month', 'Voice feature early access']
      }
    ];

    const mockTesters: BetaTester[] = [
      {
        id: 'tester-1',
        name: 'Alice Johnson',
        email: 'alice@example.com',
        joinedDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
        status: 'active',
        sessionCount: 15,
        feedbackCount: 8,
        lastActivity: new Date(Date.now() - 2 * 60 * 60 * 1000),
        deviceInfo: 'iPhone 14 Pro, iOS 17',
        programIds: ['beta-1']
      },
      {
        id: 'tester-2',
        name: 'Bob Smith',
        email: 'bob@example.com',
        joinedDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        status: 'active',
        sessionCount: 22,
        feedbackCount: 12,
        lastActivity: new Date(Date.now() - 30 * 60 * 1000),
        deviceInfo: 'Samsung Galaxy S23, Android 13',
        programIds: ['beta-1', 'beta-2']
      }
    ];

    const mockFeedback: BetaFeedback[] = [
      {
        id: 'fb-1',
        programId: 'beta-1',
        testerId: 'tester-1',
        testerName: 'Alice Johnson',
        type: 'feature',
        title: 'AI scheduling is too aggressive',
        description: 'The AI keeps setting alarms earlier than I need. Would like more control.',
        rating: 3,
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
        status: 'new'
      },
      {
        id: 'fb-2',
        programId: 'beta-1',
        testerId: 'tester-2',
        testerName: 'Bob Smith',
        type: 'bug',
        title: 'Sleep analysis crashes on Android',
        description: 'App crashes when trying to view sleep pattern analysis',
        timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000),
        status: 'reviewed'
      }
    ];

    setPrograms(mockPrograms);
    setTesters(mockTesters);
    setFeedback(mockFeedback);
  };

  const handleCreateProgram = () => {
    if (!newProgram.name.trim()) return;

    const program: BetaProgram = {
      id: `beta-${Date.now()}`,
      name: newProgram.name,
      description: newProgram.description,
      startDate: new Date(newProgram.startDate),
      endDate: new Date(newProgram.endDate),
      status: 'draft',
      targetParticipants: newProgram.targetParticipants,
      currentParticipants: 0,
      features: newProgram.features.filter(f => f.trim()),
      requirements: newProgram.requirements.filter(r => r.trim()),
      rewards: newProgram.rewards.filter(r => r.trim())
    };

    setPrograms([...programs, program]);
    setShowCreateProgram(false);
    resetNewProgram();
  };

  const handleInviteTesters = () => {
    if (!selectedProgram || !inviteEmails.trim()) return;

    const emails = inviteEmails.split('\n').map(email => email.trim()).filter(email => email);

    // Mock sending invites
    console.log(`Sending invites to ${emails.length} testers for program ${selectedProgram}`);

    setShowInviteModal(false);
    setInviteEmails('');
    setSelectedProgram(null);
  };

  const resetNewProgram = () => {
    setNewProgram({
      name: '',
      description: '',
      startDate: '',
      endDate: '',
      targetParticipants: 20,
      features: [''],
      requirements: [''],
      rewards: ['']
    });
  };

  const updateProgramStatus = (programId: string, newStatus: BetaProgram['status']) => {
    setPrograms(programs.map(p =>
      p.id === programId ? { ...p, status: newStatus } : p
    ));
  };

  const addArrayField = (field: 'features' | 'requirements' | 'rewards') => {
    setNewProgram({
      ...newProgram,
      [field]: [...newProgram[field], '']
    });
  };

  const updateArrayField = (field: 'features' | 'requirements' | 'rewards', index: number, value: string) => {
    const newArray = [...newProgram[field]];
    newArray[index] = value;
    setNewProgram({
      ...newProgram,
      [field]: newArray
    });
  };

  const removeArrayField = (field: 'features' | 'requirements' | 'rewards', index: number) => {
    if (newProgram[field].length > 1) {
      const newArray = newProgram[field].filter((_, i) => i !== index);
      setNewProgram({
        ...newProgram,
        [field]: newArray
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'recruiting': return 'bg-blue-100 text-blue-800';
      case 'completed': return 'bg-gray-100 text-gray-800';
      case 'draft': return 'bg-yellow-100 text-yellow-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <CheckCircle className="w-4 h-4" />;
      case 'recruiting': return <UserPlus className="w-4 h-4" />;
      case 'completed': return <Target className="w-4 h-4" />;
      case 'draft': return <Settings className="w-4 h-4" />;
      case 'cancelled': return <XCircle className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Beta Testing Program</h2>
          <p className="text-gray-600 mt-1">
            Manage beta programs and coordinate with testers
          </p>
        </div>
        <Button
          onClick={() => setShowCreateProgram(true)}
          className="flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          New Beta Program
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <TestTube className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{programs.length}</p>
                <p className="text-gray-600 text-sm">Active Programs</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <Users className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{testers.length}</p>
                <p className="text-gray-600 text-sm">Beta Testers</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <MessageSquare className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{feedback.length}</p>
                <p className="text-gray-600 text-sm">Feedback Items</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="programs" className="space-y-4">
        <TabsList>
          <TabsTrigger value="programs">Programs</TabsTrigger>
          <TabsTrigger value="testers">Testers</TabsTrigger>
          <TabsTrigger value="feedback">Feedback</TabsTrigger>
        </TabsList>

        <TabsContent value="programs" className="space-y-4">
          <div className="grid gap-4">
            {programs.map((program) => (
              <Card key={program.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        {program.name}
                        <Badge className={getStatusColor(program.status)}>
                          {getStatusIcon(program.status)}
                          <span className="ml-1">{program.status}</span>
                        </Badge>
                      </CardTitle>
                      <p className="text-gray-600 mt-1">{program.description}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {program.status === 'recruiting' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedProgram(program.id);
                            setShowInviteModal(true);
                          }}
                        >
                          <Mail className="w-4 h-4 mr-1" />
                          Invite
                        </Button>
                      )}
                      {program.status === 'draft' && (
                        <Button
                          size="sm"
                          onClick={() => updateProgramStatus(program.id, 'recruiting')}
                        >
                          Start Recruiting
                        </Button>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <div className="flex items-center justify-between text-sm mb-2">
                        <span>Participants</span>
                        <span>{program.currentParticipants}/{program.targetParticipants}</span>
                      </div>
                      <Progress
                        value={(program.currentParticipants / program.targetParticipants) * 100}
                        className="h-2"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <div>
                        <h4 className="font-medium mb-2">Features</h4>
                        <ul className="space-y-1">
                          {program.features.map((feature, index) => (
                            <li key={index} className="text-gray-600">• {feature}</li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <h4 className="font-medium mb-2">Requirements</h4>
                        <ul className="space-y-1">
                          {program.requirements.map((req, index) => (
                            <li key={index} className="text-gray-600">• {req}</li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <h4 className="font-medium mb-2">Rewards</h4>
                        <ul className="space-y-1">
                          {program.rewards.map((reward, index) => (
                            <li key={index} className="text-gray-600">• {reward}</li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t text-sm text-gray-500">
                      <span>Start: {program.startDate.toLocaleDateString()}</span>
                      <span>End: {program.endDate.toLocaleDateString()}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="testers" className="space-y-4">
          <div className="grid gap-4">
            {testers.map((tester) => (
              <Card key={tester.id}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                        <span className="font-medium text-gray-600">
                          {tester.name.split(' ').map(n => n[0]).join('')}
                        </span>
                      </div>
                      <div>
                        <h3 className="font-medium">{tester.name}</h3>
                        <p className="text-gray-600 text-sm">{tester.email}</p>
                        <p className="text-gray-500 text-xs mt-1">{tester.deviceInfo}</p>
                      </div>
                    </div>
                    <Badge className={getStatusColor(tester.status)}>
                      {tester.status}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-4 gap-4 mt-4 pt-4 border-t">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-blue-600">{tester.sessionCount}</p>
                      <p className="text-xs text-gray-500">Sessions</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-green-600">{tester.feedbackCount}</p>
                      <p className="text-xs text-gray-500">Feedback</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-purple-600">{tester.programIds.length}</p>
                      <p className="text-xs text-gray-500">Programs</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-gray-600">Last Active</p>
                      <p className="text-xs text-gray-500">{tester.lastActivity.toLocaleString()}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="feedback" className="space-y-4">
          <div className="grid gap-4">
            {feedback.map((item) => (
              <Card key={item.id}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-medium">{item.title}</h3>
                      <p className="text-sm text-gray-600 mt-1">by {item.testerName}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{item.type}</Badge>
                      <Badge className={getStatusColor(item.status)}>
                        {item.status}
                      </Badge>
                      {item.rating && (
                        <div className="flex items-center gap-1">
                          <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                          <span className="text-sm">{item.rating}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <p className="text-gray-700 mb-3">{item.description}</p>

                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>Program: {programs.find(p => p.id === item.programId)?.name}</span>
                    <span>{item.timestamp.toLocaleString()}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Create Program Modal */}
      <Dialog open={showCreateProgram} onOpenChange={setShowCreateProgram}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New Beta Program</DialogTitle>
          </DialogHeader>

          <div className="space-y-6 mt-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Program Name *</Label>
                <Input
                  id="name"
                  value={newProgram.name}
                  onChange={(e) => setNewProgram({...newProgram, name: e.target.value})}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="participants">Target Participants</Label>
                <Input
                  id="participants"
                  type="number"
                  value={newProgram.targetParticipants}
                  onChange={(e) => setNewProgram({...newProgram, targetParticipants: Number(e.target.value)})}
                  className="mt-1"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={newProgram.description}
                onChange={(e) => setNewProgram({...newProgram, description: e.target.value})}
                className="mt-1"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="startDate">Start Date</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={newProgram.startDate}
                  onChange={(e) => setNewProgram({...newProgram, startDate: e.target.value})}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="endDate">End Date</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={newProgram.endDate}
                  onChange={(e) => setNewProgram({...newProgram, endDate: e.target.value})}
                  className="mt-1"
                />
              </div>
            </div>

            {(['features', 'requirements', 'rewards'] as const).map((field) => (
              <div key={field}>
                <div className="flex items-center justify-between mb-2">
                  <Label className="capitalize">{field}</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => addArrayField(field)}
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
                <div className="space-y-2">
                  {newProgram[field].map((item, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <Input
                        value={item}
                        onChange={(e) => updateArrayField(field, index, e.target.value)}
                        placeholder={`Add ${field.slice(0, -1)}...`}
                        className="flex-1"
                      />
                      {newProgram[field].length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeArrayField(field, index)}
                        >
                          <XCircle className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}

            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button variant="outline" onClick={() => setShowCreateProgram(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateProgram} disabled={!newProgram.name.trim()}>
                Create Program
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Invite Testers Modal */}
      <Dialog open={showInviteModal} onOpenChange={setShowInviteModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Invite Beta Testers</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            <div>
              <Label htmlFor="emails">Email Addresses</Label>
              <Textarea
                id="emails"
                value={inviteEmails}
                onChange={(e) => setInviteEmails(e.target.value)}
                placeholder="Enter email addresses, one per line..."
                className="mt-1"
                rows={6}
              />
              <p className="text-xs text-gray-500 mt-1">
                Enter one email address per line
              </p>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button variant="outline" onClick={() => setShowInviteModal(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleInviteTesters}
                disabled={!inviteEmails.trim()}
                className="flex items-center gap-2"
              >
                <Send className="w-4 h-4" />
                Send Invites
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default BetaTestingProgram;