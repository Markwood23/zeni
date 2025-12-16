import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Alert,
  Modal,
  TextInput,
  PanResponder,
  Dimensions,
  ScrollView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Path, Circle, Rect, Line } from 'react-native-svg';
import { spacing, borderRadius, typography } from '../../constants/theme';
import { useTheme } from '../../context/ThemeContext';
import { HomeStackParamList, EditTool } from '../../types';
import { useDocumentsStore, useActivityStore, generateId, useUserStore, useSignaturesStore, Signature } from '../../store';
import SignatureCanvas, { SignatureData } from '../../components/SignatureCanvas';
import type { Document } from '../../types';

type NavigationProp = NativeStackNavigationProp<HomeStackParamList, 'EditDocument'>;
type RouteType = RouteProp<HomeStackParamList, 'EditDocument'>;

const { width: screenWidth } = Dimensions.get('window');

interface DrawingPath {
  id: string;
  path: string;
  color: string;
  strokeWidth: number;
  type: 'pen' | 'highlighter';
}

interface TextAnnotation {
  id: string;
  text: string;
  x: number;
  y: number;
  fontSize: number;
  color: string;
}

interface ShapeAnnotation {
  id: string;
  type: 'circle' | 'rectangle' | 'line' | 'checkmark' | 'cross';
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
}

interface SignatureAnnotation {
  id: string;
  signatureData: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

const tools: { id: EditTool; icon: keyof typeof Ionicons.glyphMap; label: string }[] = [
  { id: 'select', icon: 'move-outline', label: 'Select' },
  { id: 'text', icon: 'text-outline', label: 'Text' },
  { id: 'pen', icon: 'brush-outline', label: 'Pen' },
  { id: 'highlighter', icon: 'color-fill-outline', label: 'Highlight' },
  { id: 'signature', icon: 'pencil-outline', label: 'Sign' },
  { id: 'shapes', icon: 'shapes-outline', label: 'Shapes' },
];

const penColors = ['#000000', '#FF0000', '#0066FF', '#00AA00', '#FF6600', '#9933FF'];
const highlightColors = ['#FFFF00', '#00FF00', '#FF69B4', '#00FFFF', '#FFA500'];
const shapeTypes = [
  { id: 'circle', icon: 'ellipse-outline', label: 'Circle' },
  { id: 'rectangle', icon: 'square-outline', label: 'Rectangle' },
  { id: 'line', icon: 'remove-outline', label: 'Line' },
  { id: 'checkmark', icon: 'checkmark', label: 'Check' },
  { id: 'cross', icon: 'close', label: 'Cross' },
];

export default function EditDocumentScreen() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RouteType>();
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const { documentId } = route.params;
  const { documents, addDocument } = useDocumentsStore();
  const { addActivity } = useActivityStore();
  const { user } = useUserStore();
  const { signatures } = useSignaturesStore();

  const [selectedTool, setSelectedTool] = useState<EditTool>('select');
  const [isSaving, setIsSaving] = useState(false);
  
  // Drawing state
  const [paths, setPaths] = useState<DrawingPath[]>([]);
  const [currentPath, setCurrentPath] = useState<string>('');
  const [penColor, setPenColor] = useState('#000000');
  const [highlightColor, setHighlightColor] = useState('#FFFF00');
  const [penSize, setPenSize] = useState(3);
  
  // Text state
  const [textAnnotations, setTextAnnotations] = useState<TextAnnotation[]>([]);
  const [showTextModal, setShowTextModal] = useState(false);
  const [textInput, setTextInput] = useState('');
  const [textPosition, setTextPosition] = useState({ x: 0, y: 0 });
  const [editingTextId, setEditingTextId] = useState<string | null>(null);
  
  // Shapes state
  const [shapes, setShapes] = useState<ShapeAnnotation[]>([]);
  const [selectedShape, setSelectedShape] = useState<string>('circle');
  const [shapeColor, setShapeColor] = useState('#000000');
  
  // Signature state
  const [signatureAnnotations, setSignatureAnnotations] = useState<SignatureAnnotation[]>([]);
  const [showSignatureModal, setShowSignatureModal] = useState(false);
  const [showSignaturePicker, setShowSignaturePicker] = useState(false);
  
  // Selection state
  const [selectedItem, setSelectedItem] = useState<{ type: string; id: string } | null>(null);

  const document = documents.find((d: Document) => d.id === documentId);
  
