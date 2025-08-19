import type { Meta, StoryObj } from "@storybook/react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "../../components/ui/avatar";
import { Bell, Clock, Settings, Star, Users } from "lucide-react";

const meta: Meta<typeof Card> = {
  title: "UI/Card",
  component: Card,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "A flexible card component with header, content, and footer sections. Perfect for organizing related information.",
      },
    },
  },
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <Card className="w-[350px]">
      <CardHeader>
        <CardTitle>Card Title</CardTitle>
        <CardDescription>Card description goes here.</CardDescription>
      </CardHeader>
      <CardContent>
        <p>
          This is the card content area where you can place any information.
        </p>
      </CardContent>
    </Card>
  ),
};

export const WithFooter: Story = {
  render: () => (
    <Card className="w-[350px]">
      <CardHeader>
        <CardTitle>Notifications</CardTitle>
        <CardDescription>You have 3 unread notifications</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <Bell className="h-4 w-4" />
            <span className="text-sm">Morning alarm in 8 hours</span>
          </div>
          <div className="flex items-center space-x-2">
            <Clock className="h-4 w-4" />
            <span className="text-sm">Sleep reminder in 2 hours</span>
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <Button variant="outline" size="sm">
          Mark all read
        </Button>
      </CardFooter>
    </Card>
  ),
};

export const AlarmCard: Story = {
  render: () => (
    <Card className="w-[350px]">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Morning Alarm</CardTitle>
            <CardDescription>Every weekday at 7:00 AM</CardDescription>
          </div>
          <Badge variant="secondary">Active</Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="flex items-center space-x-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span className="text-2xl font-bold">07:00 AM</span>
          </div>
          <div className="flex flex-wrap gap-1">
            {["Mon", "Tue", "Wed", "Thu", "Fri"].map((day) => (
              <Badge key={day} variant="outline" className="text-xs">
                {day}
              </Badge>
            ))}
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="ghost" size="sm">
          <Settings className="h-4 w-4" />
        </Button>
        <Button size="sm">Edit</Button>
      </CardFooter>
    </Card>
  ),
};

export const UserProfile: Story = {
  render: () => (
    <Card className="w-[350px]">
      <CardHeader>
        <div className="flex items-center space-x-4">
          <Avatar>
            <AvatarImage src="/avatar.png" alt="User" />
            <AvatarFallback>JD</AvatarFallback>
          </Avatar>
          <div>
            <CardTitle>John Doe</CardTitle>
            <CardDescription>Premium User</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold">24</div>
            <div className="text-xs text-muted-foreground">Active Alarms</div>
          </div>
          <div>
            <div className="text-2xl font-bold">95%</div>
            <div className="text-xs text-muted-foreground">Success Rate</div>
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <Button className="w-full">View Profile</Button>
      </CardFooter>
    </Card>
  ),
};

export const FeatureCard: Story = {
  render: () => (
    <Card className="w-[350px]">
      <CardHeader>
        <div className="flex items-center space-x-2">
          <Star className="h-5 w-5 text-yellow-500" />
          <CardTitle>Premium Feature</CardTitle>
        </div>
        <CardDescription>Unlock advanced customization options</CardDescription>
      </CardHeader>
      <CardContent>
        <ul className="space-y-2 text-sm">
          <li className="flex items-center space-x-2">
            <div className="h-1.5 w-1.5 bg-primary rounded-full" />
            <span>Custom alarm themes</span>
          </li>
          <li className="flex items-center space-x-2">
            <div className="h-1.5 w-1.5 bg-primary rounded-full" />
            <span>Voice cloning technology</span>
          </li>
          <li className="flex items-center space-x-2">
            <div className="h-1.5 w-1.5 bg-primary rounded-full" />
            <span>Advanced analytics</span>
          </li>
        </ul>
      </CardContent>
      <CardFooter>
        <Button className="w-full">Upgrade Now</Button>
      </CardFooter>
    </Card>
  ),
};

export const StatsCard: Story = {
  render: () => (
    <Card className="w-[280px]">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium">Total Users</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">+2,350</div>
        <p className="text-xs text-muted-foreground">+20.1% from last month</p>
      </CardContent>
    </Card>
  ),
};

export const CardVariations: Story = {
  render: () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4 max-w-6xl">
      {/* Simple card */}
      <Card>
        <CardHeader>
          <CardTitle>Simple Card</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            A basic card with just a title and content.
          </p>
        </CardContent>
      </Card>

      {/* Card with description */}
      <Card>
        <CardHeader>
          <CardTitle>Card with Description</CardTitle>
          <CardDescription>This card has a subtitle</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Content goes here with additional context.
          </p>
        </CardContent>
      </Card>

      {/* Card with actions */}
      <Card>
        <CardHeader>
          <CardTitle>Interactive Card</CardTitle>
          <CardDescription>Card with footer actions</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            This card has interactive elements.
          </p>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="outline" size="sm">
            Cancel
          </Button>
          <Button size="sm">Confirm</Button>
        </CardFooter>
      </Card>
    </div>
  ),
  parameters: {
    layout: "fullscreen",
  },
};
