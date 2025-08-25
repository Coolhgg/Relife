import React, { useState, useEffect } from 'react';
import {
  ShoppingBag,
  Package,
  History,
  Star,
  Gift,
  TrendingUp,
} from 'lucide-react';
import GiftCatalog from './GiftCatalog';
import GiftInventory from './GiftInventory';
import type { UserRewardAnalytics, UserGiftInventory } from '../types/reward-system';
import { rewardService } from '../services/reward-service';
import { useGamingAnnouncements } from '../hooks/useGamingAnnouncements';

interface GiftShopProps {
  userId: string;
  onGiftAction?: (action: 'purchased' | 'equipped', gift: UserGiftInventory) => void;
}

const GiftShop: React.FC<GiftShopProps> = ({
  userId,
  onGiftAction,
}) => {
  const [selectedTab, setSelectedTab] = useState<'catalog' | 'inventory'>('catalog');
  const [userAnalytics, setUserAnalytics] = useState<UserRewardAnalytics | null>(null);
  const [inventoryCount, setInventoryCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  // Gaming announcements for purchases
  const { announceRewardEvent } = useGamingAnnouncements();

  // Load user data
  useEffect(() => {
    loadUserData();
  }, [userId]);

  const loadUserData = async () => {
    try {
      const [analytics, inventory] = await Promise.all([
        rewardService.getUserAnalytics(userId),
        rewardService.getUserGifts(userId),
      ]);

      setUserAnalytics(analytics);
      setInventoryCount(inventory.length);
    } catch (error) {
      console.error('Failed to load user data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGiftPurchased = (gift: UserGiftInventory) => {
    // Update inventory count
    setInventoryCount(prev => prev + 1);
    
    // Announce purchase
    announceRewardEvent({
      type: 'gift',
      customMessage: `New ${gift.gift?.type?.replace('_', ' ')} unlocked: ${gift.gift?.name}!`,
      priority: 'assertive',
    });

    // Refresh analytics
    loadUserData();

    // Notify parent
    onGiftAction?.('purchased', gift);
  };

  const handleGiftEquipped = (gift: UserGiftInventory) => {
    // Announce equipment change
    announceRewardEvent({
      type: 'customization',
      customMessage: `${gift.gift?.name} ${gift.is_equipped ? 'equipped' : 'unequipped'}!`,
      priority: 'polite',
    });

    // Notify parent
    onGiftAction?.('equipped', gift);
  };

  const getTabStats = () => {
    const equippedCount = inventoryCount; // Would calculate equipped items in real implementation
    
    return {
      catalog: {
        count: '100+', // Would get actual count from API
        label: 'items available',
      },
      inventory: {
        count: inventoryCount,
        label: inventoryCount === 1 ? 'item owned' : 'items owned',
      },
    };
  };

  const tabStats = getTabStats();

  const tabs = [
    {
      id: 'catalog' as const,
      label: 'Catalog',
      icon: ShoppingBag,
      count: tabStats.catalog.count,
      description: tabStats.catalog.label,
    },
    {
      id: 'inventory' as const,
      label: 'My Items',
      icon: Package,
      count: tabStats.inventory.count,
      description: tabStats.inventory.label,
    },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Loading gift shop...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center">
            <Gift className="mr-3 h-8 w-8 text-blue-600" />
            Gift Shop
          </h1>
          <p className="text-gray-600 mt-1">
            Unlock and manage customizations for your alarm experience
          </p>
        </div>

        {/* User Stats */}
        {userAnalytics && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-blue-50 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-blue-900">{userAnalytics.total_points || 0}</div>
              <div className="text-sm text-blue-700">Points Available</div>
            </div>
            <div className="bg-green-50 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-green-900">{inventoryCount}</div>
              <div className="text-sm text-green-700">Items Owned</div>
            </div>
            <div className="bg-purple-50 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-purple-900">{userAnalytics.total_rewards || 0}</div>
              <div className="text-sm text-purple-700">Achievements</div>
            </div>
          </div>
        )}
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {tabs.map(tab => {
            const Icon = tab.icon;
            const isSelected = selectedTab === tab.id;

            return (
              <button
                key={tab.id}
                onClick={() => setSelectedTab(tab.id)}
                className={`group inline-flex items-center py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  isSelected
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className={`mr-2 h-5 w-5 ${isSelected ? 'text-blue-500' : 'text-gray-400 group-hover:text-gray-500'}`} />
                <span>{tab.label}</span>
                <span className={`ml-2 py-0.5 px-2 rounded-full text-xs ${
                  isSelected ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-900'
                }`}>
                  {tab.count}
                </span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="min-h-[400px]">
        {selectedTab === 'catalog' && (
          <GiftCatalog
            userId={userId}
            userAnalytics={userAnalytics}
            onGiftPurchased={handleGiftPurchased}
            onRefresh={loadUserData}
          />
        )}

        {selectedTab === 'inventory' && (
          <GiftInventory
            userId={userId}
            onGiftEquipped={handleGiftEquipped}
            onRefresh={loadUserData}
          />
        )}
      </div>

      {/* Quick Stats */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-4">
        <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
          <TrendingUp className="mr-2 h-5 w-5 text-blue-600" />
          Your Progress
        </h3>
        
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">{userAnalytics?.total_rewards || 0}</div>
            <div className="text-sm text-gray-600">Achievements</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">{inventoryCount}</div>
            <div className="text-sm text-gray-600">Items Owned</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">{userAnalytics?.current_streak || 0}</div>
            <div className="text-sm text-gray-600">Current Streak</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">{userAnalytics?.total_points || 0}</div>
            <div className="text-sm text-gray-600">Points Available</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GiftShop;