  // Pan responder for drawing
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => selectedTool === 'pen' || selectedTool === 'highlighter' || selectedTool === 'text' || selectedTool === 'shapes',
      onMoveShouldSetPanResponder: () => selectedTool === 'pen' || selectedTool === 'highlighter',
      onPanResponderGrant: (evt) => {
        const { locationX, locationY } = evt.nativeEvent;
        
        if (selectedTool === 'text') {
          setTextPosition({ x: locationX, y: locationY });
          setTextInput('');
          setEditingTextId(null);
          setShowTextModal(true);
        } else if (selectedTool === 'shapes') {
          addShape(locationX, locationY);
        } else if (selectedTool === 'pen' || selectedTool === 'highlighter') {
          setCurrentPath(`M${locationX},${locationY}`);
        }
      },
      onPanResponderMove: (evt) => {
        if (selectedTool === 'pen' || selectedTool === 'highlighter') {
          const { locationX, locationY } = evt.nativeEvent;
          setCurrentPath(prev => `${prev} L${locationX},${locationY}`);
        }
      },
      onPanResponderRelease: () => {
        if ((selectedTool === 'pen' || selectedTool === 'highlighter') && currentPath) {
          const newPath: DrawingPath = {
            id: generateId(),
            path: currentPath,
            color: selectedTool === 'pen' ? penColor : highlightColor,
            strokeWidth: selectedTool === 'pen' ? penSize : 20,
            type: selectedTool,
          };
          setPaths(prev => [...prev, newPath]);
          setCurrentPath('');
        }
      },
    })
  ).current;

  const addShape = (x: number, y: number) => {
    const newShape: ShapeAnnotation = {
      id: generateId(),
      type: selectedShape as any,
      x: x - 25,
      y: y - 25,
      width: 50,
      height: 50,
      color: shapeColor,
    };
    setShapes(prev => [...prev, newShape]);
  };

  const addTextAnnotation = () => {
    if (!textInput.trim()) {
      setShowTextModal(false);
      return;
    }
    
    if (editingTextId) {
      setTextAnnotations(prev => 
        prev.map(t => t.id === editingTextId ? { ...t, text: textInput } : t)
      );
    } else {
      const newText: TextAnnotation = {
        id: generateId(),
        text: textInput,
        x: textPosition.x,
        y: textPosition.y,
        fontSize: 16,
        color: penColor,
      };
      setTextAnnotations(prev => [...prev, newText]);
    }
    
    setShowTextModal(false);
    setTextInput('');
    setEditingTextId(null);
  };

  const addSignatureFromSaved = (signatureData: string) => {
    const newSig: SignatureAnnotation = {
      id: generateId(),
      signatureData,
      x: screenWidth / 2 - 75,
      y: 200,
      width: 150,
      height: 60,
    };
    setSignatureAnnotations(prev => [...prev, newSig]);
    setShowSignaturePicker(false);
  };

  const handleSignatureCreated = (signatureData: SignatureData) => {
    const newSig: SignatureAnnotation = {
      id: generateId(),
      signatureData: signatureData.data,
      x: screenWidth / 2 - 75,
      y: 200,
      width: 150,
      height: 60,
    };
    setSignatureAnnotations(prev => [...prev, newSig]);
    setShowSignatureModal(false);
  };

  const deleteSelected = () => {
    if (!selectedItem) return;
    
    if (selectedItem.type === 'path') {
      setPaths(prev => prev.filter(p => p.id !== selectedItem.id));
    } else if (selectedItem.type === 'text') {
      setTextAnnotations(prev => prev.filter(t => t.id !== selectedItem.id));
    } else if (selectedItem.type === 'shape') {
      setShapes(prev => prev.filter(s => s.id !== selectedItem.id));
    } else if (selectedItem.type === 'signature') {
      setSignatureAnnotations(prev => prev.filter(s => s.id !== selectedItem.id));
    }
    setSelectedItem(null);
  };

  const undo = () => {
    if (paths.length > 0) {
      setPaths(prev => prev.slice(0, -1));
    } else if (textAnnotations.length > 0) {
      setTextAnnotations(prev => prev.slice(0, -1));
    } else if (shapes.length > 0) {
      setShapes(prev => prev.slice(0, -1));
    } else if (signatureAnnotations.length > 0) {
      setSignatureAnnotations(prev => prev.slice(0, -1));
    }
  };

  const clearAll = () => {
    Alert.alert('Clear All', 'Remove all annotations?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Clear',
        style: 'destructive',
        onPress: () => {
          setPaths([]);
          setTextAnnotations([]);
          setShapes([]);
          setSignatureAnnotations([]);
          setSelectedItem(null);
        },
      },
    ]);
  };

  if (!document) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
        </View>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Document not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Create edited version
      const newDocId = generateId();
      const baseName = document.name.replace(/\.[^/.]+$/, '');
      const newDocument = {
        ...document,
        id: newDocId,
        name: `${baseName}_edited.pdf`,
        type: 'edited' as const,
        sourceDocumentId: document.id,
        annotations: {
          paths: paths.length,
          texts: textAnnotations.length,
          shapes: shapes.length,
          signatures: signatureAnnotations.length,
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      addDocument(newDocument);

      addActivity({
        id: generateId(),
        userId: user?.id || 'guest',
        type: 'edit',
        documentId: newDocId,
        title: 'Document edited',
        description: `Edited "${document.name}" with ${paths.length + textAnnotations.length + shapes.length + signatureAnnotations.length} annotations`,
        createdAt: new Date(),
      });

      Alert.alert('Success', 'Edited document saved!', [
        {
          text: 'OK',
          onPress: () => navigation.navigate('HomeScreen'),
        },
      ]);
    } catch (error) {
      Alert.alert('Error', 'Failed to save. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const hasAnnotations = paths.length > 0 || textAnnotations.length > 0 || shapes.length > 0 || signatureAnnotations.length > 0;

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="close" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {document.name}
        </Text>
        <View style={styles.headerActions}>
          {hasAnnotations && (
            <>
              <TouchableOpacity style={styles.headerButton} onPress={undo}>
                <Ionicons name="arrow-undo" size={22} color={colors.textSecondary} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.headerButton} onPress={clearAll}>
                <Ionicons name="trash-outline" size={22} color={colors.error} />
              </TouchableOpacity>
            </>
          )}
          <TouchableOpacity
            style={[styles.saveButton, isSaving && styles.buttonDisabled]}
            onPress={handleSave}
            disabled={isSaving}
          >
            <Text style={styles.saveButtonText}>
              {isSaving ? 'Saving...' : 'Save'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Document Canvas with Annotations */}
      <View style={styles.canvasContainer} {...panResponder.panHandlers}>
        {document.thumbnailPath ? (
          <Image
            source={{ uri: document.thumbnailPath }}
            style={styles.documentImage}
            resizeMode="contain"
          />
        ) : (
          <View style={styles.placeholderCanvas}>
            <View style={styles.placeholderDoc}>
              <View style={styles.placeholderDocHeader}>
                <Ionicons name="document-text" size={32} color={colors.textSecondary} />
                <Text style={styles.placeholderDocTitle} numberOfLines={1}>{document.name}</Text>
              </View>
              <View style={styles.placeholderDocBody}>
                {[...Array(10)].map((_, i) => (
                  <View key={i} style={[styles.placeholderDocLine, { width: `${60 + Math.random() * 35}%`, backgroundColor: colors.surfaceSecondary }]} />
                ))}
              </View>
              <View style={styles.placeholderDocFooter}>
                <Text style={styles.placeholderFooterText}>Page 1 of {document.pagesCount}</Text>
              </View>
            </View>
          </View>
        )}

        {/* SVG Overlay for drawings */}
        <Svg style={StyleSheet.absoluteFill}>
          {/* Existing paths */}
          {paths.map((p) => (
            <Path
              key={p.id}
              d={p.path}
              stroke={p.color}
              strokeWidth={p.strokeWidth}
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity={p.type === 'highlighter' ? 0.4 : 1}
              onPress={() => selectedTool === 'select' && setSelectedItem({ type: 'path', id: p.id })}
            />
          ))}
          {/* Current drawing path */}
          {currentPath && (
            <Path
              d={currentPath}
              stroke={selectedTool === 'pen' ? penColor : highlightColor}
              strokeWidth={selectedTool === 'pen' ? penSize : 20}
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity={selectedTool === 'highlighter' ? 0.4 : 1}
            />
          )}
          {/* Shapes */}
          {shapes.map((s) => {
            if (s.type === 'circle') {
              return (
                <Circle
                  key={s.id}
                  cx={s.x + s.width / 2}
                  cy={s.y + s.height / 2}
                  r={s.width / 2}
                  stroke={s.color}
                  strokeWidth={2}
                  fill="none"
                  onPress={() => selectedTool === 'select' && setSelectedItem({ type: 'shape', id: s.id })}
                />
              );
            } else if (s.type === 'rectangle') {
              return (
                <Rect
                  key={s.id}
                  x={s.x}
                  y={s.y}
                  width={s.width}
                  height={s.height}
                  stroke={s.color}
                  strokeWidth={2}
                  fill="none"
                  onPress={() => selectedTool === 'select' && setSelectedItem({ type: 'shape', id: s.id })}
                />
              );
            } else if (s.type === 'line') {
              return (
                <Line
                  key={s.id}
                  x1={s.x}
                  y1={s.y + s.height / 2}
                  x2={s.x + s.width}
                  y2={s.y + s.height / 2}
                  stroke={s.color}
                  strokeWidth={2}
                  onPress={() => selectedTool === 'select' && setSelectedItem({ type: 'shape', id: s.id })}
                />
              );
            } else if (s.type === 'checkmark') {
              return (
                <Path
                  key={s.id}
                  d={`M${s.x},${s.y + s.height / 2} L${s.x + s.width / 3},${s.y + s.height} L${s.x + s.width},${s.y}`}
                  stroke={s.color}
                  strokeWidth={3}
                  fill="none"
                  onPress={() => selectedTool === 'select' && setSelectedItem({ type: 'shape', id: s.id })}
                />
              );
            } else if (s.type === 'cross') {
              return (
                <React.Fragment key={s.id}>
                  <Line x1={s.x} y1={s.y} x2={s.x + s.width} y2={s.y + s.height} stroke={s.color} strokeWidth={3} />
                  <Line x1={s.x + s.width} y1={s.y} x2={s.x} y2={s.y + s.height} stroke={s.color} strokeWidth={3} />
                </React.Fragment>
              );
            }
            return null;
          })}
        </Svg>

        {/* Text Annotations */}
        {textAnnotations.map((t) => (
          <TouchableOpacity
            key={t.id}
            style={[
              styles.textAnnotation,
              { left: t.x, top: t.y },
              selectedItem?.id === t.id && styles.selectedAnnotation,
            ]}
            onPress={() => {
              if (selectedTool === 'select') {
                setSelectedItem({ type: 'text', id: t.id });
              } else if (selectedTool === 'text') {
                setEditingTextId(t.id);
                setTextInput(t.text);
                setShowTextModal(true);
              }
            }}
          >
            <Text style={[styles.annotationText, { fontSize: t.fontSize, color: t.color }]}>
              {t.text}
            </Text>
          </TouchableOpacity>
        ))}

        {/* Signature Annotations */}
        {signatureAnnotations.map((s) => (
          <TouchableOpacity
            key={s.id}
            style={[
              styles.signatureAnnotation,
              { left: s.x, top: s.y, width: s.width, height: s.height },
              selectedItem?.id === s.id && styles.selectedAnnotation,
            ]}
            onPress={() => selectedTool === 'select' && setSelectedItem({ type: 'signature', id: s.id })}
          >
            <Image
              source={{ uri: s.signatureData }}
              style={styles.signatureImage}
              resizeMode="contain"
            />
          </TouchableOpacity>
        ))}

        {/* Selection indicator */}
        {selectedItem && (
          <View style={styles.selectionActions}>
            <TouchableOpacity style={styles.deleteButton} onPress={deleteSelected}>
              <Ionicons name="trash" size={20} color="#fff" />
              <Text style={styles.deleteButtonText}>Delete</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Toolbar */}
      <View style={styles.toolbar}>
        {tools.map((tool) => (
          <TouchableOpacity
            key={tool.id}
            style={[
              styles.toolButton,
              selectedTool === tool.id && styles.toolButtonActive,
            ]}
            onPress={() => {
              setSelectedTool(tool.id);
              setSelectedItem(null);
            }}
          >
            <Ionicons
              name={tool.icon}
              size={24}
              color={selectedTool === tool.id ? colors.primary : colors.textSecondary}
            />
            <Text
              style={[
                styles.toolLabel,
                selectedTool === tool.id && styles.toolLabelActive,
              ]}
            >
              {tool.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Tool Options */}
      {selectedTool === 'text' && (
        <View style={styles.toolOptions}>
          <Ionicons name="hand-left-outline" size={20} color={colors.textSecondary} />
          <Text style={styles.toolOptionsTitle}>Tap anywhere on the document to add text</Text>
        </View>
      )}
      
      {(selectedTool === 'pen' || selectedTool === 'highlighter') && (
        <View style={styles.toolOptions}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {(selectedTool === 'pen' ? penColors : highlightColors).map((color) => (
              <TouchableOpacity
                key={color}
                style={[
                  styles.colorOption,
                  { backgroundColor: color },
                  (selectedTool === 'pen' ? penColor : highlightColor) === color && styles.colorSelected,
                ]}
                onPress={() => selectedTool === 'pen' ? setPenColor(color) : setHighlightColor(color)}
              />
            ))}
          </ScrollView>
          {selectedTool === 'pen' && (
            <View style={styles.sizeOptions}>
              {[2, 3, 5, 8].map((size) => (
                <TouchableOpacity
                  key={size}
                  style={[styles.sizeOption, penSize === size && styles.sizeSelected]}
                  onPress={() => setPenSize(size)}
                >
                  <View style={[styles.sizeDot, { width: size * 3, height: size * 3, backgroundColor: penColor }]} />
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
      )}

      {selectedTool === 'shapes' && (
        <View style={styles.toolOptions}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {shapeTypes.map((shape) => (
              <TouchableOpacity
                key={shape.id}
                style={[styles.shapeOption, selectedShape === shape.id && styles.shapeSelected]}
                onPress={() => setSelectedShape(shape.id)}
              >
                <Ionicons
                  name={shape.icon as any}
                  size={24}
                  color={selectedShape === shape.id ? colors.primary : colors.textSecondary}
                />
              </TouchableOpacity>
            ))}
          </ScrollView>
          <View style={styles.colorOptionsSmall}>
            {penColors.slice(0, 4).map((color) => (
              <TouchableOpacity
                key={color}
                style={[styles.colorOptionSmall, { backgroundColor: color }, shapeColor === color && styles.colorSelected]}
                onPress={() => setShapeColor(color)}
              />
            ))}
          </View>
        </View>
      )}

      {selectedTool === 'signature' && (
        <View style={styles.toolOptions}>
          <TouchableOpacity 
            style={styles.signatureOptionButton}
            onPress={() => signatures.length > 0 ? setShowSignaturePicker(true) : setShowSignatureModal(true)}
          >
            <Ionicons name="create-outline" size={20} color={colors.primary} />
            <Text style={styles.signatureOptionText}>
              {signatures.length > 0 ? 'Choose Signature' : 'Create Signature'}
            </Text>
          </TouchableOpacity>
          {signatures.length > 0 && (
            <TouchableOpacity 
              style={[styles.signatureOptionButton, { marginLeft: spacing.md }]}
              onPress={() => setShowSignatureModal(true)}
            >
              <Ionicons name="add" size={20} color={colors.primary} />
              <Text style={styles.signatureOptionText}>New</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Text Input Modal */}
      <Modal visible={showTextModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{editingTextId ? 'Edit Text' : 'Add Text'}</Text>
            <TextInput
              style={styles.modalInput}
              value={textInput}
              onChangeText={setTextInput}
              placeholder="Enter text..."
              placeholderTextColor={colors.textTertiary}
              multiline
              autoFocus
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => {
                  setShowTextModal(false);
                  setTextInput('');
                  setEditingTextId(null);
                }}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalAddButton} onPress={addTextAnnotation}>
                <Text style={styles.modalAddText}>{editingTextId ? 'Update' : 'Add'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Signature Picker Modal */}
      <Modal visible={showSignaturePicker} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { maxHeight: 400 }]}>
            <Text style={styles.modalTitle}>Choose Signature</Text>
            <ScrollView>
              {signatures.map((sig: Signature) => (
                <TouchableOpacity
                  key={sig.id}
                  style={styles.signaturePickerItem}
                  onPress={() => addSignatureFromSaved(sig.data)}
                >
                  <Image source={{ uri: sig.data }} style={styles.signaturePickerImage} resizeMode="contain" />
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity
              style={styles.modalCancelButton}
              onPress={() => setShowSignaturePicker(false)}
            >
              <Text style={styles.modalCancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Create Signature Modal */}
      <SignatureCanvas 
        visible={showSignatureModal} 
        onClose={() => setShowSignatureModal(false)}
        onSave={handleSignatureCreated} 
      />
    </SafeAreaView>
  );
}

const createStyles = (colors: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
    backgroundColor: colors.surface,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
  },
  headerTitle: {
    flex: 1,
    fontSize: typography.fontSize.md,
    fontWeight: '600',
    color: colors.textPrimary,
    marginHorizontal: spacing.sm,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  headerButton: {
    padding: spacing.sm,
  },
  saveButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  saveButtonText: {
    fontSize: typography.fontSize.md,
    fontWeight: '600',
    color: colors.textInverse,
  },
  canvasContainer: {
    flex: 1,
    position: 'relative',
  },
  documentImage: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  placeholderCanvas: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  placeholderDoc: {
    flex: 1,
    padding: spacing.xl,
  },
  placeholderDocHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingBottom: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
    marginBottom: spacing.xl,
  },
  placeholderDocTitle: {
    flex: 1,
    fontSize: typography.fontSize.lg,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  placeholderDocBody: {
    flex: 1,
    gap: spacing.md,
  },
  placeholderDocLine: {
    height: 12,
    borderRadius: 6,
  },
  placeholderDocFooter: {
    alignItems: 'center',
    paddingTop: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  placeholderFooterText: {
    fontSize: typography.fontSize.sm,
    color: colors.textTertiary,
  },
  textAnnotation: {
    position: 'absolute',
    padding: spacing.xs,
    backgroundColor: 'rgba(255,255,255,0.8)',
    borderRadius: borderRadius.sm,
  },
  annotationText: {
    fontWeight: '500',
  },
  signatureAnnotation: {
    position: 'absolute',
    backgroundColor: 'transparent',
  },
  signatureImage: {
    width: '100%',
    height: '100%',
  },
  selectedAnnotation: {
    borderWidth: 2,
    borderColor: colors.primary,
    borderStyle: 'dashed',
  },
  selectionActions: {
    position: 'absolute',
    bottom: spacing.xl,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.error,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.lg,
    gap: spacing.sm,
  },
  deleteButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  toolbar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  toolButton: {
    alignItems: 'center',
    padding: spacing.sm,
    borderRadius: borderRadius.md,
    minWidth: 56,
  },
  toolButtonActive: {
    backgroundColor: colors.primaryLight,
  },
  toolLabel: {
    fontSize: typography.fontSize.xs,
    color: colors.textTertiary,
    marginTop: spacing.xs,
  },
  toolLabelActive: {
    color: colors.primary,
    fontWeight: '600',
  },
  toolOptions: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
    gap: spacing.md,
  },
  toolOptionsTitle: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
  },
  colorOption: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: spacing.sm,
  },
  colorSelected: {
    borderWidth: 3,
    borderColor: colors.primary,
  },
  colorOptionsSmall: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginLeft: spacing.lg,
  },
  colorOptionSmall: {
    width: 28,
    height: 28,
    borderRadius: 14,
  },
  sizeOptions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginLeft: spacing.lg,
    paddingLeft: spacing.lg,
    borderLeftWidth: 1,
    borderLeftColor: colors.border,
  },
  sizeOption: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.surfaceSecondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sizeSelected: {
    backgroundColor: colors.primaryLight,
  },
  sizeDot: {
    borderRadius: 50,
  },
  shapeOption: {
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.sm,
    borderRadius: borderRadius.md,
    backgroundColor: colors.surfaceSecondary,
  },
  shapeSelected: {
    backgroundColor: colors.primaryLight,
  },
  signatureOptionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  signatureOptionText: {
    fontSize: typography.fontSize.md,
    color: colors.primary,
    fontWeight: '500',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: spacing.xxl,
  },
  modalContent: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
  },
  modalTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: spacing.lg,
    textAlign: 'center',
  },
  modalInput: {
    backgroundColor: colors.surfaceSecondary,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    fontSize: typography.fontSize.md,
    color: colors.textPrimary,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.lg,
  },
  modalCancelButton: {
    flex: 1,
    padding: spacing.md,
    alignItems: 'center',
  },
  modalCancelText: {
    fontSize: typography.fontSize.md,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  modalAddButton: {
    flex: 1,
    backgroundColor: colors.primary,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
  },
  modalAddText: {
    fontSize: typography.fontSize.md,
    color: colors.textInverse,
    fontWeight: '600',
  },
  signaturePickerItem: {
    height: 80,
    backgroundColor: colors.surfaceSecondary,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.md,
    padding: spacing.md,
  },
  signaturePickerImage: {
    width: '100%',
    height: '100%',
  },
  signatureModalContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
  signatureModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: typography.fontSize.lg,
    color: colors.textTertiary,
  },
});
