import React, { useState } from 'react';
import { Trophy, Users, Sword } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import RewardsDashboard from './RewardsDashboard';
import CommunityHub from './CommunityHub';
import BattleSystem from './BattleSystem';
import type { User, Battle, RewardSystem } from '../types';

interface GamingHubProps {
  currentUser: User;
  rewardSystem?: RewardSystem;
  activeBattles: Battle[];
  friends: User[];
  onCreateBattle: (battle: Partial<Battle>) => void;
  onJoinBattle: (battleId: string) => void;
  onSendTrashTalk: (battleId: string, message: string) => void;
  onRefreshRewards: () => void;
}

const GamingHub: React.FC<GamingHubProps> = ({
  currentUser,
  rewardSystem,
  activeBattles,
  friends,
  onCreateBattle,
  onJoinBattle,
  onSendTrashTalk,
  onRefreshRewards,
}) => {
  const [activeTab, setActiveTab] = useState('rewards');

  return (
    <div className="flex flex-col h-full bg-gray-50 dark:bg-dark-900">
      <div className="flex-shrink-0 bg-white dark:bg-dark-800 border-b border-gray-200 dark:border-dark-200">
        <div className="px-4 py-4">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Gaming Hub
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
            Rewards, community, and battles all in one place
          </p>
        </div>
      </div>

      <div className="flex-1 overflow-hidden">
        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="h-full flex flex-col"
        >
          <TabsList className="grid w-full grid-cols-3 mx-4 mt-4">
            <TabsTrigger value="rewards" className="flex items-center gap-2">
              <Trophy className="w-4 h-4" />
              <span className="hidden sm:inline">Rewards</span>
            </TabsTrigger>
            <TabsTrigger value="community" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              <span className="hidden sm:inline">Community</span>
            </TabsTrigger>
            <TabsTrigger value="battles" className="flex items-center gap-2">
              <Sword className="w-4 h-4" />
              <span className="hidden sm:inline">Battles</span>
            </TabsTrigger>
          </TabsList>

          <div className="flex-1 overflow-y-auto">
            <TabsContent value="rewards" className="h-full mt-0 p-4">
              {rewardSystem ? (
                <RewardsDashboard
                  rewardSystem={rewardSystem}
                  onRefreshRewards={onRefreshRewards}
                />
              ) : (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center text-gray-700 dark:text-gray-300">
                    <Trophy className="w-12 h-12 mx-auto mb-4 opacity-80" />
                    <p>Loading your rewards...</p>
                  </div>
                </div>
              )}
            </TabsContent>

            <TabsContent value="community" className="h-full mt-0 p-4">
              <CommunityHub
                currentUser={currentUser}
                battles={activeBattles}
                onCreateBattle={onCreateBattle}
                onJoinBattle={onJoinBattle}
                onSendTrashTalk={onSendTrashTalk}
              />
            </TabsContent>

            <TabsContent value="battles" className="h-full mt-0 p-4">
              <BattleSystem
                currentUser={currentUser}
                friends={friends}
                activeBattles={activeBattles}
                onCreateBattle={onCreateBattle}
                onJoinBattle={onJoinBattle}
                onSendTrashTalk={onSendTrashTalk}
              />
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </div>
  );
};

export default GamingHub;
