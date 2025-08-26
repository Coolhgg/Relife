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
  Check,
  MoreVertical,
  Settings,
  Trash2,
  Eye,
  EyeOff,
  Filter,
  Grid,
  List,
  RefreshCw,
  Sparkles,
} from 'lucide-react';
import type { UserGiftInventory, GiftType } from '../types/reward-system';
import { rewardService } from '../services/reward-service';

interface GiftInventoryProps {
  userId: string;
  onGiftEquipped: (gift: UserGiftInventory) => void;
  onRefresh: () => Promise<void>;
}

const GiftInventory: React.FC<GiftInventoryProps> = ({
  userId,
  onGiftEquipped,
  onRefresh,
}) => {
  const [inventory, setInventory] = useState<UserGiftInventory[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<GiftType | 'all'>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState<'recent' | 'name' | 'type' | 'equipped'>(
    'recent'
  );
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedGift, setSelectedGift] = useState<UserGiftInventory | null>(null);
  const [equipLoading, setEquipLoading] = useState<string | null>(null);

  // Load user inventory
  useEffect(() => {
    loadInventory();
  }, [userId]);

  const loadInventory = async () => {
    try {
      const userGifts = await rewardService.getUserGifts(userId);
      setInventory(userGifts);
    } catch (error) {
      console.error('Failed to load inventory:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await Promise.all([loadInventory(), onRefresh()]);
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleEquipGift = async (gift: UserGiftInventory, equip: boolean = true) => {
    if (equipLoading === gift.id) return;

    setEquipLoading(gift.id);
    try {
      const success = await rewardService.equipGift(userId, gift.gift_id, equip);
      if (success) {
        await loadInventory();
        onGiftEquipped(gift);
      }
    } catch (error) {
      console.error('Failed to equip gift:', error);
    } finally {
      setEquipLoading(null);
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
      <span
        className={`px-2 py-1 text-xs rounded-full ${rarityColors[rarity as keyof typeof rarityColors] || rarityColors.common}`}
      >
        {rarity.toUpperCase()}
      </span>
    );
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const sortInventory = (items: UserGiftInventory[]) => {
    return items.sort((a, b) => {
      switch (sortBy) {
        case 'recent':
          return new Date(b.unlocked_at).getTime() - new Date(a.unlocked_at).getTime();
        case 'name':
          return (a.gift?.name || '').localeCompare(b.gift?.name || '');
        case 'type':
          return (a.gift?.type || '').localeCompare(b.gift?.type || '');
        case 'equipped':
          return Number(b.is_equipped) - Number(a.is_equipped);
        default:
          return 0;
      }
    });
  };

  const filteredInventory = sortInventory(
    inventory.filter(item => {
      const matchesCategory =
        selectedCategory === 'all' || item.gift?.type === selectedCategory;
      return matchesCategory;
    })
  );

  const giftCategories: { id: GiftType | 'all'; label: string; icon: unknown }[] = [
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

  const equippedByType = inventory.reduce(
    (acc, item) => {
      if (item.is_equipped && item.gift?.type) {
        acc[item.gift.type] = item;
      }
      return acc;
    },
    {} as Record<GiftType, UserGiftInventory>
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Loading inventory...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center">
            <Package className="mr-2 h-6 w-6 text-blue-600" />
            My Inventory
          </h2>
          <p className="text-gray-600 mt-1">
            Manage and customize your collection of {inventory.length} items
          </p>
        </div>

        <div className="flex items-center space-x-2">
          {/* View Mode Toggle */}
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1 rounded transition-colors ${
                viewMode === 'grid'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-500'
              }`}
            >
              <Grid className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-1 rounded transition-colors ${
                viewMode === 'list'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-500'
              }`}
            >
              <List className="h-4 w-4" />
            </button>
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

      {/* Currently Equipped */}
      {Object.keys(equippedByType).length > 0 && (
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-4">
          <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
            <Sparkles className="mr-2 h-5 w-5 text-blue-600" />
            Currently Equipped
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {Object.entries(equippedByType).map(([type, item]) => {
              const TypeIcon = getGiftTypeIcon(type as GiftType);
              return (
                <div
                  key={item.id}
                  className="bg-white rounded-lg p-3 border border-blue-200"
                >
                  <div className="flex items-center space-x-3">
                    <div
                      className={`p-2 rounded-lg ${getGiftTypeColor(type as GiftType)}`}
                    >
                      <TypeIcon className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 truncate">
                        {item.gift?.name}
                      </p>
                      <p className="text-sm text-gray-500 capitalize">
                        {type.replace('_', ' ')}
                      </p>
                    </div>
                    <Check className="h-4 w-4 text-green-600" />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Filters and Sorting */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex flex-wrap gap-2">
          {giftCategories.map(category => {
            const Icon = category.icon;
            const isSelected = selectedCategory === category.id;
            const count =
              category.id === 'all'
                ? inventory.length
                : inventory.filter(item => item.gift?.type === category.id).length;

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
                <span className="bg-black bg-opacity-20 px-1 rounded text-xs">
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        <select
          value={sortBy}
          onChange={e => setSortBy(e.target.value as unknown)}
          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="recent">Recently Added</option>
          <option value="name">Name A-Z</option>
          <option value="type">Type</option>
          <option value="equipped">Equipped First</option>
        </select>
      </div>

      {/* Inventory Display */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredInventory.map(item => {
            const TypeIcon = getGiftTypeIcon(item.gift?.type as GiftType);
            const isEquipped = item.is_equipped;

            return (
              <div
                key={item.id}
                className={`bg-white rounded-lg border p-4 transition-all cursor-pointer hover:shadow-md ${
                  isEquipped ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                }`}
                onClick={() => setSelectedGift(item)}
              >
                {/* Item Header */}
                <div className="flex items-start justify-between mb-3">
                  <div
                    className={`p-2 rounded-lg ${getGiftTypeColor(item.gift?.type as GiftType)}`}
                  >
                    <TypeIcon className="h-5 w-5" />
                  </div>

                  <div className="flex flex-col items-end space-y-1">
                    {getRarityBadge(item.gift?.rarity)}
                    {isEquipped && (
                      <div className="flex items-center space-x-1 text-blue-600">
                        <Check className="h-4 w-4" />
                        <span className="text-xs font-medium">EQUIPPED</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Item Info */}
                <div className="space-y-2">
                  <h3 className="font-semibold text-gray-900 line-clamp-1">
                    {item.gift?.name}
                  </h3>
                  <p className="text-sm text-gray-600 line-clamp-2">
                    {item.gift?.description}
                  </p>

                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span className="capitalize">
                      {item.gift?.type.replace('_', ' ')}
                    </span>
                    <span>Added {formatDate(item.unlocked_at)}</span>
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="mt-3 pt-3 border-t border-gray-100">
                  <button
                    onClick={e => {
                      e.stopPropagation();
                      handleEquipGift(item, !isEquipped);
                    }}
                    disabled={equipLoading === item.id}
                    className={`w-full flex items-center justify-center space-x-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                      isEquipped
                        ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        : 'bg-blue-600 text-white hover:bg-blue-700'
                    } disabled:opacity-50`}
                  >
                    {equipLoading === item.id ? (
                      <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-current"></div>
                    ) : (
                      <>
                        {isEquipped ? (
                          <EyeOff className="h-3 w-3" />
                        ) : (
                          <Eye className="h-3 w-3" />
                        )}
                        <span>{isEquipped ? 'Unequip' : 'Equip'}</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="space-y-2">
          {filteredInventory.map(item => {
            const TypeIcon = getGiftTypeIcon(item.gift?.type as GiftType);
            const isEquipped = item.is_equipped;

            return (
              <div
                key={item.id}
                className={`bg-white rounded-lg border p-4 flex items-center space-x-4 transition-all cursor-pointer hover:shadow-sm ${
                  isEquipped ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                }`}
                onClick={() => setSelectedGift(item)}
              >
                {/* Icon */}
                <div
                  className={`p-3 rounded-lg ${getGiftTypeColor(item.gift?.type as GiftType)}`}
                >
                  <TypeIcon className="h-5 w-5" />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2 mb-1">
                    <h3 className="font-semibold text-gray-900 truncate">
                      {item.gift?.name}
                    </h3>
                    {getRarityBadge(item.gift?.rarity)}
                    {isEquipped && (
                      <div className="flex items-center space-x-1 text-blue-600">
                        <Check className="h-4 w-4" />
                        <span className="text-xs font-medium">EQUIPPED</span>
                      </div>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 line-clamp-1">
                    {item.gift?.description}
                  </p>
                  <div className="flex items-center space-x-4 text-xs text-gray-500 mt-1">
                    <span className="capitalize">
                      {item.gift?.type.replace('_', ' ')}
                    </span>
                    <span>Added {formatDate(item.unlocked_at)}</span>
                    {item.payment_method && (
                      <span className="capitalize">
                        Paid with {item.payment_method}
                      </span>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center space-x-2">
                  <button
                    onClick={e => {
                      e.stopPropagation();
                      handleEquipGift(item, !isEquipped);
                    }}
                    disabled={equipLoading === item.id}
                    className={`flex items-center space-x-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                      isEquipped
                        ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        : 'bg-blue-600 text-white hover:bg-blue-700'
                    } disabled:opacity-50`}
                  >
                    {equipLoading === item.id ? (
                      <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-current"></div>
                    ) : (
                      <>
                        {isEquipped ? (
                          <EyeOff className="h-3 w-3" />
                        ) : (
                          <Eye className="h-3 w-3" />
                        )}
                        <span>{isEquipped ? 'Unequip' : 'Equip'}</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={e => {
                      e.stopPropagation();
                      setSelectedGift(item);
                    }}
                    className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <MoreVertical className="h-4 w-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Empty State */}
      {filteredInventory.length === 0 && (
        <div className="text-center py-12">
          <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {inventory.length === 0
              ? 'No items in inventory'
              : 'No items match your filters'}
          </h3>
          <p className="text-gray-600">
            {inventory.length === 0
              ? 'Visit the gift catalog to unlock your first items'
              : 'Try adjusting your category filter'}
          </p>
        </div>
      )}

      {/* Gift Detail Modal */}
      {selectedGift && selectedGift.gift && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div
                    className={`p-3 rounded-lg ${getGiftTypeColor(selectedGift.gift.type)}`}
                  >
                    {React.createElement(getGiftTypeIcon(selectedGift.gift.type), {
                      className: 'h-6 w-6',
                    })}
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">
                      {selectedGift.gift.name}
                    </h3>
                    <div className="flex items-center space-x-2 mt-1">
                      {getRarityBadge(selectedGift.gift.rarity)}
                      <span className="text-sm text-gray-500 capitalize">
                        {selectedGift.gift.type.replace('_', ' ')}
                      </span>
                      {selectedGift.is_equipped && (
                        <div className="flex items-center space-x-1 text-blue-600">
                          <Check className="h-4 w-4" />
                          <span className="text-xs font-medium">EQUIPPED</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => setSelectedGift(null)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <svg
                    className="h-6 w-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>

              {/* Description */}
              <div className="mb-6">
                <p className="text-gray-700">{selectedGift.gift.description}</p>
              </div>

              {/* Purchase Info */}
              <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-2">Purchase Details</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Unlocked:</span>
                    <span className="text-gray-900">
                      {formatDate(selectedGift.unlocked_at)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Payment Method:</span>
                    <span className="text-gray-900 capitalize">
                      {selectedGift.payment_method}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Cost Paid:</span>
                    <span className="text-gray-900">
                      {selectedGift.payment_method === 'points'
                        ? `${selectedGift.cost_paid} points`
                        : `$${selectedGift.cost_paid}`}
                    </span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="space-y-3">
                <button
                  onClick={() =>
                    handleEquipGift(selectedGift, !selectedGift.is_equipped)
                  }
                  disabled={equipLoading === selectedGift.id}
                  className={`w-full flex items-center justify-center space-x-2 py-3 px-4 rounded-lg font-medium transition-colors ${
                    selectedGift.is_equipped
                      ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                  } disabled:opacity-50`}
                >
                  {equipLoading === selectedGift.id ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
                  ) : (
                    <>
                      {selectedGift.is_equipped ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                      <span>{selectedGift.is_equipped ? 'Unequip' : 'Equip'}</span>
                    </>
                  )}
                </button>

                {/* Additional metadata */}
                {selectedGift.metadata &&
                  Object.keys(selectedGift.metadata).length > 0 && (
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <h4 className="font-medium text-gray-900 mb-2 text-sm">
                        Additional Info
                      </h4>
                      <div className="space-y-1 text-xs text-gray-600">
                        {Object.entries(selectedGift.metadata).map(([key, value]) => (
                          <div key={key} className="flex justify-between">
                            <span className="capitalize">{key.replace('_', ' ')}:</span>
                            <span>{String(value)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  function formatDate(dateString: string) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  }
};

export default GiftInventory;
