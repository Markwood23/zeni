import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  TextInput,
  PanResponder,
  Dimensions,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { Svg, Path, G } from 'react-native-svg';
import { spacing, borderRadius, typography } from '../constants/theme';
import { useTheme } from '../context/ThemeContext';

const { width } = Dimensions.get('window');
const CANVAS_WIDTH = width - spacing.xxl * 2;
const CANVAS_HEIGHT = 200;

interface SignatureCanvasProps {
  visible: boolean;
  onClose: () => void;
  onSave: (signature: SignatureData) => void;
  initialTab?: 'draw' | 'type' | 'upload';
}

export interface SignatureData {
  id: string;
  type: 'drawn' | 'typed' | 'image';
  data: string; // SVG path for drawn, text for typed, URI for image
  name: string;
  createdAt: Date;
}

type TabType = 'draw' | 'type' | 'upload';

const FONT_STYLES = [
  { id: 'script', name: 'Script', fontStyle: 'italic' as const, fontWeight: '300' as const },
  { id: 'formal', name: 'Formal', fontStyle: 'normal' as const, fontWeight: '600' as const },
  { id: 'casual', name: 'Casual', fontStyle: 'normal' as const, fontWeight: '400' as const },
];

const PEN_COLORS = ['#000000', '#FFFFFF', '#1E3A8A', '#7C3AED', '#DC2626'];
const PEN_WIDTHS = [2, 3, 4, 5];

