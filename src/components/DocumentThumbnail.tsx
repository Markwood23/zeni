import React from 'react';
import { View, StyleSheet, Image, DimensionValue } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { borderRadius } from '../constants/theme';

type DocumentType = 'scanned' | 'uploaded' | 'edited' | 'shared' | 'converted' | 'created';
type ThumbnailSize = 'small' | 'medium' | 'large';

interface DocumentThumbnailProps {
  type?: DocumentType;
  thumbnailPath?: string;
  size?: ThumbnailSize;
  iconColor?: string;
}

const getDocumentIcon = (type: DocumentType): keyof typeof Ionicons.glyphMap => {
  switch (type) {
    case 'scanned':
      return 'scan';
    case 'uploaded':
      return 'cloud-upload';
    case 'edited':
      return 'create';
    case 'shared':
      return 'send';
    case 'converted':
      return 'swap-horizontal';
    case 'created':
      return 'document-text';
    default:
      return 'document-text';
  }
};

const getSizeConfig = (size: ThumbnailSize) => {
  switch (size) {
    case 'small':
      return {
        container: { width: 56, height: 72 },
        inner: { width: 44, height: 56 },
        iconSize: 12,
        lineCount: 3,
        lineHeight: 3,
        lineGap: 4,
      };
    case 'medium':
      return {
        container: { width: 64, height: 80 },
        inner: { width: 52, height: 64 },
        iconSize: 14,
        lineCount: 4,
        lineHeight: 3,
        lineGap: 5,
      };
    case 'large':
      return {
        container: { width: 80, height: 100 },
        inner: { width: 64, height: 80 },
        iconSize: 18,
        lineCount: 5,
        lineHeight: 4,
        lineGap: 6,
      };
    default:
      return {
        container: { width: 64, height: 80 },
        inner: { width: 52, height: 64 },
        iconSize: 14,
        lineCount: 4,
        lineHeight: 3,
        lineGap: 5,
      };
  }
};

// Consistent line widths for placeholder
const LINE_WIDTHS: DimensionValue[] = ['80%', '95%', '65%', '88%', '72%'];

export default function DocumentThumbnail({ 
  type = 'created', 
  thumbnailPath, 
  size = 'medium',
  iconColor,
}: DocumentThumbnailProps) {
  const { colors, isDark } = useTheme();
  const config = getSizeConfig(size);

  // If we have an actual thumbnail image, show it
  if (thumbnailPath) {
    return (
      <View style={[
        styles.container, 
        config.container,
        { backgroundColor: colors.surfaceSecondary }
      ]}>
        <Image 
          source={{ uri: thumbnailPath }} 
          style={styles.image}
          resizeMode="cover"
        />
      </View>
    );
  }

  // Otherwise, show placeholder
  const icon = getDocumentIcon(type);
  const finalIconColor = iconColor || colors.textTertiary;
  
  return (
    <View style={[
      styles.container, 
      config.container,
      { backgroundColor: colors.surfaceSecondary }
    ]}>
      <View style={[
        styles.inner, 
        config.inner,
        { backgroundColor: isDark ? colors.surface : '#FFFFFF' }
      ]}>
        {/* Document header with icon */}
        <View style={styles.header}>
          <Ionicons name={icon} size={config.iconSize} color={finalIconColor} />
        </View>
        
        {/* Placeholder lines */}
        <View style={styles.lines}>
          {LINE_WIDTHS.slice(0, config.lineCount).map((width, index) => (
            <View
              key={index}
              style={[
                styles.line,
                { 
                  width,
                  height: config.lineHeight,
                  marginBottom: index < config.lineCount - 1 ? config.lineGap : 0,
                  backgroundColor: isDark ? colors.border : '#E5E5EA',
                }
              ]}
            />
          ))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: borderRadius.md,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  inner: {
    borderRadius: borderRadius.sm,
    padding: 8,
    justifyContent: 'flex-start',
  },
  header: {
    marginBottom: 8,
  },
  lines: {
    flex: 1,
    justifyContent: 'flex-start',
  },
  line: {
    borderRadius: 2,
  },
});
