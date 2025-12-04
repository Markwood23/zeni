import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { spacing, borderRadius, typography } from '../../constants/theme';
import { useTheme } from '../../context/ThemeContext';
import { useUserStore } from '../../store';

export default function AccountSettingsScreen() {
  const navigation = useNavigation();
  const { user, setUser } = useUserStore();
  const { colors } = useTheme();
  
  const [firstName, setFirstName] = useState(user?.firstName || '');
  const [lastName, setLastName] = useState(user?.lastName || '');
  const [email, setEmail] = useState(user?.email || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [school, setSchool] = useState(user?.school || '');
  const [level, setLevel] = useState(user?.level || '');

  const handleSave = () => {
    if (!firstName.trim()) {
      Alert.alert('Error', 'First name is required');
      return;
    }
    
    setUser({
      ...user!,
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: email.trim(),
      phone: phone.trim(),
      school: school.trim(),
      level: level.trim(),
      updatedAt: new Date(),
    });
    
    Alert.alert('Success', 'Profile updated successfully');
  };

  const handleChangePassword = () => {
    Alert.prompt(
      'Change Password',
      'Enter your new password',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Change',
          onPress: (password?: string) => {
            if (password && password.length >= 6) {
              Alert.alert('Success', 'Password changed successfully');
            } else {
              Alert.alert('Error', 'Password must be at least 6 characters');
            }
          },
        },
      ],
      'secure-text'
    );
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'Are you sure you want to delete your account? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            Alert.alert('Account Deleted', 'Your account has been deleted.');
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Account Settings</Text>
        <TouchableOpacity onPress={handleSave}>
          <Text style={[styles.saveButton, { color: colors.primary }]}>Save</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Avatar */}
        <View style={styles.avatarSection}>
          <View style={[styles.avatar, { backgroundColor: colors.primaryLight }]}>
            <Ionicons name="person" size={40} color={colors.primary} />
          </View>
          <TouchableOpacity style={[styles.changePhotoButton, { backgroundColor: colors.primary }]}>
            <Text style={[styles.changePhotoText, { color: colors.textInverse }]}>Change Photo</Text>
          </TouchableOpacity>
        </View>

        {/* Form Fields */}
        <View style={[styles.formSection, { backgroundColor: colors.surface }]}>
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>First Name</Text>
            <TextInput
              style={[styles.input, { color: colors.textPrimary, borderColor: colors.border }]}
              value={firstName}
              onChangeText={setFirstName}
              placeholder="Enter first name"
              placeholderTextColor={colors.textTertiary}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>Last Name</Text>
            <TextInput
              style={[styles.input, { color: colors.textPrimary, borderColor: colors.border }]}
              value={lastName}
              onChangeText={setLastName}
              placeholder="Enter last name"
              placeholderTextColor={colors.textTertiary}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>Email</Text>
            <TextInput
              style={[styles.input, { color: colors.textPrimary, borderColor: colors.border }]}
              value={email}
              onChangeText={setEmail}
              placeholder="Enter email"
              placeholderTextColor={colors.textTertiary}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>Phone</Text>
            <TextInput
              style={[styles.input, { color: colors.textPrimary, borderColor: colors.border }]}
              value={phone}
              onChangeText={setPhone}
              placeholder="Enter phone number"
              placeholderTextColor={colors.textTertiary}
              keyboardType="phone-pad"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>School/Institution</Text>
            <TextInput
              style={[styles.input, { color: colors.textPrimary, borderColor: colors.border }]}
              value={school}
              onChangeText={setSchool}
              placeholder="Enter school name"
              placeholderTextColor={colors.textTertiary}
            />
          </View>

          <View style={[styles.inputGroup, { borderBottomWidth: 0 }]}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>Level/Year</Text>
            <TextInput
              style={[styles.input, { color: colors.textPrimary, borderColor: colors.border }]}
              value={level}
              onChangeText={setLevel}
              placeholder="e.g., Year 2, Level 300"
              placeholderTextColor={colors.textTertiary}
            />
          </View>
        </View>

        {/* Security Section */}
        <View style={[styles.securitySection, { backgroundColor: colors.surface }]}>
          <TouchableOpacity style={styles.securityItem} onPress={handleChangePassword}>
            <View style={styles.securityIcon}>
              <Ionicons name="key-outline" size={22} color={colors.primary} />
            </View>
            <Text style={[styles.securityText, { color: colors.textPrimary }]}>Change Password</Text>
            <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} />
          </TouchableOpacity>
        </View>

        {/* Danger Zone */}
        <TouchableOpacity 
          style={[styles.deleteButton, { borderColor: colors.error + '30' }]}
          onPress={handleDeleteAccount}
        >
          <Ionicons name="trash-outline" size={22} color={colors.error} />
          <Text style={[styles.deleteText, { color: colors.error }]}>Delete Account</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  backButton: {
    padding: spacing.sm,
  },
  headerTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: '600',
  },
  saveButton: {
    fontSize: typography.fontSize.md,
    fontWeight: '600',
  },
  content: {
    padding: spacing.lg,
  },
  avatarSection: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  changePhotoButton: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.round,
  },
  changePhotoText: {
    fontSize: typography.fontSize.sm,
    fontWeight: '600',
  },
  formSection: {
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  inputGroup: {
    marginBottom: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
    paddingBottom: spacing.lg,
  },
  label: {
    fontSize: typography.fontSize.sm,
    fontWeight: '500',
    marginBottom: spacing.sm,
  },
  input: {
    fontSize: typography.fontSize.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
  },
  securitySection: {
    borderRadius: borderRadius.lg,
    marginBottom: spacing.lg,
  },
  securityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
  },
  securityIcon: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  securityText: {
    flex: 1,
    fontSize: typography.fontSize.md,
    fontWeight: '500',
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    gap: spacing.sm,
    marginTop: spacing.lg,
  },
  deleteText: {
    fontSize: typography.fontSize.md,
    fontWeight: '600',
  },
});
