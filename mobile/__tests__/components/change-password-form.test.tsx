import { describe, it, expect, beforeEach, mock, spyOn } from 'bun:test';
import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';
import { ChangePasswordForm } from '@/components/change-password-form';

// Mock hooks and services
mock.module('@/hooks/use-theme-colors', () => ({
  useThemeColors: () => ({
    background: '#F5F5F0',
    backgroundSecondary: '#FFFFFF',
    text: '#000000',
    textSecondary: '#444444',
    textMuted: '#999999',
    border: '#000000',
    primary: '#FF6B6B',
    primaryText: '#000000',
    error: '#FF4444',
  }),
}));

mock.module('@/services/auth', () => ({
  changePassword: mock(),
}));

const { changePassword } = require('@/services/auth');

spyOn(Alert, 'alert');

beforeEach(() => {
  changePassword.mockReset();
  (Alert.alert as any).mockReset();
});

describe('ChangePasswordForm', () => {
  const onCancel = mock();
  const onSuccess = mock();

  beforeEach(() => {
    onCancel.mockReset();
    onSuccess.mockReset();
  });

  it('renders all input fields', () => {
    const { getByPlaceholderText } = render(<ChangePasswordForm onCancel={onCancel} />);

    expect(getByPlaceholderText('settings.currentPassword')).toBeTruthy();
    expect(getByPlaceholderText('settings.newPassword')).toBeTruthy();
    expect(getByPlaceholderText('settings.confirmNewPassword')).toBeTruthy();
  });

  it('renders cancel and save buttons', () => {
    const { getByText } = render(<ChangePasswordForm onCancel={onCancel} />);

    expect(getByText('common.cancel')).toBeTruthy();
    expect(getByText('common.save')).toBeTruthy();
  });

  it('shows error when fields are empty on submit', async () => {
    const { getByText } = render(<ChangePasswordForm onCancel={onCancel} />);

    fireEvent.press(getByText('common.save'));

    await waitFor(() => {
      expect(getByText('auth.errors.fillAllFields')).toBeTruthy();
    });
  });

  it('shows error when new password is too short', async () => {
    const { getByPlaceholderText, getByText } = render(<ChangePasswordForm onCancel={onCancel} />);

    fireEvent.changeText(
      getByPlaceholderText('settings.currentPassword'),
      'oldpass123'
    );
    fireEvent.changeText(
      getByPlaceholderText('settings.newPassword'),
      'short'
    );
    fireEvent.changeText(
      getByPlaceholderText('settings.confirmNewPassword'),
      'short'
    );

    fireEvent.press(getByText('common.save'));

    await waitFor(() => {
      expect(getByText('auth.errors.passwordTooShort')).toBeTruthy();
    });
  });

  it('shows error when passwords do not match', async () => {
    const { getByPlaceholderText, getByText } = render(<ChangePasswordForm onCancel={onCancel} />);

    fireEvent.changeText(
      getByPlaceholderText('settings.currentPassword'),
      'oldpass123'
    );
    fireEvent.changeText(
      getByPlaceholderText('settings.newPassword'),
      'newpassword1'
    );
    fireEvent.changeText(
      getByPlaceholderText('settings.confirmNewPassword'),
      'newpassword2'
    );

    fireEvent.press(getByText('common.save'));

    await waitFor(() => {
      expect(getByText('auth.errors.passwordMismatch')).toBeTruthy();
    });
  });

  it('calls changePassword service on valid submission', async () => {
    changePassword.mockResolvedValueOnce({ success: true });

    const { getByPlaceholderText, getByText } = render(<ChangePasswordForm onCancel={onCancel} onSuccess={onSuccess} />);

    fireEvent.changeText(
      getByPlaceholderText('settings.currentPassword'),
      'oldpass123'
    );
    fireEvent.changeText(
      getByPlaceholderText('settings.newPassword'),
      'newpassword123'
    );
    fireEvent.changeText(
      getByPlaceholderText('settings.confirmNewPassword'),
      'newpassword123'
    );

    fireEvent.press(getByText('common.save'));

    await waitFor(() => {
      expect(changePassword).toHaveBeenCalledWith({
        currentPassword: 'oldpass123',
        newPassword: 'newpassword123',
      });
    });
  });

  it('shows success alert on successful password change', async () => {
    changePassword.mockResolvedValueOnce({ success: true });

    const { getByPlaceholderText, getByText } = render(<ChangePasswordForm onCancel={onCancel} onSuccess={onSuccess} />);

    fireEvent.changeText(
      getByPlaceholderText('settings.currentPassword'),
      'oldpass123'
    );
    fireEvent.changeText(
      getByPlaceholderText('settings.newPassword'),
      'newpassword123'
    );
    fireEvent.changeText(
      getByPlaceholderText('settings.confirmNewPassword'),
      'newpassword123'
    );

    fireEvent.press(getByText('common.save'));

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith(
        'settings.passwordChangedTitle',
        'settings.passwordChangedMessage',
        expect.any(Array)
      );
    });
  });

  it('shows error message on failed password change', async () => {
    changePassword.mockResolvedValueOnce({
      success: false,
      error: 'wrong_password',
    });

    const { getByPlaceholderText, getByText } = render(<ChangePasswordForm onCancel={onCancel} />);

    fireEvent.changeText(
      getByPlaceholderText('settings.currentPassword'),
      'wrongpass'
    );
    fireEvent.changeText(
      getByPlaceholderText('settings.newPassword'),
      'newpassword123'
    );
    fireEvent.changeText(
      getByPlaceholderText('settings.confirmNewPassword'),
      'newpassword123'
    );

    fireEvent.press(getByText('common.save'));

    await waitFor(() => {
      expect(getByText('auth.errors.wrong_password')).toBeTruthy();
    });
  });

  it('calls onCancel when cancel button is pressed', () => {
    const { getByText } = render(<ChangePasswordForm onCancel={onCancel} />);

    fireEvent.press(getByText('common.cancel'));

    expect(onCancel).toHaveBeenCalled();
  });
});
