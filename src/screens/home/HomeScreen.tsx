import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  TextInput,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { spacing, borderRadius, typography, shadows } from '../../constants/theme';
import { useTheme } from '../../context/ThemeContext';
import { HomeStackParamList, DocumentsStackParamList, Document } from '../../types';
import { useUserStore, useDocumentsStore, useNotificationsStore } from '../../store';
import { CompositeNavigationProp } from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { MainTabParamList } from '../../types';
import DocumentThumbnail from '../../components/DocumentThumbnail';

type NavigationProp = CompositeNavigationProp<
  NativeStackNavigationProp<HomeStackParamList, 'HomeScreen'>,
  BottomTabNavigationProp<MainTabParamList>
>;

const { width } = Dimensions.get('window');
const tileWidth = (width - spacing.xxl * 2 - spacing.lg) / 2;

interface ActionTile {
  id: string;
  title: string;
  description: string;
  route: keyof HomeStackParamList;
}

const actionTiles: ActionTile[] = [
  {
    id: 'scan',
    title: 'Scan',
    description: 'Documents, ID cards...',
    route: 'Scan',
  },
  {
    id: 'edit',
    title: 'Edit',
    description: 'Sign, add text, mark...',
    route: 'Edit',
  },
  {
    id: 'convert',
    title: 'Convert',
    description: 'PDF, DOCX, JPG, TX...',
    route: 'Convert',
  },
  {
    id: 'ask-ai',
    title: 'Ask AI',
    description: 'Summarize, finish wri...',
    route: 'AskAI',
  },
];

// Get the appropriate Ionicon name based on tile id
const getTileIcon = (id: string): keyof typeof Ionicons.glyphMap => {
  switch (id) {
    case 'scan':
      return 'scan';
    case 'edit':
      return 'create';
    case 'convert':
      return 'swap-horizontal';
    case 'ask-ai':
      return 'sparkles';
    default:
      return 'document';
  }
};

// Get distinct color for each feature icon - uses theme colors (dynamic)
const getIconColor = (id: string, colors: any): string => {
  switch (id) {
    case 'scan':
      return colors.scanIcon;
    case 'edit':
      return colors.editIcon;
    case 'convert':
      return colors.convertIcon;
    case 'ask-ai':
      return colors.askAiIcon;
    default:
      return colors.primary;
  }
};

// Get subtle background color for each icon
const getIconBgColor = (id: string, colors: any): string => {
  const color = getIconColor(id, colors);
  return `${color}15`; // 15 is ~8% opacity in hex
};

