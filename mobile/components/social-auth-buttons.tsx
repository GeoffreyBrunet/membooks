/**
 * Social Authentication Buttons
 * Official Sign in with Apple + Google via expo-auth-session
 */

import { useState, useEffect } from 'react';
import { View, Text, Pressable, StyleSheet, Platform, ActivityIndicator } from 'react-native';
import { useTranslation } from 'react-i18next';
import * as AppleAuthentication from 'expo-apple-authentication';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import { Ionicons } from '@expo/vector-icons';
import { spacing } from '@/constants';
import type { Colors } from '@/constants';

// Required for web browser auth redirect
WebBrowser.maybeCompleteAuthSession();

interface SocialAuthButtonsProps {
  colors: Colors;
  onAppleAuth: (credential: AppleAuthentication.AppleAuthenticationCredential) => Promise<void>;
  onGoogleAuth: (idToken: string, user: { email: string; name: string | null }) => Promise<void>;
  isLoading?: boolean;
  setError: (error: string | null) => void;
}

export function SocialAuthButtons({
  colors,
  onAppleAuth,
  onGoogleAuth,
  isLoading = false,
  setError,
}: SocialAuthButtonsProps) {
  const { t } = useTranslation();
  const [isAppleAvailable, setIsAppleAvailable] = useState(false);
  const [isAppleLoading, setIsAppleLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  // Google Auth configuration
  const [request, response, promptAsync] = Google.useAuthRequest({
    iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
    androidClientId: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID,
    webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
  });

  // Check if Apple Sign In is available
  useEffect(() => {
    if (Platform.OS === 'ios') {
      AppleAuthentication.isAvailableAsync().then(setIsAppleAvailable);
    }
  }, []);

  // Handle Google Auth response
  useEffect(() => {
    if (response?.type === 'success') {
      const { authentication } = response;
      if (authentication?.idToken) {
        // Fetch user info from Google
        fetchGoogleUserInfo(authentication.accessToken, authentication.idToken);
      }
    } else if (response?.type === 'error') {
      setError(t('auth.errors.generic'));
      setIsGoogleLoading(false);
    } else if (response?.type === 'dismiss') {
      setIsGoogleLoading(false);
    }
  }, [response]);

  const fetchGoogleUserInfo = async (accessToken: string, idToken: string) => {
    try {
      const userInfoResponse = await fetch(
        'https://www.googleapis.com/userinfo/v2/me',
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );
      const userInfo = await userInfoResponse.json();
      await onGoogleAuth(idToken, {
        email: userInfo.email,
        name: userInfo.name || null,
      });
    } catch (error) {
      console.error('Error fetching Google user info:', error);
      setError(t('auth.errors.generic'));
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const handleAppleSignIn = async () => {
    try {
      setIsAppleLoading(true);
      setError(null);

      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });

      await onAppleAuth(credential);
    } catch (error: any) {
      if (error.code === 'ERR_REQUEST_CANCELED') {
        return;
      }
      console.error('Apple Sign-In error:', error);
      setError(t('auth.errors.generic'));
    } finally {
      setIsAppleLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      setIsGoogleLoading(true);
      setError(null);
      await promptAsync();
    } catch (error) {
      console.error('Google Sign-In error:', error);
      setError(t('auth.errors.generic'));
      setIsGoogleLoading(false);
    }
  };

  const anyLoading = isLoading || isAppleLoading || isGoogleLoading;

  return (
    <View style={styles.container}>
      {/* Divider */}
      <View style={styles.dividerContainer}>
        <View style={[styles.dividerLine, { backgroundColor: colors.borderLight }]} />
        <Text style={[styles.dividerText, { color: colors.textSecondary }]}>
          {t('auth.orContinueWith')}
        </Text>
        <View style={[styles.dividerLine, { backgroundColor: colors.borderLight }]} />
      </View>

      {/* Social buttons */}
      <View style={styles.buttonsContainer}>
        {/* Official Apple Sign In Button - iOS only */}
        {Platform.OS === 'ios' && isAppleAvailable && (
          <AppleAuthentication.AppleAuthenticationButton
            buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
            buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
            cornerRadius={8}
            style={[styles.appleButton, anyLoading && styles.buttonDisabled]}
            onPress={handleAppleSignIn}
          />
        )}

        {/* Google Sign In Button - Custom styled to match guidelines */}
        <Pressable
          style={[
            styles.googleButton,
            { borderColor: colors.border },
            anyLoading && styles.buttonDisabled,
          ]}
          onPress={handleGoogleSignIn}
          disabled={anyLoading || !request}
        >
          {isGoogleLoading ? (
            <ActivityIndicator color="#4285F4" size="small" />
          ) : (
            <>
              {/* Google "G" logo colors */}
              <View style={styles.googleIconContainer}>
                <Ionicons name="logo-google" size={20} color="#4285F4" />
              </View>
              <Text style={styles.googleButtonText}>
                Sign in with Google
              </Text>
            </>
          )}
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: spacing.lg,
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    marginHorizontal: spacing.md,
    fontSize: 14,
  },
  buttonsContainer: {
    gap: spacing.md,
    alignItems: 'center',
  },
  appleButton: {
    width: '100%',
    height: 50,
  },
  googleButton: {
    width: '100%',
    height: 50,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderRadius: 8,
    gap: spacing.sm,
  },
  googleIconContainer: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  googleButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1F1F1F',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
});
