import React, { useState, useEffect } from 'react';
import {
  Package,
  Palette,
  Music,
  User,
  Volume2,
  Image,
  Icons,
  Crown,
  Unlock,
  ShoppingCart,
  Coins,
  CreditCard,
  Star,
  Sparkles,
  Lock,
  CheckCircle2,
  Search,
  Filter,
  RefreshCw,
} from 'lucide-react';
import type { GiftCatalog, UserGiftInventory, GiftType, UserRewardAnalytics } from '../types/reward-system';
import { rewardService } from '../services/reward-service';

interface GiftCatalogProps {
  userId: string;
  userAnalytics: UserRewardAnalytics | null;
  onGiftPurchased: (gift: UserGiftInventory) => void;
  onRefresh: () => Promise<void>;
}

const GiftCatalog: React.FC<GiftCatalogProps> = ({
  userId,
  userAnalytics,
  onGiftPurchased,
  onRefresh,
}) => {
  const [gifts, setGifts] = useState<GiftCatalog[]>([]);
  const [userInventory, setUserInventory] = useState<UserGiftInventory[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<GiftType | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedGift, setSelectedGift] = useState<GiftCatalog | null>(null);
  const [purchaseLoading, setPurchaseLoading] = useState<string | null>(null);

  // Load gifts and user inventory
  useEffect(() => {
    loadGifts();
    loadUserInventory();
  }, [userId]);

  const loadGifts = async () => {
    try {
      const allGifts = await rewardService.getGifts({ isActive: true });
      setGifts(allGifts);
    } catch (error) {
      console.error('Failed to load gifts:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadUserInventory = async () => {
    try {
      const inventory = await rewardService.getUserGifts(userId);
      setUserInventory(inventory);
    } catch (error) {
      console.error('Failed to load user inventory:', error);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await Promise.all([
        loadGifts(),
        loadUserInventory(),
        onRefresh(),
      ]);
    } finally {
      setIsRefreshing(false);
    }
  };

  const handlePurchase = async (gift: GiftCatalog, paymentMethod: 'points' | 'premium') => {
    if (purchaseLoading === gift.id) return;

    setPurchaseLoading(gift.id);
    try {
      const unlockedGift = await rewardService.unlockGift(
        userId,
        gift.id,
        paymentMethod,
        { source: 'catalog', timestamp: new Date().toISOString() }
      );

      if (unlockedGift) {
        await loadUserInventory();
        onGiftPurchased(unlockedGift);
        setSelectedGift(null);
      }
    } catch (error) {
      console.error('Failed to purchase gift:', error);
    } finally {
      setPurchaseLoading(null);
    }
  };

  const getGiftTypeIcon = (type: GiftType) => {
    switch (type) {
      case 'theme':
        return Palette;
      case 'sound_pack':
        return Music;
      case 'voice_personality':
        return User;
      case 'alarm_tone':
        return Volume2;
      case 'background':
        return Image;
      case 'icon_pack':
        return Icons;
      case 'premium_trial':
        return Crown;
      case 'feature_unlock':
        return Unlock;
      default:
        return Package;
    }
  };

  const getGiftTypeColor = (type: GiftType) => {
    switch (type) {
      case 'theme':
        return 'text-purple-600 bg-purple-100 border-purple-300';
      case 'sound_pack':
        return 'text-green-600 bg-green-100 border-green-300';
      case 'voice_personality':
        return 'text-blue-600 bg-blue-100 border-blue-300';
      case 'alarm_tone':
        return 'text-orange-600 bg-orange-100 border-orange-300';
      case 'background':
        return 'text-teal-600 bg-teal-100 border-teal-300';
      case 'icon_pack':
        return 'text-pink-600 bg-pink-100 border-pink-300';
      case 'premium_trial':
        return 'text-yellow-600 bg-yellow-100 border-yellow-300';
      case 'feature_unlock':
        return 'text-indigo-600 bg-indigo-100 border-indigo-300';
      default:
        return 'text-gray-600 bg-gray-100 border-gray-300';
    }
  };

  const getRarityBadge = (rarity?: string) => {
    if (!rarity) return null;
    
    const rarityColors = {
      common: 'text-gray-600 bg-gray-100',
      rare: 'text-blue-600 bg-blue-100',
      epic: 'text-purple-600 bg-purple-100',
      legendary: 'text-yellow-600 bg-yellow-100',
    };

    return (
      <span className={`px-2 py-1 text-xs rounded-full ${rarityColors[rarity as keyof typeof rarityColors] || rarityColors.common}`}>
        {rarity.toUpperCase()}
      </span>
    );
  };

  const isGiftOwned = (giftId: string) => {
    return userInventory.some(item => item.gift_id === giftId);
  };

  const canAffordGift = (gift: GiftCatalog, paymentMethod: 'points' | 'premium') => {
    if (paymentMethod === 'points') {
      return (userAnalytics?.total_points || 0) >= (gift.cost_points || 0);
    }
    // For premium, assume user can afford (would need premium balance tracking)
    return true;
  };

  const filteredGifts = gifts.filter(gift => {
    const matchesCategory = selectedCategory === 'all' || gift.type === selectedCategory;
    const matchesSearch = searchQuery === '' || 
      gift.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      gift.description.toLowerCase().includes(searchQuery.toLowerCase());
    
    return matchesCategory && matchesSearch;
  });

  const giftCategories: { id: GiftType | 'all'; label: string; icon: any }[] = [
    { id: 'all', label: 'All Items', icon: Package },
    { id: 'theme', label: 'Themes', icon: Palette },
    { id: 'sound_pack', label: 'Sounds', icon: Music },
    { id: 'voice_personality', label: 'Voices', icon: User },
    { id: 'alarm_tone', label: 'Tones', icon: Volume2 },
    { id: 'background', label: 'Backgrounds', icon: Image },
    { id: 'icon_pack', label: 'Icons', icon: Icons },
    { id: 'premium_trial', label: 'Premium', icon: Crown },
    { id: 'feature_unlock', label: 'Features', icon: Unlock },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Loading gift catalog...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center">
            <ShoppingCart className="mr-2 h-6 w-6 text-blue-600" />
            Gift Catalog
          </h2>
          <p className="text-gray-600 mt-1">
            Customize your alarm experience with themes, sounds, and features
          </p>
        </div>

        {/* User Balance */}
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-1 bg-blue-50 px-3 py-2 rounded-lg">
            <Coins className="h-4 w-4 text-blue-600" />
            <span className="font-semibold text-blue-900">
              {userAnalytics?.total_points || 0}
            </span>
            <span className="text-blue-700 text-sm">points</span>
          </div>

          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search gifts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          {giftCategories.map(category => {
            const Icon = category.icon;
            const isSelected = selectedCategory === category.id;
            
            return (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`flex items-center space-x-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isSelected
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <Icon className="h-4 w-4" />
                <span>{category.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Gift Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredGifts.map(gift => {
          const TypeIcon = getGiftTypeIcon(gift.type);
          const isOwned = isGiftOwned(gift.id);
          const canAffordPoints = canAffordGift(gift, 'points');
          const canAffordPremium = canAffordGift(gift, 'premium');

          return (
            <div
              key={gift.id}
              className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => setSelectedGift(gift)}
            >
              {/* Gift Header */}
              <div className="flex items-start justify-between mb-3">
                <div className={`p-2 rounded-lg ${getGiftTypeColor(gift.type)}`}>
                  <TypeIcon className="h-5 w-5" />
                </div>
                
                <div className="flex flex-col items-end space-y-1">
                  {getRarityBadge(gift.rarity)}
                  {isOwned && (
                    <div className="flex items-center space-x-1 text-green-600">
                      <CheckCircle2 className="h-4 w-4" />
                      <span className="text-xs font-medium">OWNED</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Gift Info */}
              <div className="space-y-2">
                <h3 className="font-semibold text-gray-900 line-clamp-1">{gift.name}</h3>
                <p className="text-sm text-gray-600 line-clamp-2">{gift.description}</p>

                {/* Pricing */}
                <div className="flex items-center justify-between pt-2">
                  <div className="space-y-1">
                    {gift.cost_points && gift.cost_points > 0 && (
                      <div className="flex items-center space-x-1">
                        <Coins className="h-4 w-4 text-blue-600" />
                        <span className={`text-sm font-medium ${canAffordPoints ? 'text-gray-900' : 'text-red-500'}`}>
                          {gift.cost_points}
                        </span>
                      </div>
                    )}
                    {gift.cost_premium && gift.cost_premium > 0 && (
                      <div className="flex items-center space-x-1">
                        <CreditCard className="h-4 w-4 text-purple-600" />
                        <span className={`text-sm font-medium ${canAffordPremium ? 'text-gray-900' : 'text-red-500'}`}>
                          ${gift.cost_premium}
                        </span>
                      </div>
                    )}
                  </div>

                  {isOwned ? (
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                  ) : (
                    <Lock className="h-5 w-5 text-gray-400" />
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Empty State */}
      {filteredGifts.length === 0 && (
        <div className="text-center py-12">
          <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No gifts found</h3>
          <p className="text-gray-600">
            {searchQuery || selectedCategory !== 'all'
              ? 'Try adjusting your search or filters'
              : 'Check back later for new items'}
          </p>
        </div>
      )}

      {/* Gift Detail Modal */}
      {selectedGift && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className={`p-3 rounded-lg ${getGiftTypeColor(selectedGift.type)}`}>
                    {React.createElement(getGiftTypeIcon(selectedGift.type), { className: 'h-6 w-6' })}
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">{selectedGift.name}</h3>
                    <div className="flex items-center space-x-2 mt-1">
                      {getRarityBadge(selectedGift.rarity)}
                      <span className="text-sm text-gray-500 capitalize">{selectedGift.type.replace('_', ' ')}</span>
                    </div>
                  </div>
                </div>
                
                <button
                  onClick={() => setSelectedGift(null)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Description */}
              <div className="mb-6">
                <p className="text-gray-700">{selectedGift.description}</p>
              </div>

              {/* Preview */}
              {selectedGift.preview_data && (
                <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-2">Preview</h4>
                  <div className="text-sm text-gray-600">
                    {/* Render preview based on gift type */}
                    {selectedGift.type === 'theme' && (
                      <div className="flex space-x-2">
                        {Object.entries(selectedGift.preview_data as Record<string, string>).map(([color, value]) => (
                          <div key={color} className="flex flex-col items-center">
                            <div 
                              className="w-8 h-8 rounded-full border border-gray-300"
                              style={{ backgroundColor: value }}
                            />
                            <span className="text-xs mt-1 capitalize">{color}</span>
                          </div>
                        ))}
                      </div>
                    )}
                    {selectedGift.type === 'sound_pack' && (
                      <div className="space-y-1">
                        {(selectedGift.preview_data as any)?.tracks?.map((track: string, index: number) => (
                          <div key={index} className="flex items-center space-x-2">
                            <Music className="h-3 w-3 text-gray-400" />
                            <span>{track}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Requirements */}
              {selectedGift.requirements && Object.keys(selectedGift.requirements).length > 0 && (
                <div className="mb-6 p-4 bg-blue-50 rounded-lg">
                  <h4 className="font-medium text-blue-900 mb-2">Requirements</h4>
                  <ul className="text-sm text-blue-700 space-y-1">
                    {Object.entries(selectedGift.requirements).map(([req, value]) => (
                      <li key={req} className="flex items-center space-x-2">
                        <Star className="h-3 w-3" />
                        <span className="capitalize">{req.replace('_', ' ')}: {String(value)}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Purchase Options */}
              {!isGiftOwned(selectedGift.id) && (
                <div className="space-y-3">
                  {/* Points Purchase */}
                  {selectedGift.cost_points && selectedGift.cost_points > 0 && (
                    <button
                      onClick={() => handlePurchase(selectedGift, 'points')}
                      disabled={!canAffordPoints || purchaseLoading === selectedGift.id}
                      className={`w-full flex items-center justify-center space-x-2 py-3 px-4 rounded-lg font-medium transition-colors ${
                        canAffordGift(selectedGift, 'points') && purchaseLoading !== selectedGift.id
                          ? 'bg-blue-600 text-white hover:bg-blue-700'
                          : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      }`}
                    >
                      {purchaseLoading === selectedGift.id ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      ) : (
                        <>
                          <Coins className="h-4 w-4" />
                          <span>Purchase for {selectedGift.cost_points} points</span>
                        </>
                      )}
                    </button>
                  )}

                  {/* Premium Purchase */}
                  {selectedGift.cost_premium && selectedGift.cost_premium > 0 && (
                    <button
                      onClick={() => handlePurchase(selectedGift, 'premium')}
                      disabled={!canAffordPremium || purchaseLoading === selectedGift.id}
                      className={`w-full flex items-center justify-center space-x-2 py-3 px-4 rounded-lg font-medium transition-colors ${
                        canAffordGift(selectedGift, 'premium') && purchaseLoading !== selectedGift.id
                          ? 'bg-purple-600 text-white hover:bg-purple-700'
                          : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      }`}
                    >
                      {purchaseLoading === selectedGift.id ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      ) : (
                        <>
                          <CreditCard className="h-4 w-4" />
                          <span>Purchase for ${selectedGift.cost_premium}</span>
                        </>
                      )}
                    </button>
                  )}

                  {/* Insufficient Funds Message */}
                  {!canAffordGift(selectedGift, 'points') && selectedGift.cost_points && (
                    <p className="text-sm text-red-600 text-center">
                      Need {(selectedGift.cost_points || 0) - (userAnalytics?.total_points || 0)} more points
                    </p>
                  )}
                </div>
              )}

              {/* Already Owned */}
              {isGiftOwned(selectedGift.id) && (
                <div className="flex items-center justify-center space-x-2 py-3 bg-green-50 text-green-700 rounded-lg">
                  <CheckCircle2 className="h-5 w-5" />
                  <span className="font-medium">Already in your inventory</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GiftCatalog;