export default function HomeScreen() {
  const navigation = useNavigation<NavigationProp>();
  const { user } = useUserStore();
  const { documents } = useDocumentsStore();
  const { unreadCount } = useNotificationsStore();
  const { colors, isDark } = useTheme();
  const [searchQuery, setSearchQuery] = useState('');

  const greeting = user?.firstName ? `Hi ${user.firstName},` : 'Hi there,';
  
  // Filter recent docs based on search
  const filteredDocs = useMemo(() => {
    const docs = documents.slice(0, 6); // Get more docs for search
    if (!searchQuery.trim()) {
      return docs.slice(0, 3); // Show only 3 when not searching
    }
    const query = searchQuery.toLowerCase();
    return docs.filter((d: Document) => 
      d.name.toLowerCase().includes(query) || 
      d.type.toLowerCase().includes(query)
    );
  }, [documents, searchQuery]);

  const handleTilePress = (route: keyof HomeStackParamList) => {
    navigation.navigate(route as any);
  };

  const handleMicPress = () => {
    Alert.alert(
      'Voice Search',
      'Voice search will be available in a future update.',
      [{ text: 'OK' }]
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <TouchableOpacity 
              style={styles.helpButton}
              onPress={() => navigation.navigate('HelpSupport' as any)}
            >
              <Ionicons name="help-circle-outline" size={28} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>
          <View style={styles.headerRight}>
            <TouchableOpacity 
              style={styles.notificationButton}
              onPress={() => navigation.navigate('NotificationCenter' as any)}
            >
              <Ionicons name="notifications-outline" size={24} color={colors.textSecondary} />
              {unreadCount > 0 && (
                <View style={[styles.notificationBadge, { backgroundColor: colors.primary }]}>
                  <Text style={[styles.badgeText, { color: colors.textInverse }]}>
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* Greeting - Hide when searching */}
        {!searchQuery && (
          <View style={styles.greetingContainer}>
            <Text style={[styles.greetingName, { color: colors.textSecondary }]}>{greeting}</Text>
            <Text style={[styles.greetingQuestion, { color: colors.textPrimary }]}>How can I help{'\n'}you today?</Text>
          </View>
        )}

        {/* Action Tiles Grid - Hide when searching */}
        {!searchQuery && (
          <View style={styles.tilesContainer}>
            <View style={styles.tilesRow}>
              {actionTiles.slice(0, 2).map((tile) => (
                <TouchableOpacity
                  key={tile.id}
                  style={[styles.tile, { backgroundColor: colors.surface }]}
                  onPress={() => handleTilePress(tile.route)}
                  activeOpacity={0.7}
                >
                  <View style={[styles.tileIconContainer, { backgroundColor: getIconBgColor(tile.id, colors) }]}>
                    <Ionicons name={getTileIcon(tile.id)} size={28} color={getIconColor(tile.id, colors)} />
                  </View>
                  <Text style={[styles.tileTitle, { color: colors.textPrimary }]}>{tile.title}</Text>
                  <Text style={[styles.tileDescription, { color: colors.textTertiary }]} numberOfLines={1}>
                    {tile.description}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <View style={styles.tilesRow}>
              {actionTiles.slice(2, 4).map((tile) => (
                <TouchableOpacity
                  key={tile.id}
                  style={[styles.tile, { backgroundColor: colors.surface }]}
                  onPress={() => handleTilePress(tile.route)}
                  activeOpacity={0.7}
                >
                  <View style={[styles.tileIconContainer, { backgroundColor: getIconBgColor(tile.id, colors) }]}>
                    <Ionicons name={getTileIcon(tile.id)} size={28} color={getIconColor(tile.id, colors)} />
                  </View>
                  <Text style={[styles.tileTitle, { color: colors.textPrimary }]}>{tile.title}</Text>
                  <Text style={[styles.tileDescription, { color: colors.textTertiary }]} numberOfLines={1}>
                    {tile.description}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Search Bar */}
        <View style={[styles.searchBar, { backgroundColor: colors.surface }]}>
          <Ionicons name="search" size={20} color={colors.textTertiary} />
          <TextInput
            style={[styles.searchInput, { color: colors.textPrimary }]}
            placeholder="Search documents..."
            placeholderTextColor={colors.textTertiary}
            value={searchQuery}
            onChangeText={setSearchQuery}
            keyboardAppearance={isDark ? 'dark' : 'light'}
          />
          {searchQuery ? (
            <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.searchMic}>
              <Ionicons name="close-circle" size={20} color={colors.textTertiary} />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity onPress={handleMicPress} style={styles.searchMic}>
              <Ionicons name="mic-outline" size={20} color={colors.primary} />
            </TouchableOpacity>
          )}
        </View>

        {/* Recent Documents / Search Results */}
        {(filteredDocs.length > 0 || searchQuery) && (
          <View style={styles.recentSection}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
                {searchQuery ? `Results (${filteredDocs.length})` : 'Recent Files'}
              </Text>
              <TouchableOpacity onPress={() => navigation.navigate('AllDocuments' as any)}>
                <Text style={[styles.viewAllText, { color: colors.primary }]}>View All</Text>
              </TouchableOpacity>
            </View>
            
            {/* Empty State when no search results */}
            {searchQuery && filteredDocs.length === 0 ? (
              <View style={styles.emptyState}>
                <View style={[styles.emptyIconContainer, { backgroundColor: colors.surfaceSecondary }]}>
                  <Ionicons name="document-text-outline" size={48} color={colors.textTertiary} />
                </View>
                <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>No documents found</Text>
                <Text style={[styles.emptySubtitle, { color: colors.textTertiary }]}>
                  Try a different search term or scan a new document
                </Text>
                <TouchableOpacity 
                  style={[styles.emptyButton, { backgroundColor: colors.primary }]}
                  onPress={() => navigation.navigate('Scan')}
                >
                  <Ionicons name="scan" size={18} color={colors.textInverse} />
                  <Text style={[styles.emptyButtonText, { color: colors.textInverse }]}>Scan Document</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.recentList}
              >
                {filteredDocs.map((doc: Document) => (
                  <TouchableOpacity 
                    key={doc.id} 
                    style={[styles.recentCard, { backgroundColor: colors.surface }]}
                    onPress={() => navigation.navigate('Documents', { screen: 'DocumentView', params: { documentId: doc.id } } as any)}
                  >
                    <View style={styles.recentCardThumbnail}>
                      <DocumentThumbnail 
                        type={doc.type as any} 
                        thumbnailPath={doc.thumbnailPath}
                        size="small"
                      />
                    </View>
                    <Text style={[styles.recentCardName, { color: colors.textPrimary }]} numberOfLines={1}>
                      {doc.name}
                    </Text>
                    <Text style={[styles.recentCardMeta, { color: colors.textTertiary }]}>{doc.pagesCount} pages</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}
          </View>
        )}

        {/* Quick Actions - Fax Center - Hide when searching */}
        {!searchQuery && (
          <TouchableOpacity
            style={[styles.faxBanner, { backgroundColor: colors.surface }]}
            onPress={() => navigation.navigate('Fax' as any)}
          >
            <View style={styles.faxIcon}>
              <Ionicons name="print" size={24} color={colors.primary} />
            </View>
            <View style={styles.faxContent}>
              <Text style={[styles.faxTitle, { color: colors.textPrimary }]}>Fax Center</Text>
              <Text style={[styles.faxDescription, { color: colors.textTertiary }]}>Send documents to institutions</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.primary} />
          </TouchableOpacity>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: spacing.xxl,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.xxl,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
  },
  headerLeft: {
    flex: 1,
  },
  headerRight: {
    flex: 1,
    alignItems: 'flex-end',
  },
  helpButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
  },
  notificationButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationBadge: {
    position: 'absolute',
    top: 2,
    right: 2,
    width: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  greetingContainer: {
    paddingHorizontal: spacing.xxl,
    marginBottom: spacing.xxl,
  },
  greetingName: {
    fontSize: typography.fontSize.xl,
    marginBottom: spacing.xs,
  },
  greetingQuestion: {
    fontSize: typography.fontSize.xxxl,
    fontWeight: '700',
    lineHeight: 42,
  },
  tilesContainer: {
    paddingHorizontal: spacing.xxl,
    gap: spacing.lg,
    marginBottom: spacing.xl,
  },
  tilesRow: {
    flexDirection: 'row',
    gap: spacing.lg,
  },
  tile: {
    width: tileWidth,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    ...shadows.md,
  },
  tileIconContainer: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  tileTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  tileDescription: {
    fontSize: typography.fontSize.sm,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: spacing.xxl,
    borderRadius: borderRadius.round,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    marginBottom: spacing.xxl,
    ...shadows.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: typography.fontSize.md,
    marginLeft: spacing.md,
    paddingVertical: 0,
  },
  searchMic: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  recentSection: {
    marginBottom: spacing.xxl,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.xxl,
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: '600',
  },
  viewAllText: {
    fontSize: typography.fontSize.sm,
    fontWeight: '500',
  },
  recentList: {
    paddingHorizontal: spacing.xxl,
    gap: spacing.md,
  },
  recentCard: {
    width: 120,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginRight: spacing.md,
    ...shadows.sm,
  },
  recentCardThumbnail: {
    marginBottom: spacing.sm,
  },
  recentCardName: {
    fontSize: typography.fontSize.sm,
    fontWeight: '500',
    marginBottom: spacing.xs,
  },
  recentCardMeta: {
    fontSize: typography.fontSize.xs,
  },
  faxBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: spacing.xxl,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    ...shadows.sm,
  },
  faxIcon: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  faxContent: {
    flex: 1,
  },
  faxTitle: {
    fontSize: typography.fontSize.md,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  faxDescription: {
    fontSize: typography.fontSize.sm,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: spacing.xxl,
    paddingHorizontal: spacing.xxl,
  },
  emptyIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  emptyTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: '600',
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: typography.fontSize.md,
    textAlign: 'center',
    marginBottom: spacing.xl,
    lineHeight: 22,
  },
  emptyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.round,
    gap: spacing.sm,
  },
  emptyButtonText: {
    fontSize: typography.fontSize.md,
    fontWeight: '600',
  },
});