export default function SignatureCanvas({ visible, onClose, onSave, initialTab = 'draw' }: SignatureCanvasProps) {
  const { colors } = useTheme();
  const styles = createStyles(colors);

  const [activeTab, setActiveTab] = useState<TabType>(initialTab);

  // Update active tab when initialTab changes (when modal opens with different tab)
  React.useEffect(() => {
    if (visible) {
      setActiveTab(initialTab);
    }
  }, [visible, initialTab]);
  const [paths, setPaths] = useState<string[]>([]);
  const [currentPath, setCurrentPath] = useState<string>('');
  const [penColor, setPenColor] = useState('#000000');
  const [penWidth, setPenWidth] = useState(3);
  const [typedText, setTypedText] = useState('');
  const [selectedFont, setSelectedFont] = useState('script');
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [signatureName, setSignatureName] = useState('');

  // Use a ref to track the current drawing path (avoids stale closure issues)
  const currentPathRef = useRef<string>('');

  // Create panResponder with useMemo to properly handle gestures
  const panResponder = React.useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderGrant: (evt) => {
          const { locationX, locationY } = evt.nativeEvent;
          const newPath = `M${locationX.toFixed(2)},${locationY.toFixed(2)}`;
          currentPathRef.current = newPath;
          setCurrentPath(newPath);
        },
        onPanResponderMove: (evt) => {
          const { locationX, locationY } = evt.nativeEvent;
          const updatedPath = `${currentPathRef.current} L${locationX.toFixed(2)},${locationY.toFixed(2)}`;
          currentPathRef.current = updatedPath;
          setCurrentPath(updatedPath);
        },
        onPanResponderRelease: () => {
          if (currentPathRef.current) {
            const pathToAdd = currentPathRef.current;
            setPaths((prev) => [...prev, pathToAdd]);
            currentPathRef.current = '';
            setCurrentPath('');
          }
        },
      }),
    []
  );

  const handleClearCanvas = () => {
    setPaths([]);
    setCurrentPath('');
    currentPathRef.current = '';
  };

  const handleUndo = () => {
    setPaths((prev) => prev.slice(0, -1));
  };

  const handlePickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 2],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setUploadedImage(result.assets[0].uri);
    }
  };

  const handleSave = () => {
    const name = signatureName.trim() || `Signature ${new Date().toLocaleDateString()}`;
    let data = '';
    let type: SignatureData['type'] = 'drawn';

    if (activeTab === 'draw') {
      if (paths.length === 0) {
        Alert.alert('Empty Signature', 'Please draw your signature first.');
        return;
      }
      data = JSON.stringify({ paths, color: penColor, width: penWidth });
      type = 'drawn';
    } else if (activeTab === 'type') {
      if (!typedText.trim()) {
        Alert.alert('Empty Signature', 'Please type your signature first.');
        return;
      }
      data = JSON.stringify({ text: typedText, font: selectedFont });
      type = 'typed';
    } else if (activeTab === 'upload') {
      if (!uploadedImage) {
        Alert.alert('No Image', 'Please upload an image first.');
        return;
      }
      data = uploadedImage;
      type = 'image';
    }

    const signature: SignatureData = {
      id: `sig_${Date.now()}`,
      type,
      data,
      name,
      createdAt: new Date(),
    };

    onSave(signature);
    handleReset();
    onClose();
  };

  const handleReset = () => {
    setPaths([]);
    setCurrentPath('');
    setTypedText('');
    setUploadedImage(null);
    setSignatureName('');
  };

  const renderDrawTab = () => (
    <View style={styles.tabContent}>
      {/* Canvas */}
      <View style={styles.canvasContainer} {...panResponder.panHandlers}>
        <Svg width={CANVAS_WIDTH} height={CANVAS_HEIGHT} style={styles.canvas}>
          <G>
            {paths.map((path, index) => (
              <Path
                key={index}
                d={path}
                stroke={penColor}
                strokeWidth={penWidth}
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            ))}
            {currentPath && (
              <Path
                d={currentPath}
                stroke={penColor}
                strokeWidth={penWidth}
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            )}
          </G>
        </Svg>
        {paths.length === 0 && !currentPath && (
          <View style={styles.canvasPlaceholder}>
            <Text style={styles.canvasPlaceholderText}>Draw your signature here</Text>
          </View>
        )}
      </View>

      {/* Canvas Actions */}
      <View style={styles.canvasActions}>
        <TouchableOpacity style={styles.canvasActionBtn} onPress={handleUndo} disabled={paths.length === 0}>
          <Ionicons name="arrow-undo" size={20} color={paths.length > 0 ? colors.textSecondary : colors.textTertiary} />
          <Text style={[styles.canvasActionText, paths.length === 0 && { color: colors.textTertiary }]}>Undo</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.canvasActionBtn} onPress={handleClearCanvas} disabled={paths.length === 0}>
          <Ionicons name="trash-outline" size={20} color={paths.length > 0 ? colors.error : colors.textTertiary} />
          <Text style={[styles.canvasActionText, { color: paths.length > 0 ? colors.error : colors.textTertiary }]}>Clear</Text>
        </TouchableOpacity>
      </View>

      {/* Pen Options */}
      <View style={styles.penOptions}>
        <Text style={styles.optionLabel}>Color</Text>
        <View style={styles.colorOptions}>
          {PEN_COLORS.map((color) => (
            <TouchableOpacity
              key={color}
              style={[
                styles.colorOption,
                { backgroundColor: color },
                color === '#FFFFFF' && styles.whiteColorOption,
                penColor === color && styles.colorOptionSelected,
              ]}
              onPress={() => setPenColor(color)}
            >
              {penColor === color && (
                <Ionicons name="checkmark" size={14} color={color === '#FFFFFF' ? '#000000' : '#FFFFFF'} />
              )}
            </TouchableOpacity>
          ))}
        </View>

        <Text style={[styles.optionLabel, { marginTop: spacing.md }]}>Thickness</Text>
        <View style={styles.widthOptions}>
          {PEN_WIDTHS.map((w) => (
            <TouchableOpacity
              key={w}
              style={[styles.widthOption, penWidth === w && styles.widthOptionSelected]}
              onPress={() => setPenWidth(w)}
            >
              <View style={[styles.widthPreview, { height: w, backgroundColor: penColor }]} />
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </View>
  );

  const renderTypeTab = () => {
    const selectedFontStyle = FONT_STYLES.find((f) => f.id === selectedFont);
    
    return (
      <View style={styles.tabContent}>
        {/* Preview */}
        <View style={styles.typePreview}>
          <Text
            style={[
              styles.typePreviewText,
              selectedFontStyle && {
                fontStyle: selectedFontStyle.fontStyle,
                fontWeight: selectedFontStyle.fontWeight,
              },
            ]}
          >
            {typedText || 'Your Signature'}
          </Text>
        </View>

        {/* Text Input */}
        <TextInput
          style={styles.typeInput}
          placeholder="Type your name..."
          placeholderTextColor={colors.textTertiary}
          value={typedText}
          onChangeText={setTypedText}
          autoCapitalize="words"
        />

        {/* Font Selection */}
        <Text style={styles.optionLabel}>Font Style</Text>
        <View style={styles.fontOptions}>
          {FONT_STYLES.map((font) => (
            <TouchableOpacity
              key={font.id}
              style={[styles.fontOption, selectedFont === font.id && styles.fontOptionSelected]}
              onPress={() => setSelectedFont(font.id)}
            >
              <Text
                style={[
                  styles.fontOptionText,
                  { fontStyle: font.fontStyle, fontWeight: font.fontWeight },
                ]}
              >
                {font.name}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    );
  };

  const renderUploadTab = () => (
    <View style={styles.tabContent}>
      {uploadedImage ? (
        <View style={styles.uploadPreview}>
          <View style={styles.uploadedImageContainer}>
            <Ionicons name="image" size={48} color={colors.primary} />
            <Text style={styles.uploadedText}>Signature image selected</Text>
          </View>
          <TouchableOpacity style={styles.changeImageBtn} onPress={handlePickImage}>
            <Text style={styles.changeImageText}>Change Image</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <TouchableOpacity style={styles.uploadArea} onPress={handlePickImage}>
          <Ionicons name="cloud-upload-outline" size={48} color={colors.textTertiary} />
          <Text style={styles.uploadText}>Tap to upload signature image</Text>
          <Text style={styles.uploadHint}>PNG or JPG with transparent background works best</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color={colors.textPrimary} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Create Signature</Text>
            <TouchableOpacity onPress={handleSave}>
              <Text style={styles.saveBtn}>Save</Text>
            </TouchableOpacity>
          </View>

          {/* Tabs */}
          <View style={styles.tabs}>
            {[
              { id: 'draw', label: 'Draw', icon: 'brush-outline' },
              { id: 'type', label: 'Type', icon: 'text-outline' },
              { id: 'upload', label: 'Upload', icon: 'image-outline' },
            ].map((tab) => (
              <TouchableOpacity
                key={tab.id}
                style={[styles.tab, activeTab === tab.id && styles.tabActive]}
                onPress={() => setActiveTab(tab.id as TabType)}
              >
                <Ionicons
                  name={tab.icon as any}
                  size={20}
                  color={activeTab === tab.id ? colors.primary : colors.textSecondary}
                />
                <Text style={[styles.tabText, activeTab === tab.id && styles.tabTextActive]}>
                  {tab.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Tab Content */}
          {activeTab === 'draw' && renderDrawTab()}
          {activeTab === 'type' && renderTypeTab()}
          {activeTab === 'upload' && renderUploadTab()}

          {/* Signature Name */}
          <View style={styles.nameSection}>
            <Text style={styles.optionLabel}>Signature Name (optional)</Text>
            <TextInput
              style={styles.nameInput}
              placeholder="e.g., Primary Signature"
              placeholderTextColor={colors.textTertiary}
              value={signatureName}
              onChangeText={setSignatureName}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
}

const createStyles = (colors: any) =>
  StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'flex-end',
    },
    container: {
      backgroundColor: colors.surface,
      borderTopLeftRadius: borderRadius.xl,
      borderTopRightRadius: borderRadius.xl,
      paddingBottom: spacing.xxxl,
      maxHeight: '90%',
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: spacing.lg,
      borderBottomWidth: 1,
      borderBottomColor: colors.borderLight,
    },
    headerTitle: {
      fontSize: typography.fontSize.lg,
      fontWeight: '600',
      color: colors.textPrimary,
    },
    saveBtn: {
      fontSize: typography.fontSize.md,
      fontWeight: '600',
      color: colors.primary,
    },
    tabs: {
      flexDirection: 'row',
      borderBottomWidth: 1,
      borderBottomColor: colors.borderLight,
    },
    tab: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: spacing.md,
      gap: spacing.xs,
    },
    tabActive: {
      borderBottomWidth: 2,
      borderBottomColor: colors.primary,
    },
    tabText: {
      fontSize: typography.fontSize.sm,
      color: colors.textSecondary,
      fontWeight: '500',
    },
    tabTextActive: {
      color: colors.primary,
    },
    tabContent: {
      padding: spacing.lg,
    },
    // Draw tab
    canvasContainer: {
      width: CANVAS_WIDTH,
      height: CANVAS_HEIGHT,
      backgroundColor: colors.background,
      borderRadius: borderRadius.md,
      borderWidth: 2,
      borderColor: colors.border,
      borderStyle: 'dashed',
      overflow: 'hidden',
    },
    canvas: {
      backgroundColor: 'transparent',
    },
    canvasPlaceholder: {
      ...StyleSheet.absoluteFillObject,
      justifyContent: 'center',
      alignItems: 'center',
    },
    canvasPlaceholderText: {
      fontSize: typography.fontSize.md,
      color: colors.textTertiary,
    },
    canvasActions: {
      flexDirection: 'row',
      justifyContent: 'center',
      gap: spacing.xxl,
      marginTop: spacing.md,
    },
    canvasActionBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
      padding: spacing.sm,
    },
    canvasActionText: {
      fontSize: typography.fontSize.sm,
      color: colors.textSecondary,
    },
    penOptions: {
      marginTop: spacing.lg,
    },
    optionLabel: {
      fontSize: typography.fontSize.sm,
      fontWeight: '600',
      color: colors.textSecondary,
      marginBottom: spacing.sm,
    },
    colorOptions: {
      flexDirection: 'row',
      gap: spacing.md,
    },
    colorOption: {
      width: 36,
      height: 36,
      borderRadius: 18,
      justifyContent: 'center',
      alignItems: 'center',
    },
    whiteColorOption: {
      borderWidth: 1,
      borderColor: colors.border,
    },
    colorOptionSelected: {
      borderWidth: 3,
      borderColor: colors.textPrimary,
    },
    widthOptions: {
      flexDirection: 'row',
      gap: spacing.md,
    },
    widthOption: {
      width: 48,
      height: 36,
      borderRadius: borderRadius.sm,
      backgroundColor: colors.surfaceSecondary,
      justifyContent: 'center',
      alignItems: 'center',
    },
    widthOptionSelected: {
      borderWidth: 2,
      borderColor: colors.primary,
    },
    widthPreview: {
      width: 30,
      borderRadius: 2,
    },
    // Type tab
    typePreview: {
      height: 100,
      backgroundColor: colors.background,
      borderRadius: borderRadius.md,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: spacing.lg,
      borderWidth: 1,
      borderColor: colors.border,
    },
    typePreviewText: {
      fontSize: 36,
      color: colors.textPrimary,
    },
    typeInput: {
      backgroundColor: colors.surfaceSecondary,
      borderRadius: borderRadius.md,
      padding: spacing.md,
      fontSize: typography.fontSize.lg,
      color: colors.textPrimary,
      marginBottom: spacing.lg,
    },
    fontOptions: {
      flexDirection: 'row',
      gap: spacing.md,
    },
    fontOption: {
      flex: 1,
      paddingVertical: spacing.md,
      borderRadius: borderRadius.md,
      backgroundColor: colors.surfaceSecondary,
      alignItems: 'center',
    },
    fontOptionSelected: {
      borderWidth: 2,
      borderColor: colors.primary,
    },
    fontOptionText: {
      fontSize: typography.fontSize.md,
      color: colors.textPrimary,
    },
    // Upload tab
    uploadArea: {
      height: 200,
      backgroundColor: colors.background,
      borderRadius: borderRadius.md,
      borderWidth: 2,
      borderColor: colors.border,
      borderStyle: 'dashed',
      justifyContent: 'center',
      alignItems: 'center',
      gap: spacing.sm,
    },
    uploadText: {
      fontSize: typography.fontSize.md,
      color: colors.textSecondary,
      fontWeight: '500',
    },
    uploadHint: {
      fontSize: typography.fontSize.sm,
      color: colors.textTertiary,
    },
    uploadPreview: {
      alignItems: 'center',
      gap: spacing.lg,
    },
    uploadedImageContainer: {
      width: '100%',
      height: 150,
      backgroundColor: colors.background,
      borderRadius: borderRadius.md,
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: colors.border,
    },
    uploadedText: {
      fontSize: typography.fontSize.md,
      color: colors.textSecondary,
      marginTop: spacing.sm,
    },
    changeImageBtn: {
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.sm,
      borderRadius: borderRadius.md,
      borderWidth: 1,
      borderColor: colors.primary,
    },
    changeImageText: {
      fontSize: typography.fontSize.sm,
      color: colors.primary,
      fontWeight: '500',
    },
    // Name section
    nameSection: {
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.lg,
      borderTopWidth: 1,
      borderTopColor: colors.borderLight,
    },
    nameInput: {
      backgroundColor: colors.surfaceSecondary,
      borderRadius: borderRadius.md,
      padding: spacing.md,
      fontSize: typography.fontSize.md,
      color: colors.textPrimary,
    },
  });
